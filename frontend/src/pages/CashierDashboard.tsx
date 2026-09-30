import { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, Printer, Download, FileText,
  LogOut, DollarSign, CreditCard, Smartphone,
  AlertCircle, ScanBarcode, X, Menu, Bell, Calendar, Clock, ChevronDown,
  LayoutDashboard, Package, Warehouse, History, Users, Settings, HelpCircle, ArrowRight,
  Store, Box, Activity, TrendingUp, User, CheckCircle2, ShieldCheck, Tag, Loader2, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { mockPaymentService, type PaymentState, type MobileMoneyProvider } from '../services/mockPaymentService';

type POSProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number; // TZS
  stock: number;
  minStock: number;
  imageIcon: string;
};

type CartItem = {
  product: POSProduct;
  quantity: number;
  discountPercent: number;
};

type RecentScan = {
  id: string;
  name: string;
  time: string;
  price: number;
};

const demoProducts: POSProduct[] = [
  { id: '1', name: 'Coca-Cola 500ml', sku: 'COKE-500', barcode: '6201234567890', category: 'Beverages', price: 1500, stock: 120, minStock: 30, imageIcon: '🥤' },
  { id: '2', name: 'Sprite 500ml', sku: 'SPRT-500', barcode: '6201234567891', category: 'Beverages', price: 1500, stock: 85, minStock: 20, imageIcon: '🥤' },
  { id: '3', name: 'Fresh Tomatoes 1KG', sku: 'TOM-1KG', barcode: '6201234567892', category: 'Food', price: 2000, stock: 45, minStock: 15, imageIcon: '🍅' },
  { id: '4', name: 'White Bread', sku: 'BREAD-001', barcode: '6201234567893', category: 'Food', price: 1800, stock: 60, minStock: 25, imageIcon: '🍞' },
  { id: '5', name: 'Milk 1 Litre', sku: 'MILK-1L', barcode: '6201234567894', category: 'Food', price: 3000, stock: 75, minStock: 20, imageIcon: '🥛' },
  { id: '6', name: 'Cooking Oil 1 Litre', sku: 'OIL-1L', barcode: '6201234567895', category: 'Food', price: 4500, stock: 50, minStock: 15, imageIcon: '🍾' },
  { id: '7', name: 'Omo Washing Powder (500g)', sku: 'PCR-OFO-01', barcode: '6209998887776', category: 'Household', price: 3500, stock: 90, minStock: 20, imageIcon: '🧼' },
  { id: '8', name: 'Whitedent Toothpaste 150g', sku: 'PCR-WHI-01', barcode: '6208889990001', category: 'Personal Care', price: 2500, stock: 50, minStock: 10, imageIcon: '🪥' },
];

const initialCartProducts: CartItem[] = [
  { product: demoProducts[0], quantity: 8, discountPercent: 0 },
  { product: demoProducts[2], quantity: 1, discountPercent: 0 },
  { product: demoProducts[3], quantity: 1, discountPercent: 0 },
];

const initialRecentScans: RecentScan[] = [
  { id: '1', name: 'Coca-Cola 500ml', time: '14:31:05', price: 1500 },
  { id: '2', name: 'Fresh Tomatoes 1KG', time: '14:30:40', price: 2000 },
  { id: '3', name: 'White Bread', time: '14:30:12', price: 1800 },
];

const hourlySalesData = [
  { time: '08:00', sales: 25000 },
  { time: '09:00', sales: 68000 },
  { time: '10:00', sales: 52000 },
  { time: '11:00', sales: 95000 },
  { time: '12:00', sales: 78000 },
  { time: '13:00', sales: 135000 },
  { time: '14:00', sales: 162000 },
  { time: '15:00', sales: 124000 },
  { time: '16:00', sales: 118000 },
  { time: '17:00', sales: 145000 },
  { time: '18:00', sales: 92000 },
];

const dashboardRecentTransactions = [
  { id: '#00024', time: '14:31:05', items: '3 items', customer: 'Walk-in', total: 'TZS 24,500', payment: 'Cash', color: 'bg-sky-100 text-sky-700' },
  { id: '#00023', time: '14:28:40', items: '1 item', customer: 'Walk-in', total: 'TZS 8,000', payment: 'Mobile Money', color: 'bg-emerald-100 text-emerald-700' },
  { id: '#00022', time: '14:25:12', items: '5 items', customer: 'Walk-in', total: 'TZS 63,500', payment: 'Card', color: 'bg-purple-100 text-purple-700' },
  { id: '#00021', time: '14:22:09', items: '2 items', customer: 'Walk-in', total: 'TZS 18,700', payment: 'Cash', color: 'bg-sky-100 text-sky-700' },
  { id: '#00020', time: '14:19:33', items: '4 items', customer: 'Walk-in', total: 'TZS 42,000', payment: 'Mobile Money', color: 'bg-emerald-100 text-emerald-700' },
];

const demoCustomers = [
  { id: 'CUST-001', name: 'Juma Hassan', phone: '+255 712 345 678', purchases: 450000, points: 120, tier: 'Gold' },
  { id: 'CUST-002', name: 'Amina Said', phone: '+255 784 998 112', purchases: 280000, points: 85, tier: 'Silver' },
  { id: 'CUST-003', name: 'David Kimaro', phone: '+255 655 432 109', purchases: 890000, points: 340, tier: 'Platinum' },
];

export default function CashierDashboard() {
  const navigate = useNavigate();

  // Active View Tab ('dashboard' | 'pos' | 'products' | 'inventory' | 'sales' | 'customers' | 'settings')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'products' | 'inventory' | 'sales' | 'customers' | 'settings'>('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Inputs & State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>(initialCartProducts);
  const [recentScans, setRecentScans] = useState<RecentScan[]>(initialRecentScans);

  // Payment Form & Workflow State
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Mobile Money' | 'Card'>('Cash');
  const [mobileProvider, setMobileProvider] = useState<MobileMoneyProvider>('M-Pesa');
  const [mobilePhone, setMobilePhone] = useState<string>('0712345678');
  const [cardReference, setCardReference] = useState<string>('TXN-CARD-8832');
  const [amountPaid, setAmountPaid] = useState<string>('20000');

  // Payment Processing State Machine ('Idle' | 'Pending' | 'Processing' | 'Success' | 'Failed')
  const [paymentState, setPaymentState] = useState<'Idle' | PaymentState>('Idle');
  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string | null>(null);

  // Alerts & Modals
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);
  const [receiptModal, setReceiptModal] = useState<any | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Live Clock State
  const [currentTime, setCurrentTime] = useState<string>('12:58:50');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'pos') {
      barcodeInputRef.current?.focus();
    }
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    return () => clearInterval(timer);
  }, [activeTab]);

  const formatCurrency = (amount: number) => {
    return `TZS ${new Intl.NumberFormat('en-TZ', { maximumFractionDigits: 0 }).format(amount)}`;
  };

  const categories = ['All', 'Beverages', 'Food', 'Household', 'Personal Care'];

  const filteredProducts = demoProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAddProductToCart = (product: POSProduct) => {
    setBarcodeError(null);
    setStockError(null);

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    const currentQtyInCart = existingIndex >= 0 ? cart[existingIndex].quantity : 0;

    if (currentQtyInCart + 1 > product.stock) {
      setStockError(`Cannot add more "${product.name}". Available stock limit reached (${product.stock} items).`);
      return;
    }

    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { product, quantity: 1, discountPercent: 0 }]);
    }

    const nowTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
    const newScan: RecentScan = {
      id: Date.now().toString(),
      name: product.name,
      time: nowTime,
      price: product.price
    };
    setRecentScans([newScan, ...recentScans.slice(0, 4)]);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    setBarcodeError(null);
    setStockError(null);

    const foundProduct = demoProducts.find(
      p => p.barcode.toLowerCase() === code.toLowerCase() || p.sku.toLowerCase() === code.toLowerCase()
    );

    if (foundProduct) {
      handleAddProductToCart(foundProduct);
      setBarcodeInput('');
    } else {
      setBarcodeError('Product not found. Please register this product before selling it.');
    }

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setStockError(null);
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (delta > 0 && newQty > item.product.stock) {
          setStockError(`Stock limit reached for "${item.product.name}". Maximum available stock is ${item.product.stock}.`);
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  // Financial Calculations
  const rawSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const vatTax = Math.round(rawSubtotal * 0.18);
  const grandTotal = rawSubtotal + vatTax;

  const numericPaid = Number(amountPaid) || grandTotal;
  const cashChange = Math.max(0, numericPaid - grandTotal);

  // Helper to build rich fiscal receipt payload
  const createReceiptPayload = (
    saleRef: string,
    payMethod: string,
    paid: number,
    changeAmt: number,
    provider?: string,
    phone?: string,
    cardRef?: string
  ) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const fiscalDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = currentTime || now.toLocaleTimeString('en-GB', { hour12: false });

    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    const fiscalReceiptNo = `TRA-VFD-2026-${randomDigits}`;
    const fiscalDevice = `EFD-TZ-90${Math.floor(10000 + Math.random() * 90000)}`;

    const hex4 = () => Math.random().toString(16).substring(2, 6).toUpperCase();
    const verificationCode = `${hex4()}-${hex4()}-${hex4()}-${hex4()}-${hex4()}`;

    return {
      supermarketName: 'TZA MART TANZANIA',
      storeBranch: 'Mlimani City Mall, Sam Nujoma Road, Dar es Salaam',
      tin: '102-394-857',
      vrn: '40012983-Z',
      receiptNo: saleRef,
      date: dateStr,
      time: timeStr,
      cashier: 'John Cashier (ID: C-104)',
      customer: 'Walk-in Customer',
      items: [...cart],
      rawSubtotal,
      vatTax,
      grandTotal,
      paymentMethod: payMethod,
      mobileProvider: provider,
      customerPhone: phone,
      cardReference: cardRef,
      numericPaid: paid,
      cashChange: changeAmt,

      // Dedicated TRA VFD Fiscal Information
      fiscalInformation: {
        fiscalizationStatus: 'FISCALIZED / VERIFIED (TRA VFD)',
        fiscalReceiptNo,
        fiscalDevice,
        verificationCode,
        fiscalDate: fiscalDateStr,
        fiscalTime: timeStr,
      },
    };
  };

  // Complete Checkout via Mock Payment Service Abstraction
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setPaymentErrorMessage(null);

    if (paymentMethod === 'Cash') {
      setPaymentState('Pending');
      const result = await mockPaymentService.processCash({
        amountReceived: numericPaid,
        totalAmount: grandTotal,
      });

      if (result.status === 'Failed') {
        setPaymentState('Failed');
        setPaymentErrorMessage(result.errorMessage || 'Cash payment failed');
      } else {
        setPaymentState('Success');
        const saleRef = result.transactionRef || `SL-2026-${Math.floor(10000 + Math.random() * 90000)}`;
        const receipt = createReceiptPayload(saleRef, 'Cash', numericPaid, result.change || cashChange);
        setTimeout(() => {
          setPaymentState('Idle');
          setReceiptModal(receipt);
        }, 700);
      }
    } else if (paymentMethod === 'Mobile Money') {
      const result = await mockPaymentService.processMobileMoney(
        {
          provider: mobileProvider,
          phone: mobilePhone,
          amount: grandTotal,
        },
        (state) => setPaymentState(state)
      );

      if (result.status === 'Failed') {
        setPaymentState('Failed');
        setPaymentErrorMessage(result.errorMessage || 'Mobile money payment failed');
      } else {
        setPaymentState('Success');
        const saleRef = result.transactionRef || `SL-2026-${Math.floor(10000 + Math.random() * 90000)}`;
        const receipt = createReceiptPayload(
          saleRef,
          `Mobile Money (${mobileProvider})`,
          grandTotal,
          0,
          mobileProvider,
          mobilePhone
        );
        setTimeout(() => {
          setPaymentState('Idle');
          setReceiptModal(receipt);
        }, 700);
      }
    } else if (paymentMethod === 'Card') {
      const result = await mockPaymentService.processCard(
        {
          reference: cardReference,
          amount: grandTotal,
        },
        (state) => setPaymentState(state)
      );

      if (result.status === 'Failed') {
        setPaymentState('Failed');
        setPaymentErrorMessage(result.errorMessage || 'Card payment failed');
      } else {
        setPaymentState('Success');
        const saleRef = result.transactionRef || `SL-2026-${Math.floor(10000 + Math.random() * 90000)}`;
        const receipt = createReceiptPayload(
          saleRef,
          'Card / Bank',
          grandTotal,
          0,
          undefined,
          undefined,
          cardReference
        );
        setTimeout(() => {
          setPaymentState('Idle');
          setReceiptModal(receipt);
        }, 700);
      }
    }
  };

  const handleFinishSale = () => {
    setReceiptModal(null);
    setCart([]);
    setAmountPaid('');
    setPaymentState('Idle');
    setPaymentErrorMessage(null);
    setBarcodeError(null);
    setStockError(null);

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  const sidebarTabs = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', name: 'POS (Checkout)', icon: ShoppingCart },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'inventory', name: 'Inventory', icon: Warehouse },
    { id: 'sales', name: 'Sales History', icon: History },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen flex font-sans text-slate-800 overflow-hidden select-none relative" style={{ background: 'linear-gradient(135deg, #eef2fd 0%, #f4f7fe 50%, #f9f6fd 100%)' }}>

      {/* LEFT SIDEBAR (Collapsible to compact icon-only mode) */}
      <aside className={`transition-all duration-300 bg-white/80 backdrop-blur-2xl flex flex-col justify-between z-20 flex-shrink-0 shadow-lg border-r border-slate-100 ${isSidebarOpen ? 'w-64' : 'w-20'
        }`}>

        <div>
          {/* Logo Brand Header & Toggle Menu Button */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#4f46e5] to-[#7c3aed] rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
                <ShoppingCart className="text-white w-6 h-6" />
              </div>
              {isSidebarOpen && (
                <div className="whitespace-nowrap">
                  <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">TZA Mart</h1>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">Supermarket Management</p>
                </div>
              )}
            </div>

            {/* Menu Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex-shrink-0"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links (Stays inside Cashier UI without redirecting to Admin) */}
          <nav className="p-3 space-y-1.5">
            {sidebarTabs.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.name}
                  className={`w-full flex items-center ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${active
                    ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-lg shadow-indigo-500/25 font-extrabold'
                    : 'text-slate-600 hover:bg-indigo-50/50 hover:text-[#4f46e5]'
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''} ${active ? 'text-white' : 'text-slate-500'}`} />
                  {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Tanzania Supermarket Card & Logout */}
        <div className="p-3 space-y-3">
          {isSidebarOpen && (
            <div className="bg-white/60 backdrop-blur-xl border border-white p-4 rounded-3xl text-center shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl mx-auto flex items-center justify-center text-blue-600 mb-2">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-900">TZA Mart</h4>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Your Trusted Supermarket in Tanzania</p>
              <div className="mt-2 inline-flex items-center space-x-1 bg-white px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-100 shadow-2xs">
                <span>🇹🇿</span> <span className="text-slate-700">Tanzania Edition</span>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/login')}
            title="Logout"
            className={`w-full flex items-center ${isSidebarOpen ? 'px-4 justify-start space-x-2' : 'justify-center'} py-3 text-red-600 hover:bg-red-50 font-extrabold text-xs rounded-2xl transition-all cursor-pointer`}
          >
            <LogOut className="w-5 h-5 text-red-600" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>

      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden z-10 relative transition-all duration-300">

        {/* TAB 1: DASHBOARD VIEW (Image 1) */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500">Good Afternoon, John! 👋</p>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cashier Dashboard</h2>
                <p className="text-xs font-medium text-slate-500">Here is your overview for today. Ready to start selling?</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-white/80 border border-white px-4 py-2 rounded-2xl shadow-2xs flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                    <p className="text-xs font-extrabold text-slate-900">23 Dec 2024</p>
                  </div>
                </div>

                <div className="bg-white/80 border border-white px-4 py-2 rounded-2xl shadow-2xs flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Time</p>
                    <p className="text-xs font-extrabold text-slate-900 font-mono">{currentTime}</p>
                  </div>
                </div>

                <div className="bg-white/80 border border-white px-4 py-2 rounded-2xl shadow-2xs flex items-center space-x-3">
                  <Store className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">TZA Mart - Dodoma</p>
                    <p className="text-xs font-extrabold text-slate-900">Main Branch</p>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-3xl shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100/80 flex items-center justify-center text-blue-600">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">24</h3>
                    <p className="text-xs font-bold text-slate-400">Today's Transactions</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full flex items-center">
                  ▲ +12%
                </span>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-3xl shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">TZS 1,245,600</h3>
                    <p className="text-xs font-bold text-slate-400">Today's Sales</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full flex items-center">
                  ▲ +96%
                </span>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-3xl shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100/80 flex items-center justify-center text-purple-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">18</h3>
                    <p className="text-xs font-bold text-slate-400">Customers Served</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full flex items-center">
                  ▲ +6%
                </span>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-3xl shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/80 flex items-center justify-center text-amber-600">
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">3</h3>
                    <p className="text-xs font-bold text-slate-400">Low Stock Items</p>
                  </div>
                </div>
                <span className="bg-rose-100 text-rose-600 text-xs font-black px-2.5 py-1 rounded-full">
                  +2
                </span>
              </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-blue-600" />
                    Sales Overview
                  </h3>
                  <select className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-600 focus:outline-none">
                    <option>Today</option>
                    <option>This Week</option>
                  </select>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlySalesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `${val / 1000}k`} />
                      <Tooltip formatter={(val: any) => [`TZS ${Number(val || 0).toLocaleString()}`, 'Sales']} />
                      <Area type="monotone" dataKey="sales" stroke="#0284c7" strokeWidth={3} fill="url(#salesGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-2xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center mb-4">
                    <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
                    Payment Methods
                  </h3>
                  <div className="flex items-center justify-center my-4 relative">
                    <div className="w-36 h-36 rounded-full border-8 border-sky-500 border-t-emerald-500 border-r-purple-500 flex items-center justify-center bg-white shadow-inner">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400">TZS</p>
                        <p className="text-xs font-black text-slate-900">1,245,600</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-bold pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 mr-2"></span> Cash</span>
                    <span className="text-slate-500">45%</span>
                    <span className="text-slate-900">TZS 560,520</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span> Mobile Money</span>
                    <span className="text-slate-500">35%</span>
                    <span className="text-slate-900">TZS 436,960</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2"></span> Card / Bank</span>
                    <span className="text-slate-500">15%</span>
                    <span className="text-slate-900">TZS 187,120</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-2"></span> Other</span>
                    <span className="text-slate-500">5%</span>
                    <span className="text-slate-900">TZS 61,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    Recent Transactions
                  </h3>
                  <button onClick={() => setActiveTab('sales')} className="text-xs font-extrabold text-blue-600 hover:underline">
                    View All
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold border-b border-slate-100 pb-2">
                        <th className="pb-2">#</th>
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Product / Items</th>
                        <th className="pb-2">Customer</th>
                        <th className="pb-2">Total</th>
                        <th className="pb-2">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {dashboardRecentTransactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-white/60 transition-colors">
                          <td className="py-2.5 font-extrabold text-slate-900">{trx.id}</td>
                          <td className="py-2.5 text-slate-500">{trx.time}</td>
                          <td className="py-2.5 text-slate-700 font-bold">{trx.items}</td>
                          <td className="py-2.5 text-slate-500">{trx.customer}</td>
                          <td className="py-2.5 font-black text-slate-900">{trx.total}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${trx.color}`}>
                              {trx.payment}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-2xs">
                <h3 className="text-base font-black text-slate-900 flex items-center mb-4">
                  <TrendingUp className="w-4 h-4 mr-2 text-amber-500" />
                  Quick Actions
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab('pos')}
                    className="p-4 bg-sky-50 border border-sky-100 hover:bg-sky-100 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-sm">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-xs text-slate-900 flex items-center justify-between">
                      Open POS
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">Start a new sale</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('products')}
                    className="p-4 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-sm">
                      <Package className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-xs text-slate-900 flex items-center justify-between">
                      Search Product
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">Find products quickly</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('sales')}
                    className="p-4 bg-purple-50 border border-purple-100 hover:bg-purple-100 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-sm">
                      <History className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-xs text-slate-900 flex items-center justify-between">
                      View Sales History
                      <ArrowRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">Check recent sales</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('customers')}
                    className="p-4 bg-amber-50 border border-amber-100 hover:bg-amber-100 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-sm">
                      <Users className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-xs text-slate-900 flex items-center justify-between">
                      Add Customer
                      <ArrowRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">Quick customer entry</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: POINT OF SALE (POS) (Image 2) */}
        {activeTab === 'pos' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Point of Sale (POS)</h2>
                <p className="text-xs text-slate-500 font-medium">Scan products, add to cart and complete the sale</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-white/80 px-4 py-2 rounded-2xl border border-white shadow-2xs text-xs font-bold text-slate-700">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 block font-normal leading-none">Date</span>
                    <span>23 Dec 2024</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-white/80 px-4 py-2 rounded-2xl border border-white shadow-2xs text-xs font-bold text-slate-700">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 block font-normal leading-none">Time</span>
                    <span className="font-mono">{currentTime || '12:58:50'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-white/80 px-4 py-2 rounded-2xl border border-white shadow-2xs text-xs font-bold text-slate-700">
                  <User className="w-4 h-4 text-blue-600" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 block font-normal leading-none">Cashier</span>
                    <span>John Cashier</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
              {/* COLUMN 1 */}
              <div className="lg:col-span-4 bg-white/80 backdrop-blur-2xl rounded-3xl border border-white p-5 shadow-sm flex flex-col">
                <h3 className="font-extrabold text-sm text-slate-900 mb-3 flex items-center">
                  <ScanBarcode className="w-4 h-4 mr-2 text-blue-600" /> Scan or Search Product
                </h3>

                <form onSubmit={handleBarcodeSubmit} className="relative mb-3">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Scan barcode or type product name..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-white border-2 border-blue-400/80 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-inner"
                  />
                  <ScanBarcode className="w-4 h-4 absolute right-3.5 top-1/2 transform -translate-y-1/2 text-blue-600" />
                </form>

                {barcodeError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-extrabold">Product not found.</p>
                      <p className="font-medium text-[11px] text-red-600">Please register this product before selling it.</p>
                    </div>
                    <button onClick={() => setBarcodeError(null)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}

                <div className="flex space-x-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleAddProductToCart(p)}
                      className="p-3 bg-white hover:bg-blue-50/50 border border-slate-100 hover:border-blue-300 rounded-2xl shadow-2xs cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg shadow-2xs">
                          {p.imageIcon}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{p.name}</h4>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>SKU: {p.sku}</span>
                            <span>•</span>
                            <span>Stock: {p.stock}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="font-black text-xs text-slate-900">{formatCurrency(p.price)}</span>
                        <button className="w-7 h-7 bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white rounded-xl flex items-center justify-center font-bold transition-all">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMN 2 */}
              <div className="lg:col-span-4 flex flex-col space-y-4">
                <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white p-5 shadow-sm flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                      <h3 className="font-extrabold text-sm text-slate-900">Shopping Cart</h3>
                      <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-black">
                        {cart.reduce((sum, i) => sum + i.quantity, 0)}
                      </span>
                    </div>

                    {cart.length > 0 && (
                      <button
                        onClick={() => { setCart([]); setStockError(null); setBarcodeError(null); }}
                        className="text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center space-x-1 px-2.5 py-1 bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Cart</span>
                      </button>
                    )}
                  </div>

                  {stockError && (
                    <div className="mb-2 p-2.5 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl text-xs font-bold flex items-center justify-between">
                      <span className="text-[11px]">{stockError}</span>
                      <button onClick={() => setStockError(null)} className="text-orange-500"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto max-h-[220px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase">
                          <th className="py-2 px-2">Product</th>
                          <th className="py-2 px-2 text-center">Qty</th>
                          <th className="py-2 px-2 text-right">Unit Price</th>
                          <th className="py-2 px-2 text-right">Total</th>
                          <th className="py-2 px-1"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cart.map((item) => {
                          const lineTotal = item.product.price * item.quantity;
                          return (
                            <tr key={item.product.id} className="text-xs">
                              <td className="py-2.5 px-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-base">{item.product.imageIcon}</span>
                                  <div>
                                    <p className="font-bold text-slate-800 line-clamp-1">{item.product.name}</p>
                                    <p className="text-[9px] font-mono text-slate-400">SKU: {item.product.sku}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-2.5 px-2">
                                <div className="flex items-center justify-center space-x-1">
                                  <button onClick={() => updateQuantity(item.product.id, -1)} className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer">
                                    -
                                  </button>
                                  <span className="w-5 text-center font-bold text-xs font-mono">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.product.id, 1)} className="w-5 h-5 bg-blue-100 hover:bg-blue-600 hover:text-white rounded text-blue-600 flex items-center justify-center font-bold text-xs cursor-pointer">
                                    +
                                  </button>
                                </div>
                              </td>

                              <td className="py-2.5 px-2 text-right font-medium text-slate-600">
                                {item.product.price.toLocaleString()}
                              </td>

                              <td className="py-2.5 px-2 text-right font-black text-slate-900">
                                {lineTotal.toLocaleString()}
                              </td>

                              <td className="py-2.5 px-1 text-center">
                                <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-red-600 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {cart.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400">
                              <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1]" />
                              <p className="text-xs font-bold text-slate-600">Cart is empty</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-extrabold text-xs text-slate-900 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Recent Scans
                    </h4>
                    <button className="text-[10px] font-bold text-blue-600 hover:underline">View All</button>
                  </div>

                  <div className="space-y-1.5">
                    {recentScans.map((scan) => (
                      <div key={scan.id} className="flex justify-between items-center text-xs p-1.5 bg-slate-50/70 rounded-xl">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">🥤</span>
                          <span className="font-bold text-slate-800 truncate max-w-[120px]">{scan.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{scan.time}</span>
                        <span className="font-black text-slate-900">{formatCurrency(scan.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLUMN 3 */}
              <div className="lg:col-span-4 bg-white/80 backdrop-blur-2xl rounded-3xl border border-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2 text-blue-600" /> Payment
                  </h3>

                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2 mb-4">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-800">{formatCurrency(rawSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Tax (18%)</span>
                      <span className="font-bold text-slate-800">{formatCurrency(vatTax)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                      <span className="text-sm font-black text-slate-900 uppercase">TOTAL</span>
                      <span className="text-2xl font-black text-blue-600">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">PAYMENT METHOD</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Cash')}
                        className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${paymentMethod === 'Cash'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Cash</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Mobile Money')}
                        className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${paymentMethod === 'Mobile Money'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Mobile Money</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Card')}
                        className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${paymentMethod === 'Card'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Card / Bank</span>
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'Cash' && (
                    <div className="space-y-3 p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 mb-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">AMOUNT RECEIVED (TZS)</label>
                          <button
                            type="button"
                            onClick={() => setAmountPaid(grandTotal.toString())}
                            className="text-[10px] font-bold text-blue-600 hover:underline"
                          >
                            Exact Amount
                          </button>
                        </div>
                        <input
                          type="number"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-lg font-black focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>

                      {/* Quick Cash Buttons */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {[5000, 10000, 20000, 50000].map(amount => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setAmountPaid(amount.toString())}
                            className="py-1.5 bg-white border border-slate-200 hover:border-blue-500 rounded-xl text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                          >
                            {amount.toLocaleString()}
                          </button>
                        ))}
                      </div>

                      {numericPaid < grandTotal && (
                        <p className="text-[10px] font-bold text-rose-600">
                          ⚠️ Received amount is less than total price ({formatCurrency(grandTotal - numericPaid)} remaining).
                        </p>
                      )}

                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                        <span className="font-bold text-slate-600">Change (TZS):</span>
                        <span className="font-black text-lg text-emerald-600">{cashChange.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Mobile Money' && (
                    <div className="space-y-3 p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">PROVIDER</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(['M-Pesa', 'Airtel Money', 'Mixx by Yas', 'HaloPesa'] as const).map(prov => (
                            <button
                              key={prov}
                              type="button"
                              onClick={() => setMobileProvider(prov)}
                              className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${mobileProvider === prov ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-700'
                                }`}
                            >
                              {prov}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CUSTOMER PHONE NUMBER</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">+255</span>
                          <input
                            type="text"
                            value={mobilePhone}
                            onChange={(e) => setMobilePhone(e.target.value)}
                            placeholder="0712 345 678"
                            className="w-full pl-14 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium mt-1">
                          💡 Tip: Enter phone ending with <code className="text-rose-600 font-bold">999</code> to test payment failure state.
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Card' && (
                    <div className="space-y-3 p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">PAYMENT / POS REFERENCE CODE</label>
                        <input
                          type="text"
                          value={cardReference}
                          onChange={(e) => setCardReference(e.target.value)}
                          placeholder="TXN-CARD-8832"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[9px] text-slate-400 font-medium mt-1">
                          💡 Tip: Enter <code className="text-rose-600 font-bold">FAIL</code> to test card decline state.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || (paymentMethod === 'Cash' && numericPaid < grandTotal)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 disabled:from-slate-300 disabled:to-slate-400 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-between px-6 cursor-pointer"
                >
                  <span>Complete Sale</span>
                  <span className="flex items-center space-x-2">
                    <ArrowRight className="w-5 h-5" />
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-md font-mono">F12</span>
                  </span>
                </button>
              </div>
            </div>

            <footer className="h-10 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 px-6 flex items-center justify-between text-xs font-bold text-slate-600">
              <div className="flex items-center space-x-6">
                <span className="flex items-center text-emerald-600">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span> Online
                </span>
                <span className="flex items-center text-slate-600">
                  🖨️ Receipt Printer: <strong className="text-emerald-600 ml-1">Connected</strong>
                </span>
                <span className="flex items-center text-slate-600">
                  📷 Barcode Scanner: <strong className="text-emerald-600 ml-1">Ready</strong>
                </span>
              </div>

              <div className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 cursor-pointer">
                <HelpCircle className="w-4 h-4" />
                <span>Need Help?</span>
              </div>
            </footer>
          </div>
        )}

        {/* TAB 3: PRODUCTS VIEW */}
        {activeTab === 'products' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalog</h2>
                <p className="text-xs text-slate-500 font-medium">Browse store inventory, prices, and barcodes</p>
              </div>
              <button onClick={() => setActiveTab('pos')} className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-blue-700 transition-all flex items-center space-x-2 cursor-pointer">
                <ShoppingCart className="w-4 h-4" />
                <span>Go to POS</span>
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white p-6 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-200 pb-3">
                      <th className="pb-3">Product Name</th>
                      <th className="pb-3">SKU</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Barcode</th>
                      <th className="pb-3 text-right">Price (TZS)</th>
                      <th className="pb-3 text-center">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {demoProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-white/60 transition-colors">
                        <td className="py-3 font-bold text-slate-900 flex items-center space-x-2">
                          <span className="text-lg">{p.imageIcon}</span>
                          <span>{p.name}</span>
                        </td>
                        <td className="py-3 font-mono text-slate-500">{p.sku}</td>
                        <td className="py-3 text-slate-600"><span className="px-2 py-0.5 bg-slate-100 rounded-md font-bold text-[10px] text-slate-600">{p.category}</span></td>
                        <td className="py-3 font-mono text-slate-500">{p.barcode}</td>
                        <td className="py-3 text-right font-black text-slate-900">{formatCurrency(p.price)}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${p.stock > p.minStock ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {p.stock} in stock
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INVENTORY VIEW */}
        {activeTab === 'inventory' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Store Inventory</h2>
              <p className="text-xs text-slate-500 font-medium">Stock levels, minimum thresholds, and alerts</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/80 p-5 rounded-3xl border border-white shadow-2xs">
                <p className="text-xs font-bold text-slate-400">Total Items</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{demoProducts.length} Products</h3>
              </div>
              <div className="bg-white/80 p-5 rounded-3xl border border-white shadow-2xs">
                <p className="text-xs font-bold text-slate-400">Stock Status</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">Healthy</h3>
              </div>
              <div className="bg-white/80 p-5 rounded-3xl border border-white shadow-2xs">
                <p className="text-xs font-bold text-slate-400">Low Stock Warning</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">0 Items Low</h3>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white p-6 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-200 pb-3">
                      <th className="pb-3">Product</th>
                      <th className="pb-3">SKU</th>
                      <th className="pb-3 text-center">Current Stock</th>
                      <th className="pb-3 text-center">Min Threshold</th>
                      <th className="pb-3 text-right">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {demoProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 font-mono text-slate-500">{p.sku}</td>
                        <td className="py-3 text-center font-bold text-slate-900">{p.stock}</td>
                        <td className="py-3 text-center text-slate-500">{p.minStock}</td>
                        <td className="py-3 text-right">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-full">
                            In Stock
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SALES HISTORY VIEW */}
        {activeTab === 'sales' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sales History</h2>
              <p className="text-xs text-slate-500 font-medium">Completed cashier register transactions & TRA receipts</p>
            </div>

            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white p-6 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-200 pb-3">
                      <th className="pb-3">Transaction #</th>
                      <th className="pb-3">Time</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Items Sold</th>
                      <th className="pb-3 text-right">Total (TZS)</th>
                      <th className="pb-3 text-center">Payment Method</th>
                      <th className="pb-3 text-right">TRA Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {dashboardRecentTransactions.map((t) => (
                      <tr key={t.id}>
                        <td className="py-3 font-black text-slate-900">{t.id}</td>
                        <td className="py-3 text-slate-500">{t.time}</td>
                        <td className="py-3 text-slate-600">{t.customer}</td>
                        <td className="py-3 text-slate-800 font-bold">{t.items}</td>
                        <td className="py-3 text-right font-black text-slate-900">{t.total}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${t.color}`}>{t.payment}</span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center text-emerald-600 font-bold text-[10px]">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> VFD Signed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CUSTOMERS VIEW */}
        {activeTab === 'customers' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customer Registry</h2>
              <p className="text-xs text-slate-500 font-medium">Manage supermarket loyalty members and customer history</p>
            </div>

            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white p-6 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-200 pb-3">
                      <th className="pb-3">Customer Code</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3 text-right">Total Purchases (TZS)</th>
                      <th className="pb-3 text-center">Loyalty Points</th>
                      <th className="pb-3 text-right">Membership Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {demoCustomers.map((c) => (
                      <tr key={c.id}>
                        <td className="py-3 font-mono text-slate-500">{c.id}</td>
                        <td className="py-3 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3 text-slate-600 font-mono">{c.phone}</td>
                        <td className="py-3 text-right font-black text-slate-900">{formatCurrency(c.purchases)}</td>
                        <td className="py-3 text-center font-bold text-blue-600">{c.points} pts</td>
                        <td className="py-3 text-right">
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 font-bold text-[10px] rounded-full">{c.tier}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS VIEW */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cashier Workstation Settings</h2>
              <p className="text-xs text-slate-500 font-medium">Configure terminal preferences and hardware connections</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-600" /> Active Workstation Profile
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Logged Cashier:</span>
                    <span className="font-bold text-slate-900">John Cashier</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Station ID:</span>
                    <span className="font-mono font-bold text-slate-900">TZA-POS-01</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500 font-medium">Store Branch:</span>
                    <span className="font-bold text-slate-900">Dodoma Main Branch</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center">
                  <Printer className="w-4 h-4 mr-2 text-blue-600" /> Hardware Peripheral Status
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span className="font-bold text-slate-800">Thermal Receipt Printer</span>
                    <span className="px-2.5 py-0.5 bg-emerald-500 text-white rounded-md text-[10px] font-black">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span className="font-bold text-slate-800">USB Barcode Scanner</span>
                    <span className="px-2.5 py-0.5 bg-emerald-500 text-white rounded-md text-[10px] font-black">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* PAYMENT PROCESSING OVERLAY MODAL (Pending | Processing | Success | Failed) */}
      {paymentState !== 'Idle' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 font-sans border border-white/80">

            {/* 1. PENDING STATE */}
            {paymentState === 'Pending' && (
              <div className="space-y-3 py-4">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full mx-auto flex items-center justify-center animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-base font-black text-slate-900">Initiating Payment</h3>
                <p className="text-xs text-slate-500 font-medium">Connecting to {paymentMethod} mock provider service...</p>
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-extrabold rounded-full">
                  Status: PENDING
                </div>
              </div>
            )}

            {/* 2. PROCESSING STATE */}
            {paymentState === 'Processing' && (
              <div className="space-y-3 py-4">
                <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-full mx-auto flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-base font-black text-slate-900">Processing Payment</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {paymentMethod === 'Mobile Money'
                    ? `Push PIN prompt sent to customer ${mobilePhone} via ${mobileProvider}...`
                    : `Communicating with card issuer terminal for ${cardReference}...`}
                </p>
                <div className="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-[10px] font-extrabold rounded-full">
                  Status: PROCESSING
                </div>
              </div>
            )}

            {/* 3. SUCCESS STATE */}
            {paymentState === 'Success' && (
              <div className="space-y-3 py-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-slate-900">Payment Confirmed!</h3>
                <p className="text-xs text-emerald-600 font-bold">TZS {grandTotal.toLocaleString()} received successfully.</p>
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-extrabold rounded-full">
                  Status: SUCCESS
                </div>
              </div>
            )}

            {/* 4. FAILED STATE */}
            {paymentState === 'Failed' && (
              <div className="space-y-4 py-2">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full mx-auto flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Payment Failed</h3>
                  <p className="text-xs text-rose-600 font-bold mt-1">{paymentErrorMessage || 'Transaction could not be processed.'}</p>
                </div>
                <div className="pt-2 flex space-x-2">
                  <button
                    onClick={() => setPaymentState('Idle')}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Change Method
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Retry Payment
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Completed Sale & TRA Fiscal Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">

          {/* PRINTABLE RECEIPT CARD CONTAINER */}
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-white text-slate-800 space-y-6 my-auto max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">

            {/* RECEIPT TOOLBAR (Hidden when printing) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Sale Transaction Receipt</h3>
                  <p className="text-[11px] font-medium text-emerald-600">Official Supermarket & TRA Fiscal Record</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center cursor-pointer"
                  title="Print Receipt"
                >
                  <Printer className="w-3.5 h-3.5 mr-1 text-slate-600" /> Print
                </button>

                <button
                  onClick={() => {
                    setDownloadNotice(`Downloading PDF Fiscal Receipt (${receiptModal.receiptNo})...`);
                    setTimeout(() => setDownloadNotice(null), 3500);
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-xl transition-all flex items-center cursor-pointer"
                  title="Download PDF Receipt"
                >
                  <Download className="w-3.5 h-3.5 mr-1 text-blue-600" /> Download PDF
                </button>

                <button
                  onClick={handleFinishSale}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                  title="Close Receipt"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* DOWNLOAD NOTICE TOAST */}
            {downloadNotice && (
              <div className="p-3 bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg print:hidden">
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 animate-bounce" />
                  <span>{downloadNotice}</span>
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">PDF Placeholder</span>
              </div>
            )}

            {/* PRINTABLE RECEIPT CONTENT AREA */}
            <div className="space-y-6 font-sans">

              {/* SUPERMARKET HEADER */}
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-sky-400 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md mb-2">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <h2 className="font-black text-xl text-slate-900 tracking-tight">{receiptModal.supermarketName}</h2>
                <p className="text-xs text-slate-600 font-medium">{receiptModal.storeBranch}</p>
                <div className="text-[11px] text-slate-500 font-mono flex items-center justify-center space-x-3 pt-1">
                  <span>TIN: <strong className="text-slate-700">{receiptModal.tin}</strong></span>
                  <span>|</span>
                  <span>VRN: <strong className="text-slate-700">{receiptModal.vrn}</strong></span>
                </div>
              </div>

              {/* SECTION 1: NORMAL SALE INFORMATION */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                    1. Normal Sale Information
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full font-mono">
                    {receiptModal.receiptNo}
                  </span>
                </div>

                {/* META DATA GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <p className="text-slate-400 font-medium">Sale Number</p>
                    <p className="font-bold text-slate-900 font-mono">{receiptModal.receiptNo}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Date</p>
                    <p className="font-bold text-slate-900">{receiptModal.date}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Time</p>
                    <p className="font-bold text-slate-900">{receiptModal.time}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Cashier</p>
                    <p className="font-bold text-slate-900 truncate">{receiptModal.cashier}</p>
                  </div>
                </div>

                {/* PRODUCTS PURCHASED TABLE */}
                <div className="pt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold border-b border-slate-200 pb-2 text-[10px] uppercase">
                        <th className="pb-1.5">Product</th>
                        <th className="pb-1.5 text-center">Qty</th>
                        <th className="pb-1.5 text-right">Price</th>
                        <th className="pb-1.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 font-medium text-slate-800 text-[11px]">
                      {receiptModal.items.map((item: CartItem) => (
                        <tr key={item.product.id}>
                          <td className="py-2 pr-2">
                            <p className="font-bold text-slate-900">{item.product.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">SKU: {item.product.sku}</p>
                          </td>
                          <td className="py-2 text-center font-bold text-slate-900">{item.quantity}</td>
                          <td className="py-2 text-right font-mono text-slate-600">{formatCurrency(item.product.price)}</td>
                          <td className="py-2 text-right font-bold text-slate-900 font-mono">{formatCurrency(item.product.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* FINANCIAL SUMMARY TOTALS */}
                <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(receiptModal.rawSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>18% TRA VAT Tax</span>
                    <span className="font-mono text-slate-700">{formatCurrency(receiptModal.vatTax)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-300 text-slate-900">
                    <span>Grand Total</span>
                    <span className="font-mono text-blue-600 text-base">{formatCurrency(receiptModal.grandTotal)}</span>
                  </div>
                </div>

                {/* PAYMENT METHOD INFORMATION */}
                <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Payment Method:</span>
                    <span className="font-black text-slate-900 px-2 py-0.5 bg-slate-100 rounded-md">
                      {receiptModal.paymentMethod} {receiptModal.mobileProvider ? `(${receiptModal.mobileProvider})` : ''}
                    </span>
                  </div>
                  {receiptModal.paymentMethod === 'Cash' && (
                    <>
                      <div className="flex justify-between text-slate-600 text-[11px] pt-1">
                        <span>Amount Received:</span>
                        <span className="font-mono font-bold">{formatCurrency(receiptModal.numericPaid)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 text-[11px] font-bold">
                        <span>Change Given:</span>
                        <span className="font-mono">{formatCurrency(receiptModal.cashChange)}</span>
                      </div>
                    </>
                  )}
                  {receiptModal.customerPhone && (
                    <div className="flex justify-between text-slate-600 text-[11px] pt-1">
                      <span>Customer Mobile:</span>
                      <span className="font-mono font-bold">{receiptModal.customerPhone}</span>
                    </div>
                  )}
                  {receiptModal.cardReference && (
                    <div className="flex justify-between text-slate-600 text-[11px] pt-1">
                      <span>Card Reference:</span>
                      <span className="font-mono font-bold">{receiptModal.cardReference}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: FISCAL INFORMATION (CLEARLY SEPARATED) */}
              <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      2. TRA VFD Fiscal Information
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-full shadow-2xs">
                    {receiptModal.fiscalInformation.fiscalizationStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <p className="text-emerald-800/70 font-medium">Fiscal Status</p>
                    <p className="font-extrabold text-emerald-900">Fiscalized & Transmitted</p>
                  </div>
                  <div>
                    <p className="text-emerald-800/70 font-medium">Fiscal Receipt No.</p>
                    <p className="font-bold text-emerald-950 font-mono">{receiptModal.fiscalInformation.fiscalReceiptNo}</p>
                  </div>
                  <div>
                    <p className="text-emerald-800/70 font-medium">Fiscal Device ID</p>
                    <p className="font-bold text-emerald-950 font-mono">{receiptModal.fiscalInformation.fiscalDevice}</p>
                  </div>
                  <div>
                    <p className="text-emerald-800/70 font-medium">Fiscal Date</p>
                    <p className="font-bold text-emerald-950">{receiptModal.fiscalInformation.fiscalDate}</p>
                  </div>
                  <div>
                    <p className="text-emerald-800/70 font-medium">Fiscal Time</p>
                    <p className="font-bold text-emerald-950">{receiptModal.fiscalInformation.fiscalTime}</p>
                  </div>
                  <div>
                    <p className="text-emerald-800/70 font-medium">Tax Authority</p>
                    <p className="font-bold text-emerald-950">TRA Tanzania</p>
                  </div>
                </div>

                {/* FISCAL VERIFICATION CODE CALLOUT (CLEARLY DISTINCT FROM PRODUCT BARCODE) */}
                <div className="bg-white rounded-xl p-3 border border-emerald-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider">
                      Fiscal Verification Code (VFD Security Key)
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      TRA Official
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-center rounded-lg text-xs tracking-widest font-black break-all shadow-inner border border-slate-800">
                    {receiptModal.fiscalInformation.verificationCode}
                  </div>

                  <p className="text-[10px] text-slate-500 leading-tight italic">
                    <strong className="text-emerald-700 font-semibold">Note:</strong> This TRA VFD Fiscal Verification Code is generated by the Tanzania Revenue Authority Virtual Fiscal Device for tax audit verification, and is distinct from commercial retail product barcodes.
                  </p>
                </div>
              </div>

              {/* FOOTER THANK YOU & LEGAL */}
              <div className="text-center text-slate-400 text-[11px] space-y-0.5 pt-2">
                <p className="font-bold text-slate-700">Asante kwa kununua TZA Mart Tanzania! Karibu tena.</p>
                <p className="text-[10px]">Powered by TZA Mart POS & TRA VFD Middleware System v2.4</p>
              </div>

            </div>

            {/* MODAL ACTION BUTTONS (Hidden when printing) */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-700" />
                <span>Print Receipt</span>
              </button>

              <button
                onClick={() => {
                  setDownloadNotice(`Downloading PDF Fiscal Receipt (${receiptModal.receiptNo})...`);
                  setTimeout(() => setDownloadNotice(null), 3500);
                }}
                className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-2xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={handleFinishSale}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Complete & Next Sale</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
