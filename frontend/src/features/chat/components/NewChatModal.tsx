import React, { useState } from "react";
import { X, Search, MessageSquarePlus, User } from "lucide-react";
import { useSearchUsers } from "../api";
import { UserSummary } from "../types";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: number) => void;
  isCreating?: boolean;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  isCreating,
}) => {
  const [query, setQuery] = useState("");
  const { data: usersData, isLoading } = useSearchUsers(query);

  if (!isOpen) return null;

  const users = usersData || [];

  const getInitials = (userName: string) => {
    if (!userName) return "U";
    const parts = userName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userName.slice(0, 2).toUpperCase();
  };

  const getRoleColor = (roleName?: string) => {
    const r = (roleName || "").toLowerCase();
    if (r.includes("superadmin") || r.includes("super_admin") || r.includes("admin")) {
      return "bg-purple-50 text-purple-700 border-purple-200/80";
    }
    if (r.includes("pengawas") || r.includes("ppk")) {
      return "bg-blue-50 text-blue-700 border-blue-200/80";
    }
    if (r.includes("kontraktor")) {
      return "bg-amber-50 text-amber-700 border-amber-200/80";
    }
    return "bg-slate-100 text-slate-600 border-slate-200/80";
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0d6efd] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15.5px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Chat Personal Baru
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                Pilih rekan kerja untuk memulai percakapan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, email, atau peran..."
              autoFocus
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-[13.5px] text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] transition-all font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800 flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-[#0d6efd] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Mencari pengguna...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {query.length > 0
                ? "Pengguna tidak ditemukan."
                : "Belum ada daftar pengguna terdaftar."}
            </div>
          ) : (
            users.map((u: UserSummary) => (
              <button
                key={u.id}
                type="button"
                disabled={isCreating}
                onClick={() => onSelectUser(u.id)}
                className="w-full p-3 flex items-center gap-3 hover:bg-blue-50/70 dark:hover:bg-slate-800/80 rounded-2xl transition-all text-left cursor-pointer group border border-transparent hover:border-blue-100 dark:hover:border-slate-700"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  {getInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0d6efd] dark:group-hover:text-blue-400 transition-colors leading-tight">
                    {u.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">
                      {u.email}
                    </span>
                    {u.role_name && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border uppercase tracking-wider ${getRoleColor(
                          u.role_name
                        )}`}
                      >
                        {u.role_name}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
