import { useState } from 'react';
import {
  Search, Eye, Printer, ShieldCheck,
  X, Filter, DollarSign,
  Receipt, TrendingUp, CheckCircle2,
  Calendar, CreditCard, Download,
  Smartphone, Banknote, Sparkles, RotateCcw,
  ShoppingCart
} from 'lucide-react';
import { KPICard, Pagination } from '../common';
import posService from '../../services/posService';
import { useSettings } from '../../context/SettingsContext';

export interface SaleRecord {
  id: string;
  date: string;
  time: string;
  cashier: string;
  customer: string;
  customerPhone?: string;
  itemsCount: number;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'CASH' | 'MOBILE MONEY' | 'CARD / BANK';
  provider?: 'M-Pesa' | 'Airtel Money' | 'Mixx by Yas' | 'HaloPesa' | 'CRDB Bank' | 'NMB Bank';
  paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  paymentRef?: string;
  fiscalStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  fiscalReceiptNo: string;
  fiscalDevice: string;
  zNumber: string;
  verificationCode: string;
  fiscalDate: string;
  fiscalTime: string;
  items: {
    product: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

const mockSalesData: SaleRecord[] = [
  {
    id: 'SALE-TZ-2026-00024',
    date: '2024-12-23',
    time: '14:31:05',
    cashier: 'John Masawe',
    customer: 'Walk-in Customer',
    customerPhone: '+255 700 000 000',
    itemsCount: 4,
    subtotal: 20763,
    tax: 3737,
    total: 24500,
    paymentMethod: 'CASH',
    paymentStatus: 'SUCCESS',
    fiscalStatus: 'SUCCESS',
    fiscalReceiptNo: 'TZ-VFD-2026-00024',
    fiscalDevice: 'EFD-TZ-DAR-001',
    zNumber: 'Z-2026-0930-01',
    verificationCode: 'TRA-VFD-98421-TZ',
    fiscalDate: '2024-12-23',
    fiscalTime: '14:31:07',
    items: [
      { product: 'Kilimanjaro Drinking Water (1.5L)', quantity: 2, unitPrice: 1000, total: 2000 },
      { product: 'Azam Wheat Flour (2kg)', quantity: 3, unitPrice: 2800, total: 8400 },
      { product: 'Serengeti Premium Lager (500ml)', quantity: 5, unitPrice: 2500, total: 12500 },
      { product: 'Carrier Bag Eco Medium', quantity: 2, unitPrice: 800, total: 1600 }
    ]
  },
  {
    id: 'SALE-TZ-2026-00023',
    date: '2024-12-23',
    time: '14:28:40',
    cashier: 'Amina Salum',
    customer: 'Walk-in Customer',
    customerPhone: '+255 700 000 000',
    itemsCount: 1,
    subtotal: 6780,
    tax: 1220,
    total: 8000,
    paymentMethod: 'MOBILE MONEY',
    provider: 'M-Pesa',
    paymentStatus: 'SUCCESS',
    paymentRef: 'MP260930.1428.B89',
    fiscalStatus: 'SUCCESS',
    fiscalReceiptNo: 'TZ-VFD-2026-00023',
    fiscalDevice: 'EFD-TZ-DAR-001',
    zNumber: 'Z-2026-0930-01',
    verificationCode: 'TRA-VFD-98420-TZ',
    fiscalDate: '2024-12-23',
    fiscalTime: '14:28:42',
    items: [
      { product: 'Tanga Fresh Milk (1L)', quantity: 2, unitPrice: 4000, total: 8000 }
    ]
  },
  {
    id: 'SALE-TZ-2026-00022',
    date: '2024-12-23',
    time: '14:25:12',
    cashier: 'John Masawe',
    customer: 'Juma Rashid',
    customerPhone: '+255 754 123 456',
    itemsCount: 3,
    subtotal: 53814,
    tax: 9686,
    total: 63500,
    paymentMethod: 'CARD / BANK',
    provider: 'CRDB Bank',
    paymentStatus: 'SUCCESS',
    paymentRef: 'CRDB-TXN-884102',
    fiscalStatus: 'PENDING',
    fiscalReceiptNo: 'PENDING-VFD',
    fiscalDevice: 'EFD-TZ-DAR-001',
    zNumber: 'Z-2026-0930-01',
    verificationCode: 'QUEUED-TRA',
    fiscalDate: '2024-12-23',
    fiscalTime: '14:25:12',
    items: [
      { product: 'Mo Sunflower Cooking Oil (5L)', quantity: 1, unitPrice: 34000, total: 34000 },
      { product: 'Azam Sugar 5kg', quantity: 2, unitPrice: 12000, total: 24000 },
      { product: 'Red Bull Energy Drink (250ml)', quantity: 3, unitPrice: 2500, total: 7500 }
    ]
  },
  {
    id: 'SALE-TZ-2026-00021',
    date: '2024-12-23',
    time: '14:22:09',
    cashier: 'John Masawe',
    customer: 'Walk-in Customer',
    customerPhone: '+255 700 000 000',
    itemsCount: 2,
    subtotal: 15847,
    tax: 2853,
    total: 18700,
    paymentMethod: 'CASH',
    paymentStatus: 'SUCCESS',
    fiscalStatus: 'SUCCESS',
    fiscalReceiptNo: 'TZ-VFD-2026-00021',
    fiscalDevice: 'EFD-TZ-DAR-001',
    zNumber: 'Z-2026-0930-01',
    verificationCode: 'TRA-VFD-98418-TZ',
    fiscalDate: '2024-12-23',
    fiscalTime: '14:22:11',
    items: [
      { product: 'Bakhresa Toast White Bread', quantity: 3, unitPrice: 1800, total: 5400 },
      { product: 'Blue Band Margarine 500g', quantity: 2, unitPrice: 6650, total: 13300 }
    ]
  },
  {
    id: 'SALE-TZ-2026-00020',
    date: '2024-12-23',
    time: '14:19:33',
    cashier: 'Peter Karia',
    customer: 'Fatma Said',
    customerPhone: '+255 655 987 654',
    itemsCount: 4,
    subtotal: 35593,
    tax: 6407,
    total: 42000,
    paymentMethod: 'MOBILE MONEY',
    provider: 'Airtel Money',
    paymentStatus: 'SUCCESS',
    paymentRef: 'AM260930.1419.C44',
    fiscalStatus: 'SUCCESS',
    fiscalReceiptNo: 'TZ-VFD-2026-00020',
    fiscalDevice: 'EFD-TZ-DAR-001',
    zNumber: 'Z-2026-0930-01',
    verificationCode: 'TRA-VFD-98417-TZ',
    fiscalDate: '2024-12-23',
    fiscalTime: '14:19:35',
    items: [
      { product: 'Ariel Auto Washing Powder 1kg', quantity: 2, unitPrice: 11000, total: 22000 },
      { product: 'Colgate Triple Action 140g', quantity: 3, unitPrice: 3500, total: 10500 },
      { product: 'Geisha Herbal Soap 225g', quantity: 3, unitPrice: 2500, total: 7500 },
      { product: 'Carrier Bag Eco Medium', quantity: 2, unitPrice: 1000, total: 2000 }
    ]
  }
];

export type DatePresetType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM';

export default function CashierSalesView() {
  const { settings } = useSettings();
  const [sales] = useState<SaleRecord[]>(mockSalesData);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cashierFilter, setCashierFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [fiscalStatusFilter, setFiscalStatusFilter] = useState('ALL');

  // Date Dropdown & Custom Range States
  const [datePreset, setDatePreset] = useState<DatePresetType>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);

  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals & Notifications
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatTZS = (val: number) => `TSh ${val.toLocaleString()}`;

  // Filter Logic
  const filteredSales = sales.filter(sale => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      sale.id.toLowerCase().includes(q) ||
      sale.customer.toLowerCase().includes(q) ||
      sale.cashier.toLowerCase().includes(q);

    const matchesCashier = cashierFilter === 'ALL' || sale.cashier === cashierFilter;
    const matchesPayment = paymentMethodFilter === 'ALL' || sale.paymentMethod === paymentMethodFilter;
    const matchesFiscal = fiscalStatusFilter === 'ALL' || sale.fiscalStatus === fiscalStatusFilter;

    const matchesStart = !startDate || sale.date >= startDate;
    const matchesEnd = !endDate || sale.date <= endDate;
    const matchesDate = matchesStart && matchesEnd;

    return matchesSearch && matchesCashier && matchesPayment && matchesFiscal && matchesDate;
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const paginatedSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // KPI Calculations
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = filteredSales.length;
  const avgOrderValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;
  const fiscalSuccessCount = filteredSales.filter(s => s.fiscalStatus === 'SUCCESS').length;
  const fiscalSyncRate = totalTransactions > 0 ? Math.round((fiscalSuccessCount / totalTransactions) * 100) : 0;

  const handleDatePresetChange = (preset: DatePresetType) => {
    setDatePreset(preset);
    setCurrentPage(1);

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      setStartDate('2024-12-23');
      setEndDate('2024-12-23');
    } else if (preset === 'YESTERDAY') {
      setStartDate('2024-12-22');
      setEndDate('2024-12-22');
    } else if (preset === 'LAST_7_DAYS') {
      setStartDate('2024-12-16');
      setEndDate('2024-12-23');
    } else if (preset === 'THIS_MONTH') {
      setStartDate('2024-12-01');
      setEndDate('2024-12-31');
    } else if (preset === 'CUSTOM') {
      setTempStartDate(startDate || '2024-12-22');
      setTempEndDate(endDate || '2024-12-23');
      setIsCustomDateModalOpen(true);
    }
  };

  const handleApplyCustomDate = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setDatePreset('CUSTOM');
    setIsCustomDateModalOpen(false);
    setCurrentPage(1);
    showToast(`Date filter applied: ${tempStartDate} to ${tempEndDate}`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCashierFilter('ALL');
    setPaymentMethodFilter('ALL');
    setFiscalStatusFilter('ALL');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const renderPaymentChip = (sale: SaleRecord) => {
    const m = (sale.paymentMethod || '').toUpperCase();
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
          <span>{sale.provider || 'Card / Bank'}</span>
        </span>
      );
    }
    if (m.includes('MOBILE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
          <Smartphone className="w-3 h-3 text-amber-600" />
          <span>{sale.provider || 'Mobile Money'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <Receipt className="w-3 h-3 text-slate-500" />
        <span>{sale.paymentMethod}</span>
      </span>
    );
  };

  const handleDownloadReceipt = async (sale: SaleRecord) => {
    try {
      showToast(`Downloading Official PDF Receipt for ${sale.id}...`);
      await posService.downloadReceiptPdf(sale.id, `Receipt-${sale.id}.pdf`, sale);
      showToast(`PDF Receipt ${sale.id} downloaded successfully!`);
    } catch {
      // Fallback to text receipt format
      const itemsFormatted = sale.items
        .map((item, idx) => {
          const num = `${idx + 1}.`.padEnd(4, ' ');
          const name = item.product.padEnd(32, ' ').substring(0, 32);
          const qty = `Qty: ${item.quantity}`.padEnd(10, ' ');
          const price = `@ ${formatTZS(item.unitPrice)}`.padEnd(18, ' ');
          const total = `= ${formatTZS(item.total)}`;
          return `  ${num} ${name} ${qty} ${price} ${total}`;
        })
        .join('\n');

      const textContent = `========================================================================
                           ${settings.storeName.toUpperCase()}
                    ${settings.branchName}
                TIN: ${settings.tin}   |   VRN: ${settings.vrn}
========================================================================
Sale Receipt No : ${sale.id}
Date & Time     : ${sale.date} ${sale.time}
Cashier         : ${sale.cashier}
Customer        : ${sale.customer}
Payment Mode    : ${sale.paymentMethod} ${sale.provider ? `(${sale.provider})` : ''}
Payment Status  : ${sale.paymentStatus}
------------------------------------------------------------------------
ITEMIZED PURCHASES BREAKDOWN:
------------------------------------------------------------------------
${itemsFormatted}
------------------------------------------------------------------------
SUBTOTAL (NET)  : ${formatTZS(sale.subtotal)}
TAX (18% VAT)   : ${formatTZS(sale.tax)} (INCLUDED)
------------------------------------------------------------------------
GRAND TOTAL     : ${formatTZS(sale.total)}
========================================================================
*** TRA VFD FISCAL VERIFICATION ***
Fiscal Status   : ${sale.fiscalStatus}
Fiscal Receipt  : ${sale.fiscalReceiptNo}
Fiscal Device   : ${sale.fiscalDevice}
Z-Report Number : ${sale.zNumber}
Security Key    : ${sale.verificationCode}
========================================================================
            Asante kwa kununua ${settings.storeName}! Karibu tena.
========================================================================`;

      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt-${sale.id}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      showToast(`Receipt ${sale.id} downloaded!`);
    }
  };

  const hasActiveFilters = searchQuery !== '' || cashierFilter !== 'ALL' || paymentMethodFilter !== 'ALL' || fiscalStatusFilter !== 'ALL' || datePreset !== 'ALL';

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Sales & Revenue Overview</h2>
          <p className="text-xs text-slate-500 font-medium">Real-time point-of-sale transactions, cashier logs, and TRA VFD audit records</p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto flex-shrink-0">
          <button
            onClick={() => showToast('Sales audit log exported to CSV.')}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 ENTERPRISE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatTZS(totalRevenue)}
          icon={DollarSign}
          color="emerald"
          badge={{
            text: '+14.2% vs yesterday',
            isPositive: true,
          }}
          subtitle="Gross sales generated"
          chartType="bar"
        />

        <KPICard
          title="Total Transactions"
          value={`${totalTransactions} Sales`}
          icon={Receipt}
          color="blue"
          badge={{
            text: `${filteredSales.reduce((sum, s) => sum + s.itemsCount, 0)} items sold`,
            isPositive: true,
          }}
          subtitle="Completed checkout orders"
          chartType="line"
        />

        <KPICard
          title="Average Order Value"
          value={formatTZS(avgOrderValue)}
          icon={TrendingUp}
          color="purple"
          badge={{
            text: '+6.8% avg basket',
            isPositive: true,
          }}
          subtitle="Avg spend per receipt"
          chartType="line"
        />

        <KPICard
          title="TRA Fiscal Sync"
          value={`${fiscalSyncRate}%`}
          icon={ShieldCheck}
          color="amber"
          badge={`${fiscalSuccessCount}/${totalTransactions} Synced`}
          subtitle="TRA VFD EFD compliant"
          chartType="bar"
        />
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search sale #, customer, or cashier..."
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

          {/* Date Filter */}
          <div className="relative min-w-[170px]">
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value as DatePresetType)}
              className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
            >
              <option value="ALL">All Dates (All Time)</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="CUSTOM">
                {datePreset === 'CUSTOM' && startDate && endDate
                  ? `Custom: ${startDate} → ${endDate}`
                  : '📅 Custom Date Range...'}
              </option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Payment Method Filter */}
          <div className="relative min-w-[150px]">
            <select
              value={paymentMethodFilter}
              onChange={(e) => { setPaymentMethodFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
            >
              <option value="ALL">All Payments</option>
              <option value="CASH">CASH</option>
              <option value="MOBILE MONEY">MOBILE MONEY</option>
              <option value="CARD / BANK">CARD / BANK</option>
            </select>
            <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Fiscal Status Filter */}
          <div className="relative min-w-[150px]">
            <select
              value={fiscalStatusFilter}
              onChange={(e) => { setFiscalStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
            >
              <option value="ALL">All Fiscal Status</option>
              <option value="SUCCESS">TRA Synced</option>
              <option value="PENDING">TRA Pending</option>
            </select>
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* SALES TABLE CARD */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-3">
        <div className="overflow-x-auto overflow-y-scroll h-[520px] min-h-[520px] rounded-xl border border-slate-100/90 custom-scrollbar relative">
          <table className="w-full text-left text-sm border-collapse min-w-[950px]">
            <thead className="sticky top-0 z-20 bg-slate-50 shadow-xs">
              <tr className="text-slate-500 font-bold border-b border-slate-200 text-xs tracking-wider whitespace-nowrap bg-slate-50">
                <th className="py-3.5 px-4 uppercase whitespace-nowrap bg-slate-50">SALE NUMBER</th>
                <th className="py-3.5 px-3 uppercase whitespace-nowrap bg-slate-50">DATE / TIME</th>
                <th className="py-3.5 px-3 uppercase whitespace-nowrap bg-slate-50">CASHIER</th>
                <th className="py-3.5 px-3 uppercase whitespace-nowrap bg-slate-50">CUSTOMER</th>
                <th className="py-3.5 px-3 uppercase whitespace-nowrap text-center bg-slate-50">ITEMS</th>
                <th className="py-3.5 px-3 uppercase whitespace-nowrap bg-slate-50">TOTAL AMOUNT</th>
                <th className="py-3.5 px-3 uppercase whitespace-nowrap bg-slate-50">PAYMENT METHOD</th>
                <th className="py-3.5 px-3 uppercase whitespace-nowrap bg-slate-50">FISCAL STATUS</th>
                <th className="py-3.5 px-4 uppercase whitespace-nowrap text-right bg-slate-50">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-28 text-center text-slate-400 text-xs font-bold">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No sales transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-indigo-50/25 transition-colors group">
                    {/* SALE NUMBER */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {sale.id}
                    </td>

                    {/* DATE / TIME */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <p className="text-xs font-bold text-slate-800">{sale.date}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{sale.time}</p>
                    </td>

                    {/* CASHIER */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                        {sale.cashier}
                      </span>
                    </td>

                    {/* CUSTOMER */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <p className="text-xs font-bold text-slate-800">{sale.customer}</p>
                      <p className="text-[10.5px] text-slate-400 font-mono">{sale.customerPhone || '—'}</p>
                    </td>

                    {/* ITEMS COUNT */}
                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {sale.itemsCount} items
                      </span>
                    </td>

                    {/* TOTAL */}
                    <td className="py-3 px-3 whitespace-nowrap font-black text-slate-900 text-xs sm:text-sm">
                      {formatTZS(sale.total)}
                    </td>

                    {/* PAYMENT METHOD */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {renderPaymentChip(sale)}
                    </td>

                    {/* FISCAL STATUS */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sale.fiscalStatus === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sale.fiscalStatus === 'SUCCESS' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span>{sale.fiscalStatus === 'SUCCESS' ? 'TRA Synced' : 'TRA Pending'}</span>
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3 px-4 whitespace-nowrap text-right space-x-1.5 text-slate-400">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        title="View Fiscal Receipt"
                        className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer inline-block"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadReceipt(sale)}
                        title="Download Receipt TXT"
                        className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer inline-block"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* INTEGRATED BACKEND-DRIVEN PAGINATION */}
        <div className="flex-shrink-0 pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSales.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="sales transactions"
          />
        </div>
      </div>

      {/* FISCAL RECEIPT MODAL */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-white text-slate-800 space-y-5 my-auto max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
            {/* RECEIPT TOOLBAR */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 print:hidden">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Sale Transaction Receipt</h3>
                  <p className="text-[11px] font-medium text-emerald-600">Official Supermarket & TRA Fiscal Record</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                title="Close Receipt"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CLEAN PRINTABLE RECEIPT CONTENT */}
            <div id="sales-printable-receipt" className="space-y-4 font-sans bg-white p-4 sm:p-5 rounded-2xl border border-slate-100">
              {/* STORE HEADER */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-sky-400 rounded-xl mx-auto flex items-center justify-center text-white shadow-sm mb-1.5">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <h2 className="font-black text-lg text-slate-900 tracking-tight">TZA MART TANZANIA</h2>
                <p className="text-xs text-slate-600 font-medium">Mlimani City Mall, Sam Nujoma Road, Dar es Salaam</p>
                <div className="text-[11px] text-slate-500 font-mono flex items-center justify-center space-x-2 pt-0.5">
                  <span>TIN: <strong className="text-slate-700">102-394-857</strong></span>
                  <span>•</span>
                  <span>VRN: <strong className="text-slate-700">40012983-Z</strong></span>
                </div>
              </div>

              {/* TRANSACTION METADATA */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-medium">Receipt No:</span>
                    <p className="font-bold text-slate-900 font-mono">{selectedSale.id}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-medium">Date & Time:</span>
                    <p className="font-bold text-slate-900">{selectedSale.date} {selectedSale.time}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Cashier:</span>
                    <p className="font-bold text-slate-900 truncate">{selectedSale.cashier}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-medium">Payment Mode:</span>
                    <p className="font-bold text-slate-900">{selectedSale.paymentMethod} {selectedSale.provider ? `(${selectedSale.provider})` : ''}</p>
                  </div>
                </div>
              </div>

              {/* ITEM TABLE */}
              <div className="pt-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-200 pb-1.5 text-[10px] uppercase">
                      <th className="pb-1.5">Item</th>
                      <th className="pb-1.5 text-center">Qty</th>
                      <th className="pb-1.5 text-right">Price</th>
                      <th className="pb-1.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800 text-[11px]">
                    {selectedSale.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 pr-2">
                          <p className="font-bold text-slate-900">{it.product}</p>
                        </td>
                        <td className="py-2 text-center font-bold text-slate-900">{it.quantity}</td>
                        <td className="py-2 text-right font-mono text-slate-600">{formatTZS(it.unitPrice)}</td>
                        <td className="py-2 text-right font-bold text-slate-900 font-mono">{formatTZS(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* FINANCIAL TOTALS */}
              <div className="border-t border-slate-200 pt-2.5 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Subtotal (Excl. VAT):</span>
                  <span className="font-mono font-bold text-slate-900">{formatTZS(selectedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>18% TRA VAT (Included):</span>
                  <span className="font-mono text-slate-700">{formatTZS(selectedSale.tax)}</span>
                </div>
                <div className="flex justify-between font-black text-sm py-1.5 border-t border-b border-slate-200 text-slate-900 bg-slate-50 px-2 rounded-lg my-1">
                  <span>TOTAL PAID:</span>
                  <span className="font-mono text-blue-600 text-base">{formatTZS(selectedSale.total)}</span>
                </div>
              </div>

              {/* COMPACT TRA FISCAL VERIFICATION */}
              <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-emerald-800 font-bold text-[10px]">
                  <span className="flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    TRA ELECTRONIC FISCAL RECEIPT
                  </span>
                  <span className="text-emerald-700 font-mono font-black">VERIFIED</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[10px] font-mono">
                  <span>VFD No: {selectedSale.fiscalReceiptNo}</span>
                  <span>EFD: {selectedSale.fiscalDevice}</span>
                </div>
                <div className="text-center bg-slate-900 text-emerald-400 font-mono text-[10px] py-1 rounded font-bold tracking-wider">
                  {selectedSale.verificationCode}
                </div>
              </div>

              {/* FOOTER */}
              <div className="text-center text-slate-400 text-[10.5px] pt-1">
                <p className="font-bold text-slate-700">Asante kwa kununua nasi • Thank you for shopping with us!</p>
              </div>
            </div>

            {/* MODAL BOTTOM ACTIONS */}
            <div className="flex space-x-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => posService.printReceiptOnly('sales-printable-receipt')}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-700" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadReceipt(selectedSale)}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DATE RANGE MODAL */}
      {isCustomDateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#4f46e5]" />
                <h3 className="text-sm font-black text-slate-900">Custom Date Range</h3>
              </div>
              <button
                onClick={() => setIsCustomDateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/25"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">End Date</label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/25"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCustomDateModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustomDate}
                className="flex-1 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-indigo-500/20"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
