import { useState } from 'react';
import {
  Search, Plus, Edit2, Trash2, Power,
  CheckCircle2, X
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';

export interface Category {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  productCount: number;
}

const initialCategories: Category[] = [
  { id: '1', name: 'Beverages', description: 'Soft drinks, packaged water, juices, soda, alcohol', status: 'Active', createdDate: '2024-01-10', productCount: 42 },
  { id: '2', name: 'Groceries', description: 'Flour, rice, sugar, cooking oil, spices, canned goods', status: 'Active', createdDate: '2024-01-10', productCount: 68 },
  { id: '3', name: 'Dairy & Eggs', description: 'Fresh milk, yogurt, butter, cheese, farm fresh eggs', status: 'Active', createdDate: '2024-01-15', productCount: 24 },
  { id: '4', name: 'Fresh Produce', description: 'Fresh local tomatoes, onions, fruits, vegetables', status: 'Active', createdDate: '2024-02-01', productCount: 30 },
  { id: '5', name: 'Personal Care', description: 'Toothpaste, soaps, shampoos, lotions, deodorants', status: 'Active', createdDate: '2024-02-10', productCount: 35 },
  { id: '6', name: 'Household Items', description: 'Detergents, cleaning products, paper towels, mop buckets', status: 'Inactive', createdDate: '2024-03-05', productCount: 18 },
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredCategories = categories.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setStatus('Active');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description);
    setStatus(cat.status);
    setError('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = (cat: Category) => {
    const newStatus = cat.status === 'Active' ? 'Inactive' : 'Active';
    setCategories(categories.map(c => c.id === cat.id ? { ...c, status: newStatus } : c));
    showToast(`Category "${cat.name}" marked as ${newStatus}`);
  };

  const handleDelete = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
    setDeleteConfirmId(null);
    showToast('Category deleted successfully');
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? {
        ...c,
        name: name.trim(),
        description: description.trim(),
        status,
      } : c));
      showToast(`Category "${name}" updated!`);
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: name.trim(),
        description: description.trim(),
        status,
        createdDate: new Date().toISOString().split('T')[0],
        productCount: 0,
      };
      setCategories([newCategory, ...categories]);
      showToast(`Category "${name}" created!`);
    }

    setIsModalOpen(false);
  };

  return (
    <AdminLayout title="Categories Management">
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
                  placeholder="Search category name or description..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Add Category Button */}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto hover:opacity-95"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)'
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* SEPARATE CATEGORIES TABLE CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100 text-xs tracking-wider">
                  <th className="pb-4 font-bold uppercase">CATEGORY NAME</th>
                  <th className="pb-4 font-bold uppercase">DESCRIPTION</th>
                  <th className="pb-4 font-bold uppercase">ITEMS</th>
                  <th className="pb-4 font-bold uppercase">CREATED DATE</th>
                  <th className="pb-4 font-bold uppercase">STATUS</th>
                  <th className="pb-4 font-bold uppercase text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 font-bold text-slate-900">
                      {cat.name}
                    </td>
                    <td className="py-4 text-slate-500 max-w-xs text-xs">
                      {cat.description || '—'}
                    </td>
                    <td className="py-4 font-bold text-slate-800">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
                        {cat.productCount} products
                      </span>
                    </td>
                    <td className="py-4 text-slate-500 text-xs font-mono">
                      {cat.createdDate}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                        cat.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Toggle Status"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(cat.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCategories.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-medium text-sm">
                No categories found matching your search.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Beverages, Groceries, Dairy"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
                {error && <p className="text-xs text-rose-500 font-bold mt-1">{error}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe items belonging in this category..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/25 cursor-pointer hover:opacity-95"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)'
                  }}
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
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
            <h3 className="text-base font-black text-slate-900">Delete Category?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove this category?
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
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
