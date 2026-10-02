import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Search, Eye, Users, DollarSign, TrendingUp, Award,
  Filter, ArrowUpDown, RotateCcw, CheckCircle2,
  Calendar, X, Phone, Mail
} from 'lucide-react';
import { KPICard, Pagination } from '../common';
import CustomerProfileView from '../customers/CustomerProfileView';
import customerService, { type CustomerRecord, type CustomerStats } from '../../services/customerService';

export default function CashierCustomersView() {
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

  // View state
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<CustomerRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch single customer by ID if opened directly via URL or on refresh
  useEffect(() => {
    if (targetId) {
      if (!selectedCustomerDetails || (selectedCustomerDetails.id !== targetId && selectedCustomerDetails.customerId !== targetId)) {
        customerService.getCustomerById(targetId)
          .then(cust => {
            if (cust) setSelectedCustomerDetails(cust);
          })
          .catch(() => {
            // fallback search in loaded list
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
      updated.set('tab', 'customers');
      updated.set('id', c.id);
      return updated;
    }, { replace: true });
  };

  const handleCloseProfile = () => {
    setSelectedCustomerDetails(null);
    setSearchParams(prev => {
      const updated = new URLSearchParams(prev);
      updated.set('tab', 'customers');
      updated.delete('id');
      updated.delete('customerId');
      return updated;
    }, { replace: true });
  };

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
        sortBy: sortBy || 'TOTAL_DESC',
        dateFilter: dateFilter !== 'ALL' ? dateFilter : undefined,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
      };
      const data = await customerService.getCustomerStats(params);
      setStats(data);
    } catch (err) {
      console.error('Failed to load dynamic customer stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, [debouncedSearchQuery, tierFilter, sortBy, dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [fetchCustomers, fetchStats]);

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

  const hasActiveFilters = searchQuery !== '' || tierFilter !== 'ALL' || sortBy !== 'TOTAL_DESC' || dateFilter !== 'ALL';

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* CONDITIONAL RENDERING: PROFILE VIEW VS LIST VIEW */}
      {selectedCustomerDetails ? (
        <CustomerProfileView
          customer={selectedCustomerDetails}
          onBack={handleCloseProfile}
          onEdit={() => { }}
          formatTZS={formatTZS}
        />
      ) : (
        <div className="space-y-4">
          {/* TOP HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Customer Directory</h2>
              <p className="text-xs text-slate-500 font-medium">Customer loyalty members, purchase history, and contact directory</p>
            </div>
          </div>

          {/* 4 ENTERPRISE KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* FILTER & SEARCH BAR CARD */}
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

          {/* CUSTOMERS TABLE CARD */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-3">
            <div className="overflow-x-auto overflow-y-scroll h-[520px] min-h-[520px] rounded-xl border border-slate-100/90 custom-scrollbar relative">
              <table className="w-full text-left text-sm border-collapse min-w-[850px]">
                <thead className="sticky top-0 z-20 bg-slate-50 shadow-xs">
                  <tr className="text-slate-500 font-bold border-b border-slate-200 text-xs tracking-wider whitespace-nowrap bg-slate-50">
                    <th className="py-3 px-4 uppercase whitespace-nowrap bg-slate-50">CUSTOMER INFO</th>
                    <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">CONTACT</th>
                    <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">TIER</th>
                    <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">TOTAL SPEND (TZS)</th>
                    <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">VISITS</th>
                    <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">LAST VISIT</th>
                    <th className="py-3 px-4 uppercase whitespace-nowrap text-right bg-slate-50">PROFILE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/90">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-28 text-center text-slate-400 text-xs font-bold">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <span>Loading customer database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-28 text-center text-slate-400 text-xs font-bold">
                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        No customers found matching the search criteria.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => {
                      const visitsCount = c.purchases?.length || 0;
                      const custCode = `#CST-${c.id.length < 3 ? c.id.padStart(3, '0') : c.id}`;

                      return (
                        <tr key={c.id} className="hover:bg-indigo-50/25 transition-colors group">
                          {/* Info */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition-colors">{c.name}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{custCode}</p>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {c.phone}
                            </p>
                            {c.email && (
                              <p className="text-[10.5px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate max-w-[160px]">
                                <Mail className="w-3 h-3 text-slate-300" />
                                {c.email}
                              </p>
                            )}
                          </td>

                          {/* Tier */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {c.tier === 'VIP' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/15 to-yellow-500/20 text-amber-700 border border-amber-300 shadow-2xs">
                                ★ VIP Tier
                              </span>
                            ) : c.tier === 'REGULAR' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Regular
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                New Member
                              </span>
                            )}
                          </td>

                          {/* Spend */}
                          <td className="py-3 px-3 whitespace-nowrap font-black text-slate-900 text-xs sm:text-sm">
                            {formatTZS(c.totalPurchases)}
                          </td>

                          {/* Visits */}
                          <td className="py-3 px-3 whitespace-nowrap text-xs font-bold text-slate-600">
                            {visitsCount} orders
                          </td>

                          {/* Last Visit */}
                          <td className="py-3 px-3 whitespace-nowrap text-xs text-slate-500 font-mono">
                            {c.lastPurchase || '—'}
                          </td>

                          {/* Profile Action */}
                          <td className="py-3 px-4 whitespace-nowrap text-right text-slate-400">
                            <button
                              onClick={() => handleOpenProfile(c)}
                              title="View Full Customer Profile"
                              className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1 text-xs font-bold text-indigo-600"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Profile</span>
                            </button>
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
                itemLabel="customers"
              />
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
                  fetchCustomers();
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
