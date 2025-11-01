#!/bin/bash
# EdgeOne Pages 快速部署脚本

echo "? EdgeOne Pages 部署脚本"
echo "================================"

# 检查是否已安装 edgeone
if ! command -v edgeone &> /dev/null; then
    echo "? EdgeOne CLI 未安装"
    echo "正在安装 EdgeOne CLI..."
    npm install -g edgeone
fi

# 检查是否已登录
echo "? 检查登录状态..."
if ! edgeone whoami &> /dev/null; then
    echo "??  未登录，请先登录："
    echo "   edgeone login"
    exit 1
fi

echo "? 已登录"

# 构建项目
echo ""
echo "? 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "? 构建失败"
    exit 1
fi

echo "? 构建成功"

# 部署
echo ""
echo "? 开始部署..."

# 检查是否提供了环境参数
ENV=${1:-production}

if [ "$ENV" = "preview" ]; then
    echo "部署到预览环境..."
    edgeone pages deploy -e preview
else
    echo "部署到生产环境..."
    edgeone pages deploy
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "? 部署成功！"
else
    echo ""
    echo "? 部署失败"
    exit 1
fi

