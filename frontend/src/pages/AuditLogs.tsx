import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, ShieldCheck, Activity, Users, Search,
  Filter, Calendar, Download, Eye, X, CheckCircle2,
  AlertTriangle, XCircle, RotateCcw, Clock, Laptop, FileText, Sparkles, Loader2
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { KPICard, Pagination } from '../components/common';
import auditService, { type AuditLogRecord, type AuditStats } from '../services/auditService';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Selected Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, categoryFilter, statusFilter, dateFilter, customStartDate, customEndDate]);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = {
        search: debouncedSearchQuery.trim() || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        dateFilter: dateFilter !== 'ALL' ? dateFilter : undefined,
        startDate: dateFilter === 'CUSTOM' && customStartDate ? customStartDate : undefined,
        endDate: dateFilter === 'CUSTOM' && customEndDate ? customEndDate : undefined,
        page: currentPage,
        limit: itemsPerPage,
      };

      const res = await auditService.getAuditLogs(params);
      setLogs(res.logs || []);
      setTotalItems(res.total || 0);
      setTotalPages(res.totalPages || 1);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err: any) {
      showToast('Failed to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, categoryFilter, statusFilter, dateFilter, customStartDate, customEndDate, currentPage]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      showToast('No audit logs available to export.');
      return;
    }
    const headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Category', 'Action', 'IP Address', 'Status', 'Details'];
    const rows = logs.map(l => [
      l.id,
      l.createdAt,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      l.category,
      l.action,
      l.ipAddress,
      l.status,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit log CSV exported successfully!');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setDateFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  return (
    <AdminLayout title="System Audit Logs">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="space-y-5">
        {/* HEADER TOP ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Audit Trail & Security Logs</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Comprehensive real-time tracking of user authentication, inventory adjustments, POS transactions, and system configuration updates.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 self-start sm:self-auto flex-shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold shadow-2xs transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4 ENTERPRISE KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Audit Events"
            value={isLoading ? '...' : (stats?.totalLogs ?? totalItems).toLocaleString()}
            icon={FileText}
            color="blue"
            badge={{
              text: 'Real-time Stream',
              isPositive: true,
            }}
            subtitle="Recorded system operations"
            chartType="line"
          />

          <KPICard
            title="Security Events"
            value={isLoading ? '...' : (stats?.securityAlerts ?? 0).toLocaleString()}
            icon={ShieldAlert}
            color="amber"
            badge={{
              text: (stats?.securityAlerts ?? 0) > 0 ? 'Requires Audit' : 'Clean Log',
              isPositive: (stats?.securityAlerts ?? 0) === 0,
            }}
            subtitle="Warnings & failed attempts"
            chartType="bar"
          />

          <KPICard
            title="Authentication Logs"
            value={isLoading ? '...' : (stats?.authEvents ?? 0).toLocaleString()}
            icon={Activity}
            color="purple"
            badge={{
              text: 'JWT & Session Logs',
              isPositive: true,
            }}
            subtitle="User logins & registrations"
            chartType="line"
          />

          <KPICard
            title="Active Operators"
            value={isLoading ? '...' : (stats?.activeOperators ?? 2).toLocaleString()}
            icon={Users}
            color="emerald"
            badge="Staff Credentials"
            subtitle="Unique user accounts logged"
            chartType="bar"
          />
        </div>

        {/* FILTER & SEARCH BAR CONTAINER */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search action, user, IP address, or details..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Dropdown Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="AUTH">Auth & Logins</option>
                <option value="SALES">Sales & POS</option>
                <option value="INVENTORY">Inventory & Stock</option>
                <option value="SETTINGS">Settings & System</option>
                <option value="USERS">Users & Accounts</option>
              </select>

              {/* Status Dropdown Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="WARNING">WARNING</option>
                <option value="FAILED">FAILED</option>
              </select>

              {/* Date Filter Buttons */}
              <div className="inline-flex bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
                {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDateFilter(mode)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${dateFilter === mode ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'hover:text-slate-900'}`}
                  >
                    {mode === 'ALL' ? 'All Dates' : mode === 'TODAY' ? 'Today' : mode === 'WEEK' ? '7 Days' : '30 Days'}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setDateFilter('CUSTOM');
                    setIsDateModalOpen(true);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${dateFilter === 'CUSTOM' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'hover:text-slate-900'}`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Custom</span>
                </button>
              </div>

              {/* Reset Filters */}
              {(searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || dateFilter !== 'ALL') && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Log ID & Timestamp</th>
                  <th className="py-3 px-4">User & Role</th>
                  <th className="py-3 px-4">Category & Action</th>
                  <th className="py-3 px-4">IP Address & Device</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                      <span>Loading audit logs...</span>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-600">No audit logs found matching criteria</p>
                      <p className="text-xs text-slate-400 mt-1">Try clearing your search queries or resetting date filters.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    const isWarning = log.status === 'WARNING';
                    const isFailed = log.status === 'FAILED';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* ID & Timestamp */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900 text-xs">{log.id}</div>
                          <div className="text-[10.5px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span>{log.createdAt}</span>
                          </div>
                        </td>

                        {/* User & Role */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                              {(log.userName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{log.userName}</p>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                                {log.userRole}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category & Action */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold font-mono text-slate-800 text-[11.5px]">{log.action}</div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {log.category}
                          </span>
                        </td>

                        {/* IP & Device */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono text-xs font-semibold text-slate-800">{log.ipAddress}</div>
                          <div className="text-[10.5px] text-slate-400 max-w-[180px] truncate flex items-center space-x-1 mt-0.5">
                            <Laptop className="w-3 h-3 text-slate-300 flex-shrink-0" />
                            <span className="truncate">{log.deviceInfo}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isSuccess && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 space-x-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>SUCCESS</span>
                            </span>
                          )}
                          {isWarning && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>WARNING</span>
                            </span>
                          )}
                          {isFailed && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 space-x-1">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>FAILED</span>
                            </span>
                          )}
                        </td>

                        {/* Detail Trigger Action */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1 text-xs font-bold"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* BACKEND-DRIVEN PAGINATION */}
          <div className="p-3 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="audit logs"
            />
          </div>
        </div>
      </div>

      {/* AUDIT LOG DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Audit Log Inspector</h3>
                  <p className="text-[10.5px] font-mono text-indigo-600">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Action Code</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                  <p className="font-bold text-indigo-600 mt-0.5">{selectedLog.category}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Operator User</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedLog.userName} ({selectedLog.userRole})</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Timestamp</span>
                  <p className="font-mono text-slate-700 mt-0.5">{selectedLog.createdAt}</p>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">Device & Client IP</label>
                <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-3 rounded-2xl space-y-1">
                  <p>IP Address: <span className="text-white">{selectedLog.ipAddress}</span></p>
                  <p>Client Agent: <span className="text-slate-300">{selectedLog.deviceInfo}</span></p>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">Event Payload & Description</label>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-800 font-sans leading-relaxed">
                  {selectedLog.details || 'No additional detail payload recorded for this event.'}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-md"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DATE MODAL */}
      {isDateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">Custom Log Date Range</h3>
              </div>
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
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
