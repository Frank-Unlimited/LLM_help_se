"""
生产环境启动脚本
"""
import uvicorn
import os

if __name__ == "__main__":
    print("Starting TuZhiXing API Service (Production Mode)...")
    print("API Docs: http://0.0.0.0:3000/docs")
    
    # 从环境变量获取配置，如果没有则使用默认值
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "3000"))
    workers = int(os.getenv("WORKERS", "4"))
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        workers=workers,
        log_level="info",
        access_log=True
    )




