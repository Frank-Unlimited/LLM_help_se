# 途智行 - 智能旅行规划平台

# Gitub仓库地址：

[LLM_help_se/homework3 at main · Frank-Unlimited/LLM_help_se](https://github.com/Frank-Unlimited/LLM_help_se/tree/main/homework3)

## 📦 Docker 镜像部署指南

本指南将帮助助教快速部署并测试项目。

---

## 🚀 快速开始

### 1. 拉取 Docker 镜像

```bash
# 登录阿里云容器镜像仓库
docker login crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com \
  --username hhc510105200301150090 \
  --password-stdin
# 输入 ACR 密码（请联系项目负责人获取）

# 拉取最新镜像
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
```

### 2. 运行 Docker 容器

#### 标准配置（推荐，适合内存 >= 512MB）

```bash
docker run -d \
  --name tuzhixing-app \
  -p 6666:6666 \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
```

#### 低内存配置（适合内存 < 512MB，如 409MB）

```bash
docker run -d \
  --name tuzhixing-app \
  --memory="350m" \
  --memory-swap="400m" \
  --cpus="0.5" \
  -p 6666:6666 \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
```

### 3. 验证容器运行状态

```bash
# 查看容器状态
docker ps | grep tuzhixing-app

# 查看容器日志
docker logs tuzhixing-app

# 查看资源使用情况
docker stats tuzhixing-app
```

### 4. 访问应用

在浏览器中访问：

- **本地服务器**：`http://localhost:6666`
- **远程服务器**：`http://your-server-ip:6666`

> **注意**：如果需要使用语音输入功能，必须使用 HTTPS 或 localhost。详情请参考 [`app_507029916162/DEPLOY_TO_SERVER.md`](./app_507029916162/DEPLOY_TO_SERVER.md#-https-配置语音功能必需)

---

## ⚙️ 配置 API Keys

### 1. 打开配置管理窗口

1. 在浏览器中访问应用首页（`http://localhost` 或 `http://your-server-ip`）
2. 点击页面右上角的 **"API 配置"** 按钮（齿轮图标）

### 2. 填写配置信息

配置窗口分为两部分：

#### 📱 前端配置（立即生效）

这些配置会保存在浏览器 localStorage 中，保存后页面会自动刷新生效：

- **VITE_ASR_SECRET_ID**：腾讯云 ASR（语音识别）SecretId
- **VITE_ASR_SECRET_KEY**：腾讯云 ASR SecretKey
- **VITE_ASR_APP_ID**：腾讯云 ASR AppId
- **VITE_AMAP_API_KEY**：高德地图 API Key（用于地图显示）
- **VITE_AMAP_SECURITY_JS_CODE**：高德地图安全密钥（JS API）

#### 🔧 后端配置（需要重启容器生效）

这些配置会保存到服务器的 `.env` 文件中：

- **COZE_API_TOKEN**：Coze API Token（必需，用于 AI 行程生成）
- **COZE_WORKFLOW_ID**：Coze 行程生成 Workflow ID（必需）
- **COZE_EXPENSE_WORKFLOW_ID**：Coze 语音消费解析 Workflow ID（必需）
- **HOST**：后端监听地址（默认：`0.0.0.0`）
- **PORT**：后端监听端口（默认：`3000`）
- **DEBUG**：调试模式（默认：`true`）
- **ALLOWED_ORIGINS**：允许的跨域来源（默认：`http://localhost:5173,http://localhost:3000`）

### 3. 批量导入配置（可选）

支持一键批量导入配置：

1. 在配置窗口中找到 **"批量导入配置"** 区域
2. 粘贴环境变量格式的配置文本（格式：`KEY=VALUE`）
3. 点击 **"解析并填充"** 按钮
4. 系统会自动识别并填充到对应字段

**示例格式**：
```
VITE_ASR_SECRET_ID=your_secret_id
VITE_ASR_SECRET_KEY=your_secret_key
VITE_ASR_APP_ID=your_app_id
VITE_AMAP_API_KEY=your_amap_key
COZE_API_TOKEN=your_coze_token
COZE_WORKFLOW_ID=your_workflow_id
COZE_EXPENSE_WORKFLOW_ID=your_expense_workflow_id
```

### 4. 保存配置

1. 填写完所有配置后，点击 **"一键保存所有配置"** 按钮
2. 前端配置会立即生效（页面自动刷新）
3. 后端配置需要重启容器才能生效：

```bash
# 重启容器使后端配置生效
docker restart tuzhixing-app

# 或者停止并重新运行
docker stop tuzhixing-app
docker rm tuzhixing-app
docker run -d \
  --name tuzhixing-app \
  -p 6666:6666 \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
```

### 5. 验证配置

1. 前端配置验证：
   - 尝试使用语音输入功能（在行程规划页面）
   - 如果提示缺少配置，说明前端配置未生效，请重新保存

2. 后端配置验证：
   - 尝试生成一个测试行程
   - 查看容器日志：`docker logs tuzhixing-app`
   - 如果出现 API 错误，检查后端配置是否正确

---

## 📋 完整操作流程示例

```bash
# 1. 拉取镜像
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest

# 2. 运行容器
docker run -d \
  --name tuzhixing-app \
  -p 6666:6666 \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest

# 3. 等待容器启动（约 10-20 秒）
sleep 15

# 4. 查看日志确认启动成功
docker logs tuzhixing-app

# 5. 在浏览器访问 http://localhost
# 6. 点击右上角 "API 配置" 按钮
# 7. 填写所有 API Keys
# 8. 点击 "一键保存所有配置"
# 9. 重启容器使后端配置生效
docker restart tuzhixing-app

# 10. 验证应用功能
# - 测试语音输入
# - 测试行程生成
# - 查看日志确认无错误
```

---

## 🔍 常见问题

### Q1: 无法访问应用（连接被拒绝）

**检查步骤**：
1. 确认容器正在运行：`docker ps | grep tuzhixing-app`
2. 确认端口映射正确：`docker port tuzhixing-app`
3. 检查防火墙设置（服务器需开放 80 端口）
4. 查看容器日志：`docker logs tuzhixing-app`

### Q2: 语音输入功能无法使用

**可能原因**：
- 未配置前端 ASR 相关密钥
- 浏览器安全策略（需要使用 HTTPS 或 localhost）
- 麦克风权限未授予

**解决方法**：
1. 检查前端配置（VITE_ASR_SECRET_ID, VITE_ASR_SECRET_KEY, VITE_ASR_APP_ID）是否已填写
2. 如果是远程服务器，需要配置 HTTPS（参考 [`DEPLOY_TO_SERVER.md`](./app_507029916162/DEPLOY_TO_SERVER.md#-https-配置语音功能必需)）
3. 在浏览器设置中允许网站使用麦克风

### Q3: 行程生成失败（AI 功能不可用）

**检查步骤**：
1. 确认后端配置已填写（COZE_API_TOKEN, COZE_WORKFLOW_ID）
2. 确认容器已重启：`docker restart tuzhixing-app`
3. 查看后端日志：`docker logs tuzhixing-app | grep -i error`
4. 检查 API Token 是否有效

### Q4: 内存不足导致容器崩溃

**解决方法**：
- 使用低内存配置运行容器（见上方"低内存配置"）
- 或者参考 [`MEMORY_OPTIMIZATION.md`](./app_507029916162/MEMORY_OPTIMIZATION.md)

### Q5: 如何查看详细日志

```bash
# 查看所有日志
docker logs tuzhixing-app

# 实时跟踪日志
docker logs -f tuzhixing-app

# 查看最近 100 行日志
docker logs --tail 100 tuzhixing-app

# 查看后端日志（容器内）
docker exec tuzhixing-app cat /var/log/supervisor/backend.out.log

# 查看 Nginx 日志（容器内）
docker exec tuzhixing-app cat /var/log/nginx/error.log
```

---

## 🛠️ 常用管理命令

```bash
# 停止容器
docker stop tuzhixing-app

# 启动容器
docker start tuzhixing-app

# 重启容器
docker restart tuzhixing-app

# 删除容器
docker rm -f tuzhixing-app

# 查看容器资源使用
docker stats tuzhixing-app

# 进入容器（调试用）
docker exec -it tuzhixing-app sh

# 更新镜像（拉取最新版本）
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
docker stop tuzhixing-app
docker rm tuzhixing-app
docker run -d \
  --name tuzhixing-app \
  -p 6666:6666 \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
```

---

## 📚 更多文档

- **服务器部署指南**：[`app_507029916162/DEPLOY_TO_SERVER.md`](./app_507029916162/DEPLOY_TO_SERVER.md)
- **低内存优化指南**：[`app_507029916162/MEMORY_OPTIMIZATION.md`](./app_507029916162/MEMORY_OPTIMIZATION.md)
- **HTTPS 配置指南**：[`app_507029916162/DEPLOY_TO_SERVER.md#-https-配置语音功能必需`](./app_507029916162/DEPLOY_TO_SERVER.md#-https-配置语音功能必需)

---

## 📞 技术支持

如遇到问题，请：
1. 查看容器日志：`docker logs tuzhixing-app`
2. 检查配置是否正确
3. 参考上述常见问题解决方案
4. 联系项目负责人获取 ACR 登录密码

---

**祝使用愉快！** 🎉

