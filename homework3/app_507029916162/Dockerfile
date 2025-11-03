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
# 使用 alpine 版本以减少镜像大小和内存占用（适合低内存服务器）
FROM python:3.10-alpine

WORKDIR /app

# 设置编码环境变量，确保正确处理文件
ENV PYTHONIOENCODING=utf-8
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
# 优化 Python 内存使用
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# 安装最小系统依赖（alpine 使用 apk，比 apt 更轻量）
RUN apk add --no-cache \
    nginx \
    supervisor \
    && rm -rf /var/cache/apk/* \
    && mkdir -p /etc/supervisor/conf.d \
    && mkdir -p /var/log/supervisor

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

# 创建nginx配置（alpine 版本使用 /etc/nginx/nginx.conf）
RUN printf 'events {\n    worker_connections 512;\n}\nhttp {\n    include /etc/nginx/mime.types;\n    default_type application/octet-stream;\n    charset utf-8;\n    sendfile on;\n    keepalive_timeout 65;\n    gzip on;\n    gzip_types text/plain text/css application/json application/javascript text/html application/javascript text/xml application/xml;\n    server {\n        listen 6666;\n        server_name _;\n        root /app/frontend/dist;\n        index index.html;\n        location / {\n            try_files $uri $uri/ /index.html;\n            charset utf-8;\n        }\n        location /api {\n            proxy_pass http://127.0.0.1:3000;\n            proxy_http_version 1.1;\n            proxy_set_header Upgrade $http_upgrade;\n            proxy_set_header Connection "upgrade";\n            proxy_set_header Host $host;\n            proxy_set_header X-Real-IP $remote_addr;\n            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n            proxy_set_header X-Forwarded-Proto $scheme;\n            proxy_buffering off;\n            charset utf-8;\n        }\n        location /docs {\n            proxy_pass http://127.0.0.1:3000;\n            proxy_http_version 1.1;\n            proxy_set_header Host $host;\n            proxy_set_header X-Real-IP $remote_addr;\n            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        }\n        location /redoc {\n            proxy_pass http://127.0.0.1:3000;\n            proxy_http_version 1.1;\n            proxy_set_header Host $host;\n            proxy_set_header X-Real-IP $remote_addr;\n            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        }\n        location /openapi.json {\n            proxy_pass http://127.0.0.1:3000;\n            proxy_http_version 1.1;\n            proxy_set_header Host $host;\n            proxy_set_header X-Real-IP $remote_addr;\n            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        }\n    }\n}\n' > /etc/nginx/nginx.conf

# 创建supervisor配置（使用 printf 确保正确的换行符）
# 优化：单 worker + 连接限制 + 超时设置，减少内存占用
RUN printf '[supervisord]\nnodaemon=true\nlogfile=/var/log/supervisor/supervisord.log\npidfile=/var/run/supervisord.pid\n\n[program:backend]\ncommand=uvicorn app:app --host 0.0.0.0 --port 3000 --workers 1 --limit-concurrency 20 --timeout-keep-alive 30\ndirectory=/app/backend\nautostart=true\nautorestart=true\nstderr_logfile=/var/log/supervisor/backend.err.log\nstdout_logfile=/var/log/supervisor/backend.out.log\nenvironment=PYTHONUNBUFFERED=1\nstopasgroup=true\nkillasgroup=true\n\n[program:nginx]\ncommand=nginx -g "daemon off; worker_processes 1;"\nautostart=true\nautorestart=true\nstderr_logfile=/var/log/supervisor/nginx.err.log\nstdout_logfile=/var/log/supervisor/nginx.out.log\nstopasgroup=true\nkillasgroup=true\n' > /etc/supervisor/conf.d/supervisord.conf

# 创建启动脚本（使用 printf 确保正确的换行符，alpine 使用 /bin/sh）
RUN printf '#!/bin/sh\nset -e\necho "Starting services (low memory optimized)..."\nexec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf\n' > /app/start.sh && \
    chmod +x /app/start.sh

# 暴露端口
EXPOSE 6666

# 启动服务
CMD ["/app/start.sh"]

