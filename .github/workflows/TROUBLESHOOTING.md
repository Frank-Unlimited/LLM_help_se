# GitHub Actions Docker 登录故障排除指南

## ? 认证失败问题排查

如果遇到 `unauthorized: authentication required` 错误，请按照以下步骤检查：

### 1. 检查 GitHub Secrets 配置

在 GitHub 仓库中检查 Secrets 是否正确配置：

**路径**: `Settings` → `Secrets and variables` → `Actions`

确保以下 Secrets 已正确设置：

| Secret 名称 | 值说明 | 示例 |
|------------|--------|------|
| `ALIYUN_ACR_USERNAME` | 阿里云账号全名 | `nick1329599640` |
| `ALIYUN_ACR_PASSWORD` | 访问凭证密码 | `<你的访问凭证密码>` |

### 2. 获取正确的访问凭证密码

**重要**: 个人版容器镜像服务的密码是**访问凭证密码**，不是阿里云账号登录密码！

**获取步骤**：
1. 登录 [阿里云容器镜像服务控制台](https://cr.console.aliyun.com/)
2. 进入你的镜像仓库
3. 点击 **访问凭证** 或 **凭证管理**
4. 查看或重置你的**访问凭证密码**

> ?? **注意**: 如果忘记了访问凭证密码，可以在访问凭证页面进行**重置**。

### 3. 验证用户名格式

根据你提供的信息，用户名应该是：
- **格式**: `nick1329599640`（完整的阿里云账号全名）
- **不是**: AccessKey ID
- **不是**: 邮箱地址

### 4. 测试本地登录（验证凭据）

在本地使用相同的凭据测试登录：

```bash
# Windows PowerShell
$password = "你的访问凭证密码"
echo $password | docker login crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com --username "nick1329599640" --password-stdin

# Linux/Mac
echo "你的访问凭证密码" | docker login crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com \
  --username "nick1329599640" \
  --password-stdin
```

如果本地登录失败，说明凭据有问题，需要：
- 检查用户名是否正确
- 重置访问凭证密码

### 5. 检查 Secrets 中的特殊字符

确保密码中**没有多余的空格或换行符**：
- 复制密码时不要包含前后空格
- 不要有多行

### 6. 更新 Secrets（如果需要）

如果确认凭据正确但仍然失败，尝试：
1. 删除旧的 Secrets
2. 重新创建 Secrets，确保值完全正确
3. 重新运行 workflow

## ? Workflow 配置检查

确保 workflow 文件中的配置正确：

```yaml
env:
  DOCKER_REGISTRY: crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com
  IMAGE_NAME: hhc
  IMAGE_NAMESPACE: hhc510105200301150090
```

## ? 常见错误及解决方案

### 错误 1: `unauthorized: authentication required`
**原因**: 用户名或密码不正确
**解决**: 
- 检查 GitHub Secrets 中的值是否正确
- 确认使用的是访问凭证密码，不是账号登录密码
- 验证用户名是完整的阿里云账号全名

### 错误 2: `WARNING! Using --password via the CLI is insecure`
**状态**: ? 已修复 - 现在使用 `--password-stdin` 方式（更安全）

### 错误 3: `Error response from daemon: Get "https://.../v2/": unauthorized`
**原因**: 认证失败
**解决**: 按照上述步骤检查凭据配置

## ? 调试步骤

1. **检查 Secrets 是否存在**：
   - 进入 GitHub 仓库 Settings → Secrets
   - 确认 `ALIYUN_ACR_USERNAME` 和 `ALIYUN_ACR_PASSWORD` 都存在

2. **验证 Secrets 值**（不显示完整值）：
   - 检查 `ALIYUN_ACR_USERNAME` 是否是 `nick1329599640`
   - 检查 `ALIYUN_ACR_PASSWORD` 是否已设置（不会显示完整值）

3. **查看 workflow 日志**：
   - 在 GitHub Actions 页面查看详细错误信息
   - 检查登录步骤的详细输出

4. **本地测试**：
   - 使用相同的凭据在本地测试 docker login
   - 如果本地失败，说明凭据有问题

## ? 快速修复清单

- [ ] 确认 GitHub Secrets 中 `ALIYUN_ACR_USERNAME` = `nick1329599640`
- [ ] 确认 GitHub Secrets 中 `ALIYUN_ACR_PASSWORD` = `<你的访问凭证密码>`
- [ ] 访问凭证密码不是账号登录密码
- [ ] 密码中没有多余的空格或特殊字符
- [ ] 在阿里云控制台验证访问凭证密码是否正确
- [ ] 本地测试 docker login 是否成功

## ? 需要帮助？

如果按照以上步骤仍然无法解决问题，请提供：
1. GitHub Actions 的完整错误日志
2. 本地 docker login 的测试结果
3. 阿里云访问凭证页面的截图（隐藏敏感信息）

