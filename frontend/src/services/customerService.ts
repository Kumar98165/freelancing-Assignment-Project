import apiClient from './apiClient';

export interface PurchaseItemDetail {
  name: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CustomerPurchaseItem {
  id: string;
  saleNumber: string;
  date: string;
  items: string;
  itemList?: PurchaseItemDetail[];
  total: number;
  paymentMethod: string;
}

export interface CustomerRecord {
  id: string;
  customerId?: string;
  name: string;
  phone: string;
  email?: string;
  tier: 'VIP' | 'REGULAR' | 'NEW';
  totalPurchases: number;
  lastPurchase: string;
  createdDate?: string;
  purchases: CustomerPurchaseItem[];
}

export interface CustomerStats {
  totalCustomers: number;
  customerRevenue: number;
  customerRevenueCompact?: string;
  avgLifetimeValue: number;
  avgLifetimeValueCompact?: string;
  vipCount: number;
  topSpender: string;
}

export interface CreateCustomerData {
  name: string;
  phone: string;
  email?: string;
}

export interface UpdateCustomerData {
  name?: string;
  phone?: string;
  email?: string;
}

export const customerService = {
  async getCustomers(params?: {
    search?: string;
    tier?: string;
    sortBy?: string;
    dateFilter?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    per_page?: number;
  }): Promise<{ customers: CustomerRecord[]; total: number; totalPages: number; page: number }> {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        customers: CustomerRecord[];
        total?: number;
        page?: number;
        per_page?: number;
        total_pages?: number;
      };
    }>('/customers', { params });
    const customers = res.data.data.customers || [];
    const total = res.data.data.total ?? customers.length;
    const totalPages = res.data.data.total_pages ?? 1;
    const page = res.data.data.page ?? 1;
    return { customers, total, totalPages, page };
  },

  async getAllCustomers(): Promise<CustomerRecord[]> {
    const res = await apiClient.get<{ success: boolean; data: { customers: CustomerRecord[] } }>('/customers');
    return res.data.data.customers || [];
  },

  async getCustomerStats(params?: {
    search?: string;
    tier?: string;
    dateFilter?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CustomerStats> {
    const res = await apiClient.get<{ success: boolean; data: CustomerStats }>('/customers/stats', { params });
    return res.data.data;
  },


  async getCustomerById(id: string): Promise<CustomerRecord> {
    const res = await apiClient.get<{ success: boolean; data: { customer: CustomerRecord } }>(`/customers/${id}`);
    return res.data.data.customer;
  },

  async getCustomerProfile(id: string): Promise<{ customer: CustomerRecord; kpi: { totalOrders: number; totalOrdersLabel: string; totalSpent: number; avgOrderValue: number; lastPurchase: string } }> {
    const res = await apiClient.get<{ success: boolean; data: { customer: CustomerRecord; kpi: any } }>(`/customers/${id}/profile`);
    return res.data.data;
  },

  async createCustomer(data: CreateCustomerData): Promise<CustomerRecord> {
    const res = await apiClient.post<{ success: boolean; message: string; data: { customer: CustomerRecord } }>('/customers', data);
    return res.data.data.customer;
  },

  async updateCustomer(id: string, data: UpdateCustomerData): Promise<CustomerRecord> {
    const res = await apiClient.put<{ success: boolean; message: string; data: { customer: CustomerRecord } }>(`/customers/${id}`, data);
    return res.data.data.customer;
  },

  async deleteCustomer(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/customers/${id}`);
    return res.data;
  }
};

export default customerService;
