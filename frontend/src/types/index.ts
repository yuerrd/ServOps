export interface SSHConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  sshConnectionId: string; // 引用SSH连接配置
  workingDirectory: string; // 项目工作路径，脚本执行目录
  scriptContent: string; // 脚本内容存储在平台上
  currentVersion: string; // 版本信息存储在平台上
  isTemplate: boolean; // 是否为模板脚本
  status: 'idle' | 'running' | 'success' | 'error';
  lastRun?: Date;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'warning' | 'success';
}

export interface ExecutionResult {
  projectId: string;
  success: boolean;
  logs: LogEntry[];
  startTime: string;
  endTime?: string;
}