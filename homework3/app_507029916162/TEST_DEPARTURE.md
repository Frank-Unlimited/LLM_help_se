# ? 测试出发地功能

## 快速测试

### 1. 启动后端
```bash
cd backend
python app.py
```

### 2. 启动前端
```bash
npm run dev
```

### 3. 测试用例

#### 测试A：带出发地
**输入**：
```
从北京去上海玩5天
```

**预期**：
- ? 后端日志显示：`[Mock Generator] Detected departure: Beijing`
- ? 后端日志显示：`[Mock Generator] Detected destination: Shanghai`
- ? 详情页显示5个信息卡片
- ? 第1个卡片显示"出发地: Beijing"
- ? 第2个卡片显示"目的地: Shanghai"

#### 测试B：不带出发地
**输入**：
```
去上海玩5天
```

**预期**：
- ? 后端日志显示：`[Mock Generator] Detected departure: Not specified`
- ? 详情页显示4个信息卡片（无出发地）
- ? 目的地卡片正常显示

#### 测试C：多个城市组合
| 输入 | 期望出发地 | 期望目的地 |
|------|------------|------------|
| 从北京去上海玩3天 | Beijing | Shanghai |
| 从上海去成都玩7天 | Shanghai | Chengdu |
| 从广州去三亚玩5天 | Guangzhou | Sanya |
| 从深圳去北京玩5天 | Shenzhen | Beijing |

## 后端日志示例

### 成功识别出发地
```
============================================================
[AI Service] Received trip generation request
============================================================
[Input] Requirements: 从北京去上海玩5天
[Input] Preferences: []
[Input] Travel Types: []

[AI Service] Generating mock trip data...

[Mock Generator] Parsing requirements...
[Mock Generator] Detected departure: Beijing       ← 成功识别
[Mock Generator] Detected destination: Shanghai
[Mock Generator] Detected trip duration: 5 days
[Mock Generator] Detected budget: 10000
...
```

### 未识别出发地
```
[Mock Generator] Parsing requirements...
[Mock Generator] Detected departure: Not specified  ← 未指定
[Mock Generator] Detected destination: Shanghai
```

## 前端显示验证

### 有出发地时
```
行程概览应显示5列：
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│  出发地  │  目的地  │   日期   │   人数   │   预算   │
│  ?     │   ?    │   ?    │   ?    │   ?    │
│ Beijing │Shanghai │ 5天     │   -    │ CNY 10k │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

### 无出发地时
```
行程概览应显示4列：
┌─────────┬─────────┬─────────┬─────────┐
│  目的地  │   日期   │   人数   │   预算   │
│   ?    │   ?    │   ?    │   ?    │
│Shanghai │ 5天     │   -    │ CNY 10k │
└─────────┴─────────┴─────────┴─────────┘
```

## API响应检查

### 检查点1：生成接口响应
```bash
# 后端日志应显示
[API] Response: trip_id=trip_xxx, status=success
```

### 检查点2：详情接口响应
访问浏览器控制台，查看Network标签：

**请求**: `GET /api/trips/trip_xxx`

**响应**（有出发地）:
```json
{
  "tripId": "trip_xxx",
  "tripName": "Shanghai Trip",
  "departure": "Beijing",     ← 有值
  "destination": "Shanghai",
  ...
}
```

**响应**（无出发地）:
```json
{
  "tripId": "trip_xxx",
  "tripName": "Shanghai Trip",
  "departure": null,          ← 空值
  "destination": "Shanghai",
  ...
}
```

## 常见问题

### Q1: 详情页不显示出发地卡片
**A**: 检查是否真的识别到了出发地
- 查看后端日志中的 `Detected departure`
- 如果是 `Not specified`，说明需求文本中没有"从XXX"模式

### Q2: 识别不到出发地
**A**: 确保使用正确的格式
- ? 正确：`从北京去上海`
- ? 错误：`北京去上海`（缺少"从"）
- ? 错误：`北京到上海`（使用"到"而非"从...去..."）

### Q3: 支持哪些城市？
**A**: 当前支持：
- 北京 (Beijing)
- 上海 (Shanghai)  
- 广州 (Guangzhou)
- 深圳 (Shenzhen)
- 成都 (Chengdu)

如需添加更多城市，编辑 `backend/ai_service.py` 第84行的城市列表。

## 完整测试流程

### Step 1: 清空数据（可选）
```bash
# 重启后端会清空内存数据
# Ctrl+C 停止后端
python app.py  # 重新启动
```

### Step 2: 输入测试数据
```
从北京去上海玩5天，预算1万元，两个大人一个小孩
```

### Step 3: 检查后端日志
```
[Mock Generator] Detected departure: Beijing ?
[Mock Generator] Detected destination: Shanghai ?
[Mock Generator] Detected trip duration: 5 days ?
```

### Step 4: 验证详情页
- [ ] 页面标题：Shanghai Trip
- [ ] 出发地卡片：Beijing（绿色渐变，?图标）
- [ ] 目的地卡片：Shanghai（蓝色渐变，?图标）
- [ ] 日期卡片：显示日期范围
- [ ] 预算卡片：显示预算金额

### Step 5: 检查API数据
按F12打开开发者工具 → Network → 找到 `/api/trips/trip_xxx`

验证响应中的 `departure` 字段值正确。

---

**测试完成后，出发地功能应该完全正常工作！** ?



