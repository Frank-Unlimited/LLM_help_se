# WSL2 Docker 构建指南

本指南专门针对在 WSL2 (Windows Subsystem for Linux 2) 环境中构建和打包 Docker 镜像。

## 前置条件

### 1. 安装 WSL2
确保你已经安装并配置了 WSL2。检查方法：
```bash
wsl --version
```

### 2. 安装 Docker

#### 选项A: Docker Desktop (推荐)
- 在 Windows 中安装 Docker Desktop
- 启用 "Use the WSL 2 based engine"
- 在 WSL2 发行版中即可使用 `docker` 命令

#### 选项B: 在 WSL2 中直接安装 Docker Engine
```bash
# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 添加Docker官方GPG密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动Docker服务
sudo service docker start

# 将当前用户添加到docker组（可选，避免每次使用sudo）
sudo usermod -aG docker $USER
# 重新登录WSL2后生效
```

## 快速开始

### 1. 在 WSL2 中进入项目目录

```bash
# 从Windows路径访问
cd /mnt/d/Users/Lenovo/Desktop/LLM_help_se/homework3/app_507029916162

# 或者如果项目已在WSL2文件系统中
cd ~/LLM_help_se/homework3/app_507029916162
```

### 2. 确保 Docker 正在运行

```bash
# 检查Docker状态
docker ps

# 如果Docker未运行，启动它
sudo service docker start
```

### 3. 运行构建脚本

```bash
# 给脚本添加执行权限
chmod +x build_docker_wsl2.sh

# 运行构建脚本
./build_docker_wsl2.sh
```

## 详细步骤

### 步骤1: 进入项目目录

```bash
# 方式1: 从Windows访问（在/mnt下）
cd /mnt/d/Users/Lenovo/Desktop/LLM_help_se/homework3/app_507029916162

# 方式2: 将项目复制到WSL2文件系统（性能更好）
# 在WSL2中执行：
cp -r /mnt/d/Users/Lenovo/Desktop/LLM_help_se ~/LLM_help_se
cd ~/LLM_help_se/homework3/app_507029916162
```

> **性能提示**: WSL2 中访问 `/mnt` 下的 Windows 文件系统可能较慢。如果构建时间过长，建议将项目复制到 WSL2 的文件系统中（如 `~/projects/`）。

### 步骤2: 启动 Docker 服务

```bash
# 检查Docker状态
sudo service docker status

# 如果未运行，启动Docker
sudo service docker start

# 验证Docker是否正常工作
docker run hello-world
```

### 步骤3: 构建镜像

```bash
# 使用WSL2专用脚本（推荐）
./build_docker_wsl2.sh

# 或使用通用脚本
./build_docker.sh

# 或手动构建
docker build -t tuzhixing-app:latest .
```

### 步骤4: 导出镜像

如果使用脚本，会自动导出。也可以手动导出：

```bash
# 导出为tar.gz（压缩，文件更小）
docker save tuzhixing-app:latest | gzip > tuzhixing-app.tar.gz

# 或导出为tar（未压缩）
docker save tuzhixing-app:latest -o tuzhixing-app.tar
```

### 步骤5: 访问导出的文件

导出的文件位置：
```bash
# 查看文件路径
realpath tuzhixing-app.tar.gz

# 如果在/mnt下，可以直接在Windows资源管理器中访问
# 如果在WSL2文件系统中，可以通过以下方式访问：
explorer.exe .
# 或者复制到Windows可访问的位置
cp tuzhixing-app.tar.gz /mnt/d/Users/Lenovo/Desktop/
```

## 性能优化

### 1. 在 WSL2 文件系统中工作

WSL2 访问 Windows 文件系统（`/mnt`）性能较差。建议：

```bash
# 将项目复制到WSL2文件系统
cp -r /mnt/d/Users/Lenovo/Desktop/LLM_help_se ~/projects/
cd ~/projects/LLM_help_se/homework3/app_507029916162

# 构建完成后，将结果复制回Windows
cp tuzhixing-app.tar.gz /mnt/d/Users/Lenovo/Desktop/
```

### 2. 使用 Docker BuildKit

启用 BuildKit 可以加快构建速度：

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

./build_docker_wsl2.sh
```

### 3. 增加 Docker 资源限制

如果 Docker Desktop 可用，在设置中增加：
- CPU 核心数
- 内存限制

## 故障排除

### 问题1: Docker daemon 未运行

**错误**: `Cannot connect to the Docker daemon`

**解决**:
```bash
# 启动Docker服务
sudo service docker start

# 或者如果使用Docker Desktop，确保它在Windows中运行
```

### 问题2: 权限 denied

**错误**: `permission denied while trying to connect to the Docker daemon`

**解决**:
```bash
# 将用户添加到docker组
sudo usermod -aG docker $USER

# 重新登录WSL2，或使用newgrp
newgrp docker

# 或临时使用sudo
sudo docker build ...
```

### 问题3: 构建速度慢

**原因**: 在 `/mnt` 下访问 Windows 文件系统性能较差

**解决**:
```bash
# 将项目复制到WSL2文件系统
cp -r /mnt/d/... ~/projects/
cd ~/projects/.../homework3/app_507029916162
./build_docker_wsl2.sh
```

### 问题4: 磁盘空间不足

**检查磁盘空间**:
```bash
df -h
```

**清理Docker资源**:
```bash
# 清理未使用的镜像、容器、网络
docker system prune -a

# 查看Docker磁盘使用情况
docker system df
```

### 问题5: 网络问题（下载依赖失败）

**检查网络**:
```bash
# 测试网络连接
ping google.com

# 如果在中国，可能需要配置镜像源
```

## 验证构建结果

```bash
# 查看镜像
docker images tuzhixing-app

# 测试运行（可选）
docker run -d --name test-app -p 8080:80 tuzhixing-app:latest

# 检查容器状态
docker ps

# 查看日志
docker logs test-app

# 测试访问（在WSL2中）
curl http://localhost:8080/api/health

# 清理测试容器
docker stop test-app && docker rm test-app
```

## 文件路径说明

在 WSL2 中：
- Windows路径: `D:\Users\...` → WSL2路径: `/mnt/d/Users/...`
- WSL2文件系统: `~` 或 `/home/username/`（性能更好）

## 常用命令速查

```bash
# 进入项目目录
cd /mnt/d/Users/Lenovo/Desktop/LLM_help_se/homework3/app_507029916162

# 启动Docker
sudo service docker start

# 构建镜像
./build_docker_wsl2.sh

# 查看镜像
docker images

# 查看文件（在Windows中）
explorer.exe .
```

## 完成！

构建成功后，你将获得：
- ? Docker镜像: `tuzhixing-app:latest`
- ? 导出文件: `tuzhixing-app.tar.gz`
- ? 可在任何支持Docker的环境中运行


