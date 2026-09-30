import { useState } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Power, 
  CheckCircle2, X, Filter
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';

export interface UserRecord {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  role: 'ADMIN' | 'CASHIER';
  status: 'Active' | 'Inactive';
  createdDate: string;
}

const initialUsers: UserRecord[] = [
  { id: '1', fullName: 'Administrator Manager', username: 'admin', phone: '+255754111222', role: 'ADMIN', status: 'Active', createdDate: '2024-01-01' },
  { id: '2', fullName: 'John Masawe', username: 'cashier', phone: '+255713333444', role: 'CASHIER', status: 'Active', createdDate: '2024-01-15' },
  { id: '3', fullName: 'Amina Salum', username: 'amina.cashier', phone: '+255784555666', role: 'CASHIER', status: 'Active', createdDate: '2024-02-01' },
  { id: '4', fullName: 'Peter Karia', username: 'peter.karia', phone: '+255655777888', role: 'CASHIER', status: 'Inactive', createdDate: '2024-03-10' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'CASHIER'>('ALL');

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

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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

  const handleToggleStatus = (u: UserRecord) => {
    const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
    setUsers(users.map(item => item.id === u.id ? { ...item, status: newStatus } : item));
    showToast(`User "${u.fullName}" marked as ${newStatus}`);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    setDeleteConfirmId(null);
    showToast('User account successfully removed.');
  };

  const handleSaveUser = (e: React.FormEvent) => {
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

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? {
        ...u,
        fullName: fullName.trim(),
        username: username.trim(),
        phone: phone.trim(),
        role,
        status,
      } : u));
      showToast(`User "${fullName}" updated!`);
    } else {
      const newUser: UserRecord = {
        id: Date.now().toString(),
        fullName: fullName.trim(),
        username: username.trim(),
        phone: phone.trim(),
        role,
        status,
        createdDate: new Date().toISOString().split('T')[0]
      };
      setUsers([newUser, ...users]);
      showToast(`User "${fullName}" registered as ${role}!`);
    }

    setIsModalOpen(false);
  };

  return (
    <AdminLayout title="User Management">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* SEPARATE FILTER & SEARCH BAR CARD (COMPACT & SLEEK) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 flex-1 max-w-md">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user name or role..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="pl-8 pr-7 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="CASHIER">CASHIER</option>
                </select>
                <Filter className="w-3 h-3 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Add User Button */}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* SEPARATE USERS TABLE CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100 text-xs tracking-wider">
                  <th className="pb-4 font-bold uppercase">USER INFO</th>
                  <th className="pb-4 font-bold uppercase">USERNAME</th>
                  <th className="pb-4 font-bold uppercase">PHONE NUMBER</th>
                  <th className="pb-4 font-bold uppercase">ROLE</th>
                  <th className="pb-4 font-bold uppercase">CREATED DATE</th>
                  <th className="pb-4 font-bold uppercase">STATUS</th>
                  <th className="pb-4 font-bold uppercase text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4">
                      <p className="font-bold text-slate-900">{u.fullName}</p>
                    </td>
                    <td className="py-4 font-mono font-bold text-[#4f46e5]">
                      @{u.username}
                    </td>
                    <td className="py-4 font-mono text-slate-600 text-xs">
                      {u.phone}
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                        u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-indigo-50 text-[#4f46e5]'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 text-slate-500 text-xs font-mono">
                      {u.createdDate}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                        u.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-slate-400 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Toggle Status"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      {u.username !== 'admin' && (
                        <button
                          onClick={() => setDeleteConfirmId(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-medium text-sm">
                No users found matching your filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingUser ? 'Edit User' : 'Add New User'}
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
                  <label className="block font-bold text-slate-700 mb-1">Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none"
                  >
                    <option value="CASHIER">CASHIER</option>
                    <option value="ADMIN">ADMIN</option>
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
                  {editingUser ? 'Password (Leave blank to keep unchanged)' : 'Password *'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>

              {(password || !editingUser) && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                  />
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
                  {editingUser ? 'Update User' : 'Save User'}
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
            <h3 className="text-base font-black text-slate-900">Delete User Account?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove this user account?
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
