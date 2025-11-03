# GitHub Actions Docker 构建与推送配置指南

本文档说明如何配置 GitHub Actions 将项目自动构建为 Docker 镜像并推送到阿里云容器镜像服务（ACR）。

## ? 前置条件

1. **阿里云账号** - 已注册并开通容器镜像服务（ACR）
2. **GitHub 仓库** - 项目已推送到 GitHub
3. **Docker 镜像仓库** - 在阿里云 ACR 中创建好命名空间和仓库

## ? 配置步骤

### 1. 获取阿里云 ACR 凭据

#### 方式一：使用 AccessKey（推荐用于 CI/CD）

1. 登录 [阿里云控制台](https://ecs.console.aliyun.com/)
2. 进入 **访问控制（RAM）** → **身份** → **用户**
3. 创建或选择一个用于 CI/CD 的用户
4. 为用户创建 AccessKey（保存好 AccessKey ID 和 AccessKey Secret）
5. 为该用户授予 ACR 相关权限：
   - `cr:Push` - 推送镜像权限
   - `cr:Pull` - 拉取镜像权限
   - `cr:GetAuthorizationToken` - 获取临时登录令牌权限

#### 方式二：使用临时登录令牌

如果你已经有 ACR 的用户名和密码，可以直接使用。

### 2. 在阿里云 ACR 中创建镜像仓库

1. 登录 [容器镜像服务控制台](https://cr.console.aliyun.com/)
2. 选择地域（例如：华东1-杭州）
3. 创建命名空间（如果还没有）
4. 创建镜像仓库：
   - 仓库名称：`tuzhixing-app`（或自定义）
   - 仓库类型：私有
   - 代码源：无需关联

### 3. 配置 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets：

1. 进入你的 GitHub 仓库
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret** 添加以下密钥：

#### 必需的 Secrets

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `ALIYUN_ACR_USERNAME` | 阿里云 ACR 用户名（AccessKey ID） | `LTAI4G...` |
| `ALIYUN_ACR_PASSWORD` | 阿里云 ACR 密码（AccessKey Secret） | `xxxxxx...` |
| `ALIYUN_ACR_NAMESPACE` | 阿里云 ACR 命名空间 | `your-namespace` |

#### Secret 配置示例

```
ALIYUN_ACR_USERNAME = LTAI4Gxxxxxxxxxxxxx
ALIYUN_ACR_PASSWORD = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ALIYUN_ACR_NAMESPACE = your-namespace
```

> ?? **安全提示**：不要将这些敏感信息提交到代码仓库中！

### 4. 修改 Workflow 配置（可选）

如果需要修改镜像仓库地址或名称，编辑 `.github/workflows/docker-build-push.yml`：

```yaml
env:
  DOCKER_REGISTRY: registry.cn-hangzhou.aliyuncs.com  # 修改为你的地域
  IMAGE_NAME: tuzhixing-app                            # 修改为你的镜像名
```

阿里云 ACR 地域地址对照：
- 华东1（杭州）：`registry.cn-hangzhou.aliyuncs.com`
- 华东2（上海）：`registry.cn-shanghai.aliyuncs.com`
- 华北2（北京）：`registry.cn-beijing.aliyuncs.com`
- 华南1（深圳）：`registry.cn-shenzhen.aliyuncs.com`
- 更多地域请查看 [阿里云文档](https://help.aliyun.com/document_detail/60750.html)

## ? 使用方法

### 自动触发

Workflow 会在以下情况自动触发：
- ? 推送到 `main` 或 `master` 分支
- ? 提交的代码涉及 `homework3/app_507029916162/` 目录
- ? 修改 workflow 文件本身

### 手动触发

1. 进入 GitHub 仓库的 **Actions** 标签页
2. 选择 **Build and Push Docker Image to Aliyun ACR** workflow
3. 点击 **Run workflow** 按钮
4. 选择分支，点击 **Run workflow**

## ? 镜像标签规则

Workflow 会自动生成多个标签：

- `latest` - 默认分支的最新镜像
- `main` 或 `master` - 分支名标签
- `main-<commit-sha>` - 分支名 + commit SHA
- `<version>` - 语义化版本（如果使用 git tag）

### 拉取镜像

构建完成后，可以使用以下命令拉取镜像：

```bash
# 登录阿里云 ACR
docker login --username=<你的用户名> registry.cn-hangzhou.aliyuncs.com

# 拉取最新镜像
docker pull registry.cn-hangzhou.aliyuncs.com/<命名空间>/tuzhixing-app:latest

# 运行容器
docker run -d -p 8080:80 \
  --name tuzhixing-app \
  registry.cn-hangzhou.aliyuncs.com/<命名空间>/tuzhixing-app:latest
```

## ? 查看构建结果

1. 在 GitHub 仓库的 **Actions** 标签页查看构建状态
2. 点击具体的 workflow run 查看详细日志
3. 在阿里云 ACR 控制台查看推送的镜像

## ?? 高级配置

### 修改触发条件

编辑 `.github/workflows/docker-build-push.yml` 中的 `on` 部分：

```yaml
on:
  push:
    branches:
      - main
      - develop  # 添加其他分支
  schedule:
    - cron: '0 0 * * *'  # 定时构建（每天午夜）
```

### 构建缓存优化

Workflow 已启用 Docker 构建缓存，可以加速后续构建：
- `cache-from`: 从远程仓库拉取缓存
- `cache-to`: 将缓存推送到远程仓库

### 多架构构建（可选）

如果需要支持 ARM64 等架构，可以添加：

```yaml
platforms: linux/amd64,linux/arm64
```

## ? 常见问题

### 1. 认证失败

**错误**：`Error: Cannot perform an interactive login from a non TTY device`

**解决**：检查 GitHub Secrets 中的 `ALIYUN_ACR_USERNAME` 和 `ALIYUN_ACR_PASSWORD` 是否正确。

### 2. 推送权限不足

**错误**：`denied: requested access to the resource is denied`

**解决**：确保 RAM 用户具有 ACR 的推送权限（`cr:Push`）。

### 3. 镜像仓库不存在

**错误**：`repository does not exist`

**解决**：在阿里云 ACR 控制台先创建对应的命名空间和镜像仓库。

### 4. 构建上下文错误

**错误**：`Dockerfile not found` 或 `Cannot locate specified Dockerfile`

**解决**：检查 `BUILD_CONTEXT` 和 `DOCKERFILE_PATH` 配置是否正确指向项目目录。

## ? 参考资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [阿里云容器镜像服务文档](https://help.aliyun.com/product/60716.html)
- [Docker Buildx 文档](https://docs.docker.com/buildx/)
- [Docker Metadata Action](https://github.com/docker/metadata-action)

## ? 检查清单

配置完成后，请确认：

- [ ] 已在阿里云 ACR 创建命名空间和镜像仓库
- [ ] 已配置 GitHub Secrets（用户名、密码、命名空间）
- [ ] 已修改 workflow 中的地域和镜像名（如需要）
- [ ] 已测试 workflow 是否正常触发和构建
- [ ] 可以在阿里云 ACR 控制台看到推送的镜像

完成以上步骤后，你的项目就可以通过 GitHub Actions 自动构建并推送 Docker 镜像到阿里云了！?


