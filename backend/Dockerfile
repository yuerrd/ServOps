# 使用官方 Node.js 运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安装所有依赖（包括开发依赖用于构建）
RUN npm install && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 安装生产依赖（构建完成后重新安装只包含生产依赖）
RUN rm -rf node_modules && npm install --omit=dev && npm cache clean --force

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S servops -u 1001

# 更改文件所有权
RUN chown -R servops:nodejs /app
USER servops

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD node healthcheck.js || exit 1

# 启动应用 - 添加更详细的启动命令
CMD ["sh", "-c", "echo 'Starting ServOps Backend...' && ls -la dist/ && node dist/index.js"]