import { SSHService } from './sshService';
import { ProjectService } from './projectService';
import { VersionService } from './versionService';
import { Project, LogEntry, ExecutionResult, SSHConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';

export class ExecutionService {
  private projectService: ProjectService;
  private io: Server;
  private activeExecutions: Map<string, boolean> = new Map();

  constructor(projectService: ProjectService, io: Server) {
    this.projectService = projectService;
    this.io = io;
  }

  async executeScript(project: Project): Promise<string> {
    const executionId = uuidv4();
    
    if (this.activeExecutions.get(project.id)) {
      throw new Error('项目正在执行中');
    }

    // 标记项目为执行中
    this.activeExecutions.set(project.id, true);
    this.projectService.updateProjectStatus(project.id, 'running');

    // 异步执行脚本
    this.performExecution(project, executionId).catch(error => {
      console.error('脚本执行异常:', error);
    });

    return executionId;
  }

  private async performExecution(project: Project, executionId: string): Promise<void> {
    const startTime = new Date();
    const logs: LogEntry[] = [];
    let success = false;
    let newVersion = '';

    const sshService = new SSHService();

    try {
      // 发送执行开始事件
      this.io.to(project.id).emit('execution-start', executionId);

      const onOutput = (log: LogEntry) => {
        logs.push(log);
        this.io.to(project.id).emit('log', log);
      };

      // 获取SSH连接配置
      const sshConnection = await this.projectService.getSSHConfigForProject(project.id);
      if (!sshConnection) {
        throw new Error('未找到SSH连接配置');
      }

      const sshConfig: SSHConfig = {
        host: sshConnection.host,
        port: sshConnection.port,
        username: sshConnection.username,
        password: sshConnection.password,
        privateKey: sshConnection.privateKey,
        passphrase: sshConnection.passphrase,
      };

      onOutput({
        timestamp: new Date().toISOString(),
        message: `连接到服务器 ${sshConnection.name} (${sshConnection.username}@${sshConnection.host}:${sshConnection.port})`,
        type: 'info'
      });

      // 连接SSH
      await sshService.connect(sshConfig);

      onOutput({
        timestamp: new Date().toISOString(),
        message: 'SSH连接成功',
        type: 'success'
      });

      // 平台自动计算新版本
      newVersion = VersionService.upgradeVersion(project.currentVersion);
      
      onOutput({
        timestamp: new Date().toISOString(),
        message: `版本升级: ${project.currentVersion} -> ${newVersion}`,
        type: 'info'
      });

      // 准备脚本内容，替换版本占位符
      const scriptContent = project.scriptContent
        .replace(/{{CURRENT_VERSION}}/g, project.currentVersion)
        .replace(/{{NEW_VERSION}}/g, newVersion);
      
      // 在服务器上创建临时脚本文件
      const tempScriptPath = `/tmp/script_${project.id}_${Date.now()}.sh`;

      onOutput({
        timestamp: new Date().toISOString(),
        message: `创建临时脚本文件: ${tempScriptPath}`,
        type: 'info'
      });

      onOutput({
        timestamp: new Date().toISOString(),
        message: `工作目录: ${project.workingDirectory}`,
        type: 'info'
      });

      // 上传脚本内容到服务器
      await sshService.writeFile(tempScriptPath, scriptContent);
      
      // 确保脚本有执行权限
      await sshService.execCommand(`chmod +x "${tempScriptPath}"`);

      onOutput({
        timestamp: new Date().toISOString(),
        message: `脚本文件创建完成，切换到工作目录执行...`,
        type: 'info'
      });

      // 修改执行命令，先切换到工作目录
      const executeCommand = `cd "${project.workingDirectory}" && bash -x "${tempScriptPath}" 2>&1`;
      
      onOutput({
        timestamp: new Date().toISOString(),
        message: `执行命令: cd "${project.workingDirectory}" && bash -x "${tempScriptPath}"`,
        type: 'info'
      });

      // 执行脚本（使用修改后的executeScript方法）
      const result = await this.executeScriptInDirectory(sshService, executeCommand, onOutput);
      success = result.success;

      // 清理临时文件
      await sshService.execCommand(`rm -f "${tempScriptPath}"`);

      if (success) {
        // 脚本执行成功，更新版本到数据库配置
        await this.projectService.updateProjectVersion(project.id, newVersion);
        
        // 记录版本发布历史
        await this.projectService.addVersionHistory(project.id, newVersion, true);
        
        onOutput({
          timestamp: new Date().toISOString(),
          message: `版本已更新到配置文件: ${newVersion}`,
          type: 'success'
        });
        
        onOutput({
          timestamp: new Date().toISOString(),
          message: `构建成功完成！新版本: ${newVersion}`,
          type: 'success'
        });
        
        this.projectService.updateProjectStatus(project.id, 'success', startTime);
      } else {
        // 记录失败的构建尝试
        await this.projectService.addVersionHistory(project.id, newVersion, false);
        
        onOutput({
          timestamp: new Date().toISOString(),
          message: `脚本执行失败，版本保持不变: ${project.currentVersion}`,
          type: 'warning'
        });
        
        this.projectService.updateProjectStatus(project.id, 'error', startTime);
      }

    } catch (error) {
      success = false;
      const errorMessage = error instanceof Error ? error.message : '执行失败';
      
      const errorLog: LogEntry = {
        timestamp: new Date().toISOString(),
        message: `执行失败: ${errorMessage}`,
        type: 'error'
      };
      
      logs.push(errorLog);
      this.io.to(project.id).emit('log', errorLog);
      this.projectService.updateProjectStatus(project.id, 'error', startTime);
    } finally {
      // 清理资源
      sshService.disconnect();
      this.activeExecutions.delete(project.id);

      // 保存执行结果
      const executionResult: ExecutionResult = {
        projectId: project.id,
        success,
        logs,
        startTime: startTime.toISOString(),
        endTime: new Date().toISOString()
      };

      this.projectService.addExecutionResult(executionResult);

      // 发送执行结束事件
      this.io.to(project.id).emit('execution-end', success);
    }
  }

  private async executeScriptInDirectory(
    sshService: SSHService,
    command: string,
    onOutput: (log: LogEntry) => void
  ): Promise<{ success: boolean; exitCode: number }> {
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

    log('════════════════ 脚本输出开始 ════════════════', 'info');

    try {
      // 使用流式执行来获得实时输出
      return new Promise((resolve) => {
        const connection = sshService.getConnection();
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
      log(`执行脚本时发生异常: ${errorMessage}`, 'error');
      return { success: false, exitCode: -1 };
    }
  }

  async getVersion(project: Project): Promise<string> {
    // 直接返回平台存储的版本信息
    return project.currentVersion || '0.0.1';
  }

  isExecuting(projectId: string): boolean {
    return this.activeExecutions.get(projectId) || false;
  }
}