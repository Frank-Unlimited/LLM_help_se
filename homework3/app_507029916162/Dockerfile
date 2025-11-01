# 多阶段构建Dockerfile
# 阶段1: 构建前端
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 设置非交互式环境变量以避免构建过程中的交互提示
ENV CI=true
# 注意：不要设置 NODE_ENV=production，因为我们需要安装 devDependencies 进行构建

# 复制前端依赖文件
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY eslint.config.js ./

# 安装前端依赖（包括 devDependencies，构建需要）
RUN npm install --legacy-peer-deps

# 复制前端源代码
COPY src ./src
COPY index.html ./
# 复制 app 目录（包含语音识别相关文件）
COPY app ./app
# 复制 examples 目录（app/speechrecognizer.js 依赖 examples/lib/cryptojs.js）
COPY examples ./examples

# 构建前端（跳过 TypeScript 类型检查，仅进行构建）
# Vite 会处理 TypeScript 转译，所以不需要先运行 tsc
# 使用 npx 确保能找到 vite 命令（vite 在 devDependencies 中）
RUN npx vite build

# 阶段2: Python后端运行环境
FROM python:3.10-slim

WORKDIR /app

# 设置编码环境变量，确保正确处理文件
ENV PYTHONIOENCODING=utf-8
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    locales \
    && rm -rf /var/lib/apt/lists/* \
    && localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8

# 复制后端依赖文件
COPY backend/requirements.txt ./backend/

# 安装Python依赖
# 使用 Python -m pip 确保使用正确的 Python 环境和编码
RUN python -m pip install --upgrade pip setuptools wheel && \
    python -m pip install --no-cache-dir -r backend/requirements.txt && \
    python -m pip install --no-cache-dir python-dotenv

# 复制后端代码
COPY backend ./backend

# 从构建阶段复制前端构建产物
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 创建nginx配置
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /app/frontend/dist; \
    index index.html; \
    \
    # 前端路由支持 \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # API代理到后端 \
    location /api { \
        proxy_pass http://127.0.0.1:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    # API文档 \
    location /docs { \
        proxy_pass http://127.0.0.1:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    } \
    \
    location /redoc { \
        proxy_pass http://127.0.0.1:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    } \
    \
    location /openapi.json { \
        proxy_pass http://127.0.0.1:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    } \
}' > /etc/nginx/sites-available/default

# 创建supervisor配置
RUN echo '[supervisord] \
nodaemon=true \
logfile=/var/log/supervisor/supervisord.log \
pidfile=/var/run/supervisord.pid \
\
[program:backend] \
command=uvicorn app:app --host 0.0.0.0 --port 3000 --workers 2 \
directory=/app/backend \
autostart=true \
autorestart=true \
stderr_logfile=/var/log/supervisor/backend.err.log \
stdout_logfile=/var/log/supervisor/backend.out.log \
environment=PYTHONUNBUFFERED=1 \
\
[program:nginx] \
command=nginx -g "daemon off;" \
autostart=true \
autorestart=true \
stderr_logfile=/var/log/supervisor/nginx.err.log \
stdout_logfile=/var/log/supervisor/nginx.out.log' > /etc/supervisor/conf.d/supervisord.conf

# 创建启动脚本
RUN echo '#!/bin/bash \
set -e \
\
# 等待数据库等初始化（如果需要） \
echo "Starting services..." \
\
# 启动supervisor（管理nginx和backend） \
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf' > /app/start.sh && \
    chmod +x /app/start.sh

# 暴露端口
EXPOSE 80

# 启动服务
CMD ["/app/start.sh"]

