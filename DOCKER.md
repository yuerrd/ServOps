# Docker 部署指南

ServOps 提供了完整的 Docker 容器化支持，可以一键部署整个应用栈。

## 🚀 快速开始

### 1. 前置要求

- Docker Engine >= 20.10
- Docker Compose >= 2.0
- 至少 1GB 可用内存
- 至少 2GB 可用磁盘空间
- **外部 MySQL 数据库**（版本 5.7+）
- **外部 Redis 服务**（可选，用于缓存）

### 2. 准备数据库

在部署应用前，请确保已准备好 MySQL 数据库：

```sql
-- 创建数据库
CREATE DATABASE servops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户并授权
CREATE USER 'servops_user'@'%' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON servops.* TO 'servops_user'@'%';
FLUSH PRIVILEGES;

-- 导入初始化脚本
mysql -u servops_user -p servops < backend/database/init.sql
```

### 3. 克隆项目并配置

```bash
# 克隆项目
git clone https://github.com/yuerrd/ServOps.git
cd ServOps

# 复制环境变量配置
cp .env.docker .env

# 编辑环境变量，配置数据库连接信息
nano .env
```

### 4. 一键启动

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 5. 访问应用

- **前端界面**: http://localhost
- **后端API**: http://localhost:3001

## 📦 服务架构

### 服务组件

| 服务 | 容器名 | 端口 | 描述 |
|------|--------|------|------|
| frontend | servops-frontend | 80, 443 | Nginx + React SPA |
| backend | servops-backend | 3001 | Node.js API 服务 |

### 外部依赖

| 服务 | 用途 | 必需性 |
|------|------|--------|
| MySQL | 数据存储 | 必需 |
| Redis | 缓存/会话 | 可选 |

### 网络拓扑

```
Internet
    ↓
[Nginx:80] ← Frontend Container
    ↓ (proxy)
[Node.js:3001] ← Backend Container
    ↓ (network)
[External MySQL] ← 外部数据库
[External Redis] ← 外部缓存（可选）
```

## ⚙️ 配置说明

### 环境变量

编辑 `.env` 文件来自定义配置：

```bash
# 数据库配置
DB_HOST=your_mysql_host
DB_PORT=3306
DB_NAME=servops
DB_USER=servops_user
DB_PASSWORD=your_strong_password

# Redis 配置
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# 应用配置
SSH_TIMEOUT=30000
NODE_ENV=production
```

### 数据持久化

应用数据自动存储在 Docker 卷中：

- `ssh_keys`: SSH 私钥存储（可选）

## 🔧 常用操作

### 启动和停止

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启特定服务
docker-compose restart backend

# 停止并删除所有数据
docker-compose down -v
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看最近100行日志
docker-compose logs --tail=100 backend
```

### 服务管理

```bash
# 查看服务状态
docker-compose ps

# 查看资源使用情况
docker stats

# 进入容器内部
docker-compose exec backend sh
```

### 数据备份与恢复

```bash
# 备份数据库
mysqldump -h your_mysql_host -u servops_user -p servops > backup.sql

# 恢复数据库
mysql -h your_mysql_host -u servops_user -p servops < backup.sql
```

## 🏗️ 开发环境

### 开发模式启动

```bash
# 使用开发配置启动（带热重载）
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 只启动 Redis，本地运行应用
docker-compose up -d redis
npm run dev
```

### 构建镜像

```bash
# 构建所有镜像
docker-compose build

# 构建特定服务镜像
docker-compose build backend
docker-compose build frontend

# 强制重新构建
docker-compose build --no-cache
```

## 🔒 生产环境配置

### 安全加固

1. **修改默认密码**
```bash
# 生成强密码
openssl rand -base64 32
```

2. **使用 HTTPS**
```bash
# 添加 SSL 证书到 frontend/ssl/ 目录
mkdir -p frontend/ssl
# 更新 nginx.conf 启用 HTTPS
```

3. **网络隔离**
```yaml
# 移除不必要的端口暴露
# 只保留前端的 80/443 端口
```

### 监控和日志

```bash
# 启用日志收集
docker-compose logs --no-color > /var/log/servops.log

# 设置日志轮转
echo "*/15 * * * * root docker system prune -f" >> /etc/crontab
```

## 🐛 故障排除

### 常见问题

1. **容器启动失败**
```bash
# 检查日志
docker-compose logs [service-name]

# 检查资源使用
docker system df
```

2. **数据库连接失败**
```bash
# 检查数据库状态
mysqladmin -h your_mysql_host -u servops_user -p ping

# 手动连接测试
mysql -h your_mysql_host -u servops_user -p
```

3. **前端无法访问后端**
```bash
# 检查网络连接
docker-compose exec frontend wget -O- http://backend:3001/api/health

# 检查 nginx 配置
docker-compose exec frontend nginx -t
```

### 性能优化

```bash
# 限制容器资源使用
docker-compose --compatibility up -d

# 清理未使用的镜像和容器
docker system prune -a
```

## 📊 监控指标

### 健康检查

所有服务都配置了健康检查：

```bash
# 查看健康状态
docker-compose ps

# 手动触发健康检查
docker-compose exec backend node healthcheck.js
```

### 资源监控

```bash
# 实时监控资源使用
docker stats --no-stream

# 查看容器详细信息
docker inspect servops-backend
```

## 🔄 更新和维护

### 应用更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
docker-compose build
docker-compose up -d

# 滚动更新（零停机）
docker-compose up -d --no-deps backend
```

### 数据库迁移

```bash
# 运行数据库迁移脚本
docker-compose exec backend npm run migrate

# 手动执行 SQL
mysql -h your_mysql_host -u servops_user -p servops < migration.sql
```

这个 Docker 化的 ServOps 提供了完整的容器化解决方案，支持开发、测试和生产环境的快速部署。