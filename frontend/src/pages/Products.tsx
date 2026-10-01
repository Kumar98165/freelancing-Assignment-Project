import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Plus, Eye, Edit2, Power,
  X, CheckCircle2, Trash2, Package, AlertTriangle, DollarSign,
  Calendar, RotateCcw, Loader2, Clock
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { KPICard, Pagination } from '../components/common';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import type { Category } from '../services/categoryService';
import type { Product, ProductStats, CreateProductData } from '../services/productService';

export type { Product };

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    activeProducts: 0,
    lowStockCount: 0,
    totalInventoryValue: 0,
    categories: ['Beverages', 'Groceries', 'Dairy & Eggs', 'Fresh Produce', 'Personal Care', 'Household Items']
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    'Beverages', 'Groceries', 'Dairy & Eggs', 'Fresh Produce', 'Personal Care', 'Household Items'
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [filterCategory, setFilterCategory] = useState('All');

  // Date Filtering
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // Backend Pagination (20 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Modals & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Dynamic KPI Stats & Categories Based on Active Filters
  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const params: any = {
        search: debouncedSearchQuery.trim() || undefined,
        category: filterCategory !== 'All' ? filterCategory : undefined,
        status: filterStatus !== 'All' ? filterStatus : undefined,
        dateFilter: dateFilter !== 'ALL' ? dateFilter : undefined,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
      };

      const [statsData, allCats] = await Promise.all([
        productService.getProductStats(params),
        categoryService.getAllCategories().catch(() => [] as Category[])
      ]);
      setStats(statsData);

      const catNamesFromDb = (allCats as Category[]).map(c => c.name).filter(Boolean);
      const combined = Array.from(new Set([...catNamesFromDb, ...(statsData.categories || [])])).sort();
      if (combined.length > 0) {
        setAvailableCategories(combined);
      }
    } catch (err) {
      console.error('Failed to load product stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, [debouncedSearchQuery, filterCategory, filterStatus, dateFilter, customStartDate, customEndDate]);

  // Fetch Products with Backend Filters & 20-item Pagination
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await productService.getProducts({
        search: debouncedSearchQuery.trim() || undefined,
        category: filterCategory !== 'All' ? filterCategory : undefined,
        status: filterStatus !== 'All' ? filterStatus : undefined,
        dateFilter: dateFilter,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      setProducts(res.products);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      showToast(err.response?.data?.message || 'Failed to fetch products catalog');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, filterCategory, filterStatus, dateFilter, customStartDate, customEndDate, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [fetchProducts, fetchStats]);

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await productService.toggleProductStatus(id);
      setProducts(prev => prev.map(p => p.id === id ? updated : p));
      fetchStats();
      showToast(`Product "${updated.name}" status updated to ${updated.status}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to toggle product status');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setDeleteConfirmId(null);
      fetchStats();
      showToast('Product removed from catalog.');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleOpenAdd = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Refresh categories from database
    try {
      const cats = await categoryService.getAllCategories();
      if (cats && cats.length > 0) {
        const catNames = cats.map((c: Category) => c.name).filter(Boolean).sort();
        setAvailableCategories(catNames);
      }
    } catch {
      // fallback to existing availableCategories
    }

    setFormData({
      name: '',
      sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      category: availableCategories[0] || 'Beverages',
      buyingPrice: undefined,
      sellingPrice: undefined,
      stock: undefined,
      minStock: 10,
      tax: '18% VAT',
      barcodeType: 'MANUFACTURER',
      barcode: '',
      status: 'Active',
      createdDate: today,
      updatedDate: today
    });
    setFormErrors({});
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setFormData({ ...p });
    setFormErrors({});
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenView = (p: Product) => {
    setFormData({ ...p });
    setModalMode('view');
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name?.trim()) errs.name = 'Name is required';
    if (!formData.sku?.trim()) errs.sku = 'SKU is required';
    if (!formData.sellingPrice || formData.sellingPrice <= 0) errs.sellingPrice = 'Must be greater than 0';
    if (!formData.barcode?.trim()) errs.barcode = 'Barcode is required';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload: CreateProductData = {
        name: formData.name!.trim(),
        sku: formData.sku!.trim(),
        category: formData.category || 'Beverages',
        barcode: formData.barcode!.trim(),
        barcodeType: formData.barcodeType || 'MANUFACTURER',
        buyingPrice: Number(formData.buyingPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        stock: Number(formData.stock) || 0,
        minStock: Number(formData.minStock) || 10,
        tax: formData.tax || '18% VAT',
        status: formData.status || 'Active',
        expiryDate: formData.expiryDate || undefined
      };

      if (modalMode === 'add') {
        const created = await productService.createProduct(payload);
        setProducts(prev => [created, ...prev]);
        showToast(`Product "${created.name}" added successfully!`);
      } else if (formData.id) {
        const updated = await productService.updateProduct(formData.id, payload);
        setProducts(prev => prev.map(p => p.id === formData.id ? updated : p));
        showToast(`Product "${updated.name}" updated!`);
      }

      fetchStats();
      setIsModalOpen(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to save product';
      showToast(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchQuery('');
    setFilterStatus('All');
    setFilterCategory('All');
    setDateFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setCurrentPage(1);
  };

  const categories = ['All', ...availableCategories];
  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'All' || filterCategory !== 'All' || dateFilter !== 'ALL';

  return (
    <AdminLayout title="Products Management">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* TOP HEADER WITH ADD PRODUCT BUTTON ON RIGHT */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Products Management</h2>
            <p className="text-xs text-slate-500 font-medium">Inventory catalog, retail prices, SKU barcodes and real-time stock levels</p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        {/* 4 TOP ENTERPRISE KPI CARDS (FILTER-AWARE WITH INDIAN SCALE NOTATION) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Products"
            value={
              isStatsLoading
                ? '...'
                : stats?.totalProductsCompact
                  ? `${stats.totalProductsCompact} Products`
                  : `${stats.totalProducts} Products`
            }
            icon={Package}
            color="indigo"
            badge={{
              text: `${stats.totalProducts} Products`,
              isPositive: stats.totalProducts > 0,
            }}
            subtitle={stats.totalProducts > 0 ? `Matching filters: ${stats.totalProducts}` : 'Registered catalog items'}
            chartType="line"
          />
          <KPICard
            title="Active Products"
            value={
              isStatsLoading
                ? '...'
                : stats?.activeProductsCompact
                  ? `${stats.activeProductsCompact} Active`
                  : `${stats.activeProducts} Active`
            }
            icon={CheckCircle2}
            color="emerald"
            badge={{
              text: stats.totalProducts > 0
                ? `${Math.round((stats.activeProducts / stats.totalProducts) * 100)}% Live`
                : '0% Live',
              isPositive: true
            }}
            subtitle={`${stats.activeProducts} of ${stats.totalProducts} products active`}
            chartType="bar"
          />
          <KPICard
            title="Low / Out of Stock"
            value={isStatsLoading ? '...' : stats.lowStockCount}
            icon={AlertTriangle}
            color="amber"
            badge={{
              text: stats.lowStockCount > 0 ? `${stats.lowStockCount} Alert` : 'Healthy Stock',
              isPositive: stats.lowStockCount === 0
            }}
            subtitle="Threshold <= minimum stock"
            chartType="bar"
          />
          <KPICard
            title="Total Inventory Value"
            value={
              isStatsLoading
                ? '...'
                : stats?.totalInventoryValueCompact
                  ? `TSh ${stats.totalInventoryValueCompact}`
                  : `TSh ${Math.round(stats.totalInventoryValue).toLocaleString()}`
            }
            subtitle={stats.totalInventoryValue > 0 ? `Exact: TSh ${Math.round(stats.totalInventoryValue).toLocaleString()}` : 'Stock retail valuation'}
            icon={DollarSign}
            color="purple"
            badge="Valuation"
            chartType="line"
          />
        </div>

        {/* SEPARATE FILTER & SEARCH BAR CARD */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search input with live clear button */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name, SKU or barcode..."
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
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
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
              <Package className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[130px]">
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value as any); setCurrentPage(1); }}
                className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
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
                <option value="TODAY">Added Today</option>
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

        {/* SEPARATE PRODUCT TABLE CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-3">
          <div className="overflow-x-auto overflow-y-scroll h-[520px] min-h-[520px] rounded-xl border border-slate-100/90 custom-scrollbar relative">
            <table className="w-full text-left text-sm border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-20 bg-slate-50 shadow-xs">
                <tr className="text-slate-500 font-bold border-b border-slate-200 text-xs tracking-wider whitespace-nowrap bg-slate-50">
                  <th className="py-3 px-4 uppercase whitespace-nowrap bg-slate-50">PRODUCT INFO</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">CATEGORY</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">PRICE (TZS)</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">STOCK LEVEL</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">EXPIRY DATE</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">STATUS</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">DATE ADDED</th>
                  <th className="py-3 px-4 uppercase whitespace-nowrap text-right bg-slate-50">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-28 text-center text-slate-400 text-xs font-bold">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-7 h-7 text-[#4f46e5] animate-spin" />
                        <span>Loading products catalog from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-28 text-center text-slate-400 text-xs font-bold">
                      <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      No products found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-indigo-50/25 transition-colors group">

                      {/* Product Info with Avatar icon */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100/60 shadow-2xs">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#4f46e5] transition-colors">{product.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                              {product.sku} &nbsp;|&nbsp; {product.barcode}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50/90 text-[#4f46e5] font-bold text-xs border border-indigo-100/80 inline-block shadow-2xs">
                          {product.category}
                        </span>
                      </td>

                      {/* Price Details */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm">TSh {product.sellingPrice.toLocaleString()}</p>
                        <p className="text-[11px] text-slate-400">Cost: TSh {product.buyingPrice.toLocaleString()}</p>
                      </td>

                      {/* Stock Level with Alert indicator */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`font-black text-xs sm:text-sm ${product.stock <= product.minStock ? 'text-rose-600' : 'text-slate-900'}`}>
                            {product.stock} Units
                          </span>
                          {product.stock <= product.minStock && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200/60">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{product.expiryDate || 'N/A'}</span>
                        </span>
                      </td>

                      {/* Status Pill */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${product.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${product.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {product.status}
                        </span>
                      </td>

                      {/* Date Added Column */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-slate-800">{product.createdDate}</div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right space-x-1.5 text-slate-400">
                        <button
                          onClick={() => handleOpenView(product)}
                          title="View Details"
                          className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer inline-block"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(product)}
                          title="Edit Product"
                          className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer inline-block"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(product.id)}
                          title="Toggle Status"
                          className={`p-1.5 rounded-xl transition-all cursor-pointer inline-block ${product.status === 'Active' ? 'hover:text-amber-600 hover:bg-amber-50' : 'hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(product.id)}
                          title="Delete Product"
                          className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer inline-block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* INTEGRATED BACKEND-DRIVEN PAGINATION (20 items/page) */}
          <div className="flex-shrink-0 pt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="products"
            />
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">Delete Product?</h3>
              <p className="text-xs text-slate-500 mt-1">This product will be permanently removed from your catalog.</p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-rose-500/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
                  fetchProducts();
                }}
                className="flex-1 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT / VIEW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {modalMode === 'add' ? 'Add New Product' : modalMode === 'edit' ? 'Edit Product' : 'Product Details'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMode === 'view' ? (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl">
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Product Name</p>
                    <p className="font-extrabold text-slate-900">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Category</p>
                    <p className="font-bold text-slate-700">{formData.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">SKU</p>
                    <p className="font-mono font-bold text-slate-800">{formData.sku}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Barcode</p>
                    <p className="font-mono font-bold text-slate-800">{formData.barcode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Cost Price</p>
                    <p className="font-bold text-slate-700">TSh {formData.buyingPrice?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Selling Price</p>
                    <p className="font-black text-[#4f46e5]">TSh {formData.sellingPrice?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Current Stock</p>
                    <p className="font-black text-slate-900">{formData.stock} Units</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Min Stock Alert</p>
                    <p className="font-bold text-slate-800">{formData.minStock} Units</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Date Added</p>
                    <p className="font-bold text-slate-800">{formData.createdDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Last Updated</p>
                    <p className="font-bold text-slate-800">{formData.updatedDate}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold cursor-pointer">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4 text-xs font-medium">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Kilimanjaro Drinking Water (1.5L)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    />
                    {formErrors.name && <p className="text-rose-500 font-bold mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      value={formData.sku || ''}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="BEV-KIL-15"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    />
                    {formErrors.sku && <p className="text-rose-500 font-bold mt-1">{formErrors.sku}</p>}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none"
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Buying Price (TSh)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.buyingPrice !== undefined && formData.buyingPrice !== null ? formData.buyingPrice : ''}
                      onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                      placeholder="e.g. 2000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Selling Price (TSh) *</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sellingPrice !== undefined && formData.sellingPrice !== null ? formData.sellingPrice : ''}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                      placeholder="e.g. 2800"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    />
                    {formErrors.sellingPrice && <p className="text-rose-500 font-bold mt-1">{formErrors.sellingPrice}</p>}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Current Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock !== undefined && formData.stock !== null ? formData.stock : ''}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value === '' ? 0 : Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Barcode *</label>
                    <input
                      type="text"
                      value={formData.barcode || ''}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="6201234567890"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold focus:outline-none"
                    />
                    {formErrors.barcode && <p className="text-rose-500 font-bold mt-1">{formErrors.barcode}</p>}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={formData.expiryDate || ''}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-100 mt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200/90 text-slate-700 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer hover:shadow-2xs active:scale-98"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-7 py-2.5 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 transition-all flex items-center justify-center space-x-2 cursor-pointer hover:opacity-95 active:scale-98 disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)'
                    }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{modalMode === 'add' ? 'Save Product' : 'Update Product'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
