# Docker 部署指南

## 快速开始

### 方式1: 使用Docker Compose（推荐）

```bash
cd homework3/app_507029916162
docker-compose up -d
```

访问：http://localhost:8080

### 方式2: 直接使用Docker

#### 构建镜像
```bash
cd homework3/app_507029916162
docker build -t tuzhixing-app:latest .
```

#### 运行容器
```bash
docker run -d \
  --name tuzhixing-app \
  -p 8080:80 \
  tuzhixing-app:latest
```

## 导出和导入镜像

### 导出镜像为tar文件（用于离线分发）

```bash
# 构建镜像
docker build -t tuzhixing-app:latest .

# 导出镜像
docker save tuzhixing-app:latest -o tuzhixing-app.tar

# 或者压缩版本（更小）
docker save tuzhixing-app:latest | gzip > tuzhixing-app.tar.gz
```

### 导入镜像（在其他机器上）

```bash
# 导入tar文件
docker load -i tuzhixing-app.tar

# 或者从压缩文件导入
gunzip -c tuzhixing-app.tar.gz | docker load

# 运行容器
docker run -d --name tuzhixing-app -p 8080:80 tuzhixing-app:latest
```

## 环境变量配置

如果需要配置环境变量，可以：

1. **通过docker-compose.yml**
```yaml
environment:
  - COZE_API_KEY=your_key
  - OPENAI_API_KEY=your_key
```

2. **通过.env文件**（需要取消docker-compose.yml中的注释）

3. **通过运行时参数**
```bash
docker run -d \
  --name tuzhixing-app \
  -p 8080:80 \
  -e COZE_API_KEY=your_key \
  tuzhixing-app:latest
```

## 查看日志

```bash
# 查看所有日志
docker logs tuzhixing-app

# 实时查看日志
docker logs -f tuzhixing-app

# 查看supervisor日志
docker exec tuzhixing-app tail -f /var/log/supervisor/backend.out.log
```

## 停止和清理

```bash
# 停止容器
docker stop tuzhixing-app

# 删除容器
docker rm tuzhixing-app

# 删除镜像
docker rmi tuzhixing-app:latest

# 使用docker-compose
docker-compose down
```

## 健康检查

访问以下URL检查服务状态：

- 前端：http://localhost:8080
- API文档：http://localhost:8080/docs
- 健康检查：http://localhost:8080/api/health

## 故障排除

### 端口被占用
如果8080端口被占用，可以修改docker-compose.yml中的端口映射：
```yaml
ports:
  - "3000:80"  # 改为其他端口
```

### 查看容器内部
```bash
docker exec -it tuzhixing-app /bin/bash
```

### 重启服务
```bash
docker restart tuzhixing-app
```




