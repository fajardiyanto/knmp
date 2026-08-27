import React, { useState } from "react";
import { X, Search, Users, Check, UserCheck, Shield } from "lucide-react";
import { useSearchUsers } from "../api";
import { UserSummary } from "../types";

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, description: string, memberIds: number[]) => void;
  isCreating?: boolean;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  isCreating,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: usersData, isLoading } = useSearchUsers(query);
  const users = usersData || [];

  if (!isOpen) return null;

  const toggleSelect = (userId: number) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (!name.trim() || selectedIds.length === 0 || isCreating) return;
    onCreateGroup(name.trim(), description.trim(), selectedIds);
  };

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

  const selectedUsers = users.filter((u) => selectedIds.includes(u.id));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0d6efd] flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15.5px] font-bold text-slate-900 leading-tight">
                Buat Grup Diskusi Baru
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Kelompokkan koordinasi tim lapangan, pengawas, atau manajemen
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Group Name Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Nama Grup <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Tim Pengawas KNMP Asahan"
              className="w-full px-3.5 py-2.5 bg-slate-50/70 focus:bg-white text-[13.5px] text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] transition-all font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Deskripsi (Opsional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tujuan atau cakupan diskusi grup..."
              className="w-full px-3.5 py-2.5 bg-slate-50/70 focus:bg-white text-[13.5px] text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] transition-all font-normal placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Selected Members Chips */}
          {selectedIds.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Anggota Terpilih ({selectedIds.length})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer"
                >
                  Reset Pilihan
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50/50 border border-blue-100/80 rounded-xl max-h-24 overflow-y-auto">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-slate-800 border border-blue-200 text-xs font-medium shadow-2xs"
                  >
                    <span>{u.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleSelect(u.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Member Selection Search */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Pilih Anggota Peserta
            </label>

            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama, email, atau peran..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50/70 focus:bg-white text-[13px] text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] transition-all font-normal placeholder:text-slate-400"
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

            {/* Selection list */}
            <div className="max-h-52 overflow-y-auto border border-slate-200/80 rounded-2xl p-1.5 divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  <div className="w-5 h-5 border-2 border-[#0d6efd] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Mencari pengguna...
                </div>
              ) : users.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  {query.length > 0
                    ? "Pengguna tidak ditemukan."
                    : "Belum ada daftar pengguna terdaftar."}
                </div>
              ) : (
                users.map((u: UserSummary) => {
                  const isSelected = selectedIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleSelect(u.id)}
                      className={`w-full p-2.5 sm:p-3 flex items-center justify-between rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/90 text-blue-900 border border-blue-200 shadow-2xs"
                          : "hover:bg-slate-50 text-slate-700 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {/* Avatar */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                            isSelected
                              ? "bg-[#0d6efd] text-white"
                              : "bg-slate-100 text-slate-700 border border-slate-200/80"
                          }`}
                        >
                          {getInitials(u.name)}
                        </div>

                        {/* Name & details */}
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-bold text-slate-800 truncate leading-tight">
                            {u.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[11.5px] text-slate-400 font-mono truncate">
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
                      </div>

                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                          isSelected
                            ? "bg-[#0d6efd] border-[#0d6efd] text-white shadow-2xs"
                            : "border-slate-300 bg-white hover:border-slate-400"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            {selectedIds.length} anggota dipilih
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[13px] font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim() || selectedIds.length === 0 || isCreating}
              className={`px-5 py-2.5 text-[13px] font-bold rounded-xl transition-all flex items-center gap-2 ${
                name.trim() && selectedIds.length > 0 && !isCreating
                  ? "bg-[#0d6efd] hover:bg-[#0b5ed7] text-white shadow-sm hover:shadow cursor-pointer active:scale-98"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{isCreating ? "Membuat..." : "Buat Grup"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
