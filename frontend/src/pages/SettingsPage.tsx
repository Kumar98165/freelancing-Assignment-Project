import { useState, useEffect } from 'react';
import {
  Save, Check, Building2, ShieldCheck, Printer,
  MapPin, Phone, Mail, CheckCircle2, RotateCcw,
  Sparkles, Smartphone, Hash, Percent, Globe, Server,
  Loader2, AlertCircle
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import settingsService from '../services/settingsService';
import type { StoreSettings } from '../services/settingsService';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string; isError?: boolean } | null>(null);

  // Store & Company Profile
  const [storeName, setStoreName] = useState('TZA Mart Supermarket');
  const [branchName, setBranchName] = useState('Kariakoo Main Flagship, Dar es Salaam');
  const [currency, setCurrency] = useState('TZS');
  const [storePhone, setStorePhone] = useState('+255 754 892 100');
  const [storeEmail, setStoreEmail] = useState('info@tzamart.co.tz');
  const [storeAddress, setStoreAddress] = useState('Plot 42, Msimbazi Street, Kariakoo');

  // TRA Tax & VFD Integration
  const [tin, setTin] = useState('102-394-857');
  const [vrn, setVrn] = useState('40012983-T');
  const [vatRate, setVatRate] = useState('18');
  const [vfdServerUrl, setVfdServerUrl] = useState('https://vfd.tra.go.tz/api/v1');
  const [vfdDeviceId, setVfdDeviceId] = useState('EFD-TZ-DAR-001');

  // Thermal Receipt Options
  const [receiptPaperWidth, setReceiptPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [receiptHeaderTagline, setReceiptHeaderTagline] = useState('Fresh Groceries & Household Essentials');
  const [receiptFooter, setReceiptFooter] = useState('Asante kwa kununua nasi TzSuperPOS! Karibu tena.');

  const populateFields = (data: StoreSettings) => {
    if (data.storeName) setStoreName(data.storeName);
    if (data.branchName !== undefined) setBranchName(data.branchName);
    if (data.currency) setCurrency(data.currency);
    if (data.storePhone !== undefined) setStorePhone(data.storePhone);
    if (data.storeEmail !== undefined) setStoreEmail(data.storeEmail);
    if (data.storeAddress !== undefined) setStoreAddress(data.storeAddress);
    if (data.tin !== undefined) setTin(data.tin);
    if (data.vrn !== undefined) setVrn(data.vrn);
    if (data.vatRate !== undefined) setVatRate(data.vatRate);
    if (data.vfdServerUrl !== undefined) setVfdServerUrl(data.vfdServerUrl);
    if (data.vfdDeviceId !== undefined) setVfdDeviceId(data.vfdDeviceId);
    if (data.receiptPaperWidth) setReceiptPaperWidth(data.receiptPaperWidth);
    if (data.receiptHeaderTagline !== undefined) setReceiptHeaderTagline(data.receiptHeaderTagline);
    if (data.receiptFooter !== undefined) setReceiptFooter(data.receiptFooter);
  };

  const showToast = (title: string, subtitle: string, isError = false) => {
    setToastMessage({ title, subtitle, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load System Settings on Mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await settingsService.getSettings();
        if (data) {
          populateFields(data);
        }
      } catch (err: any) {
        console.error('Failed to load system settings:', err);
        showToast('Error Loading Settings', 'Using local cached configuration.', true);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      const payload: Partial<StoreSettings> = {
        storeName: storeName.trim(),
        branchName: branchName.trim(),
        currency: currency.trim(),
        storePhone: storePhone.trim(),
        storeEmail: storeEmail.trim(),
        storeAddress: storeAddress.trim(),
        tin: tin.trim(),
        vrn: vrn.trim(),
        vatRate: vatRate.trim(),
        vfdServerUrl: vfdServerUrl.trim(),
        vfdDeviceId: vfdDeviceId.trim(),
        receiptPaperWidth,
        receiptHeaderTagline: receiptHeaderTagline.trim(),
        receiptFooter: receiptFooter.trim(),
      };

      const updated = await settingsService.updateSettings(payload);
      if (updated) {
        populateFields(updated);
      }
      showToast('Settings Saved Successfully!', 'Supermarket details and TRA fiscal parameters updated in database.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save system settings to database';
      showToast('Error Saving Settings', msg, true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all system settings to default factory values?')) {
      return;
    }
    try {
      setIsResetting(true);
      const res = await settingsService.resetSettings();
      if (res) {
        populateFields(res);
      }
      showToast('Settings Restored', 'System settings restored to factory defaults.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reset settings';
      showToast('Error Resetting Settings', msg, true);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AdminLayout title="System Settings">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 ${toastMessage.isError
            ? 'bg-gradient-to-r from-rose-600 to-red-600'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600'
          }`}>
          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
            {toastMessage.isError ? <AlertCircle className="w-4 h-4 text-white" /> : <Check className="w-4 h-4 text-white" />}
          </div>
          <div>
            <div className="text-sm font-bold">{toastMessage.title}</div>
            <div className="text-xs text-white/90">{toastMessage.subtitle}</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#4f46e5] animate-spin" />
          <span className="text-sm font-bold text-slate-600">Loading system settings from database...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 max-w-5xl pb-10">
          {/* Top Action & Status Bar */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4f46e5]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-base font-black text-slate-900">General & Fiscal Configuration</h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                    TRA Online
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage supermarket branch parameters, TRA VFD fiscal details, and thermal receipt formats.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                disabled={isResetting || isSaving}
                onClick={handleReset}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>Reset</span>
              </button>
              <button
                type="submit"
                disabled={isSaving || isResetting}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaving ? 'Saving...' : 'Save System Settings'}</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: Supermarket Company Details */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Supermarket Company Details</h2>
                  <p className="text-xs text-slate-400 font-normal">Business identity and store branch contact information</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                Primary Store
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                  Supermarket Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. TZA Mart Supermarket"
                    className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                  Currency Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="TZS"
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                  Store Branch / Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Branch location"
                    className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                  Physical Street Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="Street and Area"
                    className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                  Support Telephone
                </label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="+255 754 892 100"
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                  Support Email
                </label>
                <input
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  placeholder="info@tzamart.co.tz"
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: TRA & VFD Integration */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Tanzania Revenue Authority (TRA) & VFD Integration
                  </h2>
                  <p className="text-xs text-slate-400 font-normal">Official fiscal registration numbers & electronic server endpoints</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>TRA Compliant</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                  TIN Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  placeholder="102-394-857"
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                  VRN Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={vrn}
                  onChange={(e) => setVrn(e.target.value)}
                  placeholder="40012983-T"
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                  VAT Rate (%) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    placeholder="18"
                    className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] focus:bg-white transition-all pr-8"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                  EFD / VFD Device ID
                </label>
                <input
                  type="text"
                  value={vfdDeviceId}
                  onChange={(e) => setVfdDeviceId(e.target.value)}
                  placeholder="EFD-TZ-DAR-001"
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Thermal Receipt Options */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Thermal Receipt Options</h2>
                  <p className="text-xs text-slate-400 font-normal">Customization for 80mm/58mm POS thermal printers and messages</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('80mm')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${receiptPaperWidth === '80mm'
                    ? 'bg-[#4f46e5] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  80mm Standard
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('58mm')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${receiptPaperWidth === '58mm'
                    ? 'bg-[#4f46e5] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  58mm Compact
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                  Receipt Header Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={receiptHeaderTagline}
                  onChange={(e) => setReceiptHeaderTagline(e.target.value)}
                  placeholder="e.g. Fresh Groceries & Household Essentials"
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                  Receipt Footer Customer Message
                </label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Asante kwa kununua nasi TzSuperPOS! Karibu tena."
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Action Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Settings apply in real time to the POS checkout register and receipt printing.</span>
            </div>

            <button
              type="submit"
              disabled={isSaving || isResetting}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white font-bold text-sm rounded-2xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving...' : 'Save System Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </AdminLayout>

  );
}
