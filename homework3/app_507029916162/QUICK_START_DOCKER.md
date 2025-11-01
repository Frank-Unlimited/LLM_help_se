# Docker 镜像快速构建指南

## 前置要求

1. **安装Docker Desktop**（Windows/Mac）或Docker Engine（Linux）
2. **确保Docker服务正在运行**
   - Windows: 启动Docker Desktop应用程序
   - 检查: 运行 `docker --version` 和 `docker ps` 确认Docker正常工作

## 快速构建步骤

### 方法1: 使用自动化脚本（推荐）

#### Windows:
```powershell
cd homework3\app_507029916162
.\build_docker.bat
```

#### Linux/Mac:
```bash
cd homework3/app_507029916162
chmod +x build_docker.sh
./build_docker.sh
```

### 方法2: 手动构建

#### 1. 进入项目目录
```bash
cd homework3/app_507029916162
```

#### 2. 构建Docker镜像
```bash
docker build -t tuzhixing-app:latest .
```

#### 3. 导出镜像为tar文件
```bash
# 导出为tar文件
docker save tuzhixing-app:latest -o tuzhixing-app.tar

# 或者导出为压缩的tar.gz文件（推荐，文件更小）
docker save tuzhixing-app:latest | gzip > tuzhixing-app.tar.gz
```

## 导出文件大小

镜像大小约 **500MB - 1GB**（取决于压缩）。压缩后通常可以减少到 **300-500MB**。

## 使用导出的镜像

### 在其他机器上导入和运行

#### 1. 导入镜像
```bash
# 从tar文件导入
docker load -i tuzhixing-app.tar

# 或从压缩文件导入
gunzip -c tuzhixing-app.tar.gz | docker load
```

#### 2. 运行容器
```bash
docker run -d \
  --name tuzhixing-app \
  -p 8080:80 \
  --restart unless-stopped \
  tuzhixing-app:latest
```

#### 3. 访问应用
- 前端: http://localhost:8080
- API文档: http://localhost:8080/docs
- 健康检查: http://localhost:8080/api/health

## 使用Docker Compose（可选）

如果希望使用docker-compose:

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

## 故障排除

### 问题1: Docker daemon未运行
**错误**: `error during connect: this error may indicate that the docker daemon is not running`

**解决**: 
- Windows: 启动Docker Desktop应用程序
- Linux: `sudo systemctl start docker`

### 问题2: 构建失败
**检查**:
1. 确保网络连接正常（需要下载依赖）
2. 确保Docker有足够磁盘空间
3. 查看详细错误: `docker build --progress=plain -t tuzhixing-app:latest .`

### 问题3: 端口被占用
**解决**: 修改docker run命令中的端口映射
```bash
docker run -d --name tuzhixing-app -p 3000:80 tuzhixing-app:latest
```

## 镜像信息

构建完成后，查看镜像:
```bash
docker images tuzhixing-app
```

查看镜像详情:
```bash
docker inspect tuzhixing-app:latest
```

## 优化建议

1. **多阶段构建**: Dockerfile已经使用多阶段构建，自动优化镜像大小
2. **压缩导出**: 使用gzip压缩可以显著减小文件大小
3. **使用镜像仓库**: 可以将镜像推送到Docker Hub或私有仓库，避免手动传输

## 后续步骤

构建完成后，你将得到:
- `tuzhixing-app.tar` 或 `tuzhixing-app.tar.gz` - 可直接分发的镜像文件
- 可以复制到其他机器，导入后即可运行
- 无需安装任何依赖，只需Docker环境




