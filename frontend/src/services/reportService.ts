import apiClient from './apiClient';

export type ReportPresetType = 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM' | 'ALL';

export interface ReportsSummaryResponse {
  success: boolean;
  preset?: string;
  salesKPIs: {
    totalPeriodRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    peakSalesDay: string;
    peakBadge: string;
  };
  inventoryKPIs: {
    totalStockValuation: number;
    totalActiveSKUs: number;
    inStockHealthPct: number;
    healthySKUs: number;
    topValuedCategory: string;
    topCategoryBadge: string;
  };
  lowStockKPIs: {
    criticalOutOfStockCount: number;
    criticalOutOfStockName: string;
    lowStockWarningsCount: number;
    lowStockNames: string;
    restockCostNeeded: number;
    stockHealthIndex: number;
    attentionSKUsCount: number;
  };
  paymentKPIs: {
    cashCollectionsVal: number;
    cashTxnCount: number;
    mobileMoneyVal: number;
    mobileTxnCount: number;
    cardBankVal: number;
    cardTxnCount: number;
    totalChannelVolume: number;
    totalTxnCount: number;
  };
  fiscalKPIs: {
    syncedReceiptsCount: number;
    pendingReceiptsCount: number;
    vatTaxCollected: number;
    complianceSyncRate: number;
    syncedRatio: string;
  };
  salesTrend: Array<{ date: string; revenue: number; orders: number }>;
  categoryValuation: Array<{ category: string; value: number; items: number }>;
  paymentPieData: Array<{ name: string; value: number; count: number; color: string }>;
  fiscalTrend?: Array<{ date: string; synced: number; pending: number; vat: number }>;
  salesTable: any[];
  inventoryTable: any[];
  fiscalTable: any[];
}

export const reportService = {
  async getSummary(params?: {
    preset?: ReportPresetType;
    startDate?: string;
    endDate?: string;
  }): Promise<ReportsSummaryResponse> {
    const response = await apiClient.get<ReportsSummaryResponse>('/reports/summary', { params });
    return response.data;
  },
};

export default reportService;
