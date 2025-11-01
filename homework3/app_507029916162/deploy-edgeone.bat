@echo off
REM EdgeOne Pages 快速部署脚本 (Windows)

echo.
echo ================================
echo   EdgeOne Pages 部署脚本
echo ================================
echo.

REM 检查是否已安装 edgeone
where edgeone >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] EdgeOne CLI 未安装
    echo 正在安装 EdgeOne CLI...
    call npm install -g edgeone
    if %errorlevel% neq 0 (
        echo [错误] 安装失败
        exit /b 1
    )
)

echo [信息] 检查登录状态...
edgeone whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] 未登录，请先登录：
    echo   edgeone login
    exit /b 1
)

echo [成功] 已登录
echo.

REM 构建项目
echo [信息] 构建项目...
call npm run build

if %errorlevel% neq 0 (
    echo [错误] 构建失败
    exit /b 1
)

echo [成功] 构建成功
echo.

REM 部署
echo [信息] 开始部署...

REM 检查是否提供了环境参数
set ENV=%1
if "%ENV%"=="" set ENV=production

if "%ENV%"=="preview" (
    echo 部署到预览环境...
    edgeone pages deploy -e preview
) else (
    echo 部署到生产环境...
    edgeone pages deploy
)

if %errorlevel% equ 0 (
    echo.
    echo [成功] 部署成功！
) else (
    echo.
    echo [错误] 部署失败
    exit /b 1
)

