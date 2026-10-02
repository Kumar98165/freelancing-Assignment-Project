import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard, LayoutGrid, Package, Warehouse, Users,
  ShoppingCart, BarChart3, Settings, LogOut, Bell, Menu, PanelLeftClose, PanelLeftOpen, ShieldAlert
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface AdminLayoutProps {
  title: string;
  children: ReactNode;
}

export default function AdminLayout({ title, children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Categories', icon: LayoutGrid, path: '/admin/categories' },
    { name: 'Products', icon: Package, path: '/admin/products' },
    { name: 'Inventory', icon: Warehouse, path: '/admin/inventory' },
    { name: 'Customers', icon: Users, path: '/admin/customers' },
    { name: 'Sales', icon: ShoppingCart, path: '/admin/sales' },
    { name: 'Reports', icon: BarChart3, path: '/admin/reports' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Audit Logs', icon: ShieldAlert, path: '/admin/audit-logs' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div
      className="min-h-screen flex font-sans text-slate-800 antialiased select-none overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #eef2fd 0%, #f4f7fe 50%, #f9f6fd 100%)'
      }}
    >

      {/* SIDEBAR */}
      <aside className={`bg-white border-r border-slate-100 flex flex-col justify-between z-20 flex-shrink-0 min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'
        }`}>
        <div>
          {/* Logo Header */}
          <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-6 space-x-3'} transition-all`}>
            <div className="w-10 h-10 bg-gradient-to-tr from-[#4f46e5] to-[#9333ea] rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/25 flex-shrink-0">
              <ShoppingCart className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-xl text-slate-900 tracking-tight whitespace-nowrap overflow-hidden">
                TzSuperPOS
              </span>
            )}
          </div>

          {/* Nav Links */}
          <nav className="px-3 py-2 space-y-1.5">
            {navItems.map((item) => {
              const active = item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  title={isCollapsed ? item.name : undefined}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-3.5' : 'px-4 py-3'} rounded-2xl font-bold text-sm transition-all ${active
                    ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-md shadow-indigo-500/25 font-extrabold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#4f46e5]'
                    }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''} ${active ? 'text-white' : 'text-slate-500'}`} />
                  {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => navigate('/login')}
            title={isCollapsed ? 'Logout' : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-3.5' : 'px-4 py-3'} text-red-500 hover:bg-red-50 font-bold text-sm rounded-2xl transition-all cursor-pointer`}
          >
            <LogOut className={`w-5 h-5 flex-shrink-0 text-red-500 ${!isCollapsed ? 'mr-3' : ''}`} />
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* TOPBAR HEADER */}
        <header className="h-20 bg-white/70 backdrop-blur-md px-6 sm:px-8 flex items-center justify-between border-b border-slate-200/60 flex-shrink-0">

          {/* Left Title & Collapse Toggle Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-[#4f46e5] text-slate-600 rounded-2xl transition-all cursor-pointer shadow-xs"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar (Icon Only)"}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center space-x-5">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all relative cursor-pointer">
              <Bell className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-l border-slate-200 pl-5">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">Admin User</p>
                <p className="text-xs font-medium text-slate-400">Store Manager</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4f46e5] to-[#9333ea] text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/20">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>

      </div>

    </div>
  );
}
