@echo off
REM 安装依赖脚本（Windows）

echo ========================================
echo 途智行后端 - 依赖安装
echo ========================================
echo.

REM 检查Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到Python，请先安装Python 3.8+
    pause
    exit /b 1
)

echo [1/3] Python版本检查通过
python --version

REM 升级pip
echo.
echo [2/3] 升级pip...
python -m pip install --upgrade pip

REM 安装依赖
echo.
echo [3/3] 安装依赖包...
pip install fastapi==0.109.0 uvicorn==0.27.0 pydantic==2.5.3 python-dotenv==1.0.0

echo.
echo ========================================
echo 安装完成！
echo ========================================
echo.
echo 启动方法1: 运行 start.bat
echo 启动方法2: python main.py
echo.
pause



