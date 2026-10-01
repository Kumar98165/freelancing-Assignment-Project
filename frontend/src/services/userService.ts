import apiClient from './apiClient';
import type { AuthUser } from './authService';

export interface CreateUserData {
  fullName: string;
  username: string;
  phone?: string;
  password: string;
  role: 'ADMIN' | 'CASHIER';
  status?: 'Active' | 'Inactive';
}

export interface UpdateUserData {
  fullName?: string;
  username?: string;
  phone?: string;
  password?: string;
  role?: 'ADMIN' | 'CASHIER';
  status?: 'Active' | 'Inactive';
}

export interface UserStats {
  totalUsers: number;
  totalUsersCompact?: string;
  activeCashiers: number;
  totalCashiers: number;
  adminAccounts: number;
  activeUsers: number;
  inactiveUsers: number;
  healthPercentage: number;
}

export const userService = {
  async getUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
    dateFilter?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    per_page?: number;
  }): Promise<{ users: AuthUser[]; total: number; totalPages: number; page: number }> {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        users: AuthUser[];
        total?: number;
        page?: number;
        per_page?: number;
        total_pages?: number;
      };
    }>('/users', { params });
    const users = res.data.data.users || [];
    const total = res.data.data.total ?? users.length;
    const totalPages = res.data.data.total_pages ?? 1;
    const page = res.data.data.page ?? 1;
    return { users, total, totalPages, page };
  },

  async getAllUsers(): Promise<AuthUser[]> {
    const res = await apiClient.get<{ success: boolean; data: { users: AuthUser[] } }>('/users');
    return res.data.data.users || [];
  },

  async getUserStats(params?: {
    search?: string;
    role?: string;
    status?: string;
    dateFilter?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<UserStats> {
    const res = await apiClient.get<{ success: boolean; data: UserStats }>('/users/stats', { params });
    return res.data.data;
  },


  async getUserById(id: string) {
    const res = await apiClient.get<{ success: boolean; data: { user: AuthUser } }>(`/users/${id}`);
    return res.data.data.user;
  },

  async createUser(data: CreateUserData) {
    const res = await apiClient.post<{ success: boolean; message: string; data: { user: AuthUser } }>('/users', data);
    return res.data.data.user;
  },

  async updateUser(id: string, data: UpdateUserData) {
    const res = await apiClient.put<{ success: boolean; message: string; data: { user: AuthUser } }>(`/users/${id}`, data);
    return res.data.data.user;
  },

  async toggleUserStatus(id: string) {
    const res = await apiClient.patch<{ success: boolean; message: string; data: { user: AuthUser } }>(`/users/${id}/toggle-status`);
    return res.data.data.user;
  },

  async deleteUser(id: string) {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/users/${id}`);
    return res.data;
  }
};

export default userService;
