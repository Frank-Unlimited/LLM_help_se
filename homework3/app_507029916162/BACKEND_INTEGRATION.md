# 前后端对接完整指南

## ? 后端已完成的功能

### ? 核心文件
```
backend/
├── main.py              # FastAPI主应用，6个核心接口
├── models.py            # 完整的数据模型定义
├── database.py          # 内存数据库（可替换为PostgreSQL/MongoDB）
├── ai_service.py        # AI生成服务（支持接入真实LLM）
├── requirements.txt     # Python依赖包
├── env.example          # 环境变量示例
├── README.md           # 详细使用文档
├── start.sh/start.bat  # 快速启动脚本
└── test_api.py         # API测试脚本
```

### ? 已实现的6个接口

| 接口 | 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|------|
| 生成行程 | POST | /api/trips/generate | 根据用户需求生成完整行程 | ? |
| 获取详情 | GET | /api/trips/:tripId | 获取行程完整数据 | ? |
| 更新行程 | PUT | /api/trips/:tripId | 更新行程信息 | ? |
| 删除行程 | DELETE | /api/trips/:tripId | 删除行程 | ? |
| 记录开销 | POST | /api/trips/:tripId/expenses | 添加开销记录 | ? |
| 行程列表 | GET | /api/trips | 获取用户所有行程 | ? |

---

## ? 快速启动后端

### Windows系统
```bash
cd backend
start.bat
```

### Mac/Linux系统
```bash
cd backend
chmod +x start.sh
./start.sh
```

### 手动启动
```bash
cd backend
pip install -r requirements.txt
python main.py
```

启动成功后访问：
- API服务: http://localhost:3000
- 接口文档: http://localhost:3000/docs
- 健康检查: http://localhost:3000/api/health

---

## ? 前端已完成的对接

### ? 输入页 (src/pages/p-plan_input/index.tsx)
- ? 已实现参数收集和打包
- ? 已调用 `POST /api/trips/generate`
- ? 成功后跳转到详情页

### ? 详情页 (src/pages/p-plan_detail/index.tsx)
- ? 已获取 tripId
- ? 需要调用 `GET /api/trips/:tripId` 拉取数据
- ? 需要替换硬编码数据为真实数据

### ? API工具类 (src/utils/api.ts)
- ? 已封装所有接口方法
- ? 统一错误处理
- ? 自动处理认证

---

## ? 前端配置步骤

### 1. 配置API地址

在前端项目根目录创建 `.env.local`：

```bash
# API基础URL
VITE_API_BASE_URL=http://localhost:3000/api
```

### 2. 启动前端

```bash
cd app_507029916162
npm install
npm run dev
```

### 3. 测试完整流程

1. 打开前端 http://localhost:5173
2. 进入"行程规划"页面
3. 输入需求并选择偏好
4. 点击"生成智能行程"
5. 自动跳转到详情页（当前显示硬编码数据）

---

## ? 下一步：修改详情页拉取真实数据

### 当前状态（详情页第104-173行）
```typescript
useEffect(() => {
  const tripId = searchParams.get('tripId');
  if (tripId) {
    console.log('加载行程ID:', tripId);
    
    // TODO: 调用后端接口获取行程详情
    // 已有详细注释说明需要的数据结构
  }
}, [searchParams]);
```

### 需要实现
```typescript
useEffect(() => {
  const tripId = searchParams.get('tripId');
  if (tripId) {
    // 1. 添加loading状态
    setIsLoading(true);
    
    // 2. 调用API
    api.getTripDetail(tripId)
      .then(data => {
        // 3. 设置状态
        setTripData(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('加载行程失败:', error);
        alert('加载行程失败，请稍后重试');
        setIsLoading(false);
      });
  }
}, [searchParams]);
```

需要我帮你完成详情页的真实数据对接吗？

---

## ? 测试后端API

### 方法1：使用Swagger UI（推荐）
访问 http://localhost:3000/docs，可以直接测试所有接口

### 方法2：使用测试脚本
```bash
cd backend
pip install requests
python test_api.py
```

### 方法3：使用curl
```bash
# 1. 生成行程
curl -X POST http://localhost:3000/api/trips/generate \
  -H "Content-Type: application/json" \
  -d '{
    "requirementsText": "我想去日本东京，5天，预算1万元",
    "preferences": ["food", "family"],
    "travelType": ["food", "family"],
    "transportPreference": ["plane"],
    "accommodationType": ["comfortable"],
    "currency": "CNY"
  }'

# 2. 获取详情（替换trip_id）
curl http://localhost:3000/api/trips/trip_abc123456
```

---

## ? 完整的数据流

```
用户输入
   ↓
前端收集参数 (p-plan_input)
   ↓
POST /api/trips/generate
   ↓
后端AI生成行程 (ai_service.py)
   ↓
存储到数据库 (database.py)
   ↓
返回 tripId
   ↓
前端跳转 /plan-detail?tripId=xxx
   ↓
调用 GET /api/trips/:tripId
   ↓
后端返回完整数据
   ↓
前端渲染展示
```

---

## ? 常见问题

### Q: CORS错误
**A**: 确保后端 `env.example` 中配置了前端地址：
```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Q: 连接被拒绝
**A**: 
1. 检查后端是否已启动
2. 确认端口是否为3000
3. 查看防火墙设置

### Q: 数据重启后丢失
**A**: 当前使用内存存储，正常现象。生产环境需配置真实数据库。

### Q: 如何接入真实LLM？
**A**: 参考 `backend/ai_service.py` 中的注释，配置API密钥即可

---

## ? 性能优化建议

### 生产环境清单
- [ ] 替换内存数据库为PostgreSQL/MongoDB
- [ ] 接入真实LLM服务
- [ ] 添加用户认证（JWT）
- [ ] 配置Redis缓存
- [ ] 使用Nginx反向代理
- [ ] 配置日志系统
- [ ] 添加监控告警

### 数据库迁移示例
```python
# 使用SQLAlchemy + PostgreSQL
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://user:password@localhost/tuzhixing"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
```

---

## ? API响应示例

### GET /api/trips/:tripId 完整响应
```json
{
  "tripId": "trip_abc123",
  "tripName": "日本东京美食之旅",
  "destination": "日本东京",
  "startDate": "2024-11-20",
  "endDate": "2024-11-24",
  "totalDays": 5,
  "status": "draft",
  "budget": {
    "total": 10000,
    "currency": "CNY",
    "spent": 1200,
    "remaining": 8800
  },
  "budgetBreakdown": [
    {"category": "交通", "allocated": 2500, "spent": 0},
    {"category": "住宿", "allocated": 3500, "spent": 0},
    {"category": "餐饮", "allocated": 2500, "spent": 1200},
    {"category": "门票", "allocated": 1000, "spent": 0},
    {"category": "其他", "allocated": 500, "spent": 0}
  ],
  "itinerary": [
    {
      "day": 1,
      "date": "2024-11-20",
      "title": "第1天 - 11月20日 (周三)",
      "summary": "抵达东京，浅草寺观光",
      "activities": [
        {
          "id": "activity-1-1",
          "time": "09:00",
          "title": "浅草寺参观",
          "category": "观光",
          "location": "浅草寺",
          "description": "参观东京最古老的寺庙",
          "image": "https://...",
          "estimatedCost": 0
        }
      ]
    }
  ],
  "expenses": [
    {
      "expenseId": "exp_xyz789",
      "amount": 1200,
      "category": "餐饮",
      "date": "2024-11-20",
      "description": "午餐",
      "createdAt": "2024-11-20T12:30:00Z"
    }
  ],
  "notes": [
    "已为您规划5天日本东京之旅",
    "根据您的偏好优先推荐了美食景点"
  ],
  "createdAt": "2024-11-20T10:00:00Z",
  "updatedAt": "2024-11-20T12:30:00Z"
}
```

---

## ? 总结

### 已完成
? 后端6个核心接口  
? 前端API工具类  
? 输入页参数打包  
? 完整的文档和测试  

### 待完成
? 详情页数据对接  
? 开销记录功能对接  
? 行程编辑保存对接  
? 行程列表页对接  

**下一步最重要的工作**：修改详情页，根据tripId拉取并展示真实数据！

需要我现在就帮你完成详情页的数据对接吗？

