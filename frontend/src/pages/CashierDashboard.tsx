import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, LogOut, DollarSign, CreditCard,
  Menu, Calendar, Clock,
  LayoutDashboard, LayoutGrid, Package, Warehouse, History, Users, Settings, ArrowRight,
  Store, Box, Activity, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import posService from '../services/posService';
import { inventoryService } from '../services/inventoryService';

// Dedicated Modular Cashier Components
import CashierPOSView from '../components/cashier/CashierPOSView';
import CashierProductsView from '../components/cashier/CashierProductsView';
import CashierCategoriesView from '../components/cashier/CashierCategoriesView';
import CashierInventoryView from '../components/cashier/CashierInventoryView';
import CashierSalesView from '../components/cashier/CashierSalesView';
import CashierCustomersView from '../components/cashier/CashierCustomersView';
import CashierSettingsView from '../components/cashier/CashierSettingsView';

const hourlySalesData = [
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

export default function CashierDashboard() {
  const navigate = useNavigate();

  // Active View Tab ('dashboard' | 'pos' | 'categories' | 'products' | 'inventory' | 'sales' | 'customers' | 'settings')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'categories' | 'products' | 'inventory' | 'sales' | 'customers' | 'settings'>('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [externalCartProduct, setExternalCartProduct] = useState<any>(null);

  // Live Clock State
  const [currentTime, setCurrentTime] = useState<string>('12:58:50');

  // Dashboard Live Stats
  const [dashboardStats, setDashboardStats] = useState({
    todayTransactions: 24,
    todaySales: 1245600,
    customersServed: 18,
    lowStockCount: 3,
  });
  const [dashboardRecentTransactions, setDashboardRecentTransactions] = useState<any[]>([]);

  // Fetch Dashboard live sales stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      const [salesRes, invRes] = await Promise.all([
        posService.getSales({ limit: 10, dateFilter: 'ALL' }).catch(() => null),
        inventoryService.getInventoryStats().catch(() => null)
      ]);

      if (salesRes && salesRes.sales) {
        const totalSalesAmt = salesRes.stats?.totalRevenue || salesRes.sales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
        setDashboardStats({
          todayTransactions: salesRes.sales.length,
          todaySales: totalSalesAmt,
          customersServed: Math.max(1, new Set(salesRes.sales.map((s: any) => s.customer_name)).size),
          lowStockCount: invRes?.lowStockCount ?? 3
        });

        const formatted = salesRes.sales.slice(0, 5).map((s: any) => ({
          id: s.sale_number || `#${s.id}`,
          time: s.time || 'Today',
          items: `${s.items_count || 1} items`,
          customer: s.customer_name || 'Walk-in',
          total: `TZS ${Number(s.total || 0).toLocaleString()}`,
          payment: s.payment_method || 'Cash',
          color: s.payment_method === 'Cash' ? 'bg-sky-100 text-sky-700' : s.payment_method === 'MOBILE MONEY' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
        }));
        if (formatted.length > 0) {
          setDashboardRecentTransactions(formatted);
        }
      }
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    }
  }, [activeTab, fetchDashboardStats]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return `TZS ${new Intl.NumberFormat('en-TZ', { maximumFractionDigits: 0 }).format(amount)}`;
  };

  const sidebarTabs = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', name: 'POS (Checkout)', icon: ShoppingCart },
    { id: 'categories', name: 'Categories', icon: LayoutGrid },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'inventory', name: 'Inventory', icon: Warehouse },
    { id: 'sales', name: 'Sales History', icon: History },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen flex font-sans text-slate-800 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #eef2fd 0%, #f4f7fe 50%, #f9f6fd 100%)' }}>

      {/* LEFT SIDEBAR (Collapsible to compact icon-only mode) */}
      <aside className={`transition-all duration-300 bg-white/80 backdrop-blur-2xl flex flex-col justify-between z-20 flex-shrink-0 shadow-lg border-r border-slate-100 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>

        <div>
          {/* Logo Brand Header & Toggle Menu Button */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#4f46e5] to-[#7c3aed] rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
                <ShoppingCart className="text-white w-6 h-6" />
              </div>
              {isSidebarOpen && (
                <div className="whitespace-nowrap">
                  <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">TZA Mart</h1>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">Supermarket Management</p>
                </div>
              )}
            </div>

            {/* Menu Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex-shrink-0"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {sidebarTabs.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.name}
                  className={`w-full flex items-center ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${active
                    ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-lg shadow-indigo-500/25 font-extrabold'
                    : 'text-slate-600 hover:bg-indigo-50/50 hover:text-[#4f46e5]'
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''} ${active ? 'text-white' : 'text-slate-500'}`} />
                  {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Tanzania Supermarket Card & Logout */}
        <div className="p-3 space-y-3">
          {isSidebarOpen && (
            <div className="bg-white/60 backdrop-blur-xl border border-white p-4 rounded-3xl text-center shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl mx-auto flex items-center justify-center text-blue-600 mb-2">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-900">TZA Mart</h4>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Your Trusted Supermarket in Tanzania</p>
              <div className="mt-2 inline-flex items-center space-x-1 bg-white px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-100 shadow-2xs">
                <span>🇹🇿</span> <span className="text-slate-700">Tanzania Edition</span>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/login')}
            title="Logout"
            className={`w-full flex items-center ${isSidebarOpen ? 'px-4 justify-start space-x-2' : 'justify-center'} py-3 text-red-600 hover:bg-red-50 font-extrabold text-xs rounded-2xl transition-all cursor-pointer`}
          >
            <LogOut className="w-5 h-5 text-red-600" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>

      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden z-10 relative transition-all duration-300">

        {/* TAB 1: DASHBOARD OVERVIEW VIEW */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500">Good Afternoon, John! 👋</p>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cashier Dashboard</h2>
                <p className="text-xs font-medium text-slate-500">Here is your overview for today. Ready to start selling?</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-white/80 border border-white px-4 py-2 rounded-2xl shadow-2xs flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                    <p className="text-xs font-extrabold text-slate-900">Today</p>
                  </div>
                </div>

                <div className="bg-white/80 border border-white px-4 py-2 rounded-2xl shadow-2xs flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Time</p>
                    <p className="text-xs font-extrabold text-slate-900 font-mono">{currentTime}</p>
                  </div>
                </div>

                <div className="bg-white/80 border border-white px-4 py-2 rounded-2xl shadow-2xs flex items-center space-x-3">
                  <Store className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">TZA Mart - Dar es Salaam</p>
                    <p className="text-xs font-extrabold text-slate-900">Main Branch</p>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-3xl shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100/80 flex items-center justify-center text-blue-600">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{dashboardStats.todayTransactions}</h3>
                    <p className="text-xs font-bold text-slate-400">Today's Transactions</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full flex items-center">
                  Live
                </span>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-3xl shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{formatCurrency(dashboardStats.todaySales)}</h3>
                    <p className="text-xs font-bold text-slate-400">Total Sales</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full flex items-center">
                  Live
                </span>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-3xl shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100/80 flex items-center justify-center text-purple-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{dashboardStats.customersServed}</h3>
                    <p className="text-xs font-bold text-slate-400">Customers Served</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full flex items-center">
                  Active
                </span>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-3xl shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/80 flex items-center justify-center text-amber-600">
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{dashboardStats.lowStockCount}</h3>
                    <p className="text-xs font-bold text-slate-400">Low Stock Items</p>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-700 text-xs font-black px-2.5 py-1 rounded-full">
                  Alert
                </span>
              </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-blue-600" />
                    Sales Overview
                  </h3>
                  <select className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-600 focus:outline-none">
                    <option>Today</option>
                    <option>This Week</option>
                  </select>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlySalesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `${val / 1000}k`} />
                      <Tooltip formatter={(val: any) => [`TZS ${Number(val || 0).toLocaleString()}`, 'Sales']} />
                      <Area type="monotone" dataKey="sales" stroke="#0284c7" strokeWidth={3} fill="url(#salesGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-2xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center mb-4">
                    <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
                    Payment Methods
                  </h3>
                  <div className="flex items-center justify-center my-4 relative">
                    <div className="w-36 h-36 rounded-full border-8 border-sky-500 border-t-emerald-500 border-r-purple-500 flex items-center justify-center bg-white shadow-inner">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400">TZS</p>
                        <p className="text-xs font-black text-slate-900">{formatCurrency(dashboardStats.todaySales)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-bold pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 mr-2"></span> Cash</span>
                    <span className="text-slate-500">45%</span>
                    <span className="text-slate-900">TZS {Math.round(dashboardStats.todaySales * 0.45).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span> Mobile Money</span>
                    <span className="text-slate-500">35%</span>
                    <span className="text-slate-900">TZS {Math.round(dashboardStats.todaySales * 0.35).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2"></span> Card / Bank</span>
                    <span className="text-slate-500">15%</span>
                    <span className="text-slate-900">TZS {Math.round(dashboardStats.todaySales * 0.15).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-2"></span> Other</span>
                    <span className="text-slate-500">5%</span>
                    <span className="text-slate-900">TZS {Math.round(dashboardStats.todaySales * 0.05).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    Recent Transactions
                  </h3>
                  <button onClick={() => setActiveTab('sales')} className="text-xs font-extrabold text-blue-600 hover:underline cursor-pointer">
                    View All
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold border-b border-slate-100 pb-2">
                        <th className="pb-2">#</th>
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Product / Items</th>
                        <th className="pb-2">Customer</th>
                        <th className="pb-2">Total</th>
                        <th className="pb-2">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {dashboardRecentTransactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-white/60 transition-colors">
                          <td className="py-2.5 font-extrabold text-slate-900">{trx.id}</td>
                          <td className="py-2.5 text-slate-500">{trx.time}</td>
                          <td className="py-2.5 text-slate-700 font-bold">{trx.items}</td>
                          <td className="py-2.5 text-slate-500">{trx.customer}</td>
                          <td className="py-2.5 font-black text-slate-900">{trx.total}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${trx.color}`}>
                              {trx.payment}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-2xs">
                <h3 className="text-base font-black text-slate-900 flex items-center mb-4">
                  <TrendingUp className="w-4 h-4 mr-2 text-amber-500" />
                  Quick Actions
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab('pos')}
                    className="p-4 bg-sky-50 border border-sky-100 hover:bg-sky-100 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-sm">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-xs text-slate-900 flex items-center justify-between">
                      Open POS
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">Start a new sale</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('products')}
                    className="p-4 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-sm">
                      <Package className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-xs text-slate-900 flex items-center justify-between">
                      Search Product
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">Find products quickly</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('sales')}
                    className="p-4 bg-purple-50 border border-purple-100 hover:bg-purple-100 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-sm">
                      <History className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-xs text-slate-900 flex items-center justify-between">
                      View Sales History
                      <ArrowRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">Check recent sales</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('customers')}
                    className="p-4 bg-amber-50 border border-amber-100 hover:bg-amber-100 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-sm">
                      <Users className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-xs text-slate-900 flex items-center justify-between">
                      Add Customer
                      <ArrowRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">Quick customer entry</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: POINT OF SALE (POS / CHECKOUT) MODULAR VIEW */}
        {activeTab === 'pos' && (
          <CashierPOSView
            externalCartItem={externalCartProduct}
            onSaleComplete={() => {
              fetchDashboardStats();
            }}
          />
        )}

        {/* TAB 3: CATEGORIES VIEW */}
        {activeTab === 'categories' && (
          <CashierCategoriesView />
        )}

        {/* TAB 4: PRODUCTS VIEW */}
        {activeTab === 'products' && (
          <CashierProductsView
            onGoToPOS={() => setActiveTab('pos')}
            onAddToCart={(p) => {
              setExternalCartProduct({
                id: p.id,
                name: p.name,
                sku: p.sku,
                barcode: p.barcode,
                category: p.category,
                price: p.sellingPrice,
                stock: p.stock,
                minStock: p.minStock,
                imageIcon: '📦'
              });
              setActiveTab('pos');
            }}
          />
        )}

        {/* TAB 5: INVENTORY VIEW */}
        {activeTab === 'inventory' && (
          <CashierInventoryView />
        )}

        {/* TAB 6: SALES HISTORY VIEW */}
        {activeTab === 'sales' && (
          <CashierSalesView />
        )}

        {/* TAB 7: CUSTOMERS VIEW */}
        {activeTab === 'customers' && (
          <CashierCustomersView />
        )}

        {/* TAB 8: SETTINGS VIEW */}
        {activeTab === 'settings' && (
          <CashierSettingsView />
        )}

      </div>
    </div>
  );
}
