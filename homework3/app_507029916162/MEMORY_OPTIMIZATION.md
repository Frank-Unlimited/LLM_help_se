# 低内存优化指南（409MB 服务器）

## ? 优化目标

在 409MB 内存的服务器上运行应用，需要进行以下优化：

## ? 内存使用分析

典型内存占用：
- Python 基础镜像：~150MB
- Nginx：~5-10MB
- Supervisor：~2-5MB
- Python 依赖（FastAPI/Uvicorn）：~50-80MB
- Uvicorn Workers（2个）：~80-120MB（每个 40-60MB）
- 应用代码和运行时：~30-50MB
- **总计：~400-500MB**（超出 409MB 限制）

## ? 优化措施

### 1. 使用优化版 Dockerfile

已创建 `Dockerfile.low-memory`，包含以下优化：

- ? 使用 `python:3.10-alpine`（比 `python:3.10-slim` 小 ~50MB）
- ? Uvicorn workers 从 2 个减少到 1 个（节省 ~50MB）
- ? Nginx worker_processes 设置为 1（节省 ~5-10MB）
- ? 优化 Python 环境变量以减少内存占用
- ? 设置连接限制和超时以减少内存峰值

### 2. 构建低内存镜像

```bash
# 在项目根目录
cd homework3/app_507029916162

# 构建低内存优化镜像
docker build -f Dockerfile.low-memory -t tuzhixing-app:low-memory .

# 推送到镜像仓库（可选）
docker tag tuzhixing-app:low-memory crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:low-memory
docker push crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:low-memory
```

### 3. 运行容器时限制内存

```bash
# 使用 --memory 和 --memory-swap 限制容器内存使用
docker run -d \
  --name tuzhixing-app \
  --memory="350m" \
  --memory-swap="400m" \
  --oom-kill-disable=false \
  -p 80:80 \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:low-memory
```

**说明**：
- `--memory="350m"`：限制容器最大内存为 350MB
- `--memory-swap="400m"`：允许使用 50MB swap（如果需要）
- `--oom-kill-disable=false`：允许 OOM killer 在内存不足时终止容器

### 4. 服务器系统优化

#### 清理系统缓存
```bash
# 清理未使用的 Docker 资源
docker system prune -a

# 清理系统缓存（Linux）
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches

# 限制系统缓存使用
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### 优化系统服务
```bash
# 停止不必要的系统服务（如果有）
sudo systemctl stop docker  # 如果不需要 Docker 守护进程的额外功能
# 或者只停止不需要的服务
```

### 5. 监控内存使用

```bash
# 实时监控容器内存
docker stats tuzhixing-app

# 查看系统内存
free -h

# 查看进程内存使用
ps aux --sort=-%mem | head -10
```

## ? 完整部署步骤（低内存版本）

### 1. 构建或拉取低内存镜像

**选项 A：使用 GitHub Actions 构建（推荐）**
- 将 `Dockerfile.low-memory` 的内容应用到 `Dockerfile`
- 推送到 GitHub，等待自动构建

**选项 B：本地构建**
```bash
cd homework3/app_507029916162
docker build -f Dockerfile.low-memory -t tuzhixing-app:low-memory .
```

### 2. 运行容器（带内存限制）

```bash
docker run -d \
  --name tuzhixing-app \
  --memory="350m" \
  --memory-swap="400m" \
  --cpus="0.5" \
  -p 80:80 \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:low-memory
```

### 3. 验证运行

```bash
# 查看容器状态和资源使用
docker stats tuzhixing-app

# 查看日志
docker logs tuzhixing-app

# 测试 API
curl http://localhost/api/health
```

## ? 进一步优化选项

### 选项 1：移除 Supervisor，直接运行

如果不需要进程管理，可以直接运行 uvicorn：

```dockerfile
# 修改 Dockerfile，直接运行 uvicorn
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "3000", "--workers", "1"]
```

然后使用系统 nginx 作为反向代理（在容器外）。

### 选项 2：分离服务

将 Nginx 和 Backend 分离到不同的容器：

```bash
# Backend 容器
docker run -d --name backend -p 3000:3000 --memory="200m" backend-image

# Nginx 容器
docker run -d --name nginx -p 80:80 --memory="50m" --link backend nginx-image
```

### 选项 3：使用更轻量的 WSGI 服务器

考虑使用 `gunicorn` 替代 `uvicorn`（如果兼容）：

```bash
pip install gunicorn
# gunicorn 通常内存占用更小
```

## ?? 注意事项

1. **性能权衡**：
   - 单 worker 处理能力降低，并发请求性能下降
   - 内存占用减少，但响应时间可能增加

2. **Swap 使用**：
   - 如果启用 swap，性能会显著下降
   - 建议监控，避免频繁使用 swap

3. **监控指标**：
   - 定期检查内存使用：`docker stats`
   - 关注 OOM 错误：`dmesg | grep -i oom`
   - 监控应用响应时间

4. **高负载场景**：
   - 409MB 内存适合小规模使用（<10 并发用户）
   - 如果需要更高性能，建议升级到至少 1GB 内存

## ? 预期内存使用

优化后预期内存占用：

- 基础系统：~100MB
- Python + 依赖：~80MB
- Uvicorn（1 worker）：~60MB
- Nginx（1 worker）：~8MB
- Supervisor：~3MB
- 应用代码：~30MB
- 缓冲区/缓存：~50MB
- **总计：~330MB**（在 409MB 限制内）

## ? 快速部署命令

```bash
# 一键部署（低内存模式）
docker stop tuzhixing-app 2>/dev/null || true
docker rm tuzhixing-app 2>/dev/null || true

docker run -d \
  --name tuzhixing-app \
  --memory="350m" \
  --memory-swap="400m" \
  --cpus="0.5" \
  -p 80:80 \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:low-memory

# 监控
watch -n 2 docker stats tuzhixing-app
```

