

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { TripData } from './types';
import { api } from '../../utils/api';

const MyTripsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentDeleteTripId, setCurrentDeleteTripId] = useState<string | null>(null);
  const [currentShareTripId, setCurrentShareTripId] = useState<string | null>(null);
  const [currentEditTripId, setCurrentEditTripId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    startDate: '',
    endDate: '',
    numTravellers: '',
    budget: '',
    status: 'draft' as 'draft' | 'active' | 'completed'
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [updatingStatusTripId, setUpdatingStatusTripId] = useState<string | null>(null);
  const [tripSearchTerm, setTripSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [tripsData, setTripsData] = useState<TripData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalTrips, setTotalTrips] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(10);

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '我的行程 - 途智行';
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

  // 格式化日期：将 YYYY-MM-DD 转换为中文日期格式
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}年${month}月${day}日`;
    } catch (error) {
      return dateStr;
    }
  };

  // 将后端数据转换为前端格式
  const convertTripToTripData = (trip: any): TripData => {
    const startDate = formatDate(trip.startDate || '');
    const endDate = formatDate(trip.endDate || '');
    const dates = startDate && endDate ? `${startDate} - ${endDate}` : '';
    
    // 获取图片URL，优先使用imageUrl，否则随机从defaultImgUrls里选一个
    const defaultImgUrls = [
      'https://s.coze.cn/image/Wfu3diMcxMM/',
      'data:image/webp;base64,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',
      'https://tse1-mm.cn.bing.net/th/id/OIP-C.ejKEsYOnXgRfEXfjAYnS7gHaEM?w=271&h=180&c=7&r=0&o=7&dpr=2&pid=1.7&rm=3',
      'https://ts1.tc.mm.bing.net/th/id/R-C.c4fd334062ff9776f48b2bbf0da019a2?rik=bmZ5tdrOYNFm2g&riu=http%3a%2f%2fn.sinaimg.cn%2fsinacn10106%2f792%2fw2000h1192%2f20190725%2fd10c-iafwsqp7975489.jpg&ehk=toAuQKNKPv0sa8BLn%2b4hwOhRS1uTo%2b5UBQ3LtmyiRcg%3d&risl=&pid=ImgRaw&r=0',
      'https://ts2.tc.mm.bing.net/th/id/OIP-C.lPiiSFP-mcVDA8XYjfMl5AAAAA?rs=1&pid=ImgDetMain&o=7&rm=3',
    ];
    let imageUrl = trip.imageUrl || defaultImgUrls[Math.floor(Math.random() * defaultImgUrls.length)];
    if (!trip.imageUrl && trip.itinerary && trip.itinerary.length > 0) {
      const firstDay = trip.itinerary[0];
      if (firstDay.activities && firstDay.activities.length > 0) {
        const firstActivity = firstDay.activities[0];
        if (firstActivity.image) {
          imageUrl = firstActivity.image;
        }
      }
    }

    return {
      id: trip.tripId,
      title: trip.tripName || '未命名行程',
      destination: trip.destination || '未知目的地',
      dates: dates,
      budget: trip.budget?.total || 0,
      spent: trip.budget?.spent,
      status: (trip.status || 'draft') as 'draft' | 'active' | 'completed',
      image: imageUrl,
      imageAlt: `${trip.destination || '行程'}风景`,
      imageCategory: '旅行'
    };
  };

  // 加载行程列表
  const loadTrips = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('请先登录');
        setIsLoading(false);
        return;
      }
      
      const params: any = {
        page: page,
        limit: pageLimit
      };
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      const response = await api.getUserTrips(userId, params);
      const convertedTrips = response.trips.map(convertTripToTripData);
      setTripsData(convertedTrips);
      setTotalTrips(response.total || 0);
      setCurrentPage(response.page || page);
    } catch (err) {
      console.error('加载行程列表失败:', err);
      setError(err instanceof Error ? err.message : '加载行程列表失败');
      setTripsData([]);
      setTotalTrips(0);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载和筛选条件变化时重新加载
  useEffect(() => {
    loadTrips(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]); // 当状态筛选变化时重新加载

  // 监听页面焦点，如果从详情页返回且状态已更新，则刷新列表
  useEffect(() => {
    const handleFocus = () => {
      const statusUpdated = sessionStorage.getItem('tripStatusUpdated');
      if (statusUpdated) {
        // 清除标记并刷新列表
        sessionStorage.removeItem('tripStatusUpdated');
        sessionStorage.removeItem('updatedTripId');
        loadTrips(currentPage);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // 组件挂载时检查是否有状态更新
  useEffect(() => {
    const statusUpdated = sessionStorage.getItem('tripStatusUpdated');
    if (statusUpdated) {
      sessionStorage.removeItem('tripStatusUpdated');
      sessionStorage.removeItem('updatedTripId');
      loadTrips(currentPage);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 延迟搜索（避免频繁请求）
  useEffect(() => {
    // 搜索使用前端筛选，不需要重新请求API
  }, [tripSearchTerm, destinationFilter, dateFilter]);

  // 筛选行程
  const filteredTrips = tripsData.filter(trip => {
    // 搜索筛选
    if (tripSearchTerm) {
      const searchTerm = tripSearchTerm.toLowerCase();
      if (!trip.title.toLowerCase().includes(searchTerm) && 
          !trip.destination.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }

    // 状态筛选
    if (statusFilter && trip.status !== statusFilter) {
      return false;
    }

    // 目的地筛选
    if (destinationFilter) {
      const isInternational = ['日本', '法国', '泰国'].some(country => 
        trip.destination.includes(country)
      );
      
      if (destinationFilter === 'international' && !isInternational) {
        return false;
      } else if (destinationFilter === 'domestic' && isInternational) {
        return false;
      }
    }

    return true;
  });

  // 处理侧边栏切换
  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 处理新建行程
  const handleNewTrip = () => {
    navigate('/plan-input');
  };

  // 处理查看行程
  const handleViewTrip = (tripId: string) => {
    navigate(`/plan-detail?tripId=${tripId}`);
  };

  // 处理编辑行程
  const handleEditTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    setCurrentEditTripId(tripId);
    
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('请先登录');
        return;
      }
      
      // 获取行程详情
      const tripDetail = await api.getTripDetail(tripId, userId);
      
      // 填充表单数据
      setEditFormData({
        startDate: tripDetail.startDate || '',
        endDate: tripDetail.endDate || '',
        numTravellers: tripDetail.numTravellers?.toString() || '',
        budget: tripDetail.budget?.total?.toString() || '',
        status: (tripDetail.status || 'draft') as 'draft' | 'active' | 'completed'
      });
      
      setShowEditModal(true);
    } catch (err) {
      console.error('获取行程详情失败:', err);
      alert(err instanceof Error ? err.message : '获取行程详情失败，请稍后重试');
    }
  };

  // 处理保存编辑
  const handleSaveEdit = async () => {
    if (!currentEditTripId) return;
    
    // 验证表单数据
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
    
    setIsSavingEdit(true);
    try {
      // 构建更新数据
      const updateData: any = {
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
      
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('请先登录');
        return;
      }
      
      // 调用API更新行程
      await api.updateTrip(currentEditTripId, userId, updateData);
      
      // 关闭模态框并重新加载列表
      setShowEditModal(false);
      setCurrentEditTripId(null);
      await loadTrips(currentPage);
      
      alert('行程更新成功');
    } catch (err) {
      console.error('保存编辑失败:', err);
      alert(err instanceof Error ? err.message : '保存编辑失败，请稍后重试');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 关闭编辑模态框
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setCurrentEditTripId(null);
    setEditFormData({
      startDate: '',
      endDate: '',
      numTravellers: '',
      budget: '',
      status: 'draft'
    });
  };

  // 处理分享行程
  const handleShareTrip = (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    setCurrentShareTripId(tripId);
    setShowShareModal(true);
  };

  // 处理预算管理
  const handleBudgetManage = (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    navigate(`/budget-manage?tripId=${tripId}`);
  };

  // 处理删除行程
  const handleDeleteTrip = (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    setCurrentDeleteTripId(tripId);
    setShowDeleteModal(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (currentDeleteTripId) {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          alert('请先登录');
          return;
        }
        await api.deleteTrip(currentDeleteTripId, userId);
        console.log('删除行程成功:', currentDeleteTripId);
        // 重新加载列表
        await loadTrips();
        setShowDeleteModal(false);
        setCurrentDeleteTripId(null);
      } catch (err) {
        console.error('删除行程失败:', err);
        alert(err instanceof Error ? err.message : '删除行程失败，请稍后重试');
      }
    }
  };

  // 取消删除
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCurrentDeleteTripId(null);
  };

  // 复制分享链接
  const handleCopyLink = () => {
    const shareLink = `https://tuzhixing.com/share/${currentShareTripId}`;
    navigator.clipboard?.writeText(shareLink).then(() => {
      console.log('链接已复制');
    }).catch(() => {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('链接已复制');
    });
  };

  // 导出PDF
  const handleExportPdf = () => {
    console.log('需要调用第三方接口实现PDF导出功能');
  };

  // 关闭分享模态框
  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setCurrentShareTripId(null);
  };

  // 获取状态徽章样式
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return `${styles.statusBadge} ${styles.statusDraft}`;
      case 'active':
        return `${styles.statusBadge} ${styles.statusActive}`;
      case 'completed':
        return `${styles.statusBadge} ${styles.statusCompleted}`;
      default:
        return styles.statusBadge;
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return '草稿';
      case 'active':
        return '进行中';
      case 'completed':
        return '已完成';
      default:
        return status;
    }
  };

  // 快速修改状态
  const handleQuickStatusChange = async (tripId: string, newStatus: 'draft' | 'active' | 'completed', e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止点击事件冒泡到卡片
    
    setUpdatingStatusTripId(tripId);
    try {
      // 只更新状态
      const updateData = { status: newStatus };
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('请先登录');
        return;
      }
      await api.updateTrip(tripId, userId, updateData);
      
      // 重新加载列表以显示最新状态
      await loadTrips(currentPage);
      
      // 标记状态已更新
      sessionStorage.setItem('tripStatusUpdated', Date.now().toString());
      sessionStorage.setItem('updatedTripId', tripId);
      
      console.log('状态更新成功');
    } catch (err) {
      console.error('更新状态失败:', err);
      alert(err instanceof Error ? err.message : '更新状态失败，请稍后重试');
    } finally {
      setUpdatingStatusTripId(null);
    }
  };

  // 渲染预算信息和状态
  const renderBudgetInfo = (trip: TripData) => {
    const isUpdating = updatingStatusTripId === trip.id;
    
    // 预算信息部分
    let budgetContent = null;
    if (trip.status === 'active' && trip.spent) {
      const remaining = trip.budget - trip.spent;
      budgetContent = (
        <div className="text-sm text-text-secondary">
          <span className="text-success">已花费 ¥{trip.spent.toLocaleString()}</span>
          <span className="text-text-secondary ml-2">剩余 ¥{remaining.toLocaleString()}</span>
        </div>
      );
    } else if (trip.status === 'completed' && trip.spent) {
      const difference = trip.spent - trip.budget;
      const isOver = difference > 0;
      budgetContent = (
        <div className="text-sm text-text-secondary">
          <span className="text-success">实际花费 ¥{trip.spent.toLocaleString()}</span>
          <span className={`ml-2 ${isOver ? 'text-danger' : 'text-success'}`}>
            {isOver ? `超支 ¥${difference.toLocaleString()}` : `节省 ¥${Math.abs(difference).toLocaleString()}`}
          </span>
        </div>
      );
    } else {
      
    }
    
    // 状态选择器
    const statusSelector = (
      <div className="flex items-center gap-2">
        <select
          value={trip.status || 'draft'}
          onChange={(e) => {
            e.stopPropagation();
            handleQuickStatusChange(trip.id, e.target.value as 'draft' | 'active' | 'completed', e as any);
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={isUpdating}
          className="text-xs px-2 py-1 border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed bg-white"
          aria-label={`选择行程${trip.title}的状态`}
        >
          <option value="draft">草稿</option>
          <option value="active">进行中</option>
          <option value="completed">已完成</option>
        </select>
        {isUpdating && (
          <i className="fas fa-spinner fa-spin text-primary text-xs"></i>
        )}
      </div>
    );
    
    return (
      <div className="flex items-center justify-between gap-3">
        {budgetContent}
        {statusSelector}
      </div>
    );
  };

  return (
    <div className={styles.pageWrapper}>
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 h-16">
        <div className="flex items-center justify-between h-full px-6">
          {/* Logo和产品名称 */}
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${styles.gradientBg} rounded-lg flex items-center justify-center`}>
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
                src="https://s.coze.cn/image/8wNJ0pRFEhg/" 
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
      <main className="ml-0 md:ml-60 mt-16 min-h-screen transition-all duration-300">
        {/* 页面头部 */}
        <div className="bg-white border-b border-border-light px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">我的行程</h1>
              <nav className="flex items-center space-x-2 text-sm text-text-secondary mt-1">
                <Link to="/home" className="hover:text-primary">首页</Link>
                <i className="fas fa-chevron-right text-xs"></i>
                <span>我的行程</span>
              </nav>
            </div>
            <button 
              onClick={handleNewTrip}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span>新建行程</span>
            </button>
          </div>
        </div>

        {/* 搜索和筛选区 */}
        <div className="bg-white border-b border-border-light px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* 搜索框 */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="搜索行程名称或目的地..." 
                  value={tripSearchTerm}
                  onChange={(e) => setTripSearchTerm(e.target.value)}
                  className={`w-80 pl-10 pr-4 py-2 border border-border-light rounded-lg ${styles.searchInput}`}
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
              </div>
            </div>
            
            {/* 筛选条件 */}
            <div className="flex items-center space-x-4">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 border border-border-light rounded-lg ${styles.filterSelect}`}
              >
                <option value="">全部状态</option>
                <option value="draft">草稿</option>
                <option value="active">进行中</option>
                <option value="completed">已完成</option>
              </select>
              
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`px-4 py-2 border border-border-light rounded-lg ${styles.filterSelect}`}
              >
                <option value="">全部日期</option>
                <option value="recent">最近一个月</option>
                <option value="this-month">本月</option>
                <option value="next-month">下月</option>
              </select>
              
              <select 
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className={`px-4 py-2 border border-border-light rounded-lg ${styles.filterSelect}`}
              >
                <option value="">全部目的地</option>
                <option value="domestic">国内</option>
                <option value="international">国外</option>
              </select>
            </div>
          </div>
        </div>

        {/* 行程列表区 */}
        <div className="p-8">
          {isLoading ? (
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
                  onClick={() => loadTrips(1)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <i className="fas fa-inbox text-4xl text-text-secondary mb-4"></i>
                <p className="text-text-secondary mb-4">暂无行程数据</p>
                <button 
                  onClick={handleNewTrip}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  创建新行程
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip) => (
              <div 
                key={trip.id}
                onClick={() => handleViewTrip(trip.id)}
                className={`bg-white rounded-xl shadow-card ${styles.cardHover} cursor-pointer`}
              >
                <div className="relative">
                  <img 
                    src={trip.image} 
                    alt={trip.imageAlt} 
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={getStatusBadgeClass(trip.status)}>
                      {getStatusText(trip.status)}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-text-primary mb-2">{trip.title}</h3>
                  <div className="flex items-center text-text-secondary text-sm mb-3">
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    <span>{trip.destination}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
                    <div className="flex items-center">
                      <i className="fas fa-calendar mr-2"></i>
                      <span>{trip.dates}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary">¥{trip.budget.toLocaleString()}</div>
                      <div className="text-xs">预算</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {renderBudgetInfo(trip)}
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleViewTrip(trip.id); }}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        onClick={(e) => handleEditTrip(e, trip.id)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                        title="编辑行程"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={(e) => handleShareTrip(e, trip.id)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                        title="分享行程"
                      >
                        <i className="fas fa-share"></i>
                      </button>
                      <button 
                        onClick={(e) => handleDeleteTrip(e, trip.id)}
                        className="p-2 text-text-secondary hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                        title="删除行程"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              ))}

              {/* 新建行程卡片 */}
              <div 
                onClick={handleNewTrip}
                className="border-2 border-dashed border-border-light rounded-xl p-8 text-center hover:border-primary hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <div className={`w-16 h-16 ${styles.gradientBg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <i className="fas fa-plus text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">创建新行程</h3>
                <p className="text-text-secondary text-sm">开始规划你的下一次旅行</p>
              </div>
            </div>
          )}
        </div>

        {/* 分页区 */}
        {!isLoading && !error && totalTrips > 0 && (
          <div className="bg-white border-t border-border-light px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                显示第 {(currentPage - 1) * pageLimit + 1}-{Math.min(currentPage * pageLimit, totalTrips)} 条，共 {totalTrips} 条记录
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => loadTrips(currentPage - 1)}
                  className="px-3 py-2 text-sm text-text-secondary border border-border-light rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={currentPage <= 1}
                >
                  <i className="fas fa-chevron-left"></i>
                  上一页
                </button>
                {Array.from({ length: Math.min(Math.ceil(totalTrips / pageLimit), 10) }, (_, i) => i + 1).map(pageNum => (
                  <button 
                    key={pageNum}
                    onClick={() => loadTrips(pageNum)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      pageNum === currentPage 
                        ? 'bg-primary text-white' 
                        : 'text-text-secondary border border-border-light hover:bg-gray-50'
                    }`}
                    aria-label={`第 ${pageNum} 页`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button 
                  onClick={() => loadTrips(currentPage + 1)}
                  className="px-3 py-2 text-sm text-text-secondary border border-border-light rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage >= Math.ceil(totalTrips / pageLimit)}
                >
                  下一页
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 删除确认模态框 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-exclamation-triangle text-danger text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">确认删除</h3>
                <p className="text-text-secondary mb-6">确定要删除这个行程吗？删除后将无法恢复。</p>
                <div className="flex space-x-3">
                  <button 
                    onClick={handleCancelDelete}
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
      )}

      {/* 分享模态框 */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-share-alt text-primary text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">分享行程</h3>
                <p className="text-text-secondary mb-6">复制链接分享给朋友，或导出为PDF格式</p>
                <div className="mb-4">
                  <input 
                    type="text" 
                    value={`https://tuzhixing.com/share/${currentShareTripId}`} 
                    readOnly 
                    className="w-full px-4 py-2 border border-border-light rounded-lg bg-gray-50 text-sm"
                  />
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={handleCopyLink}
                    className="flex-1 px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                  >
                    <i className="fas fa-copy mr-2"></i>
                    复制链接
                  </button>
                  <button 
                    onClick={handleExportPdf}
                    className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <i className="fas fa-file-pdf mr-2"></i>
                    导出PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleCloseEditModal}>
          <div className="flex items-center justify-center min-h-screen p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-text-primary mb-2">编辑行程</h3>
                <p className="text-text-secondary">修改行程的时间、人数、预算和状态</p>
              </div>
              
              <div className="space-y-4">
                {/* 时间选择 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-start-date" className="block text-sm font-medium text-text-primary mb-2">
                      开始日期 <span className="text-danger">*</span>
                    </label>
                    <input
                      id="edit-start-date"
                      type="date"
                      value={editFormData.startDate}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      aria-label="开始日期"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-end-date" className="block text-sm font-medium text-text-primary mb-2">
                      结束日期 <span className="text-danger">*</span>
                    </label>
                    <input
                      id="edit-end-date"
                      type="date"
                      value={editFormData.endDate}
                      onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                      min={editFormData.startDate}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      aria-label="结束日期"
                    />
                  </div>
                </div>
                
                {/* 人数和预算 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-num-travellers" className="block text-sm font-medium text-text-primary mb-2">
                      人数
                    </label>
                    <input
                      id="edit-num-travellers"
                      type="number"
                      value={editFormData.numTravellers}
                      onChange={(e) => setEditFormData({ ...editFormData, numTravellers: e.target.value })}
                      min="1"
                      placeholder="请输入人数"
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      aria-label="人数"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-budget" className="block text-sm font-medium text-text-primary mb-2">
                      预算 (元)
                    </label>
                    <input
                      id="edit-budget"
                      type="number"
                      value={editFormData.budget}
                      onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                      min="0"
                      step="0.01"
                      placeholder="请输入预算"
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      aria-label="预算"
                    />
                  </div>
                </div>
                
                {/* 状态选择 */}
                <div>
                  <label htmlFor="edit-status-select" className="block text-sm font-medium text-text-primary mb-2">
                    状态 <span className="text-danger">*</span>
                  </label>
                  <select
                    id="edit-status-select"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'draft' | 'active' | 'completed' })}
                    className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    aria-label="选择行程状态"
                  >
                    <option value="draft">草稿</option>
                    <option value="active">进行中</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCloseEditModal}
                  disabled={isSavingEdit}
                  className="flex-1 px-4 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingEdit ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      保存中...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      保存
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 模态框背景点击关闭 */}
      {showDeleteModal && (
        <div 
          onClick={handleCancelDelete}
          className="fixed inset-0 z-40"
        />
      )}
      {showShareModal && (
        <div 
          onClick={handleCloseShareModal}
          className="fixed inset-0 z-40"
        />
      )}
      {showEditModal && (
        <div 
          onClick={handleCloseEditModal}
          className="fixed inset-0 z-40"
        />
      )}
    </div>
  );
};

export default MyTripsPage;

