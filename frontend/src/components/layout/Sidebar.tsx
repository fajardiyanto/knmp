import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  HardHat,
  CalendarCheck,
  AlertTriangle,
  CreditCard,
  Users,
  Compass,
  FileSignature,
  Users2,
  Truck,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  DollarSign,
  Calendar,
  Building2,
  Building,
  LogOut,
  FileText,
  FileSearch,
  MessageSquare,
  ClipboardList,
  X,
} from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useTotalUnreadCount } from "../../features/chat/api";
import { cn } from "../../lib/utils";

interface NavGroup {
  title?: string;
  items: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    show: boolean;
    badge?: number;
  }[];
}

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onToggle,
  onCloseMobile,
}) => {
  const { hasPermission, user, logout } = useAuth();
  const { data: unreadData } = useTotalUnreadCount();
  const unreadTotal = unreadData?.unread_count || 0;

  const groups: NavGroup[] = [
    {
      title: "UTAMA",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: hasPermission("dashboard") },
        {
          name: "Chat",
          href: "/chat",
          icon: MessageSquare,
          show: hasPermission("chat"),
          badge: unreadTotal,
        },
        { name: "Lokasi KNMP", href: "/knmp", icon: MapPin, show: hasPermission("knmp_read") },
      ],
    },
    {
      title: "PROGRAM",
      items: [
        {
          name: "Contract Readiness",
          href: "/persiapan_kontrak",
          icon: FileSignature,
          show: hasPermission("kontrak_read"),
        },
        { name: "PCM", href: "/pcm", icon: Users2, show: hasPermission("pcm_read") || hasPermission("kontrak_read") },
        {
          name: "Mobilization Report",
          href: "/persiapan_lapangan",
          icon: Truck,
          show: hasPermission("lapangan_read"),
        },
        {
          name: "Pelaksanaan Konstruksi",
          href: "/pelaksanaan",
          icon: HardHat,
          show: hasPermission("pelaksanaan_read"),
        },
        { name: "Laporan", href: "/laporan", icon: FileText, show: hasPermission("laporan_read") },
        { name: "Notulensi Rapat", href: "/notulen", icon: ClipboardList, show: hasPermission("notulen_read") },
        { name: "PHO", href: "/pho", icon: CheckCircle2, show: hasPermission("pho_read") },
        { name: "Pemeliharaan", href: "/pemeliharaan", icon: Wrench, show: hasPermission("pemeliharaan_read") },
        { name: "FHO", href: "/fho", icon: ShieldCheck, show: hasPermission("fho_read") },
      ],
    },
    {
      title: "KEUANGAN",
      items: [
        {
          name: "Total Anggaran",
          href: "/pembayaran/summary",
          icon: DollarSign,
          show: hasPermission("anggaran_read") || hasPermission("pembayaran_read"),
        },
        {
          name: "Termin Pembayaran",
          href: "/pembayaran/termin",
          icon: CreditCard,
          show: hasPermission("termin_read") || hasPermission("pembayaran_read"),
        },
      ],
    },
    {
      title: "MODULE",
      items: [
        { name: "Absensi", href: "/absensi", icon: CalendarCheck, show: hasPermission("absensi_read") },
        { name: "Issue", href: "/issue", icon: AlertTriangle, show: hasPermission("issue_read") },
        { name: "AI Scan", href: "/ai-analysis", icon: FileSearch, show: hasPermission("ai_analysis_read") },
      ],
    },
    {
      title: "USER",
      items: [
        { name: "Users", href: "/user", icon: Users, show: hasPermission("user_read") },
        {
          name: "Daftar Perusahaan",
          href: "/perusahaan",
          icon: Building2,
          show: hasPermission("user_read"),
        },
        { name: "Periode", href: "/periode", icon: Calendar, show: hasPermission("periode_read") },
        {
          name: "Jenis Bangunan",
          href: "/jenis-bangunan",
          icon: Building,
          show: hasPermission("jenis_bangunan_read"),
        },
      ],
    },
  ];

  React.useEffect(() => {
    if (isOpen && typeof window !== "undefined" && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleNavClick = () => {
    if (window.innerWidth < 1024 && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* 1. Mobile & iPad Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* 2. Sidebar Element: 100% Fixed height, completely hidden on mobile when closed */}
      <aside
        className={cn(
          "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col justify-between border-r border-slate-200/90 dark:border-slate-800/90 shrink-0 select-none transition-colors duration-200",
          "h-screen h-[100dvh] max-h-screen",
          // Mobile (< lg): Hidden completely when closed. Full drawer when open.
          isOpen
            ? "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl flex translate-x-0 lg:static lg:z-30 lg:shadow-none lg:w-64"
            : "hidden lg:flex lg:static lg:z-30 lg:w-[72px] lg:translate-x-0",
          "transition-[width,transform] duration-300 ease-in-out"
        )}
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Brand Logo Header aligned with Navbar h-16 */}
          <div
            className={cn(
              "h-16 border-b border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-between shrink-0 transition-all duration-300 px-4",
              !isOpen && "lg:justify-center lg:px-0"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="relative group/logo cursor-pointer shrink-0">
                <img
                  src="/assets/img/simandor.png"
                  alt="SIMANDOR"
                  className={cn(
                    "object-contain transition-all duration-300 group-hover/logo:scale-105",
                    isOpen ? "w-9 h-auto" : "w-8 h-auto"
                  )}
                  onError={(e) => {
                    e.currentTarget.src = "/assets/img/kkp-logo.png";
                  }}
                />
              </div>
              {(isOpen || window.innerWidth < 1024) && (
                <div className="overflow-hidden whitespace-nowrap">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-[14.5px] tracking-wide block leading-tight">
                    SIMANDOR
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">
                    SIMANDOR 360
                  </p>
                </div>
              )}
            </div>

            {/* Mobile close button (visible only on mobile/iPad) */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Navigation Menus List */}
        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300",
            isOpen ? "p-3.5 space-y-4" : "py-3 px-2 space-y-2"
          )}
        >
          {groups.map((group, gIdx) => {
            const visibleItems = group.items.filter((item) => item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {/* Group Title or Separator */}
                {isOpen ? (
                  group.title && (
                    <div className="px-3 pt-2 pb-1 text-[10.5px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                      {group.title}
                    </div>
                  )
                ) : (
                  gIdx > 0 && <div className="my-2.5 mx-auto w-6 border-t border-slate-200/80 dark:border-slate-800" />
                )}

                {/* Group Items */}
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.name + item.href}
                    to={item.href}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center rounded-xl text-[13.5px] font-medium transition-all duration-200 ease-out group",
                        isOpen
                          ? "gap-3 px-3 py-2.5"
                          : "justify-center w-11 h-11 mx-auto",
                        isActive
                          ? "bg-[#eef4ff] dark:bg-blue-950/60 text-[#3366ff] dark:text-blue-400 font-semibold shadow-2xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#3366ff] before:rounded-r-full"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                      )
                    }
                  >
                    <item.icon
                      className={cn(
                        "shrink-0 transition-all duration-200 group-hover:scale-110",
                        isOpen ? "w-[18px] h-[18px]" : "w-5 h-5",
                        "group-hover:text-[#3366ff] dark:group-hover:text-blue-400"
                      )}
                    />

                    {isOpen ? (
                      <>
                        <span className="truncate flex-1 font-normal group-hover:font-medium transition-all duration-150">
                          {item.name}
                        </span>
                        {typeof item.badge === "number" && item.badge > 0 && (
                          <span className="px-2 py-0.5 text-[11px] font-medium bg-blue-600 text-white rounded-full shrink-0 shadow-xs animate-pulse">
                            {item.badge}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Dot indicator for badges in collapsed mode */}
                        {typeof item.badge === "number" && item.badge > 0 && (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
                        )}

                        {/* Floating Tooltip in collapsed mode */}
                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 flex items-center gap-2 border border-slate-700">
                          <span>{item.name}</span>
                          {typeof item.badge === "number" && item.badge > 0 && (
                            <span className="px-1.5 py-0.2 text-[10px] bg-blue-500 rounded-full font-bold">
                              {item.badge}
                            </span>
                          )}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-800" />
                        </div>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Logout & Collapse Toggle */}
      <div
        className={cn(
          "border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 transition-all duration-300",
          isOpen ? "p-3 space-y-2" : "p-2 space-y-2 flex flex-col items-center"
        )}
      >
        <button
          type="button"
          onClick={logout}
          className={cn(
            "flex items-center rounded-xl text-[13.5px] font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200 group cursor-pointer relative",
            isOpen ? "w-full gap-3 px-3 py-2.5" : "justify-center w-11 h-11"
          )}
          title={!isOpen ? "Logout" : undefined}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0 text-slate-500 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:scale-110 transition-all duration-200" />
          {isOpen ? (
            <span className="font-normal group-hover:font-medium">Logout</span>
          ) : (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-slate-700">
              Logout
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-800" />
            </div>
          )}
        </button>
      </div>
    </aside>
    </>
  );
};
