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
    if (r.includes("superadmin") || r.includes("admin")) {
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
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0d6efd] flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15.5px] font-bold text-slate-900 leading-tight">
                Chat Personal Baru
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Pilih rekan kerja untuk memulai percakapan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, email, atau peran..."
              autoFocus
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 focus:bg-white text-[13.5px] text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] transition-all font-normal placeholder:text-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 divide-y divide-slate-100 flex-1">
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
                className="w-full p-3 flex items-center gap-3 hover:bg-blue-50/70 rounded-2xl transition-all text-left cursor-pointer group border border-transparent hover:border-blue-100"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  {getInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-800 truncate group-hover:text-[#0d6efd] transition-colors leading-tight">
                    {u.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-400 font-mono truncate">
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
        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
