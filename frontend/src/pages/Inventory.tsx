import { useState, useEffect, useCallback } from 'react';
import {
  Warehouse, Search, Plus, RefreshCw,
  CheckCircle2, X, Filter, DollarSign, AlertTriangle, PackageX, Package,
  Boxes, Calendar, RotateCcw, Clock, Loader2
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { KPICard, Pagination } from '../components/common';
import { inventoryService } from '../services/inventoryService';
import type { InventoryItem, InventoryStats } from '../services/inventoryService';

export type StockStatusType = 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [allProducts, setAllProducts] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalStockValue: 0,
    totalStockUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inStockCount: 0,
    totalProducts: 0
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | StockStatusType>('ALL');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Date Filtering
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // Pagination (20 items per page from backend)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedCategory, selectedStatus, dateFilter, customStartDate, customEndDate]);

  // Receive Stock Drawer State
  const [isReceiveDrawerOpen, setIsReceiveDrawerOpen] = useState(false);
  const [selectedProductForAdd, setSelectedProductForAdd] = useState<InventoryItem | null>(null);
  const [addQty, setAddQty] = useState<number>(10);
  const [addUnitCost, setAddUnitCost] = useState<number>(0);
  const [addSellingPrice, setAddSellingPrice] = useState<number>(0);
  const [addBarcode, setAddBarcode] = useState<string>('');
  const [addExpiryDate, setAddExpiryDate] = useState<string>('2026-12-31');
  const [addNotes, setAddNotes] = useState<string>('');

  // Stock Adjustment Drawer State
  const [isAdjustDrawerOpen, setIsAdjustDrawerOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<InventoryItem | null>(null);
  const [adjustNewQty, setAdjustNewQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<'PHYSICAL_COUNT' | 'DAMAGE' | 'EXPIRED' | 'RETURN' | 'OTHER'>('PHYSICAL_COUNT');
  const [adjustExpiryDate, setAdjustExpiryDate] = useState<string>('');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatTZS = (val: number) => `TSh ${(val || 0).toLocaleString()}`;

  const formatCompactTZS = (val: number) => {
    if (!val || isNaN(val)) return 'TSh 0';
    const abs = Math.abs(val);
    if (abs >= 10_000_000_000) {
      return `TSh ${(val / 10_000_000_000).toFixed(2)} Arab`;
    }
    if (abs >= 10_000_000) {
      return `TSh ${(val / 10_000_000).toFixed(2)} Crore`;
    }
    if (abs >= 100_000) {
      return `TSh ${(val / 100_000).toFixed(2)} Lakh`;
    }
    if (abs >= 1_000) {
      return `TSh ${(val / 1_000).toFixed(1)} Thousand`;
    }
    return `TSh ${Math.round(val).toLocaleString()}`;
  };

  const formatCompactUnits = (val: number) => {
    if (!val || isNaN(val)) return '0 Units';
    const abs = Math.abs(val);
    if (abs >= 10_000_000_000) {
      return `${(val / 10_000_000_000).toFixed(2)} Arab Units`;
    }
    if (abs >= 10_000_000) {
      return `${(val / 10_000_000).toFixed(2)} Crore Units`;
    }
    if (abs >= 100_000) {
      return `${(val / 100_000).toFixed(2)} Lakh Units`;
    }
    if (abs >= 1_000) {
      return `${(val / 1_000).toFixed(1)} Thousand Units`;
    }
    return `${val.toLocaleString()} Units`;
  };

  const getStockStatus = (item: InventoryItem): StockStatusType => {
    if (item.currentStock === 0) return 'OUT OF STOCK';
    if (item.currentStock <= item.minStock) return 'LOW STOCK';
    return 'IN STOCK';
  };

  const isExpiringSoon = (expiryDateStr: string) => {
    if (!expiryDateStr) return false;
    const diff = new Date(expiryDateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days <= 30;
  };

  // Fetch Full Master Product List for dropdowns & categories
  const fetchAllProducts = useCallback(async () => {
    try {
      const data = await inventoryService.getAllInventory();
      setAllProducts(data);
    } catch (err) {
      console.error('Failed to load master products:', err);
    }
  }, []);

  // Fetch Inventory List from Backend (Global Filtering, Search & Backend Pagination)
  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = {
        search: debouncedSearchQuery.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        dateFilter: dateFilter !== 'ALL' ? dateFilter : undefined,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
        page: currentPage,
        limit: itemsPerPage,
      };
      const res = await inventoryService.getInventory(params);
      setInventory(res.items);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      showToast('Error loading inventory');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, selectedCategory, selectedStatus, dateFilter, customStartDate, customEndDate, currentPage, itemsPerPage]);

  // Fetch Stats dynamically based on active search & filter params
  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const params: any = {
        search: debouncedSearchQuery.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        dateFilter: dateFilter !== 'ALL' ? dateFilter : undefined,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
      };
      const data = await inventoryService.getInventoryStats(params);
      setStats(data);
    } catch (err) {
      console.error('Failed to load inventory stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, [debouncedSearchQuery, selectedCategory, selectedStatus, dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    fetchInventory();
    fetchStats();
  }, [fetchInventory, fetchStats]);

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  // Dynamic Categories list
  const categoriesList = ['All', ...Array.from(new Set((allProducts.length > 0 ? allProducts : inventory).map(i => i.category))).filter(Boolean)];

  // Open Receive Stock Drawer
  const handleOpenReceiveDrawer = (item?: InventoryItem) => {
    const list = allProducts.length > 0 ? allProducts : inventory;
    const target = item || list[0];
    if (!target) {
      showToast('No products available to receive stock');
      return;
    }
    setSelectedProductForAdd(target);
    setAddQty(10);
    setAddUnitCost(target.buyingPrice || 0);
    setAddSellingPrice(target.sellingPrice || 0);
    setAddBarcode(target.barcode || '');
    setAddExpiryDate(target.expiryDate || '2026-12-31');
    setAddNotes('');
    setIsReceiveDrawerOpen(true);
  };

  // Submit Receive Stock Drawer
  const handleSaveReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdd || addQty <= 0) return;

    try {
      setIsSubmitting(true);
      const response = await inventoryService.receiveStock({
        productId: selectedProductForAdd.id,
        quantity: Number(addQty),
        unitCost: Number(addUnitCost) || undefined,
        sellingPrice: Number(addSellingPrice) || undefined,
        barcode: addBarcode || undefined,
        expiryDate: addExpiryDate || undefined,
        notes: addNotes || undefined
      });

      showToast(response.message || `Added +${addQty} ${selectedProductForAdd.unit} to ${selectedProductForAdd.product}`);
      setIsReceiveDrawerOpen(false);
      fetchInventory();
      fetchStats();
      fetchAllProducts();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to receive stock';
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Adjust Stock Drawer
  const handleOpenAdjustDrawer = (item: InventoryItem) => {
    setSelectedProductForAdjust(item);
    setAdjustNewQty(item.currentStock);
    setAdjustReason('PHYSICAL_COUNT');
    setAdjustExpiryDate(item.expiryDate || '');
    setAdjustNotes('');
    setIsAdjustDrawerOpen(true);
  };

  // Submit Adjust Stock Drawer
  const handleSaveAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust || adjustNewQty < 0) return;

    try {
      setIsSubmitting(true);
      const response = await inventoryService.adjustStock({
        productId: selectedProductForAdjust.id,
        newStock: Number(adjustNewQty),
        reason: adjustReason,
        expiryDate: adjustExpiryDate || undefined,
        notes: adjustNotes || undefined
      });

      showToast(response.message || `Stock updated for ${selectedProductForAdjust.product}`);
      setIsAdjustDrawerOpen(false);
      fetchInventory();
      fetchStats();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to adjust stock';
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('ALL');
    setDateFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'All' || selectedStatus !== 'ALL' || dateFilter !== 'ALL';

  return (
    <AdminLayout title="Inventory Management">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Inventory Management</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time stock valuation, inward shipments & adjustments</p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => handleOpenReceiveDrawer()}
              className="px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Receive Stock</span>
            </button>
          </div>
        </div>

        {/* 4 UNIFIED ENTERPRISE KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Stock Value"
            value={isStatsLoading ? '...' : (stats.totalStockValueCompact || formatCompactTZS(stats.totalStockValue))}
            subtitle={stats.totalStockValue ? `Exact: ${formatTZS(stats.totalStockValue)}` : undefined}
            icon={DollarSign}
            color="indigo"
            badge="Valuation"
          />
          <KPICard
            title="Total Stock Units"
            value={isStatsLoading ? '...' : (stats.totalStockUnitsCompact || formatCompactUnits(stats.totalStockUnits))}
            subtitle={stats.totalStockUnits ? `Exact: ${stats.totalStockUnits.toLocaleString()} units` : undefined}
            icon={Boxes}
            color="blue"
            badge={{
              text: `${stats.inStockCount} In Stock`,
              isPositive: true
            }}
          />
          <KPICard
            title="Low Stock Items"
            value={isStatsLoading ? '...' : stats.lowStockCount}
            icon={AlertTriangle}
            color="amber"
            badge={{
              text: stats.lowStockCount > 0 ? `${stats.lowStockCount} Alert` : 'Healthy Stock',
              isPositive: stats.lowStockCount === 0
            }}
          />
          <KPICard
            title="Out of Stock"
            value={isStatsLoading ? '...' : stats.outOfStockCount}
            icon={PackageX}
            color="rose"
            badge={{
              text: stats.outOfStockCount > 0 ? `${stats.outOfStockCount} Critical` : 'Zero Deficit',
              isPositive: stats.outOfStockCount === 0
            }}
          />
        </div>

        {/* CLEAN SINGLE-ROW FILTER BAR */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input with Live Clear Button */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name, SKU or barcode..."
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                  className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="relative min-w-[145px]">
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
              <Package className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[130px]">
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value as any); setCurrentPage(1); }}
                className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
              >
                <option value="ALL">All Status</option>
                <option value="IN STOCK">In Stock</option>
                <option value="LOW STOCK">Low Stock</option>
                <option value="OUT OF STOCK">Out of Stock</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Date Filter Dropdown */}
            <div className="relative min-w-[145px]">
              <select
                value={dateFilter}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setDateFilter(val);
                  setCurrentPage(1);
                  if (val === 'CUSTOM') {
                    setIsDateModalOpen(true);
                  }
                }}
                className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
              >
                <option value="ALL">All Dates</option>
                <option value="TODAY">Updated Today</option>
                <option value="WEEK">This Week</option>
                <option value="MONTH">This Month</option>
                <option value="CUSTOM">Custom Date Range...</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Active Custom Date Range Pill */}
          {dateFilter === 'CUSTOM' && customStartDate && customEndDate && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-indigo-600 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Filtered Range: {customStartDate} to {customEndDate}</span>
              </div>
              <button
                onClick={() => setIsDateModalOpen(true)}
                className="text-xs text-[#4f46e5] font-bold hover:underline cursor-pointer"
              >
                Change Dates
              </button>
            </div>
          )}
        </div>

        {/* INVENTORY TABLE CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-3">
          <div className="overflow-x-auto overflow-y-scroll h-[520px] min-h-[520px] rounded-xl border border-slate-100/90 custom-scrollbar relative">
            <table className="w-full text-left text-sm border-collapse min-w-[950px]">
              <thead className="sticky top-0 z-20 bg-slate-50 shadow-xs">
                <tr className="text-slate-500 font-bold border-b border-slate-200 text-xs tracking-wider whitespace-nowrap bg-slate-50">
                  <th className="py-3 px-4 uppercase whitespace-nowrap bg-slate-50">PRODUCT</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">BARCODE</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">CATEGORY</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">CURRENT STOCK</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">MIN STOCK</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">BUYING PRICE</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">SELLING PRICE</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">STOCK VALUE</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">EXPIRY DATE</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">STATUS</th>
                  <th className="py-3 px-4 uppercase whitespace-nowrap text-right bg-slate-50">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="py-28 text-center text-slate-400 text-xs font-bold">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-7 h-7 text-[#4f46e5] animate-spin" />
                        <span>Loading live inventory...</span>
                      </div>
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-28 text-center text-slate-400 text-xs font-bold">
                      <Warehouse className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      No inventory items found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const status = getStockStatus(item);
                    const stockValue = item.currentStock * item.buyingPrice;
                    const expiring = isExpiringSoon(item.expiryDate);

                    return (
                      <tr key={item.id} className="hover:bg-indigo-50/25 transition-colors group">
                        {/* PRODUCT */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center text-[#4f46e5] font-black text-xs flex-shrink-0">
                              <Boxes className="w-4 h-4 text-[#4f46e5]" />
                            </div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{item.product}</p>
                          </div>
                        </td>

                        {/* BARCODE */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded-lg">
                            {item.barcode || '—'}
                          </span>
                        </td>

                        {/* CATEGORY */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200/60">
                            {item.category}
                          </span>
                        </td>

                        {/* CURRENT STOCK */}
                        <td className="py-3 px-3 whitespace-nowrap font-bold text-xs">
                          <span className={`${status === 'OUT OF STOCK' ? 'text-rose-600 font-black' : status === 'LOW STOCK' ? 'text-amber-600 font-black' : 'text-slate-900 font-bold'}`}>
                            {(item.currentStock || 0).toLocaleString()} {item.unit}
                          </span>
                        </td>

                        {/* MIN STOCK */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/50">
                            {item.minStock} {item.unit}
                          </span>
                        </td>

                        {/* BUYING PRICE */}
                        <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-700 text-xs">
                          {formatTZS(item.buyingPrice)}
                        </td>

                        {/* SELLING PRICE */}
                        <td className="py-3 px-3 whitespace-nowrap font-bold text-[#4f46e5] text-xs">
                          {formatTZS(item.sellingPrice)}
                        </td>

                        {/* STOCK VALUE */}
                        <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900 text-xs">
                          {formatTZS(stockValue)}
                        </td>

                        {/* EXPIRY DATE */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center space-x-1 text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${expiring ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-600 border border-slate-200/60'
                            }`}>
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.expiryDate || 'N/A'}</span>
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${status === 'IN STOCK'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                            : status === 'LOW STOCK'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/70'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status === 'IN STOCK' ? 'bg-emerald-500 animate-pulse' :
                              status === 'LOW STOCK' ? 'bg-amber-500' : 'bg-rose-500'
                              }`} />
                            <span>{status === 'IN STOCK' ? 'In Stock' : status === 'LOW STOCK' ? 'Low Stock' : 'Out of Stock'}</span>
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpenReceiveDrawer(item)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1 border border-indigo-100"
                              title="Add / Receive Stock"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                            <button
                              onClick={() => handleOpenAdjustDrawer(item)}
                              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1 border border-slate-200"
                              title="Adjust Stock"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                              <span>Adjust</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Backend-driven Pagination Component (20 items per page) */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="items"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SLIDE-OVER DRAWER: RECEIVE STOCK (RIGHT SLIDE-OVER)                    */}
      {/* ========================================================================= */}
      {isReceiveDrawerOpen && selectedProductForAdd && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Blur */}
          <div
            onClick={() => !isSubmitting && setIsReceiveDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300 cursor-pointer"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-100 flex flex-col justify-between animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Receive Stock</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Log inward shipment & update stock count</p>
                </div>
                <button
                  onClick={() => setIsReceiveDrawerOpen(false)}
                  disabled={isSubmitting}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body Form */}
              <form id="receiveStockForm" onSubmit={handleSaveReceiveStock} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Product Selector */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Select Product *</label>
                  <select
                    value={selectedProductForAdd.id}
                    onChange={(e) => {
                      const list = allProducts.length > 0 ? allProducts : inventory;
                      const found = list.find(i => i.id === e.target.value);
                      if (found) {
                        setSelectedProductForAdd(found);
                        setAddUnitCost(found.buyingPrice || 0);
                        setAddSellingPrice(found.sellingPrice || 0);
                        setAddBarcode(found.barcode || '');
                        setAddExpiryDate(found.expiryDate || '2026-12-31');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer"
                  >
                    {(allProducts.length > 0 ? allProducts : inventory).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.product}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Summary Card */}
                <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{selectedProductForAdd.product}</p>
                    <p className="font-mono text-[11px] text-slate-500 mt-0.5">{selectedProductForAdd.sku} • {selectedProductForAdd.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-[#4f46e5]">{selectedProductForAdd.currentStock} {selectedProductForAdd.unit}</p>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${selectedProductForAdd.currentStock === 0
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : selectedProductForAdd.currentStock <= selectedProductForAdd.minStock
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                      {getStockStatus(selectedProductForAdd)}
                    </span>
                  </div>
                </div>

                {/* Quantity to Add & Quick Chips */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Quantity to Add ({selectedProductForAdd.unit}) *</label>
                  <input
                    type="number"
                    min="1"
                    value={addQty}
                    onChange={(e) => setAddQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    required
                  />
                  <div className="flex space-x-1.5 mt-2">
                    {[5, 10, 25, 50, 100].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAddQty(amt)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buying Price (Unit Cost) & Selling Price Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Unit Cost / Buying Price (TZS)</label>
                    <input
                      type="number"
                      min="0"
                      value={addUnitCost}
                      onChange={(e) => setAddUnitCost(Number(e.target.value))}
                      placeholder="e.g. 2000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Selling Price (TZS)</label>
                    <input
                      type="number"
                      min="0"
                      value={addSellingPrice}
                      onChange={(e) => setAddSellingPrice(Number(e.target.value))}
                      placeholder="e.g. 2800"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    />
                  </div>
                </div>

                {/* Barcode & Expiry Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Barcode *</label>
                    <input
                      type="text"
                      value={addBarcode}
                      onChange={(e) => setAddBarcode(e.target.value)}
                      placeholder="6201234567890"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Batch Expiry Date</label>
                    <input
                      type="date"
                      value={addExpiryDate}
                      onChange={(e) => setAddExpiryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Notes (Optional)</label>
                  <input
                    type="text"
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    placeholder="e.g. Received from delivery truck batch"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>

                {/* New Total Preview */}
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800">New Total Stock Preview:</span>
                  <span className="text-emerald-700 font-black text-sm">
                    {(selectedProductForAdd.currentStock || 0) + (Number(addQty) || 0)} {selectedProductForAdd.unit}
                  </span>
                </div>
              </form>

              {/* Drawer Footer Buttons */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsReceiveDrawerOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="receiveStockForm"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/25 cursor-pointer hover:opacity-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Confirm & Receive</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SLIDE-OVER DRAWER: ADJUST STOCK (RIGHT SLIDE-OVER)                     */}
      {/* ========================================================================= */}
      {isAdjustDrawerOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Blur */}
          <div
            onClick={() => !isSubmitting && setIsAdjustDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300 cursor-pointer"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-100 flex flex-col justify-between animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Adjust Stock</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedProductForAdjust.product}</p>
                </div>
                <button
                  onClick={() => setIsAdjustDrawerOpen(false)}
                  disabled={isSubmitting}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body Form */}
              <form id="adjustStockForm" onSubmit={handleSaveAdjustStock} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Current Stock Banner */}
                <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{selectedProductForAdjust.product}</p>
                    <p className="font-mono text-[11px] text-slate-500 mt-0.5">{selectedProductForAdjust.sku} • {selectedProductForAdjust.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-slate-900">{selectedProductForAdjust.currentStock} {selectedProductForAdjust.unit}</p>
                    <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      Exp: {selectedProductForAdjust.expiryDate || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Actual Physical Count */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">New Actual Physical Count ({selectedProductForAdjust.unit}) *</label>
                  <input
                    type="number"
                    min="0"
                    value={adjustNewQty}
                    onChange={(e) => setAdjustNewQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    required
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Adjustment Reason *</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer"
                  >
                    <option value="PHYSICAL_COUNT">Physical Count / Shelf Audit</option>
                    <option value="EXPIRED">Expired Items (Remove from Shelf)</option>
                    <option value="DAMAGE">Damaged / Broken Items</option>
                    <option value="RETURN">Customer / Store Return</option>
                    <option value="OTHER">Other Correction</option>
                  </select>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Update Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={adjustExpiryDate}
                    onChange={(e) => setAdjustExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    placeholder="Optional details..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none resize-none"
                  />
                </div>

                {/* Difference Summary */}
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-800">Count Variance:</span>
                  <span className={`font-bold font-mono text-xs ${adjustNewQty - selectedProductForAdjust.currentStock >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                    {adjustNewQty - selectedProductForAdjust.currentStock >= 0
                      ? `+${adjustNewQty - selectedProductForAdjust.currentStock}`
                      : adjustNewQty - selectedProductForAdjust.currentStock} {selectedProductForAdjust.unit}
                  </span>
                </div>
              </form>

              {/* Drawer Footer Buttons */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustDrawerOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="adjustStockForm"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/25 cursor-pointer hover:opacity-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Stock</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DATE RANGE FILTER MODAL */}
      {isDateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#4f46e5]" />
                <h3 className="text-base font-black text-slate-900">Custom Date Range</h3>
              </div>
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDateFilter('ALL');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setIsDateModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!customStartDate || !customEndDate) {
                    showToast('Please select both start and end date');
                    return;
                  }
                  setDateFilter('CUSTOM');
                  setIsDateModalOpen(false);
                  setCurrentPage(1);
                  showToast(`Filtered from ${customStartDate} to ${customEndDate}`);
                }}
                className="flex-1 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
