import apiClient from './apiClient';

export interface StoreSettings {
  id?: string;
  storeName: string;
  branchName: string;
  currency: string;
  storePhone: string;
  storeEmail: string;
  storeAddress: string;
  tin: string;
  vrn: string;
  vatRate: string;
  vfdServerUrl: string;
  vfdDeviceId: string;
  receiptPaperWidth: '80mm' | '58mm';
  receiptHeaderTagline: string;
  receiptFooter: string;
  updatedAt?: string;
}

export const settingsService = {
  getSettings: async (): Promise<StoreSettings> => {
    const res = await apiClient.get<{ success: boolean; data: StoreSettings }>('/settings');
    return res.data.data;
  },

  updateSettings: async (data: Partial<StoreSettings>): Promise<StoreSettings> => {
    const res = await apiClient.put<{ success: boolean; message: string; data: StoreSettings }>('/settings', data);
    return res.data.data;
  },

  resetSettings: async (): Promise<StoreSettings> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: StoreSettings }>('/settings/reset');
    return res.data.data;
  },
};

export default settingsService;
