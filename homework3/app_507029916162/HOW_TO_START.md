# ? 一分钟启动指南

## 你只需要做这3件事：

### 1?? 进入backend目录

```bash
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162\backend
```

### 2?? 安装依赖（只需3个包）

```bash
pip install fastapi uvicorn pydantic
```

### 3?? 启动服务

```bash
python run.py
```

---

## ? 成功标志

看到这个就成功了：
```
INFO:     Uvicorn running on http://0.0.0.0:3000
```

然后访问: http://localhost:3000/docs

---

## ? 遇到错误？

### 错误: `SystemError: Negative size passed to PyUnicode_New`
**? 已修复！** 重新运行 `python run.py` 即可

### 错误: `can't open file 'main.py'`
你不在backend目录，执行：
```bash
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162\backend
```

### 错误: `No module named 'fastapi'`
没安装依赖，执行：
```bash
pip install fastapi uvicorn pydantic
```

### 其他错误？
查看 `backend/TROUBLESHOOTING.md` 或 `backend/START_HERE.md`

---

## ? 完整流程（复制粘贴）

打开PowerShell，复制粘贴以下全部命令：

```bash
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162\backend
pip install fastapi uvicorn pydantic
python run.py
```

就这么简单！?

---

## ? 文档索引

- **遇到问题**: `backend/TROUBLESHOOTING.md`
- **快速启动**: `backend/START_HERE.md`
- **API文档**: `backend/README.md`
- **使用指南**: `USAGE_GUIDE.md`
- **项目状态**: `PROJECT_STATUS.md`

---

**现在就试试吧！** ?



