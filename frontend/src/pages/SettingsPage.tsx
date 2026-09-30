import { useState } from 'react';
import {
  Save, Check, Building2, ShieldCheck, Printer
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';

export default function SettingsPage() {
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings State
  const [storeName, setStoreName] = useState('TZA Mart Supermarket');
  const [tin, setTin] = useState('102-394-857');
  const [vrn, setVrn] = useState('40012983-T');
  const [currency, setCurrency] = useState('TZS');
  const [vatRate, setVatRate] = useState('18');
  const [vfdServerUrl, setVfdServerUrl] = useState('https://vfd.tra.go.tz/api/v1');
  const [vfdDeviceId, setVfdDeviceId] = useState('EFD-TZ-DAR-001');
  const [receiptFooter, setReceiptFooter] = useState('Asante kwa kununua nasi TzSuperPOS! Karibu tena.');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <AdminLayout title="System Settings">
      {savedSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <Check className="w-5 h-5" />
          <span className="text-sm font-bold">Settings saved successfully!</span>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-7 space-y-6 max-w-4xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Store Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-[#4f46e5]" />
              <h2 className="text-base font-black text-slate-900">Supermarket Company Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Supermarket Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Currency Code</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>
            </div>
          </div>

          {/* TRA Tax & VFD Setup */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-[#4f46e5]" />
              <h2 className="text-base font-black text-slate-900">Tanzania Revenue Authority (TRA) & VFD Integration</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">TIN Number</label>
                <input
                  type="text"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">VRN Number</label>
                <input
                  type="text"
                  value={vrn}
                  onChange={(e) => setVrn(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">VAT Rate (%)</label>
                <input
                  type="text"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">TRA VFD Endpoint URL</label>
                <input
                  type="text"
                  value={vfdServerUrl}
                  onChange={(e) => setVfdServerUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">EFD / VFD Device ID</label>
                <input
                  type="text"
                  value={vfdDeviceId}
                  onChange={(e) => setVfdDeviceId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
                />
              </div>
            </div>
          </div>

          {/* Receipt Options */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <Printer className="w-5 h-5 text-[#4f46e5]" />
              <h2 className="text-base font-black text-slate-900">Thermal Receipt Options</h2>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Receipt Footer Message</label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:opacity-95 text-white font-bold text-sm rounded-2xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
