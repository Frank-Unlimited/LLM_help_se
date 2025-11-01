
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import WebAudioSpeechRecognizer from '../../../app/webaudiospeechrecognizer.js';
import { api, TripGenerationRequest } from '../../utils/api';

// 类型定义
interface PreferenceTag {
  id: string;
  label: string;
  icon: string;
  category: 'travel-type' | 'transport' | 'accommodation';
}

const PlanInputPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [travelRequirements, setTravelRequirements] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceStatus, setShowVoiceStatus] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const recognizerRef = useRef<any | null>(null);
  const resultTextRef = useRef<string>('');
  const hasReceivedRecognitionRef = useRef<boolean>(false);
  
  // 新增字段：出发时间、预算、出发地、目的地、出行人数
  const [departureDate, setDepartureDate] = useState('');
  const [budget, setBudget] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [numTravellers, setNumTravellers] = useState('');

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '智能行程规划 - 途智行';
    return () => { document.title = originalTitle; };
  }, []);

  // 响应式处理
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

  const getAsrParams = () => {
    const cfg = (window as any).config || {};
    const params = {
      // 用户鉴权参数（优先 window.config，其次环境变量）
      secretid: cfg.secretId || import.meta.env.VITE_ASR_SECRET_ID,
      secretkey: cfg.secretKey || import.meta.env.VITE_ASR_SECRET_KEY,
      appid: cfg.appId || Number(import.meta.env.VITE_ASR_APP_ID),
      // 实时识别接口参数
      engine_model_type: '16k_zh',
      // 其他可选参数：voice_format, needvad, filter_dirty, filter_modal, filter_punc, convert_num_mode, word_info
    } as any;
    return params;
  };

  const stopRecognizer = () => {
    try {
      // 如果正在建立连接，给一点时间完成
      if (!hasReceivedRecognitionRef.current) {
        console.log('⚠️ 正在停止，但连接可能尚未建立，等待中...');
      }
      recognizerRef.current && recognizerRef.current.stop();
    } catch (e) {
      console.error('停止识别器时出错:', e);
    }
    setIsRecording(false);
    setShowVoiceStatus(false);
    setIsWebSocketConnected(false);
  };

  const handleVoiceInput = () => {
    if (!isRecording) {
      const params = getAsrParams();
      if (!params.secretid || !params.secretkey || !params.appid) {
        alert('缺少鉴权配置：请提供 SecretId/SecretKey/AppId\n\n请检查环境变量或 window.config 配置');
        return;
      }

      // 检查浏览器是否支持语音识别
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const isChrome = navigator.userAgent.toLowerCase().match(/chrome/);
        const isHttps = location.protocol === 'https:';
        const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        
        if (isChrome && !isHttps && !isLocalhost) {
          alert('语音识别需要 HTTPS 协议或 localhost 环境\n\nChrome 浏览器出于安全考虑，只能在 HTTPS 或 localhost 下使用麦克风');
        } else {
          alert('您的浏览器不支持语音识别功能\n\n请使用 Chrome、Firefox 或 Edge 浏览器的最新版本');
        }
        return;
      }

      resultTextRef.current = '';
      hasReceivedRecognitionRef.current = false;
      setIsRecording(false); // 初始状态：未开始录音，等待连接
      setIsWebSocketConnected(false); // 重置连接状态
      setShowVoiceStatus(true);

      try {
        
        const recognizer = new (WebAudioSpeechRecognizer as any)(params, true);
        
        recognizer.OnRecognitionStart = (res: any) => {
          // 连接建立
          console.log('✅ 语音识别已开始，WebSocket 连接成功', res);
          hasReceivedRecognitionRef.current = true;
          setIsWebSocketConnected(true); // 标记连接已建立
          setIsRecording(true); // 连接建立后可以开始录音
        };
        recognizer.OnSentenceBegin = (res: any) => {
          // 句子开始
          console.log('📝 句子开始识别', res);
        };
        recognizer.OnRecognitionResultChange = (res: any) => {
          console.log('🔄 识别结果变化', res);
          const text = res.result?.voice_text_str || '';
          const current = `${resultTextRef.current}${text}`;
          setTravelRequirements(current);
        };
        recognizer.OnSentenceEnd = (res: any) => {
          console.log('✅ 句子识别结束', res);
          const text = res.result?.voice_text_str || '';
          resultTextRef.current += text;
          setTravelRequirements(resultTextRef.current);
        };
        recognizer.OnRecognitionComplete = (res: any) => {
          console.log('🎉 识别完成', res);
          setIsRecording(false);
          setShowVoiceStatus(false);
        };
        recognizer.OnError = (err: any) => {
          console.error('❌ ASR Error:', err);
          console.error('错误详情:', JSON.stringify(err, null, 2));
          setIsWebSocketConnected(false); // 连接失败，重置状态
          stopRecognizer();
          
          // 提供更友好的错误提示
          let errorMessage = '语音识别失败';
          
          // 处理字符串错误
          if (typeof err === 'string') {
            errorMessage = err;
          } 
          // 处理 WebRecorder 传递的错误对象（err.err 结构）
          else if (err?.err) {
            const errorName = err.err.name || err.err.code;
            if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
              errorMessage = '麦克风权限被拒绝\n\n请在浏览器设置中允许网站使用麦克风，然后刷新页面重试';
            } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
              errorMessage = '未找到麦克风设备\n\n请检查您的麦克风是否已连接并启用';
            } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
              errorMessage = '麦克风被其他应用占用\n\n请关闭其他正在使用麦克风的应用后重试';
            } else if (err.err.message) {
              errorMessage = err.err.message;
            } else {
              errorMessage = `麦克风错误：${errorName || '未知错误'}`;
            }
          }
          // 处理直接错误对象
          else if (err?.name) {
            if (err.name === 'NotAllowedError') {
              errorMessage = '麦克风权限被拒绝\n\n请在浏览器设置中允许网站使用麦克风';
            } else if (err.name === 'NotFoundError') {
              errorMessage = '未找到麦克风设备\n\n请检查您的麦克风是否已连接';
            } else if (err.name === 'NotReadableError') {
              errorMessage = '麦克风被其他应用占用\n\n请关闭其他正在使用麦克风的应用';
            } else {
              errorMessage = err.message || `错误：${err.name}`;
            }
          }
          // 处理 API 错误
          else if (err?.message) {
            errorMessage = err.message;
          } else if (err?.code) {
            errorMessage = `识别错误 (${err.code})`;
          }
          
          // 延迟显示错误，避免与状态更新冲突
          setTimeout(() => {
            alert(errorMessage);
          }, 100);
        };
        recognizer.OnRecorderStop = (res: any) => {
          // 录音结束
          console.log('🎤 录音已停止', res);
          // 如果录音停止时识别还没开始，可能是连接失败
          if (!hasReceivedRecognitionRef.current && !resultTextRef.current) {
            console.warn('⚠️ 录音停止但未收到识别结果，可能是 WebSocket 连接失败');
            // 延迟检查，给错误回调一些时间
            setTimeout(() => {
              if (!hasReceivedRecognitionRef.current && !resultTextRef.current) {
                console.error('❌ 确认：WebSocket 连接可能失败，请检查控制台是否有鉴权或连接错误');
              }
            }, 500);
          }
        };
        recognizerRef.current = recognizer;
        console.log('🚀 开始启动语音识别...');
        recognizer.start();
      } catch (error) {
        console.error('初始化语音识别器失败:', error);
        stopRecognizer();
        alert(`初始化语音识别失败：${error instanceof Error ? error.message : '未知错误'}`);
      }
    } else {
      stopRecognizer();
    }
  };

  const handleExamplePrompt = (text: string) => {
    setTravelRequirements(text);
  };

  const handlePreferenceToggle = (preferenceId: string) => {
    const newSelectedPreferences = new Set(selectedPreferences);
    if (newSelectedPreferences.has(preferenceId)) {
      newSelectedPreferences.delete(preferenceId);
    } else {
      newSelectedPreferences.add(preferenceId);
    }
    setSelectedPreferences(newSelectedPreferences);
  };

  const handleGenerateTrip = async () => {
    const requirements = travelRequirements.trim();
    
    if (!requirements) {
      alert('请输入旅行需求');
      return;
    }
    
    // 检查出发时间，如果没有填写则弹出确认对话框
    if (!departureDate.trim()) {
      const shouldContinue = window.confirm('您没有选择出发时间，是否继续生成行程？\n\n点击"确定"继续生成，点击"取消"返回填写。');
      if (!shouldContinue) {
        return;
      }
    }
    
    setIsGenerating(true);
    
    try {
      // 将偏好标签分类
      const preferencesArray = Array.from(selectedPreferences);
      const travelTypeIds = ['food', 'shopping', 'history', 'nature', 'family', 'solo', 'photography', 'culture'];
      const transportIds = ['high-speed-rail', 'plane', 'self-drive', 'bus'];
      const accommodationIds = ['economic', 'comfortable', 'luxury', 'homestay'];
      
      // 获取当前登录用户的ID
      const userId = localStorage.getItem('userId') || undefined;
      
      // 整合用户填写的信息到requirementsText中
      let enhancedRequirements = requirements;
      const additionalInfo: string[] = [];
      
      if (departureDate.trim()) {
        additionalInfo.push(`出发时间：${departureDate}`);
      }
      if (departureCity.trim()) {
        additionalInfo.push(`出发地：${departureCity}`);
      }
      if (destinationCity.trim()) {
        additionalInfo.push(`目的地：${destinationCity}`);
      }
      if (budget.trim()) {
        additionalInfo.push(`预算：${budget}元`);
      }
      if (numTravellers.trim()) {
        additionalInfo.push(`出行人数：${numTravellers}人`);
      }
      
      if (additionalInfo.length > 0) {
        enhancedRequirements = `${requirements}\n\n${additionalInfo.join('，')}`;
      }
      
      // 构造请求体
      const requestBody: TripGenerationRequest = {
        requirementsText: enhancedRequirements,
        preferences: preferencesArray,
        travelType: preferencesArray.filter(p => travelTypeIds.includes(p)),
        transportPreference: preferencesArray.filter(p => transportIds.includes(p)),
        accommodationType: preferencesArray.filter(p => accommodationIds.includes(p)),
        currency: 'CNY',
        userId: userId, // 如果用户已登录，传递userId
      };
      
      console.log('发送行程生成请求:', requestBody);
      
      // 调用后端生成接口（使用API工具类）
      const data = await api.generateTrip(requestBody);
      const tripId = data.tripId;
      
      console.log('行程生成成功，tripId:', tripId);
      
      // 跳转到详情页
      navigate(`/plan-detail?tripId=${tripId}`);
      
    } catch (error) {
      console.error('生成行程错误:', error);
      alert(error instanceof Error ? error.message : '生成行程失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearInput = () => {
    setTravelRequirements('');
    setSelectedPreferences(new Set());
    setDepartureDate('');
    setBudget('');
    setDepartureCity('');
    setDestinationCity('');
    setNumTravellers('');
  };

  const preferenceTags: PreferenceTag[] = [
    { id: 'food', label: '美食', icon: 'fas fa-utensils', category: 'travel-type' },
    { id: 'shopping', label: '购物', icon: 'fas fa-shopping-bag', category: 'travel-type' },
    { id: 'history', label: '历史', icon: 'fas fa-landmark', category: 'travel-type' },
    { id: 'nature', label: '自然', icon: 'fas fa-mountain', category: 'travel-type' },
    { id: 'family', label: '亲子', icon: 'fas fa-child', category: 'travel-type' },
    { id: 'solo', label: '独自旅行', icon: 'fas fa-user', category: 'travel-type' },
    { id: 'photography', label: '摄影', icon: 'fas fa-camera', category: 'travel-type' },
    { id: 'culture', label: '文化', icon: 'fas fa-theater-masks', category: 'travel-type' },
    
    { id: 'high-speed-rail', label: '高铁', icon: 'fas fa-train', category: 'transport' },
    { id: 'plane', label: '飞机', icon: 'fas fa-plane', category: 'transport' },
    { id: 'self-drive', label: '自驾', icon: 'fas fa-car', category: 'transport' },
    { id: 'bus', label: '公交', icon: 'fas fa-bus', category: 'transport' },
    
    { id: 'economic', label: '经济型', icon: 'fas fa-bed', category: 'accommodation' },
    { id: 'comfortable', label: '舒适型', icon: 'fas fa-star', category: 'accommodation' },
    { id: 'luxury', label: '豪华型', icon: 'fas fa-star', category: 'accommodation' },
    { id: 'homestay', label: '特色民宿', icon: 'fas fa-home', category: 'accommodation' }
  ];

  const examplePrompts = [
    '北京3日游，预算3000元，出发地上海，出发日期2025年11月15日',
    '上海迪士尼2日游，带孩子，出发地广州，预算4000元，出发日期2025年12月1日',
    '成都美食之旅，喜欢火锅，出发地西安，3天时间，预算2500元，出发日期2026年1月8日'
];

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
            
            {/* 用户信息或登录按钮 */}
            {(() => {
              const token = localStorage.getItem('authToken');
              const username = localStorage.getItem('username');
              
              if (token && username) {
                return (
                  <Link 
                    to="/user-profile"
                    className="flex items-center space-x-2 px-3 py-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-white text-xs"></i>
                    </div>
                    <span className="hidden md:block text-sm font-medium">{username}</span>
                  </Link>
                );
              } else {
                return (
                  <button 
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                  >
                    登录
                  </button>
                );
              }
            })()}
            
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
            <Link to="/plan-input" className="flex items-center space-x-3 px-4 py-3 text-primary bg-blue-50 rounded-lg">
              <i className="fas fa-route text-lg"></i>
              <span className="font-medium">行程规划</span>
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
      <main className="ml-60 mt-16 min-h-screen transition-all duration-300 md:ml-60">
        {/* 页面头部 */}
        <div className="bg-white border-b border-border-light px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">智能行程规划</h1>
              <nav className="flex items-center space-x-2 text-sm text-text-secondary mt-1">
                <Link to="/home" className="hover:text-primary">首页</Link>
                <i className="fas fa-chevron-right text-xs"></i>
                <span className="text-primary">行程规划</span>
              </nav>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            {/* 需求输入区 */}
            <div className="bg-white rounded-xl shadow-card p-8 mb-8">
              <h2 className="text-xl font-semibold text-text-primary mb-6">告诉我们你的旅行想法</h2>
              
              {/* 文本输入框 */}
              <div className="mb-6">
                <label htmlFor="travel-requirements" className="block text-sm font-medium text-text-primary mb-3">
                  请详细描述你的旅行需求（目的地、日期、预算、人数、偏好等）
                </label>
                <div className="relative">
                  <textarea 
                    id="travel-requirements" 
                    name="travel-requirements"
                    rows={4} 
                    placeholder="例如：我想去日本东京，5天，预算1万元，喜欢美食和动漫，带一个5岁孩子。"
                    value={travelRequirements}
                    onChange={(e) => setTravelRequirements(e.target.value)}
                    className="w-full px-4 py-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                  <button 
                    onClick={handleVoiceInput}
                    className="absolute bottom-3 right-3 p-2 text-text-secondary hover:text-primary transition-colors"
                    title="语音输入"
                  >
                    <i className={`text-lg ${isRecording ? 'fas fa-stop text-danger' : 'fas fa-microphone'}`}></i>
                  </button>
                </div>
                
                {/* 语音识别状态 */}
                {showVoiceStatus && (
                  <div className={`mt-3 p-4 rounded-lg ${
                    isWebSocketConnected 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    {!isWebSocketConnected ? (
                      // 连接中状态
                      <>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={styles.loadingSpinner}></div>
                          <span className="text-sm font-medium text-blue-700">
                            正在连接识别服务...
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 ml-7">
                          首次连接可能需要 5-10 秒，请耐心等待，<strong>连接成功后再说话</strong>
                        </p>
                        <div className="mt-2 ml-7">
                          <div className="flex items-center space-x-1 text-xs text-blue-500">
                            <i className="fas fa-info-circle"></i>
                            <span>正在建立 WebSocket 连接并验证权限...</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      // 已连接状态
                      <>
                        <div className="flex items-center space-x-2 mb-2">
                          <i className="fas fa-check-circle text-green-600"></i>
                          <span className="text-sm font-medium text-green-700">
                            连接成功！
                          </span>
                        </div>
                        {isRecording ? (
                          <p className="text-xs text-green-600 ml-7">
                            <i className="fas fa-microphone mr-1"></i>
                            正在聆听，请开始说话...
                          </p>
                        ) : (
                          <p className="text-xs text-green-600 ml-7">
                            现在可以开始说话了，系统正在准备接收语音...
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 示例提示 */}
              <div className="mb-6">
                <p className="text-sm text-text-secondary mb-3">常见输入示例：</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((prompt, index) => (
                    <button 
                      key={index}
                      onClick={() => handleExamplePrompt(prompt)}
                      className="px-3 py-1 text-sm bg-gray-100 text-text-secondary rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 行程基本信息 */}
              <div className="mb-6 pb-6 border-b border-border-light">
                <h3 className="text-lg font-medium text-text-primary mb-4">行程基本信息</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 出发地 */}
                  <div>
                    <label htmlFor="departure-city" className="block text-sm font-medium text-text-primary mb-2">
                      <i className="fas fa-map-marker-alt mr-1 text-primary"></i>
                      出发地
                    </label>
                    <input
                      id="departure-city"
                      type="text"
                      placeholder="例如：北京"
                      value={departureCity}
                      onChange={(e) => setDepartureCity(e.target.value)}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* 目的地 */}
                  <div>
                    <label htmlFor="destination-city" className="block text-sm font-medium text-text-primary mb-2">
                      <i className="fas fa-map-marked-alt mr-1 text-primary"></i>
                      目的地
                    </label>
                    <input
                      id="destination-city"
                      type="text"
                      placeholder="例如：上海"
                      value={destinationCity}
                      onChange={(e) => setDestinationCity(e.target.value)}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* 出发时间 */}
                  <div>
                    <label htmlFor="departure-date" className="block text-sm font-medium text-text-primary mb-2">
                      <i className="fas fa-calendar-alt mr-1 text-primary"></i>
                      出发时间 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="departure-date"
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* 出行人数 */}
                  <div>
                    <label htmlFor="num-travellers" className="block text-sm font-medium text-text-primary mb-2">
                      <i className="fas fa-users mr-1 text-primary"></i>
                      出行人数
                    </label>
                    <input
                      id="num-travellers"
                      type="number"
                      min="1"
                      placeholder="例如：2"
                      value={numTravellers}
                      onChange={(e) => setNumTravellers(e.target.value)}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* 预算 */}
                  <div className="md:col-span-2">
                    <label htmlFor="budget" className="block text-sm font-medium text-text-primary mb-2">
                      <i className="fas fa-wallet mr-1 text-primary"></i>
                      预算（元）
                    </label>
                    <div className="relative">
                      <input
                        id="budget"
                        type="number"
                        min="0"
                        step="100"
                        placeholder="例如：5000"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary">元</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 偏好选择区 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">选择你的旅行偏好</h3>
                
                {/* 旅行类型 */}
                <div className="mb-4">
                  <p className="text-sm text-text-secondary mb-3">旅行类型</p>
                  <div className="flex flex-wrap gap-2">
                    {preferenceTags
                      .filter(tag => tag.category === 'travel-type')
                      .map(tag => (
                        <button 
                          key={tag.id}
                          onClick={() => handlePreferenceToggle(tag.id)}
                          className={`${styles.preferenceTag} px-4 py-2 text-sm border border-border-light rounded-full hover:border-primary ${selectedPreferences.has(tag.id) ? styles.selected : ''}`}
                        >
                          <i className={`${tag.icon} mr-1`}></i>{tag.label}
                        </button>
                      ))}
                  </div>
                </div>

                {/* 交通偏好 */}
                <div className="mb-4">
                  <p className="text-sm text-text-secondary mb-3">交通偏好</p>
                  <div className="flex flex-wrap gap-2">
                    {preferenceTags
                      .filter(tag => tag.category === 'transport')
                      .map(tag => (
                        <button 
                          key={tag.id}
                          onClick={() => handlePreferenceToggle(tag.id)}
                          className={`${styles.preferenceTag} px-4 py-2 text-sm border border-border-light rounded-full hover:border-primary ${selectedPreferences.has(tag.id) ? styles.selected : ''}`}
                        >
                          <i className={`${tag.icon} mr-1`}></i>{tag.label}
                        </button>
                      ))}
                  </div>
                </div>

                {/* 住宿偏好 */}
                <div>
                  <p className="text-sm text-text-secondary mb-3">住宿偏好</p>
                  <div className="flex flex-wrap gap-2">
                    {preferenceTags
                      .filter(tag => tag.category === 'accommodation')
                      .map(tag => (
                        <button 
                          key={tag.id}
                          onClick={() => handlePreferenceToggle(tag.id)}
                          className={`${styles.preferenceTag} px-4 py-2 text-sm border border-border-light rounded-full hover:border-primary ${selectedPreferences.has(tag.id) ? styles.selected : ''}`}
                        >
                          <i className={`${tag.icon} mr-1`}></i>{tag.label === '豪华型' ? '豪华型' : tag.label}
                          {tag.label === '豪华型' && <i className="fas fa-star mr-1"></i>}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* 操作按钮区 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleGenerateTrip}
                  disabled={isGenerating}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <div className={`${styles.loadingSpinner} w-4 h-4 mr-2`}></div>
                      生成中...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic mr-2"></i>
                      生成智能行程
                    </>
                  )}
                </button>
                <button 
                  onClick={handleClearInput}
                  className="px-6 py-4 border-2 border-border-light text-text-secondary rounded-lg font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  <i className="fas fa-eraser mr-2"></i>
                  清空输入
                </button>
              </div>
            </div>

            {/* 功能介绍区 */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* AI智能分析 */}
              <div className={`bg-white rounded-xl p-6 shadow-card ${styles.cardHover}`}>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-brain text-white text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">AI智能分析</h3>
                <p className="text-sm text-text-secondary">
                  深度理解你的旅行需求，结合大数据分析，为你推荐最适合的行程方案。
                </p>
              </div>

              {/* 个性化推荐 */}
              <div className={`bg-white rounded-xl p-6 shadow-card ${styles.cardHover}`}>
                <div className="w-12 h-12 bg-gradient-to-br from-tertiary to-primary rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-user-cog text-white text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">个性化推荐</h3>
                <p className="text-sm text-text-secondary">
                  根据你的兴趣爱好、预算和时间，量身定制专属于你的旅行体验。
                </p>
              </div>

              {/* 实时优化 */}
              <div className={`bg-white rounded-xl p-6 shadow-card ${styles.cardHover}`}>
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-tertiary rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-sync-alt text-white text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">实时优化</h3>
                <p className="text-sm text-text-secondary">
                  动态调整行程安排，确保最佳体验，随时应对突发情况。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlanInputPage;

