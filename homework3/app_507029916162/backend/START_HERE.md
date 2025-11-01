# ? 后端快速启动（解决所有问题版）

## ?? 遇到错误？按这个步骤来！

### 第1步：确认位置

**重要**：必须在 `backend` 目录下运行命令！

```bash
# Windows PowerShell
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162\backend

# 或者从项目根目录
cd app_507029916162\backend
```

确认方法：运行 `dir`，应该看到 `main.py`、`models.py` 等文件。

---

### 第2步：安装依赖（只需3个包）

```bash
pip install fastapi==0.109.0 uvicorn==0.27.0 pydantic==2.5.3
```

**如果报错**，尝试：
```bash
# 升级pip
python -m pip install --upgrade pip

# 再次安装
pip install fastapi uvicorn pydantic
```

---

### 第3步：启动服务

#### 方法A：使用简化启动脚本（推荐）
```bash
python run.py
```

#### 方法B：直接启动
```bash
python main.py
```

#### 方法C：使用uvicorn
```bash
uvicorn main:app --host 0.0.0.0 --port 3000 --reload
```

---

### 第4步：验证成功

启动后应该看到：
```
INFO:     Uvicorn running on http://0.0.0.0:3000
INFO:     Application startup complete.
```

然后打开浏览器访问：
- **API文档**: http://localhost:3000/docs
- **健康检查**: http://localhost:3000/api/health

看到页面 = 成功！?

---

## ? 常见错误解决

### 错误1: `SystemError: Negative size passed to PyUnicode_New`

**原因**: `python-dotenv` 包兼容性问题

**解决**: 已修复！现在不需要这个包了，直接启动即可。

---

### 错误2: `can't open file 'main.py'`

**原因**: 不在正确的目录

**解决**:
```bash
# 确认当前位置
pwd  # Linux/Mac
cd   # Windows

# 进入backend目录
cd backend

# 再次尝试
python main.py
```

---

### 错误3: `No module named 'fastapi'`

**原因**: 没有安装依赖

**解决**:
```bash
pip install fastapi uvicorn pydantic
```

---

### 错误4: 端口被占用

**症状**: `Address already in use`

**解决**:
```bash
# Windows - 查找占用3000端口的进程
netstat -ano | findstr :3000

# 杀死进程（替换<PID>为上面查到的进程ID）
taskkill /PID <PID> /F

# 或者换个端口
uvicorn main:app --port 8000
```

---

### 错误5: CORS跨域问题

**症状**: 前端调用API时报错 "Access-Control-Allow-Origin"

**解决**: 已内置配置，默认允许 `localhost:5173` 和 `localhost:3000`

如需修改，编辑 `main.py` 第36-37行。

---

## ? 成功启动后做什么？

### 1. 测试API（5分钟）

访问 http://localhost:3000/docs

点击 `POST /api/trips/generate`，填写：
```json
{
  "requirementsText": "我想去北京3天，预算5000元",
  "preferences": ["food"],
  "travelType": ["food"],
  "transportPreference": ["high-speed-rail"],
  "accommodationType": ["comfortable"],
  "currency": "CNY"
}
```

点击 Execute，应该返回一个 `tripId`。

### 2. 启动前端

打开新终端：
```bash
# 回到项目根目录
cd ..

# 启动前端
npm install
npm run dev
```

### 3. 完整测试

- 前端: http://localhost:5173
- 进入"行程规划"
- 输入需求，点击生成
- 查看结果

---

## ? 最小化依赖清单

只需要3个Python包：
1. ? `fastapi` - Web框架
2. ? `uvicorn` - ASGI服务器
3. ? `pydantic` - 数据验证

**不需要**：
- ? `python-dotenv` - 已改为可选
- ? `openai` - 已使用模拟数据
- ? `数据库` - 使用内存存储

---

## ? 还是不行？

### 最后的杀手锏：

```bash
# 1. 确认Python版本
python --version
# 需要 3.8 或更高

# 2. 创建虚拟环境
python -m venv venv

# 3. 激活虚拟环境
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 4. 安装依赖
pip install fastapi uvicorn pydantic

# 5. 启动
python run.py
```

---

## ? 检查清单

启动前确认：
- [ ] 在 `backend` 目录下（运行 `dir` 能看到 `main.py`）
- [ ] Python 3.8+ （运行 `python --version`）
- [ ] 已安装 fastapi, uvicorn, pydantic
- [ ] 端口 3000 未被占用

全部打勾？那就：
```bash
python run.py
```

---

**祝顺利！?**

有问题查看 `USAGE_GUIDE.md` 或 `README.md`



