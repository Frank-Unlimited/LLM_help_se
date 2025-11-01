import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import styles from './styles.module.css';

// 声明高德地图全局类型
declare global {
  interface Window {
    AMap: any;
    log: any;
    _AMapSecurityConfig?: {
      securityJsCode?: string;
      serviceHost?: string;
    };
    config?: {
      amapApiKey?: string;
      amapSecurityJsCode?: string;
      [key: string]: any;
    };
  }
}

type NavigationType = 'walking' | 'driving' | 'transit' | 'riding';

const NavigationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const navigationInstanceRef = useRef<any>(null);
  
  // 从URL参数中获取导航信息，URL参数会自动解码
  const fromKeyword = decodeURIComponent(searchParams.get('fromKeyword') || '');
  const fromCity = decodeURIComponent(searchParams.get('fromCity') || '');
  const toKeyword = decodeURIComponent(searchParams.get('toKeyword') || '');
  const toCity = decodeURIComponent(searchParams.get('toCity') || '');
  const navigationTypeParam = searchParams.get('navigationType') as NavigationType | null;
  
  const [navigationType, setNavigationType] = useState<NavigationType | null>(navigationTypeParam);
  const [showNavigationTypeSelector, setShowNavigationTypeSelector] = useState(!navigationTypeParam);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  // 大屏幕上默认显示侧边栏，小屏幕上默认隐藏
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  
  // 表单输入状态
  const [formFromKeyword, setFormFromKeyword] = useState(fromKeyword);
  const [formFromCity, setFormFromCity] = useState(fromCity);
  const [formToKeyword, setFormToKeyword] = useState(toKeyword);
  const [formToCity, setFormToCity] = useState(toCity);
  const [formNavigationType, setFormNavigationType] = useState<NavigationType>(navigationTypeParam || 'walking');
  
  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '路线导航 - 途智行';
    return () => { document.title = originalTitle; };
  }, []);

  // 同步URL参数到表单状态
  useEffect(() => {
    setFormFromKeyword(fromKeyword);
    setFormFromCity(fromCity);
    setFormToKeyword(toKeyword);
    setFormToCity(toCity);
    if (navigationTypeParam) {
      setFormNavigationType(navigationTypeParam);
    }
  }, [fromKeyword, fromCity, toKeyword, toCity, navigationTypeParam]);

  // 响应式处理：大屏幕自动显示侧边栏
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 初始化高德地图
  useEffect(() => {
    // 检查是否有必要的参数
    if (!fromKeyword && !fromCity) {
      setMapError('缺少起点信息');
      setIsLoading(false);
      return;
    }
    if (!toKeyword && !toCity) {
      setMapError('缺少终点信息');
      setIsLoading(false);
      return;
    }

    // 如果没有选择导航类型，不加载地图
    if (!navigationType) {
      setIsLoading(false);
      return;
    }

    // 检查高德地图脚本是否已加载
    if (window.AMap) {
      initMap();
      return;
    }

    // 加载高德地图脚本
    // 从 window.config 中获取 API key 和安全密钥
    const amapApiKey = window.config?.amapApiKey || '';
    const amapSecurityJsCode = window.config?.amapSecurityJsCode || '';
    
    // 验证 API Key 是否存在
    if (!amapApiKey || amapApiKey.trim() === '') {
      setMapError('API Key 缺失，请在 index.html 中配置 amapApiKey');
      setIsLoading(false);
      return;
    }
    
    // 根据高德地图官方文档，需要在加载 JS API 脚本之前设置安全密钥
    // 参考：https://lbs.amap.com/api/javascript-api-v2/guide/abc/jscode
    if (amapSecurityJsCode && amapSecurityJsCode.trim() !== '') {
      window._AMapSecurityConfig = {
        securityJsCode: amapSecurityJsCode.trim()
      };
    }
    
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapApiKey}&plugin=AMap.Walking,AMap.Driving,AMap.Transfer,AMap.Riding,AMap.Adaptor`;
    script.async = true;
    script.onload = () => {
      // 加载工具脚本（可选）
      const utilsScript = document.createElement('script');
      utilsScript.src = 'https://a.amap.com/jsapi_demos/static/demo-center/js/demoutils.js';
      utilsScript.onload = () => {
        initMap();
      };
      utilsScript.onerror = () => {
        // 即使工具脚本加载失败也继续初始化地图
        initMap();
      };
      document.head.appendChild(utilsScript);
    };
    script.onerror = () => {
      setMapError('高德地图脚本加载失败，请检查网络连接');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    // 加载样式
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://a.amap.com/jsapi_demos/static/demo-center/css/demo-center.css';
    document.head.appendChild(link);

    return () => {
      // 清理地图实例
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
      if (navigationInstanceRef.current) {
        navigationInstanceRef.current = null;
      }
    };
  }, [fromKeyword, fromCity, toKeyword, toCity, navigationType]);


  const initMap = () => {
    if (!mapContainerRef.current || !window.AMap || !navigationType) {
      return;
    }

    try {
      setIsLoading(true);
      setMapError(null);

      // 初始化地图
      const map = new window.AMap.Map(mapContainerRef.current, {
        resizeEnable: true,
        center: [116.397428, 39.90923], // 默认中心点（北京）
        zoom: 13
      });

      mapInstanceRef.current = map;

      // 根据导航类型初始化不同的导航服务
      let panelId: string;
      let navigationInstance: any;
      
      if (navigationType === 'walking') {
        panelId = 'walking-panel';
        navigationInstance = new window.AMap.Walking({
          map: map,
          panel: panelId
        });
      } else if (navigationType === 'driving') {
        panelId = 'driving-panel';
        navigationInstance = new window.AMap.Driving({
          map: map,
          panel: panelId
        });
      } else if (navigationType === 'transit') {
        // 公交导航
        panelId = 'transit-panel';
        // 获取城市信息（优先使用起点城市）
        const city = fromCity || toCity || '北京市';
        navigationInstance = new window.AMap.Transfer({
          map: map,
          city: city,
          panel: panelId,
          policy: window.AMap.TransferPolicy?.LEAST_TIME || 0 // 乘车策略：最少时间
        });
      } else {
        // 骑行导航
        panelId = 'riding-panel';
        navigationInstance = new window.AMap.Riding({
          map: map,
          panel: panelId
        });
      }

      navigationInstanceRef.current = navigationInstance;

      // 构建搜索点数组
      // 注意：高德地图API要求keyword和city参数需要正确编码
      const searchPoints: Array<{ keyword: string; city: string }> = [];

      // 起点 - 确保正确处理中文和特殊字符
      if (fromKeyword || fromCity) {
        // 确保URL解码后的字符串正确编码
        let startKeyword = '';
        let startCity = fromCity || '';
        
        // 如果字符串已经是正确编码，直接使用；否则可能需要重新编码
        try {
          // 确保字符串是UTF-8编码
          if (fromKeyword && fromCity) {
            // 如果关键词中已经包含城市，则直接使用关键词
            if (fromKeyword.includes(fromCity)) {
              startKeyword = fromKeyword;
            } else {
              startKeyword = fromCity + fromKeyword;
            }
          } else {
            startKeyword = fromKeyword || fromCity || '';
          }
          
          // 确保字符串没有双重编码问题
          // 如果字符串看起来像是URL编码的，尝试解码
          if (startKeyword.includes('%')) {
            try {
              startKeyword = decodeURIComponent(startKeyword);
            } catch (e) {
              // 解码失败，使用原始字符串
            }
          }
        } catch (e) {
          console.error('Error processing start location:', e);
          startKeyword = fromKeyword || fromCity || '';
        }
        
        searchPoints.push({
          keyword: startKeyword.trim(),
          city: startCity.trim()
        });
      }

      // 终点 - 确保正确处理中文和特殊字符
      if (toKeyword || toCity) {
        let endKeyword = '';
        let endCity = toCity || '';
        
        try {
          if (toKeyword && toCity) {
            // 如果关键词中已经包含城市，则直接使用关键词
            if (toKeyword.includes(toCity)) {
              endKeyword = toKeyword;
            } else {
              endKeyword = toCity + toKeyword;
            }
          } else {
            endKeyword = toKeyword || toCity || '';
          }
          
          // 确保字符串没有双重编码问题
          if (endKeyword.includes('%')) {
            try {
              endKeyword = decodeURIComponent(endKeyword);
            } catch (e) {
              // 解码失败，使用原始字符串
            }
          }
        } catch (e) {
          console.error('Error processing end location:', e);
          endKeyword = toKeyword || toCity || '';
        }
        
        searchPoints.push({
          keyword: endKeyword.trim(),
          city: endCity.trim()
        });
      }

      if (searchPoints.length < 2) {
        setMapError('起点或终点信息不完整');
        setIsLoading(false);
        return;
      }

      // 搜索路线
      const routeTypeTextMap: Record<NavigationType, string> = {
        walking: '步行',
        driving: '驾车',
        transit: '公交',
        riding: '骑行'
      };
      const routeTypeText = routeTypeTextMap[navigationType];
      console.log(`Searching ${navigationType} route with params:`, searchPoints);
      navigationInstance.search(searchPoints, (status: string, result: any) => {
        setIsLoading(false);
        if (status === 'complete') {
          if (window.log && typeof window.log.success === 'function') {
            window.log.success(`绘制${routeTypeText}路线完成`);
          }
          console.log(`${routeTypeText} route planning completed`, result);
          setMapError(null);
        } else {
          // 处理错误信息
          let errorMsg = '路线查询失败';
          
          if (result) {
            // 确保错误信息正确解码
            let errorInfo = result.info || result.message;
            if (!errorInfo && result) {
              try {
                errorInfo = JSON.stringify(result);
              } catch (e) {
                errorInfo = String(result);
              }
            }
            
            // 尝试解码UTF-8编码的字符串
            let errorStr = '';
            if (typeof errorInfo === 'string') {
              // 如果已经是字符串，检查是否需要解码
              try {
                // 尝试解码URL编码
                errorStr = decodeURIComponent(errorInfo);
              } catch (e) {
                // 如果解码失败，使用原始字符串
                errorStr = errorInfo;
              }
            } else {
              errorStr = String(errorInfo);
            }
            
            console.error(`${navigationType} route query error:`, errorStr, result);
            
            // 特殊处理常见错误
            if (errorStr.includes('INVALID_USER_SCODE')) {
              errorMsg = 'INVALID_USER_SCODE 错误\n\n常见原因：\n1. Key类型错误 - 需要使用"Web端(JS API)"类型，而非"Web服务"\n2. 缺少域名白名单 - 需要添加域名到白名单\n3. 服务未启用 - 需要启用"JavaScript API"服务\n\n解决方法：\n1. 访问 https://console.amap.com/dev/key/app\n2. 创建或选择"Web端(JS API)"类型的Key（不要使用Web服务类型）\n3. 添加域名白名单：localhost、127.0.0.1 或您的域名\n4. 启用"JavaScript API"和"路径规划"服务\n5. 在 index.html 中更新 amapApiKey';
            } else if (errorStr.includes('INVALID_USER_KEY')) {
              errorMsg = 'API Key 无效或已过期。\n请检查：\n1. Key 是否存在且已启用\n2. Key 类型是否正确\n3. 相关服务是否已启用\n\n访问: https://console.amap.com/dev/key/app';
            } else if (errorStr.includes('INVALID_PARAMS')) {
              errorMsg = '参数无效，请检查起点和终点信息是否正确。';
            } else if (errorStr.includes('DAILY_QUERY_OVER_LIMIT')) {
              errorMsg = 'API 调用次数已超限，请检查配额或升级套餐。';
            } else {
              errorMsg = `路线查询失败: ${errorStr}`;
            }
          }
          
          setMapError(errorMsg);
          if (window.log && typeof window.log.error === 'function') {
            window.log.error(errorMsg);
          }
        }
      });
    } catch (error) {
      console.error('地图初始化失败', error);
      setMapError('地图初始化失败: ' + (error instanceof Error ? error.message : '未知错误'));
      setIsLoading(false);
    }
  };

  // 处理导航类型选择
  const handleNavigationTypeSelect = (type: NavigationType) => {
    setNavigationType(type);
    setShowNavigationTypeSelector(false);
    // 更新URL参数
    const newParams = new URLSearchParams(searchParams);
    newParams.set('navigationType', type);
    setSearchParams(newParams);
  };

  // 处理表单提交
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formFromKeyword && !formFromCity) {
      alert('请输入起点信息');
      return;
    }
    if (!formToKeyword && !formToCity) {
      alert('请输入终点信息');
      return;
    }

    // 更新URL参数
    const newParams = new URLSearchParams();
    if (formFromKeyword) newParams.set('fromKeyword', formFromKeyword);
    if (formFromCity) newParams.set('fromCity', formFromCity);
    if (formToKeyword) newParams.set('toKeyword', formToKeyword);
    if (formToCity) newParams.set('toCity', formToCity);
    newParams.set('navigationType', formNavigationType);
    
    setSearchParams(newParams);
    setIsSidebarOpen(false); // 提交后关闭侧边栏
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm flex-shrink-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden mr-3 p-2 text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                title="打开路线规划"
              >
                <i className="fas fa-route text-lg"></i>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <i className="fas fa-route text-white text-lg"></i>
              </div>
              <h1 className="text-xl font-bold text-text-primary">途智行</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link 
                to="/my-trips"
                className="text-text-secondary hover:text-primary transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                返回
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* 主容器（包含侧边栏和主内容区） */}
      <div className="flex-1 flex relative">
        {/* 左侧菜单栏 */}
        <aside className={`fixed lg:static left-0 top-16 lg:top-0 bottom-0 w-80 bg-white shadow-lg z-30 transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        <div className="h-full flex flex-col">
          {/* 菜单头部 */}
          <div className="p-4 border-b border-border-light flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">路线规划</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
              title="关闭"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          {/* 表单内容 */}
          <div className="flex-1 overflow-y-auto p-4">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* 起点输入 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <i className="fas fa-map-marker-alt text-success mr-2"></i>
                  起点
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="地点名称（如：北京站）"
                    value={formFromKeyword}
                    onChange={(e) => setFormFromKeyword(e.target.value)}
                    className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="城市（如：北京）"
                    value={formFromCity}
                    onChange={(e) => setFormFromCity(e.target.value)}
                    className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* 终点输入 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <i className="fas fa-map-marker-alt text-danger mr-2"></i>
                  终点
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="地点名称（如：天安门）"
                    value={formToKeyword}
                    onChange={(e) => setFormToKeyword(e.target.value)}
                    className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="城市（如：北京）"
                    value={formToCity}
                    onChange={(e) => setFormToCity(e.target.value)}
                    className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* 交通方式选择 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <i className="fas fa-route mr-2"></i>
                  交通方式
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormNavigationType('walking')}
                    className={`p-3 border-2 rounded-lg transition-all flex flex-col items-center ${
                      formNavigationType === 'walking'
                        ? 'border-primary bg-blue-50'
                        : 'border-border-light hover:border-primary hover:bg-gray-50'
                    }`}
                  >
                    <i className="fas fa-walking text-2xl text-primary mb-1"></i>
                    <span className="text-xs font-medium text-text-primary">步行</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormNavigationType('driving')}
                    className={`p-3 border-2 rounded-lg transition-all flex flex-col items-center ${
                      formNavigationType === 'driving'
                        ? 'border-primary bg-blue-50'
                        : 'border-border-light hover:border-primary hover:bg-gray-50'
                    }`}
                  >
                    <i className="fas fa-car text-2xl text-primary mb-1"></i>
                    <span className="text-xs font-medium text-text-primary">驾车</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormNavigationType('transit')}
                    className={`p-3 border-2 rounded-lg transition-all flex flex-col items-center ${
                      formNavigationType === 'transit'
                        ? 'border-primary bg-blue-50'
                        : 'border-border-light hover:border-primary hover:bg-gray-50'
                    }`}
                  >
                    <i className="fas fa-bus text-2xl text-primary mb-1"></i>
                    <span className="text-xs font-medium text-text-primary">公交</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormNavigationType('riding')}
                    className={`p-3 border-2 rounded-lg transition-all flex flex-col items-center ${
                      formNavigationType === 'riding'
                        ? 'border-primary bg-blue-50'
                        : 'border-border-light hover:border-primary hover:bg-gray-50'
                    }`}
                  >
                    <i className="fas fa-bicycle text-2xl text-primary mb-1"></i>
                    <span className="text-xs font-medium text-text-primary">骑行</span>
                  </button>
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                className="w-full px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center"
              >
                <i className="fas fa-search mr-2"></i>
                开始导航
              </button>
            </form>
          </div>
        </div>
        </aside>

        {/* 遮罩层（侧边栏打开时显示，仅小屏幕） */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        
        {/* 主内容区 */}
        <main className="flex-1 flex flex-col relative min-w-0">
        {/* 起点和终点信息栏 */}
        <div className="bg-white border-b border-border-light px-4 sm:px-6 lg:px-8 py-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-6 flex-1">
              {/* 起点 */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-map-marker-alt text-white text-xs"></i>
                </div>
                <div>
                  <div className="text-xs text-text-secondary">起点</div>
                  <div className="text-sm font-medium text-text-primary">
                    {fromCity && fromKeyword ? `${fromCity}${fromKeyword}` : fromKeyword || fromCity || '未指定'}
                  </div>
                </div>
              </div>
              
              {/* 箭头 */}
              <i className="fas fa-arrow-right text-primary"></i>
              
              {/* 终点 */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-danger rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-map-marker-alt text-white text-xs"></i>
                </div>
                <div>
                  <div className="text-xs text-text-secondary">终点</div>
                  <div className="text-sm font-medium text-text-primary">
                    {toCity && toKeyword ? `${toCity}${toKeyword}` : toKeyword || toCity || '未指定'}
                  </div>
                </div>
              </div>
            </div>
            {/* 导航类型切换按钮组 */}
            {navigationType && (
              <div className="flex items-center space-x-2 flex-wrap">
                {(['walking', 'driving', 'transit', 'riding'] as NavigationType[]).map((type) => {
                  if (type === navigationType) return null;
                  const typeIcons = {
                    walking: 'fa-walking',
                    driving: 'fa-car',
                    transit: 'fa-bus',
                    riding: 'fa-bicycle'
                  };
                  const typeNames = {
                    walking: '步行',
                    driving: '驾车',
                    transit: '公交',
                    riding: '骑行'
                  };
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        // 清理现有实例
                        if (navigationInstanceRef.current) {
                          navigationInstanceRef.current = null;
                        }
                        // 更新状态和URL
                        setNavigationType(type);
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('navigationType', type);
                        setSearchParams(newParams);
                      }}
                      className="px-3 py-2 border border-border-light rounded-lg hover:border-primary hover:bg-blue-50 transition-all flex items-center space-x-2"
                      title={`切换为${typeNames[type]}导航`}
                    >
                      <i className={`fas ${typeIcons[type]} text-primary text-sm`}></i>
                      <span className="text-xs text-text-primary">{typeNames[type]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 导航类型选择器 */}
        {showNavigationTypeSelector && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-2xl w-full mx-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">选择导航方式</h2>
                <p className="text-text-secondary">请选择您希望的导航方式</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => handleNavigationTypeSelect('walking')}
                  className="flex flex-col items-center p-6 border-2 border-border-light rounded-lg hover:border-primary hover:bg-blue-50 transition-all"
                >
                  <i className="fas fa-walking text-4xl text-primary mb-3"></i>
                  <span className="text-lg font-semibold text-text-primary">步行导航</span>
                  <span className="text-xs text-text-secondary mt-2">适合短距离步行</span>
                </button>
                <button
                  onClick={() => handleNavigationTypeSelect('driving')}
                  className="flex flex-col items-center p-6 border-2 border-border-light rounded-lg hover:border-primary hover:bg-blue-50 transition-all"
                >
                  <i className="fas fa-car text-4xl text-primary mb-3"></i>
                  <span className="text-lg font-semibold text-text-primary">驾车导航</span>
                  <span className="text-xs text-text-secondary mt-2">适合自驾出行</span>
                </button>
                <button
                  onClick={() => handleNavigationTypeSelect('transit')}
                  className="flex flex-col items-center p-6 border-2 border-border-light rounded-lg hover:border-primary hover:bg-blue-50 transition-all"
                >
                  <i className="fas fa-bus text-4xl text-primary mb-3"></i>
                  <span className="text-lg font-semibold text-text-primary">公交导航</span>
                  <span className="text-xs text-text-secondary mt-2">适合公共交通出行</span>
                </button>
                <button
                  onClick={() => handleNavigationTypeSelect('riding')}
                  className="flex flex-col items-center p-6 border-2 border-border-light rounded-lg hover:border-primary hover:bg-blue-50 transition-all"
                >
                  <i className="fas fa-bicycle text-4xl text-primary mb-3"></i>
                  <span className="text-lg font-semibold text-text-primary">骑行导航</span>
                  <span className="text-xs text-text-secondary mt-2">适合自行车出行</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 地图容器和路线面板 */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                <p className="text-text-secondary">正在加载地图...</p>
              </div>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center max-w-md px-4">
                <i className="fas fa-exclamation-triangle text-4xl text-danger mb-4"></i>
                <div className="text-danger mb-4 whitespace-pre-line text-sm">
                  {mapError}
                </div>
                <div className="space-y-2">
                  <Link 
                    to="/my-trips"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors inline-block"
                  >
                    返回行程列表
                  </Link>
                  {mapError.includes('API Key') || mapError.includes('Key') || mapError.includes('INVALID') ? (
                    <div className="mt-4">
                      <a 
                        href="https://console.amap.com/dev/key/app" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-block text-sm"
                      >
                        打开高德开放平台
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* 地图容器 */}
          <div 
            id="container" 
            ref={mapContainerRef}
            className={`w-full h-full ${styles.mapContainer}`}
          ></div>

          {/* 路线面板 */}
          {navigationType && (
            <div 
              id={
                navigationType === 'walking' ? 'walking-panel' : 
                navigationType === 'driving' ? 'driving-panel' : 
                navigationType === 'transit' ? 'transit-panel' :
                'riding-panel'
              }
              className={`absolute top-4 right-4 bg-white rounded-lg shadow-lg max-h-[80vh] overflow-y-auto ${styles.panelContainer}`}
            ></div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
};

export default NavigationPage;
