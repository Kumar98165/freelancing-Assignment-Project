export type StockStatus = 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';

export type ExpiryStatus = 'NOT APPLICABLE' | 'VALID' | 'EXPIRING SOON' | 'EXPIRED';

export type TransactionType =
  | 'PURCHASE_RECEIPT'
  | 'SALE'
  | 'CUSTOMER_RETURN'
  | 'DAMAGE'
  | 'EXPIRY'
  | 'STOCK_ADJUSTMENT'
  | 'STOCK_COUNT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'OPENING_BALANCE';

export type AdjustmentReason =
  | 'PHYSICAL_COUNT'
  | 'DAMAGE'
  | 'EXPIRED'
  | 'LOST'
  | 'FOUND'
  | 'RETURN'
  | 'OTHER';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  isMain: boolean;
  status: 'Active' | 'Inactive';
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  paymentTerms: string;
  status: 'Active' | 'Inactive';
}

export interface InventoryBatch {
  id: string;
  batchNumber: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  unitCost: number;
  manufacturingDate?: string;
  expiryDate?: string;
  daysRemaining?: number;
  expiryStatus: ExpiryStatus;
  receivedDate: string;
  supplierInvoice?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  category: string;
  warehouseId: string;
  warehouseName: string;
  currentStock: number;
  availableStock: number;
  reservedStock: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  unit: string;
  buyingPrice: number; // Cost Price (TZS)
  sellingPrice: number; // Retail Price (TZS)
  stockCostValue: number; // currentStock * buyingPrice
  retailValue: number; // currentStock * sellingPrice
  stockStatus: StockStatus;
  primaryBatchNumber?: string;
  expiryDate?: string;
  expiryStatus: ExpiryStatus;
  daysRemaining?: number;
  lastStockCountDate?: string;
  lastUpdated: string;
  supplierId?: string;
  supplierName?: string;
  batches: InventoryBatch[];
}

export interface StockTransaction {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  batchNumber?: string;
  type: TransactionType;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCost: number;
  totalCost: number;
  referenceNumber: string;
  supplierOrCustomer?: string;
  reason?: string;
  notes?: string;
  performedBy: string;
  userRole: string;
  createdAt: string;
}

export interface ReceiveStockPayload {
  productId: string;
  warehouseId: string;
  supplierId: string;
  quantity: number;
  unitCost: number;
  batchNumber?: string;
  poNumber?: string;
  supplierInvoiceNumber?: string;
  receivedDate: string;
  manufacturingDate?: string;
  expiryDate?: string;
  notes?: string;
}

export interface AdjustStockPayload {
  inventoryId: string;
  warehouseId: string;
  physicalCount: number;
  reason: AdjustmentReason;
  notes: string;
  batchNumber?: string;
  approvedBy?: string;
}

export interface InventoryKPIs {
  totalStockCostValue: number;
  totalRetailValue: number;
  totalStockUnits: number;
  totalSKUs: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
}

export interface InventoryFilters {
  search?: string;
  category?: string;
  warehouseId?: string;
  stockStatus?: string;
  supplierId?: string;
  expiryStatus?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
