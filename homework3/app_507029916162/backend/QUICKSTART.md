# ? 后端快速启动指南

## 一分钟启动

### Windows用户
```bash
# 双击运行
start.bat
```

### Mac/Linux用户
```bash
chmod +x start.sh
./start.sh
```

## 手动启动（推荐）

### 1. 安装依赖
```bash
# 确保在 backend 目录下
cd backend

# 安装依赖
pip install -r requirements.txt
```

### 2. 启动服务
```bash
python main.py
```

### 3. 验证
访问 http://localhost:3000/api/health 
看到 `"status": "healthy"` 即成功！

## 完整功能测试

### 测试方法1：Swagger UI（最简单）
1. 启动服务
2. 访问 http://localhost:3000/docs
3. 点击任意接口，填写参数，点击"Execute"

### 测试方法2：测试脚本
```bash
pip install requests
python test_api.py
```

### 测试方法3：前端直接调用
1. 启动后端（3000端口）
2. 启动前端（5173端口）
3. 在前端输入旅行需求，点击生成

## 配置说明

### 环境变量（可选）
复制 `env.example` 为 `.env`，按需修改：

```bash
# 服务端口（默认3000）
PORT=3000

# CORS允许的前端地址
ALLOWED_ORIGINS=http://localhost:5173

# 开发模式（自动重载）
DEBUG=true
```

### AI服务配置（可选）
当前使用**模拟数据**生成行程，无需配置。

如需接入真实LLM：
```bash
# OpenAI
OPENAI_API_KEY=sk-xxxx

# 或国内LLM（豆包/通义千问等）
# 参考 ai_service.py 中的注释
```

## 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 生成行程 | POST | /api/trips/generate | 核心功能 |
| 获取详情 | GET | /api/trips/:tripId | 展示行程 |
| 更新行程 | PUT | /api/trips/:tripId | 编辑保存 |
| 删除行程 | DELETE | /api/trips/:tripId | 删除 |
| 记录开销 | POST | /api/trips/:tripId/expenses | 记账 |
| 行程列表 | GET | /api/trips | 我的行程 |

详细文档见 `README.md`

## 常见问题

### ? 端口被占用
```bash
# 修改端口
# 方法1：修改 .env 中的 PORT
# 方法2：直接指定
uvicorn main:app --port 8000
```

### ? CORS错误
确保 `.env` 中配置了前端地址：
```
ALLOWED_ORIGINS=http://localhost:5173
```

### ? 模块未找到
```bash
pip install -r requirements.txt
```

### ? 数据重启后丢失？
正常现象。当前使用内存存储，重启会清空。
生产环境建议配置PostgreSQL。

## 下一步

? 后端已完成  
? 前端详情页需要对接（见 `BACKEND_INTEGRATION.md`）

启动成功后，打开 http://localhost:3000/docs 查看API文档！

