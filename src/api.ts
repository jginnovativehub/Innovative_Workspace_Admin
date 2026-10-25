import { User, Project, SystemConfig, AuditEvent, MongoStatus, NotificationItem } from './types';

const BASE_URL = '/api/v1';

function getHeaders() {
  const token = localStorage.getItem('jg_admin_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const adminApi = {
  // Authentication
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (!['ADMIN', 'CEO', 'COO'].includes(res.user.role)) {
      throw new Error('Access denied: Executive management or administrator authority required.');
    }
    localStorage.setItem('jg_admin_token', res.token);
    return res;
  },

  getCurrentUser: async (): Promise<User> => {
    const user = await request<User>('/auth/me');
    if (!['ADMIN', 'CEO', 'COO'].includes(user.role)) {
      throw new Error('Unauthorized role');
    }
    return user;
  },

  logout: () => {
    localStorage.removeItem('jg_admin_token');
  },

  // User Lifecycle Management
  getUsers: async (): Promise<User[]> => {
    return request<User[]>('/users');
  },

  createUser: async (userData: any): Promise<User> => {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  updateUser: async (id: number, data: any): Promise<User> => {
    return request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  deleteUser: async (id: number): Promise<{ message: string; deletedId: number }> => {
    return request<{ message: string; deletedId: number }>(`/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Project Governance
  getProjects: async (): Promise<Project[]> => {
    return request<Project[]>('/projects');
  },

  createProject: async (data: any): Promise<Project> => {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateProject: async (id: number | string, data: any): Promise<Project> => {
    return request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  archiveProject: async (id: number | string): Promise<Project> => {
    return request<Project>(`/projects/${id}/archive`, {
      method: 'POST'
    });
  },

  restoreProject: async (id: number | string): Promise<Project> => {
    return request<Project>(`/projects/${id}/restore`, {
      method: 'POST'
    });
  },

  deleteProject: async (id: number | string, reason: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/projects/${id}?reason=${encodeURIComponent(reason)}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason })
    });
  },

  createMilestone: async (projectId: number | string, data: any): Promise<any> => {
    return request<any>(`/projects/${projectId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // System Configuration
  getConfig: async (): Promise<SystemConfig> => {
    return request<SystemConfig>('/config');
  },

  updateConfig: async (data: Partial<SystemConfig>): Promise<SystemConfig> => {
    return request<SystemConfig>('/config', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Audit Logs
  getAuditEvents: async (): Promise<AuditEvent[]> => {
    return request<AuditEvent[]>('/audit');
  },

  // MongoDB Atlas Engine
  getMongoStatus: async (): Promise<MongoStatus> => {
    return request<MongoStatus>('/system/mongodb-status');
  },

  saveMongoUri: async (uri: string): Promise<MongoStatus> => {
    return request<MongoStatus>('/system/mongodb-uri', {
      method: 'POST',
      body: JSON.stringify({ uri })
    });
  },

  // Notifications
  getNotifications: async (): Promise<NotificationItem[]> => {
    return request<NotificationItem[]>('/notifications');
  },

  markNotificationRead: async (id: number): Promise<void> => {
    await request(`/notifications/${id}/read`, { method: 'POST' });
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await request('/notifications/read-all', { method: 'POST' });
  },

  createNotificationStream: (onNotification: (notif: NotificationItem) => void) => {
    const token = localStorage.getItem('jg_admin_token');
    if (!token) return () => {};

    const url = `${BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener('notification', (e: MessageEvent) => {
      try {
        const notif = JSON.parse(e.data);
        onNotification(notif);
      } catch (err) {
        console.error('[Admin SSE] Error parsing notification:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn('[Admin SSE] Connection warning, browser will auto-reconnect:', err);
    };

    return () => {
      eventSource.close();
    };
  }
};

