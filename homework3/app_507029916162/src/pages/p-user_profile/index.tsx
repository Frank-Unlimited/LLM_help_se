

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { api } from '../../utils/api';

interface UserProfile {
  nickname: string;
  email: string;
  phone: string;
  gender: string;
  avatar: string;
}

interface PreferenceData {
  diet: string[];
  transport: string[];
  accommodation: string[];
  poi: string[];
  specialNeeds: string[];
}

const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    nickname: '',
    email: '',
    phone: '',
    gender: '',
    avatar: 'https://s.coze.cn/image/uOz64Qo6yTc/'
  });

  const [preferences, setPreferences] = useState<PreferenceData>({
    diet: ['seafood', 'local'],
    transport: ['public', 'car'],
    accommodation: ['hotel'],
    poi: ['historical', 'nature', 'food'],
    specialNeeds: ['wifi-required']
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = '个人中心 - 途智行';
    return () => { document.title = originalTitle; };
  }, []);

  // 检查登录状态并加载用户信息
  useEffect(() => {
    const loadUserProfile = async () => {
      const token = localStorage.getItem('authToken');
      const storedUserId = localStorage.getItem('userId');
      
      if (!token || !storedUserId) {
        // 未登录，跳转到登录页
        navigate('/login');
        return;
      }
      
      setUserId(storedUserId);
      setIsLoadingProfile(true);
      
      try {
        console.log('[UserProfile] Loading user profile for userId:', storedUserId);
        const profile = await api.getUserProfile(storedUserId);
        console.log('[UserProfile] Profile loaded successfully:', profile);
        setUserProfile({
          nickname: profile.nickname || '',
          email: profile.email || '',
          phone: profile.phone || '',
          gender: profile.gender || '',
          avatar: profile.avatar || 'https://s.coze.cn/image/uOz64Qo6yTc/'
        });
      } catch (error: any) {
        console.error('[UserProfile] 加载用户信息失败:', error);
        console.error('[UserProfile] Error details:', {
          message: error?.message,
          status: error?.response?.status,
          stack: error?.stack
        });
        
        // 检查是否是用户不存在的错误（404）
        const errorStatus = error?.status || (error?.response?.status);
        const errorMessage = error?.message || String(error);
        
        if (errorStatus === 404 || errorMessage.includes('404') || errorMessage.includes('User not found') || errorMessage.includes('请求失败: 404')) {
          // 用户不存在，清除登录状态并跳转到登录页
          console.warn('[UserProfile] User not found (404), clearing auth and redirecting to login');
          alert('用户信息不存在，请重新登录');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          navigate('/login');
          return;
        }
        
        // 检查是否是网络错误
        if (error?.isNetworkError || errorMessage.includes('网络连接失败')) {
          alert('网络连接失败，请检查网络连接或稍后重试');
          // 不设置用户信息，保持加载状态，让用户重试
          return;
        }
        
        // 其他错误，使用localStorage中的基本信息
        const username = localStorage.getItem('username') || '';
        const displayMessage = errorMessage && errorMessage !== '未知错误' 
          ? errorMessage 
          : '加载用户信息失败，请稍后重试';
        console.warn('[UserProfile] Using fallback profile data due to error');
        setUserProfile({
          nickname: '',
          email: '',
          phone: username,
          gender: '',
          avatar: 'https://s.coze.cn/image/uOz64Qo6yTc/'
        });
        // 只在非网络错误时显示alert
        if (!error?.isNetworkError) {
          alert(displayMessage);
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    loadUserProfile();
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleAvatarUpload = () => {
    if (avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setUserProfile(prev => ({ ...prev, avatar: e.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      alert('用户未登录');
      return;
    }
    
    setIsLoading(true);

    try {
      const updatedProfile = await api.updateUserProfile(userId, {
        nickname: userProfile.nickname || undefined,
        email: userProfile.email || undefined,
        gender: userProfile.gender || undefined,
        avatar: userProfile.avatar || undefined
      });
      
      // 更新本地状态
      setUserProfile({
        nickname: updatedProfile.nickname || '',
        email: updatedProfile.email || '',
        phone: updatedProfile.phone || '',
        gender: updatedProfile.gender || '',
        avatar: updatedProfile.avatar || 'https://s.coze.cn/image/uOz64Qo6yTc/'
      });
      
      // 更新localStorage中的email（如果修改了邮箱）
      if (updatedProfile.email) {
        // 注意：这里不更新username，因为username是手机号
      }
      
      alert('个人资料保存成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert(error instanceof Error ? error.message : '保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileCancel = async () => {
    // 重新加载原始数据
    if (!userId) return;
    
    try {
      const profile = await api.getUserProfile(userId);
      setUserProfile({
        nickname: profile.nickname || '',
        email: profile.email || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        avatar: profile.avatar || 'https://s.coze.cn/image/uOz64Qo6yTc/'
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  };

  const handlePreferenceToggle = (category: keyof PreferenceData, value: string) => {
    setPreferences(prev => {
      const currentArray = prev[category] as string[];
      const isSelected = currentArray.includes(value);
      
      return {
        ...prev,
        [category]: isSelected 
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
  };

  const handleSpecialNeedToggle = (value: string) => {
    setPreferences(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.includes(value)
        ? prev.specialNeeds.filter(item => item !== value)
        : [...prev.specialNeeds, value]
    }));
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('保存偏好设置:', preferences);
      alert('偏好设置保存成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesCancel = () => {
    setPreferences({
      diet: ['seafood', 'local'],
      transport: ['public', 'car'],
      accommodation: ['hotel'],
      poi: ['historical', 'nature', 'food'],
      specialNeeds: ['wifi-required']
    });
  };

  const handlePasswordChange = async () => {
    if (!userId) {
      alert('用户未登录');
      return;
    }
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('请填写完整的密码信息');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('新密码和确认密码不一致');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('新密码长度至少6位');
      return;
    }

    setIsLoading(true);

    try {
      await api.changePassword(userId, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      alert('密码修改成功！');
      
      // 清空表单
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('修改失败:', error);
      alert(error instanceof Error ? error.message : '修改失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWechatUnbind = async () => {
    if (confirm('确定要解绑微信账号吗？')) {
      setIsLoading(true);
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('解绑微信成功');
        alert('微信解绑成功');
      } catch (error) {
        console.error('解绑失败:', error);
        alert('解绑失败，请重试');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAlipayBind = () => {
    console.log('需要调用第三方接口实现支付宝绑定功能');
    alert('跳转到支付宝授权页面...');
  };

  const isPreferenceSelected = (category: keyof PreferenceData, value: string) => {
    return (preferences[category] as string[]).includes(value);
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
            <Link to="/home" className="text-text-secondary hover:text-primary py-1 transition-colors">首页</Link>
            <Link to="/my-trips" className="text-text-secondary hover:text-primary py-1 transition-colors">我的行程</Link>
            <Link to="/user-profile" className="text-primary font-medium border-b-2 border-primary py-1">个人中心</Link>
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
            <button 
              onClick={handleSidebarToggle}
              className="md:hidden p-2 text-text-secondary hover:text-primary"
              aria-label="切换侧边栏"
              title="切换侧边栏"
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </header>

      {/* 左侧菜单 */}
      <aside className={`fixed left-0 top-16 bottom-0 w-60 bg-white shadow-sm z-40 ${styles.sidebarTransition} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4">
          <nav className="space-y-2">
            <Link to="/home" className="flex items-center space-x-3 px-4 py-3 text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors">
              <i className="fas fa-home text-lg"></i>
              <span>首页</span>
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
            <Link to="/user-profile" className="flex items-center space-x-3 px-4 py-3 text-primary bg-blue-50 rounded-lg">
              <i className="fas fa-user text-lg"></i>
              <span className="font-medium">个人中心</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="ml-0 md:ml-60 mt-16 min-h-screen transition-all duration-300">
        {/* 页面头部 */}
        <section className="bg-white border-b border-border-light px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">个人中心</h1>
              <nav className="flex items-center space-x-2 text-sm text-text-secondary mt-1">
                <Link to="/home" className="hover:text-primary">首页</Link>
                <i className="fas fa-chevron-right text-xs"></i>
                <span>个人中心</span>
              </nav>
            </div>
          </div>
        </section>

        {/* 个人资料区 */}
        <section className="py-8 px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-card p-8">
              <h2 className="text-xl font-semibold text-text-primary mb-6">个人资料</h2>
              
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-12">
                  <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
                  <span className="ml-4 text-text-secondary">加载中...</span>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* 头像上传 */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <img 
                      src={userProfile.avatar}
                      alt="用户头像" 
                      className="w-20 h-20 rounded-full object-cover border-4 border-border-light"
                    />
                    <button 
                      type="button" 
                      onClick={handleAvatarUpload}
                      className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                      aria-label="上传头像"
                      title="上传头像"
                    >
                      <i className="fas fa-camera text-xs"></i>
                    </button>
                    <input 
                      type="file" 
                      ref={avatarInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*" 
                      className="hidden"
                      aria-label="选择头像图片"
                      title="选择头像图片"
                    />
                  </div>
                  <div>
                    <button 
                      type="button" 
                      onClick={handleAvatarUpload}
                      className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                    >
                      <i className="fas fa-upload mr-2"></i>
                      更换头像
                    </button>
                    <p className="text-sm text-text-secondary mt-1">支持JPG、PNG格式，文件大小不超过2MB</p>
                  </div>
                </div>
                
                {/* 基本信息 */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nickname" className="block text-sm font-medium text-text-primary mb-2">昵称</label>
                    <input 
                      type="text" 
                      id="nickname" 
                      value={userProfile.nickname}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, nickname: e.target.value }))}
                      className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.formInputFocus}`}
                      placeholder="请输入昵称"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">邮箱</label>
                    <input 
                      type="email" 
                      id="email" 
                      value={userProfile.email}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.formInputFocus}`}
                      placeholder="请输入邮箱"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">手机号</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.formInputFocus} bg-gray-50`}
                      placeholder="请输入手机号"
                      disabled
                      title="手机号不可修改"
                    />
                    <p className="text-xs text-text-secondary mt-1">手机号注册后不可修改</p>
                  </div>
                  
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-text-primary mb-2">性别</label>
                    <select 
                      id="gender" 
                      value={userProfile.gender}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, gender: e.target.value }))}
                      className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.formInputFocus}`}
                    >
                      <option value="">请选择</option>
                      <option value="male">男</option>
                      <option value="female">女</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>
                
                {/* 保存按钮 */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button 
                    type="button" 
                    onClick={handleProfileCancel}
                    className="px-6 py-3 text-text-secondary border border-border-light rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        保存中...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        保存修改
                      </>
                    )}
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>
        </section>

        {/* 旅行偏好设置区 */}
        <section className="py-8 px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-card p-8">
              <h2 className="text-xl font-semibold text-text-primary mb-6">旅行偏好设置</h2>
              
              <form onSubmit={handlePreferencesSubmit} className="space-y-8">
                {/* 饮食偏好 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-text-primary">饮食偏好</h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'spicy', icon: 'fas fa-pepper-hot', label: '喜欢辣' },
                      { value: 'seafood', icon: 'fas fa-fish', label: '喜欢海鲜' },
                      { value: 'vegetarian', icon: 'fas fa-leaf', label: '素食主义' },
                      { value: 'local', icon: 'fas fa-utensils', label: '当地特色' },
                      { value: 'western', icon: 'fas fa-hamburger', label: '西餐' },
                      { value: 'dessert', icon: 'fas fa-birthday-cake', label: '甜品' }
                    ].map(item => (
                      <button 
                        key={item.value}
                        type="button" 
                        onClick={() => handlePreferenceToggle('diet', item.value)}
                        className={`${styles.preferenceTag} px-4 py-2 border rounded-lg hover:border-primary transition-colors ${
                          isPreferenceSelected('diet', item.value) 
                            ? `${styles.selected} border-primary` 
                            : 'border-border-light'
                        }`}
                      >
                        <i className={`${item.icon} mr-2`}></i>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 交通偏好 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-text-primary">交通偏好</h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'public', icon: 'fas fa-subway', label: '公共交通' },
                      { value: 'taxi', icon: 'fas fa-taxi', label: '出租车' },
                      { value: 'bike', icon: 'fas fa-bicycle', label: '自行车' },
                      { value: 'walk', icon: 'fas fa-walking', label: '步行' },
                      { value: 'car', icon: 'fas fa-car', label: '自驾' }
                    ].map(item => (
                      <button 
                        key={item.value}
                        type="button" 
                        onClick={() => handlePreferenceToggle('transport', item.value)}
                        className={`${styles.preferenceTag} px-4 py-2 border rounded-lg hover:border-primary transition-colors ${
                          isPreferenceSelected('transport', item.value) 
                            ? `${styles.selected} border-primary` 
                            : 'border-border-light'
                        }`}
                      >
                        <i className={`${item.icon} mr-2`}></i>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 住宿偏好 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-text-primary">住宿偏好</h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'hotel', icon: 'fas fa-bed', label: '酒店' },
                      { value: 'hostel', icon: 'fas fa-users', label: '青年旅社' },
                      { value: 'apartment', icon: 'fas fa-home', label: '公寓民宿' },
                      { value: 'resort', icon: 'fas fa-palm-tree', label: '度假村' },
                      { value: 'budget', icon: 'fas fa-coins', label: '经济型' },
                      { value: 'luxury', icon: 'fas fa-crown', label: '豪华型' }
                    ].map(item => (
                      <button 
                        key={item.value}
                        type="button" 
                        onClick={() => handlePreferenceToggle('accommodation', item.value)}
                        className={`${styles.preferenceTag} px-4 py-2 border rounded-lg hover:border-primary transition-colors ${
                          isPreferenceSelected('accommodation', item.value) 
                            ? `${styles.selected} border-primary` 
                            : 'border-border-light'
                        }`}
                      >
                        <i className={`${item.icon} mr-2`}></i>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 兴趣点偏好 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-text-primary">兴趣点类型</h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'historical', icon: 'fas fa-landmark', label: '历史文化' },
                      { value: 'nature', icon: 'fas fa-mountain', label: '自然风光' },
                      { value: 'shopping', icon: 'fas fa-shopping-bag', label: '购物' },
                      { value: 'food', icon: 'fas fa-utensils', label: '美食' },
                      { value: 'entertainment', icon: 'fas fa-theater-masks', label: '娱乐' },
                      { value: 'religious', icon: 'fas fa-place-of-worship', label: '宗教场所' },
                      { value: 'museum', icon: 'fas fa-university', label: '博物馆' },
                      { value: 'park', icon: 'fas fa-tree', label: '公园绿地' }
                    ].map(item => (
                      <button 
                        key={item.value}
                        type="button" 
                        onClick={() => handlePreferenceToggle('poi', item.value)}
                        className={`${styles.preferenceTag} px-4 py-2 border rounded-lg hover:border-primary transition-colors ${
                          isPreferenceSelected('poi', item.value) 
                            ? `${styles.selected} border-primary` 
                            : 'border-border-light'
                        }`}
                      >
                        <i className={`${item.icon} mr-2`}></i>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 特殊需求 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-text-primary">特殊需求</h3>
                  <div className="space-y-3">
                    {[
                      { value: 'wheelchair-accessible', label: '无障碍设施' },
                      { value: 'child-friendly', label: '适合儿童' },
                      { value: 'pet-friendly', label: '允许携带宠物' },
                      { value: 'wifi-required', label: '需要WiFi' }
                    ].map(item => (
                      <div key={item.value} className="flex items-center">
                        <input 
                          type="checkbox" 
                          id={item.value}
                          checked={preferences.specialNeeds.includes(item.value)}
                          onChange={() => handleSpecialNeedToggle(item.value)}
                          className="w-4 h-4 text-primary border-border-light rounded focus:ring-primary"
                        />
                        <label htmlFor={item.value} className="ml-3 text-text-primary">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 保存偏好按钮 */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-border-light">
                  <button 
                    type="button" 
                    onClick={handlePreferencesCancel}
                    className="px-6 py-3 text-text-secondary border border-border-light rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        保存中...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        保存偏好
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* 账号安全区 */}
        <section className="py-8 px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-card p-8">
              <h2 className="text-xl font-semibold text-text-primary mb-6">账号安全</h2>
              
              <div className="space-y-6">
                {/* 修改密码 */}
                <div className="border-b border-border-light pb-6">
                  <h3 className="text-lg font-medium text-text-primary mb-4">修改密码</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <p className="text-text-secondary text-sm mb-4">定期更换密码可以保护您的账号安全</p>
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="current-password" className="block text-sm font-medium text-text-primary mb-2">当前密码</label>
                          <input 
                            type="password" 
                            id="current-password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.formInputFocus}`}
                            placeholder="请输入当前密码"
                          />
                        </div>
                        <div>
                          <label htmlFor="new-password" className="block text-sm font-medium text-text-primary mb-2">新密码</label>
                          <input 
                            type="password" 
                            id="new-password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.formInputFocus}`}
                            placeholder="请输入新密码"
                          />
                        </div>
                        <div>
                          <label htmlFor="confirm-password" className="block text-sm font-medium text-text-primary mb-2">确认新密码</label>
                          <input 
                            type="password" 
                            id="confirm-password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.formInputFocus}`}
                            placeholder="请再次输入新密码"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button 
                      onClick={handlePasswordChange}
                      disabled={isLoading}
                      className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          修改中...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-key mr-2"></i>
                          修改密码
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* 第三方账号绑定 */}
                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">第三方账号绑定</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border-light rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <i className="fab fa-weixin text-white"></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-text-primary">微信</h4>
                          <p className="text-sm text-text-secondary">已绑定</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleWechatUnbind}
                        disabled={isLoading}
                        className="px-4 py-2 text-danger border border-danger rounded-lg hover:bg-danger hover:text-white transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            解绑中...
                          </>
                        ) : (
                          '解绑'
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-border-light rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <i className="fab fa-alipay text-white"></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-text-primary">支付宝</h4>
                          <p className="text-sm text-text-secondary">未绑定</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleAlipayBind}
                        className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                      >
                        绑定
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default UserProfilePage;

