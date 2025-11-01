#!/bin/bash
# 启动脚本

echo "正在启动途智行后端服务..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到Python3，请先安装Python 3.8+"
    exit 1
fi

# 检查依赖
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装/更新依赖
echo "安装依赖..."
pip install -r requirements.txt

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "警告: 未找到.env文件，使用默认配置"
    cp env.example .env
fi

# 启动服务
echo "启动服务..."
python main.py

