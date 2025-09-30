# 多阶段构建：构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 接收构建参数
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_SOCKET_URL

# 设置环境变量（Vite需要VITE_前缀）
ENV VITE_REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV VITE_REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用（确保环境变量在构建时可用）
RUN npm run build

# 生产阶段：使用 nginx 提供静态文件
FROM nginx:alpine

# 复制构建产物到 nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建启动脚本来处理环境变量注入
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'echo "=== ServOps Frontend Starting ==="' >> /docker-entrypoint.sh && \
    echo 'echo "BACKEND_HOST: $BACKEND_HOST"' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# 生成动态nginx配置' >> /docker-entrypoint.sh && \
    echo 'if [ ! -z "$BACKEND_HOST" ] && [ "$BACKEND_HOST" != "http://backend:3001" ]; then' >> /docker-entrypoint.sh && \
    echo '  echo "Using external backend: $BACKEND_HOST"' >> /docker-entrypoint.sh && \
    echo '  BACKEND_ADDR=$(echo $BACKEND_HOST | sed "s|http://||")' >> /docker-entrypoint.sh && \
    echo '  sed -i "s|backend:3001|$BACKEND_ADDR|g" /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'else' >> /docker-entrypoint.sh && \
    echo '  echo "Using default backend: backend:3001"' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# 生成运行时配置' >> /docker-entrypoint.sh && \
    echo 'echo "Generating runtime config..."' >> /docker-entrypoint.sh && \
    echo 'cat > /usr/share/nginx/html/runtime-config.js << EOF' >> /docker-entrypoint.sh && \
    echo 'console.log("Runtime config loaded, BACKEND_HOST:", "${BACKEND_HOST:-http://localhost:3001}");' >> /docker-entrypoint.sh && \
    echo 'window.__BACKEND_HOST__ = "${BACKEND_HOST:-http://localhost:3001}";' >> /docker-entrypoint.sh && \
    echo 'EOF' >> /docker-entrypoint.sh && \
    echo 'echo "Runtime config generated:"' >> /docker-entrypoint.sh && \
    echo 'cat /usr/share/nginx/html/runtime-config.js' >> /docker-entrypoint.sh && \
    echo 'echo "Updated nginx config:"' >> /docker-entrypoint.sh && \
    echo 'grep -A5 -B5 "proxy_pass" /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'echo "Starting nginx..."' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 80

# 使用自定义启动脚本
CMD ["/docker-entrypoint.sh"]