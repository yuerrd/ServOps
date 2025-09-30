// ServOps 项目配置文件
export const config = {
  // 默认脚本模板
  defaultScript: `#!/bin/bash

# 设置脚本在任何命令失败时退出
set -e

echo "当前版本号为: {{CURRENT_VERSION}}"
echo "即将升级到版本: {{NEW_VERSION}}"

# 执行git pull
if ! git pull; then
    echo "错误: git pull 失败"
    exit 1
fi

# 执行构建
echo "开始执行构建..."
if ! bash build.sh {{NEW_VERSION}}; then
    echo "错误: build.sh 执行失败"
    exit 1
fi

echo "构建成功完成！版本: {{NEW_VERSION}}"`,

  // 项目默认配置
  project: {
    defaultVersion: '0.0.1',
    executionTimeout: 300000, // 5分钟
    progressUpdateInterval: 1000, // 1秒
    maxLogEntries: 1000 // 最大日志条数
  },

  // UI配置
  ui: {
    logTerminalHeight: '750px',
    pageSize: {
      projects: 10,
      versionHistory: 10
    }
  }
};

export default config;