# 前端API对接指南

## 已完成的前端改造

### 1. 行程生成页面 (`src/pages/p-plan_input/index.tsx`)

#### 修改内容
- ? 添加了完整的类型定义 `TripGenerationRequest`
- ? 将 `handleGenerateTrip` 改为异步函数
- ? 自动分类用户选择的偏好标签（旅行类型/交通/住宿）
- ? 打包完整参数并调用 `POST /api/trips/generate`
- ? 错误处理和用户提示
- ? 使用API工具类统一管理接口

#### 发送的请求体示例
```json
{
  "requirementsText": "我想去日本东京，5天，预算1万元，喜欢美食和动漫，带一个5岁孩子。",
  "preferences": ["food", "family", "plane", "comfortable"],
  "travelType": ["food", "family"],
  "transportPreference": ["plane"],
  "accommodationType": ["comfortable"],
  "currency": "CNY"
}
```

#### 期望的后端响应
```json
{
  "tripId": "trip_abc123456",
  "status": "success",
  "message": "行程生成成功"
}
```

---

## API工具类 (`src/utils/api.ts`)

### 功能特性
- ? 统一管理所有API接口
- ? 自动处理认证token（从localStorage读取）
- ? 统一错误处理
- ? 完整的TypeScript类型定义

### 已实现的接口方法

#### 1. 生成行程
```typescript
api.generateTrip(requestData)
  .then(response => {
    console.log('tripId:', response.tripId);
  })
  .catch(error => {
    console.error('生成失败:', error);
  });
```

#### 2. 获取行程详情
```typescript
api.getTripDetail(tripId)
  .then(trip => {
    console.log('行程详情:', trip);
  });
```

#### 3. 更新行程
```typescript
api.updateTrip(tripId, { tripName: '新名称' });
```

#### 4. 删除行程
```typescript
api.deleteTrip(tripId);
```

#### 5. 记录开销
```typescript
api.addExpense(tripId, {
  amount: 100,
  category: '餐饮',
  date: '2025-11-20',
  description: '午餐'
});
```

#### 6. 获取用户所有行程
```typescript
api.getUserTrips({ status: 'active', page: 1, limit: 10 });
```

---

## 后端需要实现的接口

### 1. POST /api/trips/generate
生成新的旅行计划

**请求体**：见上方 `TripGenerationRequest` 类型

**响应体**：
```json
{
  "tripId": "string",
  "status": "success",
  "message": "行程生成成功"
}
```

### 2. GET /api/trips/:tripId
获取行程详情

**响应体**：见 `src/utils/api.ts` 中的 `TripDetail` 类型定义

### 3. PUT /api/trips/:tripId
更新行程信息

### 4. DELETE /api/trips/:tripId
删除行程

### 5. POST /api/trips/:tripId/expenses
记录开销

### 6. GET /api/trips
获取用户所有行程列表

**查询参数**：
- `status`: 'draft' | 'active' | 'completed'
- `page`: 页码
- `limit`: 每页数量

---

## 环境变量配置

在项目根目录创建 `.env.local` 文件：

```bash
# API基础URL（开发环境）
VITE_API_BASE_URL=http://localhost:3000/api

# 或者生产环境
# VITE_API_BASE_URL=https://api.tuzhixing.com/api

# ASR语音识别配置（已有）
VITE_ASR_SECRET_ID=your_secret_id
VITE_ASR_SECRET_KEY=your_secret_key
VITE_ASR_APP_ID=your_app_id
```

---

## 调试方法

### 1. 查看请求日志
打开浏览器控制台，查看：
- "发送行程生成请求:" - 查看发送的参数
- "行程生成成功，tripId:" - 查看返回的ID

### 2. 模拟后端响应（开发阶段）
如果后端还未就绪，可以临时使用 Mock 数据：

在 `src/utils/api.ts` 中：
```typescript
// 临时Mock（开发用）
export const api = {
  generateTrip: async (data: TripGenerationRequest) => {
    console.log('Mock API - 接收参数:', data);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟延迟
    return {
      tripId: 'mock_trip_' + Date.now(),
      status: 'success',
      message: '模拟生成成功'
    };
  },
  // ...其他方法
};
```

---

## 前端当前状态总结

? **已完成**：
1. 输入页收集完整参数
2. 参数分类和打包
3. API调用逻辑
4. 错误处理
5. 跳转到详情页

? **待完成**（需要后端配合）：
1. 详情页根据 tripId 拉取真实数据
2. 行程编辑保存功能
3. 开销记录功能
4. 行程列表展示

---

## 下一步工作

### 前端侧
1. 修改 `src/pages/p-plan_detail/index.tsx`，根据 tripId 拉取数据
2. 实现行程编辑保存
3. 实现开销记录提交

### 后端侧
1. 实现 `/api/trips/generate` 接口
2. 接入LLM生成行程JSON
3. 存储到数据库并返回 tripId
4. 实现 `/api/trips/:tripId` 详情接口

---

## 联系与协作

如有问题，请联系前端开发团队。

**文档版本**：v1.0  
**更新日期**：2025-10-30

