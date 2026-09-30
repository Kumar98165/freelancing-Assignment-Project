import { useState } from 'react';
import {
  Warehouse, Search, Plus, RefreshCw,
  CheckCircle2, ShieldAlert, X, Filter, DollarSign, AlertTriangle, PackageX, Package
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { KPICard, Pagination } from '../components/common';

export type StockStatusType = 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';

export interface InventoryItem {
  id: string;
  product: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  buyingPrice: number;
  sellingPrice: number;
  unit: string;
}

const initialInventory: InventoryItem[] = [
  { id: '1', product: 'Kilimanjaro Drinking Water (1.5L)', sku: 'BEV-KIL-15', category: 'Beverages', currentStock: 145, minStock: 50, buyingPrice: 600, sellingPrice: 1000, unit: 'Bottles' },
  { id: '2', product: 'Azam Wheat Flour (2kg)', sku: 'GRO-AZA-02', category: 'Groceries', currentStock: 85, minStock: 30, buyingPrice: 2100, sellingPrice: 2800, unit: 'Packs' },
  { id: '3', product: 'Serengeti Premium Lager (500ml)', sku: 'BEV-SER-01', category: 'Beverages', currentStock: 12, minStock: 40, buyingPrice: 1800, sellingPrice: 2500, unit: 'Bottles' },
  { id: '4', product: 'Tanga Fresh Milk (1L)', sku: 'DYE-MIL-01', category: 'Dairy & Eggs', currentStock: 0, minStock: 25, buyingPrice: 1600, sellingPrice: 2200, unit: 'Cartons' },
  { id: '5', product: 'Fresh Tanzanian Tomatoes (1KG)', sku: 'FRT-TOM-01', category: 'Fresh Produce', currentStock: 60, minStock: 20, buyingPrice: 2000, sellingPrice: 3500, unit: 'Kg' },
  { id: '6', product: 'Mo Sunflower Cooking Oil (5L)', sku: 'GRO-OIL-05', category: 'Groceries', currentStock: 8, minStock: 30, buyingPrice: 27000, sellingPrice: 34000, unit: 'Bottles' },
  { id: '7', product: 'Colgate Triple Action Toothpaste', sku: 'PCR-COL-01', category: 'Personal Care', currentStock: 14, minStock: 50, buyingPrice: 3000, sellingPrice: 4500, unit: 'Tubes' },
];

const categoriesList = ['All Categories', 'Beverages', 'Groceries', 'Dairy & Eggs', 'Fresh Produce', 'Personal Care'];

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | StockStatusType>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add Stock Modal State
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [selectedProductForAdd, setSelectedProductForAdd] = useState<InventoryItem | null>(null);
  const [addQty, setAddQty] = useState<number>(10);
  const [addUnitCost, setAddUnitCost] = useState<number>(0);
  const [addRef, setAddRef] = useState<string>('PO-TZ-2026-004');
  const [addDate, setAddDate] = useState<string>('2024-12-23');
  const [addNotes, setAddNotes] = useState<string>('');

  // Stock Adjustment Modal State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<InventoryItem | null>(null);
  const [adjustNewQty, setAdjustNewQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<'PURCHASE' | 'STOCK_ADJUSTMENT' | 'DAMAGE' | 'RETURN' | 'OTHER'>('STOCK_ADJUSTMENT');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [isAdjustConfirmOpen, setIsAdjustConfirmOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatTZS = (val: number) => `TSh ${val.toLocaleString()}`;

  const getStockStatus = (item: InventoryItem): StockStatusType => {
    if (item.currentStock === 0) return 'OUT OF STOCK';
    if (item.currentStock <= item.minStock) return 'LOW STOCK';
    return 'IN STOCK';
  };

  // Filter Logic
  const filteredInventory = inventory.filter(item => {
    const status = getStockStatus(item);
    const matchesSearch = item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage) || 1;
  const paginatedInventory = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Summary KPIs
  const totalStockValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.buyingPrice), 0);
  const lowStockCount = inventory.filter(i => getStockStatus(i) === 'LOW STOCK').length;
  const outOfStockCount = inventory.filter(i => getStockStatus(i) === 'OUT OF STOCK').length;

  // Add Stock Handlers
  const handleOpenAddStock = (item: InventoryItem) => {
    setSelectedProductForAdd(item);
    setAddQty(10);
    setAddUnitCost(item.buyingPrice);
    setAddRef(`PO-TZ-${Math.floor(1000 + Math.random() * 9000)}`);
    setAddDate(new Date().toISOString().split('T')[0]);
    setAddNotes('');
    setIsAddStockOpen(true);
  };

  const handleSaveAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdd || addQty <= 0) return;

    setInventory(inventory.map(item => {
      if (item.id === selectedProductForAdd.id) {
        return { ...item, currentStock: item.currentStock + addQty, buyingPrice: addUnitCost || item.buyingPrice };
      }
      return item;
    }));

    showToast(`Added ${addQty} units to ${selectedProductForAdd.product}`);
    setIsAddStockOpen(false);
  };

  // Adjust Stock Handlers
  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedProductForAdjust(item);
    setAdjustNewQty(item.currentStock);
    setAdjustReason('STOCK_ADJUSTMENT');
    setAdjustNotes('');
    setIsAdjustOpen(true);
  };

  const handleProceedAdjustConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust || adjustNewQty < 0) return;
    setIsAdjustConfirmOpen(true);
  };

  const handleConfirmAdjustment = () => {
    if (!selectedProductForAdjust) return;

    setInventory(inventory.map(item => {
      if (item.id === selectedProductForAdjust.id) {
        return { ...item, currentStock: adjustNewQty };
      }
      return item;
    }));

    showToast(`Stock updated for ${selectedProductForAdjust.product}`);
    setIsAdjustConfirmOpen(false);
    setIsAdjustOpen(false);
  };

  return (
    <AdminLayout title="Inventory Management">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* TOP KPI ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPICard
            title="Total Inventory Value"
            value={formatTZS(totalStockValue)}
            icon={DollarSign}
            color="indigo"
            subtitle="All active warehouse stock"
          />
          <KPICard
            title="Low Stock Items"
            value={`${lowStockCount} Items`}
            icon={AlertTriangle}
            color="amber"
            subtitle="Needs restocking soon"
          />
          <KPICard
            title="Out of Stock"
            value={`${outOfStockCount} Items`}
            icon={PackageX}
            color="rose"
            subtitle="Immediate restock required"
          />
        </div>

        {/* SEPARATE FILTER & SEARCH BAR CARD (COMPACT & SLEEK) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search product or SKU..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                  className="pl-3.5 pr-7 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value as any); setCurrentPage(1); }}
                  className="pl-8 pr-7 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="IN STOCK">In Stock</option>
                  <option value="LOW STOCK">Low Stock</option>
                  <option value="OUT OF STOCK">Out of Stock</option>
                </select>
                <Filter className="w-3 h-3 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* SEPARATE INVENTORY TABLE CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100 text-xs tracking-wider">
                  <th className="pb-4 font-bold uppercase">PRODUCT INFO</th>
                  <th className="pb-4 font-bold uppercase">CATEGORY</th>
                  <th className="pb-4 font-bold uppercase">CURRENT STOCK</th>
                  <th className="pb-4 font-bold uppercase">MIN STOCK</th>
                  <th className="pb-4 font-bold uppercase">PRICE (TZS)</th>
                  <th className="pb-4 font-bold uppercase">STOCK VALUE</th>
                  <th className="pb-4 font-bold uppercase">STATUS</th>
                  <th className="pb-4 font-bold uppercase text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedInventory.map((item) => {
                  const status = getStockStatus(item);
                  const stockValue = item.currentStock * item.buyingPrice;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4">
                        <p className="font-bold text-slate-900 leading-tight">{item.product}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</p>
                      </td>
                      <td className="py-4 text-slate-600 font-medium">
                        {item.category}
                      </td>
                      <td className="py-4">
                        <span className={`font-bold ${status === 'OUT OF STOCK' ? 'text-rose-600' :
                            status === 'LOW STOCK' ? 'text-amber-600' : 'text-slate-900'
                          }`}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="py-4 text-slate-500 font-medium">
                        {item.minStock} {item.unit}
                      </td>
                      <td className="py-4">
                        <p className="font-bold text-slate-900">{formatTZS(item.sellingPrice)}</p>
                        <p className="text-xs text-slate-400">Cost: {formatTZS(item.buyingPrice)}</p>
                      </td>
                      <td className="py-4 font-bold text-slate-900">
                        {formatTZS(stockValue)}
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full font-bold text-xs ${status === 'IN STOCK' ? 'bg-emerald-50 text-emerald-600' :
                            status === 'LOW STOCK' ? 'bg-amber-50 text-amber-600' :
                              'bg-rose-50 text-rose-600'
                          }`}>
                          {status === 'IN STOCK' ? 'In Stock' : status === 'LOW STOCK' ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenAddStock(item)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                          title="Add Stock"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                          title="Adjust Stock"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredInventory.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-medium text-sm">
                <Warehouse className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                No inventory items found.
              </div>
            )}
          </div>

          {/* Common Pagination Component (10 items per page) */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredInventory.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="items"
          />
        </div>
      </div>

      {/* ADD STOCK MODAL */}
      {isAddStockOpen && selectedProductForAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-[#4f46e5] uppercase">Restock Shipment</span>
                <h3 className="text-base font-black text-slate-900">{selectedProductForAdd.product}</h3>
              </div>
              <button onClick={() => setIsAddStockOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddStock} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">Product / SKU</p>
                  <p className="font-bold text-slate-800">{selectedProductForAdd.product}</p>
                  <p className="font-mono text-[10px] text-slate-500">{selectedProductForAdd.sku}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">Current Stock Level</p>
                  <p className="text-base font-black text-slate-900">{selectedProductForAdd.currentStock} {selectedProductForAdd.unit}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity to Add *</label>
                  <input
                    type="number"
                    min="1"
                    value={addQty}
                    onChange={(e) => setAddQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Cost (TZS)</label>
                  <input
                    type="number"
                    value={addUnitCost}
                    onChange={(e) => setAddUnitCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Reference / PO #</label>
                  <input
                    type="text"
                    value={addRef}
                    onChange={(e) => setAddRef(e.target.value)}
                    placeholder="e.g. PO-TZ-2026-004"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="e.g. Received from vendor delivery"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl space-y-1">
                <p className="font-extrabold text-emerald-800 text-xs">Stock Summary Preview:</p>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Current: <strong className="text-slate-900">{selectedProductForAdd.currentStock}</strong></span>
                  <span>+</span>
                  <span>Add: <strong className="text-[#4f46e5]">{addQty || 0}</strong></span>
                  <span>=</span>
                  <span>New Stock: <strong className="text-emerald-700 font-black">{selectedProductForAdd.currentStock + (addQty || 0)} {selectedProductForAdd.unit}</strong></span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStockOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-white rounded-xl font-bold shadow-md shadow-indigo-500/25 cursor-pointer hover:opacity-95"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)'
                  }}
                >
                  Confirm & Add Stock
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {isAdjustOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase">Audit & Correction</span>
                <h3 className="text-base font-black text-slate-900">{selectedProductForAdjust.product}</h3>
              </div>
              <button onClick={() => setIsAdjustOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProceedAdjustConfirmation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">Product</p>
                  <p className="font-bold text-slate-800">{selectedProductForAdjust.product}</p>
                  <p className="font-mono text-[10px] text-slate-500">{selectedProductForAdjust.sku}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">Current Quantity</p>
                  <p className="text-base font-black text-slate-900">{selectedProductForAdjust.currentStock} {selectedProductForAdjust.unit}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={adjustNewQty}
                    onChange={(e) => setAdjustNewQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason *</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none"
                  >
                    <option value="PURCHASE">PURCHASE (Direct Purchase)</option>
                    <option value="STOCK_ADJUSTMENT">STOCK_ADJUSTMENT (Audit/Count)</option>
                    <option value="DAMAGE">DAMAGE (Broken/Expired)</option>
                    <option value="RETURN">RETURN (Customer Return)</option>
                    <option value="OTHER">OTHER (Special Entry)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Provide details about why this adjustment is being made..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-2xl space-y-1">
                <p className="font-extrabold text-amber-800 text-xs">Adjustment Summary:</p>
                <div className="grid grid-cols-4 text-center text-[11px] font-bold text-slate-700 pt-1">
                  <div>
                    <p className="text-[10px] text-slate-400">Current</p>
                    <p>{selectedProductForAdjust.currentStock}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">New</p>
                    <p className="text-[#4f46e5]">{adjustNewQty}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Difference</p>
                    <p className={adjustNewQty - selectedProductForAdjust.currentStock >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {adjustNewQty - selectedProductForAdjust.currentStock >= 0 ? `+${adjustNewQty - selectedProductForAdjust.currentStock}` : adjustNewQty - selectedProductForAdjust.currentStock}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Reason</p>
                    <p className="text-slate-900">{adjustReason}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Review Adjustment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT CONFIRMATION DIALOG */}
      {isAdjustConfirmOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Confirm Stock Adjustment?</h3>
            <p className="text-xs text-slate-500">
              You are about to change stock for <strong>{selectedProductForAdjust.product}</strong> from <strong>{selectedProductForAdjust.currentStock}</strong> to <strong>{adjustNewQty}</strong>.
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setIsAdjustConfirmOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdjustment}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
