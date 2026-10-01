import apiClient from './apiClient';

export interface InventoryItem {
  id: string;
  product: string;
  sku: string;
  barcode: string;
  category: string;
  currentStock: number;
  minStock: number;
  buyingPrice: number;
  sellingPrice: number;
  unit: string;
  expiryDate: string;
  lastUpdated: string;
}

export interface InventoryStats {
  totalStockValue: number;
  totalStockValueCompact?: string;
  totalStockUnits: number;
  totalStockUnitsCompact?: string;
  lowStockCount: number;
  outOfStockCount: number;
  inStockCount: number;
  totalProducts: number;
}

export interface ReceiveStockData {
  productId: string;
  quantity: number;
  unitCost?: number;
  sellingPrice?: number;
  barcode?: string;
  referenceNo?: string;
  poRef?: string;
  expiryDate?: string;
  batchExpiry?: string;
  notes?: string;
}

export interface AdjustStockData {
  productId: string;
  newStock: number;
  reason: 'PHYSICAL_COUNT' | 'DAMAGE' | 'EXPIRED' | 'RETURN' | 'OTHER';
  expiryDate?: string;
  notes?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  movementType: 'RECEIVE' | 'ADJUSTMENT' | 'SALE' | 'RETURN';
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  referenceNo?: string;
  batchExpiry?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export const inventoryService = {
  getInventory: async (params?: {
    search?: string;
    category?: string;
    status?: string;
    dateFilter?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    per_page?: number;
  }): Promise<{ items: InventoryItem[]; total: number; totalPages: number; page: number }> => {
    const response = await apiClient.get<{
      success: boolean;
      data: InventoryItem[];
      total?: number;
      page?: number;
      per_page?: number;
      total_pages?: number;
    }>('/inventory', { params });
    const items = response.data.data || [];
    const total = response.data.total ?? items.length;
    const totalPages = response.data.total_pages ?? 1;
    const page = response.data.page ?? 1;
    return { items, total, totalPages, page };
  },

  getAllInventory: async (): Promise<InventoryItem[]> => {
    const response = await apiClient.get<{ success: boolean; data: InventoryItem[] }>('/inventory');
    return response.data.data || [];
  },

  getInventoryStats: async (params?: {
    search?: string;
    category?: string;
    status?: string;
    dateFilter?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<InventoryStats> => {
    const response = await apiClient.get<{ success: boolean; data: InventoryStats }>('/inventory/stats', { params });
    return response.data.data;
  },

  receiveStock: async (data: ReceiveStockData): Promise<{ success: boolean; message: string; data: InventoryItem }> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: InventoryItem }>('/inventory/receive', data);
    return response.data;
  },

  adjustStock: async (data: AdjustStockData): Promise<{ success: boolean; message: string; data: InventoryItem }> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: InventoryItem }>('/inventory/adjust', data);
    return response.data;
  },

  getMovements: async (productId?: string): Promise<InventoryMovement[]> => {
    const response = await apiClient.get<{ success: boolean; data: InventoryMovement[] }>('/inventory/movements', {
      params: productId ? { productId } : undefined
    });
    return response.data.data;
  }
};
