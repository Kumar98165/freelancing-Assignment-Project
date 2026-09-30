import { useState } from 'react';
import {
  Search, Eye, Edit2, Trash2, CheckCircle2,
  Plus, X, Users, DollarSign, TrendingUp, Award,
  Filter, ArrowUpDown, RotateCcw, MoreVertical, Sparkles
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { KPICard, Pagination } from '../components/common';
import CustomerProfileView from '../components/customers/CustomerProfileView';

export interface PurchaseItemDetail {
  name: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalPurchases: number;
  lastPurchase: string;
  purchases: {
    saleNumber: string;
    date: string;
    items: string;
    itemList?: PurchaseItemDetail[];
    total: number;
    paymentMethod: string;
  }[];
}

const initialCustomers: CustomerRecord[] = [
  {
    id: '1',
    name: 'Juma Rashid',
    phone: '+255754123456',
    email: 'juma.rashid@gmail.com',
    totalPurchases: 2450000,
    lastPurchase: '2024-12-23',
    purchases: [
      {
        saleNumber: 'SALE-TZ-2026-00022',
        date: '2024-12-23',
        items: 'Mo Sunflower Oil, Azam Sugar',
        itemList: [
          { name: 'Mo Sunflower Oil (5L)', qty: 1, unitPrice: 38500, totalPrice: 38500 },
          { name: 'Azam Pure White Sugar (5kg)', qty: 1, unitPrice: 25000, totalPrice: 25000 }
        ],
        total: 63500,
        paymentMethod: 'CARD / BANK'
      },
      {
        saleNumber: 'SALE-TZ-2026-00010',
        date: '2024-12-15',
        items: 'Kilimanjaro Water (1.5L) 20x',
        itemList: [
          { name: 'Kilimanjaro Pure Water (1.5L)', qty: 20, unitPrice: 1000, totalPrice: 20000 }
        ],
        total: 20000,
        paymentMethod: 'MOBILE MONEY'
      },
      {
        saleNumber: 'SALE-TZ-2026-00002',
        date: '2024-12-01',
        items: 'General Groceries Hamper',
        itemList: [
          { name: 'Premium Groceries Family Hamper', qty: 2, unitPrice: 90000, totalPrice: 180000 }
        ],
        total: 180000,
        paymentMethod: 'CASH'
      }
    ]
  },
  {
    id: '2',
    name: 'Amina Salum',
    phone: '+255713987654',
    email: 'amina.salum@yahoo.com',
    totalPurchases: 890000,
    lastPurchase: '2024-12-23',
    purchases: [
      {
        saleNumber: 'SALE-TZ-2026-00020',
        date: '2024-12-23',
        items: 'Bakhresa Rice 10kg, Water',
        itemList: [
          { name: 'Bakhresa Super Aromatic Rice (10kg)', qty: 1, unitPrice: 32000, totalPrice: 32000 },
          { name: 'Kilimanjaro Water (1.5L)', qty: 10, unitPrice: 1000, totalPrice: 10000 }
        ],
        total: 42000,
        paymentMethod: 'MOBILE MONEY'
      },
      {
        saleNumber: 'SALE-TZ-2026-00014',
        date: '2024-12-18',
        items: 'Household Cleaning Kit',
        itemList: [
          { name: 'Household Essential Cleaning Kit', qty: 1, unitPrice: 35000, totalPrice: 35000 }
        ],
        total: 35000,
        paymentMethod: 'CASH'
      }
    ]
  },
  {
    id: '3',
    name: 'Godfrey Masawe',
    phone: '+255784555111',
    email: 'g.masawe@outlook.com',
    totalPurchases: 310000,
    lastPurchase: '2024-12-22',
    purchases: [
      {
        saleNumber: 'SALE-TZ-2026-00019',
        date: '2024-12-22',
        items: 'Serengeti Lager Crate',
        itemList: [
          { name: 'Serengeti Premium Lager Crate (24x)', qty: 1, unitPrice: 85000, totalPrice: 85000 }
        ],
        total: 85000,
        paymentMethod: 'MOBILE MONEY'
      }
    ]
  },
  {
    id: '4',
    name: 'Zuhura Bakari',
    phone: '+255655444888',
    email: '',
    totalPurchases: 1680000,
    lastPurchase: '2024-12-20',
    purchases: [
      {
        saleNumber: 'SALE-TZ-2026-00016',
        date: '2024-12-20',
        items: 'Azam Wheat Flour, Sugar',
        itemList: [
          { name: 'Azam All-Purpose Wheat Flour (5kg)', qty: 2, unitPrice: 14500, totalPrice: 29000 },
          { name: 'Azam Pure White Sugar (5kg)', qty: 1, unitPrice: 25000, totalPrice: 25000 }
        ],
        total: 54000,
        paymentMethod: 'CASH'
      }
    ]
  }
];

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerRecord[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'VIP' | 'REGULAR' | 'NEW'>('ALL');
  const [sortBy, setSortBy] = useState<'TOTAL_DESC' | 'TOTAL_ASC' | 'NAME_ASC' | 'NAME_DESC'>('TOTAL_DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // View state & Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<CustomerRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [openMenuCustId, setOpenMenuCustId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+255');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatTZS = (val: number) => `TSh ${val.toLocaleString()}`;

  // KPI Calculations
  const totalCustomersCount = customers.length;
  const totalCustomerRevenue = customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);
  const avgLifetimeValue = totalCustomersCount > 0 ? Math.round(totalCustomerRevenue / totalCustomersCount) : 0;
  const vipCustomersCount = customers.filter(c => c.totalPurchases >= 1000000).length;
  const topCustomer = customers.length > 0
    ? [...customers].sort((a, b) => b.totalPurchases - a.totalPurchases)[0]
    : null;

  // Filter & Sort Logic
  const filteredCustomers = customers
    .filter(c => {
      // Search matching (Name, Phone, Email)
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q));

      // Tier filtering
      let matchTier = true;
      if (tierFilter === 'VIP') {
        matchTier = c.totalPurchases >= 1000000;
      } else if (tierFilter === 'REGULAR') {
        matchTier = c.totalPurchases >= 100000 && c.totalPurchases < 1000000;
      } else if (tierFilter === 'NEW') {
        matchTier = c.totalPurchases < 100000;
      }

      return matchSearch && matchTier;
    })
    .sort((a, b) => {
      if (sortBy === 'TOTAL_DESC') return b.totalPurchases - a.totalPurchases;
      if (sortBy === 'TOTAL_ASC') return a.totalPurchases - b.totalPurchases;
      if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
      if (sortBy === 'NAME_DESC') return b.name.localeCompare(a.name);
      return 0;
    });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setTierFilter('ALL');
    setSortBy('TOTAL_DESC');
    setCurrentPage(1);
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('+255');
    setEmail('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: CustomerRecord) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Customer Name is required');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setFormError('Valid Tanzanian Phone Number is required (e.g. +255712345678)');
      return;
    }

    if (editingCustomer) {
      const updatedCust = {
        ...editingCustomer,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined
      };
      setCustomers(customers.map(c => c.id === editingCustomer.id ? updatedCust : c));
      if (selectedCustomerDetails?.id === editingCustomer.id) {
        setSelectedCustomerDetails(updatedCust);
      }
      showToast(`Customer "${name}" updated!`);
    } else {
      const newCust: CustomerRecord = {
        id: Date.now().toString(),
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        totalPurchases: 0,
        lastPurchase: 'Never',
        purchases: []
      };
      setCustomers([newCust, ...customers]);
      showToast(`Customer "${name}" registered successfully!`);
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id));
    if (selectedCustomerDetails?.id === id) {
      setSelectedCustomerDetails(null);
    }
    setDeleteConfirmId(null);
    showToast('Customer record removed.');
  };

  return (
    <AdminLayout title={selectedCustomerDetails ? "Customer Profile" : "Customers Management"}>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* CONDITIONAL RENDERING: FULL-PAGE PROFILE VIEW VS LIST VIEW */}
      {selectedCustomerDetails ? (
        <CustomerProfileView
          customer={selectedCustomerDetails}
          onBack={() => setSelectedCustomerDetails(null)}
          onEdit={handleOpenEdit}
          onDelete={(id) => setDeleteConfirmId(id)}
          formatTZS={formatTZS}
        />
      ) : (
        <div className="space-y-4">
          {/* TOP HEADER WITH ADD CUSTOMER ON RIGHT SIDE */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Overview</h2>
              <p className="text-xs text-slate-500 font-medium">Real-time spending metrics, lifetime value, and directory</p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>

          {/* 4 PROFESSIONAL WHITE GLASSMORPHISM KPI CARDS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <KPICard
              title="Total Customers"
              value={totalCustomersCount}
              icon={Users}
              color="blue"
              badge={{
                text: '+12.5% vs last mo',
                isPositive: true,
              }}
              subtitle="Active registered accounts"
              chartType="line"
            />

            <KPICard
              title="Customer Revenue"
              value={formatTZS(totalCustomerRevenue)}
              icon={DollarSign}
              color="emerald"
              badge={{
                text: '+18.4% vs last mo',
                isPositive: true,
              }}
              subtitle="Total gross customer sales"
              chartType="bar"
            />

            <KPICard
              title="Avg Lifetime Value"
              value={formatTZS(avgLifetimeValue)}
              icon={TrendingUp}
              color="purple"
              badge={{
                text: '+8.2% avg',
                isPositive: true,
              }}
              subtitle="Avg spend per profile"
              chartType="line"
            />

            <KPICard
              title="Top Spender (VIP)"
              value={topCustomer ? topCustomer.name : 'None'}
              icon={Award}
              color="amber"
              badge={`${vipCustomersCount} VIP Clients`}
              subtitle={`Lifetime: ${topCustomer ? formatTZS(topCustomer.totalPurchases) : '0 TZS'}`}
              chartType="bar"
            />
          </div>

          {/* SEPARATE FILTER & SEARCH BAR CARD */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3.5 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search input with live clear button */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search customer name, phone (+255...), email..."
                  className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                    className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Spending Tier Filter */}
              <div className="relative min-w-[150px]">
                <select
                  value={tierFilter}
                  onChange={(e) => { setTierFilter(e.target.value as any); setCurrentPage(1); }}
                  className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
                >
                  <option value="ALL">All Tiers (All Spend)</option>
                  <option value="VIP">VIP (≥ 1M TZS)</option>
                  <option value="REGULAR">Regular (100k - 1M)</option>
                  <option value="NEW">New (&lt; 100k)</option>
                </select>
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Sort By Dropdown */}
              <div className="relative min-w-[170px]">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
                  className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
                >
                  <option value="TOTAL_DESC">Sort: Spend (High → Low)</option>
                  <option value="TOTAL_ASC">Sort: Spend (Low → High)</option>
                  <option value="NAME_ASC">Sort: Name (A → Z)</option>
                  <option value="NAME_DESC">Sort: Name (Z → A)</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Reset Filters */}
              {(searchQuery || tierFilter !== 'ALL' || sortBy !== 'TOTAL_DESC') && (
                <button
                  onClick={handleResetFilters}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer flex-shrink-0"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* SEPARATE CUSTOMER TABLE CARD */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-100/80">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-slate-500 font-bold border-b border-slate-200/90 text-xs tracking-wider bg-slate-50/80 whitespace-nowrap">
                    <th className="py-3.5 px-5 uppercase whitespace-nowrap">CUSTOMER ID</th>
                    <th className="py-3.5 px-4 uppercase whitespace-nowrap">CUSTOMER NAME</th>
                    <th className="py-3.5 px-4 uppercase whitespace-nowrap">PHONE NUMBER</th>
                    <th className="py-3.5 px-4 uppercase whitespace-nowrap">EMAIL</th>
                    <th className="py-3.5 px-4 uppercase whitespace-nowrap">TIER</th>
                    <th className="py-3.5 px-4 uppercase whitespace-nowrap">TOTAL PURCHASES</th>
                    <th className="py-3.5 px-4 uppercase whitespace-nowrap">LAST PURCHASE</th>
                    <th className="py-3.5 px-5 uppercase whitespace-nowrap text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/90">
                  {paginatedCustomers.map((cust) => {
                    const isVIP = cust.totalPurchases >= 1000000;
                    const isRegular = cust.totalPurchases >= 100000 && cust.totalPurchases < 1000000;
                    const custCode = `#CST-${cust.id.length < 3 ? cust.id.padStart(3, '0') : cust.id}`;

                    return (
                      <tr
                        key={cust.id}
                        onClick={() => setSelectedCustomerDetails(cust)}
                        className="hover:bg-indigo-50/25 transition-colors group cursor-pointer"
                      >
                        {/* Customer ID */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50/90 text-[#4f46e5] font-mono font-bold text-xs border border-indigo-100/80 inline-block shadow-xs">
                            {custCode}
                          </span>
                        </td>

                        {/* Customer Name */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                              {cust.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-[#4f46e5] transition-colors whitespace-nowrap">{cust.name}</p>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-700 text-xs whitespace-nowrap">
                          {cust.phone}
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">
                          {cust.email || <span className="text-slate-300 italic">None</span>}
                        </td>

                        {/* Tier Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isVIP ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80 inline-flex items-center space-x-1 shadow-xs">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>VIP</span>
                            </span>
                          ) : isRegular ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-[#4f46e5] border border-indigo-200/60 inline-block shadow-xs">
                              Regular
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60 inline-block">
                              New
                            </span>
                          )}
                        </td>

                        {/* Total Purchases */}
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                          <span className="text-sm text-slate-900">{formatTZS(cust.totalPurchases)}</span>
                        </td>

                        {/* Last Purchase */}
                        <td className="py-3.5 px-4 text-slate-500 text-xs font-mono whitespace-nowrap">
                          {cust.lastPurchase}
                        </td>

                        {/* Actions with 3-dots Menu */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap relative">
                          <div className="inline-block text-left relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuCustId(openMenuCustId === cust.id ? null : cust.id);
                              }}
                              title="Actions Menu"
                              className="p-1.5 text-slate-500 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Floating Dropdown Menu */}
                            {openMenuCustId === cust.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20 cursor-default"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuCustId(null);
                                  }}
                                />
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuCustId(null);
                                      setSelectedCustomerDetails(cust);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-[#4f46e5] flex items-center space-x-2.5 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-[#4f46e5]" />
                                    <span>View Profile</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuCustId(null);
                                      handleOpenEdit(cust);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-[#4f46e5] flex items-center space-x-2.5 transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Edit Customer</span>
                                  </button>
                                  <div className="my-1 border-t border-slate-100" />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuCustId(null);
                                      setDeleteConfirmId(cust.id);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Delete Customer</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredCustomers.length === 0 && (
                <div className="py-12 text-center text-slate-400 font-medium text-sm">
                  No customers found matching your search.
                </div>
              )}
            </div>

            {/* Common Pagination Component (10 items per page) */}
            <div className="flex-shrink-0 pt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredCustomers.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                itemLabel="customers"
              />
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Juma Rashid"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+255712345678"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
                <p className="text-[10px] text-slate-400 mt-1">Format: +255XXXXXXXXX</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. juma.rashid@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>

              {formError && (
                <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  {formError}
                </p>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
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
            <h3 className="text-base font-black text-slate-900">Delete Customer?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove this customer record?
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

