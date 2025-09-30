# Docker 部署指南

ServOps 提供完整的 Docker 容器化支持，使用单一的 docker-compose.yml 文件支持多种部署模式。

## 🚀 快速部署

### 前置要求
- Docker Engine >= 20.10、Docker Compose >= 2.0
- 外部 MySQL 数据库（版本 5.7+）、外部 Redis 服务（可选）

### 一键部署
```bash
# 克隆项目
git clone https://github.com/yuerrd/ServOps.git && cd ServOps

# 准备数据库
mysql -u root -p -e "CREATE DATABASE servops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p servops < backend/database/init.sql

# 配置环境变量
cp .env.docker .env && nano .env

# 启动服务
docker-compose up -d
```

## 📦 部署模式

| 模式 | 命令 | 适用场景 |
|------|------|----------|
| 完整部署 | `docker-compose up -d` | 同节点部署前后端 |
| 仅后端 | `docker-compose --profile backend up -d` | 后端独立部署 |
| 仅前端 | `export BACKEND_HOST=http://192.168.1.100:3001`<br/>`docker-compose --profile frontend up -d` | 前端连接远程后端 |
| 跨节点 | 后端: `docker-compose --profile backend up -d`<br/>前端: 设置`BACKEND_HOST`后启动前端 | 分布式部署 |

## ⚙️ 环境变量配置

编辑 `.env` 文件：
```bash
# 跨节点部署配置
BACKEND_HOST=http://192.168.1.100:3001  # 前端指向后端地址
CORS_ORIGIN=http://192.168.1.101        # 后端允许前端访问

# 数据库配置
DB_HOST=192.168.1.200
DB_USER=servops_user
DB_PASSWORD=your_password
DB_NAME=servops

# 可选配置
REDIS_HOST=192.168.1.201
SSH_TIMEOUT=30000
```

## 🔧 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service-name]

# 重启服务
docker-compose restart [service-name]

# 停止服务
docker-compose down

# 重新构建
docker-compose up -d --build
```

## 🌐 网络配置

### 端口开放
- 前端：80 (HTTP)、443 (HTTPS)
- 后端：3001 (API)

### 防火墙设置
```bash
# 后端节点
sudo ufw allow 3001

# 前端节点  
sudo ufw allow 80 && sudo ufw allow 443
```

## 🐛 故障排除

| 问题 | 解决方案 |
|------|----------|
| 跨节点连接失败 | 检查网络: `telnet 192.168.1.100 3001` |
| CORS 错误 | 验证 `CORS_ORIGIN` 配置 |
| 构建失败 | 清理缓存: `docker system prune -a` |
| 环境变量未生效 | 检查配置: `docker-compose config` |

**服务健康检查:**
- 后端: `curl http://localhost:3001/api/health`
- 前端: `curl http://localhost/`