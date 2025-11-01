# 途智行后端服务

基于 FastAPI 的智能旅行规划后端API

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `env.example` 为 `.env` 并配置：

```bash
cp env.example .env
```

编辑 `.env` 文件：
```bash
# LLM配置（可选，当前使用模拟数据）
OPENAI_API_KEY=your_key_here

# 服务配置
HOST=0.0.0.0
PORT=3000
DEBUG=true

# CORS配置（前端地址）
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. 启动服务

```bash
python main.py
```

或使用 uvicorn：
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 3000
```

### 4. 访问API文档

启动后访问：
- Swagger UI: http://localhost:3000/docs
- ReDoc: http://localhost:3000/redoc
- 健康检查: http://localhost:3000/api/health

---

## API接口说明

### 1. POST /api/trips/generate
生成新的旅行计划

**请求体**：
```json
{
  "requirementsText": "我想去日本东京，5天，预算1万元",
  "preferences": ["food", "family"],
  "travelType": ["food", "family"],
  "transportPreference": ["plane"],
  "accommodationType": ["comfortable"],
  "currency": "CNY"
}
```

**响应**：
```json
{
  "tripId": "trip_abc123456",
  "status": "success",
  "message": "行程生成成功"
}
```

---

### 2. GET /api/trips/:tripId
获取行程详情

**响应**：完整的行程数据，包含每日行程、预算、开销记录等

---

### 3. PUT /api/trips/:tripId
更新行程信息

**请求体**：
```json
{
  "tripName": "新的行程名称",
  "budget": {
    "total": 15000
  }
}
```

---

### 4. DELETE /api/trips/:tripId
删除行程

**响应**：
```json
{
  "success": true,
  "message": "行程删除成功"
}
```

---

### 5. POST /api/trips/:tripId/expenses
记录开销

**请求体**：
```json
{
  "amount": 1200,
  "category": "餐饮",
  "date": "2024-11-20",
  "description": "午餐"
}
```

**响应**：
```json
{
  "expenseId": "exp_xyz789",
  "success": true,
  "updatedBudget": {
    "total": 10000,
    "spent": 1200,
    "remaining": 8800,
    "currency": "CNY"
  }
}
```

---

### 6. GET /api/trips
获取用户所有行程列表

**查询参数**：
- `status`: draft | active | completed（可选）
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）

**示例**：
```
GET /api/trips?status=active&page=1&limit=10
```

**响应**：
```json
{
  "trips": [...],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

---

## 项目结构

```
backend/
├── main.py              # FastAPI主应用
├── models.py            # 数据模型定义
├── database.py          # 数据存储层（当前为内存存储）
├── ai_service.py        # AI服务（LLM调用）
├── requirements.txt     # Python依赖
├── env.example          # 环境变量示例
└── README.md           # 本文件
```

---

## 数据存储

### 当前方案：内存存储
- 优点：无需配置数据库，快速开发测试
- 缺点：重启服务后数据丢失

### 生产环境建议：
使用 PostgreSQL 或 MongoDB

**PostgreSQL 示例**：
```python
# 安装依赖
pip install sqlalchemy psycopg2-binary

# 配置DATABASE_URL
DATABASE_URL=postgresql://user:password@localhost/tuzhixing
```

---

## AI服务配置

### 方案一：使用模拟数据（默认）
无需配置，直接启动即可用于开发测试

### 方案二：接入OpenAI
```bash
# .env
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
```

修改 `ai_service.py`，取消注释 `call_openai_gpt4()` 函数

### 方案三：接入国内LLM
- 豆包（字节跳动）
- 通义千问（阿里）
- 文心一言（百度）

参考 `ai_service.py` 中的示例代码

---

## 开发调试

### 查看日志
服务启动后会显示所有请求日志

### 测试API
使用 Swagger UI（http://localhost:3000/docs）可直接测试所有接口

### 数据持久化
当前使用内存存储，重启后数据会丢失。如需持久化：
1. 替换 `database.py` 为真实数据库实现
2. 或使用文件存储（pickle/json）

---

## 常见问题

### Q: 如何修改端口？
A: 修改 `.env` 中的 `PORT=3000`

### Q: CORS错误？
A: 确保 `.env` 中的 `ALLOWED_ORIGINS` 包含前端地址

### Q: 如何接入真实LLM？
A: 参考 `ai_service.py` 中的注释说明

### Q: 数据如何持久化？
A: 当前为内存存储，可替换为PostgreSQL/MongoDB

---

## 部署

### Docker部署（推荐）
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

### 传统部署
```bash
# 使用gunicorn（生产环境）
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:3000
```

---

## 许可证
MIT License

