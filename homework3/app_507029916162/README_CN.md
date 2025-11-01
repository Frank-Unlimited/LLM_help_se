# 途智行 - 一键启动指南

## ? 快速启动（2个终端）

### 终端1：启动后端
```bash
cd backend
.\venv\Scripts\activate
python app.py
```
等待看到：`INFO: Uvicorn running on http://0.0.0.0:3000`

### 终端2：启动前端
```bash
npm run dev
```
等待看到：`Local: http://localhost:5173`

## ? 测试

访问: http://localhost:5173

进入"行程规划"，输入：
```
两个大人一个小孩去上海玩5天
```

点击"生成智能行程" → 成功！

---

## ?? 遇到问题？

### 后端启动失败
查看：`backend/FIXED_START.md`

### 前端404错误
已修复！重启前端即可。

### 详细文档
- `START_EVERYTHING.md` - 完整启动指南
- `PROBLEM_SOLVED.md` - 问题解决方案
- `PROJECT_STATUS.md` - 项目状态

---

**就这么简单！** ?



