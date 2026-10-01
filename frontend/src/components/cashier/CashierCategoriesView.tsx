import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, Power,
  CheckCircle2, X, LayoutGrid, Package, Award,
  Calendar, Filter, RotateCcw, Loader2
} from 'lucide-react';
import { KPICard, Pagination } from '../common';
import { categoryService, type Category, type CategoryStats, type CreateCategoryData } from '../../services/categoryService';

export default function CashierCategoriesView() {
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Categories Management</h2>
          <p className="text-xs text-slate-500 font-medium">Department groups, product classifications, and inventory distribution</p>
        </div>
      </div>

      {/* 4 ENTERPRISE KPI CARDS */}
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
                ? `${stats.activeCategoriesCompact} Live`
                : `${stats.activeCategories} Live`
          }
          icon={CheckCircle2}
          color="emerald"
          badge={{
            text: stats.totalCategories > 0
              ? `${Math.round((stats.activeCategories / stats.totalCategories) * 100)}% Active`
              : '0% Active',
            isPositive: true
          }}
          subtitle={`${stats.activeCategories} of ${stats.totalCategories} categories operational`}
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
          color="amber"
          badge={{
            text: `${stats.linkedProducts} SKUs`,
            isPositive: stats.linkedProducts > 0
          }}
          subtitle="Products assigned to categories"
          chartType="line"
        />

        <KPICard
          title="Top Department"
          value={isStatsLoading ? '...' : (stats?.topCategory?.name || 'Beverages')}
          subtitle={stats?.topCategory?.productCount ? `${stats.topCategory.productCount} products cataloged` : 'Catalog dominant group'}
          icon={Award}
          color="purple"
          badge="Leader"
          chartType="bar"
        />
      </div>

      {/* FILTER & SEARCH BAR CARD */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
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
              <option value="TODAY">Created Today</option>
              <option value="WEEK">This Week</option>
              <option value="MONTH">This Month</option>
              <option value="CUSTOM">Custom Range...</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Reset Button */}
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

      {/* CATEGORIES TABLE CARD */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-3">
        <div className="overflow-x-auto overflow-y-scroll h-[520px] min-h-[520px] rounded-xl border border-slate-100/90 custom-scrollbar relative">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead className="sticky top-0 z-20 bg-slate-50 shadow-xs">
              <tr className="text-slate-500 font-bold border-b border-slate-200 text-xs tracking-wider whitespace-nowrap bg-slate-50">
                <th className="py-3 px-4 uppercase whitespace-nowrap bg-slate-50">DEPARTMENT / CATEGORY</th>
                <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">DESCRIPTION</th>
                <th className="py-3 px-3 uppercase whitespace-nowrap text-center bg-slate-50">PRODUCTS LINKED</th>
                <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">STATUS</th>
                <th className="py-3 px-4 uppercase whitespace-nowrap bg-slate-50 text-right">DATE CREATED</th>
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
                    No categories found matching the selected filter.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-indigo-50/25 transition-colors group">
                    {/* Name + Icon */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100/60 shadow-2xs">
                          <LayoutGrid className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#4f46e5] transition-colors">{category.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">ID: {category.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-3 text-slate-600 text-xs max-w-xs truncate">
                      {category.description || <span className="text-slate-300 italic">No description provided</span>}
                    </td>

                    {/* Products Count */}
                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50/90 text-[#4f46e5] font-bold text-xs border border-indigo-100/80 shadow-2xs">
                        <Package className="w-3.5 h-3.5 mr-1" />
                        {category.productCount ?? 0} SKUs
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${category.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${category.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {category.status}
                      </span>
                    </td>

                    {/* Date Created */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-800">{category.createdDate}</span>
                      </div>
                    </td>
                  </tr>
                ))
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
            itemLabel="categories"
          />
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
              <h3 className="text-base font-black text-slate-900">Delete Category?</h3>
              <p className="text-xs text-slate-500 mt-1">This will permanently delete the category.</p>
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
                onClick={() => handleDelete(deleteConfirmId)}
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

      {/* ADD / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category / Department Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Beverages, Groceries..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this department..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
