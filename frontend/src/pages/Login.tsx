import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Lock, AtSign, Loader2, ShieldCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    // Role Routing
    setTimeout(() => {
      setIsLoading(false);
      const lowerUser = username.toLowerCase().trim();
      if (lowerUser.includes('cashier')) {
        navigate('/cashier');
      } else {
        navigate('/admin');
      }
    }, 500);
  };

  const setDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden select-none"
      style={{
        background: 'linear-gradient(135deg, #eef2fd 0%, #f4f7fe 50%, #f9f6fd 100%)'
      }}
    >
      {/* Soft Ambient Depth Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[550px] h-[550px] bg-[#6366f1]/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[550px] h-[550px] bg-[#a855f7]/12 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#38bdf8]/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Login Card Container (Exact Match to Screenshot 1) */}
      <div
        className="relative z-10 w-full max-w-[430px] rounded-[2.5rem] p-8 sm:p-10 flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-200"
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(30px) saturate(160%)',
          WebkitBackdropFilter: 'blur(30px) saturate(160%)',
          border: '1px solid rgba(255, 255, 255, 0.85)',
          boxShadow: '0 24px 60px rgba(99, 102, 241, 0.08), 0 8px 24px rgba(0, 0, 0, 0.03)',
        }}
      >

        {/* Floating Top Logo Box */}
        <div
          className="w-20 h-20 bg-white rounded-3xl flex flex-col items-center justify-center p-2 group"
          style={{
            boxShadow: '0 12px 32px rgba(99, 102, 241, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.95)'
          }}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5046e5] via-[#6366f1] to-[#9333ea] flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <span className="text-[8.5px] font-black tracking-tight text-slate-800 mt-1">TzSuperPOS</span>
        </div>

        {/* Heading & Subtitle */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs font-medium text-slate-400">
            Sign in to access your TzSuperPOS workspace
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="w-full p-3 bg-rose-50/90 border border-rose-200 text-rose-600 text-xs font-bold rounded-2xl text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-5">

          {/* EMAIL OR USERNAME */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-username"
              className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider ml-0.5"
            >
              EMAIL OR USERNAME
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <AtSign className="w-4 h-4" />
              </div>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-slate-200/90 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5b4dfb]/25 focus:border-[#5b4dfb] transition-all shadow-xs"
                placeholder="name@company.com or username"
                autoComplete="username"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider ml-0.5"
            >
              PASSWORD
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-slate-200/90 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5b4dfb]/25 focus:border-[#5b4dfb] transition-all shadow-xs"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#5b4dfb] focus:ring-[#5b4dfb] border-slate-300 cursor-pointer"
              />
              <span className="text-slate-600 font-semibold text-xs">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => alert('Demo Credentials: Use admin / admin or cashier / cashier')}
              className="text-xs font-bold text-[#5b4dfb] hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {/* Sign In Button (Exact Vibrant Purple Gradient from Image 1) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 text-white font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60 hover:opacity-95 active:scale-[0.99]"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #9333ea 100%)',
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.35), 0 2px 8px rgba(99, 102, 241, 0.2)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>

        </form>

        {/* Demo Fast-Fill helper pills */}
        <div className="w-full pt-4 border-t border-slate-200/60 flex items-center justify-center space-x-2 text-[11px] font-bold text-slate-500">
          <span>Quick Demo:</span>
          <button
            type="button"
            onClick={() => setDemo('admin', 'admin')}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[#5b4dfb] hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setDemo('cashier', 'cashier')}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[#5b4dfb] hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            Cashier
          </button>
        </div>

        {/* Footer Security Badge */}
        <div className="flex items-center justify-center space-x-1.5 text-[10px] font-bold text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>TRA VFD Compliant · Protected Session</span>
        </div>

      </div>

    </div>
  );
}
