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
    <div className="min-h-screen bg-[#f4f6fa] dark:bg-[#0b1120] flex items-center justify-center p-4 sm:p-8 transition-colors duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center">

          {/* Left Column: SIMANTAP Banner Poster */}
          <div className="hidden lg:block bg-slate-900 p-6 h-full min-h-[580px] flex items-center justify-center overflow-hidden">
            <img
              src="/assets/img/sumatra.png"
              alt="SIMANTAP KNMP Banner"
              className="rounded-2xl object-contain max-h-[560px] w-full shadow-lg"
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
                  <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wider uppercase">
                    Kementerian Kelautan & Perikanan
                  </h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Program Pembangunan Kampung Nelayan Merah Putih
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Selamat Datang!</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Silahkan Login</p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full px-3.5 py-3 text-xs text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0d6efd]/30 focus:border-[#0d6efd] outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Type password"
                    className="w-full px-3.5 py-3 text-xs text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0d6efd]/30 focus:border-[#0d6efd] outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>

                <div className="flex items-center justify-end text-xs">
                  <a href="#forgot" className="text-[#0d6efd] dark:text-blue-400 hover:underline font-semibold">
                    Forgot Password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? "Memproses..." : "Log in"}</span>
                </button>
              </form>

              {/* Quick Demo Credentials */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Akses Cepat Demo:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("superadmin@gmail.com", "password")}
                    className="px-2 py-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-center transition-colors cursor-pointer"
                  >
                    SuperAdmin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("kontraktor@gmail.com", "password")}
                    className="px-2 py-1.5 text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#0d6efd] dark:text-blue-300 rounded-lg text-center transition-colors cursor-pointer"
                  >
                    Kontraktor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("pengawas@gmail.com", "password")}
                    className="px-2 py-1.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-lg text-center transition-colors cursor-pointer"
                  >
                    Pengawas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("wakil_ppk@gmail.com", "password")}
                    className="px-2 py-1.5 text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300 rounded-lg text-center transition-colors cursor-pointer"
                  >
                    Wakil PPK
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("admin_ppk@gmail.com", "password")}
                    className="px-2 py-1.5 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-lg text-center transition-colors cursor-pointer"
                  >
                    Admin PPK
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("ppk@gmail.com", "password")}
                    className="px-2 py-1.5 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 rounded-lg text-center transition-colors cursor-pointer"
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
