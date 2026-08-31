import React, { useState, useEffect } from "react";
import { X, Users, Share2, Check } from "lucide-react";
import type { Notulen, NotulenUser } from "../types/notulen.types";
import { fetchUsersForShare, shareNotulen } from "../api";

interface NotulenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  notulen: Notulen | null;
  onSuccess: () => void;
}

export const NotulenShareModal: React.FC<NotulenShareModalProps> = ({
  isOpen,
  onClose,
  notulen,
  onSuccess,
}) => {
  const [availableUsers, setAvailableUsers] = useState<NotulenUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (isOpen && notulen) {
      setLoading(true);
      fetchUsersForShare()
        .then((users) => {
          setAvailableUsers(users || []);
          setSelectedUserIds(notulen.shared_user_ids || []);
        })
        .finally(() => setLoading(false));
      setSearch("");
      setMsg("");
    }
  }, [isOpen, notulen]);

  if (!isOpen || !notulen) return null;

  const toggleUserSelection = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.role_name && u.role_name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      await shareNotulen(notulen.id, selectedUserIds);
      onSuccess();
      onClose();
    } catch (err: any) {
      setMsg(err?.message || "Gagal membagikan notulen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600/30 rounded-lg">
              <Share2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Bagikan Notulen Rapat</h3>
              <p className="text-xs text-slate-400 line-clamp-1">{notulen.judul}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {msg && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-xl">
              {msg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cari Pengguna
            </label>
            <input
              type="text"
              placeholder="Ketik nama, email, atau peran pengguna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Daftar Pengguna ({filteredUsers.length})</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{selectedUserIds.length} Dipilih</span>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Memuat pengguna...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Tidak ada pengguna yang cocok</div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUserSelection(u.id)}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                      {u.role_name || "User"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Hak Akses"}
          </button>
        </div>
      </div>
    </div>
  );
};
