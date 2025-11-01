# Docker 部署完整指南

本项目已完整配置Docker支持，可以直接打包为Docker镜像并运行。

## ? Docker相关文件

```
homework3/app_507029916162/
├── Dockerfile              # 多阶段Docker构建文件
├── .dockerignore           # Docker构建忽略文件
├── docker-compose.yml      # Docker Compose配置（可选）
├── build_docker.sh         # Linux/Mac构建脚本
├── build_docker.bat        # Windows构建脚本
├── DOCKER_README.md        # 详细使用文档
└── QUICK_START_DOCKER.md   # 快速开始指南
```

## ? 快速开始（3步）

### 1. 启动Docker
确保Docker Desktop（Windows/Mac）或Docker Engine（Linux/WSL2）正在运行。

### 2. 构建镜像

**Windows:**
```cmd
cd homework3\app_507029916162
build_docker.bat
```

**WSL2 (推荐，性能更好):**
```bash
cd homework3/app_507029916162
chmod +x build_docker_wsl2.sh
./build_docker_wsl2.sh
```

**Linux/Mac:**
```bash
cd homework3/app_507029916162
chmod +x build_docker.sh
./build_docker.sh
```

### 3. 导出镜像
构建脚本会自动导出镜像为 `tuzhixing-app.tar.gz` 文件。

## ? 镜像特性

- ? **多阶段构建**: 优化镜像大小，分离构建和运行环境
- ? **前后端集成**: 前端React应用 + 后端FastAPI服务
- ? **Nginx反向代理**: 统一80端口提供服务
- ? **Supervisor管理**: 自动管理Nginx和Python服务
- ? **生产就绪**: 优化的生产环境配置

## ? 使用方法

### 方法A: 直接运行（开发/测试）

```bash
docker run -d \
  --name tuzhixing-app \
  -p 8080:80 \
  tuzhixing-app:latest
```

访问: http://localhost:8080

### 方法B: 使用Docker Compose

```bash
docker-compose up -d
```

### 方法C: 导入导出的镜像文件

```bash
# 导入
gunzip -c tuzhixing-app.tar.gz | docker load

# 运行
docker run -d --name tuzhixing-app -p 8080:80 tuzhixing-app:latest
```

## ? 镜像内容

- **前端**: React + Vite构建的静态文件（已预构建）
- **后端**: Python 3.10 + FastAPI + Uvicorn
- **Web服务器**: Nginx
- **进程管理**: Supervisor

## ? 配置说明

### 端口映射

默认端口映射: `主机:容器`
- `8080:80` - Web服务（可通过docker run修改）

### 环境变量

可以通过环境变量配置：

```bash
docker run -d \
  --name tuzhixing-app \
  -p 8080:80 \
  -e COZE_API_KEY=your_key \
  -e OPENAI_API_KEY=your_key \
  tuzhixing-app:latest
```

### 数据持久化

数据库文件可以挂载：

```bash
docker run -d \
  --name tuzhixing-app \
  -p 8080:80 \
  -v $(pwd)/backend/travel_planner.db:/app/backend/travel_planner.db \
  tuzhixing-app:latest
```

## ? 服务架构

```
用户请求
    ↓
Nginx (端口80)
    ├── / → 前端静态文件 (React)
    ├── /api → 代理到后端 (FastAPI :3000)
    ├── /docs → API文档
    └── /redoc → API文档(ReDoc)
```

## ?? 常用命令

```bash
# 查看日志
docker logs tuzhixing-app
docker logs -f tuzhixing-app

# 查看容器状态
docker ps
docker stats tuzhixing-app

# 进入容器
docker exec -it tuzhixing-app /bin/bash

# 重启容器
docker restart tuzhixing-app

# 停止容器
docker stop tuzhixing-app

# 删除容器
docker rm tuzhixing-app

# 删除镜像
docker rmi tuzhixing-app:latest
```

## ? 检查清单

构建前检查：
- [ ] Docker已安装并运行
- [ ] 有足够磁盘空间（至少5GB）
- [ ] 网络连接正常（需要下载依赖）

构建后检查：
- [ ] 镜像构建成功 (`docker images tuzhixing-app`)
- [ ] 导出文件已生成 (`ls -lh tuzhixing-app.tar.gz`)
- [ ] 容器可以正常启动 (`docker run ...`)

## ? 更多信息

- 详细文档: [DOCKER_README.md](./DOCKER_README.md)
- 快速开始: [QUICK_START_DOCKER.md](./QUICK_START_DOCKER.md)
- **WSL2专用指南**: [WSL2_DOCKER_GUIDE.md](./WSL2_DOCKER_GUIDE.md) ?

## ?? 注意事项

1. **Docker daemon必须运行** - 构建和运行都需要Docker服务
2. **磁盘空间** - 镜像构建需要足够的临时空间
3. **网络要求** - 首次构建需要下载基础镜像和依赖
4. **端口冲突** - 确保8080端口未被占用（或修改映射）

## ? 完成！

成功构建后，你将获得：
- ? Docker镜像: `tuzhixing-app:latest`
- ? 导出文件: `tuzhixing-app.tar.gz`（可直接分发）
- ? 一键运行的完整应用

镜像可以在任何安装了Docker的机器上运行，无需安装任何其他依赖！



