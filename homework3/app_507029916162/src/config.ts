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

// 从 localStorage 或环境变量读取配置并设置到 window.config
// 优先级：localStorage > 环境变量 > 默认值
const initConfig = () => {
  // 从 localStorage 读取配置
  const getStorageConfig = (key: string, envKey?: string) => {
    const storageKey = `config_${key}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) return stored;
    
    // 回退到环境变量
    if (envKey) {
      return import.meta.env[envKey] || '';
    }
    return '';
  };

  const getStorageNumberConfig = (key: string, envKey?: string) => {
    const storageKey = `config_${key}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const num = Number(stored);
      return isNaN(num) ? undefined : num;
    }
    
    // 回退到环境变量
    if (envKey) {
      const envValue = import.meta.env[envKey];
      return envValue ? Number(envValue) : undefined;
    }
    return undefined;
  };

  window.config = {
    // 腾讯云API配置（支持 VITE_ASR_* 和 VITE_TENCENT_* 两种命名）
    secretId: getStorageConfig('VITE_ASR_SECRET_ID') || import.meta.env.VITE_ASR_SECRET_ID || import.meta.env.VITE_TENCENT_SECRET_ID || '',
    secretKey: getStorageConfig('VITE_ASR_SECRET_KEY') || import.meta.env.VITE_ASR_SECRET_KEY || import.meta.env.VITE_TENCENT_SECRET_KEY || '',
    appId: getStorageNumberConfig('VITE_ASR_APP_ID') || 
      (import.meta.env.VITE_ASR_APP_ID ? Number(import.meta.env.VITE_ASR_APP_ID) : undefined) ||
      (import.meta.env.VITE_TENCENT_APP_ID ? Number(import.meta.env.VITE_TENCENT_APP_ID) : undefined),
    
    // 高德地图API配置
    amapApiKey: getStorageConfig('VITE_AMAP_API_KEY') || import.meta.env.VITE_AMAP_API_KEY || '',
    amapSecurityJsCode: getStorageConfig('VITE_AMAP_SECURITY_JS_CODE') || import.meta.env.VITE_AMAP_SECURITY_JS_CODE || '',
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

// 导出配置更新函数，供外部调用
export const updateConfig = (key: string, value: string | number) => {
  const storageKey = `config_${key}`;
  if (value === undefined || value === null || value === '') {
    localStorage.removeItem(storageKey);
  } else {
    localStorage.setItem(storageKey, String(value));
  }
  // 重新初始化配置
  initConfig();
};

// 导出获取配置函数
export const getConfig = (key: string): string | number | undefined => {
  return window.config?.[key as keyof typeof window.config];
};

export {};

