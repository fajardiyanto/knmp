import React, { useState } from "react";
import { Menu, Search, Bell, Maximize2, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/90 px-5 sm:px-6 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left section: Hamburger & Brand title on mobile */}
      <div className="flex items-center gap-3.5 sm:gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60 shadow-2xs transition-all cursor-pointer"
          aria-label="Toggle Sidebar"
          title="Buka/Tutup Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Small screen brand indicator */}
        <div className="lg:hidden flex items-center gap-2">
          <span className="font-bold text-slate-800 text-sm tracking-tight">SIMANDOR</span>
        </div>
      </div>

      {/* Right section: Fullscreen, Notification, Profile */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 pl-2 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#0d6efd] text-white font-bold text-xs flex items-center justify-center shadow-xs overflow-hidden">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || "Pengguna"}
              </div>
              <div className="text-[10px] text-slate-500 capitalize">
                {user?.roles?.[0] || "User"}
              </div>
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="w-full px-3.5 py-2 text-left text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Profil Akun</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  logout();
                }}
                className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
