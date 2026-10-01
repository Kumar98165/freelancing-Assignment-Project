import { useState, useEffect, useCallback } from 'react';
import {
  Warehouse, Search, DollarSign, AlertTriangle, PackageX, Package,
  Boxes, Calendar, RotateCcw, Clock, Loader2, X, Filter
} from 'lucide-react';
import { KPICard, Pagination } from '../common';
import { inventoryService, type InventoryItem, type InventoryStats } from '../../services/inventoryService';

export type StockStatusType = 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';

export default function CashierInventoryView() {
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
    return `${Math.round(val).toLocaleString()} Units`;
  };

  const isExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const exp = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffDays = (exp - now) / (1000 * 3600 * 24);
    return diffDays > 0 && diffDays <= 90;
  };

  const getStockStatus = (item: InventoryItem): StockStatusType => {
    if (item.currentStock <= 0) return 'OUT OF STOCK';
    if (item.currentStock <= item.minStock) return 'LOW STOCK';
    return 'IN STOCK';
  };

  // Fetch Inventory
  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchQuery.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        dateFilter: dateFilter,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
      };

      const res = await inventoryService.getInventory(params);
      setInventory(res.items);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load inventory list:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, selectedCategory, selectedStatus, dateFilter, customStartDate, customEndDate]);

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const params: any = {
        search: debouncedSearchQuery.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        dateFilter: dateFilter,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
      };
      const res = await inventoryService.getInventoryStats(params);
      setStats(res);
    } catch (err) {
      console.error('Failed to load inventory stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, [debouncedSearchQuery, selectedCategory, selectedStatus, dateFilter, customStartDate, customEndDate]);

  // Fetch all products for dynamic category dropdown
  const fetchAllProducts = useCallback(async () => {
    try {
      const res = await inventoryService.getInventory({ limit: 1000 });
      setAllProducts(res.items);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchStats();
  }, [fetchInventory, fetchStats]);

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const categoriesList = ['All', ...Array.from(new Set((allProducts.length > 0 ? allProducts : inventory).map(i => i.category))).filter(Boolean)];

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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Inventory Management</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time stock levels, minimum thresholds & alerts</p>
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
          {/* Search Input */}
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
                <th className="py-3 px-4 uppercase whitespace-nowrap bg-slate-50 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-28 text-center text-slate-400 text-xs font-bold">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="w-7 h-7 text-[#4f46e5] animate-spin" />
                      <span>Loading live inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-28 text-center text-slate-400 text-xs font-bold">
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
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#4f46e5] transition-colors">{item.product}</p>
                            <p className="text-[11px] text-slate-400 font-mono">SKU: {item.sku}</p>
                          </div>
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
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200/60">
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
                      <td className="py-3 px-4 whitespace-nowrap text-right">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* INTEGRATED BACKEND-DRIVEN PAGINATION */}
        <div className="flex-shrink-0 pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="inventory items"
          />
        </div>
      </div>

      {/* CUSTOM DATE RANGE MODAL */}
      {isDateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#4f46e5]" />
                <h3 className="text-sm font-black text-slate-900">Custom Date Range</h3>
              </div>
              <button
                onClick={() => {
                  setIsDateModalOpen(false);
                  if (!customStartDate || !customEndDate) setDateFilter('ALL');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">From Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/25"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">To Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/25"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDateModalOpen(false);
                  if (!customStartDate || !customEndDate) setDateFilter('ALL');
                }}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customStartDate || !customEndDate}
                onClick={() => {
                  setIsDateModalOpen(false);
                  setCurrentPage(1);
                  fetchInventory();
                }}
                className="flex-1 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
