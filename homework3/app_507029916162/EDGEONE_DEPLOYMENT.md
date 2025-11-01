# EdgeOne Pages 部署指南

本指南将帮助您将项目部署到腾讯云 EdgeOne Pages。

## ? 目录

1. [准备工作](#准备工作)
2. [项目配置](#项目配置)
3. [部署步骤](#部署步骤)
4. [后端处理方案](#后端处理方案)
5. [环境变量配置](#环境变量配置)
6. [故障排查](#故障排查)

## ? 准备工作

### 1. 安装 EdgeOne CLI

```bash
npm install -g edgeone
```

验证安装：
```bash
edgeone -v
```

### 2. 登录 EdgeOne

```bash
edgeone login
```

按照提示选择：
- **China**（国内站）- 推荐用于中国区域
- **Global**（国际站）

登录后验证：
```bash
edgeone whoami
```

## ? 项目配置

项目已包含以下配置文件：

- `edgeone.json` - EdgeOne Pages 配置文件
- `node-functions/api/proxy.js` - API 代理函数

### edgeone.json 说明

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev"
}
```

- `buildCommand`: 构建前端项目的命令
- `outputDirectory`: 构建输出目录（Vite 默认是 `dist`）
- `devCommand`: 本地开发命令

## ? 部署步骤

### 方法一：使用 CLI 本地部署（推荐）

1. **初始化项目**（首次部署）
   ```bash
   cd app_507029916162
   edgeone pages init
   ```
   
   按照提示选择：
   - 函数类型：选择 **Node Functions**
   - 是否创建示例函数：选择 **否**（我们已有自定义函数）

2. **关联项目**（可选，用于同步环境变量）
   ```bash
   edgeone pages link
   ```
   
   输入您在 EdgeOne Pages 控制台创建的项目名称。

3. **构建并部署**
   ```bash
   # 生产环境部署
   edgeone pages deploy
   
   # 预览环境部署
   edgeone pages deploy -e preview
   ```

### 方法二：通过 Git 仓库自动部署

1. **在 EdgeOne Pages 控制台创建项目**
   - 选择"导入 Git 仓库"
   - 连接您的 GitHub/GitLab 仓库
   - 配置构建命令：`npm run build`
   - 配置输出目录：`dist`

2. **推送代码触发部署**
   ```bash
   git add .
   git commit -m "Deploy to EdgeOne Pages"
   git push
   ```

## ? 后端处理方案

由于您的后端是 **Python FastAPI**，而 EdgeOne Pages Functions 主要支持 **Node.js**，您有以下选择：

### 方案一：单独部署后端（推荐）

1. **部署后端到云服务**
   - **选项 A**: 使用 VPS（如：腾讯云 CVM、阿里云 ECS）
   - **选项 B**: 使用 Serverless 平台（如：Railway、Render、Fly.io）
   - **选项 C**: 使用腾讯云 SCF（Serverless Cloud Function）- 需要转换为 Serverless 格式

2. **配置 API 代理**
   
   在 EdgeOne Pages 控制台设置环境变量：
   ```
   BACKEND_URL=https://your-backend-domain.com
   ```
   
   或者如果后端在本地运行（仅开发环境）：
   ```
   BACKEND_URL=http://localhost:3000
   ```

3. **API 请求流程**
   ```
   前端 → EdgeOne Pages Function (/api/*) → 后端服务 (BACKEND_URL)
   ```

### 方案二：将后端转换为 Node.js Functions

将 Python 后端逻辑转换为 Node.js，在 `node-functions` 目录下创建对应的函数：

```
node-functions/
  api/
    trips/
      generate.js      # POST /api/trips/generate
      [tripId].js       # GET/PUT/DELETE /api/trips/:tripId
    auth/
      login.js          # POST /api/auth/login
      register.js       # POST /api/auth/register
    ...
```

**注意**: 这需要重写所有后端逻辑，工作量较大。

### 方案三：使用 EdgeOne KV 存储（适用于简单数据）

对于不需要复杂计算的功能，可以使用 EdgeOne KV 存储替代数据库。

## ? 环境变量配置

### 在 EdgeOne Pages 控制台配置

1. 登录 [EdgeOne Pages 控制台](https://edgeone.cloud.tencent.com)
2. 进入您的项目
3. 点击"环境变量"或"Settings" → "Environment Variables"
4. 添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `BACKEND_URL` | `https://your-backend.com` | 后端服务地址 |
| `VITE_API_BASE_URL` | `/api` | 前端 API 基础路径（通常保持默认） |

### 本地开发环境变量

创建 `.env.local` 文件（已添加到 .gitignore）：

```env
VITE_API_BASE_URL=/api
BACKEND_URL=http://localhost:3000
```

## ? 故障排查

### 1. CLI 命令找不到

```bash
# 使用 npx 运行
npx edgeone pages deploy

# 或检查全局安装
npm list -g edgeone
```

### 2. 构建失败

- 检查 `package.json` 中的 `build` 脚本
- 确保所有依赖已安装：`npm install`
- 查看构建日志中的具体错误信息

### 3. API 请求失败（502 Bad Gateway）

- **检查后端服务是否运行**
  ```bash
  # 在 backend 目录下
  python app.py
  ```

- **检查 BACKEND_URL 环境变量**
  - 确保在 EdgeOne Pages 控制台正确设置
  - 确保 URL 格式正确（包含 http:// 或 https://）

- **检查 CORS 配置**
  - 后端需要在 `app.py` 中允许 EdgeOne Pages 的域名
  ```python
  allowed_origins = os.getenv(
      "ALLOWED_ORIGINS", 
      "http://localhost:5173,http://localhost:3000,https://your-pages-domain.edgeone.app"
  ).split(",")
  ```

### 4. 函数路径映射问题

EdgeOne Pages Functions 的路径映射规则：
- `node-functions/api/proxy.js` → `/api/*`
- `node-functions/api/trips/generate.js` → `/api/trips/generate`

如果使用代理函数，所有 `/api/*` 请求都会路由到 `proxy.js`。

### 5. 本地开发

```bash
# 启动本地开发服务器（包含函数调试）
edgeone pages dev

# 或者单独启动前端和后端
# 终端1: 前端
npm run dev

# 终端2: 后端
cd backend
python app.py
```

## ? 参考资源

- [EdgeOne Pages 官方文档](https://edgeone.cloud.tencent.com/pages/document/162936923278893056)
- [EdgeOne CLI 文档](https://edgeone.cloud.tencent.com/pages/document/162936923278893056#edgeone-cli)
- [Node Functions 指南](https://edgeone.cloud.tencent.com/pages/document/162936923278893056#node-functions)

## ? 部署清单

- [x] 安装 EdgeOne CLI
- [x] 创建 edgeone.json 配置
- [x] 创建 Node Functions 代理
- [ ] 登录 EdgeOne CLI
- [ ] 初始化项目（首次）
- [ ] 配置环境变量（BACKEND_URL）
- [ ] 部署后端服务
- [ ] 测试 API 连接
- [ ] 执行部署命令
- [ ] 验证部署结果

## ? 需要帮助？

如果遇到问题：
1. 查看 EdgeOne Pages 控制台的部署日志
2. 检查浏览器控制台的网络请求
3. 查看后端服务的日志
4. 参考官方文档或联系技术支持

---

**提示**: 首次部署建议先在预览环境（preview）测试，确认无误后再部署到生产环境（production）。

