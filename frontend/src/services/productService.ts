import apiClient from './apiClient';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  barcode: string;
  barcodeType: 'MANUFACTURER' | 'INTERNAL';
  buyingPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  tax: string;
  status: 'Active' | 'Inactive';
  expiryDate?: string;
  createdDate: string;
  updatedDate: string;
}

export interface ProductStats {
  totalProducts: number;
  totalProductsCompact?: string;
  activeProducts: number;
  activeProductsCompact?: string;
  lowStockCount: number;
  totalInventoryValue: number;
  totalInventoryValueCompact?: string;
  totalStockUnits?: number;
  totalStockUnitsCompact?: string;
  categories: string[];
}

export interface ProductQueryParams {
  search?: string;
  category?: string;
  status?: string;
  dateFilter?: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  per_page?: number;
}

export interface CreateProductData {
  name: string;
  sku: string;
  category: string;
  barcode: string;
  barcodeType?: 'MANUFACTURER' | 'INTERNAL';
  buyingPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  tax?: string;
  status?: 'Active' | 'Inactive';
  expiryDate?: string;
}

export const productService = {
  getProducts: async (params?: ProductQueryParams): Promise<{
    products: Product[];
    total: number;
    totalPages: number;
    page: number;
  }> => {
    const res = await apiClient.get<{
      success: boolean;
      data: Product[];
      total?: number;
      total_pages?: number;
      page?: number;
    }>('/products', {
      params,
    });
    const products = res.data.data || [];
    const total = res.data.total ?? products.length;
    const totalPages = res.data.total_pages ?? 1;
    const page = res.data.page ?? 1;
    return { products, total, totalPages, page };
  },

  getAllProducts: async (): Promise<Product[]> => {
    const res = await apiClient.get<{ success: boolean; data: Product[] }>('/products', {
      params: { limit: 1000 }
    });
    return res.data.data || [];
  },

  getProductStats: async (params?: ProductQueryParams): Promise<ProductStats> => {
    const res = await apiClient.get<{ success: boolean; data: ProductStats }>('/products/stats', {
      params
    });
    return res.data.data;
  },

  getCategories: async (): Promise<string[]> => {
    const res = await apiClient.get<{ success: boolean; data: string[] }>('/products/categories');
    return res.data.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const res = await apiClient.get<{ success: boolean; data: Product }>(`/products/${id}`);
    return res.data.data;
  },

  createProduct: async (data: CreateProductData): Promise<Product> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Product }>(
      '/products',
      data
    );
    return res.data.data;
  },

  updateProduct: async (id: string, data: Partial<CreateProductData>): Promise<Product> => {
    const res = await apiClient.put<{ success: boolean; message: string; data: Product }>(
      `/products/${id}`,
      data
    );
    return res.data.data;
  },

  toggleProductStatus: async (id: string): Promise<Product> => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: Product }>(
      `/products/${id}/toggle-status`
    );
    return res.data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
