@echo off
REM Docker镜像构建和导出脚本 (Windows)

set IMAGE_NAME=tuzhixing-app
set IMAGE_TAG=latest
set OUTPUT_FILE=%IMAGE_NAME%.tar.gz

echo ==========================================
echo Docker 镜像构建和导出脚本
echo ==========================================
echo.

REM 检查Docker是否运行
docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] Docker daemon 未运行!
    echo 请先启动 Docker Desktop 应用程序
    pause
    exit /b 1
)
echo ? Docker daemon 正在运行
echo.

echo 步骤1: 构建Docker镜像...
docker build -t %IMAGE_NAME%:%IMAGE_TAG% .

if %ERRORLEVEL% NEQ 0 (
    echo 镜像构建失败!
    exit /b 1
)

echo ? 镜像构建成功!
echo.

echo 步骤2: 镜像信息:
docker images %IMAGE_NAME%:%IMAGE_TAG%
echo.

echo 步骤3: 导出镜像为压缩文件...
docker save %IMAGE_NAME%:%IMAGE_TAG% | gzip > %OUTPUT_FILE%

if %ERRORLEVEL% NEQ 0 (
    echo 镜像导出失败!
    exit /b 1
)

echo ? 镜像导出成功!
echo   文件: %OUTPUT_FILE%
echo.
echo ==========================================
echo 导出完成!
echo.
echo 使用方法:
echo 1. 将 %OUTPUT_FILE% 传输到目标机器
echo 2. 在目标机器上执行:
echo    gunzip -c %OUTPUT_FILE% ^| docker load
echo 3. 运行容器:
echo    docker run -d --name %IMAGE_NAME% -p 8080:80 %IMAGE_NAME%:%IMAGE_TAG%
echo ==========================================
pause

