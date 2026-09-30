import React, { useState } from 'react';
import {
  X, Edit2, Trash2, Sparkles, Phone, Mail, MapPin, Calendar,
  Receipt, ShoppingBag, DollarSign, TrendingUp, Clock, Grid3X3,
  Table as TableIcon, History as HistoryIcon, CheckCircle2,
  CreditCard, Smartphone, Banknote, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import type { CustomerRecord } from '../../pages/Customers';

interface CustomerProfileDrawerProps {
  customer: CustomerRecord | null;
  onClose: () => void;
  onEdit: (customer: CustomerRecord) => void;
  onDelete?: (id: string) => void;
  formatTZS: (val: number) => string;
}

export default function CustomerProfileDrawer({
  customer,
  onClose,
  onEdit,
  onDelete,
  formatTZS,
}: CustomerProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<'cards' | 'table' | 'timeline'>('cards');

  if (!customer) return null;

  const purchases = customer.purchases || [];
  const totalSpent = customer.totalPurchases || purchases.reduce((sum, p) => sum + p.total, 0);
  const purchaseCount = purchases.length;
  const avgOrderValue = purchaseCount > 0 ? Math.round(totalSpent / purchaseCount) : 0;
  const isVIP = totalSpent >= 1000000;
  const isRegular = totalSpent >= 100000 && totalSpent < 1000000;
  const custCode = `#CST-${customer.id.length < 3 ? customer.id.padStart(3, '0') : customer.id}`;

  const renderPaymentChip = (method: string) => {
    const m = (method || '').toUpperCase();
    if (m.includes('CASH')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <Banknote className="w-3 h-3 text-emerald-600" />
          <span>Cash</span>
        </span>
      );
    }
    if (m.includes('CARD') || m.includes('BANK')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
          <CreditCard className="w-3 h-3 text-blue-600" />
          <span>Card / Bank</span>
        </span>
      );
    }
    if (m.includes('MOBILE') || m.includes('M-PESA') || m.includes('AIRTEL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
          <Smartphone className="w-3 h-3 text-amber-600" />
          <span>Mobile Money</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <Receipt className="w-3 h-3 text-slate-500" />
        <span>{method}</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Side Drawer Container */}
      <div className="relative w-full max-w-2xl bg-[#f8f9fb] h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-200/80">

        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition-all cursor-pointer border border-slate-200/60"
          title="Close Profile"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* Drawer Body Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">

          {/* PROFILE HERO CARD */}
          <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200/70 shadow-sm">
            {/* Hero Gradient Banner */}
            <div
              className="h-32 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
              }}
            >
              {/* Subtle glass particles/circles */}
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute left-1/3 -bottom-10 w-32 h-32 rounded-full bg-white/10 blur-lg pointer-events-none" />
            </div>

            {/* Hero Body Content */}
            <div className="px-6 pb-6 pt-0 relative">
              {/* Overlapping Large Avatar & Header Actions */}
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-[#4f46e5] to-[#9333ea] text-white flex items-center justify-center font-black text-2xl sm:text-3xl tracking-tight border-4 border-white shadow-lg -mt-10 sm:-mt-11 z-10 flex-shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex items-center space-x-2 pb-1">
                  <button
                    onClick={() => {
                      onEdit(customer);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Edit</span>
                  </button>

                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(customer.id);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Name, Status Badges & Customer Code */}
              <div className="mt-3">
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {customer.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Active Customer</span>
                  </span>
                  {isVIP && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>VIP Tier</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 font-medium mt-1">
                  Customer ID: <strong className="text-slate-700 font-mono">{custCode}</strong> · Last Visit: <strong className="text-slate-700">{customer.lastPurchase}</strong>
                </p>
              </div>

              {/* Contact Information Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Phone</p>
                    <p className="text-xs font-bold text-slate-900 font-mono truncate">{customer.phone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Email</p>
                    <p className="text-xs font-bold text-slate-900 truncate" title={customer.email || 'None'}>
                      {customer.email || <span className="text-slate-400 italic">None</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Location</p>
                    <p className="text-xs font-bold text-slate-900 truncate">Dar es Salaam, TZ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 STAT CARDS ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Purchases */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Purchases</p>
                <p className="text-base font-black text-slate-900 leading-tight">{purchaseCount}</p>
              </div>
            </div>

            {/* Total Spent */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Total Spent</p>
                <p className="text-base font-black text-slate-900 leading-tight">{formatTZS(totalSpent)}</p>
              </div>
            </div>

            {/* Avg Order Value */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Avg Order</p>
                <p className="text-base font-black text-slate-900 leading-tight">{formatTZS(avgOrderValue)}</p>
              </div>
            </div>

            {/* Last Purchase */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Last Order</p>
                <p className="text-xs font-bold text-slate-800 font-mono truncate">{customer.lastPurchase}</p>
              </div>
            </div>
          </div>

          {/* 3 NAVIGATION TABS */}
          <div className="space-y-4">
            <div className="flex items-center space-x-1.5 border-b border-slate-200/80 pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('cards')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${activeTab === 'cards'
                    ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Purchase Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${activeTab === 'table'
                    ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${activeTab === 'timeline'
                    ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
              >
                <HistoryIcon className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
            </div>

            {/* TAB 1: PURCHASE CARDS GRID VIEW */}
            {activeTab === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {purchases.length === 0 ? (
                  <div className="col-span-full text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                    No purchase records registered for this customer yet.
                  </div>
                ) : (
                  purchases.map((p, idx) => (
                    <div
                      key={idx}
                      className="relative bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                    >
                      {/* Top Accent Strip */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]" />

                      <div>
                        {/* Header: ID, Date & Payment */}
                        <div className="flex items-start justify-between gap-2 pt-1">
                          <div>
                            <span className="font-mono text-xs font-bold text-[#4f46e5] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              {p.saleNumber}
                            </span>
                            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{p.date}</span>
                            </p>
                          </div>
                          <div>{renderPaymentChip(p.paymentMethod)}</div>
                        </div>

                        {/* Amount */}
                        <p className="text-xl font-black text-slate-900 mt-3 tracking-tight">
                          {formatTZS(p.total)}
                        </p>

                        <div className="my-2.5 border-t border-slate-100" />

                        {/* Items Breakdown */}
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                            Items Description
                          </p>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-2 rounded-xl">
                            {p.items}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Completed</span>
                        </span>
                        <span className="text-[11px] font-bold text-[#4f46e5] hover:underline flex items-center gap-0.5 cursor-pointer">
                          <span>View Sale</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: TABLE VIEW */}
            {activeTab === 'table' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                {purchases.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs font-medium">
                    No purchase transactions found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80 uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Order #</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Items</th>
                          <th className="p-3">Payment</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {purchases.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 font-mono font-bold text-[#4f46e5]">
                              {p.saleNumber}
                            </td>
                            <td className="p-3 text-slate-500 font-mono">{p.date}</td>
                            <td className="p-3 text-slate-700 max-w-[160px] truncate" title={p.items}>
                              {p.items}
                            </td>
                            <td className="p-3">{renderPaymentChip(p.paymentMethod)}</td>
                            <td className="p-3 text-right font-extrabold text-slate-900">
                              {formatTZS(p.total)}
                            </td>
                            <td className="p-3 text-right">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                <span>Completed</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TIMELINE VIEW */}
            {activeTab === 'timeline' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                {purchases.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    No timeline activity recorded yet.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {purchases.map((p, idx) => (
                      <div key={idx} className="relative">
                        {/* Timeline Glowing Dot */}
                        <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-3 border-[#4f46e5] shadow-xs" />

                        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                              {p.date}
                            </span>
                            {renderPaymentChip(p.paymentMethod)}
                          </div>
                          <p className="text-xs font-black text-slate-900">
                            <span className="font-mono text-[#4f46e5] mr-1.5">{p.saleNumber}</span>
                            — {formatTZS(p.total)}
                          </p>
                          <p className="text-[11px] text-slate-600">{p.items}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-5 border-t border-slate-200/80 bg-white flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              onEdit(customer);
              onClose();
            }}
            className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer text-center"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}
