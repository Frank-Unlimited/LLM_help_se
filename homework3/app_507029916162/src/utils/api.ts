// API工具类 - 统一管理后端接口调用

// API基础URL配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 请求类型定义
export interface TripGenerationRequest {
  requirementsText: string;
  preferences: string[];
  travelType: string[];
  transportPreference: string[];
  accommodationType: string[];
  currency?: string;
  userId?: string;
}

export interface TripGenerationResponse {
  tripId: string;
  status: string;
  message?: string;
}

export interface TripDetail {
  tripId: string;
  tripName: string;
  departure?: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  numTravellers?: number;
  budget: {
    total: number;
    currency: string;
    spent: number;
    remaining: number;
  };
  budgetBreakdown: Array<{
    category: string;
    allocated: number;
    spent: number;
  }>;
  itinerary: Array<{
    day: number;
    date: string;
    title: string;
      activities: Array<{
        id: string;
        time: string;
        title: string;
        category: string;
        location: string;
        description: string;
        image?: string;
        estimatedCost: number;
        nextLocation?: string;
      }>;
  }>;
  expenses: Array<{
    expenseId: string;
    amount: number;
    category: string;
    date: string;
    description: string;
  }>;
  notes?: string[];
  imageUrl?: string;
  status: string;
}

// 通用请求函数
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // 如果有token，自动添加（后续实现登录后可用）
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // 如果响应不是JSON格式，使用空对象
        errorData = { message: `请求失败: ${response.status} ${response.statusText}` };
      }
      
      const errorMessage = errorData.detail || errorData.message || `请求失败: ${response.status}`;
      const error = new Error(errorMessage) as any;
      error.status = response.status;
      error.response = response;
      console.error(`API请求失败 [${endpoint}]:`, {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url
      });
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    // 如果是网络错误或其他类型的错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`API网络错误 [${endpoint}]:`, error);
      const networkError = new Error('网络连接失败，请检查网络连接或稍后重试') as any;
      networkError.isNetworkError = true;
      throw networkError;
    }
    
    // 其他错误直接抛出
    console.error(`API请求失败 [${endpoint}]:`, error);
    throw error;
  }
}

// API接口封装
export const api = {
  // 生成行程
  generateTrip: async (
    data: TripGenerationRequest
  ): Promise<TripGenerationResponse> => {
    return fetchAPI<TripGenerationResponse>('/trips/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // 获取行程详情
  getTripDetail: async (tripId: string): Promise<TripDetail> => {
    return fetchAPI<TripDetail>(`/trips/${tripId}`, {
      method: 'GET',
    });
  },
  
  // 更新行程
  updateTrip: async (tripId: string, data: Partial<TripDetail>): Promise<TripDetail> => {
    return fetchAPI<TripDetail>(`/trips/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  // 删除行程
  deleteTrip: async (tripId: string): Promise<{ success: boolean }> => {
    return fetchAPI<{ success: boolean }>(`/trips/${tripId}`, {
      method: 'DELETE',
    });
  },
  
  // 记录开销
  addExpense: async (
    tripId: string,
    expense: {
      amount: number;
      category: string;
      date: string;
      description?: string;
    }
  ): Promise<{ expenseId: string }> => {
    return fetchAPI<{ expenseId: string }>(`/trips/${tripId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },

  // 更新开销
  updateExpense: async (
    tripId: string,
    expenseId: string,
    expense: {
      amount: number;
      category: string;
      date: string;
      description?: string;
    }
  ): Promise<{ expenseId: string }> => {
    return fetchAPI<{ expenseId: string }>(`/trips/${tripId}/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  },

  // 删除开销
  deleteExpense: async (
    tripId: string,
    expenseId: string
  ): Promise<{ success: boolean }> => {
    return fetchAPI<{ success: boolean }>(`/trips/${tripId}/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  },

  // 解析语音识别结果为开销信息
  parseExpenseVoice: async (
    voiceText: string
  ): Promise<{
    amount: number;
    category: string;
    date: string;
    description: string;
  }> => {
    return fetchAPI<{
      amount: number;
      category: string;
      date: string;
      description: string;
    }>('/expenses/parse-voice', {
      method: 'POST',
      body: JSON.stringify({ voiceText }),
    });
  },
  
  // 获取用户所有行程
  getUserTrips: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    trips: Array<Partial<TripDetail>>;
    total: number;
    page: number;
    limit: number;
  }> => {
    const queryString = params 
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return fetchAPI<any>(`/trips${queryString}`, {
      method: 'GET',
    });
  },
  
  // ============ Authentication APIs ============
  
  // 发送验证码
  sendVerifyCode: async (phone: string): Promise<{ success: boolean; message: string }> => {
    return fetchAPI('/auth/send-verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },
  
  // 注册
  register: async (data: {
    phone: string;
    email: string;
    password: string;
    verifyCode: string;
  }): Promise<{
    success: boolean;
    message: string;
    token?: string;
    userId?: string;
    username?: string;
  }> => {
    return fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // 登录
  login: async (data: {
    username: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    token?: string;
    userId?: string;
    username?: string;
  }> => {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // 忘记密码
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    return fetchAPI('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  
  // ============ User Profile APIs ============
  
  // 获取用户信息
  getUserProfile: async (userId: string): Promise<{
    userId: string;
    phone: string;
    email: string;
    nickname?: string;
    gender?: string;
    avatar?: string;
    createdAt?: string;
    lastLoginAt?: string;
  }> => {
    return fetchAPI(`/user/profile?userId=${userId}`, {
      method: 'GET',
    });
  },
  
  // 更新用户信息
  updateUserProfile: async (
    userId: string,
    data: {
      nickname?: string;
      email?: string;
      gender?: string;
      avatar?: string;
    }
  ): Promise<{
    userId: string;
    phone: string;
    email: string;
    nickname?: string;
    gender?: string;
    avatar?: string;
    createdAt?: string;
    lastLoginAt?: string;
  }> => {
    return fetchAPI(`/user/profile?userId=${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  // 修改密码
  changePassword: async (
    userId: string,
    data: {
      currentPassword: string;
      newPassword: string;
    }
  ): Promise<{ success: boolean; message: string }> => {
    return fetchAPI(`/user/change-password?userId=${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

