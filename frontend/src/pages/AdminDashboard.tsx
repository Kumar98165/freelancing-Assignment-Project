import { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingCart, Package, 
  Users, Activity, Clock, Calendar, ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

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

const recentTransactions = [
  { id: '#00024', time: '14:31:05', items: '3 items', customer: 'Walk-in', total: 'TSh 24,500', payment: 'Cash', color: 'bg-indigo-50 text-indigo-700' },
  { id: '#00023', time: '14:28:40', items: '1 item', customer: 'Walk-in', total: 'TSh 8,000', payment: 'Mobile Money', color: 'bg-emerald-50 text-emerald-700' },
  { id: '#00022', time: '14:25:12', items: '5 items', customer: 'Walk-in', total: 'TSh 63,500', payment: 'Card', color: 'bg-purple-50 text-purple-700' },
  { id: '#00021', time: '14:22:09', items: '2 items', customer: 'Walk-in', total: 'TSh 18,700', payment: 'Cash', color: 'bg-indigo-50 text-indigo-700' },
  { id: '#00020', time: '14:19:33', items: '4 items', customer: 'Walk-in', total: 'TSh 42,000', payment: 'Mobile Money', color: 'bg-emerald-50 text-emerald-700' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<string>('14:32:15');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="space-y-6">
        
        {/* Welcome Subtitle & Time Ticker Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Good Afternoon, Admin! 👋</h2>
            <p className="text-xs text-slate-500 mt-0.5">Here is your supermarket business overview for today.</p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-xs flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#4f46e5]" />
              <span className="text-xs font-bold text-slate-700">23 Dec 2024</span>
            </div>
            <div className="bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-xs flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#4f46e5]" />
              <span className="text-xs font-mono font-bold text-slate-700">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">24</h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">Today's Transactions</p>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-extrabold px-2.5 py-1 rounded-full">
              +12%
            </span>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">TSh 1,245,600</h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">Today's Sales</p>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-extrabold px-2.5 py-1 rounded-full">
              +96%
            </span>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">18</h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">Customers Served</p>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-extrabold px-2.5 py-1 rounded-full">
              +6%
            </span>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">3</h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">Low Stock Items</p>
              </div>
            </div>
            <span className="bg-rose-50 text-rose-600 text-xs font-extrabold px-2.5 py-1 rounded-full">
              Alert
            </span>
          </div>

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
              <select className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-600">
                <option>Today</option>
                <option>This Week</option>
              </select>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlySalesData}>
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
                <span className="font-extrabold text-slate-900">45% (TSh 560,520)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <span>📱 Mobile Money</span>
                <span className="font-extrabold text-slate-900">35% (TSh 436,960)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <span>💳 Card / Bank</span>
                <span className="font-extrabold text-slate-900">15% (TSh 187,120)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <span>🔄 Other</span>
                <span className="font-extrabold text-slate-900">5% (TSh 61,000)</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/admin/sales')}
              className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>View All Sales</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900">Recent Transactions</h3>
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
                {recentTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50">
                    <td className="py-3 font-extrabold text-slate-900">{trx.id}</td>
                    <td className="py-3 text-slate-500">{trx.time}</td>
                    <td className="py-3 text-slate-700 font-bold">{trx.items}</td>
                    <td className="py-3 text-slate-500">{trx.customer}</td>
                    <td className="py-3 font-black text-slate-900">{trx.total}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${trx.color}`}>
                        {trx.payment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
