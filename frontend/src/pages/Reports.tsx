import { useState } from 'react';
import {
  AlertTriangle, ShieldCheck, Clock3,
  TrendingUp, DollarSign, ShoppingBag, Package,
  CreditCard, Smartphone, Banknote, Calendar,
  Search, Filter, CheckCircle2, FileSpreadsheet,
  BarChart3, Sparkles, Layers,
  Wallet
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import AdminLayout from '../components/AdminLayout';
import { KPICard, Pagination } from '../components/common';

// Mock chart data
const salesTrendData = [
  { date: '17 Dec', revenue: 420000, orders: 18 },
  { date: '18 Dec', revenue: 680000, orders: 26 },
  { date: '19 Dec', revenue: 510000, orders: 22 },
  { date: '20 Dec', revenue: 890000, orders: 34 },
  { date: '21 Dec', revenue: 1120000, orders: 45 },
  { date: '22 Dec', revenue: 940000, orders: 38 },
  { date: '23 Dec', revenue: 1245600, orders: 48 },
];

const categoryValuationData = [
  { category: 'Groceries', value: 850000, items: 68 },
  { category: 'Beverages', value: 420000, items: 42 },
  { category: 'Dairy & Eggs', value: 180000, items: 24 },
  { category: 'Fresh Produce', value: 240000, items: 30 },
  { category: 'Personal Care', value: 310000, items: 35 },
];

const lowStockChartData = [
  { name: 'Mo Sunflower Oil', current: 8, min: 30, deficit: 22 },
  { name: 'Serengeti Lager', current: 12, min: 40, deficit: 28 },
  { name: 'Colgate Toothpaste', current: 14, min: 50, deficit: 36 },
  { name: 'Tanga Fresh Milk', current: 0, min: 25, deficit: 25 },
];

const paymentPieData = [
  { name: 'Cash', value: 560520, count: 48, color: '#4f46e5' },
  { name: 'M-Pesa', value: 290000, count: 22, color: '#16a34a' },
  { name: 'Airtel Money', value: 146960, count: 12, color: '#dc2626' },
  { name: 'Mixx by Yas', value: 85000, count: 6, color: '#ea580c' },
  { name: 'CRDB / NMB Card', value: 187120, count: 14, color: '#8b5cf6' },
  { name: 'HaloPesa', value: 35000, count: 3, color: '#f59e0b' },
];

export type ReportTab = 'sales' | 'inventory' | 'lowstock' | 'payments' | 'fiscalization';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('LAST_7_DAYS');
  const [cashierFilter, setCashierFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');

  // Pagination for tables
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatTZS = (val: number) => `TSh ${val.toLocaleString()}`;

  // Tab 1: Sales Report Mock Data
  const salesTableData = [
    { saleNo: 'SALE-TZ-2026-00024', date: '2024-12-23 14:31', cashier: 'John Masawe', customer: 'Walk-in Customer', payment: 'CASH', total: 24500, fiscal: 'SUCCESS' },
    { saleNo: 'SALE-TZ-2026-00023', date: '2024-12-23 14:28', cashier: 'Amina Salum', customer: 'Walk-in Customer', payment: 'MOBILE MONEY (M-Pesa)', total: 8000, fiscal: 'SUCCESS' },
    { saleNo: 'SALE-TZ-2026-00022', date: '2024-12-23 14:25', cashier: 'John Masawe', customer: 'Juma Rashid', payment: 'CARD / BANK (CRDB)', total: 63500, fiscal: 'PENDING' },
    { saleNo: 'SALE-TZ-2026-00021', date: '2024-12-23 14:22', cashier: 'Amina Salum', customer: 'Walk-in Customer', payment: 'CASH', total: 18700, fiscal: 'SUCCESS' },
    { saleNo: 'SALE-TZ-2026-00020', date: '2024-12-23 14:19', cashier: 'John Masawe', customer: 'Amina Salum (VIP)', payment: 'MOBILE MONEY (Airtel)', total: 42000, fiscal: 'PENDING' },
    { saleNo: 'SALE-TZ-2026-00019', date: '2024-12-22 17:45', cashier: 'Peter Karia', customer: 'Godfrey Masawe', payment: 'MOBILE MONEY (Mixx)', total: 85000, fiscal: 'SUCCESS' },
  ];

  // Tab 2: Inventory Report Mock Data
  const inventoryTableData = [
    { product: 'Kilimanjaro Drinking Water (1.5L)', sku: 'BEV-KIL-15', category: 'Beverages', currentStock: 145, minStock: 50, buying: 600, selling: 1000, stockVal: 87000, status: 'IN STOCK' },
    { product: 'Azam Wheat Flour (2kg)', sku: 'GRO-AZA-02', category: 'Groceries', currentStock: 85, minStock: 30, buying: 2100, selling: 2800, stockVal: 178500, status: 'IN STOCK' },
    { product: 'Serengeti Premium Lager (500ml)', sku: 'BEV-SER-01', category: 'Beverages', currentStock: 12, minStock: 40, buying: 1800, selling: 2500, stockVal: 21600, status: 'LOW STOCK' },
    { product: 'Tanga Fresh Milk (1L)', sku: 'DYE-MIL-01', category: 'Dairy & Eggs', currentStock: 0, minStock: 25, buying: 1600, selling: 2200, stockVal: 0, status: 'OUT OF STOCK' },
    { product: 'Mo Sunflower Cooking Oil (5L)', sku: 'GRO-OIL-05', category: 'Groceries', currentStock: 8, minStock: 30, buying: 27000, selling: 34000, stockVal: 216000, status: 'LOW STOCK' },
    { product: 'Colgate Toothpaste', sku: 'PCR-COL-01', category: 'Personal Care', currentStock: 14, minStock: 50, buying: 3000, selling: 4500, stockVal: 42000, status: 'LOW STOCK' },
  ];

  // Tab 5: Fiscalization Report Data
  const fiscalData = [
    { receiptNo: 'TZ-VFD-2026-00024', saleNo: 'SALE-TZ-2026-00024', device: 'EFD-TZ-DAR-001', zNo: 'Z-2026-0930-01', amount: 24500, status: 'SUCCESS', verify: 'TRA-VFD-98421-TZ' },
    { receiptNo: 'TZ-VFD-2026-00023', saleNo: 'SALE-TZ-2026-00023', device: 'EFD-TZ-DAR-001', zNo: 'Z-2026-0930-01', amount: 8000, status: 'SUCCESS', verify: 'TRA-VFD-98420-TZ' },
    { receiptNo: 'QUEUED-VFD', saleNo: 'SALE-TZ-2026-00022', device: 'EFD-TZ-DAR-001', zNo: 'Z-2026-0930-01', amount: 63500, status: 'PENDING', verify: 'QUEUED-TRA' },
    { receiptNo: 'TZ-VFD-2026-00021', saleNo: 'SALE-TZ-2026-00021', device: 'EFD-TZ-DAR-001', zNo: 'Z-2026-0930-01', amount: 18700, status: 'SUCCESS', verify: 'TRA-VFD-98418-TZ' },
    { receiptNo: 'QUEUED-VFD', saleNo: 'SALE-TZ-2026-00020', device: 'EFD-TZ-DAR-001', zNo: 'Z-2026-0930-01', amount: 42000, status: 'PENDING', verify: 'QUEUED-TRA' },
  ];

  const handleExportCSV = (reportName: string) => {
    showToast(`Exporting ${reportName} report to CSV...`);
  };

  // RENDER DYNAMIC 4 KPI CARDS SPECIFIC TO THE ACTIVE TAB
  const renderDynamicKPICards = () => {
    switch (activeTab) {
      case 'sales':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-in fade-in duration-200">
            <KPICard
              title="Total Period Revenue"
              value="TSh 5,805,600"
              icon={DollarSign}
              color="emerald"
              badge={{
                text: '+18.4% vs last week',
                isPositive: true,
              }}
              subtitle="Gross store sales turnover"
              chartType="bar"
            />
            <KPICard
              title="Total Orders"
              value="231 Sales"
              icon={ShoppingBag}
              color="blue"
              badge={{
                text: '+12 orders today',
                isPositive: true,
              }}
              subtitle="Completed register checkouts"
              chartType="line"
            />
            <KPICard
              title="Avg Order Value (AOV)"
              value="TSh 25,132"
              icon={TrendingUp}
              color="purple"
              badge={{
                text: 'Across 6 cashiers',
                isPositive: true,
              }}
              subtitle="Avg spend per customer receipt"
              chartType="line"
            />
            <KPICard
              title="Peak Sales Day"
              value="23 Dec (1.24M)"
              icon={Sparkles}
              color="amber"
              badge="48 Orders peak"
              subtitle="Highest revenue shift"
              chartType="bar"
            />
          </div>
        );

      case 'inventory':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-in fade-in duration-200">
            <KPICard
              title="Total Stock Valuation"
              value="TSh 2,154,600"
              icon={DollarSign}
              color="emerald"
              badge={{
                text: '+4.2% stock value',
                isPositive: true,
              }}
              subtitle="Gross inventory asset valuation"
              chartType="bar"
            />
            <KPICard
              title="Total Active SKUs"
              value="240 Products"
              icon={Package}
              color="blue"
              badge={{
                text: 'Across 5 categories',
                isPositive: true,
              }}
              subtitle="Catalog items on shelves"
              chartType="line"
            />
            <KPICard
              title="In-Stock Health"
              value="94.2%"
              icon={ShieldCheck}
              color="purple"
              badge={{
                text: '226 healthy SKUs',
                isPositive: true,
              }}
              subtitle="Optimal inventory availability"
              chartType="line"
            />
            <KPICard
              title="Top Valued Category"
              value="Groceries"
              icon={Layers}
              color="amber"
              badge="TSh 850,000 (68 SKUs)"
              subtitle="Highest inventory allocation"
              chartType="bar"
            />
          </div>
        );

      case 'lowstock':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-in fade-in duration-200">
            <KPICard
              title="Critical Out of Stock"
              value="1 Product"
              icon={AlertTriangle}
              color="rose"
              badge={{
                text: 'Immediate reorder',
                isPositive: false,
              }}
              subtitle="Tanga Fresh Milk (0 units left)"
              chartType="bar"
            />
            <KPICard
              title="Low Stock Warnings"
              value="3 Products"
              icon={AlertTriangle}
              color="amber"
              badge={{
                text: 'Below minimum safety',
                isPositive: false,
              }}
              subtitle="Oil, Lager, Toothpaste"
              chartType="bar"
            />
            <KPICard
              title="Restock Cost Needed"
              value="TSh 485,000"
              icon={DollarSign}
              color="purple"
              badge="Budget estimate"
              subtitle="Required to hit safety stock"
              chartType="line"
            />
            <KPICard
              title="Stock Health Index"
              value="88.0%"
              icon={ShieldCheck}
              color="blue"
              badge="4 SKUs need attention"
              subtitle="Overall catalog fulfillment"
              chartType="line"
            />
          </div>
        );

      case 'payments':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-in fade-in duration-200">
            <KPICard
              title="Cash Collections"
              value="TSh 560,520"
              icon={Banknote}
              color="emerald"
              badge={{
                text: '48 Transactions (43%)',
                isPositive: true,
              }}
              subtitle="Direct physical register cash"
              chartType="bar"
            />
            <KPICard
              title="Mobile Money Total"
              value="TSh 556,960"
              icon={Smartphone}
              color="blue"
              badge={{
                text: 'M-Pesa, Airtel, Mixx, Halo',
                isPositive: true,
              }}
              subtitle="43 transactions processed"
              chartType="line"
            />
            <KPICard
              title="Card / Bank POS"
              value="TSh 187,120"
              icon={CreditCard}
              color="purple"
              badge={{
                text: 'CRDB & NMB Bank',
                isPositive: true,
              }}
              subtitle="14 debit/credit card sales"
              chartType="line"
            />
            <KPICard
              title="Total Channel Volume"
              value="TSh 1,304,600"
              icon={Wallet}
              color="amber"
              badge="105 Completed Txns"
              subtitle="All payment gateways synced"
              chartType="bar"
            />
          </div>
        );

      case 'fiscalization':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-in fade-in duration-200">
            <KPICard
              title="TRA Synced Receipts"
              value="42 Receipts"
              icon={ShieldCheck}
              color="emerald"
              badge={{
                text: '100% Tax Compliant',
                isPositive: true,
              }}
              subtitle="Successfully transmitted to TRA"
              chartType="bar"
            />
            <KPICard
              title="Pending In Queue"
              value="6 Receipts"
              icon={Clock3}
              color="amber"
              badge={{
                text: 'Auto-syncing',
                isPositive: true,
              }}
              subtitle="Queued in local EFD device"
              chartType="line"
            />
            <KPICard
              title="TRA 18% VAT Tax"
              value="TSh 885,500"
              icon={DollarSign}
              color="purple"
              badge="Ready for monthly filing"
              subtitle="Official VAT revenue collected"
              chartType="bar"
            />
            <KPICard
              title="Compliance Sync Rate"
              value="87.5%"
              icon={CheckCircle2}
              color="blue"
              badge="42/48 Orders Synced"
              subtitle="EFD middleware status: ONLINE"
              chartType="line"
            />
          </div>
        );
    }
  };

  return (
    <AdminLayout title="Reports & Analytics">
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
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Reports & Business Intelligence</h2>
            <p className="text-xs text-slate-500 font-medium">Revenue trends, category stock valuation, payment channel distribution, and TRA VFD audit</p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto flex-shrink-0">
            <button
              onClick={() => handleExportCSV(activeTab.toUpperCase())}
              className="px-4 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export {activeTab.toUpperCase()} CSV</span>
            </button>
          </div>
        </div>

        {/* REPORT TAB NAVIGATION (SWITCHES REPORT & KPI CARDS) */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-2 sm:p-2.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: 'sales', label: 'Sales Report', icon: BarChart3 },
              { id: 'inventory', label: 'Inventory Valuation', icon: Package },
              { id: 'lowstock', label: 'Low Stock Report', icon: AlertTriangle },
              { id: 'payments', label: 'Payment Channels', icon: CreditCard },
              { id: 'fiscalization', label: 'TRA Fiscalization', icon: ShieldCheck },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as ReportTab); setCurrentPage(1); }}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${isActive
                    ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100'
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 DYNAMIC WHITE GLASSMORPHISM KPI CARDS ROW (AUTOMATICALLY UPDATES PER TAB) */}
        {renderDynamicKPICards()}

        {/* ===================== TAB 1: SALES REPORT ===================== */}
        {activeTab === 'sales' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Sales Revenue Trend Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Revenue Growth Trend (TSh)</h3>
                    <p className="text-xs text-slate-500 font-medium">Daily supermarket gross turnover breakdown</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-[#4f46e5] border border-indigo-100 rounded-xl text-xs font-bold">
                    Last 7 Days
                  </span>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrendData}>
                      <defs>
                        <linearGradient id="reportsSalesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip formatter={(v: any) => [`TSh ${Number(v || 0).toLocaleString()}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fill="url(#reportsSalesGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Orders Volume Bar Chart */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Orders Volume</h3>
                  <p className="text-xs text-slate-500 font-medium">Completed register checkouts per day</p>
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip formatter={(v: any) => [`${v} orders`, 'Transactions']} />
                      <Bar dataKey="orders" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* SEPARATE FILTER BAR CARD */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3.5 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sales report by number or cashier..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                  />
                </div>

                <div className="relative min-w-[150px]">
                  <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none"
                  >
                    <option value="LAST_7_DAYS">Last 7 Days</option>
                    <option value="TODAY">Today</option>
                    <option value="THIS_MONTH">This Month</option>
                    <option value="ALL">All Time</option>
                  </select>
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>

                <div className="relative min-w-[140px]">
                  <select
                    value={cashierFilter}
                    onChange={(e) => setCashierFilter(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none"
                  >
                    <option value="ALL">All Cashiers</option>
                    <option value="John Masawe">John Masawe</option>
                    <option value="Amina Salum">Amina Salum</option>
                    <option value="Peter Karia">Peter Karia</option>
                  </select>
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>

                <div className="relative min-w-[150px]">
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none"
                  >
                    <option value="ALL">All Payments</option>
                    <option value="CASH">CASH</option>
                    <option value="MOBILE MONEY">MOBILE MONEY</option>
                    <option value="CARD / BANK">CARD / BANK</option>
                  </select>
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* SEPARATE TABLE CARD */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-100/80">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-slate-500 font-bold border-b border-slate-200/90 text-xs tracking-wider bg-slate-50/80 whitespace-nowrap">
                      <th className="py-3.5 px-5 uppercase whitespace-nowrap">SALE NUMBER</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">DATE & TIME</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">CASHIER</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">CUSTOMER</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">PAYMENT METHOD</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">AMOUNT</th>
                      <th className="py-3.5 px-5 uppercase whitespace-nowrap text-right">FISCAL STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/90">
                    {salesTableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/25 transition-colors">
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50/90 text-[#4f46e5] font-mono font-bold text-xs border border-indigo-100/80 inline-block shadow-xs">
                            {row.saleNo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                          {row.date}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs font-bold text-slate-800">
                          {row.cashier}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-700">
                          {row.customer}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs border border-slate-200/80 inline-block shadow-xs">
                            {row.payment}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-slate-900">
                          <span className="text-sm">{formatTZS(row.total)}</span>
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] shadow-xs border ${row.fiscal === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                            : 'bg-amber-50 text-amber-700 border-amber-200/70'
                            }`}>
                            {row.fiscal === 'SUCCESS' ? <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" /> : <Clock3 className="w-3 h-3 mr-1 text-amber-600" />}
                            {row.fiscal === 'SUCCESS' ? 'TRA Synced' : 'TRA Queued'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex-shrink-0 pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={1}
                  totalItems={salesTableData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  itemLabel="sales records"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: INVENTORY REPORT ===================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Category Valuation Bar Chart */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Inventory Valuation by Category</h3>
                  <p className="text-xs text-slate-500 font-medium">Total stock value in Tanzanian Shillings (TSh)</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-extrabold">
                  Total Valuation: TSh 2,154,600
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryValuationData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(v: any) => [`TSh ${Number(v || 0).toLocaleString()}`, 'Valuation']} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SEPARATE FILTER BAR */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3.5 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative min-w-[170px]">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Dairy & Eggs">Dairy & Eggs</option>
                    <option value="Personal Care">Personal Care</option>
                  </select>
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>

                <div className="relative min-w-[170px]">
                  <select
                    value={stockStatusFilter}
                    onChange={(e) => setStockStatusFilter(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none"
                  >
                    <option value="ALL">All Stock Statuses</option>
                    <option value="IN STOCK">IN STOCK</option>
                    <option value="LOW STOCK">LOW STOCK</option>
                    <option value="OUT OF STOCK">OUT OF STOCK</option>
                  </select>
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* INVENTORY TABLE CARD */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-100/80">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-slate-500 font-bold border-b border-slate-200/90 text-xs tracking-wider bg-slate-50/80 whitespace-nowrap">
                      <th className="py-3.5 px-5 uppercase whitespace-nowrap">PRODUCT INFO</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">CATEGORY</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">CURRENT STOCK</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">BUYING PRICE</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">SELLING PRICE</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">STOCK VALUATION</th>
                      <th className="py-3.5 px-5 uppercase whitespace-nowrap text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/90">
                    {inventoryTableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/25 transition-colors">
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <p className="font-bold text-slate-900 text-xs">{row.product}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{row.sku}</p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                          {row.category}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs font-bold text-slate-900">
                          {row.currentStock} units
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                          {formatTZS(row.buying)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs font-bold text-slate-900">
                          {formatTZS(row.selling)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[#4f46e5]">
                          <span className="text-sm">{formatTZS(row.stockVal)}</span>
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] shadow-xs border ${row.status === 'IN STOCK'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                            : row.status === 'LOW STOCK'
                              ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                              : 'bg-rose-50 text-rose-700 border-rose-200/70'
                            }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex-shrink-0 pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={1}
                  totalItems={inventoryTableData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  itemLabel="inventory items"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: LOW STOCK REPORT ===================== */}
        {activeTab === 'lowstock' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-center space-x-3 text-amber-900 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-xs font-medium">
                The following products have reached or fallen below their configured minimum safety stock threshold. Immediate supplier reorder recommended.
              </p>
            </div>

            {/* Low Stock Deficit Bar Chart */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-black text-slate-900">Critical Stock Deficit Comparison</h3>
              <p className="text-xs text-slate-500 font-medium">Current on-hand inventory vs Minimum safety threshold</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lowStockChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="current" name="Current Stock" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="min" name="Minimum Required" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* LOW STOCK TABLE */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-100/80">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-slate-500 font-bold border-b border-slate-200/90 text-xs tracking-wider bg-slate-50/80 whitespace-nowrap">
                      <th className="py-3.5 px-5 uppercase whitespace-nowrap">PRODUCT INFO</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">CATEGORY</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">CURRENT STOCK</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">MIN STOCK</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">DEFICIT</th>
                      <th className="py-3.5 px-5 uppercase whitespace-nowrap text-right">SEVERITY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/90">
                    {inventoryTableData.filter(i => i.status !== 'IN STOCK').map((row, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/25 transition-colors">
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <p className="font-bold text-slate-900 text-xs">{row.product}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{row.sku}</p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                          {row.category}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs font-bold text-rose-600">
                          {row.currentStock} units
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                          {row.minStock} units
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs font-extrabold text-slate-900">
                          -{row.minStock - row.currentStock}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] shadow-xs border ${row.currentStock === 0
                            ? 'bg-rose-50 text-rose-700 border-rose-200/70'
                            : 'bg-amber-50 text-amber-700 border-amber-200/70'
                            }`}>
                            {row.currentStock === 0 ? 'CRITICAL (Out of Stock)' : 'WARNING (Low Stock)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: PAYMENT CHANNELS ===================== */}
        {activeTab === 'payments' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Donut Chart Card */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6 flex flex-col items-center justify-center space-y-4">
                <div className="self-start">
                  <h3 className="text-base font-black text-slate-900">Payment Distribution</h3>
                  <p className="text-xs text-slate-500 font-medium">Share of total supermarket cash and mobile revenue</p>
                </div>

                <div className="h-60 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {paymentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`TSh ${Number(val || 0).toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Breakdown Cards */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {paymentPieData.map((pm, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-2 hover:border-indigo-200 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: pm.color }} />
                        <span className="text-xs font-bold text-slate-800">{pm.name}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[11px] font-bold text-slate-600">
                        {pm.count} txns
                      </span>
                    </div>
                    <p className="text-xl font-black text-slate-900">{formatTZS(pm.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: TRA FISCALIZATION ===================== */}
        {activeTab === 'fiscalization' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* FISCALIZATION TABLE CARD */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-100/80">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-slate-500 font-bold border-b border-slate-200/90 text-xs tracking-wider bg-slate-50/80 whitespace-nowrap">
                      <th className="py-3.5 px-5 uppercase whitespace-nowrap">FISCAL RECEIPT NO</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">SALE NUMBER</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">DEVICE ID</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">Z NUMBER</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">AMOUNT (TZS)</th>
                      <th className="py-3.5 px-4 uppercase whitespace-nowrap">VERIFICATION</th>
                      <th className="py-3.5 px-5 uppercase whitespace-nowrap text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/90">
                    {fiscalData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/25 transition-colors">
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50/90 text-[#4f46e5] font-mono font-bold text-xs border border-indigo-100/80 inline-block shadow-xs">
                            {row.receiptNo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-700 font-medium">
                          {row.saleNo}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                          {row.device}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                          {row.zNo}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-slate-900">
                          <span className="text-sm">{formatTZS(row.amount)}</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs font-mono text-slate-600">
                          {row.verify}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] shadow-xs border ${row.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                            : 'bg-amber-50 text-amber-700 border-amber-200/70'
                            }`}>
                            {row.status === 'SUCCESS' ? <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" /> : <Clock3 className="w-3 h-3 mr-1 text-amber-600" />}
                            {row.status === 'SUCCESS' ? 'TRA Synced' : 'TRA Queued'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex-shrink-0 pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={1}
                  totalItems={fiscalData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  itemLabel="fiscal records"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
