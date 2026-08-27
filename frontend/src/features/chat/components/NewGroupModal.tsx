import React, { useState } from "react";
import { X, Search, Users2, Check } from "lucide-react";
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-medium text-slate-800">
              Buat Grup Diskusi Baru
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Kelompokkan koordinasi tim lapangan, pengawas, atau manajemen
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

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Group Name Input */}
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Nama Grup <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Tim Pengawas KNMP Asahan"
              className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-[13.5px] text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-normal placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Deskripsi (Opsional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tujuan atau cakupan diskusi grup..."
              className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white text-[13.5px] text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-normal placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Member Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-medium text-slate-700">
                Pilih Anggota Peserta ({selectedIds.length} dipilih)
              </label>
            </div>

            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari anggota..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white text-[13px] text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-normal placeholder:text-slate-400"
              />
            </div>

            {/* Selection list */}
            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-1 divide-y divide-slate-50 bg-slate-50/50">
              {isLoading ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Mencari...
                </div>
              ) : users.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  {query.length > 0
                    ? "Pengguna tidak ditemukan."
                    : "Ketik untuk mencari pengguna yang akan ditambahkan."}
                </div>
              ) : (
                users.map((u: UserSummary) => {
                  const isSelected = selectedIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleSelect(u.id)}
                      className={`w-full p-2.5 flex items-center justify-between rounded-lg text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 text-emerald-900 font-medium"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-[13.5px] font-medium truncate">
                          {u.name}
                        </p>
                        <p className="text-[11.5px] text-slate-400 truncate font-normal">
                          {u.email} {u.role_name && `• ${u.role_name}`}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                          isSelected
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || selectedIds.length === 0 || isCreating}
            className={`px-5 py-2 text-[13px] font-medium rounded-xl text-white transition-all cursor-pointer ${
              name.trim() && selectedIds.length > 0 && !isCreating
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                : "bg-slate-300 text-slate-100 cursor-not-allowed"
            }`}
          >
            {isCreating ? "Membuat..." : "Buat Grup"}
          </button>
        </div>
      </div>
    </div>
  );
};
