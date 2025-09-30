# ServOps - 远程脚本执行管理平台

<div align="center">

![ServOps Logo](https://img.shields.io/badge/ServOps-远程脚本管理-blue?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

一个现代化的远程脚本执行管理平台，支持通过Web界面安全地执行Ubuntu服务器脚本并实时查看执行日志。

[快速开始](#快速开始) • [Docker部署](#docker-部署) • [使用方法](#使用方法) • [贡献指南](#贡献指南)

</div>

## 📖 项目概述

ServOps 是一个专门为DevOps团队设计的远程脚本执行管理平台，提供直观的Web界面来管理和执行远程服务器上的脚本。

### ✨ 核心功能

- 🔐 **SSH连接管理** - 支持密码和私钥认证
- 📝 **脚本在线编辑** - 无需登录服务器直接编辑脚本
- 🚀 **一键执行** - Web界面一键执行远程脚本
- 📊 **实时日志** - 彩色日志实时显示，支持进度监控
- 📈 **版本管理** - 自动版本追踪和历史记录
- 👥 **团队协作** - 多项目管理，支持团队共享

### 🛠 技术栈

**前端**: React 18 + TypeScript + Ant Design + Socket.IO Client  
**后端**: Node.js + Express + TypeScript + Socket.IO + node-ssh  
**数据库**: MySQL (也支持 SQLite)

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 5.7 (可选)

### 安装运行
```bash
# 克隆项目
git clone https://github.com/yuerrd/ServOps.git && cd ServOps

# 安装依赖
npm run install:all

# 配置环境变量
cp backend/.env.example backend/.env

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 开始使用！

## 🐳 Docker 部署

```bash
# 克隆项目
git clone https://github.com/yuerrd/ServOps.git && cd ServOps

# 配置环境变量
cp .env.docker .env && nano .env

# 一键启动
docker-compose up -d
```

**访问地址**: http://localhost  
**详细说明**: 查看 [DOCKER.md](DOCKER.md)

## 📱 使用方法

### 1. 配置SSH连接
在"SSH连接管理"中添加服务器连接信息（支持密码或私钥认证）

### 2. 创建项目
新增项目，配置SSH连接、工作目录和脚本内容

### 3. 执行脚本
点击"执行"按钮，实时查看脚本执行日志和结果

### 4. 管理版本
查看版本历史，追踪每次执行的结果和版本变化

## 🔒 安全建议

- 生产环境使用HTTPS和SSH私钥认证
- 配置防火墙限制访问IP
- 定期更新依赖包和系统版本

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/your-feature`
3. 提交改动: `git commit -m 'Add some feature'`
4. 推送分支: `git push origin feature/your-feature`
5. 提交 Pull Request

## 📄 许可证

本项目采用 [MIT许可证](LICENSE)

## 📞 联系我们

- 📧 Email: yuerrd@gmail.com
- 🐛 问题反馈: [GitHub Issues](../../issues)

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个星标！**

Made with ❤️ by ServOps Team

</div>