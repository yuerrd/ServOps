import { NodeSSH } from 'node-ssh';
import { readFileSync } from 'fs';
import { SSHConfig, LogEntry } from '../types';

export class SSHService {
  private ssh: NodeSSH;
  private executionTimeout: number = 300000; // 5分钟超时

  constructor() {
    this.ssh = new NodeSSH();
  }

  async connect(config: SSHConfig): Promise<void> {
    try {
      const connectionConfig: any = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: 30000,
        keepaliveInterval: 1000, // 每秒发送一次 keepalive
        keepaliveCountMax: 5,
      };

      // 优先使用私钥认证
      if (config.privateKey) {
        connectionConfig.privateKey = config.privateKey;
        if (config.passphrase) {
          connectionConfig.passphrase = config.passphrase;
        }
      } else if (config.password) {
        // 使用密码认证
        connectionConfig.password = config.password;
      } else {
        throw new Error('需要提供密码或私钥进行SSH认证');
      }

      await this.ssh.connect(connectionConfig);
    } catch (error) {
      throw new Error(`SSH连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async testConnection(config: SSHConfig): Promise<{ success: boolean; message: string }> {
    try {
      await this.connect(config);
      await this.ssh.execCommand('echo "connection test"');
      this.disconnect();
      return { success: true, message: '连接测试成功' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : '连接测试失败' 
      };
    }
  }

  async executeScript(
    scriptPath: string, 
    onOutput: (log: LogEntry) => void
  ): Promise<{ success: boolean; exitCode: number }> {
    try {
      const log = (message: string, type: LogEntry['type'] = 'info') => {
        console.log(`[SSH Log] ${type.toUpperCase()}: ${message}`);
        onOutput({
          timestamp: new Date().toISOString(),
          message,
          type
        });
      };

      // 清理ANSI颜色编码的函数
      const cleanAnsiCodes = (text: string): string => {
        return text.replace(/\[[0-9;]*m/g, '');
      };

      log(`开始执行脚本: ${scriptPath}`, 'info');

      // 简化测试 - 直接使用node-ssh的execCommand但增加调试
      log('测试基本SSH连接...', 'info');
      try {
        const basicTest = await this.ssh.execCommand('echo "SSH连接测试成功" && pwd');
        log(`基本测试结果: ${basicTest.stdout}`, 'info');
        if (basicTest.stderr) {
          log(`基本测试错误: ${basicTest.stderr}`, 'warning');
        }
      } catch (testError) {
        log(`基本测试失败: ${testError}`, 'error');
        return { success: false, exitCode: -1 };
      }

      // 检查脚本文件
      log('检查脚本文件...', 'info');
      const checkResult = await this.ssh.execCommand(`test -f "${scriptPath}" && echo "exists" || echo "not found"`);
      log(`脚本检查结果: ${checkResult.stdout}`, 'info');
      
      if (checkResult.stdout.trim() === 'not found') {
        log(`脚本文件不存在: ${scriptPath}`, 'error');
        return { success: false, exitCode: 1 };
      }

      // 添加执行权限
      log('设置脚本执行权限...', 'info');
      await this.ssh.execCommand(`chmod +x "${scriptPath}"`);

      // 获取脚本目录
      const scriptDir = scriptPath.substring(0, scriptPath.lastIndexOf('/'));
      log(`脚本目录: ${scriptDir}`, 'info');

      // 创建一个简化的执行命令，使用unbuffer来确保实时输出
      const command = `cd "${scriptDir}" && export DEBIAN_FRONTEND=noninteractive && export GIT_TERMINAL_PROMPT=0 && unbuffer bash -x "${scriptPath}"`;
      log(`执行命令: cd "${scriptDir}" && bash -x "${scriptPath}"`, 'info');
      log('════════════════ 脚本输出开始 ════════════════', 'info');

      // 使用流式执行来获得实时输出
      return new Promise((resolve) => {
        const connection = this.ssh.connection;
        if (!connection) {
          log('SSH连接已断开', 'error');
          resolve({ success: false, exitCode: -1 });
          return;
        }

        connection.exec(command, (err: any, stream: any) => {
          if (err) {
            log(`执行命令失败: ${err.message}`, 'error');
            resolve({ success: false, exitCode: -1 });
            return;
          }

          let exitCode = 0;
          let outputBuffer = '';
          let errorBuffer = '';

          // 处理输出的函数
          const processOutput = (data: string, isError = false) => {
            const buffer = isError ? 'errorBuffer' : 'outputBuffer';
            if (isError) {
              errorBuffer += data;
            } else {
              outputBuffer += data;
            }

            // 处理完整的行
            const lines = (isError ? errorBuffer : outputBuffer).split('\n');
            const remainingBuffer = lines.pop() || '';
            
            if (isError) {
              errorBuffer = remainingBuffer;
            } else {
              outputBuffer = remainingBuffer;
            }

            lines.forEach((line: string) => {
              if (line.trim()) {
                const cleanedLine = cleanAnsiCodes(line.trim());
                
                if (isError) {
                  // bash -x 的调试输出也会到stderr，但不是错误
                  if (line.startsWith('+')) {
                    log(`[DEBUG] ${cleanedLine}`, 'info');
                  } else if (line.includes('#') && (line.includes('building') || line.includes('internal'))) {
                    // Docker build 输出
                    log(`[BUILD] ${cleanedLine}`, 'info');
                  } else {
                    log(`[STDERR] ${cleanedLine}`, 'warning');
                  }
                } else {
                  log(`[STDOUT] ${cleanedLine}`, 'info');
                }
              }
            });
          };
          
          // 监听标准输出
          stream.on('data', (data: Buffer) => {
            processOutput(data.toString(), false);
          });

          // 监听错误输出
          stream.stderr.on('data', (data: Buffer) => {
            processOutput(data.toString(), true);
          });

          // 监听命令结束
          stream.on('close', (code: number, signal: string) => {
            // 处理剩余的缓冲区内容
            if (outputBuffer.trim()) {
              const cleanedLine = cleanAnsiCodes(outputBuffer.trim());
              log(`[STDOUT] ${cleanedLine}`, 'info');
            }
            if (errorBuffer.trim()) {
              const cleanedLine = cleanAnsiCodes(errorBuffer.trim());
              if (errorBuffer.startsWith('+')) {
                log(`[DEBUG] ${cleanedLine}`, 'info');
              } else {
                log(`[STDERR] ${cleanedLine}`, 'warning');
              }
            }

            exitCode = code || 0;
            
            log('════════════════ 脚本输出结束 ════════════════', 'info');
            log(`脚本执行完成，退出码: ${exitCode}`, exitCode === 0 ? 'success' : 'error');
            
            resolve({ 
              success: exitCode === 0, 
              exitCode 
            });
          });

          // 设置超时
          setTimeout(() => {
            log('脚本执行超时（5分钟），正在终止进程...', 'error');
            stream.close();
            resolve({ success: false, exitCode: 124 });
          }, 300000); // 5分钟超时
        });
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('SSH executeScript 异常:', error);
      onOutput({
        timestamp: new Date().toISOString(),
        message: `执行脚本时发生异常: ${errorMessage}`,
        type: 'error'
      });
      return { success: false, exitCode: -1 };
    }
  }

  async readFile(filePath: string): Promise<string> {
    try {
      const result = await this.ssh.execCommand(`cat "${filePath}"`);
      if (result.code === 0) {
        return result.stdout.trim();
      } else {
        throw new Error(`读取文件失败: ${result.stderr}`);
      }
    } catch (error) {
      throw new Error(`读取文件 ${filePath} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // 使用临时文件方式写入，避免直接覆盖原文件导致的问题
      const tempFile = `${filePath}.tmp`;
      const escapedContent = content.replace(/'/g, "'\"'\"'");
      
      const writeResult = await this.ssh.execCommand(`echo '${escapedContent}' > "${tempFile}" && mv "${tempFile}" "${filePath}"`);
      if (writeResult.code !== 0) {
        throw new Error(`写入文件失败: ${writeResult.stderr}`);
      }
    } catch (error) {
      throw new Error(`写入文件 ${filePath} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async getScriptContent(scriptPath: string): Promise<string> {
    return this.readFile(scriptPath);
  }

  async updateScriptContent(scriptPath: string, content: string): Promise<void> {
    await this.writeFile(scriptPath, content);
    // 确保脚本有执行权限
    await this.ssh.execCommand(`chmod +x "${scriptPath}"`);
  }

  // 添加公共方法来执行命令
  async execCommand(command: string): Promise<{ code: number; stdout: string; stderr: string }> {
    const result = await this.ssh.execCommand(command);
    return {
      code: result.code || 0, // 确保code是number类型，null时默认为0
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  // 添加公共方法来获取SSH连接对象，用于流式执行
  getConnection(): any {
    return this.ssh.connection;
  }

  async getSystemInfo(): Promise<{ os: string; kernel: string; uptime: string }> {
    try {
      const osResult = await this.ssh.execCommand('uname -a');
      const uptimeResult = await this.ssh.execCommand('uptime');
      
      return {
        os: osResult.stdout.trim(),
        kernel: osResult.stdout.split(' ')[2] || 'unknown',
        uptime: uptimeResult.stdout.trim()
      };
    } catch (error) {
      throw new Error(`获取系统信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  disconnect(): void {
    if (this.ssh.isConnected()) {
      this.ssh.dispose();
    }
  }
}