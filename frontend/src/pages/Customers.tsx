import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Search, Eye, Edit2, Trash2, CheckCircle2,
  Plus, X, Users, DollarSign, TrendingUp, Award,
  Filter, ArrowUpDown, RotateCcw, MoreVertical, Sparkles, Loader2, Calendar
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { KPICard, Pagination } from '../components/common';
import CustomerProfileView from '../components/customers/CustomerProfileView';
import customerService from '../services/customerService';
import type { CustomerRecord, CustomerStats } from '../services/customerService';

export default function Customers() {
  const { id: routeId } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetId = routeId || searchParams.get('id') || searchParams.get('customerId');

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Filters & Sorting (Backend Bound)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'VIP' | 'REGULAR' | 'NEW'>('ALL');
  const [sortBy, setSortBy] = useState<'TOTAL_DESC' | 'TOTAL_ASC' | 'NAME_ASC' | 'NAME_DESC'>('TOTAL_DESC');

  // Date Filter
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // Backend Pagination (20 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // View state & Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<CustomerRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [openMenuCustId, setOpenMenuCustId] = useState<string | null>(null);

  // Fetch single customer by ID if opened directly via URL or on refresh
  useEffect(() => {
    if (targetId) {
      if (!selectedCustomerDetails || (selectedCustomerDetails.id !== targetId && selectedCustomerDetails.customerId !== targetId)) {
        customerService.getCustomerById(targetId)
          .then(cust => {
            if (cust) handleOpenProfile(cust);
          })
          .catch(() => {
            const found = customers.find(c => c.id === targetId || c.customerId === targetId);
            if (found) setSelectedCustomerDetails(found);
          });
      }
    } else if (selectedCustomerDetails && !routeId && !searchParams.get('id') && !searchParams.get('customerId')) {
      setSelectedCustomerDetails(null);
    }
  }, [targetId, customers]);

  const handleOpenProfile = (c: CustomerRecord) => {
    setSelectedCustomerDetails(c);
    setSearchParams(prev => {
      const updated = new URLSearchParams(prev);
      updated.set('id', c.id);
      return updated;
    }, { replace: true });
  };

  const handleCloseProfile = () => {
    setSelectedCustomerDetails(null);
    setSearchParams(prev => {
      const updated = new URLSearchParams(prev);
      updated.delete('id');
      updated.delete('customerId');
      return updated;
    }, { replace: true });
  };

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+255');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, tierFilter, sortBy, dateFilter, customStartDate, customEndDate]);

  // Fetch Customers with Backend Search, Filters & Pagination
  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = {
        search: debouncedSearchQuery.trim() || undefined,
        tier: tierFilter !== 'ALL' ? tierFilter : undefined,
        sortBy: sortBy || 'TOTAL_DESC',
        dateFilter: dateFilter !== 'ALL' ? dateFilter : undefined,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
        page: currentPage,
        limit: itemsPerPage,
      };

      const res = await customerService.getCustomers(params);
      setCustomers(res.customers || []);
      setTotalItems(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load customer list from database';
      showToast(msg);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, tierFilter, sortBy, dateFilter, customStartDate, customEndDate, currentPage, itemsPerPage]);

  // Fetch KPI Stats Dynamically Based on Active Filters
  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const params: any = {
        search: debouncedSearchQuery.trim() || undefined,
        tier: tierFilter !== 'ALL' ? tierFilter : undefined,
        dateFilter: dateFilter !== 'ALL' ? dateFilter : undefined,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
      };
      const statsData = await customerService.getCustomerStats(params);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error('Failed to load customer stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, [debouncedSearchQuery, tierFilter, dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [fetchCustomers, fetchStats]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    tierFilter !== 'ALL' ||
    sortBy !== 'TOTAL_DESC' ||
    dateFilter !== 'ALL'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setTierFilter('ALL');
    setSortBy('TOTAL_DESC');
    setDateFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setCurrentPage(1);
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('+255');
    setEmail('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: CustomerRecord) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Customer Name is required');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setFormError('Valid Tanzanian Phone Number is required (e.g. +255712345678)');
      return;
    }

    try {
      if (editingCustomer) {
        const updated = await customerService.updateCustomer(editingCustomer.id, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined
        });
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updated : c));
        if (selectedCustomerDetails?.id === editingCustomer.id) {
          setSelectedCustomerDetails(updated);
        }
        fetchStats();
        showToast(`Customer "${name}" updated!`);
      } else {
        const created = await customerService.createCustomer({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined
        });
        setCustomers(prev => [created, ...prev]);
        fetchStats();
        showToast(`Customer "${name}" registered successfully!`);
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error saving customer';
      setFormError(msg);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await customerService.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      if (selectedCustomerDetails?.id === id) {
        setSelectedCustomerDetails(null);
      }
      setDeleteConfirmId(null);
      fetchStats();
      showToast('Customer record removed.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error deleting customer';
      showToast(msg);
      setDeleteConfirmId(null);
    }
  };

  return (
    <AdminLayout title={selectedCustomerDetails ? "Customer Profile" : "Customers Management"}>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* CONDITIONAL RENDERING: FULL-PAGE PROFILE VIEW VS LIST VIEW */}
      {selectedCustomerDetails ? (
        <CustomerProfileView
          customer={selectedCustomerDetails}
          onBack={handleCloseProfile}
          onEdit={handleOpenEdit}
          onDelete={(id) => setDeleteConfirmId(id)}
          formatTZS={formatTZS}
        />
      ) : (
        <div className="space-y-4">
          {/* TOP HEADER WITH ADD CUSTOMER ON RIGHT SIDE */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Overview</h2>
              <p className="text-xs text-slate-500 font-medium">Real-time spending metrics, lifetime value, and directory</p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>

          {/* 4 PROFESSIONAL WHITE GLASSMORPHISM KPI CARDS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <KPICard
              title="Total Customers"
              value={isStatsLoading ? '...' : (stats?.totalCustomers ?? totalItems).toLocaleString()}
              icon={Users}
              color="blue"
              badge={{
                text: '+12.5% vs last mo',
                isPositive: true,
              }}
              subtitle="Active registered accounts"
              chartType="line"
            />

            <KPICard
              title="Customer Revenue"
              value={
                isStatsLoading
                  ? '...'
                  : stats?.customerRevenueCompact
                    ? `TSh ${stats.customerRevenueCompact}`
                    : formatCompactTZS(stats?.customerRevenue ?? 0)
              }
              icon={DollarSign}
              color="emerald"
              badge={{
                text: '+18.4% vs last mo',
                isPositive: true,
              }}
              subtitle="Total gross customer sales"
              chartType="bar"
            />

            <KPICard
              title="Avg Lifetime Value"
              value={
                isStatsLoading
                  ? '...'
                  : stats?.avgLifetimeValueCompact
                    ? `TSh ${stats.avgLifetimeValueCompact}`
                    : formatCompactTZS(stats?.avgLifetimeValue ?? 0)
              }
              icon={TrendingUp}
              color="purple"
              badge={{
                text: '+8.2% avg',
                isPositive: true,
              }}
              subtitle="Avg spend per profile"
              chartType="line"
            />

            <KPICard
              title="Top Spender (VIP)"
              value={isStatsLoading ? '...' : stats?.topSpender ?? 'None'}
              icon={Award}
              color="amber"
              badge={`${stats?.vipCount ?? 0} VIP Clients`}
              subtitle="Highest purchasing client"
              chartType="bar"
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customer name, phone (+255...), email, #CST-001..."
                  className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tier Filter Dropdown */}
              <div className="relative min-w-[170px]">
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value as any)}
                  className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
                >
                  <option value="ALL">All Tiers (All Spend)</option>
                  <option value="VIP">VIP (≥ 1,000,000 TZS)</option>
                  <option value="REGULAR">Regular (100k – 1M TZS)</option>
                  <option value="NEW">New (&lt; 100,000 TZS)</option>
                </select>
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Date Filter Dropdown */}
              <div className="relative min-w-[140px]">
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setDateFilter(val);
                    if (val === 'CUSTOM') {
                      setIsDateModalOpen(true);
                    }
                  }}
                  className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
                >
                  <option value="ALL">All Dates</option>
                  <option value="TODAY">Joined Today</option>
                  <option value="WEEK">This Week</option>
                  <option value="MONTH">This Month</option>
                  <option value="CUSTOM">Custom Range...</option>
                </select>
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Sort By Dropdown */}
              <div className="relative min-w-[175px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
                >
                  <option value="TOTAL_DESC">Sort: Spend (High – Low)</option>
                  <option value="TOTAL_ASC">Sort: Spend (Low – High)</option>
                  <option value="NAME_ASC">Sort: Name (A – Z)</option>
                  <option value="NAME_DESC">Sort: Name (Z – A)</option>
                  <option value="RECENT">Sort: Recent Purchase</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Reset Filters button */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer flex-shrink-0"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
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

          {/* SEPARATE CUSTOMERS TABLE CARD */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-3">
            <div className="overflow-x-auto overflow-y-scroll h-[520px] min-h-[520px] rounded-xl border border-slate-100/90 custom-scrollbar relative">
              <table className="w-full text-left text-sm border-collapse min-w-[850px]">
                <thead className="sticky top-0 z-20 bg-slate-50 shadow-xs">
                  <tr className="text-slate-500 font-bold border-b border-slate-200 text-xs tracking-wider whitespace-nowrap bg-slate-50">
                    <th className="py-3 px-4 uppercase whitespace-nowrap bg-slate-50">CUSTOMER ID</th>
                    <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">CUSTOMER NAME</th>
                    <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">PHONE NUMBER</th>
                    <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">EMAIL</th>
                    <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">TIER</th>
                    <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">TOTAL PURCHASES</th>
                    <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">LAST PURCHASE</th>
                    <th className="py-3 px-4 uppercase whitespace-nowrap text-right bg-slate-50">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/90">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-28 text-center text-slate-400 text-xs font-bold">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Loader2 className="w-7 h-7 text-[#4f46e5] animate-spin" />
                          <span>Loading customers from database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-28 text-center text-slate-400 text-xs font-bold">
                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        No customers found matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    customers.map((cust) => {
                      const isVIP = cust.totalPurchases >= 1000000;
                      const isRegular = cust.totalPurchases >= 100000 && cust.totalPurchases < 1000000;

                      return (
                        <tr
                          key={cust.id}
                          onClick={() => setSelectedCustomerDetails(cust)}
                          className="hover:bg-indigo-50/25 transition-colors cursor-pointer group"
                        >
                          {/* ID Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50/90 text-[#4f46e5] font-mono font-bold text-xs border border-indigo-100/80 inline-block shadow-xs">
                              {cust.customerId || `#CST-${cust.id.padStart(3, '0')}`}
                            </span>
                          </td>

                          {/* Name with Avatar */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2.5">
                              <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0 ${isVIP
                                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                                  : 'bg-gradient-to-tr from-indigo-500 to-purple-500'
                                }`}>
                                {cust.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-xs group-hover:text-[#4f46e5] transition-colors">{cust.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">Joined {cust.createdDate || 'Dec 2024'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="py-3 px-3 font-mono font-medium text-slate-700 text-xs whitespace-nowrap">
                            {cust.phone}
                          </td>

                          {/* Email */}
                          <td className="py-3 px-3 text-slate-500 text-xs whitespace-nowrap">
                            {cust.email || <span className="text-slate-300 italic">None</span>}
                          </td>

                          {/* Tier Badge */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {isVIP ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80 inline-flex items-center space-x-1 shadow-xs">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>VIP</span>
                              </span>
                            ) : isRegular ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-[#4f46e5] border border-indigo-200/60 inline-block shadow-xs">
                                Regular
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60 inline-block">
                                New
                              </span>
                            )}
                          </td>

                          {/* Total Purchases */}
                          <td className="py-3 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                            <span className="text-xs sm:text-sm text-slate-900">{formatTZS(cust.totalPurchases)}</span>
                          </td>

                          {/* Last Purchase */}
                          <td className="py-3 px-3 text-slate-500 text-xs font-mono whitespace-nowrap">
                            {cust.lastPurchase}
                          </td>

                          {/* Actions with 3-dots Menu */}
                          <td className="py-3 px-4 text-right whitespace-nowrap relative">
                            <div className="inline-block text-left relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuCustId(openMenuCustId === cust.id ? null : cust.id);
                                }}
                                title="Actions Menu"
                                className="p-1.5 text-slate-500 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* Floating Dropdown Menu */}
                              {openMenuCustId === cust.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-20 cursor-default"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuCustId(null);
                                    }}
                                  />
                                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuCustId(null);
                                        handleOpenProfile(cust);
                                      }}
                                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-[#4f46e5] flex items-center space-x-2.5 transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-[#4f46e5]" />
                                      <span>View Profile</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuCustId(null);
                                        handleOpenEdit(cust);
                                      }}
                                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-[#4f46e5] flex items-center space-x-2.5 transition-colors cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Edit Customer</span>
                                    </button>
                                    <div className="my-1 border-t border-slate-100" />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuCustId(null);
                                        setDeleteConfirmId(cust.id);
                                      }}
                                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                      <span>Delete Customer</span>
                                    </button>
                                  </div>
                                </>
                              )}
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
            <div className="flex-shrink-0 pt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                itemLabel="customers"
              />
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DATE RANGE MODAL */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#4f46e5]" />
                <h3 className="text-base font-black text-slate-900">Custom Date Range</h3>
              </div>
              <button
                onClick={() => {
                  if (!customStartDate || !customEndDate) {
                    setDateFilter('ALL');
                  }
                  setIsDateModalOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
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
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  if (customStartDate && customEndDate) {
                    setIsDateModalOpen(false);
                  } else {
                    showToast('Please select both start and end date');
                  }
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer transition-all"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Juma Rashid"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+255712345678"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
                <p className="text-[10px] text-slate-400 mt-1">Format: +255XXXXXXXXX</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. juma.rashid@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>

              {formError && (
                <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  {formError}
                </p>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
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
            <h3 className="text-base font-black text-slate-900">Delete Customer?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove this customer record?
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
