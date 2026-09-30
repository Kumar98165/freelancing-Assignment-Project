import { useState } from 'react';
import { 
  Search, Filter, Plus, Eye, Edit2, Power, 
  X, CheckCircle2, Trash2
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  barcode: string;
  barcodeType: 'MANUFACTURER' | 'INTERNAL';
  buyingPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  tax: string;
  status: 'Active' | 'Inactive';
}

const initialProducts: Product[] = [
  { 
    id: '1', 
    name: 'Kilimanjaro Drinking Water (1.5L)', 
    sku: 'BEV-KIL-15', 
    category: 'Beverages', 
    barcode: '6201234567890', 
    barcodeType: 'MANUFACTURER',
    buyingPrice: 500, 
    sellingPrice: 1000, 
    stock: 120, 
    minStock: 50, 
    tax: '18% VAT', 
    status: 'Active' 
  },
  { 
    id: '2', 
    name: 'Azam Wheat Flour (2kg)', 
    sku: 'GRO-AZA-02', 
    category: 'Groceries', 
    barcode: 'TZ-INT-0001', 
    barcodeType: 'INTERNAL',
    buyingPrice: 2000, 
    sellingPrice: 2800, 
    stock: 85, 
    minStock: 30, 
    tax: '0% Exempt', 
    status: 'Active' 
  },
  { 
    id: '3', 
    name: 'Serengeti Premium Lager', 
    sku: 'BEV-SER-01', 
    category: 'Beverages', 
    barcode: '6209876543210', 
    barcodeType: 'MANUFACTURER',
    buyingPrice: 1800, 
    sellingPrice: 2500, 
    stock: 15, 
    minStock: 100, 
    tax: '18% VAT', 
    status: 'Inactive' 
  },
  { 
    id: '4', 
    name: 'Tanga Fresh Milk (1L)', 
    sku: 'DYE-MIL-01', 
    category: 'Dairy & Eggs', 
    barcode: '6201112223334', 
    barcodeType: 'MANUFACTURER',
    buyingPrice: 1600, 
    sellingPrice: 2200, 
    stock: 0, 
    minStock: 25, 
    tax: '0% Exempt', 
    status: 'Inactive' 
  },
  { 
    id: '5', 
    name: 'Mo Sunflower Cooking Oil (5L)', 
    sku: 'GRO-OIL-05', 
    category: 'Groceries', 
    barcode: '6205556667778', 
    barcodeType: 'MANUFACTURER',
    buyingPrice: 27000, 
    sellingPrice: 34000, 
    stock: 8, 
    minStock: 30, 
    tax: '18% VAT', 
    status: 'Active' 
  }
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  
  // Modals & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (id: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' } : p));
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      category: 'Beverages',
      buyingPrice: 0,
      sellingPrice: 0,
      stock: 0,
      minStock: 10,
      tax: '18% VAT',
      barcodeType: 'MANUFACTURER',
      barcode: '',
      status: 'Active'
    });
    setFormErrors({});
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setFormData({ ...p });
    setFormErrors({});
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenView = (p: Product) => {
    setFormData({ ...p });
    setModalMode('view');
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name?.trim()) errs.name = 'Name is required';
    if (!formData.sku?.trim()) errs.sku = 'SKU is required';
    if (!formData.sellingPrice || formData.sellingPrice <= 0) errs.sellingPrice = 'Must be greater than 0';
    if (!formData.barcode?.trim()) errs.barcode = 'Barcode is required';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (modalMode === 'add') {
      const newProd: Product = {
        ...formData,
        id: Date.now().toString(),
      } as Product;
      setProducts([newProd, ...products]);
      showToast(`Product "${newProd.name}" added successfully!`);
    } else {
      setProducts(products.map(p => p.id === formData.id ? { ...p, ...formData } as Product : p));
      showToast(`Product "${formData.name}" updated!`);
    }
    setIsModalOpen(false);
  };

  return (
    <AdminLayout title="Products Management">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* SEPARATE FILTER & SEARCH BAR CARD (COMPACT & SLEEK) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 flex-1 max-w-md">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or SKU..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="pl-8 pr-7 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <Filter className="w-3 h-3 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Add Product Button */}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto hover:opacity-95"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)'
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* SEPARATE PRODUCT TABLE CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 font-extrabold text-xs tracking-wider border-b border-slate-100 uppercase">
                  <th className="pb-4">PRODUCT INFO</th>
                  <th className="pb-4">CATEGORY</th>
                  <th className="pb-4">PRICE (TZS)</th>
                  <th className="pb-4">STOCK</th>
                  <th className="pb-4">STATUS</th>
                  <th className="pb-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Product Info */}
                    <td className="py-4">
                      <p className="font-extrabold text-slate-900 text-sm">{product.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        {product.sku} &nbsp;|&nbsp; {product.barcode}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="py-4 text-slate-600 font-bold text-sm">
                      {product.category}
                    </td>

                    {/* Price */}
                    <td className="py-4">
                      <p className="font-extrabold text-slate-900 text-sm">TSh {product.sellingPrice.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">Cost: TSh {product.buyingPrice.toLocaleString()}</p>
                    </td>

                    {/* Stock */}
                    <td className="py-4 font-black">
                      <span className={product.stock <= product.minStock ? 'text-rose-500' : 'text-slate-800'}>
                        {product.stock}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        product.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {product.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 text-right space-x-2 text-slate-400">
                      <button
                        onClick={() => handleOpenView(product)}
                        title="View Details"
                        className="p-1.5 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(product)}
                        title="Edit Product"
                        className="p-1.5 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(product.id)}
                        title="Toggle Status"
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          product.status === 'Active' ? 'hover:text-amber-600 hover:bg-amber-50' : 'hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD / EDIT / VIEW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {modalMode === 'add' ? 'Add New Product' : modalMode === 'edit' ? 'Edit Product' : 'Product Details'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMode === 'view' ? (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl">
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Product Name</p>
                    <p className="font-extrabold text-slate-900">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Category</p>
                    <p className="font-bold text-slate-700">{formData.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">SKU</p>
                    <p className="font-mono font-bold text-slate-800">{formData.sku}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Barcode</p>
                    <p className="font-mono font-bold text-slate-800">{formData.barcode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Selling Price</p>
                    <p className="font-black text-[#4f46e5]">TSh {formData.sellingPrice?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Current Stock</p>
                    <p className="font-black text-slate-900">{formData.stock} Units</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold cursor-pointer">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4 text-xs font-medium">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Kilimanjaro Drinking Water (1.5L)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    />
                    {formErrors.name && <p className="text-rose-500 font-bold mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      value={formData.sku || ''}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="BEV-KIL-15"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                    />
                    {formErrors.sku && <p className="text-rose-500 font-bold mt-1">{formErrors.sku}</p>}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none"
                    >
                      <option value="Beverages">Beverages</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Dairy & Eggs">Dairy & Eggs</option>
                      <option value="Personal Care">Personal Care</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Buying Price (TSh)</label>
                    <input
                      type="number"
                      value={formData.buyingPrice ?? 0}
                      onChange={(e) => setFormData({ ...formData, buyingPrice: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Selling Price (TSh) *</label>
                    <input
                      type="number"
                      value={formData.sellingPrice ?? 0}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-[#4f46e5] focus:outline-none"
                    />
                    {formErrors.sellingPrice && <p className="text-rose-500 font-bold mt-1">{formErrors.sellingPrice}</p>}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Current Stock</label>
                    <input
                      type="number"
                      value={formData.stock ?? 0}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Barcode *</label>
                    <input
                      type="text"
                      value={formData.barcode || ''}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="6201234567890"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold focus:outline-none"
                    />
                    {formErrors.barcode && <p className="text-rose-500 font-bold mt-1">{formErrors.barcode}</p>}
                  </div>
                </div>

                <div className="flex space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/25 cursor-pointer hover:opacity-95"
                    style={{
                      background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)'
                    }}
                  >
                    {modalMode === 'add' ? 'Save Product' : 'Update Product'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
