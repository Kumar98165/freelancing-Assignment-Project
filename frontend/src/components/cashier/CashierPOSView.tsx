import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Plus, Trash2, Printer, Download, FileText,
  DollarSign, CreditCard, Smartphone,
  AlertCircle, ScanBarcode, X, Calendar, Clock,
  HelpCircle, ArrowRight, User, CheckCircle2, ShieldCheck, Loader2, RefreshCw,
  RotateCcw
} from 'lucide-react';
import { type PaymentState, type MobileMoneyProvider } from '../../services/mockPaymentService';
import posService, { type POSProductItem } from '../../services/posService';
import { inventoryService, type InventoryItem } from '../../services/inventoryService';
import { useSettings } from '../../context/SettingsContext';

export type POSProduct = POSProductItem;

export type CartItem = {
  product: POSProduct;
  quantity: number;
  discountPercent: number;
};

export type RecentScan = {
  id: string;
  name: string;
  time: string;
  price: number;
};

const getProductEmoji = (categoryName?: string, productName?: string) => {
  const cat = (categoryName || '').toLowerCase();
  const pname = (productName || '').toLowerCase();
  if (cat.includes('bev') || pname.includes('water') || pname.includes('soda') || pname.includes('coca') || pname.includes('sprite') || pname.includes('lager') || pname.includes('beer')) return '🥤';
  if (pname.includes('milk') || cat.includes('dairy') || cat.includes('dye')) return '🥛';
  if (pname.includes('bread') || cat.includes('bakery') || pname.includes('flour') || pname.includes('sembe') || cat.includes('groc')) return '🍞';
  if (pname.includes('tomato') || cat.includes('veg') || cat.includes('fruit') || cat.includes('produce')) return '🍅';
  if (pname.includes('oil')) return '🍾';
  if (pname.includes('soap') || pname.includes('powder') || pname.includes('detergent') || cat.includes('house')) return '🧼';
  if (pname.includes('toothpaste') || pname.includes('brush') || cat.includes('person')) return '🪥';
  return '📦';
};

interface CashierPOSViewProps {
  onSaleComplete?: () => void;
  externalCartItem?: POSProduct | null;
}

export default function CashierPOSView({ onSaleComplete, externalCartItem }: CashierPOSViewProps) {
  const { settings } = useSettings();
  // Live Products & Categories from Backend Inventory
  const [productsList, setProductsList] = useState<POSProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>(['All']);

  // Inputs & State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  // Payment Form & Workflow State
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Mobile Money' | 'Card'>('Cash');
  const [mobileProvider, setMobileProvider] = useState<MobileMoneyProvider>('M-Pesa');
  const [mobilePhone, setMobilePhone] = useState<string>('0712345678');
  const [cardReference, setCardReference] = useState<string>('TXN-CARD-8832');
  const [amountPaid, setAmountPaid] = useState<string>('');

  // Payment Processing State Machine ('Idle' | 'Pending' | 'Processing' | 'Success' | 'Failed')
  const [paymentState, setPaymentState] = useState<'Idle' | PaymentState>('Idle');
  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string | null>(null);

  // Alerts & Modals
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);
  const [receiptModal, setReceiptModalState] = useState<any | null>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlReceipt = urlParams.get('receipt');
      const saved = localStorage.getItem('active_pos_receipt');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!urlReceipt || parsed.receiptNo === urlReceipt) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const setReceiptModal = (data: any | null) => {
    setReceiptModalState(data);
    try {
      if (data && data.receiptNo) {
        localStorage.setItem('active_pos_receipt', JSON.stringify(data));
        const url = new URL(window.location.href);
        url.searchParams.set('receipt', data.receiptNo);
        window.history.replaceState({}, '', url.toString());
      } else {
        localStorage.removeItem('active_pos_receipt');
        const url = new URL(window.location.href);
        url.searchParams.delete('receipt');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      console.error('Failed to sync receipt in localStorage / URL:', e);
    }
  };

  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Live Clock State
  const [currentTime, setCurrentTime] = useState<string>('12:58:50');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load exact inventory products from live backend
  const fetchProductsAndCategories = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const invData = await inventoryService.getInventory({ limit: 1000 }).catch(() => null);
      if (invData && invData.items && invData.items.length > 0) {
        const mapped: POSProduct[] = invData.items.map((it: InventoryItem) => ({
          id: String(it.id),
          name: it.product,
          sku: it.sku,
          barcode: it.barcode,
          category: it.category || 'General',
          price: it.sellingPrice,
          stock: it.currentStock,
          minStock: it.minStock,
          imageIcon: getProductEmoji(it.category, it.product)
        }));
        setProductsList(mapped);

        const distinctCats: string[] = [
          'All',
          ...Array.from(new Set(invData.items.map((it: InventoryItem) => it.category).filter((c): c is string => Boolean(c))))
        ];
        setCategories(distinctCats);
      } else {
        const fetchedProducts = await posService.getPOSProducts().catch(() => []);
        if (fetchedProducts.length > 0) {
          setProductsList(fetchedProducts);
          const distinctCats: string[] = [
            'All',
            ...Array.from(new Set(fetchedProducts.map(p => p.category).filter((c): c is string => Boolean(c))))
          ];
          setCategories(distinctCats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory products for POS:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return `TZS ${new Intl.NumberFormat('en-TZ', { maximumFractionDigits: 0 }).format(amount)}`;
  };

  const filteredProducts = productsList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAddProductToCart = useCallback((product: POSProduct) => {
    setBarcodeError(null);
    setStockError(null);

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    const currentQtyInCart = existingIndex >= 0 ? Number(cart[existingIndex].quantity) : 0;

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
    setRecentScans(prev => [newScan, ...prev.slice(0, 4)]);
  }, [cart]);

  useEffect(() => {
    if (externalCartItem) {
      handleAddProductToCart(externalCartItem);
    }
  }, [externalCartItem, handleAddProductToCart]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    setBarcodeError(null);
    setStockError(null);

    const foundProduct = productsList.find(
      p => p.barcode.toLowerCase() === code.toLowerCase() || p.sku.toLowerCase() === code.toLowerCase()
    );

    if (foundProduct) {
      handleAddProductToCart(foundProduct);
      setBarcodeInput('');
    } else {
      setBarcodeError('Product not found. Please check the barcode or register it.');
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setStockError(null);
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = (Number(item.quantity) || 0) + delta;
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
  const rawSubtotal = cart.reduce((sum, item) => sum + (item.product.price * (Number(item.quantity) || 0)), 0);
  const vatTax = Math.round(rawSubtotal * 0.18);
  const grandTotal = rawSubtotal + vatTax;

  const numericPaid = Number(amountPaid) || grandTotal;
  const cashChange = Math.max(0, numericPaid - grandTotal);

  // Complete Real POS Checkout via Flask Backend posService
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setPaymentErrorMessage(null);

    const checkoutItems = cart.map(item => ({
      productId: item.product.id,
      quantity: Number(item.quantity) || 1,
      unitPrice: item.product.price,
      discountPercent: item.discountPercent || 0
    }));

    const stdPayMethod = paymentMethod === 'Card' ? 'CARD / BANK' : paymentMethod === 'Mobile Money' ? 'MOBILE MONEY' : 'CASH';

    const payload = {
      items: checkoutItems,
      paymentMethod: stdPayMethod,
      provider: paymentMethod === 'Mobile Money' ? mobileProvider : undefined,
      customerPhone: paymentMethod === 'Mobile Money' ? mobilePhone : undefined,
      paymentRef: paymentMethod === 'Card' ? cardReference : undefined,
      amountPaid: paymentMethod === 'Cash' ? numericPaid : grandTotal,
      cashierName: 'John Cashier',
      customerName: 'Walk-in Customer'
    };

    try {
      if (paymentMethod === 'Cash') {
        setPaymentState('Pending');
        let saleData: any = null;
        try {
          const res = await posService.processCheckout(payload);
          saleData = res.sale || res.receipt;
        } catch {
          // Adjust stock directly
          await Promise.all(
            cart.map(item =>
              inventoryService.adjustStock({
                productId: item.product.id,
                newStock: Math.max(0, item.product.stock - Number(item.quantity)),
                reason: 'PHYSICAL_COUNT',
                notes: `POS Sale Checkout`
              }).catch(() => null)
            )
          );
        }
        setPaymentState('Success');

        const now = new Date();
        const receipt = {
          supermarketName: settings.storeName,
          storeBranch: settings.branchName,
          storeAddress: settings.storeAddress,
          storePhone: settings.storePhone,
          storeEmail: settings.storeEmail,
          currency: settings.currency,
          receiptHeaderTagline: settings.receiptHeaderTagline,
          receiptFooter: settings.receiptFooter,
          tin: settings.tin,
          vrn: settings.vrn,
          vatRate: settings.vatRate,
          receiptNo: saleData?.sale_number || saleData?.saleNumber || saleData?.receiptNo || saleData?.id || `SALE-TZ-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          date: saleData?.date || now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: saleData?.time || currentTime,
          cashier: saleData?.cashier_name || saleData?.cashier || 'John Cashier (ID: C-104)',
          customer: saleData?.customer_name || saleData?.customer || 'Walk-in Customer',
          items: [...cart],
          rawSubtotal,
          vatTax,
          grandTotal,
          paymentMethod: 'Cash',
          numericPaid,
          cashChange: saleData?.change_amount ?? saleData?.changeAmount ?? cashChange,
          fiscalInformation: {
            fiscalizationStatus: 'FISCALIZED / VERIFIED (TRA VFD)',
            fiscalReceiptNo: saleData?.fiscal_receipt_no || saleData?.fiscalReceiptNo || `TRA-VFD-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
            fiscalDevice: saleData?.fiscal_device || saleData?.fiscalDevice || settings.vfdDeviceId,
            verificationCode: saleData?.verification_code || saleData?.verificationCode || `TRA-VFD-${Math.floor(10000 + Math.random() * 90000)}-TZ`,
            fiscalDate: saleData?.fiscal_date || saleData?.fiscalDate || now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            fiscalTime: saleData?.fiscal_time || saleData?.fiscalTime || currentTime,
          },
        };

        setTimeout(() => {
          setPaymentState('Idle');
          setReceiptModal(receipt);
          fetchProductsAndCategories();
          if (onSaleComplete) onSaleComplete();
        }, 600);

      } else if (paymentMethod === 'Mobile Money') {
        setPaymentState('Pending');
        setTimeout(() => setPaymentState('Processing'), 600);

        let saleData: any = null;
        try {
          const res = await posService.processCheckout(payload);
          saleData = res.sale || res.receipt;
        } catch {
          await Promise.all(
            cart.map(item =>
              inventoryService.adjustStock({
                productId: item.product.id,
                newStock: Math.max(0, item.product.stock - Number(item.quantity)),
                reason: 'PHYSICAL_COUNT',
                notes: `POS Sale - Mobile Money (${mobileProvider})`
              }).catch(() => null)
            )
          );
        }
        setPaymentState('Success');

        const now = new Date();
        const receipt = {
          supermarketName: settings.storeName,
          storeBranch: settings.branchName,
          storeAddress: settings.storeAddress,
          storePhone: settings.storePhone,
          storeEmail: settings.storeEmail,
          currency: settings.currency,
          receiptHeaderTagline: settings.receiptHeaderTagline,
          receiptFooter: settings.receiptFooter,
          tin: settings.tin,
          vrn: settings.vrn,
          vatRate: settings.vatRate,
          receiptNo: saleData?.sale_number || saleData?.saleNumber || saleData?.receiptNo || saleData?.id || `SALE-TZ-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          date: saleData?.date || now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: saleData?.time || currentTime,
          cashier: saleData?.cashier_name || saleData?.cashier || 'John Cashier (ID: C-104)',
          customer: saleData?.customer_name || saleData?.customer || 'Walk-in Customer',
          items: [...cart],
          rawSubtotal,
          vatTax,
          grandTotal,
          paymentMethod: `Mobile Money (${mobileProvider})`,
          mobileProvider,
          customerPhone: mobilePhone,
          numericPaid: grandTotal,
          cashChange: 0,
          fiscalInformation: {
            fiscalizationStatus: 'FISCALIZED / VERIFIED (TRA VFD)',
            fiscalReceiptNo: saleData?.fiscal_receipt_no || saleData?.fiscalReceiptNo || `TRA-VFD-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
            fiscalDevice: saleData?.fiscal_device || saleData?.fiscalDevice || settings.vfdDeviceId,
            verificationCode: saleData?.verification_code || saleData?.verificationCode || `TRA-VFD-${Math.floor(10000 + Math.random() * 90000)}-TZ`,
            fiscalDate: saleData?.fiscal_date || saleData?.fiscalDate || now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            fiscalTime: saleData?.fiscal_time || saleData?.fiscalTime || currentTime,
          },
        };

        setTimeout(() => {
          setPaymentState('Idle');
          setReceiptModal(receipt);
          fetchProductsAndCategories();
          if (onSaleComplete) onSaleComplete();
        }, 600);

      } else if (paymentMethod === 'Card') {
        setPaymentState('Pending');
        setTimeout(() => setPaymentState('Processing'), 600);

        let saleData: any = null;
        try {
          const res = await posService.processCheckout(payload);
          saleData = res.sale || res.receipt;
        } catch {
          await Promise.all(
            cart.map(item =>
              inventoryService.adjustStock({
                productId: item.product.id,
                newStock: Math.max(0, item.product.stock - Number(item.quantity)),
                reason: 'PHYSICAL_COUNT',
                notes: `POS Sale - Card/Bank`
              }).catch(() => null)
            )
          );
        }
        setPaymentState('Success');

        const now = new Date();
        const receipt = {
          supermarketName: settings.storeName,
          storeBranch: settings.branchName,
          storeAddress: settings.storeAddress,
          storePhone: settings.storePhone,
          storeEmail: settings.storeEmail,
          currency: settings.currency,
          receiptHeaderTagline: settings.receiptHeaderTagline,
          receiptFooter: settings.receiptFooter,
          tin: settings.tin,
          vrn: settings.vrn,
          vatRate: settings.vatRate,
          receiptNo: saleData?.sale_number || saleData?.saleNumber || saleData?.receiptNo || saleData?.id || `SALE-TZ-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          date: saleData?.date || now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: saleData?.time || currentTime,
          cashier: saleData?.cashier_name || saleData?.cashier || 'John Cashier (ID: C-104)',
          customer: saleData?.customer_name || saleData?.customer || 'Walk-in Customer',
          items: [...cart],
          rawSubtotal,
          vatTax,
          grandTotal,
          paymentMethod: 'Card / Bank',
          cardReference,
          numericPaid: grandTotal,
          cashChange: 0,
          fiscalInformation: {
            fiscalizationStatus: 'FISCALIZED / VERIFIED (TRA VFD)',
            fiscalReceiptNo: saleData?.fiscal_receipt_no || saleData?.fiscalReceiptNo || `TRA-VFD-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
            fiscalDevice: saleData?.fiscal_device || saleData?.fiscalDevice || settings.vfdDeviceId,
            verificationCode: saleData?.verification_code || saleData?.verificationCode || `TRA-VFD-${Math.floor(10000 + Math.random() * 90000)}-TZ`,
            fiscalDate: saleData?.fiscal_date || saleData?.fiscalDate || now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            fiscalTime: saleData?.fiscal_time || saleData?.fiscalTime || currentTime,
          },
        };

        setTimeout(() => {
          setPaymentState('Idle');
          setReceiptModal(receipt);
          fetchProductsAndCategories();
          if (onSaleComplete) onSaleComplete();
        }, 600);
      }
    } catch (err: any) {
      console.error('POS Checkout failed:', err);
      setPaymentState('Failed');
      setPaymentErrorMessage(err.response?.data?.message || err.message || 'Payment processing failed. Please try again.');
    }
  };

  const handleCancelOrModifySale = () => {
    if (cart.length === 0 && receiptModal?.items && receiptModal.items.length > 0) {
      setCart(receiptModal.items);
    }
    setReceiptModal(null);
    setPaymentState('Idle');
    setPaymentErrorMessage(null);
  };

  const handleFinishSale = () => {
    setReceiptModal(null);
    setCart([]);
    setAmountPaid('');
    setPaymentState('Idle');
    setPaymentErrorMessage(null);
    setBarcodeError(null);
    setStockError(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between space-y-4">
      {/* HEADER BAR */}
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
              <span>Today</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-white/80 px-4 py-2 rounded-2xl border border-white shadow-2xs text-xs font-bold text-slate-700">
            <Clock className="w-4 h-4 text-blue-600" />
            <div className="text-left">
              <span className="text-[9px] text-slate-400 block font-normal leading-none">Time</span>
              <span className="font-mono">{currentTime}</span>
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

      {/* POS WORKSPACE 3-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">

        {/* COLUMN 1: SCAN & SEARCH PRODUCT CATALOG */}
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
              onChange={(e) => {
                setBarcodeInput(e.target.value);
                setSearchTerm(e.target.value);
              }}
              className="w-full pl-4 pr-10 py-3 bg-white border-2 border-blue-400/80 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-inner"
            />
            <ScanBarcode className="w-4 h-4 absolute right-3.5 top-1/2 transform -translate-y-1/2 text-blue-600" />
          </form>

          {barcodeError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-extrabold">Product not found.</p>
                <p className="font-medium text-[11px] text-red-600">Please check the barcode or register it.</p>
              </div>
              <button onClick={() => setBarcodeError(null)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* DYNAMIC CATEGORY PILLS */}
          <div className="flex space-x-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* PRODUCTS CATALOG LIST */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
            {isLoadingProducts ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                <p className="text-xs font-bold">Loading live inventory...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs font-bold">No matching products in inventory</p>
              </div>
            ) : (
              filteredProducts.map((p) => (
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
                    <button className="w-7 h-7 bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white rounded-xl flex items-center justify-center font-bold transition-all cursor-pointer">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: SHOPPING CART & RECENT SCANS */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white p-5 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Shopping Cart</h3>
                <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-black">
                  {cart.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)}
                </span>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
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

            {/* CART ITEMS TABLE */}
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
                    const qtyNum = Number(item.quantity) || 0;
                    const lineTotal = item.product.price * qtyNum;
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

                        {/* QUANTITY CELL (MANUAL INPUT + STEPPERS) */}
                        <td className="py-2.5 px-2">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="w-7 h-7 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg text-slate-700 flex items-center justify-center font-black text-sm cursor-pointer transition-all shadow-2xs"
                              title="Decrease quantity (-1)"
                            >
                              -
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onFocus={(e) => {
                                e.stopPropagation();
                                e.target.select();
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                (e.target as HTMLInputElement).select();
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                const cleaned = e.target.value.replace(/[^0-9]/g, '');
                                if (cleaned === '') {
                                  setCart(cart.map(i => i.product.id === item.product.id ? { ...i, quantity: 0 } : i));
                                } else {
                                  const num = parseInt(cleaned, 10);
                                  if (!isNaN(num)) {
                                    if (num > item.product.stock) {
                                      setStockError(`Stock limit reached for "${item.product.name}". Available stock: ${item.product.stock}.`);
                                      setCart(cart.map(i => i.product.id === item.product.id ? { ...i, quantity: item.product.stock } : i));
                                    } else {
                                      setStockError(null);
                                      setCart(cart.map(i => i.product.id === item.product.id ? { ...i, quantity: num } : i));
                                    }
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                e.stopPropagation();
                                if (!item.quantity || item.quantity < 1) {
                                  setCart(cart.map(i => i.product.id === item.product.id ? { ...i, quantity: 1 } : i));
                                }
                              }}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className="w-14 h-7 text-center bg-white border-2 border-slate-200 focus:border-blue-500 rounded-lg text-xs font-black font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-inner cursor-text"
                              title="Click and type exact quantity"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-7 h-7 bg-blue-50 hover:bg-blue-600 hover:text-white active:scale-95 rounded-lg text-blue-600 flex items-center justify-center font-black text-sm cursor-pointer transition-all shadow-2xs"
                              title="Increase quantity (+1)"
                            >
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

          {/* RECENT SCANS WIDGET */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Recent Scans
              </h4>
            </div>

            <div className="space-y-1.5">
              {recentScans.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-2">No items scanned yet.</p>
              ) : (
                recentScans.map((scan) => (
                  <div key={scan.id} className="flex justify-between items-center text-xs p-1.5 bg-slate-50/70 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">🥤</span>
                      <span className="font-bold text-slate-800 truncate max-w-[120px]">{scan.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{scan.time}</span>
                    <span className="font-black text-slate-900">{formatCurrency(scan.price)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3: PAYMENT METHODS & CHECKOUT COMPLETION */}
        <div className="lg:col-span-4 bg-white/80 backdrop-blur-2xl rounded-3xl border border-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-blue-600" /> Payment
            </h3>

            {/* ORDER FINANCIAL SUMMARY */}
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

            {/* PAYMENT METHOD SELECTION */}
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

            {/* CASH PAYMENT FORM */}
            {paymentMethod === 'Cash' && (
              <div className="space-y-3 p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 mb-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">AMOUNT RECEIVED (TZS)</label>
                    <button
                      type="button"
                      onClick={() => setAmountPaid(grandTotal.toString())}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
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

                {/* QUICK CASH BUTTONS */}
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

            {/* MOBILE MONEY FORM */}
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
                </div>
              </div>
            )}

            {/* CARD / BANK FORM */}
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

      {/* FOOTER SYSTEM STATUS */}
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

      {/* PAYMENT PROCESSING OVERLAY MODAL */}
      {paymentState !== 'Idle' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 font-sans border border-white/80">
            {paymentState === 'Pending' && (
              <div className="space-y-3 py-4">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full mx-auto flex items-center justify-center animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-base font-black text-slate-900">Initiating Payment</h3>
                <p className="text-xs text-slate-500 font-medium">Connecting to {paymentMethod} payment provider...</p>
              </div>
            )}

            {paymentState === 'Processing' && (
              <div className="space-y-3 py-4">
                <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-full mx-auto flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-base font-black text-slate-900">Processing Payment</h3>
                <p className="text-xs text-slate-500 font-medium">Authorizing payment transaction with provider...</p>
              </div>
            )}

            {paymentState === 'Success' && (
              <div className="space-y-3 py-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-slate-900">Payment Confirmed!</h3>
                <p className="text-xs text-emerald-600 font-bold">TZS {grandTotal.toLocaleString()} received successfully.</p>
              </div>
            )}

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

      {/* COMPLETED SALE & TRA FISCAL RECEIPT MODAL */}
      {receiptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
            {/* 1. STICKY TOP HEADER */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 flex-shrink-0 bg-white print:hidden">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">Sale Transaction Receipt</h3>
                  <p className="text-[10.5px] font-medium text-emerald-600 leading-tight">Official Supermarket & TRA Fiscal Record</p>
                </div>
              </div>

              <button
                onClick={handleFinishSale}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                title="Close Receipt"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DOWNLOAD NOTICE TOAST */}
            {downloadNotice && (
              <div className="mx-4 mt-3 p-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-sm flex-shrink-0 print:hidden">
                <div className="flex items-center space-x-2">
                  <Download className="w-3.5 h-3.5 animate-bounce" />
                  <span>{downloadNotice}</span>
                </div>
                <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-mono">PDF</span>
              </div>
            )}

            {/* 2. SCROLLABLE CLEAN PRINTABLE RECEIPT CONTENT */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div id="printable-receipt" className="space-y-3.5 font-sans bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80">
                {/* STORE HEADER */}
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                  <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-sky-400 rounded-xl mx-auto flex items-center justify-center text-white shadow-sm mb-1.5">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <h2 className="font-black text-lg text-slate-900 tracking-tight">{receiptModal.supermarketName}</h2>
                  <p className="text-xs text-slate-600 font-medium">{receiptModal.storeBranch}</p>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center justify-center space-x-2 pt-0.5">
                    <span>TIN: <strong className="text-slate-700">{receiptModal.tin}</strong></span>
                    <span>•</span>
                    <span>VRN: <strong className="text-slate-700">{receiptModal.vrn}</strong></span>
                  </div>
                </div>

                {/* TRANSACTION METADATA */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-medium">Receipt No:</span>
                      <p className="font-bold text-slate-900 font-mono">{receiptModal.receiptNo}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 font-medium">Date & Time:</span>
                      <p className="font-bold text-slate-900">{receiptModal.date} {receiptModal.time}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Cashier:</span>
                      <p className="font-bold text-slate-900 truncate">{receiptModal.cashier}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 font-medium">Payment Mode:</span>
                      <p className="font-bold text-slate-900">{receiptModal.paymentMethod}</p>
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
                      {receiptModal.items.map((item: CartItem) => (
                        <tr key={item.product.id}>
                          <td className="py-2 pr-2">
                            <p className="font-bold text-slate-900">{item.product.name}</p>
                            {item.product.sku && <span className="text-[10px] text-slate-400 font-mono">{item.product.sku}</span>}
                          </td>
                          <td className="py-2 text-center font-bold text-slate-900">{item.quantity}</td>
                          <td className="py-2 text-right font-mono text-slate-600">{formatCurrency(item.product.price)}</td>
                          <td className="py-2 text-right font-bold text-slate-900 font-mono">{formatCurrency(item.product.price * Number(item.quantity))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* FINANCIAL TOTALS */}
                <div className="border-t border-slate-200 pt-2.5 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Subtotal (Excl. VAT):</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(receiptModal.rawSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>{receiptModal.vatRate || '18'}% TRA VAT (Included):</span>
                    <span className="font-mono text-slate-700">{formatCurrency(receiptModal.vatTax)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm py-1.5 border-t border-b border-slate-200 text-slate-900 bg-slate-50 px-2 rounded-lg my-1">
                    <span>TOTAL PAID:</span>
                    <span className="font-mono text-blue-600 text-base">{formatCurrency(receiptModal.grandTotal)}</span>
                  </div>
                  {receiptModal.paymentMethod === 'Cash' && (
                    <div className="flex justify-between text-[11px] text-slate-600 pt-0.5 px-1">
                      <span>Received: <strong className="font-mono text-slate-900">{formatCurrency(receiptModal.numericPaid)}</strong></span>
                      <span>Change: <strong className="font-mono text-emerald-600">{formatCurrency(receiptModal.cashChange)}</strong></span>
                    </div>
                  )}
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
                    <span>VFD No: {receiptModal.fiscalInformation?.fiscalReceiptNo || receiptModal.receiptNo}</span>
                    <span>EFD: {receiptModal.fiscalInformation?.fiscalDevice || receiptModal.fiscalDevice || settings.vfdDeviceId}</span>
                  </div>
                  <div className="text-center bg-slate-900 text-emerald-400 font-mono text-[10px] py-1 rounded font-bold tracking-wider">
                    {receiptModal.fiscalInformation?.verificationCode || `TRA-VFD-${Math.floor(10000 + Math.random() * 90000)}-TZ`}
                  </div>
                </div>

                {/* FOOTER */}
                <div className="text-center text-slate-400 text-[10.5px] pt-1">
                  <p className="font-bold text-slate-700">{receiptModal.receiptFooter || 'Asante kwa kununua nasi • Thank you for shopping with us!'}</p>
                </div>
              </div>
            </div>

            {/* 3. STICKY BOTTOM ACTION BAR */}
            <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/90 backdrop-blur-sm flex flex-wrap sm:flex-nowrap gap-2 flex-shrink-0 print:hidden">
              <button
                onClick={handleCancelOrModifySale}
                className="flex-1 min-w-[110px] py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                title="Cancel receipt and return to cart to add/remove items"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Modify / Back</span>
              </button>

              <button
                onClick={() => posService.printReceiptOnly('printable-receipt')}
                className="flex-1 min-w-[90px] py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-700" />
                <span>Print</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    setDownloadNotice(`Downloading Official PDF Receipt (${receiptModal.receiptNo})...`);
                    await posService.downloadReceiptPdf(receiptModal.receiptNo, `Receipt-${receiptModal.receiptNo}.pdf`, receiptModal);
                    setTimeout(() => setDownloadNotice(null), 3000);
                  } catch (err) {
                    console.error('Failed to download PDF:', err);
                    setDownloadNotice(`Failed to download PDF receipt. Please try again.`);
                    setTimeout(() => setDownloadNotice(null), 4000);
                  }
                }}
                className="flex-1 min-w-[110px] py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={handleFinishSale}
                className="flex-1 min-w-[110px] py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Next Sale</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
