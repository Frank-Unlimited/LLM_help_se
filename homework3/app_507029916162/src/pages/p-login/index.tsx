

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { api } from '../../utils/api';

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface RegisterFormData {
  phone: string;
  email: string;
  password: string;
  verifyCode: string;
  agreeTerms: boolean;
}

interface ForgotPasswordFormData {
  email: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [verifyCodeCountdown, setVerifyCodeCountdown] = useState(0);
  
  // 表单数据
  const [loginFormData, setLoginFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    rememberMe: false
  });
  
  const [registerFormData, setRegisterFormData] = useState<RegisterFormData>({
    phone: '',
    email: '',
    password: '',
    verifyCode: '',
    agreeTerms: false
  });
  
  const [forgotPasswordFormData, setForgotPasswordFormData] = useState<ForgotPasswordFormData>({
    email: ''
  });

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '登录/注册 - 途智行';
    return () => { document.title = originalTitle; };
  }, []);

  // 验证码倒计时
  useEffect(() => {
    let timer: number | null = null;
    if (verifyCodeCountdown > 0) {
      timer = window.setTimeout(() => {
        setVerifyCodeCountdown(verifyCodeCountdown - 1);
      }, 1000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [verifyCodeCountdown]);

  // 处理标签切换
  const handleTabSwitch = (tab: 'login' | 'register') => {
    setActiveTab(tab);
  };

  // 处理登录表单输入
  const handleLoginInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setLoginFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理注册表单输入
  const handleRegisterInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
    setRegisterFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理忘记密码表单输入
  const handleForgotPasswordInputChange = (field: keyof ForgotPasswordFormData, value: string) => {
    setForgotPasswordFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 发送验证码
  const handleSendVerifyCode = async () => {
    const phone = registerFormData.phone.trim();
    
    if (!phone) {
      alert('请先输入手机号');
      return;
    }
    
    // 简单的手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      alert('请输入正确的手机号');
      return;
    }
    
    try {
      // 调用API发送验证码
      await api.sendVerifyCode(phone);
      
      // 开始倒计时
      setVerifyCodeCountdown(60);
      alert('验证码已发送，请查收（开发模式下请查看后端控制台）');
    } catch (error) {
      console.error('发送验证码失败:', error);
      alert(error instanceof Error ? error.message : '发送验证码失败，请稍后重试');
    }
  };

  // 登录表单提交
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { username, password, rememberMe } = loginFormData;
    
    if (!username.trim() || !password.trim()) {
      alert('请填写完整的登录信息');
      return;
    }
    
    setIsLoginSubmitting(true);
    
    try {
      const response = await api.login({
        username: username.trim(),
        password: password.trim(),
        rememberMe: rememberMe
      });
      
      if (response.success && response.token) {
        // 存储token
        localStorage.setItem('authToken', response.token);
        if (response.userId) {
          localStorage.setItem('userId', response.userId);
        }
        if (response.username) {
          localStorage.setItem('username', response.username);
        }
        
        // 登录成功，跳转到我的行程页
        navigate('/my-trips');
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      alert(error instanceof Error ? error.message : '登录失败，请检查用户名和密码');
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  // 注册表单提交
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { phone, email, password, verifyCode, agreeTerms } = registerFormData;
    
    if (!phone.trim() || !email.trim() || !password.trim() || !verifyCode.trim()) {
      alert('请填写完整的注册信息');
      return;
    }
    
    if (!agreeTerms) {
      alert('请先同意用户协议和隐私政策');
      return;
    }
    
    // 密码强度检查
    if (password.length < 6) {
      alert('密码至少需要6位字符');
      return;
    }
    
    setIsRegisterSubmitting(true);
    
    try {
      const response = await api.register({
        phone: phone.trim(),
        email: email.trim(),
        password: password.trim(),
        verifyCode: verifyCode.trim()
      });
      
      if (response.success && response.token) {
        // 存储token
        localStorage.setItem('authToken', response.token);
        if (response.userId) {
          localStorage.setItem('userId', response.userId);
        }
        if (response.username) {
          localStorage.setItem('username', response.username);
        }
        
        alert('注册成功！');
        // 注册成功，跳转到我的行程页
        navigate('/my-trips');
      } else {
        throw new Error(response.message || '注册失败');
      }
    } catch (error) {
      console.error('注册失败:', error);
      alert(error instanceof Error ? error.message : '注册失败，请稍后重试');
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  // 忘记密码表单提交
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const email = forgotPasswordFormData.email.trim();
    
    if (!email) {
      alert('请输入邮箱地址');
      return;
    }
    
    setIsForgotSubmitting(true);
    
    try {
      const response = await api.forgotPassword(email);
      
      alert(response.message || '重置密码链接已发送到您的邮箱，请查收');
      setShowForgotPasswordModal(false);
      setForgotPasswordFormData({ email: '' });
    } catch (error) {
      console.error('发送重置链接失败:', error);
      alert(error instanceof Error ? error.message : '发送失败，请稍后重试');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // 第三方登录
  const handleWechatLogin = () => {
    console.log('需要调用第三方接口实现微信登录功能');
    // 模拟第三方登录成功
    setTimeout(() => {
      navigate('/my-trips');
    }, 1000);
  };

  const handleAlipayLogin = () => {
    console.log('需要调用第三方接口实现支付宝登录功能');
    // 模拟第三方登录成功
    setTimeout(() => {
      navigate('/my-trips');
    }, 1000);
  };

  // 关闭忘记密码模态框
  const handleCloseForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
  };

  return (
    <div className={styles.pageWrapper}>
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 h-16">
        <div className="flex items-center justify-center h-full px-6">
          {/* Logo和产品名称 */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <i className="fas fa-route text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-bold text-text-primary">途智行</h1>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="pt-16 min-h-screen">
        {/* 背景图区域 */}
        <div className="relative h-screen overflow-hidden">
          {/* 背景图片 */}
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{
              backgroundImage: "url('https://s.coze.cn/image/5dUIXUxQOE0/')",
              filter: 'brightness(0.7)'
            }}
          ></div>
          
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
          
          {/* 装饰元素 */}
          <div className={`absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full ${styles.floatingAnimation}`}></div>
          <div className={`absolute top-40 right-20 w-16 h-16 bg-white/10 rounded-full ${styles.floatingAnimation}`} style={{animationDelay: '-2s'}}></div>
          <div className={`absolute bottom-32 left-1/4 w-12 h-12 bg-white/10 rounded-full ${styles.floatingAnimation}`} style={{animationDelay: '-4s'}}></div>
          
          {/* 左侧欢迎信息 */}
          <div className="absolute inset-0 flex items-center justify-start pl-16 lg:pl-32 z-10">
            <div className="text-white max-w-md">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                欢迎来到
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">途智行</span>
              </h1>
              <p className="text-xl lg:text-2xl mb-8 opacity-90">AI智能旅行规划，让每一次旅行都充满惊喜</p>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-brain text-primary"></i>
                  <span className="text-lg">智能规划</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-chart-pie text-tertiary"></i>
                  <span className="text-lg">预算管理</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 右侧登录/注册表单 */}
          <div className="absolute inset-0 flex items-center justify-end pr-16 lg:pr-32 z-10">
            <div className="w-full max-w-md">
              {/* 表单容器 */}
              <div className="bg-white rounded-2xl shadow-form p-8">
                {/* 标签切换 */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
                  <button 
                    onClick={() => handleTabSwitch('login')}
                    className={`flex-1 py-3 px-4 text-center font-medium rounded-md transition-all ${
                      activeTab === 'login' ? styles.tabActive : styles.tabInactive
                    }`}
                  >
                    登录
                  </button>
                  <button 
                    onClick={() => handleTabSwitch('register')}
                    className={`flex-1 py-3 px-4 text-center font-medium rounded-md transition-all ${
                      activeTab === 'register' ? styles.tabActive : styles.tabInactive
                    }`}
                  >
                    注册
                  </button>
                </div>
                
                {/* 登录表单 */}
                {activeTab === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="login-username" className="block text-sm font-medium text-text-primary mb-2">
                          手机号/邮箱
                        </label>
                        <input 
                          type="text" 
                          id="login-username" 
                          name="username"
                          value={loginFormData.username}
                          onChange={(e) => handleLoginInputChange('username', e.target.value)}
                          className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.formInputFocus}`}
                          placeholder="请输入手机号或邮箱" 
                          required 
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="login-password" className="block text-sm font-medium text-text-primary mb-2">
                          密码
                        </label>
                        <div className="relative">
                          <input 
                            type={showLoginPassword ? 'text' : 'password'}
                            id="login-password" 
                            name="password"
                            value={loginFormData.password}
                            onChange={(e) => handleLoginInputChange('password', e.target.value)}
                            className={`w-full px-4 py-3 pr-12 border border-border-light rounded-lg ${styles.formInputFocus}`}
                            placeholder="请输入密码" 
                            required 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                            aria-label={showLoginPassword ? '隐藏密码' : '显示密码'}
                            title={showLoginPassword ? '隐藏密码' : '显示密码'}
                          >
                            <i className={`fas ${showLoginPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={loginFormData.rememberMe}
                            onChange={(e) => handleLoginInputChange('rememberMe', e.target.checked)}
                            className="w-4 h-4 text-primary border-border-light rounded focus:ring-primary" 
                          />
                          <span className="ml-2 text-sm text-text-secondary">记住密码</span>
                        </label>
                        <button 
                          type="button" 
                          onClick={() => setShowForgotPasswordModal(true)}
                          className="text-sm text-primary hover:text-blue-600"
                        >
                          忘记密码？
                        </button>
                      </div>
                      
                      <button 
                        type="submit"
                        disabled={isLoginSubmitting}
                        className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-lg"
                      >
                        <i className={`fas ${isLoginSubmitting ? 'fa-spinner fa-spin' : 'fa-sign-in-alt'} mr-2`}></i>
                        {isLoginSubmitting ? '登录中...' : '登录'}
                      </button>
                    </div>
                  </form>
                )}
                
                {/* 注册表单 */}
                {activeTab === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="register-phone" className="block text-sm font-medium text-text-primary mb-2">
                          手机号
                        </label>
                        <input 
                          type="tel" 
                          id="register-phone" 
                          name="phone"
                          value={registerFormData.phone}
                          onChange={(e) => handleRegisterInputChange('phone', e.target.value)}
                          className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.formInputFocus}`}
                          placeholder="请输入手机号" 
                          required 
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="register-email" className="block text-sm font-medium text-text-primary mb-2">
                          邮箱
                        </label>
                        <input 
                          type="email" 
                          id="register-email" 
                          name="email"
                          value={registerFormData.email}
                          onChange={(e) => handleRegisterInputChange('email', e.target.value)}
                          className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.formInputFocus}`}
                          placeholder="请输入邮箱" 
                          required 
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="register-password" className="block text-sm font-medium text-text-primary mb-2">
                          密码
                        </label>
                        <div className="relative">
                          <input 
                            type={showRegisterPassword ? 'text' : 'password'}
                            id="register-password" 
                            name="password"
                            value={registerFormData.password}
                            onChange={(e) => handleRegisterInputChange('password', e.target.value)}
                            className={`w-full px-4 py-3 pr-12 border border-border-light rounded-lg ${styles.formInputFocus}`}
                            placeholder="请输入密码（至少6位）" 
                            required 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                            aria-label={showRegisterPassword ? '隐藏密码' : '显示密码'}
                            title={showRegisterPassword ? '隐藏密码' : '显示密码'}
                          >
                            <i className={`fas ${showRegisterPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="register-verify-code" className="block text-sm font-medium text-text-primary mb-2">
                          验证码
                        </label>
                        <div className="flex space-x-3">
                          <input 
                            type="text" 
                            id="register-verify-code" 
                            name="verifyCode"
                            value={registerFormData.verifyCode}
                            onChange={(e) => handleRegisterInputChange('verifyCode', e.target.value)}
                            className={`flex-1 px-4 py-3 border border-border-light rounded-lg ${styles.formInputFocus}`}
                            placeholder="请输入验证码" 
                            required 
                          />
                          <button 
                            type="button" 
                            onClick={handleSendVerifyCode}
                            disabled={verifyCodeCountdown > 0}
                            className="px-4 py-3 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50"
                          >
                            {verifyCodeCountdown > 0 ? `${verifyCodeCountdown}秒后重发` : '发送验证码'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <input 
                          type="checkbox" 
                          id="agree-terms"
                          checked={registerFormData.agreeTerms}
                          onChange={(e) => handleRegisterInputChange('agreeTerms', e.target.checked)}
                          className="w-4 h-4 text-primary border-border-light rounded focus:ring-primary mt-1" 
                          required 
                        />
                        <span className="ml-2 text-sm text-text-secondary">
                          我已阅读并同意
                          <button type="button" className="text-primary hover:text-blue-600">《用户协议》</button>
                          和
                          <button type="button" className="text-primary hover:text-blue-600">《隐私政策》</button>
                        </span>
                      </div>
                      
                      <button 
                        type="submit"
                        disabled={isRegisterSubmitting}
                        className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-lg"
                      >
                        <i className={`fas ${isRegisterSubmitting ? 'fa-spinner fa-spin' : 'fa-user-plus'} mr-2`}></i>
                        {isRegisterSubmitting ? '注册中...' : '注册'}
                      </button>
                    </div>
                  </form>
                )}
                
                {/* 分割线 */}
                <div className="my-8 flex items-center">
                  <div className="flex-1 border-t border-border-light"></div>
                  <span className="px-4 text-sm text-text-secondary">或</span>
                  <div className="flex-1 border-t border-border-light"></div>
                </div>
                
                {/* 第三方登录 */}
                <div className="space-y-3">
                  <button 
                    onClick={handleWechatLogin}
                    className={`w-full flex items-center justify-center space-x-3 py-3 border border-border-light rounded-lg hover:bg-gray-50 transition-colors ${styles.socialBtn}`}
                  >
                    <i className="fab fa-weixin text-success text-xl"></i>
                    <span className="text-text-primary font-medium">微信登录</span>
                  </button>
                  
                  <button 
                    onClick={handleAlipayLogin}
                    className={`w-full flex items-center justify-center space-x-3 py-3 border border-border-light rounded-lg hover:bg-gray-50 transition-colors ${styles.socialBtn}`}
                  >
                    <i className="fab fa-alipay text-info text-xl"></i>
                    <span className="text-text-primary font-medium">支付宝登录</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 忘记密码模态框 */}
      {showForgotPasswordModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleCloseForgotPasswordModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-form max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-key text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">重置密码</h3>
              <p className="text-text-secondary">请输入您的邮箱，我们将发送重置密码链接</p>
            </div>
            
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-text-primary mb-2">邮箱</label>
                <input 
                  type="email" 
                  id="forgot-email" 
                  name="email"
                  value={forgotPasswordFormData.email}
                  onChange={(e) => handleForgotPasswordInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.formInputFocus}`}
                  placeholder="请输入邮箱地址" 
                  required 
                />
              </div>
              
              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={handleCloseForgotPasswordModal}
                  className="flex-1 py-3 border border-border-light rounded-lg text-text-secondary hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  disabled={isForgotSubmitting}
                  className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isForgotSubmitting ? '发送中...' : '发送链接'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;

