import React, { useState, useEffect } from "react";
import { X, Users, Share2, Check, Eye, Edit3 } from "lucide-react";
import type { Notulen, NotulenUser, ShareUserPayload } from "../types/notulen.types";
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
  // Mapping of userId -> access_type ('viewer' | 'editor')
  const [userAccessMap, setUserAccessMap] = useState<Record<number, "viewer" | "editor">>({});
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
          const map: Record<number, "viewer" | "editor"> = {};
          if (notulen.shared_users && notulen.shared_users.length > 0) {
            notulen.shared_users.forEach((u) => {
              map[u.user_id] = u.access_type || "viewer";
            });
          } else if (notulen.shared_user_ids) {
            notulen.shared_user_ids.forEach((uid) => {
              map[uid] = "viewer";
            });
          }
          setUserAccessMap(map);
        })
        .finally(() => setLoading(false));
      setSearch("");
      setMsg("");
    }
  }, [isOpen, notulen]);

  if (!isOpen || !notulen) return null;

  const selectedUserIds = Object.keys(userAccessMap).map(Number);

  const toggleUserSelection = (userId: number) => {
    setUserAccessMap((prev) => {
      const next = { ...prev };
      if (next[userId]) {
        delete next[userId];
      } else {
        next[userId] = "viewer"; // Default to viewer
      }
      return next;
    });
  };

  const setUserAccessType = (userId: number, accessType: "viewer" | "editor", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUserAccessMap((prev) => ({
      ...prev,
      [userId]: accessType,
    }));
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
      const sharedPayload: ShareUserPayload[] = Object.entries(userAccessMap).map(([uidStr, access]) => ({
        user_id: Number(uidStr),
        access_type: access,
      }));

      await shareNotulen(notulen.id, sharedPayload);
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600/30 rounded-xl">
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

          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 p-1.5">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Memuat pengguna...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Tidak ada pengguna yang cocok</div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = Boolean(userAccessMap[u.id]);
                const accessType = userAccessMap[u.id] || "viewer";

                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUserSelection(u.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors space-y-2 ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/60 dark:border-blue-800/60"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 truncate flex-1">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase shrink-0">
                        {u.role_name || "User"}
                      </span>
                    </div>

                    {/* Role Selector: Read Only vs Bisa Edit */}
                    {isSelected && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-end space-x-2 pt-1 border-t border-blue-100 dark:border-blue-900/50"
                      >
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          Hak Akses:
                        </span>
                        <button
                          type="button"
                          onClick={(e) => setUserAccessType(u.id, "viewer", e)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all ${
                            accessType === "viewer"
                              ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs ring-1 ring-slate-400/40"
                              : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>Read Only</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => setUserAccessType(u.id, "editor", e)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all ${
                            accessType === "editor"
                              ? "bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-500"
                              : "text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Bisa Edit</span>
                        </button>
                      </div>
                    )}
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
