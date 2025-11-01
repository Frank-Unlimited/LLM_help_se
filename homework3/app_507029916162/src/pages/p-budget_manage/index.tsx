

import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styles from './styles.module.css';
import { api } from '../../utils/api';
import type { TripDetail } from '../../utils/api';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import WebAudioSpeechRecognizer from '../../../app/webaudiospeechrecognizer.js';

interface Expense {
  id: string; // 使用 expenseId
  date: string;
  category: string;
  amount: number;
  description: string;
}

interface TripData {
  name: string;
  totalBudget: number;
  spent: number;
  remaining: number;
}

const BudgetManagePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  // 状态管理
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tripData, setTripData] = useState<TripData>({
    name: '',
    totalBudget: 0,
    spent: 0,
    remaining: 0
  });
  const [tripDetail, setTripDetail] = useState<TripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 行程列表状态（当没有tripId时显示）
  const [tripsList, setTripsList] = useState<Array<Partial<TripDetail>>>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  const [tripsError, setTripsError] = useState<string | null>(null);
  
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [currentSort, setCurrentSort] = useState<string>('date-desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalActive, setIsModalActive] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 语音识别状态
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceStatus, setShowVoiceStatus] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [isParsingVoice, setIsParsingVoice] = useState(false);
  const [voiceText, setVoiceText] = useState<string>(''); // 实时显示的语音识别文本
  const recognizerRef = useRef<any | null>(null);
  const voiceTextRef = useRef<string>('');
  const hasReceivedRecognitionRef = useRef<boolean>(false);
  const isProcessingExpenseRef = useRef<boolean>(false); // 防止重复解析和保存
  
  // 表单状态
  const [formData, setFormData] = useState({
    date: '',
    category: '',
    amount: '',
    description: ''
  });

  const pageSize = 10;

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '预算管理 - 途智行';
    return () => { document.title = originalTitle; };
  }, []);

  // 响应式处理
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

  // 组件卸载时清理语音识别器
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (e) {
          console.error('清理语音识别器时出错:', e);
        }
      }
    };
  }, []);

  // 加载行程数据
  const loadTripData = async (tripId: string) => {
    if (!tripId) {
      setError('缺少行程ID');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const detail = await api.getTripDetail(tripId);
      setTripDetail(detail);
      
      // 转换行程数据
      const tripName = detail.tripName || '未命名行程';
      const totalDays = detail.totalDays || 0;
      const tripNameDisplay = totalDays > 0 
        ? `${tripName} · ${totalDays}天${totalDays - 1}夜`
        : tripName;
      
      setTripData({
        name: tripNameDisplay,
        totalBudget: detail.budget?.total || 0,
        spent: detail.budget?.spent || 0,
        remaining: detail.budget?.remaining || 0
      });
      
      // 转换开销数据
      const convertedExpenses: Expense[] = (detail.expenses || []).map(exp => ({
        id: exp.expenseId,
        date: exp.date,
        category: exp.category,
        amount: exp.amount,
        description: exp.description || ''
      }));
      
      setExpenses(convertedExpenses);
    } catch (err) {
      console.error('加载行程数据失败:', err);
      setError(err instanceof Error ? err.message : '加载行程数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载行程列表（当没有tripId时）
  const loadTripsList = async () => {
    setIsLoadingTrips(true);
    setTripsError(null);
    try {
      const response = await api.getUserTrips({ limit: 100 });
      setTripsList(response.trips || []);
    } catch (err) {
      console.error('加载行程列表失败:', err);
      setTripsError(err instanceof Error ? err.message : '加载行程列表失败');
      setTripsList([]);
    } finally {
      setIsLoadingTrips(false);
    }
  };

  // 选择行程并跳转
  const handleSelectTrip = (tripId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tripId', tripId);
    window.location.search = `?${newSearchParams.toString()}`;
  };

  // 初始加载
  useEffect(() => {
    const tripId = searchParams.get('tripId');
    if (tripId) {
      // 有tripId，加载对应的行程预算数据
      setIsLoading(true);
      loadTripData(tripId);
    } else {
      // 没有tripId，加载行程列表供用户选择
      setIsLoading(false);
      loadTripsList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 筛选开销数据
  const getFilteredExpenses = (): Expense[] => {
    return expenses.filter(expense => {
      if (currentFilter === 'all') return true;
      
      const categoryMap: Record<string, string> = {
        'food': '餐饮',
        'transport': '交通', 
        'attraction': '景点',
        'shopping': '购物'
      };
      
      return expense.category === categoryMap[currentFilter];
    });
  };

  // 排序开销数据
  const sortExpenses = (expensesToSort: Expense[]): Expense[] => {
    return [...expensesToSort].sort((a, b) => {
      switch (currentSort) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  };

  // 获取分页数据
  const getPagedExpenses = (): Expense[] => {
    const filteredExpenses = getFilteredExpenses();
    const sortedExpenses = sortExpenses(filteredExpenses);
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedExpenses.slice(startIndex, endIndex);
  };

  // 计算总花费 - 使用后端返回的已花费金额，或从开销列表计算
  const getTotalSpent = (): number => {
    // 优先使用后端返回的已花费金额（更准确，因为可能包含其他计算）
    if (tripData.spent > 0) {
      return tripData.spent;
    }
    // 否则从开销列表计算
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  // 获取类别颜色
  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      '餐饮': 'bg-blue-100 text-blue-800',
      '交通': 'bg-yellow-100 text-yellow-800',
      '景点': 'bg-green-100 text-green-800',
      '购物': 'bg-purple-100 text-purple-800',
      '住宿': 'bg-red-100 text-red-800',
      '其他': 'bg-gray-100 text-gray-800'
    };
    return colorMap[category] || 'bg-gray-100 text-gray-800';
  };

  // 处理表单输入
  const handleFormInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 打开记录开销弹窗
  const handleRecordExpenseClick = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      date: today,
      category: '',
      amount: '',
      description: ''
    });
    setIsEditing(false);
    setEditingExpenseId(null);
    setIsModalActive(true);
  };

  // 编辑开销记录
  const handleEditExpense = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;
    
    setFormData({
      date: expense.date,
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description
    });
    setIsEditing(true);
    setEditingExpenseId(id);
    setIsModalActive(true);
  };

  // 删除开销记录
  const handleDeleteExpense = async (id: string) => {
    const tripId = searchParams.get('tripId');
    if (!tripId) {
      alert('缺少行程ID');
      return;
    }

    if (!confirm('确定要删除这条开销记录吗？')) {
      return;
    }

    try {
      console.log('[前端] 准备删除开销:', { tripId, expenseId: id });
      // 调用后端删除开销API - 确保后端数据被删除
      await api.deleteExpense(tripId, id);
      
      // 重新加载数据以同步后端状态
      await loadTripData(tripId);
      alert('删除成功');
    } catch (err) {
      console.error('删除开销失败:', err);
      const errMessage = err instanceof Error ? err.message : String(err);
      alert(`删除失败：${errMessage}\n请稍后重试或联系管理员`);
    }
  };

  // 提交表单
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tripId = searchParams.get('tripId');
    if (!tripId) {
      alert('缺少行程ID');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const expenseData = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        description: formData.description || ''
      };

      if (isEditing && editingExpenseId) {
        // 编辑模式 - 尝试调用更新接口
        try {
          await api.updateExpense(tripId, editingExpenseId, expenseData);
          console.log('更新开销成功');
        } catch (updateErr) {
          // 如果后端不支持更新接口，使用删除后重新添加的方式
          if (updateErr instanceof Error && (updateErr.message.includes('404') || updateErr.message.includes('Not Found') || updateErr.message.includes('405'))) {
            console.log('后端不支持更新接口，使用删除后重新添加的方式');
            // 先删除旧的
            try {
              await api.deleteExpense(tripId, editingExpenseId);
            } catch (deleteErr) {
              // 如果删除也失败，直接添加新的（不删除旧的）
              console.warn('删除旧记录失败，直接添加新记录');
            }
            // 添加新的
            await api.addExpense(tripId, expenseData);
            console.log('通过删除后添加的方式更新开销成功');
          } else {
            throw updateErr;
          }
        }
      } else {
        // 添加模式
        await api.addExpense(tripId, expenseData);
        console.log('添加开销成功');
      }
      
      // 重新加载数据以获取最新的预算和开销信息
      await loadTripData(tripId);
      
      setIsModalActive(false);
      setFormData({
        date: '',
        category: '',
        amount: '',
        description: ''
      });
      setIsEditing(false);
      setEditingExpenseId(null);
    } catch (err) {
      console.error('保存开销失败:', err);
      alert(err instanceof Error ? err.message : '保存开销失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setIsModalActive(false);
    setFormData({
      date: '',
      category: '',
      amount: '',
      description: ''
    });
    setIsEditing(false);
    setEditingExpenseId(null);
    // 清空语音识别文本
    setVoiceText('');
    voiceTextRef.current = '';
    setShowVoiceStatus(false);
  };

  // 处理筛选
  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
    setCurrentPage(1);
  };

  // 处理排序
  const handleSortChange = (sort: string) => {
    setCurrentSort(sort);
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 获取ASR参数
  const getAsrParams = () => {
    const cfg = (window as any).config || {};
    const params = {
      secretid: cfg.secretId || import.meta.env.VITE_ASR_SECRET_ID,
      secretkey: cfg.secretKey || import.meta.env.VITE_ASR_SECRET_KEY,
      appid: cfg.appId || Number(import.meta.env.VITE_ASR_APP_ID),
      engine_model_type: '16k_zh',
    } as any;
    return params;
  };

  // 停止语音识别
  const stopRecognizer = () => {
    try {
      console.log('[停止录音] 开始停止识别器...');
      console.log('[停止录音] recognizerRef.current:', recognizerRef.current);
      console.log('[停止录音] isRecording:', isRecording);
      
      // 立即更新UI状态，让用户看到反馈
      setIsRecording(false);
      setIsWebSocketConnected(false);
      
      // 停止录音器和识别器
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
          console.log('[停止录音] 已调用 recognizer.stop()');
          
          // 如果 recognizer 有 destroyStream 方法，也调用它
          if (typeof recognizerRef.current.destroyStream === 'function') {
            recognizerRef.current.destroyStream();
            console.log('[停止录音] 已调用 destroyStream()');
          }
        } catch (stopError) {
          console.error('[停止录音] 调用 stop() 时出错:', stopError);
        } finally {
          // 清理识别器引用
          recognizerRef.current = null;
        }
      } else {
        console.log('[停止录音] recognizerRef.current 为空，可能尚未初始化');
      }
    } catch (e) {
      console.error('停止识别器时出错:', e);
      // 即使出错也要更新UI状态
      setIsRecording(false);
      setIsWebSocketConnected(false);
      recognizerRef.current = null;
    }
    // 保留showVoiceStatus和voiceText，以便用户查看识别结果
    // 如果用户想要清空，可以通过清空按钮操作
  };

  // 处理语音输入
  const handleVoiceInput = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('[handleVoiceInput] 函数被调用', { 
      isRecording, 
      hasRecognizer: !!recognizerRef.current,
      isParsingVoice 
    });
    
    // 如果正在录音，则停止（使用状态或ref双重检查）
    if (isRecording || (recognizerRef.current && !isParsingVoice)) {
      console.log('🛑 用户点击停止录音', { isRecording, hasRecognizer: !!recognizerRef.current });
      stopRecognizer();
      // 注意：不在这里触发解析，让 OnRecognitionComplete 回调会自动处理
      return;
    }
    
    // 开始录音
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

      voiceTextRef.current = '';
      setVoiceText(''); // 清空显示的文本
      hasReceivedRecognitionRef.current = false;
      isProcessingExpenseRef.current = false; // 重置处理标志
      setIsRecording(false);
      setIsWebSocketConnected(false);
      setShowVoiceStatus(true);

      try {
        const recognizer = new (WebAudioSpeechRecognizer as any)(params, true);
        
        recognizer.OnRecognitionStart = (res: any) => {
          console.log('✅ 语音识别已开始，WebSocket 连接成功', res);
          hasReceivedRecognitionRef.current = true;
          setIsWebSocketConnected(true);
          setIsRecording(true);
        };
        
        recognizer.OnRecognitionResultChange = (res: any) => {
          console.log('🔄 识别结果变化', res);
          // OnRecognitionResultChange 返回的是当前句子的临时识别结果（会不断变化）
          // 只用于实时显示，不保存到voiceTextRef
          const text = res.result?.voice_text_str || '';
          // 显示当前已完成的文本 + 正在识别的临时文本
          const displayText = voiceTextRef.current + text;
          setVoiceText(displayText); // 仅用于实时显示，不更新ref
        };
        
        recognizer.OnSentenceEnd = (res: any) => {
          console.log('✅ 句子识别结束', res);
          // OnSentenceEnd 返回的是已确认的句子文本
          const text = res.result?.voice_text_str || '';
          if (text) {
            voiceTextRef.current += text; // 追加到已完成的文本
            setVoiceText(voiceTextRef.current); // 更新显示的文本
          }
        };
        
        recognizer.OnRecognitionComplete = async (res: any) => {
          console.log('🎉 识别完成', res);
          setIsRecording(false);
          
          // 识别完成后，调用AI解析（会自动处理状态重置）
          const finalText = voiceTextRef.current.trim();
          if (finalText) {
            setVoiceText(finalText); // 确保显示最终文本
            await handleParseAndAddExpense(finalText);
          } else {
            // 如果没有识别到文本，直接关闭状态
            setShowVoiceStatus(false);
            setVoiceText('');
            voiceTextRef.current = '';
          }
          
          // 清理识别器引用
          recognizerRef.current = null;
        };
        
        recognizer.OnError = (err: any) => {
          console.error('❌ ASR Error:', err);
          setIsWebSocketConnected(false);
          setIsRecording(false);
          isProcessingExpenseRef.current = false; // 重置处理标志
          setIsParsingVoice(false);
          stopRecognizer();
          
          let errorMessage = '语音识别失败';
          if (typeof err === 'string') {
            errorMessage = err;
          } else if (err?.err) {
            const errorName = err.err.name || err.err.code;
            if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
              errorMessage = '麦克风权限被拒绝\n\n请在浏览器设置中允许网站使用麦克风';
            } else if (errorName === 'NotFoundError') {
              errorMessage = '未找到麦克风设备';
            } else if (errorName === 'NotReadableError') {
              errorMessage = '麦克风被其他应用占用';
            } else {
              errorMessage = err.err.message || `错误：${errorName}`;
            }
          } else if (err?.message) {
            errorMessage = err.message;
          }
          
          setTimeout(() => {
            alert(errorMessage);
          }, 100);
        };
        
        recognizer.OnRecorderStop = (res: any) => {
          console.log('🎤 录音已停止', res);
          // 确保状态已更新
          setIsRecording(false);
          setIsWebSocketConnected(false);
          
          // 如果停止时还有未保存的文本，确保保存
          if (voiceTextRef.current.trim()) {
            setVoiceText(voiceTextRef.current);
            console.log('[停止录音] 最终识别文本:', voiceTextRef.current);
          } else {
            console.log('[停止录音] 没有识别到文本');
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
    }
  };

  // 解析语音并添加开销
  const handleParseAndAddExpense = async (voiceText: string) => {
    // 防止重复处理
    if (isProcessingExpenseRef.current) {
      console.log('[前端] 已经在处理开销，跳过重复请求');
      return;
    }
    
    const tripId = searchParams.get('tripId');
    if (!tripId) {
      alert('缺少行程ID');
      return;
    }

    // 检查文本是否为空
    const text = voiceText.trim();
    if (!text) {
      console.log('[前端] 语音文本为空，跳过解析');
      return;
    }

    isProcessingExpenseRef.current = true;
    setIsParsingVoice(true);
    
    try {
      console.log('[前端] 开始解析语音文本:', text);
      
      // 调用后端API解析语音
      const parsedExpense = await api.parseExpenseVoice(text);
      
      console.log('[前端] AI解析结果:', parsedExpense);
      
      // 直接保存开销，不打开弹窗
      const expenseData = {
        amount: parsedExpense.amount,
        category: parsedExpense.category,
        date: parsedExpense.date,
        description: parsedExpense.description || ''
      };
      
      await api.addExpense(tripId, expenseData);
      console.log('[前端] 开销已自动保存:', expenseData);
      
      // 重新加载数据以获取最新的预算和开销信息
      await loadTripData(tripId);
      
      // 关闭语音识别状态并清空文本
      setShowVoiceStatus(false);
      setVoiceText('');
      voiceTextRef.current = '';
      
    } catch (err) {
      console.error('解析语音失败:', err);
      const errMessage = err instanceof Error ? err.message : String(err);
      alert(`解析语音失败：${errMessage}\n请手动填写开销信息`);
    } finally {
      setIsParsingVoice(false);
      isProcessingExpenseRef.current = false;
    }
  };

  // 处理导出
  const handleExport = () => {
    console.log('导出开销记录');
  };

  // 侧边栏切换
  const handleSidebarToggle = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // 计算预算分配（从 budgetBreakdown 获取）
  const getBudgetBreakdown = () => {
    if (!tripDetail?.budgetBreakdown) {
      return [];
    }
    return tripDetail.budgetBreakdown.map(item => ({
      category: item.category,
      allocated: item.allocated,
      spent: item.spent || 0,
      percentage: tripData.totalBudget > 0 
        ? Math.round((item.allocated / tripData.totalBudget) * 100) 
        : 0
    }));
  };

  const filteredExpenses = getFilteredExpenses();
  const pagedExpenses = getPagedExpenses();
  const totalSpent = getTotalSpent();
  const remaining = tripData.remaining > 0 ? tripData.remaining : (tripData.totalBudget - totalSpent);
  const totalPages = Math.ceil(filteredExpenses.length / pageSize);
  const startIndex = filteredExpenses.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, filteredExpenses.length);
  const budgetBreakdown = getBudgetBreakdown();

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
            <Link to="/my-trips" className="text-text-primary font-medium border-b-2 border-primary py-1">我的行程</Link>
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
            <div className="flex items-center space-x-2">
              <img 
                src="https://s.coze.cn/image/SxIXNR2TFDI/" 
                alt="用户头像" 
                className="w-8 h-8 rounded-full"
              />
              <span className="text-text-primary font-medium">小雨</span>
            </div>
            <button 
              onClick={handleSidebarToggle}
              className="md:hidden p-2 text-text-secondary hover:text-primary"
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </header>

      {/* 左侧菜单 */}
      <aside className={`fixed left-0 top-16 bottom-0 w-60 bg-white shadow-sm z-40 ${styles.sidebarTransition} ${isSidebarVisible ? '' : '-translate-x-full md:translate-x-0'}`}>
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
            <Link to="/budget-manage" className="flex items-center space-x-3 px-4 py-3 text-primary bg-blue-50 rounded-lg">
              <i className="fas fa-wallet text-lg"></i>
              <span className="font-medium">预算管理</span>
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
        {!searchParams.get('tripId') ? (
          // 没有tripId，显示行程选择界面
          <>
            {/* 页面头部 */}
            <div className="bg-white border-b border-border-light px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <nav className="text-sm text-text-secondary mb-2">
                    <Link to="/my-trips" className="hover:text-primary">我的行程</Link>
                    <span className="mx-2">/</span>
                    <span className="text-text-primary">预算管理</span>
                  </nav>
                  <h1 className="text-2xl font-bold text-text-primary">选择行程</h1>
                  <p className="text-text-secondary mt-1">请选择一个行程进行预算管理</p>
                </div>
              </div>
            </div>

            {/* 行程列表 */}
            <div className="p-6">
              {isLoadingTrips ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p className="text-text-secondary">加载行程列表中...</p>
                  </div>
                </div>
              ) : tripsError ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <i className="fas fa-exclamation-triangle text-4xl text-danger mb-4"></i>
                    <p className="text-danger mb-4">{tripsError}</p>
                    <button 
                      onClick={loadTripsList}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      重试
                    </button>
                  </div>
                </div>
              ) : tripsList.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <i className="fas fa-inbox text-4xl text-text-secondary mb-4"></i>
                    <p className="text-text-secondary mb-4">暂无行程数据</p>
                    <Link 
                      to="/plan-input"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors inline-block"
                    >
                      创建新行程
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tripsList.map((trip) => {
                    const tripName = trip.tripName || '未命名行程';
                    const totalDays = trip.totalDays || 0;
                    const displayName = totalDays > 0 
                      ? `${tripName} · ${totalDays}天${totalDays - 1}夜`
                      : tripName;
                    
                    return (
                      <div
                        key={trip.tripId}
                        onClick={() => trip.tripId && handleSelectTrip(trip.tripId)}
                        className="bg-white rounded-xl shadow-card p-6 cursor-pointer hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-text-primary mb-2">{displayName}</h3>
                            <div className="flex items-center text-text-secondary text-sm mb-2">
                              <i className="fas fa-map-marker-alt mr-2"></i>
                              <span>{trip.destination || '未知目的地'}</span>
                            </div>
                            <div className="flex items-center text-text-secondary text-sm">
                              <i className="fas fa-calendar mr-2"></i>
                              <span>
                                {trip.startDate && trip.endDate 
                                  ? `${trip.startDate} - ${trip.endDate}`
                                  : '日期未设置'
                                }
                              </span>
                            </div>
                          </div>
                          {trip.status && (
                            <span className={`px-3 py-1 text-xs rounded-full ${
                              trip.status === 'active' ? 'bg-green-100 text-green-800' :
                              trip.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {trip.status === 'active' ? '进行中' :
                               trip.status === 'completed' ? '已完成' : '草稿'}
                            </span>
                          )}
                        </div>
                        <div className="border-t border-border-light pt-4 mt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-text-secondary">总预算</span>
                            <span className="text-lg font-semibold text-primary">
                              ¥{trip.budget?.total?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-text-secondary">已花费</span>
                            <span className="text-sm font-medium text-warning">
                              ¥{trip.budget?.spent?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (trip.tripId) handleSelectTrip(trip.tripId);
                          }}
                          className="w-full mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          管理预算
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
              <p className="text-text-secondary">加载中...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <i className="fas fa-exclamation-triangle text-4xl text-danger mb-4"></i>
              <p className="text-danger mb-4">{error}</p>
              <button 
                onClick={() => {
                  const tripId = searchParams.get('tripId');
                  if (tripId) loadTripData(tripId);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                重试
              </button>
              <button 
                onClick={() => {
                  window.location.search = '';
                }}
                className="ml-4 px-4 py-2 border border-border-light rounded-lg hover:bg-gray-50 transition-colors"
              >
                选择其他行程
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 页面头部 */}
            <div className="bg-white border-b border-border-light px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <nav className="text-sm text-text-secondary mb-2">
                    <Link to="/my-trips" className="hover:text-primary">我的行程</Link>
                    <span className="mx-2">/</span>
                    <Link 
                      to="/budget-manage" 
                      className="hover:text-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.search = '';
                      }}
                    >
                      预算管理
                    </Link>
                    {tripData.name && (
                      <>
                        <span className="mx-2">/</span>
                        <span className="text-text-primary">{tripData.name}</span>
                      </>
                    )}
                  </nav>
                  <h1 className="text-2xl font-bold text-text-primary">预算管理</h1>
                  <p className="text-text-secondary mt-1">{tripData.name || '加载中...'}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => {
                      window.location.search = '';
                    }}
                    className="px-4 py-2 border border-border-light rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <i className="fas fa-arrow-left"></i>
                    <span>选择其他行程</span>
                  </button>
                  {/* 语音输入按钮 - 显眼位置 */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('[按钮点击] 语音按钮被点击', { isRecording, isParsingVoice, hasRecognizer: !!recognizerRef.current });
                      if (!isParsingVoice) {
                        handleVoiceInput();
                      }
                    }}
                    disabled={isParsingVoice}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 shadow-lg ${
                      isRecording
                        ? 'bg-danger text-white hover:bg-red-600 animate-pulse cursor-pointer active:bg-red-700'
                        : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-xl cursor-pointer'
                    } ${isParsingVoice ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isRecording ? "点击停止录音" : "语音记录开销"}
                    style={{ pointerEvents: isParsingVoice ? 'none' : 'auto' }}
                  >
                    {isParsingVoice ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>AI解析中...</span>
                      </>
                    ) : isRecording ? (
                      <>
                        <i className="fas fa-stop text-lg"></i>
                        <span>停止录音</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-microphone text-lg"></i>
                        <span>语音记录开销</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={handleRecordExpenseClick}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <i className="fas fa-plus"></i>
                    <span>手动记录</span>
                  </button>
                </div>
              </div>
            </div>

        {/* 预算概览区 */}
        <section className="p-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-6">预算概览</h2>
            
            {/* 语音识别结果显示 */}
            {(showVoiceStatus || voiceText) && (
              <div className={`mb-6 p-4 rounded-lg border-2 ${
                isWebSocketConnected 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-blue-50 border-blue-300'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {isWebSocketConnected ? (
                      <i className="fas fa-check-circle text-green-600"></i>
                    ) : (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    <span className="font-medium text-text-primary">
                      {isRecording ? '正在识别...' : isWebSocketConnected ? '识别完成' : '连接中...'}
                    </span>
                  </div>
                  {voiceText && (
                    <button
                      onClick={() => {
                        setVoiceText('');
                        voiceTextRef.current = '';
                      }}
                      className="text-text-secondary hover:text-text-primary"
                      title="清空"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
                {voiceText ? (
                  <div className="mt-2">
                    <p className="text-sm text-text-secondary mb-1">识别结果：</p>
                    <p className="text-base text-text-primary font-medium bg-white p-3 rounded border border-border-light">
                      {voiceText}
                    </p>
                    {isParsingVoice && (
                      <div className="mt-2 flex items-center space-x-2 text-sm text-primary">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                        <span>AI正在解析开销信息...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary mt-2">
                    {isWebSocketConnected 
                      ? '请开始说话，系统正在识别您的语音...'
                      : '正在连接语音识别服务，请稍候...'}
                  </p>
                )}
              </div>
            )}
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* 总预算 */}
              <div className="text-center p-4 bg-gradient-to-br from-primary to-secondary rounded-lg text-white">
                <div className="text-3xl font-bold mb-1">¥{tripData.totalBudget.toLocaleString()}</div>
                <div className="text-sm opacity-90">总预算</div>
              </div>
              
              {/* 已花费 */}
              <div className="text-center p-4 bg-gradient-to-br from-warning to-danger rounded-lg text-white">
                <div className="text-3xl font-bold mb-1">¥{totalSpent.toLocaleString()}</div>
                <div className="text-sm opacity-90">已花费</div>
              </div>
              
              {/* 剩余预算 */}
              <div className="text-center p-4 bg-gradient-to-br from-success to-tertiary rounded-lg text-white">
                <div className="text-3xl font-bold mb-1">¥{remaining.toLocaleString()}</div>
                <div className="text-sm opacity-90">剩余预算</div>
              </div>
            </div>
            
            {/* 预算对比图表 */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* 饼图 */}
              <div className={styles.chartContainer}>
                <h3 className="text-lg font-medium text-text-primary mb-4">预算分配</h3>
                
                <div className="mt-4 space-y-2">
                  {budgetBreakdown.length > 0 ? (
                    budgetBreakdown.map((item, index) => {
                      const colorClasses = [
                        'bg-primary',
                        'bg-warning', 
                        'bg-success',
                        'bg-secondary',
                        'bg-danger',
                        'bg-gray-500'
                      ];
                      const colorClass = colorClasses[index % colorClasses.length];
                      
                      return (
                        <div key={item.category} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <div className={`w-3 h-3 ${colorClass} rounded-full flex-shrink-0`}></div>
                            <span className="text-sm text-text-secondary truncate">{item.category}</span>
                          </div>
                          <span className="text-sm font-medium text-text-primary flex-shrink-0 ml-2">
                            ¥{item.allocated.toLocaleString()} ({item.percentage}%)
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-text-secondary">暂无预算分配数据</p>
                  )}
                </div>
              </div>
              
              {/* 每日开销 */}
              <div className={styles.chartContainer}>
                <h3 className="text-lg font-medium text-text-primary mb-4">每日开销</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">第1天</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '80%'}}></div>
                      </div>
                      <span className="text-sm font-medium text-text-primary">¥1,450</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">第2天</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '95%'}}></div>
                      </div>
                      <span className="text-sm font-medium text-text-primary">¥1,650</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">第3天</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '70%'}}></div>
                      </div>
                      <span className="text-sm font-medium text-text-primary">¥1,200</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">第4天</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                      <span className="text-sm font-medium text-text-primary">¥1,500</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">第5天</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-300 h-2 rounded-full" style={{width: '0%'}}></div>
                      </div>
                      <span className="text-sm font-medium text-text-secondary">待开始</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 开销记录区 */}
        <section className="px-6 pb-6">
          <div className="bg-white rounded-xl shadow-card">
            {/* 筛选和排序 */}
            <div className="p-6 border-b border-border-light">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-semibold text-text-primary">开销明细</h2>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleFilterChange('all')}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        currentFilter === 'all' ? styles.filterActive : styles.filterInactive
                      }`}
                    >
                      全部
                    </button>
                    <button 
                      onClick={() => handleFilterChange('food')}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        currentFilter === 'food' ? styles.filterActive : styles.filterInactive
                      }`}
                    >
                      餐饮
                    </button>
                    <button 
                      onClick={() => handleFilterChange('transport')}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        currentFilter === 'transport' ? styles.filterActive : styles.filterInactive
                      }`}
                    >
                      交通
                    </button>
                    <button 
                      onClick={() => handleFilterChange('attraction')}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        currentFilter === 'attraction' ? styles.filterActive : styles.filterInactive
                      }`}
                    >
                      景点
                    </button>
                    <button 
                      onClick={() => handleFilterChange('shopping')}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        currentFilter === 'shopping' ? styles.filterActive : styles.filterInactive
                      }`}
                    >
                      购物
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <select 
                    value={currentSort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="date-desc">按日期倒序</option>
                    <option value="date-asc">按日期正序</option>
                    <option value="amount-desc">按金额倒序</option>
                    <option value="amount-asc">按金额正序</option>
                    <option value="category">按类别</option>
                  </select>
                  <button 
                    onClick={handleExport}
                    className="px-4 py-2 border border-border-light rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <i className="fas fa-download"></i>
                    <span>导出</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* 开销明细表格 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">类别</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">描述</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedExpenses.map(expense => (
                    <tr key={expense.id} className={styles.tableRow}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(expense.category)}`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                        ¥{expense.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {expense.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-4">
                          <button 
                            onClick={() => handleEditExpense(expense.id)}
                            className="text-primary hover:text-blue-600 transition-colors"
                            aria-label="编辑开销"
                            title="编辑"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-danger hover:text-red-600 transition-colors"
                            aria-label="删除开销"
                            title="删除"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 分页 */}
            <div className="px-6 py-4 border-t border-border-light">
              <div className="flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  显示第 <span>{startIndex}</span> - <span>{endIndex}</span> 条，共 <span>{filteredExpenses.length}</span> 条记录
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-border-light rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                    aria-label="上一页"
                    title="上一页"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                    <button 
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded transition-colors ${
                        currentPage === page 
                          ? 'bg-primary text-white' 
                          : 'border border-border-light hover:bg-gray-50'
                      }`}
                      aria-label={`第 ${page} 页`}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-border-light rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                    aria-label="下一页"
                    title="下一页"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
          </>
        )}
      </main>

      {/* 开销记录弹窗 */}
      {isModalActive && (
        <div className={styles.expenseModal} onClick={handleCloseModal}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border-light relative">
              <h3 className="text-xl font-semibold text-text-primary">
                {isEditing ? '编辑开销' : '记录开销'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
                aria-label="关闭"
                title="关闭"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* 语音输入按钮 */}
              <div className="mb-4 pb-4 border-b border-border-light">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <i className="fas fa-microphone mr-2 text-primary"></i>
                  语音输入
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[弹窗按钮点击] 语音按钮被点击', { isRecording, isParsingVoice, hasRecognizer: !!recognizerRef.current });
                    if (!isParsingVoice) {
                      handleVoiceInput();
                    }
                  }}
                  disabled={isParsingVoice}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                    isRecording
                      ? 'bg-danger text-white hover:bg-red-600 cursor-pointer active:bg-red-700'
                      : 'bg-primary text-white hover:bg-blue-600 cursor-pointer'
                  } ${isParsingVoice ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ pointerEvents: isParsingVoice ? 'none' : 'auto' }}
                >
                  {isParsingVoice ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>AI解析中...</span>
                    </>
                  ) : isRecording ? (
                    <>
                      <i className="fas fa-stop"></i>
                      <span>停止录音</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-microphone"></i>
                      <span>点击说话记录开销</span>
                    </>
                  )}
                </button>
                
                {/* 语音识别状态 */}
                {showVoiceStatus && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${
                    isWebSocketConnected
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    {!isWebSocketConnected ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span className="text-blue-700">正在连接识别服务...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-check-circle text-green-600"></i>
                        <span className="text-green-700">
                          {isRecording ? '正在聆听，请说话...' : '连接成功，可以开始说话'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="expense-date" className="block text-sm font-medium text-text-primary mb-2">日期</label>
                <input 
                  type="date" 
                  id="expense-date" 
                  value={formData.date}
                  onChange={(e) => handleFormInputChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
                  required 
                />
              </div>
              <div>
                <label htmlFor="expense-category" className="block text-sm font-medium text-text-primary mb-2">类别</label>
                <select 
                  id="expense-category" 
                  value={formData.category}
                  onChange={(e) => handleFormInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
                  required
                  aria-label="开销类别"
                >
                  <option value="">请选择类别</option>
                  <option value="餐饮">餐饮</option>
                  <option value="交通">交通</option>
                  <option value="景点">景点</option>
                  <option value="购物">购物</option>
                  <option value="住宿">住宿</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label htmlFor="expense-amount" className="block text-sm font-medium text-text-primary mb-2">金额</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">¥</span>
                  <input 
                    type="number" 
                    id="expense-amount" 
                    min="0" 
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleFormInputChange('amount', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
                    placeholder="0.00" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label htmlFor="expense-description" className="block text-sm font-medium text-text-primary mb-2">描述</label>
                <textarea 
                  id="expense-description" 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleFormInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="请输入开销描述..."
                ></textarea>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-border-light rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagePage;

