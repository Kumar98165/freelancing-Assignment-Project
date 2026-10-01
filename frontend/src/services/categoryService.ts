import apiClient from './apiClient';

export interface Category {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  updatedDate?: string;
  productCount: number;
}

export interface CategoryStats {
  totalCategories: number;
  totalCategoriesCompact?: string;
  activeCategories: number;
  activeCategoriesCompact?: string;
  linkedProducts: number;
  linkedProductsCompact?: string;
  topCategory: {
    name: string;
    productCount: number;
    productCountCompact?: string;
  };
}

export interface CategoryQueryParams {
  search?: string;
  status?: string;
  dateFilter?: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  per_page?: number;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  status?: 'Active' | 'Inactive';
}

export const categoryService = {
  getCategories: async (params?: CategoryQueryParams): Promise<{
    categories: Category[];
    total: number;
    totalPages: number;
    page: number;
  }> => {
    const res = await apiClient.get<{
      success: boolean;
      data: Category[];
      total?: number;
      total_pages?: number;
      page?: number;
    }>('/categories', {
      params,
    });
    const categories = res.data.data || [];
    const total = res.data.total ?? categories.length;
    const totalPages = res.data.total_pages ?? 1;
    const page = res.data.page ?? 1;
    return { categories, total, totalPages, page };
  },

  getAllCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<{ success: boolean; data: Category[] }>('/categories', {
      params: { limit: 1000 }
    });
    return res.data.data || [];
  },

  getCategoryStats: async (params?: CategoryQueryParams): Promise<CategoryStats> => {
    const res = await apiClient.get<{ success: boolean; data: CategoryStats }>('/categories/stats', {
      params
    });
    return res.data.data;
  },

  getCategoryById: async (id: string): Promise<Category> => {
    const res = await apiClient.get<{ success: boolean; data: Category }>(`/categories/${id}`);
    return res.data.data;
  },

  createCategory: async (data: CreateCategoryData): Promise<Category> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Category }>(
      '/categories',
      data
    );
    return res.data.data;
  },

  updateCategory: async (id: string, data: Partial<CreateCategoryData>): Promise<Category> => {
    const res = await apiClient.put<{ success: boolean; message: string; data: Category }>(
      `/categories/${id}`,
      data
    );
    return res.data.data;
  },

  toggleCategoryStatus: async (id: string): Promise<Category> => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: Category }>(
      `/categories/${id}/toggle-status`
    );
    return res.data.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
