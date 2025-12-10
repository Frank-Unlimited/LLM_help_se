# LLM_help_se - 软件工程课程项目集

<<<<<<< Updated upstream
=======
作者：韩昊辰 **522025320050** 南京大学

>>>>>>> Stashed changes
本项目仓库包含三个独立的课程作业项目，分别展示了不同的技术应用场景。

---

## ? 项目概览

### ?? Homework 1: 图片水印工具
基于 Python 的图片水印批量处理工具，支持从图片 EXIF 信息中提取拍摄日期作为水印。

**核心功能：**
- ? 自动从图片 EXIF 信息提取拍摄日期
- ? 支持单张图片或批量处理
- ? 可自定义水印位置（左上、右上、左下、右下、居中）
- ? 可自定义水印颜色和字体大小
- ? 自动创建输出目录

**技术栈：**
- Python 3.8+
- Pillow (PIL)

**快速开始：**
```bash
cd homework1
python image_watermark.py <图片路径或目录> [--font-size 30] [--color "255,255,255"] [--position bottom_right]
```

**使用示例：**
```bash
# 处理单张图片
python image_watermark.py photos/sunset.jpg

# 批量处理目录下的所有图片
python image_watermark.py photos/ --font-size 40 --position top_right
```

**详细文档：** 参见 [homework1/README.md](./homework1/README.md)

---

### ? Homework 2: 图片处理器 GUI 应用
功能完整的图片批量处理桌面应用程序，提供图形化界面和可执行文件。

**核心功能：**
- ? 批量导入和处理图片
- ? 图片尺寸调整（按宽度、高度、百分比）
- ? 文本水印和图片水印
- ? 图片旋转和翻转
- ? 色彩调整（亮度、对比度、饱和度）
- ? 自定义导出格式（PNG、JPEG）和质量设置
- ? 打包为独立可执行文件（Windows）

**技术栈：**
- Python 3.8+
- Tkinter (GUI)
- Pillow (PIL)
- PyInstaller (打包)

**快速开始：**
```bash
# 方式1: 直接运行可执行文件（推荐）
cd homework2
图片处理器.exe

# 方式2: 运行源代码
python image_processor.py
```

**详细文档：** 参见 [homework2/](./homework2/) 目录

---

### ?? Homework 3: 途智行 - AI智能旅行规划平台
基于 Web 的智能旅行规划系统，使用 AI 生成个性化旅行路线，支持语音输入和地图导航。

**核心功能：**

1. **智能行程规划**
   - ? 支持语音输入（科大讯飞语音识别）
   - ? 支持文字输入
   - ? AI 自动生成个性化旅行路线（基于 Coze Workflow）
   - ? 集成高德地图 API，提供地理位置服务
   - ? 详细的每日行程安排（景点、餐厅、交通、住宿）

2. **费用预算与管理**
   - ? AI 智能预算分析和分配
   - ? 实时记录和统计旅行开销
   - ? 预算使用情况可视化

3. **用户管理与数据存储**
   - ? 用户注册登录系统
   - ? 云端行程同步（SQLite 数据库，可迁移至 PostgreSQL）
   - ? 多设备查看和修改
   - ? 行程历史记录管理

**技术栈：**

**前端：**
- React 18 + TypeScript
- Vite 5
- React Router v6
- CSS Modules + Tailwind CSS
- 科大讯飞语音识别 SDK

**后端：**
- FastAPI (Python)
- SQLite 数据库（可升级 PostgreSQL）
- Coze Workflow API（大语言模型）
- 高德地图 API

**部署：**
- Docker 容器化支持
- 阿里云镜像仓库集成
- GitHub Actions CI/CD

**快速开始：**

1. **本地开发：**
```bash
# 启动后端
cd homework3/app_507029916162/backend
pip install -r requirements.txt
python run.py

# 启动前端（新终端）
cd homework3/app_507029916162
npm install
npm run dev
```

2. **Docker 部署（推荐）：**
```bash
cd homework3/app_507029916162
docker build -t tuzhixing-app .
docker run -p 3000:3000 -p 5173:5173 tuzhixing-app
```

**环境变量配置：**

后端需要配置以下环境变量（在 `backend/.env` 文件中）：
```env
COZE_API_TOKEN=your_coze_api_token
COZE_WORKFLOW_ID=your_workflow_id
COZE_EXPENSE_WORKFLOW_ID=your_expense_workflow_id
AMAP_API_KEY=your_amap_api_key
```

**详细文档：**
- 主项目 README: [homework3/app_507029916162/README.md](./homework3/app_507029916162/README.md)
- Docker 部署: [homework3/app_507029916162/README_DOCKER.md](./homework3/app_507029916162/README_DOCKER.md)
- 后端 API 文档: [homework3/app_507029916162/backend/README.md](./homework3/app_507029916162/backend/README.md)
- Coze 集成指南: [homework3/app_507029916162/backend/COZE_INTEGRATION.md](./homework3/app_507029916162/backend/COZE_INTEGRATION.md)

---

## ? 快速导航

| 项目 | 类型 | 技术栈 | 文档链接 |
|------|------|--------|----------|
| Homework 1 | 命令行工具 | Python, PIL | [homework1/](./homework1/) |
| Homework 2 | 桌面应用 | Python, Tkinter | [homework2/](./homework2/) |
| Homework 3 | Web 应用 | React, FastAPI, Docker | [homework3/](./homework3/app_507029916162/) |

---

## ? Docker 镜像

Homework 3 项目已配置 Docker 支持，可以通过以下方式获取镜像：

### 方式1: 从阿里云镜像仓库拉取
```bash
docker pull registry.cn-hangzhou.aliyuncs.com/[your-namespace]/tuzhixing-app:latest
```

### 方式2: 本地构建
```bash
cd homework3/app_507029916162
docker build -t tuzhixing-app .
```

### 方式3: 使用导出的镜像文件
项目包含 GitHub Actions 自动构建工作流，可在 Release 中下载导出的镜像文件。

**详细 Docker 使用说明：** 参见 [homework3/app_507029916162/QUICK_START_DOCKER.md](./homework3/app_507029916162/QUICK_START_DOCKER.md)

---

## ? 项目结构

```
LLM_help_se/
├── homework1/                    # 图片水印工具
│   ├── image_watermark.py        # 主程序
│   ├── photos/                   # 示例图片
│   └── README.md                 # 使用说明
│
├── homework2/                    # 图片处理器
│   ├── image_processor.py        # 主程序
│   ├── 图片处理器.exe            # 可执行文件
│   ├── photos/                   # 示例图片
│   └── output/                   # 输出目录
│
├── homework3/                    # 途智行旅行规划平台
│   └── app_507029916162/
│       ├── backend/              # FastAPI 后端
│       │   ├── app.py            # 主应用
│       │   ├── ai_service.py     # AI 服务
│       │   ├── models.py         # 数据模型
│       │   └── database.py       # 数据库
│       ├── src/                  # React 前端
│       │   ├── pages/            # 页面组件
│       │   └── utils/            # 工具函数
│       ├── Dockerfile            # Docker 配置
│       └── README.md             # 项目文档
│
└── README.md                     # 本文件
```

---

## ? 注意事项

?? **API Key 安全**
- 所有项目均要求通过环境变量或配置文件设置 API Key
- **请勿**在代码中硬编码任何 API Key
- 提交到 GitHub 前请确保 `.env` 文件已添加到 `.gitignore`

?? **依赖安装**
- Homework 1 和 2: `pip install Pillow`
- Homework 3 后端: `pip install -r homework3/app_507029916162/backend/requirements.txt`
- Homework 3 前端: `npm install` (在 `homework3/app_507029916162/` 目录)

---

## ? 贡献

本项目为课程作业项目，如有问题或建议，欢迎通过 Issue 反馈。

---

## ? 许可证

MIT License

---

## ? 相关链接

- GitHub Repository: https://github.com/Frank-Unlimited/LLM_help_se.git
- 阿里云镜像仓库: [配置在 GitHub Actions 中](./.github/workflows/docker-build-push.yml)

---

**最后更新：** 2025年1月

