import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogs from './pages/AuditLogs';

import CashierDashboard from './pages/CashierDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/admin/categories" element={<Categories />} />
        <Route path="/admin/inventory" element={<Inventory />} />
        <Route path="/admin/customers" element={<Customers />} />
        <Route path="/admin/customers/:id" element={<Customers />} />
        <Route path="/customer/:id" element={<Customers />} />
        <Route path="/admin/sales" element={<Sales />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
        <Route path="/cashier" element={<CashierDashboard />} />
        <Route path="/cashier/:tab" element={<CashierDashboard />} />
        <Route path="/cashier/:tab/:id" element={<CashierDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
