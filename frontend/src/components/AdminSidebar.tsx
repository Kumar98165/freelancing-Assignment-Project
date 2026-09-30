import { 
  LayoutDashboard, Package, Warehouse, History, 
  Users, Activity, LogOut, ShoppingCart, Menu,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface AdminSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function AdminSidebar({ isSidebarOpen, setIsSidebarOpen }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Products', icon: Package, path: '/admin/products' },
    { name: 'Inventory / Stock', icon: Warehouse, path: '/admin/inventory' },
    { name: 'Sales', icon: History, path: '/admin/sales' },
    { name: 'Customers', icon: Users, path: '/admin/customers' },
    { name: 'Users / Cashiers', icon: Users, path: '/admin/users' },
    { name: 'Reports', icon: Activity, path: '/admin/reports' },
  ];

  return (
    <aside className={`transition-all duration-300 bg-white/80 backdrop-blur-2xl flex flex-col justify-between z-20 flex-shrink-0 shadow-lg border-r border-white/80 select-none ${
      isSidebarOpen ? 'w-64' : 'w-20'
    }`}>
      <div>
        {/* Logo Brand Header & Toggle Menu Button */}
        <div className="p-4 flex items-center justify-between border-b border-white/60">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-sky-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
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
            className="p-2 text-slate-600 hover:bg-white rounded-xl transition-all cursor-pointer shadow-2xs flex-shrink-0"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links (Shows labels when expanded, icons-only when collapsed) */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const active = location.pathname === item.path || 
              (item.path === '/admin/products' && location.pathname === '/admin/categories');
            return (
              <Link
                key={item.name}
                to={item.path}
                title={item.name}
                className={`w-full flex items-center ${isSidebarOpen ? 'px-4 justify-between' : 'justify-center'} py-3 rounded-2xl font-bold text-xs transition-all ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/30 font-extrabold'
                    : 'text-slate-600 hover:bg-white/60 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''} ${active ? 'text-white' : 'text-slate-500'}`} />
                  {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
                </div>
                {isSidebarOpen && active && <ChevronRight className="w-4 h-4 text-white/80" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Bottom Tanzania Supermarket Card */}
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
  );
}
