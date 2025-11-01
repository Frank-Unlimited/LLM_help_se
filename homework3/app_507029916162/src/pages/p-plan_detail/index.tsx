import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './styles.module.css';
import { ActivityData, ExpenseData } from './types';
import { api } from '../../utils/api';

const PlanDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 状态管理
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [expenseFormData, setExpenseFormData] = useState<ExpenseData>({
    amount: '',
    category: '',
    date: '',
    description: ''
  });
  
  // 编辑表单数据
  const [editFormData, setEditFormData] = useState({
    tripName: '',
    destination: '',
    startDate: '',
    endDate: '',
    numTravellers: '',
    budget: '',
    status: 'draft' as 'draft' | 'active' | 'completed'
  });
  
  // 状态快速修改
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // 行程数据状态
  const [isLoading, setIsLoading] = useState(true);
  const [tripData, setTripData] = useState<any>(null);
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '行程详情 - 途智行';
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

  // 获取URL参数并加载行程数据
  useEffect(() => {
    const tripId = searchParams.get('tripId');
    if (tripId) {
      console.log('加载行程ID:', tripId);
      
      // TODO: 调用后端接口获取行程详情
      // 需要从后端 GET /api/trips/:tripId 获取以下数据：
      // 
      // 1. 基本信息：
      //    - tripName: 行程名称（如"日本东京美食之旅"）
      //    - destination: 目的地
      //    - startDate, endDate: 起止日期
      //    - totalDays: 总天数
      //    - numTravellers: 同行人数
      //    - status: 状态（draft/active/completed）
      //
      // 2. 预算信息：
      //    - budget.total: 总预算
      //    - budget.spent: 已花费
      //    - budget.remaining: 剩余
      //    - budget.currency: 货币类型
      //
      // 3. 预算分布（budgetBreakdown数组）：
      //    - category: 类别（餐饮/住宿/交通/门票等）
      //    - allocated: 预算分配金额
      //    - spent: 实际花费
      //
      // 4. 每日行程（itinerary数组）：
      //    每天包含：
      //    - day: 第几天
      //    - date: 日期
      //    - title: 当日标题
      //    - summary: 当日概述
      //    - activities: 活动列表，每个活动包含：
      //      * id: 活动ID
      //      * time: 时间（如"09:00"）
      //      * title: 活动标题
      //      * category: 类别（交通/观光/餐饮/购物等）
      //      * location: 地点
      //      * description: 详细描述
      //      * image: 图片URL
      //      * estimatedCost: 预估费用
      //
      // 5. 开销记录（expenses数组）：
      //    - expenseId: 开销ID
      //    - amount: 金额
      //    - category: 类别
      //    - date: 日期
      //    - description: 备注
      //    - createdAt: 记录时间
      //
      // 6. 其他信息：
      //    - notes: AI温馨提示（数组）
      //
      // 调用后端接口获取行程详情
      setIsLoading(true);
      api.getTripDetail(tripId)
        .then(data => {
          console.log('行程数据加载成功:', data);
          setTripData(data);
          setItinerary(data.itinerary || []);
          setBudget(data.budget);
          setExpenses(data.expenses || []);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('加载行程失败:', error);
          alert('加载行程失败，请稍后重试');
          setIsLoading(false);
          navigate('/my-trips');
        });
    }
  }, [searchParams]);

  // 事件处理函数
  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleEditModeToggle = () => {
    if (tripData) {
      // 初始化编辑表单数据
      setEditFormData({
        tripName: tripData.tripName || '',
        destination: tripData.destination || '',
        startDate: tripData.startDate || '',
        endDate: tripData.endDate || '',
        numTravellers: tripData.numTravellers?.toString() || '',
        budget: tripData.budget?.total?.toString() || '',
        status: (tripData.status || 'draft') as 'draft' | 'active' | 'completed'
      });
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // 重置表单数据（但保留当前状态，因为状态选择器在标题旁边）
    if (tripData) {
      setEditFormData({
        tripName: tripData.tripName || '',
        destination: tripData.destination || '',
        startDate: tripData.startDate || '',
        endDate: tripData.endDate || '',
        numTravellers: tripData.numTravellers?.toString() || '',
        budget: tripData.budget?.total?.toString() || '',
        status: (tripData.status || 'draft') as 'draft' | 'active' | 'completed'
      });
    }
  };

  // 快速修改状态
  const handleStatusChange = async (newStatus: 'draft' | 'active' | 'completed') => {
    const tripId = searchParams.get('tripId');
    if (!tripId || !tripData) return;
    
    // 如果状态没有变化，不执行更新
    if (tripData.status === newStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      // 只更新状态
      const updateData = { status: newStatus };
      const updatedTrip = await api.updateTrip(tripId, updateData);
      
      // 更新本地状态
      setTripData(updatedTrip);
      setEditFormData(prev => ({ ...prev, status: newStatus }));
      
      // 标记状态已更新，用于同步"我的行程"页面
      sessionStorage.setItem('tripStatusUpdated', Date.now().toString());
      sessionStorage.setItem('updatedTripId', tripId);
      
      // 静默更新，不显示alert
      console.log('状态更新成功');
    } catch (err) {
      console.error('更新状态失败:', err);
      alert(err instanceof Error ? err.message : '更新状态失败，请稍后重试');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveEdit = async () => {
    const tripId = searchParams.get('tripId');
    if (!tripId) {
      alert('行程ID不存在');
      return;
    }

    // 验证表单数据
    if (!editFormData.tripName || !editFormData.destination) {
      alert('请填写行程名称和目的地');
      return;
    }

    if (!editFormData.startDate || !editFormData.endDate) {
      alert('请填写开始日期和结束日期');
      return;
    }

    if (new Date(editFormData.startDate) > new Date(editFormData.endDate)) {
      alert('结束日期不能早于开始日期');
      return;
    }

    const numTravellers = editFormData.numTravellers ? parseInt(editFormData.numTravellers) : undefined;
    if (numTravellers !== undefined && (isNaN(numTravellers) || numTravellers < 1)) {
      alert('人数必须大于0');
      return;
    }

    const budget = editFormData.budget ? parseFloat(editFormData.budget) : undefined;
    if (budget !== undefined && (isNaN(budget) || budget < 0)) {
      alert('预算必须大于等于0');
      return;
    }

    setIsSaving(true);
    try {
      // 构建更新数据
      const updateData: any = {
        tripName: editFormData.tripName,
        destination: editFormData.destination,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
        status: editFormData.status
      };

      if (numTravellers !== undefined) {
        updateData.numTravellers = numTravellers;
      }

      if (budget !== undefined) {
        updateData.budget = { total: budget };
      }

      // 调用API更新行程
      const updatedTrip = await api.updateTrip(tripId, updateData);
      
      // 更新本地状态
      setTripData(updatedTrip);
      setBudget(updatedTrip.budget);
      setItinerary(updatedTrip.itinerary || []);
      setExpenses(updatedTrip.expenses || []);
      
      // 同步更新编辑表单中的状态
      setEditFormData(prev => ({ ...prev, status: updatedTrip.status as 'draft' | 'active' | 'completed' }));
      
      // 退出编辑模式
      setIsEditMode(false);
      
      alert('行程保存成功！');
    } catch (err) {
      console.error('保存编辑失败:', err);
      alert(err instanceof Error ? err.message : '保存编辑失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordExpense = () => {
    const today = new Date().toISOString().split('T')[0];
    setExpenseFormData(prev => ({ ...prev, date: today }));
    setShowExpenseModal(true);
  };

  const handleBudgetManage = () => {
    const tripId = searchParams.get('tripId');
    if (tripId) {
      navigate(`/budget-manage?tripId=${tripId}`);
    }
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('记录开销:', expenseFormData);
    setShowExpenseModal(false);
    setExpenseFormData({ amount: '', category: '', date: '', description: '' });
    alert('开销记录保存成功！');
  };

  const handleExpenseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExpenseFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    const shareLink = 'https://tuzhixing.com/share/trip/abc123';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareLink).then(() => {
        alert('链接已复制到剪贴板！');
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('链接已复制到剪贴板！');
    }
  };

  const handleSocialShare = (platform: string) => {
    console.log(`分享到${platform}`);
    alert(`正在打开${platform}分享...`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    console.log('删除行程');
    alert('行程删除成功！');
    navigate('/my-trips');
  };

  const handleActivityClick = (activityId: string) => {
    // 从itinerary中找到对应的活动
    let foundActivity = null;
    for (const day of itinerary) {
      const activity = day.activities?.find((act: any) => act.id === activityId);
    if (activity) {
        foundActivity = {
          title: activity.title,
          time: activity.time,
          location: activity.location,
          description: activity.description,
          image: activity.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
          category: activity.category,
          cost: `${budget?.currency || ''} ${activity.estimatedCost || 0}`
        };
        break;
      }
    }
    
    if (foundActivity) {
      setSelectedActivity(foundActivity);
      setShowActivityDrawer(true);
    }
  };

  const handleCloseDrawer = () => {
    setShowActivityDrawer(false);
    setSelectedActivity(null);
  };

  const handleCloseModal = (modalSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    modalSetter(false);
  };

  const handleModalOverlayClick = (e: React.MouseEvent, modalSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (e.target === e.currentTarget) {
      modalSetter(false);
    }
  };

  // Loading状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  // 没有数据
  if (!tripData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-text-secondary">未找到行程数据</p>
          <button 
            onClick={() => navigate('/my-trips')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            返回我的行程
          </button>
        </div>
      </div>
    );
  }

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
            <Link to="/my-trips" className="text-primary font-medium border-b-2 border-primary py-1">我的行程</Link>
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
                src="https://s.coze.cn/image/6V44mo7ag_I/" 
                alt="用户头像" 
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm text-text-primary">小雨</span>
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
            <Link to="/my-trips" className="flex items-center space-x-3 px-4 py-3 text-primary bg-blue-50 rounded-lg">
              <i className="fas fa-list text-lg"></i>
              <span className="font-medium">我的行程</span>
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
      <main className={`ml-0 md:ml-60 mt-16 min-h-screen transition-all duration-300 ${isEditMode ? styles.editMode : ''}`}>
        {/* 页面头部 */}
        <div className="bg-white border-b border-border-light px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <nav className="text-sm text-text-secondary mb-2">
                <Link to="/my-trips" className="hover:text-primary">我的行程</Link>
                <span className="mx-2">/</span>
                <span className="text-text-primary">{tripData.tripName}</span>
              </nav>
              <div className="flex items-center gap-3">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editFormData.tripName}
                    onChange={(e) => setEditFormData({ ...editFormData, tripName: e.target.value })}
                    className="text-2xl font-bold text-text-primary px-3 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full max-w-md"
                    placeholder="行程名称"
                  />
                ) : (
                  <h1 className={`text-2xl font-bold text-text-primary ${styles.editable}`}>{tripData.tripName}</h1>
                )}
                
                {/* 状态选择器 */}
                <div className="flex items-center gap-2">
                  <select
                    value={tripData.status || 'draft'}
                    onChange={(e) => handleStatusChange(e.target.value as 'draft' | 'active' | 'completed')}
                    disabled={isUpdatingStatus}
                    className="px-3 py-1.5 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                    aria-label="选择行程状态"
                  >
                    <option value="draft">草稿</option>
                    <option value="active">进行中</option>
                    <option value="completed">已完成</option>
                  </select>
                  {isUpdatingStatus && (
                    <i className="fas fa-spinner fa-spin text-primary text-sm"></i>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleEditModeToggle}
                className={`px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors ${isEditMode ? 'hidden' : ''}`}
              >
                <i className="fas fa-edit mr-2"></i>编辑行程
              </button>
              {isEditMode && (
                <>
                  <button 
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-4 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-times mr-2"></i>取消
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-4 py-2 bg-success text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>保存中...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>保存行程
                      </>
                    )}
                  </button>
                </>
              )}
              <button 
                onClick={handleShare}
                className="px-4 py-2 text-secondary border border-secondary rounded-lg hover:bg-secondary hover:text-white transition-colors"
              >
                <i className="fas fa-share-alt mr-2"></i>分享
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 text-danger border border-danger rounded-lg hover:bg-danger hover:text-white transition-colors"
              >
                <i className="fas fa-trash mr-2"></i>删除
              </button>
            </div>
          </div>
        </div>

        {/* 行程概览区 */}
        <section className="p-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-map-marker-alt text-white text-lg"></i>
                </div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">目的地</h3>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editFormData.destination}
                    onChange={(e) => setEditFormData({ ...editFormData, destination: e.target.value })}
                    className="text-lg font-semibold text-text-primary px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary w-full"
                    placeholder="目的地"
                  />
                ) : (
                  <p className={`text-lg font-semibold text-text-primary ${styles.editable}`}>{tripData.destination}</p>
                )}
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-tertiary to-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-calendar text-white text-lg"></i>
                </div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">日期</h3>
                {isEditMode ? (
                  <div className="space-y-2">
                    <input
                      type="date"
                      id="edit-start-date"
                      value={editFormData.startDate}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      className="text-sm font-semibold text-text-primary px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary w-full"
                      aria-label="开始日期"
                    />
                    <span className="text-sm text-text-secondary">至</span>
                    <input
                      type="date"
                      id="edit-end-date"
                      value={editFormData.endDate}
                      onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                      min={editFormData.startDate}
                      className="text-sm font-semibold text-text-primary px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary w-full"
                      aria-label="结束日期"
                    />
                  </div>
                ) : (
                  <>
                    <p className={`text-lg font-semibold text-text-primary ${styles.editable}`}>{tripData.startDate} - {tripData.endDate}</p>
                    <p className="text-sm text-text-secondary">{tripData.totalDays}天</p>
                  </>
                )}
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-tertiary rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-users text-white text-lg"></i>
                </div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">人数</h3>
                {isEditMode ? (
                  <input
                    type="number"
                    value={editFormData.numTravellers}
                    onChange={(e) => setEditFormData({ ...editFormData, numTravellers: e.target.value })}
                    min="1"
                    placeholder="人数"
                    className="text-lg font-semibold text-text-primary px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary w-full"
                  />
                ) : (
                  <p className={`text-lg font-semibold text-text-primary ${styles.editable}`}>{tripData.numTravellers || '-'}人</p>
                )}
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-warning to-danger rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-yen-sign text-white text-lg"></i>
                </div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">预算</h3>
                {isEditMode ? (
                  <div>
                    <input
                      type="number"
                      value={editFormData.budget}
                      onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                      min="0"
                      step="0.01"
                      placeholder="预算"
                      className="text-lg font-semibold text-text-primary px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary w-full"
                    />
                    <p className="text-sm text-text-secondary mt-1">已花费 {budget?.currency} {budget?.spent || 0}</p>
                  </div>
                ) : (
                  <>
                    <p className={`text-lg font-semibold text-text-primary ${styles.editable}`}>{budget?.currency} {budget?.total || 0}</p>
                    <p className="text-sm text-text-secondary">已花费 {budget?.currency} {budget?.spent || 0}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 费用管理模块 */}
        <section className="px-6 pb-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary">预算概览</h2>
              <button 
                onClick={handleBudgetManage}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <i className="fas fa-wallet mr-2"></i>预算管理
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{budget?.currency} {budget?.total || 0}</div>
                    <div className="text-sm text-text-secondary">总预算</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-warning">{budget?.currency} {budget?.spent || 0}</div>
                    <div className="text-sm text-text-secondary">已花费</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-success">{budget?.currency} {budget?.remaining || 0}</div>
                    <div className="text-sm text-text-secondary">剩余</div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-text-secondary mb-3">费用分布</h3>
                <div className="space-y-3">
                  {tripData.budgetBreakdown?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-text-primary">{item.category}</span>
                      <span className="text-sm font-medium text-text-primary">{budget?.currency} {item.spent || 0}</span>
                  </div>
                  ))}
                  </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI温馨提示 */}
        {tripData.notes && (
          <section className="px-6 pb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-card p-6 border border-blue-100">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-lightbulb text-white text-xl"></i>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-text-primary mb-3 flex items-center">
                    <i className="fas fa-robot mr-2 text-primary"></i>
                    AI温馨提示
                  </h2>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                      {tripData.notes}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 每日行程区 */}
        <section className="px-6 pb-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-6">详细行程</h2>
            
            {/* 动态渲染每日行程 */}
            {itinerary.map((dayPlan: any) => (
            <div key={dayPlan.day} className="mb-8">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold">{dayPlan.day}</span>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold text-text-primary ${styles.editable}`}>{dayPlan.title}</h3>
                  <p className={`text-sm text-text-secondary ${styles.editable}`}>{dayPlan.summary || ''}</p>
                </div>
              </div>
              
              <div className="ml-13 space-y-4">
                {/* 渲染当天的活动 */}
                {dayPlan.activities?.map((activity: any, actIndex: number) => {
                  // 优先使用 nextLocation，如果没有则获取下一个活动作为终点
                  const hasNextLocation = activity.nextLocation && activity.nextLocation.trim();
                  const nextActivity = !hasNextLocation && actIndex < dayPlan.activities.length - 1 
                    ? dayPlan.activities[actIndex + 1] 
                    : null;
                  
                  // 提取地点信息（从location字段中提取城市和关键词）
                  const extractLocationInfo = (locationStr: string) => {
                    if (!locationStr) {
                      // 如果没有location，使用行程目的地作为城市
                      return { 
                        keyword: '', 
                        city: tripData?.destination || '' 
                      };
                    }
                    
                    // 尝试从location中提取城市和关键词
                    // 格式可能是："东京浅草寺" 或 "Shinjuku Station" 或 "新宿站" 或 "成田机场 → 新宿"
                    const cities = [
                      '东京', 'Tokyo', '大阪', 'Osaka', '京都', 'Kyoto',
                      '北京', 'Beijing', '上海', 'Shanghai', '成都', 'Chengdu',
                      '广州', 'Guangzhou', '深圳', 'Shenzhen', '杭州', 'Hangzhou',
                      '南京', 'Nanjing', '武汉', 'Wuhan', '西安', 'Xi\'an',
                      '天津', 'Tianjin', '重庆', 'Chongqing'
                    ];
                    
                    let city = '';
                    let keyword = locationStr.trim();
                    
                    // 检查是否包含城市名
                    for (const cityName of cities) {
                      if (locationStr.includes(cityName)) {
                        city = cityName;
                        // 移除城市名，保留剩余部分作为关键词
                        keyword = locationStr.replace(cityName, '').trim();
                        // 清理可能的连接符（如 →、-、到等）
                        keyword = keyword.replace(/^[→\-到到\s]+/g, '').trim();
                        break;
                      }
                    }
                    
                    // 如果没有找到城市，尝试从tripData中获取目的地城市
                    if (!city && tripData?.destination) {
                      city = tripData.destination;
                      // 如果整个location就是城市名，则不使用location作为keyword
                      if (locationStr === tripData.destination) {
                        keyword = '';
                      }
                    }
                    
                    // 如果关键词为空，使用完整的location作为关键词（但排除城市名）
                    if (!keyword || keyword === city) {
                      keyword = locationStr;
                    }
                    
                    return { keyword, city };
                  };
                  
                  const startInfo = extractLocationInfo(activity.location || '');
                  // 优先使用 nextLocation，否则使用下一个活动的 location
                  const endLocation = hasNextLocation 
                    ? activity.nextLocation 
                    : (nextActivity ? nextActivity.location : '');
                  const endInfo = extractLocationInfo(endLocation);
                  
                  return (
                    <div 
                      key={activity.id}
                      className={`${styles.activityItem} ${styles.timelineItem} ${actIndex < dayPlan.activities.length - 1 ? styles.timelineLine : ''} p-4 rounded-lg`}
                    >
                      <div 
                        className="flex items-start space-x-4 cursor-pointer"
                        onClick={() => handleActivityClick(activity.id)}
                      >
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <i className={`fas fa-${activity.category === 'Sightseeing' || activity.category === '观光' ? 'landmark' : activity.category === 'Food' || activity.category === '餐饮' ? 'utensils' : activity.category === 'Shopping' || activity.category === '购物' ? 'shopping-bag' : activity.category === 'Transport' || activity.category === '交通' ? 'car' : 'star'} text-white text-sm`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-medium text-text-primary ${styles.editable}`}>{activity.title}</h4>
                            <span className="text-sm text-text-secondary">{activity.time}</span>
                          </div>
                          <p className={`text-sm text-text-secondary mb-2 ${styles.editable}`}>{activity.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-text-secondary mb-2">
                            <span><i className="fas fa-map-marker-alt mr-1"></i>{activity.location}</span>
                            <span><i className="fas fa-yen-sign mr-1"></i>{budget?.currency} {activity.estimatedCost || 0}</span>
                          </div>
                          {/* 显示 nextLocation */}
                          {hasNextLocation && (
                            <div className="flex items-center text-xs text-primary mt-1">
                              <i className="fas fa-arrow-right mr-1"></i>
                              <span className="font-medium">下一站：{activity.nextLocation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* 导航按钮 - 如果有 nextLocation 或下一个活动则显示 */}
                      {(hasNextLocation || nextActivity) && (
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // 跳转到导航页面，优先使用 nextLocation
                              // 使用 encodeURIComponent 确保中文正确编码
                              const buildParam = (value: string) => encodeURIComponent(value || '');
                              
                              const params = new URLSearchParams();
                              const fromKw = startInfo.keyword || activity.location || '';
                              const fromC = startInfo.city || tripData?.destination || '';
                              const toKw = endInfo.keyword || endLocation || '';
                              const toC = endInfo.city || tripData?.destination || '';
                              
                              if (fromKw) params.set('fromKeyword', fromKw);
                              if (fromC) params.set('fromCity', fromC);
                              if (toKw) params.set('toKeyword', toKw);
                              if (toC) params.set('toCity', toC);
                              
                              window.open(`/navigation?${params.toString()}`, '_blank');
                            }}
                            className="px-4 py-2 bg-success text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2 text-sm"
                            aria-label="导航到下一个地点"
                            title="导航"
                          >
                            <i className="fas fa-directions"></i>
                            <span>导航到下一地点</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            ))}
          </div>
        </section>
      </main>

      {/* 活动详情抽屉 */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${showActivityDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border-light">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">活动详情</h3>
              <button 
                onClick={handleCloseDrawer}
                className="p-2 text-text-secondary hover:text-text-primary"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedActivity && (
              <div className="space-y-4">
                <img 
                  src={selectedActivity.image} 
                  alt={selectedActivity.title} 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-text-secondary">
                    <i className="fas fa-clock mr-2"></i>
                    <span>{selectedActivity.time}</span>
                  </div>
                  <div className="flex items-center text-sm text-text-secondary">
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    <span>{selectedActivity.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-text-secondary">
                    <i className="fas fa-tag mr-2"></i>
                    <span>{selectedActivity.category}</span>
                  </div>
                  <div className="flex items-center text-sm text-text-secondary">
                    <i className="fas fa-yen-sign mr-2"></i>
                    <span>{selectedActivity.cost}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary mb-2">详细描述</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">{selectedActivity.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 抽屉遮罩 */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 ${showActivityDrawer ? '' : 'hidden'} ${styles.drawerOverlay}`}
        onClick={() => handleCloseDrawer()}
      ></div>

      {/* 记录开销弹窗 */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${showExpenseModal ? '' : 'hidden'} ${styles.modalOverlay}`}
        onClick={(e) => handleModalOverlayClick(e, setShowExpenseModal)}
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">记录开销</h3>
                <button 
                  onClick={() => handleCloseModal(setShowExpenseModal)}
                  className="p-2 text-text-secondary hover:text-text-primary"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div>
                  <label htmlFor="expense-amount" className="block text-sm font-medium text-text-primary mb-2">金额</label>
                  <input 
                    type="number" 
                    id="expense-amount" 
                    name="amount" 
                    value={expenseFormData.amount}
                    onChange={handleExpenseInputChange}
                    className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                    placeholder="请输入金额" 
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="expense-category" className="block text-sm font-medium text-text-primary mb-2">类别</label>
                  <select 
                    id="expense-category" 
                    name="category" 
                    value={expenseFormData.category}
                    onChange={handleExpenseInputChange}
                    className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                    required
                  >
                    <option value="">请选择类别</option>
                    <option value="餐饮">餐饮</option>
                    <option value="住宿">住宿</option>
                    <option value="交通">交通</option>
                    <option value="购物">购物</option>
                    <option value="门票">门票</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="expense-date" className="block text-sm font-medium text-text-primary mb-2">日期</label>
                  <input 
                    type="date" 
                    id="expense-date" 
                    name="date" 
                    value={expenseFormData.date}
                    onChange={handleExpenseInputChange}
                    className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="expense-description" className="block text-sm font-medium text-text-primary mb-2">备注</label>
                  <textarea 
                    id="expense-description" 
                    name="description" 
                    rows={3}
                    value={expenseFormData.description}
                    onChange={handleExpenseInputChange}
                    className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                    placeholder="请输入备注信息"
                  ></textarea>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => handleCloseModal(setShowExpenseModal)}
                    className="flex-1 px-4 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 分享弹窗 */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${showShareModal ? '' : 'hidden'} ${styles.modalOverlay}`}
        onClick={(e) => handleModalOverlayClick(e, setShowShareModal)}
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">分享行程</h3>
                <button 
                  onClick={() => handleCloseModal(setShowShareModal)}
                  className="p-2 text-text-secondary hover:text-text-primary"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">分享链接</label>
                  <div className="flex">
                    <input 
                      type="text" 
                      value="https://tuzhixing.com/share/trip/abc123" 
                      readOnly 
                      className="flex-1 px-3 py-2 border border-border-light rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
                    />
                    <button 
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-primary text-white rounded-r-lg hover:bg-blue-600 transition-colors"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <button 
                    onClick={() => handleSocialShare('微信')}
                    className="flex flex-col items-center p-4 border border-border-light rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <i className="fab fa-weixin text-2xl text-success mb-2"></i>
                    <span className="text-sm text-text-primary">微信</span>
                  </button>
                  <button 
                    onClick={() => handleSocialShare('QQ')}
                    className="flex flex-col items-center p-4 border border-border-light rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <i className="fab fa-qq text-2xl text-info mb-2"></i>
                    <span className="text-sm text-text-primary">QQ</span>
                  </button>
                  <button 
                    onClick={() => handleSocialShare('微博')}
                    className="flex flex-col items-center p-4 border border-border-light rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <i className="fab fa-weibo text-2xl text-danger mb-2"></i>
                    <span className="text-sm text-text-primary">微博</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${showDeleteModal ? '' : 'hidden'} ${styles.modalOverlay}`}
        onClick={(e) => handleModalOverlayClick(e, setShowDeleteModal)}
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-exclamation-triangle text-danger text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">确认删除</h3>
                <p className="text-text-secondary mb-6">删除后将无法恢复，确定要删除这个行程吗？</p>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleCloseModal(setShowDeleteModal)}
                    className="flex-1 px-4 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanDetailPage;

