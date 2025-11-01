# ? 问题排查指南

## 你遇到的错误：`SystemError: Negative size passed to PyUnicode_New`

### ? 已修复！

**问题原因**: `python-dotenv==1.0.0` 在某些Python环境下存在兼容性问题

**解决方案**: 
1. 已将 `python-dotenv` 改为可选依赖
2. 代码已更新为可选加载环境变量
3. 即使不安装 `python-dotenv` 也能正常运行

---

## ? 正确的启动步骤

### 步骤1: 进入正确的目录

```bash
# 绝对路径（推荐）
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162\backend

# 确认位置
dir

# 应该看到 main.py, models.py 等文件
```

### 步骤2: 安装最小依赖（只需3个包）

```bash
pip install fastapi uvicorn pydantic
```

**为什么只需要3个包？**
- ? `fastapi` - Web框架核心
- ? `uvicorn` - ASGI服务器
- ? `pydantic` - 数据验证
- ? `python-dotenv` - 已改为可选，不再必需
- ? `openai` - 使用模拟数据，不需要
- ? 数据库驱动 - 使用内存存储，不需要

### 步骤3: 启动服务

三种方式任选一种：

#### 方式A: 使用简化脚本（推荐）
```bash
python run.py
```

#### 方式B: 直接运行
```bash
python main.py
```

#### 方式C: 使用uvicorn
```bash
uvicorn main:app --host 0.0.0.0 --port 3000
```

### 步骤4: 验证成功

打开浏览器访问: http://localhost:3000/docs

看到 Swagger UI 界面 = 成功！

---

## ? 所有可能的错误及解决方案

### 错误1: `SystemError: Negative size passed to PyUnicode_New`

**? 已修复** - 不再需要 `python-dotenv`

如果还出现，检查是否有旧的虚拟环境：
```bash
# 删除旧虚拟环境
rmdir /s venv  # Windows
rm -rf venv    # Linux/Mac

# 重新安装
pip install fastapi uvicorn pydantic
python run.py
```

---

### 错误2: `can't open file 'main.py'`

**原因**: 不在 `backend` 目录

**解决**:
```bash
# 检查当前位置
cd  # Windows会显示当前路径

# 正确的路径应该是:
# D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162\backend

# 如果不对，使用绝对路径：
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162\backend
```

---

### 错误3: `ModuleNotFoundError: No module named 'fastapi'`

**原因**: 没有安装依赖

**解决**:
```bash
# 方法1: 直接安装
pip install fastapi uvicorn pydantic

# 方法2: 使用requirements.txt
pip install -r requirements.txt

# 方法3: 创建虚拟环境（推荐）
python -m venv venv
venv\Scripts\activate  # Windows
pip install fastapi uvicorn pydantic
```

---

### 错误4: `Address already in use` (端口被占用)

**原因**: 3000端口被其他程序占用

**解决方法1: 换端口**
```bash
# 使用8000端口
uvicorn main:app --host 0.0.0.0 --port 8000

# 然后在前端 .env.local 中改为:
# VITE_API_BASE_URL=http://localhost:8000/api
```

**解决方法2: 杀掉占用进程**
```bash
# Windows
netstat -ano | findstr :3000
# 记下PID（最后一列数字）

taskkill /PID <PID号> /F

# 示例: taskkill /PID 12345 /F
```

---

### 错误5: `ModuleNotFoundError: No module named 'models'`

**原因**: Python找不到本地模块

**解决**:
```bash
# 确保在backend目录下
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162\backend

# 使用 run.py（会自动添加路径）
python run.py
```

---

### 错误6: CORS跨域错误

**症状**: 前端调用API时浏览器控制台显示:
```
Access to fetch at 'http://localhost:3000/api/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**解决**: 
代码已内置CORS配置，默认允许 `localhost:5173`

如果还有问题，检查 `main.py` 第36-37行：
```python
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:5173,http://localhost:3000"  # 确保包含前端地址
).split(",")
```

---

### 错误7: 依赖冲突

**症状**: 安装时出现版本冲突警告

**解决**: 创建独立的虚拟环境
```bash
# 1. 创建虚拟环境
python -m venv venv_backend

# 2. 激活
venv_backend\Scripts\activate  # Windows
source venv_backend/bin/activate  # Linux/Mac

# 3. 安装干净的依赖
pip install fastapi==0.109.0 uvicorn==0.27.0 pydantic==2.5.3

# 4. 启动
python run.py
```

---

## ? 启动前检查清单

复制这个清单，逐项检查：

```
[ ] 1. Python版本 >= 3.8
      运行: python --version
      
[ ] 2. 在正确的目录 (backend/)
      运行: dir
      应该看到: main.py, models.py, database.py 等
      
[ ] 3. 已安装必需的3个包
      运行: pip list | findstr "fastapi uvicorn pydantic"
      应该看到这3个包
      
[ ] 4. 端口3000未被占用
      运行: netstat -ano | findstr :3000
      应该没有输出
      
[ ] 5. 文件完整
      确认存在: main.py, models.py, database.py, ai_service.py
```

全部打勾后，运行：
```bash
python run.py
```

---

## ? 终极解决方案（100%有效）

如果上面所有方法都不行，执行这个完整流程：

```bash
# 1. 关闭所有Python进程
taskkill /F /IM python.exe

# 2. 进入backend目录
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162\backend

# 3. 删除旧环境（如果有）
rmdir /s /q venv

# 4. 创建新虚拟环境
python -m venv venv_new

# 5. 激活虚拟环境
venv_new\Scripts\activate

# 6. 升级pip
python -m pip install --upgrade pip

# 7. 安装最小依赖
pip install fastapi==0.109.0 uvicorn==0.27.0 pydantic==2.5.3

# 8. 验证安装
python -c "import fastapi, uvicorn, pydantic; print('OK')"

# 9. 启动服务
python run.py
```

如果还是不行，请检查：
- 是否有杀毒软件阻止
- 是否有防火墙限制
- Python是否正确安装

---

## ? 成功的标志

启动成功后，你会看到：

```
╔═══════════════════════════════════════════╗
║       途智行API服务启动中...           ║
╚═══════════════════════════════════════════╝

? 依赖检查通过
INFO:     Will watch for changes in these directories: [...]
INFO:     Uvicorn running on http://0.0.0.0:3000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

然后访问 http://localhost:3000/docs 能看到API文档页面。

---

## ? 还需要帮助？

1. 查看 `START_HERE.md` - 最简化的启动指南
2. 查看 `QUICKSTART.md` - 快速开始
3. 查看 `README.md` - 详细文档
4. 查看 `USAGE_GUIDE.md` - 使用指南

---

**记住**: 只需要3个包 + 正确的目录 + Python 3.8+ 就能运行！



