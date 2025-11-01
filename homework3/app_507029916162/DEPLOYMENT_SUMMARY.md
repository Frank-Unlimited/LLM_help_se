# EdgeOne Pages 部署配置总结

## ? 已完成的配置

### 1. 核心配置文件

- ? **edgeone.json** - EdgeOne Pages 主配置文件
  - 构建命令：`npm run build`
  - 输出目录：`dist`
  - 开发命令：`npm run dev`

### 2. Node Functions

- ? **node-functions/api/proxy.js** - API 代理函数
  - 处理所有 `/api/*` 请求
  - 转发到后端服务（通过 `BACKEND_URL` 环境变量配置）
  - 支持 CORS

### 3. 部署脚本

- ? **deploy-edgeone.sh** - Linux/Mac 部署脚本
- ? **deploy-edgeone.bat** - Windows 部署脚本

### 4. 文档

- ? **EDGEONE_DEPLOYMENT.md** - 完整部署指南
- ? **EDGEONE_QUICKSTART.md** - 快速开始指南
- ? **DEPLOYMENT_SUMMARY.md** - 本文件

### 5. Git 配置

- ? 更新 `.gitignore`，添加 EdgeOne 相关文件

## ? 项目结构

```
app_507029916162/
├── edgeone.json              # EdgeOne Pages 配置
├── node-functions/
│   └── api/
│       └── proxy.js          # API 代理函数
├── deploy-edgeone.sh        # Linux/Mac 部署脚本
├── deploy-edgeone.bat       # Windows 部署脚本
├── EDGEONE_DEPLOYMENT.md    # 详细部署文档
├── EDGEONE_QUICKSTART.md    # 快速开始
└── DEPLOYMENT_SUMMARY.md    # 本文件
```

## ? 下一步操作

### 立即执行（必须）

1. **登录 EdgeOne CLI**
   ```bash
   edgeone login
   ```
   选择 `China`（国内站）

2. **初始化项目（首次部署）**
   ```bash
   cd app_507029916162
   edgeone pages init
   ```
   选择 `Node Functions`，示例函数选择"否"

3. **配置环境变量**
   
   在 EdgeOne Pages 控制台设置：
   ```
   BACKEND_URL=https://your-backend-url.com
   ```

4. **部署后端服务**
   
   ?? **重要**: Python FastAPI 后端需要单独部署
   
   推荐平台：
   - Railway: https://railway.app
   - Render: https://render.com
   - 腾讯云 CVM/SCF
   
   部署后，将 URL 设置为 `BACKEND_URL` 环境变量。

5. **执行部署**
   ```bash
   # 方式1: 使用脚本
   ./deploy-edgeone.sh        # Linux/Mac
   .\deploy-edgeone.bat       # Windows
   
   # 方式2: 手动部署
   npm run build
   edgeone pages deploy
   ```

## ? 配置说明

### edgeone.json

```json
{
  "buildCommand": "npm run build",    // Vite 构建命令
  "outputDirectory": "dist",          // Vite 输出目录
  "devCommand": "npm run dev"         // 本地开发命令
}
```

### Node Functions 路径映射

EdgeOne Pages 会自动将函数文件映射到 URL：

- `node-functions/api/proxy.js` → `/api/*`

所有 `/api/*` 请求都会被 `proxy.js` 处理，然后转发到后端服务。

### 环境变量

必须在 EdgeOne Pages 控制台配置：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `BACKEND_URL` | 后端服务地址 | `https://api.example.com` |

## ? 注意事项

1. **后端部署是必须的**
   - EdgeOne Pages Functions 主要支持 Node.js
   - Python FastAPI 后端需要单独部署
   - 使用 `proxy.js` 作为中间层转发请求

2. **CORS 配置**
   - 后端需要在 `app.py` 中添加 EdgeOne Pages 域名到允许列表
   ```python
   allowed_origins = [
       "http://localhost:5173",
       "http://localhost:3000",
       "https://your-pages-domain.edgeone.app"
   ]
   ```

3. **本地开发**
   ```bash
   # 使用 EdgeOne 开发服务器（包含函数调试）
   edgeone pages dev
   
   # 或分别启动前后端
   npm run dev              # 前端
   cd backend && python app.py  # 后端
   ```

## ? 验证部署

部署成功后：

1. 访问 EdgeOne Pages 提供的域名
2. 打开浏览器开发者工具（F12）
3. 检查 Network 标签页的 API 请求
4. 确认请求能正常转发到后端

## ? 参考文档

- [EdgeOne Pages 官方文档](https://edgeone.cloud.tencent.com/pages/document/162936923278893056)
- [快速开始指南](./EDGEONE_QUICKSTART.md)
- [完整部署文档](./EDGEONE_DEPLOYMENT.md)

## ? 获取帮助

如果遇到问题：

1. 查看 EdgeOne Pages 控制台的部署日志
2. 检查浏览器控制台的错误信息
3. 查看后端服务的日志
4. 参考故障排查章节（在 EDGEONE_DEPLOYMENT.md 中）

---

**提示**: 建议先在预览环境（preview）测试，确认无误后再部署到生产环境。

