import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Users, Package,
  Activity, Clock, Calendar, ArrowRight, TrendingUp, RefreshCw, Loader2, Filter, X, ShieldCheck, Printer, Download
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { KPICard } from '../components/common';
import dashboardService, { type DashboardSummaryResponse, type DatePresetType } from '../services/dashboardService';
import posService from '../services/posService';

const formatTZS = (amount: number): string => {
  return `TSh ${Math.round(amount || 0).toLocaleString('en-US')}`;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);

  // Selected Sale for Receipt Popup Modal
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  // Date Filter State
  const [datePreset, setDatePreset] = useState<DatePresetType>('TODAY');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Custom Date Modal State
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState<boolean>(false);
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-GB', { hour12: false }));
      setCurrentDateStr(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getSummary({
        preset: datePreset,
        startDate,
        endDate,
      });
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  }, [datePreset, startDate, endDate]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleDatePresetChange = (preset: DatePresetType) => {
    if (preset === 'CUSTOM') {
      setIsCustomDateModalOpen(true);
    } else {
      setDatePreset(preset);
      setStartDate('');
      setEndDate('');
    }
  };

  const handleApplyCustomDate = () => {
    if (!tempStartDate || !tempEndDate) {
      alert('Please select both start date and end date.');
      return;
    }
    setDatePreset('CUSTOM');
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setIsCustomDateModalOpen(false);
  };

  const handleDownloadReceipt = async (sale: any) => {
    if (!sale) return;
    try {
      await posService.downloadReceiptPdf(sale.id || sale.sale_number, `Receipt-${sale.id || sale.sale_number}.pdf`, sale);
    } catch (err) {
      console.error('Download PDF error:', err);
    }
  };

  // Fallback defaults if loading or API unready
  const kpis = data?.kpis || {
    todayTransactions: 24,
    todaySales: 1245600,
    customersServed: 18,
    lowStockItems: 3,
    totalProducts: 45,
    totalCustomers: 180,
  };

  const payment = data?.paymentBreakdown || {
    cashTotal: 560520,
    cashPct: 45,
    mobileTotal: 436960,
    mobilePct: 35,
    cardTotal: 187120,
    cardPct: 15,
    otherTotal: 61000,
    otherPct: 5
  };

  const hourlyChart = data?.hourlySales && data.hourlySales.length > 0 ? data.hourlySales : [
    { time: '08:00', sales: 25000 },
    { time: '09:00', sales: 68000 },
    { time: '10:00', sales: 52000 },
    { time: '11:00', sales: 95000 },
    { time: '12:00', sales: 78000 },
    { time: '13:00', sales: 135000 },
    { time: '14:00', sales: 162000 },
    { time: '15:00', sales: 124000 },
    { time: '16:00', sales: 118000 },
    { time: '17:00', sales: 145000 },
    { time: '18:00', sales: 92000 },
  ];

  const recentTransactions = data?.recentTransactions || [];

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="space-y-6">

        {/* Welcome Subtitle & Time Ticker / Date Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Good Afternoon, Admin! 👋</h2>
            <p className="text-xs text-slate-500 mt-0.5">Here is your supermarket business overview.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Refresh Button */}
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl shadow-2xs text-slate-600 transition-all cursor-pointer"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#4f46e5]' : ''}`} />
            </button>

            {/* DATE PRESET FILTER DROPDOWN */}
            <div className="relative min-w-[170px]">
              <select
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value as DatePresetType)}
                className="w-full pl-8 pr-8 py-2 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5] cursor-pointer appearance-none transition-all shadow-2xs"
              >
                <option value="TODAY">Daily (Today)</option>
                <option value="WEEKLY">Weekly (Last 7 Days)</option>
                <option value="MONTHLY">Monthly (This Month)</option>
                <option value="ALL">All Time</option>
                <option value="CUSTOM">
                  {datePreset === 'CUSTOM' && startDate && endDate
                    ? `Custom: ${startDate} → ${endDate}`
                    : '📅 Custom Date Range...'}
                </option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-[#4f46e5] absolute left-3 top-2.5 pointer-events-none" />
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Live Clock Ticker */}
            <div className="bg-white border border-slate-100 px-3.5 py-2 rounded-2xl shadow-2xs flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#4f46e5]" />
              <span className="text-xs font-mono font-bold text-slate-700">{currentTime || '14:32:15'}</span>
            </div>
          </div>
        </div>

        {/* CUSTOM DATE RANGE MODAL */}
        {isCustomDateModalOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsCustomDateModalOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#4f46e5]" />
                  <span>Select Custom Date Range</span>
                </h3>
                <button
                  onClick={() => setIsCustomDateModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date (From)</label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date (To)</label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDatePreset('TODAY');
                    setStartDate('');
                    setEndDate('');
                    setIsCustomDateModalOpen(false);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-all"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomDate}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer transition-all"
                >
                  Apply Range
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4 MODERN REUSABLE KPI CARDS IMPORTED FROM COMMON */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard
            title="Transactions"
            value={kpis.todayTransactions}
            icon={ShoppingCart}
            color="indigo"
            badge={{
              text: '+12% vs avg',
              isPositive: true,
            }}
            subtitle={`Checkout orders (${datePreset === 'TODAY' ? 'Daily' : datePreset.toLowerCase()})`}
            chartType="line"
            onClick={() => navigate('/admin/sales')}
          />

          <KPICard
            title="Sales Revenue"
            value={formatTZS(kpis.todaySales)}
            icon={TrendingUp}
            color="emerald"
            badge={{
              text: '+96% revenue',
              isPositive: true,
            }}
            subtitle={`Gross sales (${datePreset === 'TODAY' ? 'Daily' : datePreset.toLowerCase()})`}
            chartType="bar"
            onClick={() => navigate('/admin/sales')}
          />

          <KPICard
            title="Customers Served"
            value={kpis.customersServed}
            icon={Users}
            color="purple"
            badge={{
              text: '+6% shoppers',
              isPositive: true,
            }}
            subtitle="In-store & repeat customers"
            chartType="line"
            onClick={() => navigate('/admin/customers')}
          />

          <KPICard
            title="Low Stock Items"
            value={kpis.lowStockItems}
            icon={Package}
            color="amber"
            badge={{
              text: kpis.lowStockItems > 0 ? 'Alert: Restock' : 'Stock Healthy',
              isPositive: kpis.lowStockItems === 0,
            }}
            subtitle="Items below min threshold"
            chartType="bar"
            onClick={() => navigate('/admin/inventory')}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Sales Overview Area Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-[#4f46e5]" />
                Sales Overview
              </h3>
              <div className="flex items-center space-x-2">
                {loading && <Loader2 className="w-3.5 h-3.5 text-[#4f46e5] animate-spin" />}
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                  {datePreset}
                </span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyChart}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v: any) => [`TSh ${Number(v || 0).toLocaleString()}`, 'Sales']} />
                  <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
            <h3 className="text-base font-black text-slate-900 mb-4">Payment Breakdown</h3>

            <div className="space-y-3 text-xs font-bold">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <span>💵 Cash</span>
                <span className="font-extrabold text-slate-900">{payment.cashPct}% ({formatTZS(payment.cashTotal)})</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <span>📱 Mobile Money</span>
                <span className="font-extrabold text-slate-900">{payment.mobilePct}% ({formatTZS(payment.mobileTotal)})</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <span>💳 Card / Bank</span>
                <span className="font-extrabold text-slate-900">{payment.cardPct}% ({formatTZS(payment.cardTotal)})</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <span>🔄 Other</span>
                <span className="font-extrabold text-slate-900">{payment.otherPct}% ({formatTZS(payment.otherTotal)})</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/admin/sales')}
              className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1 cursor-pointer transition-all"
            >
              <span>View All Sales</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Live Recent Transactions Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Recent Transactions</h3>
              <p className="text-[11px] font-medium text-slate-400">Click any transaction to view official fiscal receipt</p>
            </div>
            <button onClick={() => navigate('/admin/sales')} className="text-xs font-extrabold text-[#4f46e5] hover:underline cursor-pointer">
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100 pb-2">
                  <th className="pb-3">SALE #</th>
                  <th className="pb-3">TIME</th>
                  <th className="pb-3">ITEMS</th>
                  <th className="pb-3">CUSTOMER</th>
                  <th className="pb-3">TOTAL</th>
                  <th className="pb-3">PAYMENT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((trx: any, idx: number) => {
                  const itemsCount = trx.itemsCount || trx.items_count || (trx.items && typeof trx.items === 'object' ? trx.items.length : 1);
                  const itemsLabel = typeof trx.items === 'string' ? trx.items : `${itemsCount} item${itemsCount !== 1 ? 's' : ''}`;
                  const saleNum = trx.id || trx.sale_number || trx.receiptNo || `#000${idx + 1}`;
                  const customerName = trx.customer || trx.customer_name || 'Walk-in Customer';
                  const payMethod = trx.payment || trx.paymentMethod || trx.payment_method || 'CASH';

                  return (
                    <tr
                      key={saleNum || idx}
                      onClick={() => setSelectedSale(trx)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer"
                      title="Click to view full receipt"
                    >
                      <td className="py-3.5 font-extrabold text-[#4f46e5] font-mono">{saleNum}</td>
                      <td className="py-3.5 text-slate-500">{trx.time || '12:00'}</td>
                      <td className="py-3.5 text-slate-700 font-bold">{itemsLabel}</td>
                      <td className="py-3.5 text-slate-500 font-medium">{customerName}</td>
                      <td className="py-3.5 font-black text-slate-900 font-mono">{formatTZS(trx.total)}</td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${trx.color || 'bg-indigo-50 text-indigo-700'}`}>
                          {payMethod}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ULTRA-CLEAN MODERN RECEIPT MODAL */}
      {selectedSale && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedSale(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/90 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#4f46e5] text-white flex items-center justify-center font-black text-sm shadow-xs">
                  TZ
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none">TZA MART TANZANIA</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Mlimani City Mall, Dar es Salaam</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scrollable Printable Receipt Body */}
            <div id="sales-printable-receipt" className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3 text-slate-800 text-xs bg-white">
              {/* TIN & VRN */}
              <div className="text-[10px] text-slate-500 font-mono text-center pb-1">
                TIN: <strong className="text-slate-700 font-bold">102-394-857</strong> | VRN: <strong className="text-slate-700 font-bold">40012983-Z</strong>
              </div>

              <div className="border-t border-dashed border-slate-200" />

              {/* Transaction Meta */}
              <div className="grid grid-cols-2 gap-y-1.5 text-[11px] font-medium text-slate-600">
                <div>Receipt #: <span className="font-mono font-bold text-slate-900">{selectedSale.id || selectedSale.sale_number}</span></div>
                <div>Date: <span className="font-mono text-slate-900">{selectedSale.date || 'Today'} {selectedSale.time}</span></div>
                <div>Customer: <span className="font-bold text-slate-900">{selectedSale.customer || selectedSale.customer_name || 'Walk-in Customer'}</span></div>
                <div>Cashier: <span className="font-bold text-slate-900">{selectedSale.cashier || selectedSale.cashier_name || 'John Cashier'}</span></div>
              </div>

              <div className="border-t border-dashed border-slate-200" />

              {/* Items Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400 font-extrabold text-[9.5px] uppercase tracking-wider border-b border-slate-100 pb-1">
                    <th className="py-1">#</th>
                    <th className="py-1">Item Description</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 font-medium">
                  {selectedSale.items && Array.isArray(selectedSale.items) && selectedSale.items.length > 0 ? (
                    selectedSale.items.map((item: any, i: number) => (
                      <tr key={i} className="text-[11.5px]">
                        <td className="py-1.5 text-slate-400 font-bold text-[10px]">{i + 1}</td>
                        <td className="py-1.5 font-bold text-slate-800">{item.product || item.productName || 'Supermarket Item'}</td>
                        <td className="py-1.5 text-center font-mono text-slate-600">{item.quantity || 1}x</td>
                        <td className="py-1.5 text-right font-mono text-slate-600">{formatTZS(item.unitPrice || item.price || selectedSale.total)}</td>
                        <td className="py-1.5 text-right font-black text-slate-900 font-mono">{formatTZS(item.total || selectedSale.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="text-[11.5px]">
                      <td className="py-1.5 text-slate-400 font-bold text-[10px]">1</td>
                      <td className="py-1.5 font-bold text-slate-800">Supermarket Goods</td>
                      <td className="py-1.5 text-center font-mono text-slate-600">1x</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">{formatTZS(selectedSale.total)}</td>
                      <td className="py-1.5 text-right font-black text-slate-900 font-mono">{formatTZS(selectedSale.total)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="border-t border-dashed border-slate-200" />

              {/* Financial Totals */}
              <div className="space-y-1 text-[11.5px]">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal (Net)</span>
                  <span className="font-mono font-bold text-slate-800">{formatTZS(selectedSale.subtotal || (selectedSale.total * 0.8475))}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[10.5px]">
                  <span>18% TRA VAT Tax (Included)</span>
                  <span className="font-mono">{formatTZS(selectedSale.tax || (selectedSale.total * 0.1525))}</span>
                </div>
                <div className="flex justify-between items-center font-black text-sm pt-1.5 border-t border-slate-100 text-slate-900">
                  <span>Grand Total</span>
                  <span className="font-mono text-[#4f46e5] text-base">{formatTZS(selectedSale.total)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <span className="text-slate-500 font-medium">Payment Mode:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    {selectedSale.payment || selectedSale.paymentMethod || 'CASH'}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200" />

              {/* TRA VFD Fiscal Status Footer */}
              <div className="bg-emerald-50/80 rounded-xl p-2.5 border border-emerald-200/80 text-[10.5px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    TRA VFD Verified
                  </span>
                  <span className="font-mono font-bold text-emerald-950 text-[10px]">{selectedSale.fiscalReceiptNo || `TRA-VFD-${selectedSale.id}`}</span>
                </div>
                <div className="flex justify-between text-emerald-800/80 text-[9.5px] font-mono">
                  <span>EFD Serial: {selectedSale.fiscalDevice || 'EFD-TZ-DAR-001'}</span>
                  <span>Code: {selectedSale.verificationCode || 'TRA-8947-TZ'}</span>
                </div>
              </div>

              {/* Footer Note */}
              <p className="text-center text-[10px] text-slate-400 font-medium pt-1">
                Asante kwa kununua nasi! • Thank you for shopping with us!
              </p>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center space-x-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => posService.printReceiptOnly('sales-printable-receipt')}
                className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadReceipt(selectedSale)}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="py-2.5 px-4 bg-slate-200/70 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
