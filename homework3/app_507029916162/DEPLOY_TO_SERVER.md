# 服务器部署指南 - 通过公网 IP 访问应用

## ? 前提条件

1. **阿里云 ECS 服务器**（或其他具有公网 IP 的服务器）
2. **Docker 已安装**在服务器上
3. **服务器已配置公网 IP**
4. **安全组规则**已配置（允许访问 80 端口）

## ? 部署步骤

### 1. 登录到服务器

```bash
ssh root@your-server-ip
# 或者使用你的用户名
ssh your-username@your-server-ip
```

### 2. 登录阿里云容器镜像仓库

```bash
docker login crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com \
  --username hhc510105200301150090 \
  --password-stdin
# 输入你的 ACR 密码
```

或者使用环境变量：
```bash
export ALIYUN_ACR_USERNAME="hhc510105200301150090"
export ALIYUN_ACR_PASSWORD="your-password"

echo $ALIYUN_ACR_PASSWORD | docker login \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com \
  --username $ALIYUN_ACR_USERNAME \
  --password-stdin
```

### 3. 拉取 Docker 镜像

```bash
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
```

### 4. 运行容器

**重要：不要覆盖 CMD，使用默认启动命令**

```bash
docker run -d \
  --name tuzhixing-app \
  -p 80:80 \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
```

**注意**：
- ? **不要**添加 `bash -c "cd /app && python app.py"` 等命令
- ? 容器会自动使用 `/app/start.sh` 启动，它会启动 supervisor 来管理 nginx 和 backend
- ? backend 在 `/app/backend/app.py`，由 supervisor 自动启动

### 5. 验证部署

```bash
# 查看容器状态
docker ps

# 查看容器日志
docker logs tuzhixing-app

# 测试健康检查
curl http://localhost/api/health
```

### 6. 配置安全组（阿里云 ECS）

在阿里云控制台：

1. 进入 **ECS 实例** → **安全组**
2. 点击 **配置规则**
3. 添加 **入方向规则**：
   - **协议类型**: TCP
   - **端口范围**: 80/80
   - **授权对象**: 0.0.0.0/0（允许所有 IP 访问）
   - **描述**: 允许 HTTP 访问

### 7. 访问应用

在浏览器中访问：
- **前端首页**: `http://your-public-ip`
- **API 文档**: `http://your-public-ip/docs`
- **健康检查**: `http://your-public-ip/api/health`

## ? 完整部署脚本

创建 `deploy.sh` 文件：

```bash
#!/bin/bash

# 配置信息
REGISTRY="crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com"
NAMESPACE="hhc510105200301150090"
IMAGE_NAME="hhc"
CONTAINER_NAME="tuzhixing-app"

# 登录镜像仓库
echo "Logging in to Aliyun ACR..."
read -sp "Enter ACR password: " PASSWORD
echo ""
echo $PASSWORD | docker login $REGISTRY --username $NAMESPACE --password-stdin

# 停止并删除旧容器（如果存在）
echo "Stopping old container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# 拉取最新镜像
echo "Pulling latest image..."
docker pull $REGISTRY/$NAMESPACE/$IMAGE_NAME:latest

# 运行新容器
echo "Starting container..."
docker run -d \
  --name $CONTAINER_NAME \
  -p 80:80 \
  --restart unless-stopped \
  $REGISTRY/$NAMESPACE/$IMAGE_NAME:latest

echo "Deployment completed!"
echo "Access your app at: http://$(curl -s ifconfig.me)"
```

使用方法：
```bash
chmod +x deploy.sh
./deploy.sh
```

## ? 常用管理命令

### 查看日志
```bash
docker logs tuzhixing-app
docker logs -f tuzhixing-app  # 实时查看
```

### 重启容器
```bash
docker restart tuzhixing-app
```

### 更新应用
```bash
# 停止容器
docker stop tuzhixing-app

# 删除旧容器
docker rm tuzhixing-app

# 拉取新镜像
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest

# 运行新容器（使用默认启动命令）
docker run -d \
  --name tuzhixing-app \
  -p 80:80 \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
```

**注意**：容器会自动启动 supervisor 来管理 nginx 和 backend，无需手动指定启动命令。

### 进入容器调试
```bash
docker exec -it tuzhixing-app /bin/bash
```

## ? 使用域名访问（可选）

如果你有域名，可以：

1. **配置 DNS 解析**：将域名 A 记录指向服务器公网 IP
2. **配置 Nginx 反向代理**（可选）：如果需要 HTTPS，可以配置 Nginx 作为反向代理

## ?? 注意事项

1. **防火墙配置**：确保服务器防火墙允许 80 端口
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 80/tcp
   
   # CentOS/RHEL
   sudo firewall-cmd --permanent --add-port=80/tcp
   sudo firewall-cmd --reload
   ```

2. **环境变量**：如果需要配置环境变量（如 API keys），使用 `-e` 参数：
   ```bash
   docker run -d \
     --name tuzhixing-app \
     -p 80:80 \
     -e COZE_API_KEY=your_key \
     -e OPENAI_API_KEY=your_key \
     --restart unless-stopped \
     crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
   ```

3. **数据持久化**：如果需要保存数据库数据，使用数据卷：
   ```bash
   docker run -d \
     --name tuzhixing-app \
     -p 80:80 \
     -v /path/to/data:/app/backend/travel_planner.db \
     --restart unless-stopped \
     crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
   ```

4. **HTTPS 配置**（生产环境推荐）：
   - 使用 Nginx 反向代理配置 SSL
   - 使用 Let's Encrypt 免费证书
   - 或使用阿里云 SSL 证书

## ? 检查应用状态

```bash
# 检查容器是否运行
docker ps | grep tuzhixing-app

# 检查端口是否监听
netstat -tlnp | grep 80
# 或
ss -tlnp | grep 80

# 测试 API
curl http://localhost/api/health
```

## ? 故障排查

### 问题 1: 无法访问
- 检查安全组规则是否允许 80 端口
- 检查服务器防火墙配置
- 检查容器是否正在运行：`docker ps`

### 问题 2: 容器启动失败
```bash
# 查看详细日志
docker logs tuzhixing-app

# 检查容器内部
docker exec -it tuzhixing-app /bin/bash
```

### 问题 3: 端口被占用
```bash
# 查找占用 80 端口的进程
sudo lsof -i :80
# 或使用其他端口
docker run -d --name tuzhixing-app -p 8080:80 ...
```

### 问题 4: 容器启动失败 - app.py 找不到
**错误**: `python: can't open file '/app/app.py': [Errno 2] No such file or directory`

**原因**: 覆盖了容器的默认启动命令

**解决**:
1. 删除错误的容器：
   ```bash
   docker stop tuzhixing-app
   docker rm tuzhixing-app
   ```

2. 使用正确的命令（**不要**覆盖 CMD）：
   ```bash
   docker run -d \
     --name tuzhixing-app \
     -p 80:80 \
     --restart unless-stopped \
     crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
   ```

3. 容器会自动：
   - 启动 supervisor
   - supervisor 启动 nginx（端口 80）
   - supervisor 启动 backend（uvicorn，端口 3000）
   - backend 在 `/app/backend/app.py`，由 supervisor 管理

## ? 快速测试

部署完成后，在浏览器中测试：

1. **首页**: `http://your-server-ip`
2. **API 文档**: `http://your-server-ip/docs`
3. **健康检查**: `http://your-server-ip/api/health`

如果都能正常访问，说明部署成功！

