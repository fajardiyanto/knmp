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
  LogOut,
  FileText,
  MessageSquare,
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
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
  const { hasPermission, user, logout } = useAuth();
  const { data: unreadData } = useTotalUnreadCount();
  const unreadTotal = unreadData?.unread_count || 0;

  const isSuperOrAdmin = user?.roles?.some((r) => {
    const lower = r.toLowerCase();
    return lower.includes("super") || lower.includes("admin");
  });

  const groups: NavGroup[] = [
    {
      title: "UTAMA",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
        {
          name: "Chat",
          href: "/chat",
          icon: MessageSquare,
          show: true,
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
        { name: "PCM", href: "/pcm", icon: Users2, show: hasPermission("kontrak_read") },
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
        { name: "PHO", href: "/pho", icon: CheckCircle2, show: true },
        { name: "Pemeliharaan", href: "/pemeliharaan", icon: Wrench, show: true },
        { name: "FHO", href: "/fho", icon: ShieldCheck, show: true },
      ],
    },
    {
      title: "KEUANGAN",
      items: [
        { name: "Total Anggaran", href: "/pembayaran/summary", icon: DollarSign, show: true },
        { name: "Termin Pembayaran", href: "/pembayaran/termin", icon: CreditCard, show: true },
      ],
    },
    {
      title: "MODULE",
      items: [
        { name: "Absensi", href: "/absensi", icon: CalendarCheck, show: hasPermission("absensi_read") },
        { name: "Issue", href: "/issue", icon: AlertTriangle, show: hasPermission("issue_read") },
        { name: "Pemeliharaan", href: "/pemeliharaan", icon: Wrench, show: true },
      ],
    },
    {
      title: "USER",
      items: [
        { name: "Users", href: "/user", icon: Users, show: !!isSuperOrAdmin || hasPermission("user_read") },
        { name: "Periode", href: "/periode", icon: Calendar, show: !!isSuperOrAdmin || hasPermission("periode_read") },
        {
          name: "Jenis Bangunan",
          href: "/jenis-bangunan",
          icon: Building2,
          show: !!isSuperOrAdmin || hasPermission("jenis_bangunan_read"),
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "bg-white text-slate-700 min-h-screen flex flex-col justify-between border-r border-slate-200/90 shrink-0 sticky top-0 h-screen z-40 transition-all duration-300 ease-in-out overflow-y-auto select-none",
        isOpen
          ? "w-72 opacity-100 translate-x-0"
          : "w-0 -translate-x-full opacity-0 border-r-0 overflow-hidden pointer-events-none"
      )}
    >
      <div className="w-72">
        {/* Brand Logo Header aligned with Navbar h-16 */}
        <div className="h-16 px-6 flex items-center gap-3.5 border-b border-slate-200/90 bg-white/95 backdrop-blur-xs sticky top-0 z-10">
          <div className="relative group/logo cursor-pointer">
            <img
              src="/assets/img/simandor.png"
              alt="SIMANDOR"
              className="w-10 h-auto object-contain shrink-0 transition-transform duration-300 group-hover/logo:scale-105"
              onError={(e) => {
                e.currentTarget.src = "/assets/img/kkp-logo.png";
              }}
            />
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-base tracking-wider block leading-tight">
              SIMANDOR
            </span>
            <p className="text-[10.5px] text-slate-400 font-medium tracking-tight">
              SIMANDOR 360
            </p>
          </div>
        </div>

        {/* Navigation Menus */}
        <div className="p-4 space-y-4">
          {groups.map((group, gIdx) => {
            const visibleItems = group.items.filter((item) => item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {group.title && (
                  <div className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                    {group.title}
                  </div>
                )}
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.name + item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 ease-out group overflow-hidden",
                        isActive
                          ? "bg-[#eef4ff] text-[#3366ff] font-medium shadow-2xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#3366ff] before:rounded-r-full"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 hover:translate-x-1"
                      )
                    }
                  >
                    <item.icon
                      className={cn(
                        "w-[18px] h-[18px] shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:text-[#3366ff]"
                      )}
                    />
                    <span className="truncate flex-1 font-normal group-hover:font-medium transition-all duration-150">
                      {item.name}
                    </span>
                    {typeof item.badge === "number" && item.badge > 0 && (
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-blue-600 text-white rounded-full shrink-0 shadow-xs animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-100 w-72">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 hover:translate-x-1 transition-all duration-200 group cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0 text-slate-500 group-hover:text-red-600 group-hover:scale-110 transition-all duration-200" />
          <span className="font-normal group-hover:font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
