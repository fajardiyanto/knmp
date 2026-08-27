import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Trash2,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  X,
} from "lucide-react";
import { apiFetch } from "../../lib/api-client";

export interface NotificationItem {
  id: number;
  user_id?: number;
  role_target?: string;
  title: string;
  message: string;
  category: "chat" | "laporan" | "verifikasi" | "issue" | "system" | string;
  type: "info" | "success" | "warning" | "primary" | string;
  link?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

interface NotificationListResponse {
  notifications: NotificationItem[];
  unread_count: number;
}

export const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Notifications with 15s auto-refresh
  const { data } = useQuery<NotificationListResponse>({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<NotificationListResponse>("/api/v1/notifications?limit=25"),
    refetchInterval: 15000,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  // 2. Mark Single as Read
  const markReadMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/notifications/${id}/read`, { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // 3. Mark All as Read
  const markAllReadMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/v1/notifications/read-all", { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // 4. Delete Notification
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/notifications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item: NotificationItem) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const getCategoryConfig = (category: string, type: string) => {
    switch (category) {
      case "chat":
        return {
          icon: MessageSquare,
          bg: "bg-blue-50 text-blue-600 border-blue-100",
          badge: "bg-blue-100 text-blue-700",
          label: "Pesan Chat",
        };
      case "laporan":
        return {
          icon: FileText,
          bg: "bg-indigo-50 text-indigo-600 border-indigo-100",
          badge: "bg-indigo-100 text-indigo-700",
          label: "Laporan",
        };
      case "verifikasi":
        return {
          icon: CheckCircle2,
          bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
          badge: "bg-emerald-100 text-emerald-700",
          label: "Verifikasi ACC",
        };
      case "issue":
        return {
          icon: AlertTriangle,
          bg: "bg-amber-50 text-amber-600 border-amber-100",
          badge: "bg-amber-100 text-amber-700",
          label: "Kendala",
        };
      default:
        return {
          icon: Info,
          bg: "bg-slate-50 text-slate-600 border-slate-100",
          badge: "bg-slate-100 text-slate-700",
          label: "Sistem",
        };
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60) return "Baru saja";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
      if (diffSec < 172800) return "Kemarin";
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "-";
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") return !item.is_read;
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative cursor-pointer"
        title="Notifikasi"
        aria-label="Notifikasi"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white" />
          </span>
        )}
      </button>

      {/* Floating Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 sm:right-0 mt-2.5 w-[330px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-[14.5px]">Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-500 text-white rounded-full">
                  {unreadCount} Baru
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-[11.5px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Tandai semua telah dibaca"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tandai Semua</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 bg-white text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === "all"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === "unread"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {/* Notification Items List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-[380px]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Tidak ada notifikasi</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {filter === "unread"
                    ? "Semua notifikasi sudah Anda baca."
                    : "Belum ada notifikasi baru saat ini."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const config = getCategoryConfig(item.category, item.type);
                const Icon = config.icon;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 flex items-start gap-3 transition-colors relative group cursor-pointer ${
                      item.is_read ? "bg-white hover:bg-slate-50/80" : "bg-blue-50/40 hover:bg-blue-50/70"
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${config.bg}`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${config.badge}`}
                        >
                          {config.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>

                      <h4 className="text-[13px] font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      {item.link && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11.5px] text-blue-600 font-medium">
                          <span>Buka halaman</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Unread indicator dot */}
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                    )}

                    {/* Delete item button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-md transition-all absolute right-2 top-2"
                      title="Hapus notifikasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[11.5px] text-slate-500 font-medium">
                Menampilkan {filteredNotifications.length} notifikasi terbaru
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
