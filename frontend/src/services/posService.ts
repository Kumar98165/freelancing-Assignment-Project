import apiClient from './apiClient';

export interface POSProductItem {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number; // TZS
  buyingPrice?: number;
  stock: number;
  minStock: number;
  unit?: string;
  imageIcon: string;
}

export interface CheckoutPayload {
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
  }[];
  paymentMethod: 'Cash' | 'Mobile Money' | 'Card / Bank' | string;
  provider?: string;
  amountPaid?: number;
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  cashierName?: string;
  paymentRef?: string;
}

export const posService = {
  async getPOSProducts(params?: { search?: string; category?: string }): Promise<POSProductItem[]> {
    const res = await apiClient.get('/pos/products', { params });
    return res.data.products || [];
  },

  async processCheckout(payload: CheckoutPayload): Promise<any> {
    const res = await apiClient.post('/pos/checkout', payload);
    return res.data;
  },

  async getSales(params?: any): Promise<any> {
    const res = await apiClient.get('/sales', { params });
    return res.data;
  },

  async getSaleDetails(saleId: string): Promise<any> {
    const res = await apiClient.get(`/sales/${saleId}`);
    return res.data.sale;
  }
};

export default posService;
