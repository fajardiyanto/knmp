import React, { useState } from "react";
import { X, Search, User, Check } from "lucide-react";
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-slate-800">
              Chat Personal Baru
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Pilih rekan kerja atau tim untuk memulai percakapan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau email pengguna..."
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 focus:bg-white text-[13.5px] text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-normal placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 divide-y divide-slate-50">
          {isLoading ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Mencari pengguna...
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
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
                className="w-full p-3 flex items-center gap-3 hover:bg-blue-50/60 rounded-xl transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-slate-800 truncate group-hover:text-blue-600">
                    {u.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate font-normal">
                    {u.email} {u.role_name && `• ${u.role_name}`}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
