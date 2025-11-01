# EdgeOne Pages 快速开始

## ? 3 步完成部署

### 步骤 1: 安装并登录

```bash
# 安装 CLI
npm install -g edgeone

# 登录（选择 China）
edgeone login

# 验证登录
edgeone whoami
```

### 步骤 2: 初始化项目（首次部署）

```bash
cd app_507029916162

# 初始化（选择 Node Functions）
edgeone pages init

# 关联项目（可选）
edgeone pages link
```

### 步骤 3: 部署

**方式 A: 使用脚本（推荐）**

```bash
# Windows
.\deploy-edgeone.bat

# Linux/Mac
chmod +x deploy-edgeone.sh
./deploy-edgeone.sh
```

**方式 B: 手动部署**

```bash
# 构建
npm run build

# 部署到生产环境
edgeone pages deploy

# 或部署到预览环境
edgeone pages deploy -e preview
```

## ?? 重要配置

### 1. 环境变量设置

在 EdgeOne Pages 控制台设置：

```
BACKEND_URL=https://your-backend-domain.com
```

### 2. 后端部署

**重要**: 您需要单独部署 Python FastAPI 后端。

推荐方案：
- ? Railway (https://railway.app) - 免费额度
- ? Render (https://render.com) - 免费额度  
- ? VPS (腾讯云 CVM、阿里云 ECS)

部署后，将后端 URL 设置为 `BACKEND_URL` 环境变量。

## ? 详细文档

查看 [EDGEONE_DEPLOYMENT.md](./EDGEONE_DEPLOYMENT.md) 获取完整指南。

## ? 常见问题

**Q: CLI 命令找不到？**
```bash
# 使用 npx
npx edgeone pages deploy
```

**Q: 部署后 API 请求失败？**
- 检查 `BACKEND_URL` 环境变量是否正确
- 确保后端服务正常运行
- 检查后端 CORS 配置

**Q: 如何本地调试？**
```bash
# 启动 EdgeOne 开发服务器
edgeone pages dev
```

访问 http://localhost:8088

---

? **完成！** 访问您的 EdgeOne Pages 域名查看部署结果。

