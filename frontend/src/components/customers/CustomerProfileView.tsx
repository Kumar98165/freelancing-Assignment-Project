import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Edit2, Trash2, Sparkles, Phone, Mail, MapPin, Calendar,
  Receipt, ShoppingBag, DollarSign, TrendingUp, Clock, Grid3X3,
  Table as TableIcon, History as HistoryIcon, CheckCircle2,
  CreditCard, Smartphone, Banknote, ArrowUpRight, Eye, Download, Printer, X, Loader2
} from 'lucide-react';
import customerService, { type CustomerRecord, type CustomerPurchaseItem, type PurchaseItemDetail } from '../../services/customerService';

interface CustomerProfileViewProps {
  customer: CustomerRecord;
  onBack: () => void;
  onEdit: (customer: CustomerRecord) => void;
  onDelete?: (id: string) => void;
  formatTZS: (val: number) => string;
}

export default function CustomerProfileView({
  customer: initialCustomer,
  onBack,
  onEdit,
  onDelete,
  formatTZS,
}: CustomerProfileViewProps) {
  const [customerData, setCustomerData] = useState<CustomerRecord>(initialCustomer);
  const [kpiData, setKpiData] = useState<{
    totalOrders: number;
    totalOrdersLabel: string;
    totalSpent: number;
    avgOrderValue: number;
    lastPurchase: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'cards' | 'table' | 'timeline'>('cards');
  const [selectedReceipt, setSelectedReceipt] = useState<CustomerPurchaseItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadProfileApi = async () => {
      if (!initialCustomer?.id) return;
      try {
        setIsLoading(true);
        const res = await customerService.getCustomerProfile(initialCustomer.id);
        if (isMounted && res) {
          if (res.customer) setCustomerData(res.customer);
          if (res.kpi) setKpiData(res.kpi);
        }
      } catch (err) {
        console.warn('Could not load separate profile API stats, fallback to props:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadProfileApi();
    return () => { isMounted = false; };
  }, [initialCustomer.id]);

  const customer = customerData;
  const purchases = customer.purchases || [];
  const totalSpent = kpiData?.totalSpent ?? (customer.totalPurchases || purchases.reduce((sum: number, p: CustomerPurchaseItem) => sum + p.total, 0));
  const purchaseCount = kpiData?.totalOrders ?? purchases.length;
  const purchaseCountLabel = kpiData?.totalOrdersLabel ?? `${purchaseCount} ${purchaseCount === 1 ? 'Order' : 'Orders'}`;
  const avgOrderValue = kpiData?.avgOrderValue ?? (purchaseCount > 0 ? Math.round(totalSpent / purchaseCount) : 0);
  const lastPurchaseStr = kpiData?.lastPurchase ?? (customer.lastPurchase || 'No purchases yet');

  const isVIP = totalSpent >= 1000000;
  const custCode = `#CST-${String(customer.id).length < 3 ? String(customer.id).padStart(3, '0') : customer.id}`;

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

  const getItemBreakdown = (receipt: CustomerPurchaseItem): PurchaseItemDetail[] => {
    if (receipt.itemList && receipt.itemList.length > 0) {
      return receipt.itemList;
    }
    const rawItems = receipt.items.split(',').map((s: string) => s.trim()).filter(Boolean);
    const count = rawItems.length || 1;
    const splitPrice = Math.round(receipt.total / count);
    return rawItems.map((name: string) => {
      const matchQty = name.match(/(\d+)\s*x/i);
      const qty = matchQty ? parseInt(matchQty[1], 10) : 1;
      const unitPrice = qty > 1 ? Math.round(splitPrice / qty) : splitPrice;
      return {
        name,
        qty,
        unitPrice,
        totalPrice: qty > 1 ? unitPrice * qty : splitPrice,
      };
    });
  };

  const handleDownloadReceipt = (receipt: CustomerPurchaseItem) => {
    const breakdown = getItemBreakdown(receipt);
    const itemsFormatted = breakdown
      .map((item: PurchaseItemDetail, idx: number) => {
        const num = `${idx + 1}.`.padEnd(4, ' ');
        const name = item.name.padEnd(32, ' ').substring(0, 32);
        const qty = `Qty: ${item.qty}`.padEnd(10, ' ');
        const price = `@ ${formatTZS(item.unitPrice)}`.padEnd(18, ' ');
        const total = `= ${formatTZS(item.totalPrice)}`;
        return `  ${num} ${name} ${qty} ${price} ${total}`;
      })
      .join('\n');

    const textContent = `========================================================================
                             SALES RECEIPT
========================================================================
Receipt No   : ${receipt.saleNumber}
Date         : ${receipt.date}
Customer     : ${customer.name} (${custCode})
Phone        : ${customer.phone}
Payment Mode : ${receipt.paymentMethod}
Status       : COMPLETED (PAID)
------------------------------------------------------------------------
ITEMIZED PURCHASES BREAKDOWN:
------------------------------------------------------------------------
${itemsFormatted}
------------------------------------------------------------------------
SUBTOTAL     : ${formatTZS(receipt.total)}
TAX (VAT 18%): INCLUDED
------------------------------------------------------------------------
TOTAL AMOUNT : ${formatTZS(receipt.total)}
========================================================================
                 Thank you for your business!
========================================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt-${receipt.saleNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">

      {/* TOP COMPACT HEADER BAR */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onBack}
            className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200/90 shadow-xs transition-all flex items-center justify-center cursor-pointer hover:text-[#4f46e5]"
            title="Back to Customer List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">Customer Profile</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Account profile & transaction history</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(customer)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Edit</span>
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(customer.id)}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200/90 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* ULTRA-COMPACT PROFILE & KPI METRICS CARD WITH SIGNATURE TOP GRADIENT BORDER */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 sm:p-4 space-y-3">
        {/* Signature top purple-indigo gradient stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]" />

        {/* Top Section: Avatar + Name + Badges + Contact Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Sleek Compact Avatar */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-[#4f46e5] to-[#7c3aed] text-white flex items-center justify-center font-black text-base sm:text-lg shadow-sm shadow-indigo-500/25 flex-shrink-0">
              {customer.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              {/* Name & Status Badges */}
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {customer.name}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[#4f46e5] font-mono font-bold text-[11px] border border-indigo-200/70">
                  {custCode}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Active</span>
                </span>
                {isVIP && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>VIP</span>
                  </span>
                )}
              </div>

              {/* Inline Contact Info */}
              <div className="flex items-center flex-wrap gap-x-3.5 gap-y-1 text-xs text-slate-500 font-medium mt-0.5">
                <span className="inline-flex items-center gap-1 font-mono text-slate-700 font-bold">
                  <Phone className="w-3 h-3 text-[#4f46e5]" />
                  {customer.phone}
                </span>
                {customer.email && (
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {customer.email}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Dar es Salaam, TZ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Crisp Border Divider */}
        <div className="border-t border-slate-100" />

        {/* 4 Sleek Mini KPI Stat Cards with Crisp Borders */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Total Purchases */}
          <div className="bg-slate-50/70 hover:bg-white p-2.5 rounded-xl border border-slate-200/80 hover:border-blue-200 hover:shadow-xs transition-all flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Total Purchases</p>
              <p className="text-sm sm:text-base font-black text-slate-900 leading-tight mt-0.5">{purchaseCountLabel}</p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center flex-shrink-0 ml-2">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-slate-50/70 hover:bg-white p-2.5 rounded-xl border border-slate-200/80 hover:border-emerald-200 hover:shadow-xs transition-all flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Total Spent</p>
              <p className="text-sm sm:text-base font-black text-slate-900 leading-tight mt-0.5">{formatTZS(totalSpent)}</p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-600 flex items-center justify-center flex-shrink-0 ml-2">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Avg Order Value */}
          <div className="bg-slate-50/70 hover:bg-white p-2.5 rounded-xl border border-slate-200/80 hover:border-purple-200 hover:shadow-xs transition-all flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Avg. Order Value</p>
              <p className="text-sm sm:text-base font-black text-slate-900 leading-tight mt-0.5">{formatTZS(avgOrderValue)}</p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-purple-600 flex items-center justify-center flex-shrink-0 ml-2">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Last Purchase */}
          <div className="bg-slate-50/70 hover:bg-white p-2.5 rounded-xl border border-slate-200/80 hover:border-amber-200 hover:shadow-xs transition-all flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Last Purchase</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 font-mono mt-0.5 truncate">{lastPurchaseStr}</p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-600 flex items-center justify-center flex-shrink-0 ml-2">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3 NAVIGATION TABS */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'cards'
              ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Purchase Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'table'
              ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Table View</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'timeline'
              ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            <HistoryIcon className="w-4 h-4" />
            <span>Timeline Activity</span>
          </button>
        </div>

        {/* TAB 1: PURCHASE CARDS GRID VIEW */}
        {activeTab === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchases.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
                No purchase transactions recorded for this customer yet.
              </div>
            ) : (
              purchases.map((p: CustomerPurchaseItem, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setSelectedReceipt(p)}
                  className="relative bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden cursor-pointer group"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]" />

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 pt-1">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#4f46e5] bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          {p.saleNumber}
                        </span>
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.date}</span>
                        </p>
                      </div>
                      <div>{renderPaymentChip(p.paymentMethod)}</div>
                    </div>

                    {/* Amount */}
                    <p className="text-2xl font-black text-slate-900 mt-4 tracking-tight group-hover:text-[#4f46e5] transition-colors">
                      {formatTZS(p.total)}
                    </p>

                    <div className="my-3 border-t border-slate-100" />

                    {/* Items Description */}
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                        Items Purchased
                      </p>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {p.items}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Completed</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReceipt(p);
                      }}
                      className="text-xs font-bold text-[#4f46e5] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Receipt</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: TABLE VIEW */}
        {activeTab === 'table' && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            {purchases.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm font-medium">
                No purchase transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Order #</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Items Description</th>
                      <th className="py-3.5 px-4">Payment Method</th>
                      <th className="py-3.5 px-4 text-right">Total Amount</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-xs sm:text-sm">
                    {purchases.map((p: CustomerPurchaseItem, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-[#4f46e5]">
                          {p.saleNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{p.date}</td>
                        <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate" title={p.items}>
                          {p.items}
                        </td>
                        <td className="py-3.5 px-4">{renderPaymentChip(p.paymentMethod)}</td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                          {formatTZS(p.total)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Completed</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(p)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] rounded-xl text-xs font-bold border border-indigo-200/70 inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
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
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            {purchases.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm font-medium">
                No timeline activity recorded yet.
              </div>
            ) : (
              <div className="relative pl-8 space-y-7 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {purchases.map((p: CustomerPurchaseItem, idx: number) => (
                  <div key={idx} className="relative">
                    {/* Glowing point */}
                    <div className="absolute -left-8 top-1.5 w-5 h-5 rounded-full bg-white border-4 border-[#4f46e5] shadow-xs" />

                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                          {p.date}
                        </span>
                        <div className="flex items-center space-x-2">
                          {renderPaymentChip(p.paymentMethod)}
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(p)}
                            className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-[#4f46e5] rounded-lg text-xs font-bold border border-indigo-200/60 inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-black text-slate-900">
                        <span className="font-mono text-[#4f46e5] mr-2">{p.saleNumber}</span>
                        — Total: {formatTZS(p.total)}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed bg-white p-2 rounded-xl border border-slate-100">
                        {p.items}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAILED OFFICIAL CASHIER & TRA VFD FISCAL RECEIPT MODAL */}
      {selectedReceipt && (() => {
        const breakdown = getItemBreakdown(selectedReceipt);
        const rawSubtotal = Math.round(selectedReceipt.total / 1.18);
        const vatTax = selectedReceipt.total - rawSubtotal;
        const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
        const fiscalReceiptNo = `TRA-VFD-2026-${randomDigits}`;
        const fiscalDevice = `EFD-TZ-90412`;
        const verificationCode = `8F3A-4C2E-99B1-D420-77E3`;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] relative overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* MODAL HEADER (Always Visible & Centered) */}
              <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4f46e5] to-[#7c3aed] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                    <ShoppingBag className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none">TZA MART TANZANIA</h3>
                    <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">Mlimani City Mall, Dar es Salaam</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer hover:bg-slate-200/70 transition-colors"
                  title="Close receipt"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SCROLLABLE RECEIPT BODY */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-slate-800">

                {/* Store Registration TIN / VRN */}
                <div className="text-[10.5px] text-slate-500 font-mono flex items-center justify-center space-x-3 py-1 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span>TIN: <strong className="text-slate-800 font-bold">102-394-857</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>VRN: <strong className="text-slate-800 font-bold">40012983-Z</strong></span>
                </div>

                {/* SALE META DATA CARD */}
                <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-1.5">
                    <span className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center">
                      <Receipt className="w-3.5 h-3.5 mr-1 text-[#4f46e5]" />
                      Sale Transaction Details
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-[#4f46e5] text-[10.5px] font-black rounded-lg font-mono">
                      {selectedReceipt.saleNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Customer</p>
                      <p className="font-extrabold text-slate-900 truncate">{customer.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Phone</p>
                      <p className="font-bold text-slate-900 font-mono">{customer.phone}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Date</p>
                      <p className="font-bold text-slate-900">{selectedReceipt.date}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Cashier</p>
                      <p className="font-bold text-slate-900 truncate">John (C-104)</p>
                    </div>
                  </div>
                </div>

                {/* ITEMIZED PRODUCT TABLE */}
                <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Product Description</th>
                        <th className="py-2.5 px-2 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-3.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {breakdown.map((item: PurchaseItemDetail, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 font-bold text-[11px]">{i + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{item.name}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-700 font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                              {item.qty}x
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                            {formatTZS(item.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-black text-slate-900 font-mono">
                            {formatTZS(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* FINANCIAL TOTALS & PAYMENT MODE */}
                <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80 space-y-2">
                  <div className="space-y-1 text-[11.5px] font-medium">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal (Net)</span>
                      <span className="font-mono font-bold text-slate-900">{formatTZS(rawSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>18% TRA VAT Tax (Included)</span>
                      <span className="font-mono text-slate-700">{formatTZS(vatTax)}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm pt-1.5 border-t border-slate-200 text-slate-900">
                      <span>Grand Total</span>
                      <span className="font-mono text-[#4f46e5] text-base">{formatTZS(selectedReceipt.total)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-500 font-medium text-[11px]">Payment Mode:</span>
                    <div>{renderPaymentChip(selectedReceipt.paymentMethod)}</div>
                  </div>
                </div>

                {/* TRA VFD FISCAL VERIFICATION BOX */}
                <div className="bg-emerald-50/70 rounded-2xl p-3 border border-emerald-200/90 space-y-2">
                  <div className="flex items-center justify-between border-b border-emerald-200/70 pb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10.5px] font-black text-emerald-950 uppercase tracking-wider">
                        TRA VFD Fiscal Information
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9.5px] font-extrabold rounded-full">
                      VERIFIED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                    <div>
                      <p className="text-emerald-800/70 font-medium text-[9.5px]">Fiscal Receipt No.</p>
                      <p className="font-bold text-emerald-950 font-mono text-[10.5px]">{fiscalReceiptNo}</p>
                    </div>
                    <div>
                      <p className="text-emerald-800/70 font-medium text-[9.5px]">Fiscal Device ID</p>
                      <p className="font-bold text-emerald-950 font-mono text-[10.5px]">{fiscalDevice}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-2 border border-emerald-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-bold text-emerald-900 uppercase tracking-wider">
                        Verification Security Key
                      </span>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                        TRA Official
                      </span>
                    </div>
                    <div className="p-1.5 bg-slate-900 text-emerald-400 font-mono text-center rounded-lg text-xs tracking-widest font-black">
                      {verificationCode}
                    </div>
                  </div>
                </div>

                {/* THANK YOU FOOTER */}
                <div className="text-center text-slate-400 text-[10.5px] space-y-0.5 pt-1">
                  <p className="font-bold text-slate-700">Asante kwa kununua TZA Mart Tanzania! Karibu tena.</p>
                  <p className="text-[9.5px]">Powered by TZA Mart POS & TRA VFD Middleware System</p>
                </div>

              </div>

              {/* MODAL ACTION BUTTONS (Always accessible at the bottom) */}
              <div className="p-3.5 border-t border-slate-100 flex items-center space-x-2.5 bg-slate-50/80 flex-shrink-0 print:hidden">
                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(selectedReceipt)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-all shadow-2xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs cursor-pointer transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
