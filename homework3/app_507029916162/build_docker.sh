#!/bin/bash
# Docker镜像构建和导出脚本

set -e

IMAGE_NAME="tuzhixing-app"
IMAGE_TAG="latest"
OUTPUT_FILE="${IMAGE_NAME}.tar.gz"

echo "=========================================="
echo "Docker 镜像构建和导出脚本"
echo "=========================================="

# 1. 构建Docker镜像
echo ""
echo "步骤1: 构建Docker镜像..."
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
    echo "? 镜像导出成功!"
    echo "  文件: ${OUTPUT_FILE}"
    echo "  大小: ${FILE_SIZE}"
    echo ""
    echo "=========================================="
    echo "导出完成!"
    echo ""
    echo "使用方法:"
    echo "1. 将 ${OUTPUT_FILE} 传输到目标机器"
    echo "2. 在目标机器上执行:"
    echo "   gunzip -c ${OUTPUT_FILE} | docker load"
    echo "3. 运行容器:"
    echo "   docker run -d --name ${IMAGE_NAME} -p 8080:80 ${IMAGE_NAME}:${IMAGE_TAG}"
    echo "=========================================="
else
    echo "? 镜像导出失败!"
    exit 1
fi




