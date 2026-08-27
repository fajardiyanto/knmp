import React, { useState } from "react";
import { Menu, Maximize2, LogOut, User as UserIcon, Sun, Moon } from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { NotificationDropdown } from "./NotificationDropdown";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800/90 px-5 sm:px-6 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors duration-200">
      {/* Left section: Hamburger & Brand title on mobile */}
      <div className="flex items-center gap-3.5 sm:gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs transition-all cursor-pointer"
          aria-label="Toggle Sidebar"
          title="Buka/Tutup Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Small screen brand indicator */}
        <div className="lg:hidden flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">SIMANDOR</span>
        </div>
      </div>

      {/* Right section: Theme Toggle, Fullscreen, Notification, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 sm:p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          title={isDark ? "Ganti ke Mode Terang (Light Mode)" : "Ganti ke Mode Gelap (Dark Mode)"}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun className="w-4.5 h-4.5 text-amber-400 hover:rotate-90 transition-transform duration-300" />
          ) : (
            <Moon className="w-4.5 h-4.5 hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="hidden md:flex p-2 sm:p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Fullscreen"
        >
          <Maximize2 className="w-4.5 h-4.5" />
        </button>

        {/* Live Notification Dropdown */}
        <NotificationDropdown />

        {/* User Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 pl-2 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#0d6efd] text-white font-bold text-xs flex items-center justify-center shadow-xs overflow-hidden">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {user?.name || "Pengguna"}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                {user?.roles?.[0] || "User"}
              </div>
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="w-full px-3.5 py-2 text-left text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
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
                className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-medium cursor-pointer transition-colors"
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
