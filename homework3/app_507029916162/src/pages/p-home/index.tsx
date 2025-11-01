

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { updateConfig } from '../../config';
import { api } from '../../utils/api';

const HomePage: React.FC = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    userId?: string;
    username?: string;
  }>({});
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // 前端配置状态
  const [frontendConfig, setFrontendConfig] = useState({
    VITE_ASR_SECRET_ID: localStorage.getItem('config_VITE_ASR_SECRET_ID') || '',
    VITE_ASR_SECRET_KEY: localStorage.getItem('config_VITE_ASR_SECRET_KEY') || '',
    VITE_ASR_APP_ID: localStorage.getItem('config_VITE_ASR_APP_ID') || '',
    VITE_AMAP_API_KEY: localStorage.getItem('config_VITE_AMAP_API_KEY') || '',
    VITE_AMAP_SECURITY_JS_CODE: localStorage.getItem('config_VITE_AMAP_SECURITY_JS_CODE') || '',
  });
  
  // 后端配置状态
  const [backendConfig, setBackendConfig] = useState({
    COZE_API_TOKEN: '',
    COZE_WORKFLOW_ID: '',
    COZE_EXPENSE_WORKFLOW_ID: '',
    HOST: '0.0.0.0',
    PORT: '3000',
    DEBUG: 'true',
    ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:3000',
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const originalTitle = document.title;
    document.title = '途智行 - 智能旅行规划平台';
    return () => { document.title = originalTitle; };
  }, []);

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    
    if (token) {
      setIsLoggedIn(true);
      setUserInfo({
        userId: userId || undefined,
        username: username || undefined
      });
    } else {
      setIsLoggedIn(false);
      setUserInfo({});
    }
  }, []);

  // 监听storage变化（用于处理在其他标签页登录/退出）
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');
      
      if (token) {
        setIsLoggedIn(true);
        setUserInfo({
          userId: userId || undefined,
          username: username || undefined
        });
      } else {
        setIsLoggedIn(false);
        setUserInfo({});
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleStartPlanning = () => {
    navigate('/plan-input');
  };

  const handleViewTrips = () => {
    navigate('/my-trips');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    // 清除登录信息
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    
    // 更新状态
    setIsLoggedIn(false);
    setUserInfo({});
    
    // 刷新页面或跳转到首页
    navigate('/home');
    window.location.reload();
  };

  const handleSaveFrontendConfig = () => {
    try {
      // 保存到 localStorage
      updateConfig('VITE_ASR_SECRET_ID', frontendConfig.VITE_ASR_SECRET_ID);
      updateConfig('VITE_ASR_SECRET_KEY', frontendConfig.VITE_ASR_SECRET_KEY);
      updateConfig('VITE_ASR_APP_ID', frontendConfig.VITE_ASR_APP_ID);
      updateConfig('VITE_AMAP_API_KEY', frontendConfig.VITE_AMAP_API_KEY);
      updateConfig('VITE_AMAP_SECURITY_JS_CODE', frontendConfig.VITE_AMAP_SECURITY_JS_CODE);
      
      setConfigMessage({ type: 'success', text: '前端配置已保存！页面将自动刷新以应用更改。' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setConfigMessage({ type: 'error', text: '保存前端配置失败：' + (error as Error).message });
    }
  };

  const handleSaveBackendConfig = async () => {
    setConfigSaving(true);
    setConfigMessage(null);
    
    try {
      await api.saveBackendConfig(backendConfig);
      setConfigMessage({ type: 'success', text: '后端配置已保存！请重启后端服务以使更改生效。' });
    } catch (error: any) {
      setConfigMessage({ type: 'error', text: '保存后端配置失败：' + (error.message || '未知错误') });
    } finally {
      setConfigSaving(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 h-16">
        <div className="flex items-center justify-between h-full px-6">
          {/* Logo和产品名称 */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <i className="fas fa-route text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-bold text-text-primary">途智行</h1>
          </div>
          
          {/* 主导航 */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/home" className="text-primary font-medium border-b-2 border-primary py-1">首页</Link>
            <Link to="/my-trips" className="text-text-secondary hover:text-primary py-1 transition-colors">我的行程</Link>
            <Link to="/user-profile" className="text-text-secondary hover:text-primary py-1 transition-colors">个人中心</Link>
          </nav>
          
          {/* 搜索框和用户操作区 */}
          <div className="flex items-center space-x-4">
            <div className="hidden lg:block">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="搜索目的地..." 
                  className="w-64 pl-10 pr-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
              </div>
            </div>
            
            {/* API配置按钮 */}
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="px-3 py-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
              title="API配置"
            >
              <i className="fas fa-cog"></i>
            </button>
            
            {isLoggedIn ? (
              /* 已登录 - 显示用户信息 */
              <div className="flex items-center space-x-3">
                <Link 
                  to="/user-profile"
                  className="flex items-center space-x-2 px-3 py-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-white text-sm"></i>
                  </div>
                  <span className="hidden md:block text-sm font-medium">
                    {userInfo.username || '用户'}
                  </span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-gray-50 hover:text-primary transition-colors text-sm"
                  title="退出登录"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  <span className="hidden md:inline">退出</span>
                </button>
              </div>
            ) : (
              /* 未登录 - 显示登录注册按钮 */
              <>
                <button 
                  onClick={handleLogin}
                  className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                >
                  登录
                </button>
                <button 
                  onClick={handleRegister}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  注册
                </button>
              </>
            )}
            
            <button 
              onClick={handleSidebarToggle}
              className="md:hidden p-2 text-text-secondary hover:text-primary"
              aria-label="切换侧边栏"
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </header>

      {/* 左侧菜单 */}
      <aside className={`fixed left-0 top-16 bottom-0 w-60 bg-white shadow-sm z-40 ${styles.sidebarTransition} ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4">
          <nav className="space-y-2">
            <Link to="/home" className="flex items-center space-x-3 px-4 py-3 text-primary bg-blue-50 rounded-lg">
              <i className="fas fa-home text-lg"></i>
              <span className="font-medium">首页</span>
            </Link>
            <Link to="/plan-input" className="flex items-center space-x-3 px-4 py-3 text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors">
              <i className="fas fa-route text-lg"></i>
              <span>行程规划</span>
            </Link>
            <Link to="/my-trips" className="flex items-center space-x-3 px-4 py-3 text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors">
              <i className="fas fa-list text-lg"></i>
              <span>我的行程</span>
            </Link>
            <Link to="/navigation" className="flex items-center space-x-3 px-4 py-3 text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors">
              <i className="fas fa-map-marked-alt text-lg"></i>
              <span>地图交互</span>
            </Link>
            <Link to="/budget-manage" className="flex items-center space-x-3 px-4 py-3 text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors">
              <i className="fas fa-wallet text-lg"></i>
              <span>预算管理</span>
            </Link>
            <Link to="/user-profile" className="flex items-center space-x-3 px-4 py-3 text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors">
              <i className="fas fa-user text-lg"></i>
              <span>个人中心</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="ml-0 md:ml-60 mt-16 min-h-screen transition-all duration-300">
        {/* 页面头部 */}
        <section className={`${styles.heroGradient} text-white py-20 px-8`}>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">AI智能旅行规划</h1>
            <p className="text-xl mb-8 opacity-90">让每一次旅行都充满惊喜，个性化行程为你量身定制</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleStartPlanning}
                className="px-8 py-4 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                <i className="fas fa-rocket mr-2"></i>
                开始规划
              </button>
              <button 
                onClick={handleViewTrips}
                className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors"
              >
                <i className="fas fa-map mr-2"></i>
                查看我的行程
              </button>
            </div>
          </div>
        </section>

        {/* 产品介绍区 */}
        <section className="py-16 px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-primary mb-4">为什么选择途智行？</h2>
              <p className="text-lg text-text-secondary">AI驱动的智能规划，让旅行变得更简单</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 智能规划 */}
              <div className={`bg-white rounded-xl p-6 shadow-card ${styles.featureCard} transition-all duration-300 ${styles.cardHover}`}>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-brain text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">AI智能规划</h3>
                <p className="text-text-secondary mb-4">基于你的偏好和需求，AI自动生成个性化行程，包含景点、餐厅、交通等详细安排。</p>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-center">
                    <i className="fas fa-check text-success mr-2"></i>
                    智能推荐算法
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-success mr-2"></i>
                    实时调整优化
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-success mr-2"></i>
                    多维度考量
                  </li>
                </ul>
              </div>
              
              {/* 预算管理 */}
              <div className={`bg-white rounded-xl p-6 shadow-card ${styles.featureCard} transition-all duration-300 ${styles.cardHover}`}>
                <div className="w-12 h-12 bg-gradient-to-br from-tertiary to-primary rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-chart-pie text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">智能预算管理</h3>
                <p className="text-text-secondary mb-4">实时追踪旅行开销，智能分析预算分配，让每一分钱都花在刀刃上。</p>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-center">
                    <i className="fas fa-check text-success mr-2"></i>
                    实时开销记录
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-success mr-2"></i>
                    预算对比分析
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-success mr-2"></i>
                    费用统计报告
                  </li>
                </ul>
              </div>
              
              {/* 便捷管理 */}
              <div className={`bg-white rounded-xl p-6 shadow-card ${styles.featureCard} transition-all duration-300 ${styles.cardHover}`}>
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-tertiary rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-mobile-alt text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">便捷管理</h3>
                <p className="text-text-secondary mb-4">云端同步，多设备访问，让你的旅行计划随时随地触手可及。</p>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-center">
                    <i className="fas fa-check text-success mr-2"></i>
                    云端数据同步
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-success mr-2"></i>
                    多设备访问
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-success mr-2"></i>
                    一键分享
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 快速入口区 */}
        <section className="py-16 px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-primary mb-4">快速开始</h2>
              <p className="text-lg text-text-secondary">选择适合你的方式开始智能旅行规划</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* 开始规划 */}
              <div 
                onClick={handleStartPlanning}
                className={`bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 text-white shadow-lg ${styles.cardHover} cursor-pointer`}
              >
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                    <i className="fas fa-plus text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">开始新的旅行规划</h3>
                    <p className="text-sm opacity-90">AI为你定制专属行程</p>
                  </div>
                </div>
                <p className="mb-6 opacity-90">输入你的旅行需求，AI将为你生成详细的个性化行程方案，包含每日安排、景点推荐、餐饮建议等。</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartPlanning();
                  }}
                  className="px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  <i className="fas fa-rocket mr-2"></i>
                  立即开始
                </button>
              </div>
              
              {/* 查看行程 */}
              <div 
                onClick={handleViewTrips}
                className={`bg-gradient-to-br from-tertiary to-primary rounded-2xl p-8 text-white shadow-lg ${styles.cardHover} cursor-pointer`}
              >
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                    <i className="fas fa-list-alt text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">查看我的行程</h3>
                    <p className="text-sm opacity-90">管理已有的旅行计划</p>
                  </div>
                </div>
                <p className="mb-6 opacity-90">查看、编辑、分享你已保存的旅行计划，继续完善你的旅行安排。</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewTrips();
                  }}
                  className="px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  <i className="fas fa-eye mr-2"></i>
                  查看行程
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 用户案例/推荐区 */}
        <section className="py-16 px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-primary mb-4">用户的声音</h2>
              <p className="text-lg text-text-secondary">看看其他旅行者如何使用途智行</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* 案例1 */}
              <div className={`bg-white rounded-xl p-6 shadow-card ${styles.cardHover}`}>
                <div className="flex items-center mb-4">
                  <img 
                    src="https://s.coze.cn/image/edv1pvVZGqY/" 
                    alt="年轻女性头像" 
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-text-primary">小雨</h4>
                    <div className="flex text-warning">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                    </div>
                  </div>
                </div>
                <p className="text-text-secondary italic">"第一次用AI规划旅行，效果超出预期！行程安排得很合理，预算控制得也很好，省去了我很多时间。"</p>
                <div className="mt-4 text-sm text-text-secondary">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  日本东京 · 5天4夜
                </div>
              </div>
              
              {/* 案例2 */}
              <div className={`bg-white rounded-xl p-6 shadow-card ${styles.cardHover}`}>
                <div className="flex items-center mb-4">
                  <img 
                    src="https://s.coze.cn/image/rD0q3QgjteI/" 
                    alt="年轻男性头像" 
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-text-primary">阿明</h4>
                    <div className="flex text-warning">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                    </div>
                  </div>
                </div>
                <p className="text-text-secondary italic">"作为一个经常出差的人，途智行帮我节省了大量规划时间。预算管理功能特别实用，再也不用担心超支了。"</p>
                <div className="mt-4 text-sm text-text-secondary">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  欧洲三国 · 10天9夜
                </div>
              </div>
              
              {/* 案例3 */}
              <div className={`bg-white rounded-xl p-6 shadow-card ${styles.cardHover}`}>
                <div className="flex items-center mb-4">
                  <img 
                    src="https://s.coze.cn/image/-ikJn5-PzVw/" 
                    alt="年轻女性头像" 
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-text-primary">晓晓</h4>
                    <div className="flex text-warning">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                    </div>
                  </div>
                </div>
                <p className="text-text-secondary italic">"带父母旅行最怕安排不好，途智行的AI规划很贴心，考虑到了老人的体力和兴趣点，全家都很满意！"</p>
                <div className="mt-4 text-sm text-text-secondary">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  云南大理 · 7天6夜
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* API配置模态框 */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">API 配置</h2>
              <button
                onClick={() => {
                  setIsConfigModalOpen(false);
                  setConfigMessage(null);
                }}
                className="text-text-secondary hover:text-text-primary"
                title="关闭配置面板"
                aria-label="关闭配置面板"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {configMessage && (
                <div className={`p-4 rounded-lg ${
                  configMessage.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {configMessage.text}
                </div>
              )}

              {/* 前端配置 */}
              <div>
                <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
                  <i className="fas fa-desktop mr-2"></i>
                  前端配置
                </h3>
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      腾讯云 Secret ID (VITE_ASR_SECRET_ID)
                    </label>
                    <input
                      type="text"
                      value={frontendConfig.VITE_ASR_SECRET_ID}
                      onChange={(e) => setFrontendConfig({ ...frontendConfig, VITE_ASR_SECRET_ID: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="AKID..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      腾讯云 Secret Key (VITE_ASR_SECRET_KEY)
                    </label>
                    <input
                      type="password"
                      value={frontendConfig.VITE_ASR_SECRET_KEY}
                      onChange={(e) => setFrontendConfig({ ...frontendConfig, VITE_ASR_SECRET_KEY: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="sb9..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      腾讯云 App ID (VITE_ASR_APP_ID)
                    </label>
                    <input
                      type="text"
                      value={frontendConfig.VITE_ASR_APP_ID}
                      onChange={(e) => setFrontendConfig({ ...frontendConfig, VITE_ASR_APP_ID: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="1310310414"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      高德地图 API Key (VITE_AMAP_API_KEY)
                    </label>
                    <input
                      type="text"
                      value={frontendConfig.VITE_AMAP_API_KEY}
                      onChange={(e) => setFrontendConfig({ ...frontendConfig, VITE_AMAP_API_KEY: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="52dd846396088bec9ffbdb6f06760c22"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      高德地图 Security JS Code (VITE_AMAP_SECURITY_JS_CODE)
                    </label>
                    <input
                      type="text"
                      value={frontendConfig.VITE_AMAP_SECURITY_JS_CODE}
                      onChange={(e) => setFrontendConfig({ ...frontendConfig, VITE_AMAP_SECURITY_JS_CODE: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="f99450c170e1b26951ad24c3c66840f8"
                    />
                  </div>
                  <button
                    onClick={handleSaveFrontendConfig}
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <i className="fas fa-save mr-2"></i>
                    保存前端配置
                  </button>
                </div>
              </div>

              {/* 后端配置 */}
              <div>
                <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
                  <i className="fas fa-server mr-2"></i>
                  后端配置
                </h3>
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Coze API Token (COZE_API_TOKEN)
                    </label>
                    <input
                      type="password"
                      value={backendConfig.COZE_API_TOKEN}
                      onChange={(e) => setBackendConfig({ ...backendConfig, COZE_API_TOKEN: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="pat_kHM3rm8CbTqUuDk5JoSGVErqFGkiP0Q5uq2qW0qpr4zVER79upO0lLgLNIdiTlGN"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Coze Workflow ID (COZE_WORKFLOW_ID)
                    </label>
                    <input
                      type="text"
                      value={backendConfig.COZE_WORKFLOW_ID}
                      onChange={(e) => setBackendConfig({ ...backendConfig, COZE_WORKFLOW_ID: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="7566908212949270528"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Coze Expense Workflow ID (COZE_EXPENSE_WORKFLOW_ID)
                    </label>
                    <input
                      type="text"
                      value={backendConfig.COZE_EXPENSE_WORKFLOW_ID}
                      onChange={(e) => setBackendConfig({ ...backendConfig, COZE_EXPENSE_WORKFLOW_ID: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="7567323652867375167"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Host (HOST)
                      </label>
                      <input
                        type="text"
                        value={backendConfig.HOST}
                        onChange={(e) => setBackendConfig({ ...backendConfig, HOST: e.target.value })}
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.0.0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Port (PORT)
                      </label>
                      <input
                        type="text"
                        value={backendConfig.PORT}
                        onChange={(e) => setBackendConfig({ ...backendConfig, PORT: e.target.value })}
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="3000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Debug (DEBUG)
                    </label>
                    <select
                      value={backendConfig.DEBUG}
                      onChange={(e) => setBackendConfig({ ...backendConfig, DEBUG: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Debug mode selection"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Allowed Origins (ALLOWED_ORIGINS)
                    </label>
                    <input
                      type="text"
                      value={backendConfig.ALLOWED_ORIGINS}
                      onChange={(e) => setBackendConfig({ ...backendConfig, ALLOWED_ORIGINS: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="http://localhost:5173,http://localhost:3000"
                    />
                  </div>
                  <button
                    onClick={handleSaveBackendConfig}
                    disabled={configSaving}
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {configSaving ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        保存中...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        保存后端配置
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;

