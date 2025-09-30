<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# ServOps 项目说明

这是一个远程脚本执行管理平台，用于通过Web界面执行Ubuntu服务器上的脚本并实时查看日志。

## 项目结构
- `frontend/`: React + TypeScript 前端应用
- `backend/`: Node.js + Express + TypeScript 后端API服务
- 使用Socket.IO实现实时日志传输
- 使用node-ssh库进行SSH连接和脚本执行

## 开发指南
- 前端使用Ant Design作为UI组件库
- 后端支持SSH密码和私钥认证
- 所有API接口都有完整的TypeScript类型定义
- 使用concurrently同时启动前后端开发服务器

## 安全注意事项
- SSH认证信息需要安全存储和传输
- 建议在生产环境中使用私钥认证
- 需要适当的网络安全配置