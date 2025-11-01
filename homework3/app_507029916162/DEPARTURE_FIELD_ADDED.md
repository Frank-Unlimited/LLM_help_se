# ? 新增 departure（出发地）字段

## 修改内容

### 1. 后端数据模型 (`backend/models.py`)

#### TripDetail
```python
class TripDetail(BaseModel):
    tripId: str
    tripName: str
    departure: Optional[str] = None  # ← 新增
    destination: str
    ...
```

#### TripSummary
```python
class TripSummary(BaseModel):
    tripId: str
    tripName: str
    departure: Optional[str] = None  # ← 新增
    destination: str
    ...
```

### 2. AI服务解析 (`backend/ai_service.py`)

**新增出发地识别逻辑**：
```python
# Extract departure (出发地)
departure = None
if "从" in requirements:
    # 识别"从北京"、"从上海"等模式
    for city in ["北京", "上海", "广州", "深圳", "成都"]:
        if f"从{city}" in requirements:
            departure = city_map[city]  # 转为英文
            break
```

**支持的出发地**：
- 北京 (Beijing)
- 上海 (Shanghai)
- 广州 (Guangzhou)
- 深圳 (Shenzhen)
- 成都 (Chengdu)

**输出日志**：
```
[Mock Generator] Detected departure: Beijing
[Mock Generator] Detected destination: Shanghai
```

### 3. API接口 (`backend/app.py`)

**生成行程时保存出发地**：
```python
trip = TripDetail(
    tripId=trip_id,
    tripName=f"{ai_result['destination']} Trip",
    departure=ai_result.get("departure"),  # ← 新增
    destination=ai_result["destination"],
    ...
)
```

**列表接口返回出发地**：
```python
TripSummary(
    tripId=trip.tripId,
    tripName=trip.tripName,
    departure=trip.departure,  # ← 新增
    destination=trip.destination,
    ...
)
```

### 4. 前端类型定义 (`src/utils/api.ts`)

```typescript
export interface TripDetail {
  tripId: string;
  tripName: string;
  departure?: string;  // ← 新增（可选）
  destination: string;
  ...
}
```

### 5. 详情页UI (`src/pages/p-plan_detail/index.tsx`)

**新增出发地显示**：
```tsx
{tripData.departure && (
  <div className="text-center">
    <div className="w-12 h-12 bg-gradient-to-br from-success to-primary rounded-lg ...">
      <i className="fas fa-home text-white text-lg"></i>
    </div>
    <h3 className="text-sm font-medium text-text-secondary mb-1">出发地</h3>
    <p className="text-lg font-semibold text-text-primary">{tripData.departure}</p>
  </div>
)}
```

**布局调整**：
- `grid-cols-4` → `grid-cols-5` (如果有出发地)
- 出发地图标：? (fa-home)
- 颜色：success to primary 渐变

## 测试用例

### 测试1：带出发地
**输入**：
```
从北京去上海玩5天
```

**预期结果**：
- departure: "Beijing"
- destination: "Shanghai"
- 详情页显示5个卡片（出发地、目的地、日期、人数、预算）

**后端日志**：
```
[Mock Generator] Detected departure: Beijing
[Mock Generator] Detected destination: Shanghai
```

### 测试2：不带出发地
**输入**：
```
去上海玩5天
```

**预期结果**：
- departure: null
- destination: "Shanghai"
- 详情页显示4个卡片（目的地、日期、人数、预算）

**后端日志**：
```
[Mock Generator] Detected departure: Not specified
[Mock Generator] Detected destination: Shanghai
```

### 测试3：多种出发地
| 输入 | departure | destination |
|------|-----------|-------------|
| 从北京去上海 | Beijing | Shanghai |
| 从上海去成都 | Shanghai | Chengdu |
| 从广州去三亚 | Guangzhou | Sanya |
| 从深圳去北京 | Shenzhen | Beijing |

## API响应示例

### GET /api/trips/:tripId

**有出发地**：
```json
{
  "tripId": "trip_abc123",
  "tripName": "Shanghai Trip",
  "departure": "Beijing",
  "destination": "Shanghai",
  "startDate": "2024-11-06",
  "endDate": "2024-11-10",
  "totalDays": 5,
  ...
}
```

**无出发地**：
```json
{
  "tripId": "trip_def456",
  "tripName": "Shanghai Trip",
  "departure": null,
  "destination": "Shanghai",
  "startDate": "2024-11-06",
  "endDate": "2024-11-10",
  "totalDays": 5,
  ...
}
```

## 兼容性

### 向后兼容
- ? `departure` 字段为可选 (`Optional[str]`)
- ? 旧数据 `departure=null` 不会报错
- ? 前端UI自动隐藏空的出发地卡片

### 数据库迁移
如果将来使用真实数据库：
```sql
ALTER TABLE trip_plan ADD COLUMN departure VARCHAR(100) NULL;
```

## 完成清单

- [x] 后端数据模型添加 `departure` 字段
- [x] AI服务解析出发地
- [x] API接口返回出发地
- [x] 前端类型定义更新
- [x] 详情页UI显示出发地
- [x] 测试用例验证
- [x] 文档说明

## 使用示例

### 用户输入示例
```
从北京去上海玩5天，预算1万元，两个大人一个小孩
```

### 系统识别结果
- 出发地：Beijing
- 目的地：Shanghai
- 天数：5天
- 预算：10000元
- 人数：3人（2大1小）

### 详情页显示
```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│  出发地  │  目的地  │   日期   │   人数   │   预算   │
│  ?     │   ?    │   ?    │   ?    │   ?    │
│ Beijing │Shanghai │ 11/6-10 │   3人   │ ?10000  │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

## 注意事项

1. **可选字段**：departure 是可选的，用户可以不输入出发地
2. **自动识别**：只支持"从XXX"的模式识别
3. **UI适配**：有出发地时显示5列，无出发地时显示4列
4. **扩展性**：可以轻松添加更多城市到识别列表

---

**状态**: ? 完成  
**版本**: v1.1.0  
**日期**: 2024-10-30



