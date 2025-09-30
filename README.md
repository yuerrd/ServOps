# ServOps - 远程脚本执行管理平台

<div align="center">

![ServOps Logo](https://img.shields.io/badge/ServOps-远程脚本管理-blue?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

一个现代化的远程脚本执行管理平台，支持通过Web界面安全地执行Ubuntu服务器脚本并实时查看执行日志。

[功能特性](#功能特性) • [快速开始](#快速开始) • [使用文档](#使用文档) • [API文档](#api文档) • [贡献指南](#贡献指南)

</div>

## 📖 项目概述

ServOps 是一个专门为DevOps团队设计的远程脚本执行管理平台。它提供了一个直观的Web界面来管理和执行远程服务器上的脚本，特别适用于自动化部署、系统维护和监控任务。

### 🎯 核心价值

- **简化运维**: 通过Web界面替代繁琐的SSH命令行操作
- **实时监控**: 实时查看脚本执行状态和输出日志
- **安全可靠**: 支持SSH密钥认证，确保连接安全
- **团队协作**: 多项目管理，支持团队共享和协作
- **版本追踪**: 自动记录版本历史，支持分页查看

## ✨ 功能特性

### 🖥️ 现代化界面
- 响应式设计，支持桌面和移动端
- 基于Ant Design的精美UI组件
- 实时状态更新和进度显示
- 深色主题的终端日志显示

### 🔐 安全认证
- SSH密码认证
- SSH私钥认证（推荐）
- 连接测试功能
- 敏感信息加密存储

### 📝 实时日志
- WebSocket实时日志传输
- 彩色日志分类（信息/警告/错误/成功）
- 日志滚动和清空功能
- 执行进度监控

### 📊 项目管理
- 多项目支持
- 项目状态监控
- 执行历史记录
- 版本历史追踪（支持分页）
- 脚本内容在线编辑

### 🚀 一键部署
- 一键执行远程脚本
- 自动版本检测和更新
- 构建状态实时反馈
- 失败重试机制

## 🛠 技术栈

<table>
<tr>
<td><strong>前端</strong></td>
<td><strong>后端</strong></td>
</tr>
<tr>
<td>

- React 18 + TypeScript
- Vite (构建工具)
- Ant Design (UI框架)
- Socket.IO Client (实时通信)
- Axios (HTTP客户端)
- React Router (路由管理)

</td>
<td>

- Node.js + Express
- TypeScript
- Socket.IO (WebSocket服务)
- node-ssh (SSH连接)
- MySQL (数据存储)
- JWT (身份认证)

</td>
</tr>
</table>

## 🚀 快速开始

### 📋 环境要求

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **MySQL** >= 5.7 (可选，也支持SQLite)

### 📦 安装

```bash
# 克隆仓库
git clone https://github.com/yuerrd/ServOps.git
cd ServOps

# 安装所有依赖
npm run install:all

# 或者分别安装
npm install
cd frontend && npm install
cd ../backend && npm install
```

### ⚙️ 配置

1. **数据库配置**（可选）
```sql
-- 创建数据库
CREATE DATABASE servops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 导入初始化脚本
mysql -u root -p servops < backend/database/init.sql
```

2. **环境变量配置**
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑配置文件
nano backend/.env
```

环境变量说明：
```bash
# 应用配置
NODE_ENV=development
PORT=3001

# 数据库配置（使用MySQL时）
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=servops

# SSH配置（可选）
SSH_PRIVATE_KEY_PATH=/path/to/your/private/key
SSH_PASSPHRASE=your_passphrase_if_needed
DEFAULT_SSH_TIMEOUT=30000
```

### 🚀 启动应用

```bash
# 开发环境 - 同时启动前后端
npm run dev

# 分别启动
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:3001

# 生产环境构建
npm run build
npm start
```

访问 http://localhost:3000 开始使用！

## 🐳 Docker 部署

ServOps 提供了完整的 Docker 容器化支持，可以快速部署到任何支持 Docker 的环境。

### 前置要求

- Docker Engine >= 20.10
- Docker Compose >= 2.0  
- **外部 MySQL 数据库**（版本 5.7+）
- **外部 Redis 服务**（可选）

### 快速开始

```bash
# 克隆项目
git clone https://github.com/yuerrd/ServOps.git
cd ServOps

# 准备数据库
mysql -u root -p -e "CREATE DATABASE servops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p servops < backend/database/init.sql

# 复制 Docker 环境配置
cp .env.docker .env

# 编辑数据库连接信息
nano .env

# 一键启动所有服务
docker-compose up -d
```

### 服务访问

- **前端界面**: http://localhost
- **后端API**: http://localhost:3001

### Docker 服务组件

| 服务 | 描述 | 端口 |
|------|------|------|
| frontend | Nginx + React SPA | 80, 443 |
| backend | Node.js API 服务 | 3001 |

### 外部依赖

| 服务 | 用途 | 必需性 |
|------|------|--------|
| MySQL | 数据存储 | 必需 |
| Redis | 缓存/会话 | 可选 |

详细的 Docker 部署指南请参考 [DOCKER.md](DOCKER.md)。

## 📚 使用文档

### 1️⃣ 创建SSH连接

首先需要配置SSH连接信息：

1. 点击"SSH连接管理"
2. 点击"新增连接"
3. 填写连接信息：
   - **连接名称**: 便于识别的名称
   - **服务器地址**: Ubuntu服务器IP或域名
   - **端口**: SSH端口（默认22）
   - **用户名**: SSH登录用户名
   - **认证方式**: 选择密码或私钥认证

**私钥认证示例**：
```
-----BEGIN OPENSSH PRIVATE KEY-----
your_private_key_content_here
-----END OPENSSH PRIVATE KEY-----
```

### 2️⃣ 创建项目

1. 点击"新增项目"
2. 填写项目信息：
   - **项目名称**: 项目标识名称
   - **项目描述**: 项目说明（可选）
   - **SSH连接**: 选择已配置的SSH连接
   - **工作目录**: 脚本执行的工作目录
   - **脚本内容**: 要执行的Shell脚本
   - **当前版本**: 项目版本号

**脚本示例**：
```bash
#!/bin/bash
echo "开始更新项目..."
cd /home/user/project
git pull origin main
docker-compose down
docker-compose up -d --build
echo "项目更新完成"
```

### 3️⃣ 执行脚本

1. 在项目列表中找到目标项目
2. 点击"执行"按钮
3. 系统自动跳转到项目详情页面
4. 实时查看脚本执行日志
5. 执行完成后查看结果和版本信息

### 4️⃣ 管理版本历史

- 查看历史版本记录
- 支持分页加载（每页10条）
- 点击"加载更多"查看更多历史记录
- 区分成功/失败状态

## 📡 API文档

### 项目管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/projects` | 获取项目列表 |
| GET | `/api/projects/:id` | 获取单个项目详情 |
| POST | `/api/projects` | 创建新项目 |
| PUT | `/api/projects/:id` | 更新项目信息 |
| DELETE | `/api/projects/:id` | 删除项目 |

### 脚本执行

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/projects/:id/execute` | 执行项目脚本 |
| GET | `/api/projects/:id/history` | 获取执行历史 |
| GET | `/api/projects/:id/version` | 获取版本信息 |
| GET | `/api/projects/:id/version-history` | 获取版本历史（分页）|

### 脚本管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/projects/:id/script` | 获取脚本内容 |
| PUT | `/api/projects/:id/script` | 更新脚本内容 |

### SSH连接

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/ssh-connections` | 获取SSH连接列表 |
| POST | `/api/ssh-connections` | 创建SSH连接 |
| PUT | `/api/ssh-connections/:id` | 更新SSH连接 |
| DELETE | `/api/ssh-connections/:id` | 删除SSH连接 |
| POST | `/api/test-connection` | 测试SSH连接 |

### WebSocket事件

| 事件 | 描述 |
|------|------|
| `join-project` | 加入项目房间 |
| `log` | 接收实时日志 |
| `execution-start` | 脚本开始执行 |
| `execution-end` | 脚本执行结束 |

## 📁 项目结构

```
ServOps/
├── 📄 package.json              # 根目录配置
├── 📄 README.md                 # 项目文档
├── 📄 .gitignore               # Git忽略文件
├── 🗂 frontend/                 # 前端应用
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   ├── 🗂 src/
│   │   ├── 📄 App.tsx           # 主应用组件
│   │   ├── 🗂 pages/            # 页面组件
│   │   │   ├── ProjectList.tsx  # 项目列表页
│   │   │   ├── ProjectDetail.tsx # 项目详情页
│   │   │   └── SSHConnectionList.tsx # SSH连接管理页
│   │   ├── 🗂 services/         # API服务
│   │   │   └── api.ts           # API接口封装
│   │   └── 🗂 types/            # TypeScript类型定义
│   │       └── index.ts
├── 🗂 backend/                  # 后端应用
│   ├── 📄 package.json
│   ├── 📄 .env.example          # 环境变量模板
│   ├── 🗂 database/             # 数据库脚本
│   │   └── init.sql             # 初始化SQL
│   └── 🗂 src/
│       ├── 📄 index.ts          # 应用入口
│       ├── 🗂 controllers/      # 控制器
│       │   └── projectController.ts
│       ├── 🗂 services/         # 业务服务
│       │   ├── projectService.ts
│       │   ├── sshService.ts
│       │   ├── executionService.ts
│       │   └── databaseService.ts
│       ├── 🗂 routes/           # 路由定义
│       │   └── projectRoutes.ts
│       └── 🗂 types/            # TypeScript类型定义
│           └── index.ts
```

## 🔒 安全建议

### 🛡 生产环境部署

1. **使用HTTPS**: 配置SSL证书保护数据传输
2. **私钥认证**: 禁用密码认证，仅使用SSH私钥
3. **网络隔离**: 部署在内网环境或配置防火墙
4. **访问控制**: 实施IP白名单或VPN访问
5. **定期更新**: 保持依赖包和系统的最新版本

### 🔐 SSH安全

```bash
# 生成SSH密钥对
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 复制公钥到目标服务器
ssh-copy-id -i ~/.ssh/id_rsa.pub user@server

# 禁用密码认证（推荐）
# 编辑 /etc/ssh/sshd_config
PasswordAuthentication no
PubkeyAuthentication yes
```

## 🐛 故障排除

<details>
<summary><strong>SSH连接问题</strong></summary>

**问题**: SSH连接失败
**解决方案**:
1. 检查服务器地址和端口
2. 验证用户名和认证信息
3. 确认SSH服务运行状态：`sudo systemctl status ssh`
4. 检查防火墙设置：`sudo ufw status`

</details>

<details>
<summary><strong>脚本执行问题</strong></summary>

**问题**: 脚本执行失败
**解决方案**:
1. 检查脚本语法：`bash -n script.sh`
2. 验证文件权限：`chmod +x script.sh`
3. 检查工作目录路径
4. 查看详细错误日志

</details>

<details>
<summary><strong>数据库连接问题</strong></summary>

**问题**: 数据库连接失败
**解决方案**:
1. 检查MySQL服务状态
2. 验证数据库连接信息
3. 确认数据库用户权限
4. 检查防火墙端口开放

</details>

## 🚧 开发计划

### 短期目标 (v1.1)
- [ ] 用户认证和权限管理
- [ ] 项目模板功能
- [ ] 批量操作支持
- [ ] 邮件通知集成

### 中期目标 (v1.2)
- [ ] 定时任务调度
- [ ] 多服务器集群支持
- [ ] 性能监控仪表板
- [ ] REST API完整文档

### 长期目标 (v2.0)
- [ ] 插件系统架构
- [ ] 容器化部署支持
- [ ] 多租户架构
- [ ] 移动端原生应用

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

### 🔀 提交代码

1. **Fork** 本仓库
2. **创建** 特性分支：`git checkout -b feature/amazing-feature`
3. **提交** 改动：`git commit -m 'Add amazing feature'`
4. **推送** 分支：`git push origin feature/amazing-feature`
5. **创建** Pull Request

### 📝 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 编写单元测试覆盖新功能
- 更新相关文档

### 🐛 报告问题

请使用 [GitHub Issues](../../issues) 报告bugs或提出功能请求。

## 📄 许可证

本项目采用 [MIT许可证](LICENSE) - 详见LICENSE文件。

## 💝 致谢

感谢所有为这个项目做出贡献的开发者和社区成员！

特别感谢：
- [Ant Design](https://ant.design/) - 优秀的React UI框架
- [Socket.IO](https://socket.io/) - 实时通信解决方案
- [node-ssh](https://github.com/steelbrain/node-ssh) - SSH连接库

## 📞 联系我们

- 📧 Email: yuerrd@gmail.com
- 💬 讨论: [GitHub Discussions](../../discussions)
- 🐛 问题: [GitHub Issues](../../issues)

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个星标！**

Made with ❤️ by ServOps Team

</div>