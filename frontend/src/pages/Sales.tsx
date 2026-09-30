import { useState } from 'react';
import {
  Search, Eye, Printer, ShieldCheck,
  Clock3, X, History as HistoryIcon, Filter, DollarSign,
  Receipt, TrendingUp, CheckCircle2,
  Calendar, CreditCard, ShoppingBag, Download,
  Smartphone, Banknote, Sparkles
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { KPICard, Pagination } from '../components/common';

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
      { product: 'Fresh Tanzanian Tomatoes (1KG)', quantity: 1, unitPrice: 5500, total: 5500 }
    ]
  },
  {
    id: 'SALE-TZ-2026-00021',
    date: '2024-12-23',
    time: '14:22:09',
    cashier: 'Amina Salum',
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
      { product: 'Colgate Triple Action Toothpaste', quantity: 2, unitPrice: 4500, total: 9000 },
      { product: 'Omo Detergent Powder 1kg', quantity: 1, unitPrice: 9700, total: 9700 }
    ]
  },
  {
    id: 'SALE-TZ-2026-00020',
    date: '2024-12-23',
    time: '14:19:33',
    cashier: 'John Masawe',
    customer: 'Amina Salum (VIP)',
    customerPhone: '+255 713 987 654',
    itemsCount: 2,
    subtotal: 35593,
    tax: 6407,
    total: 42000,
    paymentMethod: 'MOBILE MONEY',
    provider: 'Airtel Money',
    paymentStatus: 'SUCCESS',
    paymentRef: 'AIRTEL-MO-77341',
    fiscalStatus: 'PENDING',
    fiscalReceiptNo: 'PENDING-VFD',
    fiscalDevice: 'EFD-TZ-DAR-001',
    zNumber: 'Z-2026-0930-01',
    verificationCode: 'QUEUED-TRA',
    fiscalDate: '2024-12-23',
    fiscalTime: '14:19:33',
    items: [
      { product: 'Bakhresa White Rice 10kg', quantity: 1, unitPrice: 32000, total: 32000 },
      { product: 'Kilimanjaro Drinking Water (1.5L)', quantity: 10, unitPrice: 1000, total: 10000 }
    ]
  },
  {
    id: 'SALE-TZ-2026-00019',
    date: '2024-12-22',
    time: '17:45:10',
    cashier: 'Peter Karia',
    customer: 'Godfrey Masawe',
    customerPhone: '+255 784 555 111',
    itemsCount: 3,
    subtotal: 72034,
    tax: 12966,
    total: 85000,
    paymentMethod: 'MOBILE MONEY',
    provider: 'Mixx by Yas',
    paymentStatus: 'SUCCESS',
    paymentRef: 'MIXX-9901-TZ',
    fiscalStatus: 'SUCCESS',
    fiscalReceiptNo: 'TZ-VFD-2026-00019',
    fiscalDevice: 'EFD-TZ-DAR-001',
    zNumber: 'Z-2026-0922-01',
    verificationCode: 'TRA-VFD-98405-TZ',
    fiscalDate: '2024-12-22',
    fiscalTime: '17:45:12',
    items: [
      { product: 'Serengeti Premium Lager (Crate)', quantity: 1, unitPrice: 48000, total: 48000 },
      { product: 'Mo Sunflower Cooking Oil (5L)', quantity: 1, unitPrice: 34000, total: 34000 },
      { product: 'Carrier Bag', quantity: 3, unitPrice: 1000, total: 3000 }
    ]
  }
];

export type DatePresetType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM';

export default function Sales() {
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

  // Temporary inputs for the Custom Date Picker Modal
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

    // Date Range Matching
    const matchesStart = !startDate || sale.date >= startDate;
    const matchesEnd = !endDate || sale.date <= endDate;
    const matchesDate = matchesStart && matchesEnd;

    return matchesSearch && matchesCashier && matchesPayment && matchesFiscal && matchesDate;
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const paginatedSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // KPI Calculations (4 Cards)
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = filteredSales.length;
  const avgOrderValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;
  const fiscalSuccessCount = filteredSales.filter(s => s.fiscalStatus === 'SUCCESS').length;
  const fiscalSyncRate = totalTransactions > 0 ? Math.round((fiscalSuccessCount / totalTransactions) * 100) : 0;

  // Handle dropdown selection
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

  const handleDownloadReceipt = (sale: SaleRecord) => {
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
                         TZA MART TANZANIA
                 Mlimani City Mall, Dar es Salaam
             TIN: 102-394-857   |   VRN: 40012983-Z
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
            Asante kwa kununua TZA Mart Tanzania! Karibu tena.
========================================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt-${sale.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Receipt ${sale.id} downloaded!`);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <AdminLayout title="Sales Transactions">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Sales & Revenue Overview</h2>
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

        {/* 4 ENTERPRISE WHITE GLASSMORPHISM KPI CARDS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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

        {/* SEPARATE FILTER & SEARCH BAR CARD WITH DROP-DOWN LIST */}
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

            {/* DATE FILTER DROPDOWN LIST */}
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

            {/* Cashier Filter */}
            <div className="relative min-w-[140px]">
              <select
                value={cashierFilter}
                onChange={(e) => { setCashierFilter(e.target.value); setCurrentPage(1); }}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1] cursor-pointer appearance-none transition-all"
              >
                <option value="ALL">All Cashiers</option>
                <option value="John Masawe">John Masawe</option>
                <option value="Amina Salum">Amina Salum</option>
                <option value="Peter Karia">Peter Karia</option>
              </select>
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
          </div>
        </div>

        {/* SEPARATE SALES TABLE CARD (EXACT CUSTOMER MODULE DESIGN) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-100/80">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-slate-500 font-bold border-b border-slate-200/90 text-xs tracking-wider bg-slate-50/80 whitespace-nowrap">
                  <th className="py-3.5 px-5 uppercase whitespace-nowrap">SALE NUMBER</th>
                  <th className="py-3.5 px-4 uppercase whitespace-nowrap">DATE / TIME</th>
                  <th className="py-3.5 px-4 uppercase whitespace-nowrap">CASHIER</th>
                  <th className="py-3.5 px-4 uppercase whitespace-nowrap">CUSTOMER</th>
                  <th className="py-3.5 px-4 uppercase whitespace-nowrap">ITEMS</th>
                  <th className="py-3.5 px-4 uppercase whitespace-nowrap">TOTAL AMOUNT</th>
                  <th className="py-3.5 px-4 uppercase whitespace-nowrap">PAYMENT METHOD</th>
                  <th className="py-3.5 px-4 uppercase whitespace-nowrap">FISCAL STATUS</th>
                  <th className="py-3.5 px-5 uppercase whitespace-nowrap text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {paginatedSales.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className="hover:bg-indigo-50/25 transition-colors group cursor-pointer"
                  >
                    {/* Sale ID Badge */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50/90 text-[#4f46e5] font-mono font-bold text-xs border border-indigo-100/80 inline-block shadow-xs">
                        {sale.id}
                      </span>
                    </td>

                    {/* Date / Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{sale.date}</span>
                      </div>
                      <p className="text-slate-400 font-mono text-[11px] pl-4">{sale.time}</p>
                    </td>

                    {/* Cashier */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] border border-slate-200">
                          {sale.cashier.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800 text-xs">{sale.cashier}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      {sale.customer.includes('VIP') ? (
                        <span className="font-bold text-amber-700 inline-flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{sale.customer}</span>
                        </span>
                      ) : (
                        <span className="font-medium text-slate-700">{sale.customer}</span>
                      )}
                    </td>

                    {/* Items Count */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[11px] inline-flex items-center space-x-1">
                        <ShoppingBag className="w-3 h-3 text-slate-400" />
                        <span>{sale.itemsCount} items</span>
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-slate-900">
                      <span className="text-sm text-slate-900">{formatTZS(sale.total)}</span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderPaymentChip(sale)}
                    </td>

                    {/* Fiscal Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] shadow-xs border ${sale.fiscalStatus === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                        : sale.fiscalStatus === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                          : 'bg-rose-50 text-rose-700 border-rose-200/70'
                        }`}>
                        {sale.fiscalStatus === 'SUCCESS' && <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />}
                        {sale.fiscalStatus === 'PENDING' && <Clock3 className="w-3 h-3 mr-1 text-amber-600" />}
                        {sale.fiscalStatus === 'SUCCESS' ? 'TRA Synced' : 'TRA Queued'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedSale(sale)}
                        title="View Sale Receipt"
                        className="p-1.5 text-slate-500 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedSale(sale)}
                        title="Print Receipt"
                        className="p-1.5 text-slate-500 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSales.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-medium text-sm">
                <HistoryIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                No sales records found matching your filters.
              </div>
            )}
          </div>

          {/* Common Pagination Component (10 items per page) */}
          <div className="flex-shrink-0 pt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSales.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="records"
            />
          </div>
        </div>
      </div>

      {/* CUSTOM DATE RANGE MODAL */}
      {isCustomDateModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsCustomDateModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#4f46e5]" />
                <span>Select Custom Date Range</span>
              </h3>
              <button
                onClick={() => setIsCustomDateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Start Date (From)</label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">End Date (To)</label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDatePreset('ALL');
                  setStartDate('');
                  setEndDate('');
                  setIsCustomDateModalOpen(false);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-all"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleApplyCustomDate}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer transition-all"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ULTRA-CLEAN OFFICIAL TZA MART & TRA VFD FISCAL RECEIPT MODAL */}
      {selectedSale && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedSale(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Signature Top Purple Gradient Stripe */}
            <div className="h-1 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] flex-shrink-0" />

            {/* SLEEK RECEIPT HEADER */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
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
                onClick={() => setSelectedSale(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
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

              {/* SALE METADATA CARD */}
              <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-1.5">
                  <span className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center">
                    <Receipt className="w-3.5 h-3.5 mr-1 text-[#4f46e5]" />
                    Sale Transaction Details
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-[#4f46e5] text-[10.5px] font-black rounded-lg font-mono">
                    {selectedSale.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Customer</p>
                    <p className="font-extrabold text-slate-900 truncate">{selectedSale.customer}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Phone</p>
                    <p className="font-bold text-slate-900 font-mono">{selectedSale.customerPhone || '+255 700 000 000'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Date & Time</p>
                    <p className="font-bold text-slate-900">{selectedSale.date} {selectedSale.time}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Cashier</p>
                    <p className="font-bold text-slate-900 truncate">{selectedSale.cashier}</p>
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
                    {selectedSale.items.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 font-bold text-[11px]">{i + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{item.product}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-700 font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                            {item.quantity}x
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                          {formatTZS(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-black text-slate-900 font-mono">
                          {formatTZS(item.total)}
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
                    <span className="font-mono font-bold text-slate-900">{formatTZS(selectedSale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>18% TRA VAT Tax (Included)</span>
                    <span className="font-mono text-slate-700">{formatTZS(selectedSale.tax)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-1.5 border-t border-slate-200 text-slate-900">
                    <span>Grand Total</span>
                    <span className="font-mono text-[#4f46e5] text-base">{formatTZS(selectedSale.total)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-slate-500 font-medium text-[11px]">Payment Mode:</span>
                  <div>{renderPaymentChip(selectedSale)}</div>
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
                  <span className={`px-2 py-0.5 text-[9.5px] font-extrabold rounded-full ${selectedSale.fiscalStatus === 'SUCCESS' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                    {selectedSale.fiscalStatus === 'SUCCESS' ? 'VERIFIED' : 'QUEUED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  <div>
                    <p className="text-emerald-800/70 font-medium text-[9.5px]">Fiscal Receipt No.</p>
                    <p className="font-bold text-emerald-950 font-mono text-[10.5px]">{selectedSale.fiscalReceiptNo}</p>
                  </div>
                  <div>
                    <p className="text-emerald-800/70 font-medium text-[9.5px]">Fiscal Device ID</p>
                    <p className="font-bold text-emerald-950 font-mono text-[10.5px]">{selectedSale.fiscalDevice}</p>
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
                    {selectedSale.verificationCode}
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
                onClick={() => handleDownloadReceipt(selectedSale)}
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
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
