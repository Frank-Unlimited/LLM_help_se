# 途智行 - AI智能旅行规划平台

基于React + TypeScript + FastAPI的智能旅行规划系统

![项目进度](https://img.shields.io/badge/进度-70%25-yellow)
![前端](https://img.shields.io/badge/前端-React_18-blue)
![后端](https://img.shields.io/badge/后端-FastAPI-green)

---

## ? 项目简介

途智行是一个AI驱动的智能旅行规划平台，能够根据用户的自然语言需求，自动生成详细的旅行计划，包括：
- ? 每日行程安排
- ? 预算分配与管理
- ? 景点推荐与路线
- ? 开销记录与统计
- ? 行程分享与导出

---

## ? 快速开始

### 1. 启动后端（必须先启动）

```bash
# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

后端启动后访问: http://localhost:3000/docs 查看API文档

### 2. 启动前端

```bash
# 在项目根目录
npm install
npm run dev
```

前端启动后访问: http://localhost:5173

### 3. 配置环境变量

**前端** - 创建 `.env.local`:
```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

**后端** - 复制 `backend/env.example` 为 `backend/.env`:
```bash
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173
DEBUG=true
```

---

## ? 项目结构

```
app_507029916162/
├── backend/                    # Python后端
│   ├── main.py                # FastAPI主应用（6个核心接口）
│   ├── models.py              # 数据模型定义
│   ├── database.py            # 数据存储层
│   ├── ai_service.py          # AI生成服务
│   ├── requirements.txt       # Python依赖
│   ├── start.sh / start.bat   # 快速启动脚本
│   ├── test_api.py            # API测试脚本
│   └── README.md              # 后端详细文档
│
├── src/                        # React前端
│   ├── pages/                 # 页面组件
│   │   ├── p-plan_input/      # 行程输入页 ? 已对接
│   │   ├── p-plan_detail/     # 行程详情页 ? 需对接
│   │   ├── p-my_trips/        # 我的行程页 ? 需对接
│   │   └── p-budget_manage/   # 预算管理页 ? 需对接
│   ├── utils/
│   │   └── api.ts             # API工具类 ?
│   └── router/                # 路由配置
│
├── PROJECT_STATUS.md          # ? 项目完成状态
├── BACKEND_INTEGRATION.md     # ? 前后端对接指南
└── README.md                  # 本文件
```

---

## ? 功能清单

### ? 已完成

#### 后端API（100%）
- ? POST `/api/trips/generate` - 生成行程
- ? GET `/api/trips/:tripId` - 获取详情
- ? PUT `/api/trips/:tripId` - 更新行程
- ? DELETE `/api/trips/:tripId` - 删除行程
- ? POST `/api/trips/:tripId/expenses` - 记录开销
- ? GET `/api/trips` - 行程列表

#### 前端界面（60%）
- ? 首页、登录页、个人中心
- ? **行程输入页（已对接后端）**
- ? 行程详情页（UI完成，需拉取数据）
- ? 我的行程页（UI完成，需对接）
- ? 预算管理页（UI完成，需对接）

### ? 待完成

1. **行程详情页数据对接**（优先级最高）
   - 根据tripId拉取真实数据
   - 替换硬编码的模拟数据
   
2. **我的行程页对接**
   - 调用列表接口
   - 实现筛选和分页

3. **预算管理功能对接**
   - 记录开销
   - 实时更新预算

---

## ? 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite 5
- **路由**: React Router v6
- **样式**: CSS Modules
- **HTTP**: Fetch API

### 后端
- **框架**: FastAPI 0.104.1
- **语言**: Python 3.8+
- **数据库**: 内存存储（可替换PostgreSQL）
- **AI**: 模拟生成（可接入OpenAI/豆包）
- **文档**: Swagger UI 自动生成

---

## ? 当前进度

```
总体进度: ████████████???????? 70%

后端: ████████████████████ 100% (6/6接口)
前端: ████████████????????  60% (UI完成，部分对接)
对接: ████████????????????  40% (1/4页面)
```

---

## ? 测试

### 测试后端API

**方法1**: Swagger UI（推荐）
```
http://localhost:3000/docs
```

**方法2**: 测试脚本
```bash
cd backend
pip install requests
python test_api.py
```

**方法3**: 完整流程测试
1. 启动后端和前端
2. 访问前端 http://localhost:5173
3. 进入"行程规划"
4. 输入需求并生成
5. 查看生成结果

---

## ? 文档

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - 项目完成状态详情
- **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** - 前后端对接指南
- **[backend/README.md](./backend/README.md)** - 后端API详细文档
- **[backend/QUICKSTART.md](./backend/QUICKSTART.md)** - 后端快速启动

---

## ? 常见问题

### 1. 后端启动失败
```bash
# 检查Python版本（需要3.8+）
python --version

# 重新安装依赖
pip install -r backend/requirements.txt
```

### 2. CORS错误
确保后端 `backend/.env` 中配置了前端地址：
```
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. 前端API调用失败
1. 确认后端已启动（访问 http://localhost:3000/api/health）
2. 检查前端 `.env.local` 配置
3. 打开浏览器控制台查看Network

### 4. 数据重启后丢失
正常现象。当前使用内存存储，重启会清空。生产环境需配置PostgreSQL。

---

## ? 下一步工作

### 最重要的任务：详情页数据对接

当前状态：
- ? 后端接口已完成
- ? 前端UI已完成
- ? 已获取tripId
- ? **需要调用API拉取真实数据**

完成后，用户就能看到AI生成的真实行程了！

详见 **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)**

---

## ? 开发团队

如有问题，请参考：
1. `PROJECT_STATUS.md` - 了解项目整体状态
2. `BACKEND_INTEGRATION.md` - 前后端对接指南
3. `backend/README.md` - API详细文档
4. Swagger UI - http://localhost:3000/docs

---

## ? 许可证

MIT License

---

## ? 快速链接

- [查看项目状态](./PROJECT_STATUS.md)
- [后端API文档](./backend/README.md)
- [前后端对接指南](./BACKEND_INTEGRATION.md)
- [在线API文档](http://localhost:3000/docs) （需先启动后端）

**开始开发**: 先阅读 `PROJECT_STATUS.md` 了解当前进度！
