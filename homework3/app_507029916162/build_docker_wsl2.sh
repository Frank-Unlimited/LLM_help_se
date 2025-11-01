#!/bin/bash
# Docker镜像构建和导出脚本 (WSL2专用)

set -e

IMAGE_NAME="tuzhixing-app"
IMAGE_TAG="latest"
OUTPUT_FILE="${IMAGE_NAME}.tar.gz"

echo "=========================================="
echo "Docker 镜像构建和导出脚本 (WSL2)"
echo "=========================================="

# 检查是否在WSL2环境中
if [ -f /proc/version ]; then
    if grep -qi microsoft /proc/version; then
        echo "? 检测到 WSL2 环境"
    fi
fi

# 检查Docker是否运行
if ! docker ps > /dev/null 2>&1; then
    echo "[错误] Docker daemon 未运行!"
    echo "请先启动 Docker 服务："
    echo "  sudo service docker start"
    echo "  或者"
    echo "  在 Windows 中启动 Docker Desktop"
    exit 1
fi

echo "? Docker daemon 正在运行"
echo ""

# 1. 构建Docker镜像
echo "步骤1: 构建Docker镜像..."
echo "这可能需要几分钟时间，请耐心等待..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

if [ $? -eq 0 ]; then
    echo "? 镜像构建成功!"
else
    echo "? 镜像构建失败!"
    exit 1
fi

# 2. 显示镜像信息
echo ""
echo "步骤2: 镜像信息:"
docker images ${IMAGE_NAME}:${IMAGE_TAG}

# 3. 导出镜像
echo ""
echo "步骤3: 导出镜像为压缩文件..."
docker save ${IMAGE_NAME}:${IMAGE_TAG} | gzip > ${OUTPUT_FILE}

if [ $? -eq 0 ]; then
    FILE_SIZE=$(du -h ${OUTPUT_FILE} | cut -f1)
    FILE_PATH=$(realpath ${OUTPUT_FILE})
    
    echo "? 镜像导出成功!"
    echo "  文件: ${OUTPUT_FILE}"
    echo "  完整路径: ${FILE_PATH}"
    echo "  大小: ${FILE_SIZE}"
    echo ""
    
    # 显示Windows访问路径（如果适用）
    if command -v wslpath >/dev/null 2>&1; then
        WIN_PATH=$(wslpath -w ${FILE_PATH} 2>/dev/null || echo "")
        if [ ! -z "$WIN_PATH" ]; then
            echo "  Windows路径: ${WIN_PATH}"
        fi
    fi
    
    echo ""
    echo "=========================================="
    echo "导出完成!"
    echo ""
    echo "使用方法:"
    echo "1. 将 ${OUTPUT_FILE} 传输到目标机器"
    echo ""
    echo "2. 在目标机器上导入:"
    echo "   gunzip -c ${OUTPUT_FILE} | docker load"
    echo ""
    echo "3. 运行容器:"
    echo "   docker run -d --name ${IMAGE_NAME} -p 8080:80 ${IMAGE_NAME}:${IMAGE_TAG}"
    echo ""
    echo "4. 访问应用:"
    echo "   http://localhost:8080"
    echo "=========================================="
else
    echo "? 镜像导出失败!"
    exit 1
fi


