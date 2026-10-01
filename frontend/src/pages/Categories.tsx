import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, Power,
  CheckCircle2, X, LayoutGrid, Package, Award,
  Calendar, Filter, RotateCcw, Loader2
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { KPICard, Pagination } from '../components/common';
import { categoryService } from '../services/categoryService';
import type { Category, CategoryStats, CreateCategoryData } from '../services/categoryService';

export type { Category };

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats>({
    totalCategories: 0,
    activeCategories: 0,
    linkedProducts: 0,
    topCategory: { name: 'None', productCount: 0 }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Dynamic KPI Stats Based on Active Filters
  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const params: any = {
        search: debouncedSearchQuery.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        dateFilter: dateFilter !== 'ALL' ? dateFilter : undefined,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
      };
      const data = await categoryService.getCategoryStats(params);
      setStats(data);
    } catch (err) {
      console.error('Failed to load category stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, [debouncedSearchQuery, statusFilter, dateFilter, customStartDate, customEndDate]);

  // Fetch Categories with Backend Filters & 20-item Pagination
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await categoryService.getCategories({
        search: debouncedSearchQuery.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        dateFilter: dateFilter,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      setCategories(res.categories);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      showToast(err.response?.data?.message || 'Failed to fetch categories list');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, statusFilter, dateFilter, customStartDate, customEndDate, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, [fetchCategories, fetchStats]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setStatus('Active');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description);
    setStatus(cat.status);
    setError('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (cat: Category) => {
    try {
      const updated = await categoryService.toggleCategoryStatus(cat.id);
      setCategories(prev => prev.map(c => c.id === cat.id ? updated : c));
      fetchStats();
      showToast(`Category "${updated.name}" marked as ${updated.status}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to toggle category status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      setDeleteConfirmId(null);
      fetchStats();
      showToast('Category deleted successfully');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateCategoryData = {
        name: name.trim(),
        description: description.trim(),
        status
      };

      if (editingCategory) {
        const updated = await categoryService.updateCategory(editingCategory.id, payload);
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? updated : c));
        showToast(`Category "${updated.name}" updated!`);
      } else {
        const created = await categoryService.createCategory(payload);
        setCategories(prev => [created, ...prev]);
        showToast(`Category "${created.name}" created!`);
      }

      fetchStats();
      setIsModalOpen(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to save category';
      setError(errorMsg);
      showToast(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setStatusFilter('All');
    setDateFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'All' || dateFilter !== 'ALL';

  return (
    <AdminLayout title="Categories Management">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* TOP HEADER WITH ADD CATEGORY BUTTON ON RIGHT */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Categories Management</h2>
            <p className="text-xs text-slate-500 font-medium">Department groups, product classifications, and inventory distribution</p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>

        {/* 4 ENTERPRISE KPI CARDS (FILTER-AWARE WITH INDIAN SCALE NOTATION) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Categories"
            value={
              isStatsLoading
                ? '...'
                : stats?.totalCategoriesCompact
                  ? `${stats.totalCategoriesCompact} Depts`
                  : `${stats.totalCategories} Depts`
            }
            icon={LayoutGrid}
            color="indigo"
            badge={{
              text: `${stats.totalCategories} Depts`,
              isPositive: stats.totalCategories > 0,
            }}
            subtitle={stats.totalCategories > 0 ? `Matching selection: ${stats.totalCategories}` : 'Registered catalog departments'}
            chartType="line"
          />
          <KPICard
            title="Active Categories"
            value={
              isStatsLoading
                ? '...'
                : stats?.activeCategoriesCompact
                  ? `${stats.activeCategoriesCompact} Active`
                  : `${stats.activeCategories} Active`
            }
            icon={CheckCircle2}
            color="emerald"
            badge={{
              text: stats.totalCategories > 0
                ? `${Math.round((stats.activeCategories / stats.totalCategories) * 100)}% Live`
                : '0% Live',
              isPositive: true
            }}
            subtitle={`${stats.activeCategories} of ${stats.totalCategories} depts active`}
            chartType="bar"
          />
          <KPICard
            title="Linked Products"
            value={
              isStatsLoading
                ? '...'
                : stats?.linkedProductsCompact
                  ? `${stats.linkedProductsCompact} Items`
                  : `${stats.linkedProducts} Items`
            }
            icon={Package}
            color="purple"
            badge={{
              text: `${stats.linkedProducts} Products`,
              isPositive: stats.linkedProducts > 0,
            }}
            subtitle="Products assigned to categories"
            chartType="line"
          />
          <KPICard
            title="Top Category"
            value={isStatsLoading ? '...' : (stats.topCategory.name || 'None')}
            icon={Award}
            color="amber"
            badge={`${stats.topCategory.productCountCompact ?? stats.topCategory.productCount} Products`}
            subtitle="Highest catalog volume"
            chartType="bar"
          />
        </div>

        {/* SEPARATE FILTER & SEARCH BAR CARD */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input with Live Clear Button */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search category name or description..."
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

            {/* Status Filter */}
            <div className="relative min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Date Filter */}
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
                <option value="TODAY">Created Today</option>
                <option value="WEEK">This Week</option>
                <option value="MONTH">This Month</option>
                <option value="CUSTOM">Custom Range...</option>
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

        {/* SEPARATE CATEGORIES TABLE CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-3">
          <div className="overflow-x-auto overflow-y-scroll h-[520px] min-h-[520px] rounded-xl border border-slate-100/90 custom-scrollbar relative">
            <table className="w-full text-left text-sm border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-20 bg-slate-50 shadow-xs">
                <tr className="text-slate-500 font-bold border-b border-slate-200 text-xs tracking-wider whitespace-nowrap bg-slate-50">
                  <th className="py-3 px-4 uppercase whitespace-nowrap bg-slate-50">CATEGORY NAME</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">DESCRIPTION</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">LINKED ITEMS</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">CREATED DATE</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">STATUS</th>
                  <th className="py-3 px-4 uppercase whitespace-nowrap text-right bg-slate-50">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-28 text-center text-slate-400 text-xs font-bold">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-7 h-7 text-[#4f46e5] animate-spin" />
                        <span>Loading categories from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-28 text-center text-slate-400 text-xs font-bold">
                      <LayoutGrid className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      No categories found matching your search.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-indigo-50/25 transition-colors group">
                      {/* Category Name with Avatar Icon */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100/60 shadow-2xs">
                            <LayoutGrid className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#4f46e5] transition-colors">{cat.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">Department ID: #{cat.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-3 max-w-xs truncate text-xs text-slate-500 font-medium">
                        {cat.description || '—'}
                      </td>

                      {/* Linked Items Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50/90 text-[#4f46e5] font-bold text-xs border border-indigo-100/80 inline-block shadow-2xs">
                          {cat.productCount} products
                        </span>
                      </td>

                      {/* Created Date with Icon */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs font-mono font-medium text-slate-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cat.createdDate}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${cat.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cat.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {cat.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right space-x-1.5 text-slate-400">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer inline-block"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          className={`p-1.5 rounded-xl transition-all cursor-pointer inline-block ${cat.status === 'Active' ? 'hover:text-amber-600 hover:bg-amber-50' : 'hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          title="Toggle Status"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(cat.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer inline-block"
                          title="Delete Category"
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
              itemLabel="categories"
            />
          </div>
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
                  fetchCategories();
                }}
                className="flex-1 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Beverages, Groceries, Dairy"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
                {error && <p className="text-xs text-rose-500 font-bold mt-1">{error}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe items belonging in this category..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Delete Category?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove this category?
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
