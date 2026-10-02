import apiClient from './apiClient';

export type DatePresetType = 'TODAY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM' | 'ALL';

export interface DashboardSummaryResponse {
  success: boolean;
  preset?: string;
  kpis: {
    todayTransactions: number;
    todaySales: number;
    customersServed: number;
    lowStockItems: number;
    totalProducts: number;
    totalCustomers: number;
  };
  paymentBreakdown: {
    cashTotal: number;
    cashPct: number;
    mobileTotal: number;
    mobilePct: number;
    cardTotal: number;
    cardPct: number;
    otherTotal: number;
    otherPct: number;
  };
  hourlySales: Array<{ time: string; sales: number }>;
  recentTransactions: Array<{
    id: string;
    time: string;
    items: string;
    customer: string;
    total: number;
    payment: string;
    color: string;
  }>;
}

export const dashboardService = {
  async getSummary(params?: {
    preset?: DatePresetType;
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardSummaryResponse> {
    const response = await apiClient.get<DashboardSummaryResponse>('/dashboard/summary', { params });
    return response.data;
  },
};

export default dashboardService;
