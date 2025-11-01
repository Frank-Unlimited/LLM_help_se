# ? 使用指南

## ? 完整启动流程

### 第一步：安装后端依赖

```bash
cd backend
pip install fastapi==0.109.0 uvicorn==0.27.0 pydantic==2.5.3 python-dotenv==1.0.0
```

或者运行安装脚本：
```bash
# Windows
install.bat

# Linux/Mac
pip install -r requirements.txt
```

### 第二步：启动后端

```bash
# 确保在 backend 目录下
python main.py
```

看到以下输出表示成功：
```
╔═══════════════════════════════════════════╗
║       途智行API服务已启动               ║
╠═══════════════════════════════════════════╣
║  地址: http://0.0.0.0:3000              ║
║  文档: http://0.0.0.0:3000/docs         ║
║  健康检查: http://0.0.0.0:3000/api/health ║
╚═══════════════════════════════════════════╝

INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:3000
```

### 第三步：测试后端

打开浏览器访问：http://localhost:3000/docs

你会看到Swagger UI界面，可以直接测试所有接口。

### 第四步：配置前端

在前端项目根目录创建 `.env.local`：

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

### 第五步：启动前端

```bash
# 回到项目根目录
cd ..
npm install
npm run dev
```

访问：http://localhost:5173

---

## ? 测试完整流程

### 1. 测试后端API（独立测试）

#### 方法A：使用Swagger UI（推荐）
1. 访问 http://localhost:3000/docs
2. 点击 `POST /api/trips/generate`
3. 点击 "Try it out"
4. 填写请求体：
```json
{
  "requirementsText": "我想去日本东京，5天，预算1万元，喜欢美食",
  "preferences": ["food"],
  "travelType": ["food"],
  "transportPreference": ["plane"],
  "accommodationType": ["comfortable"],
  "currency": "CNY"
}
```
5. 点击 "Execute"
6. 复制返回的 `tripId`
7. 测试 `GET /api/trips/{tripId}` 查看详情

#### 方法B：使用测试脚本
```bash
cd backend
pip install requests
python test_api.py
```

### 2. 测试前后端联调

1. **确保后端已启动**（http://localhost:3000）
2. **确保前端已启动**（http://localhost:5173）
3. **打开前端**，进入"行程规划"页面
4. **输入需求**：例如"我想去北京3天，预算5000元"
5. **点击"生成智能行程"**
6. **查看控制台**：
   - 应该看到请求发送日志
   - 应该看到返回的 tripId
   - 自动跳转到详情页

---

## ? 常见问题排查

### 问题1：后端启动失败

**症状**：运行 `python main.py` 报错

**解决方案**：
```bash
# 1. 检查Python版本（需要3.8+）
python --version

# 2. 检查是否在backend目录
cd backend

# 3. 重新安装依赖
pip install --upgrade pip
pip install fastapi==0.109.0 uvicorn==0.27.0 pydantic==2.5.3 python-dotenv==1.0.0

# 4. 检查端口是否被占用
# Windows: netstat -ano | findstr :3000
# Linux/Mac: lsof -i :3000
```

### 问题2：CORS跨域错误

**症状**：前端控制台显示"Access-Control-Allow-Origin"错误

**解决方案**：
1. 确保后端在 `backend` 目录下有 `.env` 文件
2. 内容为：
```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=3000
DEBUG=true
```
3. 重启后端服务

### 问题3：前端API调用失败

**症状**：网络请求404或500错误

**检查清单**：
- [ ] 后端是否正常运行？访问 http://localhost:3000/api/health
- [ ] 前端 `.env.local` 是否配置了 `VITE_API_BASE_URL`？
- [ ] 浏览器Network标签中查看实际请求URL是否正确
- [ ] 后端控制台是否有错误日志？

### 问题4：数据丢失

**症状**：重启后端后之前的行程不见了

**原因**：当前使用内存存储

**解决**：这是正常现象。生产环境需要配置PostgreSQL数据库。

---

## ? 开发调试技巧

### 后端调试

#### 1. 查看详细日志
后端启动后会自动输出所有HTTP请求日志

#### 2. 使用Python调试器
```python
# 在 main.py 中添加断点
import pdb; pdb.set_trace()
```

#### 3. 修改后自动重载
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 3000
```

### 前端调试

#### 1. 查看API调用
打开浏览器控制台 → Network标签 → 查看所有请求

#### 2. 查看日志
所有 `console.log` 会输出到浏览器控制台

#### 3. React DevTools
安装 React Developer Tools 浏览器扩展

---

## ? 当前功能状态

### ? 已完成

- ? 后端6个核心API
- ? 前端所有页面UI
- ? 行程输入页 → 后端生成 → 跳转详情页
- ? API工具类封装

### ? 待完成

- ? 行程详情页数据拉取（下一步）
- ? 我的行程页列表显示
- ? 预算管理页记录开销
- ? 用户认证系统

---

## ? 快速命令参考

### 后端命令
```bash
# 安装依赖
pip install fastapi uvicorn pydantic python-dotenv

# 启动服务
python main.py

# 运行测试
python test_api.py
```

### 前端命令
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 同时启动（需要两个终端）
```bash
# 终端1 - 后端
cd backend && python main.py

# 终端2 - 前端
npm run dev
```

---

## ? 获取帮助

1. **API文档**：http://localhost:3000/docs
2. **项目状态**：查看 `PROJECT_STATUS.md`
3. **对接指南**：查看 `BACKEND_INTEGRATION.md`
4. **后端详细文档**：查看 `backend/README.md`

---

**祝开发顺利！?**



