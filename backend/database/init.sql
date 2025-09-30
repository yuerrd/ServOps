-- ServOps 数据库初始化脚本
CREATE DATABASE IF NOT EXISTS servops DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE servops;

-- 迁移状态表
CREATE TABLE IF NOT EXISTS migration_status (
    id VARCHAR(50) PRIMARY KEY,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- SSH连接表
CREATE TABLE IF NOT EXISTS ssh_connections (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INT NOT NULL DEFAULT 22,
    username VARCHAR(255) NOT NULL,
    password TEXT,
    private_key TEXT,
    passphrase TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 项目表（移除 version_file_path 字段）
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    ssh_connection_id VARCHAR(36) NOT NULL,
    working_directory VARCHAR(500) NOT NULL,
    script_content TEXT NOT NULL,
    current_version VARCHAR(50) NOT NULL DEFAULT '0.0.1',
    is_template BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('idle', 'running', 'success', 'error') NOT NULL DEFAULT 'idle',
    last_run TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ssh_connection_id) REFERENCES ssh_connections(id) ON DELETE RESTRICT
);

-- 版本历史表
CREATE TABLE IF NOT EXISTS version_history (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    version VARCHAR(50) NOT NULL,
    success BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_version_history_project (project_id),
    INDEX idx_version_history_created (project_id, created_at)
);

-- 执行历史表
CREATE TABLE IF NOT EXISTS execution_results (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    success BOOLEAN NOT NULL,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 执行日志表
CREATE TABLE IF NOT EXISTS execution_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    execution_id VARCHAR(36) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    message TEXT NOT NULL,
    type ENUM('info', 'error', 'warning', 'success') NOT NULL DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (execution_id) REFERENCES execution_results(id) ON DELETE CASCADE,
    INDEX idx_execution_timestamp (execution_id, timestamp)
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_projects_ssh_connection ON projects(ssh_connection_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_execution_results_project ON execution_results(project_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_execution ON execution_logs(execution_id);