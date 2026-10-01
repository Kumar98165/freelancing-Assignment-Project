import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, Power,
  CheckCircle2, X, Filter, Users, ShieldCheck,
  Shield, KeyRound, Award, Phone, Lock, Sparkles, Loader2, Calendar, RotateCcw
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { KPICard, Pagination } from '../components/common';
import userService from '../services/userService';
import type { UserStats } from '../services/userService';

export interface UserRecord {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  role: 'ADMIN' | 'CASHIER';
  status: 'Active' | 'Inactive';
  createdDate: string;
  lastActive?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Filters & Sorting (Backend Bound)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'CASHIER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('+255');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CASHIER'>('CASHIER');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, roleFilter, statusFilter, dateFilter, customStartDate, customEndDate]);

  // Fetch users with Backend Filters & Pagination
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = {
        search: debouncedSearchQuery.trim() || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        dateFilter: dateFilter !== 'ALL' ? dateFilter : undefined,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
        page: currentPage,
        limit: itemsPerPage,
      };

      const res = await userService.getUsers(params);
      setUsers((res.users || []) as UserRecord[]);
      setTotalItems(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load staff list from database';
      showToast(msg);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, roleFilter, statusFilter, dateFilter, customStartDate, customEndDate, currentPage, itemsPerPage]);

  // Fetch Dynamic KPI Stats Based on Active Filters
  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const params: any = {
        search: debouncedSearchQuery.trim() || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        dateFilter: dateFilter !== 'ALL' ? dateFilter : undefined,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
      };
      const statsData = await userService.getUserStats(params);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error('Failed to load user stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, [debouncedSearchQuery, roleFilter, statusFilter, dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    roleFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    dateFilter !== 'ALL'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setDateFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setCurrentPage(1);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFullName('');
    setUsername('');
    setPhone('+255');
    setPassword('');
    setConfirmPassword('');
    setRole('CASHIER');
    setStatus('Active');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: UserRecord) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setUsername(u.username);
    setPhone(u.phone);
    setPassword('');
    setConfirmPassword('');
    setRole(u.role);
    setStatus(u.status);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (u: UserRecord) => {
    try {
      const updated = await userService.toggleUserStatus(u.id);
      setUsers(prev => prev.map(item => item.id === u.id ? { ...item, status: updated.status } : item));
      fetchStats();
      showToast(`User "${u.fullName}" marked as ${updated.status}`);
    } catch (err: any) {
      const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
      setUsers(prev => prev.map(item => item.id === u.id ? { ...item, status: newStatus } : item));
      showToast(`User "${u.fullName}" marked as ${newStatus}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await userService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setDeleteConfirmId(null);
      fetchStats();
      showToast('User account successfully removed.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error deleting user';
      showToast(msg);
      setDeleteConfirmId(null);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Full Name is required');
      return;
    }
    if (!username.trim()) {
      setFormError('Username is required');
      return;
    }

    const isDuplicate = users.some(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== editingUser?.id);
    if (isDuplicate) {
      setFormError('Username is already taken by another account');
      return;
    }

    if (!editingUser) {
      if (!password) {
        setFormError('Password is required for new accounts');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
    } else {
      if (password && password !== confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
    }

    try {
      if (editingUser) {
        const updateData: any = {
          fullName: fullName.trim(),
          username: username.trim(),
          phone: phone.trim(),
          role,
          status,
        };
        if (password) updateData.password = password;

        const updated = await userService.updateUser(editingUser.id, updateData);
        setUsers(prev => prev.map(u => u.id === editingUser.id ? (updated as UserRecord) : u));
        fetchStats();
        showToast(`User "${fullName}" updated!`);
      } else {
        const created = await userService.createUser({
          fullName: fullName.trim(),
          username: username.trim(),
          phone: phone.trim(),
          password,
          role,
          status,
        });
        setUsers(prev => [created as UserRecord, ...prev]);
        fetchStats();
        showToast(`User "${fullName}" registered as ${role}!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error saving user details';
      setFormError(msg);
    }
  };

  return (
    <AdminLayout title="Staff & Accounts">
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
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Staff & User Management</h2>
            <p className="text-xs text-slate-500 font-medium">Role-based access control, active cashier registers, and audit credentials</p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>

        {/* 4 ENTERPRISE WHITE GLASSMORPHISM KPI CARDS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KPICard
            title="Total Staff Users"
            value={
              isStatsLoading
                ? '...'
                : stats?.totalUsersCompact
                  ? `${stats.totalUsersCompact} Accounts`
                  : `${stats?.totalUsers ?? totalItems} Accounts`
            }
            icon={Users}
            color="blue"
            badge={{
              text: `${stats?.totalUsers ?? totalItems} Accounts`,
              isPositive: (stats?.totalUsers ?? totalItems) > 0,
            }}
            subtitle={stats?.totalUsers ? `Matching selection: ${stats.totalUsers}` : 'Registered system profiles'}
            chartType="line"
          />

          <KPICard
            title="Active Cashiers"
            value={isStatsLoading ? '...' : `${stats?.activeCashiers ?? 0} Online`}
            icon={ShieldCheck}
            color="emerald"
            badge={{
              text: `${stats?.activeCashiers ?? 0} Active`,
              isPositive: (stats?.activeCashiers ?? 0) > 0,
            }}
            subtitle={stats?.totalCashiers ? `${stats.activeCashiers} of ${stats.totalCashiers} cashiers online` : 'Point of sale operators'}
            chartType="bar"
          />

          <KPICard
            title="Admin Accounts"
            value={isStatsLoading ? '...' : `${stats?.adminAccounts ?? 0} SuperAdmin`}
            icon={Award}
            color="purple"
            badge={{
              text: `${stats?.adminAccounts ?? 0} Admins`,
              isPositive: (stats?.adminAccounts ?? 0) > 0,
            }}
            subtitle={stats?.adminAccounts ? `${stats.adminAccounts} full access managers` : 'Security & settings managers'}
            chartType="line"
          />

          <KPICard
            title="Account Health"
            value={isStatsLoading ? '...' : `${stats?.healthPercentage ?? 100}% Active`}
            icon={KeyRound}
            color="amber"
            badge={`${stats?.activeUsers ?? 0}/${stats?.totalUsers ?? 0} Enabled`}
            subtitle={`${stats?.activeUsers ?? 0} active • ${stats?.inactiveUsers ?? 0} inactive`}
            chartType="bar"
          />
        </div>

        {/* SEPARATE FILTER & SEARCH BAR CARD */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search staff name, @username, or phone..."
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="relative min-w-[150px]">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Administrator</option>
                <option value="CASHIER">Cashier Staff</option>
              </select>
              <Shield className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
              >
                <option value="ALL">All Account Status</option>
                <option value="Active">Active Users</option>
                <option value="Inactive">Inactive Users</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Date Filter */}
            <div className="relative min-w-[140px]">
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

        {/* SEPARATE USERS TABLE CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-3">
          <div className="overflow-x-auto overflow-y-scroll h-[520px] min-h-[520px] rounded-xl border border-slate-100/90 custom-scrollbar relative">
            <table className="w-full text-left text-sm border-collapse min-w-[850px]">
              <thead className="sticky top-0 z-20 bg-slate-50 shadow-xs">
                <tr className="text-slate-500 font-bold border-b border-slate-200 text-xs tracking-wider whitespace-nowrap bg-slate-50">
                  <th className="py-3 px-4 uppercase whitespace-nowrap bg-slate-50">STAFF MEMBER</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">USERNAME</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">PHONE NUMBER</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">SYSTEM ROLE</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">REGISTERED DATE</th>
                  <th className="py-3 px-3 uppercase whitespace-nowrap bg-slate-50">STATUS</th>
                  <th className="py-3 px-4 uppercase whitespace-nowrap text-right bg-slate-50">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-28 text-center text-slate-400 text-xs font-bold">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-7 h-7 text-[#4f46e5] animate-spin" />
                        <span>Loading staff accounts from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-28 text-center text-slate-400 text-xs font-bold">
                      <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      No staff users found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isAdmin = u.role === 'ADMIN';

                    return (
                      <tr key={u.id} className="hover:bg-indigo-50/25 transition-colors group">
                        {/* Staff Member Info with Avatar */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0 ${isAdmin
                              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                              : 'bg-gradient-to-tr from-indigo-500 to-blue-500'
                              }`}>
                              {u.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs group-hover:text-[#4f46e5] transition-colors">{u.fullName}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Last active: {u.lastActive || 'Today'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50/90 text-[#4f46e5] font-mono font-bold text-xs border border-indigo-100/80 inline-block shadow-xs">
                            @{u.username}
                          </span>
                        </td>

                        {/* Phone Number */}
                        <td className="py-3 px-3 font-mono font-medium text-slate-700 text-xs whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </span>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isAdmin ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200/80 inline-flex items-center space-x-1 shadow-xs">
                              <Sparkles className="w-3 h-3 text-purple-500" />
                              <span>Administrator</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-[#4f46e5] border border-indigo-200/60 inline-block shadow-xs">
                              Cashier
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="py-3 px-3 text-slate-500 text-xs font-mono whitespace-nowrap">
                          {u.createdDate}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[11px] shadow-xs border ${u.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                            : 'bg-slate-100 text-slate-500 border-slate-200/70'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {u.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${u.status === 'Active'
                              ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            title={u.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {u.username !== 'admin' && (
                            <button
                              onClick={() => setDeleteConfirmId(u.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
              itemLabel="staff users"
            />
          </div>
        </div>
      </div>

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

      {/* ADD / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingUser ? 'Edit User Profile' : 'Register New Staff Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Masawe"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. cashier1"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+255712345678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none"
                  >
                    <option value="CASHIER">CASHIER</option>
                    <option value="ADMIN">ADMINISTRATOR</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {editingUser ? 'New Password (Leave blank to keep unchanged)' : 'Login Password *'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {(password || !editingUser) && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              )}

              {formError && (
                <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  {formError}
                </p>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {editingUser ? 'Update Account' : 'Save Staff Account'}
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
            <h3 className="text-base font-black text-slate-900">Delete Staff Account?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove this user account? They will no longer be able to log in.
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmId)}
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
