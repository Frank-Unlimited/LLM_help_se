// 配置模块：从环境变量读取敏感信息并设置到 window.config
// 这个模块在 main.tsx 中引入，确保在所有组件之前加载

// 声明全局类型
declare global {
  interface Window {
    config?: {
      secretId?: string;
      secretKey?: string;
      appId?: number;
      amapApiKey?: string;
      amapSecurityJsCode?: string;
      [key: string]: any;
    };
  }
}

// 从环境变量读取配置并设置到 window.config
// 优先使用环境变量，如果没有则使用默认值（开发环境提示）
const initConfig = () => {
  window.config = {
    // 腾讯云API配置（支持 VITE_ASR_* 和 VITE_TENCENT_* 两种命名）
    secretId: import.meta.env.VITE_ASR_SECRET_ID || import.meta.env.VITE_TENCENT_SECRET_ID || '',
    secretKey: import.meta.env.VITE_ASR_SECRET_KEY || import.meta.env.VITE_TENCENT_SECRET_KEY || '',
    appId: (import.meta.env.VITE_ASR_APP_ID || import.meta.env.VITE_TENCENT_APP_ID)
      ? Number(import.meta.env.VITE_ASR_APP_ID || import.meta.env.VITE_TENCENT_APP_ID)
      : undefined,
    
    // 高德地图API配置
    amapApiKey: import.meta.env.VITE_AMAP_API_KEY || '',
    amapSecurityJsCode: import.meta.env.VITE_AMAP_SECURITY_JS_CODE || '',
  };

  // 开发环境下检查配置完整性
  if (import.meta.env.DEV) {
    const missing: string[] = [];
    if (!window.config.secretId) missing.push('VITE_ASR_SECRET_ID 或 VITE_TENCENT_SECRET_ID');
    if (!window.config.secretKey) missing.push('VITE_ASR_SECRET_KEY 或 VITE_TENCENT_SECRET_KEY');
    if (!window.config.appId) missing.push('VITE_ASR_APP_ID 或 VITE_TENCENT_APP_ID');
    if (!window.config.amapApiKey) missing.push('VITE_AMAP_API_KEY');
    if (!window.config.amapSecurityJsCode) missing.push('VITE_AMAP_SECURITY_JS_CODE');
    
    if (missing.length > 0) {
      console.warn('?? 以下环境变量未设置:', missing.join(', '));
      console.warn('请检查 .env 文件是否已正确配置');
    }
  }
};

// 立即执行初始化
initConfig();

export {};

