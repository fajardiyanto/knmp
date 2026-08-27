import React, { useState } from "react";
import { LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Email atau password salah");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
    setIsSubmitting(true);
    try {
      await login(quickEmail, quickPass);
    } catch (err: any) {
      setError(err.message || "Email atau password salah");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center">

          {/* Left Column: SIMANTAP Banner Poster */}
          <div className="hidden lg:block bg-slate-900 p-6 h-full min-h-[580px] flex items-center justify-center overflow-hidden">
            <img
              src="/assets/img/sumatra.png"
              alt="SIMANTAP KNMP Banner"
              className="rounded-xl object-contain max-h-[560px] w-full shadow-lg"
              onError={(e) => {
                e.currentTarget.src = "/assets/img/bg-login.png";
              }}
            />
          </div>

          {/* Right Column: Login Form */}
          <div className="p-8 sm:p-12">
            <div className="max-w-md mx-auto space-y-6">

              {/* KKP / KNMP Logo */}
              <div className="flex items-center gap-3">
                <img
                  src="/assets/img/kkp-logo.png"
                  alt="Logo KKP"
                  className="w-16 h-auto"
                />
                <div>
                  <h1 className="text-sm font-bold text-slate-800 tracking-wider uppercase">
                    Kementerian Kelautan & Perikanan
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Program Pembangunan Kampung Nelayan Merah Putih
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">Selamat Datang!</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Silahkan Login</p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full px-3.5 py-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#004B87] focus:border-transparent outline-none transition-all placeholder:text-slate-400 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Type password"
                    className="w-full px-3.5 py-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#004B87] focus:border-transparent outline-none transition-all placeholder:text-slate-400 bg-white"
                  />
                </div>

                <div className="flex items-center justify-end text-xs">
                  <a href="#forgot" className="text-[#004B87] hover:underline font-semibold">
                    Forgot Password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? "Memproses..." : "Log in"}</span>
                </button>
              </form>

              {/* Quick Demo Credentials */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Akses Cepat Demo:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("superadmin@gmail.com", "password")}
                    className="px-2 py-1.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-center transition-colors"
                  >
                    SuperAdmin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("kontraktor@gmail.com", "password")}
                    className="px-2 py-1.5 text-[11px] font-medium bg-blue-50 hover:bg-blue-100 text-[#004B87] rounded-lg text-center transition-colors"
                  >
                    Kontraktor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("pengawas@gmail.com", "password")}
                    className="px-2 py-1.5 text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-center transition-colors"
                  >
                    Pengawas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("wakil_ppk@gmail.com", "password")}
                    className="px-2 py-1.5 text-[11px] font-medium bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-center transition-colors"
                  >
                    Wakil PPK
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("admin_ppk@gmail.com", "password")}
                    className="px-2 py-1.5 text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-center transition-colors"
                  >
                    Admin PPK
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("ppk@gmail.com", "password")}
                    className="px-2 py-1.5 text-[11px] font-medium bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-center transition-colors"
                  >
                    PPK
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
