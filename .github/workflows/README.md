# GitHub Actions Workflows

## ? Docker 构建与推送

**文件**: `.github/workflows/docker-build-push.yml`

### 功能
- 自动构建 Docker 镜像
- 推送到阿里云容器镜像服务（ACR）
- 支持构建缓存优化
- PR 时仅构建不推送（安全最佳实践）

### 触发条件
- ? 推送到 `main`/`master` 分支
- ? Pull Request
- ? 手动触发（workflow_dispatch）

### 配置要求

需要在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 中配置：

1. `ALIYUN_ACR_USERNAME` - 阿里云 ACR 用户名（AccessKey ID）
2. `ALIYUN_ACR_PASSWORD` - 阿里云 ACR 密码（AccessKey Secret）
3. `ALIYUN_ACR_NAMESPACE` - 阿里云 ACR 命名空间

### 详细配置指南

? 查看完整配置说明：[GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)

### 镜像地址格式

```
registry.cn-hangzhou.aliyuncs.com/<命名空间>/tuzhixing-app:latest
```

### 使用示例

```bash
# 登录阿里云 ACR
docker login --username=<用户名> registry.cn-hangzhou.aliyuncs.com

# 拉取镜像
docker pull registry.cn-hangzhou.aliyuncs.com/<命名空间>/tuzhixing-app:latest

# 运行容器
docker run -d -p 8080:80 \
  --name tuzhixing-app \
  registry.cn-hangzhou.aliyuncs.com/<命名空间>/tuzhixing-app:latest
```

