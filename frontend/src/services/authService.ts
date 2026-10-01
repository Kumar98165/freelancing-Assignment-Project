import apiClient from './apiClient';

export interface AuthUser {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  role: 'ADMIN' | 'CASHIER';
  status: 'Active' | 'Inactive';
  createdDate?: string;
  lastActive?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken?: string;
    user: AuthUser;
  };
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/auth/login', { username, password });
    if (res.data.success && res.data.data) {
      localStorage.setItem('tz_pos_token', res.data.data.token);
      localStorage.setItem('tz_pos_user', JSON.stringify(res.data.data.user));
    }
    return res.data;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const res = await apiClient.get<{ success: boolean; data: { user: AuthUser } }>('/auth/me');
      if (res.data.success && res.data.data?.user) {
        localStorage.setItem('tz_pos_user', JSON.stringify(res.data.data.user));
        return res.data.data.user;
      }
    } catch {
      return null;
    }
    return null;
  },

  getStoredUser(): AuthUser | null {
    const raw = localStorage.getItem('tz_pos_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem('tz_pos_token');
    localStorage.removeItem('tz_pos_user');
  }
};

export default authService;
