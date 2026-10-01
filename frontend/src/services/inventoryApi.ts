import axios from 'axios';
import type {
  InventoryItem,
  Warehouse,
  Supplier,
  StockTransaction,
  ReceiveStockPayload,
  AdjustStockPayload,
  InventoryKPIs,
  InventoryFilters
} from '../types/inventory';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT token to requests if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Seed Initial Data for Development and Offline Fallback
const mockWarehouses: Warehouse[] = [
  { id: 'wh-1', code: 'WH-MAIN', name: 'Main Central Warehouse', location: 'Mbezi Industrial Park, Dar es Salaam', isMain: true, status: 'Active' },
  { id: 'wh-2', code: 'WH-STORE-01', name: 'Kariakoo Retail Depot', location: 'Kariakoo Market St, Dar es Salaam', isMain: false, status: 'Active' },
  { id: 'wh-3', code: 'WH-STORE-02', name: 'Mlimani City Supermarket', location: 'Mlimani City Mall, Dar es Salaam', isMain: false, status: 'Active' }
];

const mockSuppliers: Supplier[] = [
  { id: 'sup-1', code: 'SUP-BAK', name: 'Bakhresa Group (Azam)', contactPerson: 'Said Salim', phone: '+255 22 211 0000', email: 'orders@bakhresa.com', paymentTerms: 'Net 30', status: 'Active' },
  { id: 'sup-2', code: 'SUP-KIL', name: 'Bonite Bottlers Ltd (Kilimanjaro)', contactPerson: 'Grace Minja', phone: '+255 27 275 4801', email: 'sales@bonite.co.tz', paymentTerms: 'Net 14', status: 'Active' },
  { id: 'sup-3', code: 'SUP-TNG', name: 'Tanga Fresh Ltd', contactPerson: 'Rashid Mushi', phone: '+255 27 264 4500', email: 'orders@tangafresh.co.tz', paymentTerms: 'Immediate / Cash', status: 'Active' },
  { id: 'sup-4', code: 'SUP-SER', name: 'Serengeti Breweries Ltd', contactPerson: 'Emmanuel Peter', phone: '+255 22 286 0000', email: 'distribution@sbl.co.tz', paymentTerms: 'Net 30', status: 'Active' },
  { id: 'sup-5', code: 'SUP-MET', name: 'METL Group (Mo Brands)', contactPerson: 'Hassan Dewji', phone: '+255 22 213 0000', email: 'supply@metl.net', paymentTerms: 'Net 45', status: 'Active' }
];

let mockInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    productId: 'prod-1',
    productName: 'Kilimanjaro Drinking Water (1.5L)',
    sku: 'BEV-KIL-15',
    barcode: '6201234567890',
    category: 'Beverages',
    warehouseId: 'wh-1',
    warehouseName: 'Main Central Warehouse',
    currentStock: 145,
    availableStock: 145,
    reservedStock: 0,
    minStock: 50,
    maxStock: 500,
    reorderLevel: 60,
    unit: 'Bottles',
    buyingPrice: 600,
    sellingPrice: 1000,
    stockCostValue: 87000,
    retailValue: 145000,
    stockStatus: 'IN STOCK',
    primaryBatchNumber: 'BAT-2024-KIL-04',
    expiryDate: '2027-06-30',
    expiryStatus: 'VALID',
    daysRemaining: 910,
    lastStockCountDate: '2024-12-15',
    lastUpdated: '2024-12-28',
    supplierId: 'sup-2',
    supplierName: 'Bonite Bottlers Ltd (Kilimanjaro)',
    batches: [
      {
        id: 'b-1',
        batchNumber: 'BAT-2024-KIL-04',
        warehouseId: 'wh-1',
        warehouseName: 'Main Central Warehouse',
        quantity: 145,
        unitCost: 600,
        manufacturingDate: '2024-11-01',
        expiryDate: '2027-06-30',
        daysRemaining: 910,
        expiryStatus: 'VALID',
        receivedDate: '2024-12-20',
        supplierInvoice: 'INV-BON-8921'
      }
    ]
  },
  {
    id: 'inv-2',
    productId: 'prod-2',
    productName: 'Azam Wheat Flour (2kg)',
    sku: 'GRO-AZA-02',
    barcode: '6201234567891',
    category: 'Groceries',
    warehouseId: 'wh-1',
    warehouseName: 'Main Central Warehouse',
    currentStock: 85,
    availableStock: 80,
    reservedStock: 5,
    minStock: 30,
    maxStock: 300,
    reorderLevel: 40,
    unit: 'Packs',
    buyingPrice: 2100,
    sellingPrice: 2800,
    stockCostValue: 178500,
    retailValue: 238000,
    stockStatus: 'IN STOCK',
    primaryBatchNumber: 'AZA-FL-109',
    expiryDate: '2026-10-15',
    expiryStatus: 'VALID',
    daysRemaining: 650,
    lastStockCountDate: '2024-12-20',
    lastUpdated: '2024-12-27',
    supplierId: 'sup-1',
    supplierName: 'Bakhresa Group (Azam)',
    batches: [
      {
        id: 'b-2',
        batchNumber: 'AZA-FL-109',
        warehouseId: 'wh-1',
        warehouseName: 'Main Central Warehouse',
        quantity: 85,
        unitCost: 2100,
        manufacturingDate: '2024-10-10',
        expiryDate: '2026-10-15',
        daysRemaining: 650,
        expiryStatus: 'VALID',
        receivedDate: '2024-12-22',
        supplierInvoice: 'INV-AZM-4491'
      }
    ]
  },
  {
    id: 'inv-3',
    productId: 'prod-3',
    productName: 'Serengeti Premium Lager (500ml)',
    sku: 'BEV-SER-01',
    barcode: '6209876543210',
    category: 'Beverages',
    warehouseId: 'wh-2',
    warehouseName: 'Kariakoo Retail Depot',
    currentStock: 12,
    availableStock: 12,
    reservedStock: 0,
    minStock: 40,
    maxStock: 250,
    reorderLevel: 45,
    unit: 'Bottles',
    buyingPrice: 1800,
    sellingPrice: 2500,
    stockCostValue: 21600,
    retailValue: 30000,
    stockStatus: 'LOW STOCK',
    primaryBatchNumber: 'SBL-LAG-204',
    expiryDate: '2026-12-31',
    expiryStatus: 'VALID',
    daysRemaining: 730,
    lastStockCountDate: '2024-12-10',
    lastUpdated: '2024-12-20',
    supplierId: 'sup-4',
    supplierName: 'Serengeti Breweries Ltd',
    batches: [
      {
        id: 'b-3',
        batchNumber: 'SBL-LAG-204',
        warehouseId: 'wh-2',
        warehouseName: 'Kariakoo Retail Depot',
        quantity: 12,
        unitCost: 1800,
        manufacturingDate: '2024-09-15',
        expiryDate: '2026-12-31',
        daysRemaining: 730,
        expiryStatus: 'VALID',
        receivedDate: '2024-11-10',
        supplierInvoice: 'INV-SBL-0912'
      }
    ]
  },
  {
    id: 'inv-4',
    productId: 'prod-4',
    productName: 'Tanga Fresh Milk (1L)',
    sku: 'DYE-MIL-01',
    barcode: '6201112223334',
    category: 'Dairy & Eggs',
    warehouseId: 'wh-1',
    warehouseName: 'Main Central Warehouse',
    currentStock: 0,
    availableStock: 0,
    reservedStock: 0,
    minStock: 25,
    maxStock: 150,
    reorderLevel: 30,
    unit: 'Cartons',
    buyingPrice: 1600,
    sellingPrice: 2200,
    stockCostValue: 0,
    retailValue: 0,
    stockStatus: 'OUT OF STOCK',
    primaryBatchNumber: 'TNF-MK-881',
    expiryDate: '2025-01-05',
    expiryStatus: 'EXPIRING SOON',
    daysRemaining: 4,
    lastStockCountDate: '2024-12-18',
    lastUpdated: '2024-12-18',
    supplierId: 'sup-3',
    supplierName: 'Tanga Fresh Ltd',
    batches: []
  },
  {
    id: 'inv-5',
    productId: 'prod-5',
    productName: 'Fresh Tanzanian Tomatoes (1KG)',
    sku: 'FRT-TOM-01',
    barcode: '6201234567892',
    category: 'Fresh Produce',
    warehouseId: 'wh-2',
    warehouseName: 'Kariakoo Retail Depot',
    currentStock: 60,
    availableStock: 60,
    reservedStock: 0,
    minStock: 20,
    maxStock: 100,
    reorderLevel: 25,
    unit: 'Kg',
    buyingPrice: 2000,
    sellingPrice: 3500,
    stockCostValue: 120000,
    retailValue: 210000,
    stockStatus: 'IN STOCK',
    primaryBatchNumber: 'TOM-FARM-01',
    expiryDate: '2025-01-08',
    expiryStatus: 'EXPIRING SOON',
    daysRemaining: 7,
    lastStockCountDate: '2024-12-28',
    lastUpdated: '2024-12-29',
    supplierId: 'sup-5',
    supplierName: 'METL Group (Mo Brands)',
    batches: [
      {
        id: 'b-5',
        batchNumber: 'TOM-FARM-01',
        warehouseId: 'wh-2',
        warehouseName: 'Kariakoo Retail Depot',
        quantity: 60,
        unitCost: 2000,
        manufacturingDate: '2024-12-28',
        expiryDate: '2025-01-08',
        daysRemaining: 7,
        expiryStatus: 'EXPIRING SOON',
        receivedDate: '2024-12-29',
        supplierInvoice: 'LOCAL-AGR-019'
      }
    ]
  },
  {
    id: 'inv-6',
    productId: 'prod-6',
    productName: 'Mo Sunflower Cooking Oil (5L)',
    sku: 'GRO-OIL-05',
    barcode: '6205556667778',
    category: 'Groceries',
    warehouseId: 'wh-1',
    warehouseName: 'Main Central Warehouse',
    currentStock: 8,
    availableStock: 8,
    reservedStock: 0,
    minStock: 30,
    maxStock: 150,
    reorderLevel: 35,
    unit: 'Bottles',
    buyingPrice: 27000,
    sellingPrice: 34000,
    stockCostValue: 216000,
    retailValue: 272000,
    stockStatus: 'LOW STOCK',
    primaryBatchNumber: 'MO-OIL-550',
    expiryDate: '2026-11-20',
    expiryStatus: 'VALID',
    daysRemaining: 690,
    lastStockCountDate: '2024-12-15',
    lastUpdated: '2024-12-26',
    supplierId: 'sup-5',
    supplierName: 'METL Group (Mo Brands)',
    batches: [
      {
        id: 'b-6',
        batchNumber: 'MO-OIL-550',
        warehouseId: 'wh-1',
        warehouseName: 'Main Central Warehouse',
        quantity: 8,
        unitCost: 27000,
        manufacturingDate: '2024-08-10',
        expiryDate: '2026-11-20',
        daysRemaining: 690,
        expiryStatus: 'VALID',
        receivedDate: '2024-11-05',
        supplierInvoice: 'INV-METL-8841'
      }
    ]
  },
  {
    id: 'inv-7',
    productId: 'prod-7',
    productName: 'Colgate Triple Action Toothpaste',
    sku: 'PCR-COL-01',
    barcode: '6208889990001',
    category: 'Personal Care',
    warehouseId: 'wh-3',
    warehouseName: 'Mlimani City Supermarket',
    currentStock: 14,
    availableStock: 14,
    reservedStock: 0,
    minStock: 50,
    maxStock: 200,
    reorderLevel: 55,
    unit: 'Tubes',
    buyingPrice: 3000,
    sellingPrice: 4500,
    stockCostValue: 42000,
    retailValue: 63000,
    stockStatus: 'LOW STOCK',
    primaryBatchNumber: 'COL-TA-991',
    expiryDate: '2027-04-30',
    expiryStatus: 'VALID',
    daysRemaining: 850,
    lastStockCountDate: '2024-12-10',
    lastUpdated: '2024-12-22',
    supplierId: 'sup-5',
    supplierName: 'METL Group (Mo Brands)',
    batches: [
      {
        id: 'b-7',
        batchNumber: 'COL-TA-991',
        warehouseId: 'wh-3',
        warehouseName: 'Mlimani City Supermarket',
        quantity: 14,
        unitCost: 3000,
        manufacturingDate: '2024-05-01',
        expiryDate: '2027-04-30',
        daysRemaining: 850,
        expiryStatus: 'VALID',
        receivedDate: '2024-09-12',
        supplierInvoice: 'INV-UNIL-004'
      }
    ]
  },
  {
    id: 'inv-8',
    productId: 'prod-8',
    productName: 'Bakhresa Super Sembe Flour (5kg)',
    sku: 'GRO-BAK-05',
    barcode: '6208889991112',
    category: 'Groceries',
    warehouseId: 'wh-1',
    warehouseName: 'Main Central Warehouse',
    currentStock: 45,
    availableStock: 45,
    reservedStock: 0,
    minStock: 20,
    maxStock: 200,
    reorderLevel: 25,
    unit: 'Bags',
    buyingPrice: 9000,
    sellingPrice: 11500,
    stockCostValue: 405000,
    retailValue: 517500,
    stockStatus: 'IN STOCK',
    primaryBatchNumber: 'AZA-SMB-81',
    expiryDate: '2026-08-30',
    expiryStatus: 'VALID',
    daysRemaining: 605,
    lastStockCountDate: '2024-12-22',
    lastUpdated: '2024-12-25',
    supplierId: 'sup-1',
    supplierName: 'Bakhresa Group (Azam)',
    batches: [
      {
        id: 'b-8',
        batchNumber: 'AZA-SMB-81',
        warehouseId: 'wh-1',
        warehouseName: 'Main Central Warehouse',
        quantity: 45,
        unitCost: 9000,
        manufacturingDate: '2024-09-01',
        expiryDate: '2026-08-30',
        daysRemaining: 605,
        expiryStatus: 'VALID',
        receivedDate: '2024-12-10',
        supplierInvoice: 'INV-AZM-4110'
      }
    ]
  }
];

let mockTransactions: StockTransaction[] = [
  {
    id: 'TXN-2024-001',
    productId: 'prod-1',
    productName: 'Kilimanjaro Drinking Water (1.5L)',
    sku: 'BEV-KIL-15',
    warehouseId: 'wh-1',
    warehouseName: 'Main Central Warehouse',
    batchNumber: 'BAT-2024-KIL-04',
    type: 'PURCHASE_RECEIPT',
    quantityChange: 50,
    quantityBefore: 95,
    quantityAfter: 145,
    unitCost: 600,
    totalCost: 30000,
    referenceNumber: 'PO-TZ-8492',
    supplierOrCustomer: 'Bonite Bottlers Ltd (Kilimanjaro)',
    notes: 'Direct factory shipment delivery',
    performedBy: 'Admin Store Manager',
    userRole: 'ADMIN',
    createdAt: '2024-12-28 14:22'
  },
  {
    id: 'TXN-2024-002',
    productId: 'prod-2',
    productName: 'Azam Wheat Flour (2kg)',
    sku: 'GRO-AZA-02',
    warehouseId: 'wh-1',
    warehouseName: 'Main Central Warehouse',
    batchNumber: 'AZA-FL-109',
    type: 'PURCHASE_RECEIPT',
    quantityChange: 40,
    quantityBefore: 45,
    quantityAfter: 85,
    unitCost: 2100,
    totalCost: 84000,
    referenceNumber: 'PO-TZ-9104',
    supplierOrCustomer: 'Bakhresa Group (Azam)',
    notes: 'Weekly flour restock received',
    performedBy: 'Admin Store Manager',
    userRole: 'ADMIN',
    createdAt: '2024-12-27 10:15'
  },
  {
    id: 'TXN-2024-003',
    productId: 'prod-6',
    productName: 'Mo Sunflower Cooking Oil (5L)',
    sku: 'GRO-OIL-05',
    warehouseId: 'wh-1',
    warehouseName: 'Main Central Warehouse',
    batchNumber: 'MO-OIL-550',
    type: 'SALE',
    quantityChange: -2,
    quantityBefore: 10,
    quantityAfter: 8,
    unitCost: 27000,
    totalCost: 54000,
    referenceNumber: 'RCPT-TZ-089',
    supplierOrCustomer: 'Walk-in Customer',
    notes: 'POS Register 01 Sale',
    performedBy: 'Cashier Terminal 1',
    userRole: 'CASHIER',
    createdAt: '2024-12-26 16:40'
  },
  {
    id: 'TXN-2024-004',
    productId: 'prod-4',
    productName: 'Tanga Fresh Milk (1L)',
    sku: 'DYE-MIL-01',
    warehouseId: 'wh-1',
    warehouseName: 'Main Central Warehouse',
    batchNumber: 'TNF-MK-881',
    type: 'DAMAGE',
    quantityChange: -5,
    quantityBefore: 5,
    quantityAfter: 0,
    unitCost: 1600,
    totalCost: 8000,
    referenceNumber: 'AUDIT-DMG-03',
    reason: 'EXPIRED',
    notes: 'Expired stock removed from shelf during morning check',
    performedBy: 'Admin Store Manager',
    userRole: 'ADMIN',
    createdAt: '2024-12-18 09:30'
  }
];

export const inventoryApi = {
  // 1. Get List of Inventory with Filters & Pagination
  async getInventory(filters?: InventoryFilters): Promise<{ data: InventoryItem[]; total: number; kpis: InventoryKPIs }> {
    try {
      const response = await apiClient.get('/inventory', { params: filters });
      return response.data;
    } catch {
      // Offline / Local Mock Fallback
      let filtered = [...mockInventory];

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(item =>
          item.productName.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.barcode.toLowerCase().includes(q) ||
          (item.primaryBatchNumber && item.primaryBatchNumber.toLowerCase().includes(q)) ||
          (item.supplierName && item.supplierName.toLowerCase().includes(q))
        );
      }

      if (filters?.category && filters.category !== 'All') {
        filtered = filtered.filter(item => item.category === filters.category);
      }

      if (filters?.warehouseId && filters.warehouseId !== 'All') {
        filtered = filtered.filter(item => item.warehouseId === filters.warehouseId);
      }

      if (filters?.stockStatus && filters.stockStatus !== 'ALL') {
        filtered = filtered.filter(item => item.stockStatus === filters.stockStatus);
      }

      if (filters?.supplierId && filters.supplierId !== 'All') {
        filtered = filtered.filter(item => item.supplierId === filters.supplierId);
      }

      if (filters?.expiryStatus && filters.expiryStatus !== 'ALL') {
        filtered = filtered.filter(item => item.expiryStatus === filters.expiryStatus);
      }

      if (filters?.startDate && filters?.endDate) {
        filtered = filtered.filter(item => item.lastUpdated >= filters.startDate! && item.lastUpdated <= filters.endDate!);
      }

      const totalCostValue = mockInventory.reduce((sum, i) => sum + (i.currentStock * i.buyingPrice), 0);
      const totalRetailVal = mockInventory.reduce((sum, i) => sum + (i.currentStock * i.sellingPrice), 0);
      const totalUnits = mockInventory.reduce((sum, i) => sum + i.currentStock, 0);

      const kpis: InventoryKPIs = {
        totalStockCostValue: totalCostValue,
        totalRetailValue: totalRetailVal,
        totalStockUnits: totalUnits,
        totalSKUs: mockInventory.length,
        inStockCount: mockInventory.filter(i => i.stockStatus === 'IN STOCK').length,
        lowStockCount: mockInventory.filter(i => i.stockStatus === 'LOW STOCK').length,
        outOfStockCount: mockInventory.filter(i => i.stockStatus === 'OUT OF STOCK').length,
        expiringSoonCount: mockInventory.filter(i => i.expiryStatus === 'EXPIRING SOON' || i.expiryStatus === 'EXPIRED').length,
      };

      return {
        data: filtered,
        total: filtered.length,
        kpis
      };
    }
  },

  // 2. Get Single Inventory Details
  async getInventoryById(id: string): Promise<InventoryItem> {
    try {
      const response = await apiClient.get(`/inventory/${id}`);
      return response.data;
    } catch {
      const item = mockInventory.find(i => i.id === id);
      if (!item) throw new Error('Inventory item not found');
      return item;
    }
  },

  // 3. Receive Inward Stock (Purchase Receipt)
  async receiveStock(payload: ReceiveStockPayload): Promise<{ success: boolean; item: InventoryItem; transaction: StockTransaction }> {
    try {
      const response = await apiClient.post('/inventory/receipts', payload);
      return response.data;
    } catch {
      const itemIndex = mockInventory.findIndex(i => i.productId === payload.productId && i.warehouseId === payload.warehouseId);
      if (itemIndex === -1) {
        throw new Error('Inventory record not found for product in selected warehouse');
      }

      const item = mockInventory[itemIndex];
      const prevStock = item.currentStock;
      const newStock = prevStock + payload.quantity;
      const now = new Date().toISOString().split('T')[0];
      const nowFull = new Date().toISOString().replace('T', ' ').substring(0, 16);

      const updatedStatus = newStock === 0 ? 'OUT OF STOCK' : newStock <= item.minStock ? 'LOW STOCK' : 'IN STOCK';

      const updatedBatches = [...item.batches];
      if (payload.batchNumber) {
        updatedBatches.unshift({
          id: `batch-${Date.now()}`,
          batchNumber: payload.batchNumber,
          warehouseId: payload.warehouseId,
          warehouseName: item.warehouseName,
          quantity: payload.quantity,
          unitCost: payload.unitCost,
          manufacturingDate: payload.manufacturingDate,
          expiryDate: payload.expiryDate,
          daysRemaining: payload.expiryDate ? Math.ceil((new Date(payload.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : undefined,
          expiryStatus: 'VALID',
          receivedDate: payload.receivedDate || now,
          supplierInvoice: payload.supplierInvoiceNumber
        });
      }

      const updatedItem: InventoryItem = {
        ...item,
        currentStock: newStock,
        availableStock: newStock - item.reservedStock,
        buyingPrice: payload.unitCost || item.buyingPrice,
        stockCostValue: newStock * (payload.unitCost || item.buyingPrice),
        retailValue: newStock * item.sellingPrice,
        stockStatus: updatedStatus,
        primaryBatchNumber: payload.batchNumber || item.primaryBatchNumber,
        expiryDate: payload.expiryDate || item.expiryDate,
        lastUpdated: now,
        batches: updatedBatches
      };

      mockInventory[itemIndex] = updatedItem;

      const newTransaction: StockTransaction = {
        id: `TXN-${Date.now().toString().slice(-6)}`,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName,
        batchNumber: payload.batchNumber,
        type: 'PURCHASE_RECEIPT',
        quantityChange: payload.quantity,
        quantityBefore: prevStock,
        quantityAfter: newStock,
        unitCost: payload.unitCost,
        totalCost: payload.quantity * payload.unitCost,
        referenceNumber: payload.poNumber || `PO-INW-${Date.now().toString().slice(-4)}`,
        supplierOrCustomer: mockSuppliers.find(s => s.id === payload.supplierId)?.name || 'Supplier',
        notes: payload.notes || 'Inward purchase receipt',
        performedBy: 'Admin Store Manager',
        userRole: 'ADMIN',
        createdAt: nowFull
      };

      mockTransactions.unshift(newTransaction);

      return {
        success: true,
        item: updatedItem,
        transaction: newTransaction
      };
    }
  },

  // 4. Adjust Stock (Physical Count / Damage / Variance)
  async adjustStock(payload: AdjustStockPayload): Promise<{ success: boolean; item: InventoryItem; transaction: StockTransaction }> {
    try {
      const response = await apiClient.post('/inventory/adjustments', payload);
      return response.data;
    } catch {
      const itemIndex = mockInventory.findIndex(i => i.id === payload.inventoryId);
      if (itemIndex === -1) {
        throw new Error('Inventory record not found');
      }

      const item = mockInventory[itemIndex];
      const prevStock = item.currentStock;
      const newStock = Math.max(0, payload.physicalCount);
      const variance = newStock - prevStock;
      const now = new Date().toISOString().split('T')[0];
      const nowFull = new Date().toISOString().replace('T', ' ').substring(0, 16);

      const updatedStatus = newStock === 0 ? 'OUT OF STOCK' : newStock <= item.minStock ? 'LOW STOCK' : 'IN STOCK';

      let txnType: StockTransaction['type'] = 'STOCK_ADJUSTMENT';
      if (payload.reason === 'PHYSICAL_COUNT') txnType = 'STOCK_COUNT';
      else if (payload.reason === 'DAMAGE') txnType = 'DAMAGE';
      else if (payload.reason === 'EXPIRED') txnType = 'EXPIRY';
      else if (payload.reason === 'RETURN') txnType = 'CUSTOMER_RETURN';

      const updatedItem: InventoryItem = {
        ...item,
        currentStock: newStock,
        availableStock: Math.max(0, newStock - item.reservedStock),
        stockCostValue: newStock * item.buyingPrice,
        retailValue: newStock * item.sellingPrice,
        stockStatus: updatedStatus,
        lastStockCountDate: payload.reason === 'PHYSICAL_COUNT' ? now : item.lastStockCountDate,
        lastUpdated: now
      };

      mockInventory[itemIndex] = updatedItem;

      const newTransaction: StockTransaction = {
        id: `TXN-${Date.now().toString().slice(-6)}`,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName,
        batchNumber: payload.batchNumber || item.primaryBatchNumber,
        type: txnType,
        quantityChange: variance,
        quantityBefore: prevStock,
        quantityAfter: newStock,
        unitCost: item.buyingPrice,
        totalCost: Math.abs(variance) * item.buyingPrice,
        referenceNumber: `ADJ-${payload.reason.substring(0, 3)}-${Date.now().toString().slice(-4)}`,
        reason: payload.reason,
        notes: payload.notes || `Stock variance: ${variance >= 0 ? `+${variance}` : variance}`,
        performedBy: 'Admin Store Manager',
        userRole: 'ADMIN',
        createdAt: nowFull
      };

      mockTransactions.unshift(newTransaction);

      return {
        success: true,
        item: updatedItem,
        transaction: newTransaction
      };
    }
  },

  // 5. Get Stock Movement / Transaction Audit Log
  async getTransactions(productId?: string): Promise<StockTransaction[]> {
    try {
      const response = await apiClient.get('/inventory/transactions', { params: { productId } });
      return response.data;
    } catch {
      if (productId) {
        return mockTransactions.filter(t => t.productId === productId);
      }
      return [...mockTransactions];
    }
  },

  // 6. Get Warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    try {
      const response = await apiClient.get('/warehouses');
      return response.data;
    } catch {
      return [...mockWarehouses];
    }
  },

  // 7. Get Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const response = await apiClient.get('/suppliers');
      return response.data;
    } catch {
      return [...mockSuppliers];
    }
  }
};
