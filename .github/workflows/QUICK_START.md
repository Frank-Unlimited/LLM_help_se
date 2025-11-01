# ? 快速开始 - 配置 GitHub Actions

根据你的阿里云镜像仓库信息，workflow 已经配置完成。现在只需要在 GitHub 中配置 Secrets 即可。

## ? 配置步骤

### 1. 获取阿里云访问凭证密码

根据你提供的信息，登录用户名为：`nick1329599640`

**获取密码：**
1. 登录 [阿里云容器镜像服务控制台](https://cr.console.aliyun.com/)
2. 进入你的镜像仓库
3. 点击 **访问凭证** 或 **凭证管理**
4. 查看或重置你的访问凭证密码

> ? **提示**：如果忘记了密码，可以在访问凭证页面进行修改。

### 2. 在 GitHub 配置 Secrets

1. 进入你的 GitHub 仓库：`https://github.com/Frank-Unlimited/LLM_help_se`
2. 点击 **Settings**（设置）
3. 左侧菜单选择 **Secrets and variables** → **Actions**
4. 点击 **New repository secret** 添加以下两个 Secrets：

#### Secret 1: `ALIYUN_ACR_USERNAME`
- **Name**: `ALIYUN_ACR_USERNAME`
- **Value**: `nick1329599640`

#### Secret 2: `ALIYUN_ACR_PASSWORD`
- **Name**: `ALIYUN_ACR_PASSWORD`
- **Value**: `<你的访问凭证密码>`

> ?? **安全提示**：密码是你在阿里云设置的访问凭证密码，不是阿里云账号登录密码。

### 3. 验证配置

配置完成后，你可以：

**方式一：手动触发**
1. 进入 GitHub 仓库的 **Actions** 标签页
2. 选择 **Build and Push Docker Image to Aliyun ACR** workflow
3. 点击 **Run workflow** → **Run workflow**

**方式二：自动触发**
- 推送代码到 `main` 或 `master` 分支
- 当 `homework3/app_507029916162/` 目录有变化时会自动触发

## ? 配置完成后的镜像地址

构建成功后，镜像会被推送到：

```
crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
```

## ? 拉取和使用镜像

配置完成后，你可以使用以下命令拉取镜像：

```bash
# 登录阿里云 ACR
docker login --username=nick1329599640 crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com

# 拉取镜像
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest

# 运行容器
docker run -d -p 8080:80 \
  --name hhc-app \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
```

访问应用：`http://localhost:8080`

## ? 查看构建状态

1. 在 GitHub 仓库的 **Actions** 标签页查看构建进度
2. 点击具体的 workflow run 查看详细日志
3. 构建成功后，在阿里云 ACR 控制台可以看到推送的镜像

## ? 常见问题

### Q: 认证失败怎么办？
A: 检查 GitHub Secrets 中的用户名和密码是否正确，确保密码是你设置的访问凭证密码。

### Q: 如何修改访问凭证密码？
A: 登录阿里云容器镜像服务控制台 → 访问凭证页面 → 修改凭证密码。

### Q: 构建失败怎么办？
A: 查看 GitHub Actions 的详细日志，通常是因为：
- Dockerfile 路径错误
- 构建上下文问题
- 网络问题

## ? 完成！

配置完成后，每次推送代码到 main 分支，GitHub Actions 会自动构建并推送 Docker 镜像到你的阿里云仓库！

