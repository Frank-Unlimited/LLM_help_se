"""
简化版启动脚本 - 直接运行，无需配置
"""
import sys
import os

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    import uvicorn
    
    print("""
    ╔═══════════════════════════════════════════╗
    ║       途智行API服务启动中...           ║
    ╚═══════════════════════════════════════════╝
    """)
    
    # 检查依赖
    try:
        import fastapi
        import pydantic
        print("? 依赖检查通过")
    except ImportError as e:
        print(f"? 缺少依赖: {e}")
        print("\n请先安装依赖:")
        print("pip install fastapi uvicorn pydantic")
        sys.exit(1)
    
    # 启动服务
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=3000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        print(f"\n? 启动失败: {e}")
        print("\n可能的原因:")
        print("1. 端口3000已被占用")
        print("2. 缺少必要的Python包")
        print("3. Python版本过低（需要3.8+）")
        sys.exit(1)



