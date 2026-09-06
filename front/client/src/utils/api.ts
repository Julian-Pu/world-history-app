/**
 * 统一的后端 API 服务层
 * 所有与后端交互的请求都通过这里
 */

const API_BASE = '/api';

// 获取认证 token
function getToken(): string | null {
  try {
    return localStorage.getItem('history-app-token');
  } catch {
    return null;
  }
}

// 统一请求封装
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || `请求失败: ${response.status}`);
  }

  return data.data ?? data;
}

// ============ 认证 API ============
export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (username: string, email: string, password: string) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  getMe: () => request<any>('/auth/me'),

  updateMe: (data: any) =>
    request<any>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ============ 笔记 API ============
export const notesApi = {
  list: async () => {
    const res = await request<any>('/notes');
    return res?.list || [];
  },

  create: (note: {
    content_type?: string;
    content_id?: string;
    title: string;
    content: string;
    tags?: string[];
  }) =>
    request<any>('/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    }),

  update: (id: string, data: any) =>
    request<any>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<any>(`/notes/${id}`, {
      method: 'DELETE',
    }),
};

// ============ 收藏 API ============
export const favoritesApi = {
  list: () => request<any[]>('/favorites'),

  toggle: async (content_type: string, content_id: string) => {
    // 先获取列表判断是否已收藏
    const list = await request<any[]>('/favorites');
    const exists = list.some(
      (f: any) => f.content_type === content_type && f.content_id === content_id,
    );
    if (exists) {
      // 取消收藏
      return request<any>(`/favorites/by-content/${content_type}/${content_id}`, {
        method: 'DELETE',
      });
    } else {
      // 添加收藏
      return request<any>('/favorites', {
        method: 'POST',
        body: JSON.stringify({ content_type, content_id }),
      });
    }
  },

  add: (content_type: string, content_id: string) =>
    request<any>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ content_type, content_id }),
    }),

  remove: (content_type: string, content_id: string) =>
    request<any>(`/favorites/by-content/${content_type}/${content_id}`, {
      method: 'DELETE',
    }),
};

// ============ 学习进度 API ============
export const progressApi = {
  list: (params?: { content_type?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.content_type) query.set('content_type', params.content_type);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return request<any[]>(`/progress${qs ? `?${qs}` : ''}`);
  },

  update: (data: {
    content_type: string;
    content_id: string;
    status?: 'unread' | 'reading' | 'completed';
    level?: string;
    last_position?: number;
    time_spent?: number;
  }) =>
    request<any>('/progress/update', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  byPeriod: () => request<any[]>('/progress/by-period'),
};

// ============ 测验 API ============
export const quizzesApi = {
  list: () => request<any[]>('/quizzes'),

  submit: (record: {
    quiz_id?: string;
    score: number;
    total: number;
    correct: number;
    accuracy: number;
    time_spent?: number;
    answers?: any[];
  }) =>
    request<any>('/quizzes/submit', {
      method: 'POST',
      body: JSON.stringify(record),
    }),

  records: async () => {
    const res = await request<any>('/quizzes/records');
    return res?.list || [];
  },
};

// ============ 成就 API ============
export const achievementsApi = {
  list: async () => {
    const res = await request<any>('/achievements');
    // 返回所有徽章，筛选已解锁的
    const badges = res?.badges || [];
    return badges.filter((b: any) => b.unlocked);
  },
  recent: () => request<any[]>('/achievements/recent'),
};

// ============ 学习时长 API ============
export const studySessionsApi = {
  list: async () => {
    // 后端返回 { list: [...], pagination: {...} }，需要提取 list
    const res = await request<any>('/study-sessions?limit=1000');
    return res?.list || [];
  },

  create: async (data: {
    duration_minutes: number;
    session_type?: string;
    content_id?: string;
  }) => {
    // 后端使用 start/end 模式，先开始再结束
    const start = await request<any>('/study-sessions/start', {
      method: 'POST',
      body: JSON.stringify({
        session_type: data.session_type || 'study',
        content_id: data.content_id,
      }),
    });
    // 注意：后端返回的是 session_id，不是 id
    const sessionId = start?.session_id;
    if (sessionId) {
      // 等待一小段时间后结束
      await new Promise(r => setTimeout(r, 100));
      // 注意：后端 duration 单位是秒，前端传入的是分钟，需要转换
      const durationSeconds = Math.round(data.duration_minutes * 60);
      await request<any>(`/study-sessions/${sessionId}/end`, {
        method: 'POST',
        body: JSON.stringify({ duration: durationSeconds }),
      }).catch(() => {});
    }
    return start;
  },

  stats: () => request<any>('/study-sessions/active/current'),
};

// ============ 数据同步 API ============
export const syncApi = {
  status: () => request<any>('/sync/status'),

  push: (changes: any[], last_sync_at?: string) =>
    request<any>('/sync/push', {
      method: 'POST',
      body: JSON.stringify({ changes, last_sync_at }),
    }),

  pull: (last_sync_at?: string) =>
    request<any>('/sync/pull', {
      method: 'POST',
      body: JSON.stringify({ last_sync_at }),
    }),

  full: (local_data: any) =>
    request<any>('/sync/full', {
      method: 'POST',
      body: JSON.stringify({ local_data }),
    }),
};

// ============ 统计 API ============
export const statsApi = {
  overview: () => request<any>('/stats/overview'),
  daily: (days?: number) =>
    request<any>(`/stats/daily${days ? `?days=${days}` : ''}`),
};

export default {
  auth: authApi,
  notes: notesApi,
  favorites: favoritesApi,
  progress: progressApi,
  quizzes: quizzesApi,
  achievements: achievementsApi,
  studySessions: studySessionsApi,
  sync: syncApi,
  stats: statsApi,
};
