import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, MapPin, User, Users, FileText, CheckSquare, Plus, Trash2 } from "lucide-react";
import type { Notulen, NotulenFormData, NotulenUser } from "../types/meeting-minutes.types";
import { fetchUsersForShare } from "../api";

interface NotulenFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NotulenFormData) => Promise<void>;
  initialData?: Notulen | null;
  knmpList?: Array<{ id: number; name: string }>;
}

export const NotulenFormModal: React.FC<NotulenFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  knmpList = [],
}) => {
  const [judul, setJudul] = useState("");
  const [knmpId, setKnmpId] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [waktuMulai, setWaktuMulai] = useState("09:00");
  const [waktuSelesai, setWaktuSelesai] = useState("11:30");
  const [lokasi, setLokasi] = useState("");
  const [pimpinanRapat, setPimpinanRapat] = useState("");
  const [notulis, setNotulis] = useState("Super Admin");
  const [agenda, setAgenda] = useState("");
  const [hasilPembahasan, setHasilPembahasan] = useState("");
  const [tindakLanjut, setTindakLanjut] = useState("");
  const [status, setStatus] = useState("published");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [availableUsers, setAvailableUsers] = useState<NotulenUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchUsersForShare()
        .then((users) => setAvailableUsers(users || []))
        .catch(() => setAvailableUsers([]));

      if (initialData) {
        setJudul(initialData.judul || "");
        setKnmpId(initialData.knmp_id || null);
        setTanggal(initialData.tanggal ? initialData.tanggal.split("T")[0] : new Date().toISOString().split("T")[0]);
        setWaktuMulai(initialData.waktu_mulai || "09:00");
        setWaktuSelesai(initialData.waktu_selesai || "11:30");
        setLokasi(initialData.lokasi || "");
        setPimpinanRapat(initialData.pimpinan_rapat || "");
        setNotulis(initialData.notulis || "Super Admin");
        setAgenda(initialData.agenda || "");
        setHasilPembahasan(initialData.hasil_pembahasan || "");
        setTindakLanjut(initialData.tindak_lanjut || "");
        setStatus(initialData.status || "published");
        setSelectedUserIds(initialData.shared_user_ids || []);
      } else {
        setJudul("");
        setKnmpId(null);
        setTanggal(new Date().toISOString().split("T")[0]);
        setWaktuMulai("09:00");
        setWaktuSelesai("11:30");
        setLokasi("Ruang Rapat Utama / Daring (Zoom)");
        setPimpinanRapat("PPK KNMP Pertamina");
        setNotulis("Super Admin");
        setAgenda("");
        setHasilPembahasan("");
        setTindakLanjut("");
        setStatus("published");
        setSelectedUserIds([]);
      }
      setErrorMsg("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const toggleUserSelection = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === availableUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(availableUsers.map((u) => u.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      setErrorMsg("Judul / Topik Rapat wajib diisi");
      return;
    }
    if (!tanggal) {
      setErrorMsg("Tanggal rapat wajib diisi");
      return;
    }
    if (!hasilPembahasan.trim()) {
      setErrorMsg("Poin pembahasan / hasil rapat wajib diisi");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await onSubmit({
        knmp_id: knmpId,
        judul: judul.trim(),
        tanggal,
        waktu_mulai: waktuMulai,
        waktu_selesai: waktuSelesai,
        lokasi: lokasi.trim(),
        pimpinan_rapat: pimpinanRapat.trim(),
        notulis: notulis.trim() || "Super Admin",
        agenda: agenda.trim(),
        hasil_pembahasan: hasilPembahasan.trim(),
        tindak_lanjut: tindakLanjut.trim(),
        status,
        shared_user_ids: selectedUserIds,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal menyimpan notulen rapat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileText className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {initialData ? "Edit Notulen Rapat" : "Buat Notulen Rapat Baru"}
              </h3>
              <p className="text-xs text-blue-200">
                Pencatatan Berita Acara & Hasil Rapat Koordinasi KNMP Pertamina
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Informasi Pokok Rapat */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Informasi Pokok Rapat
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul / Topik Rapat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Koordinasi Evaluasi Mingguan Progres Titik Nelayan Aceh"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Titik Lokasi KNMP Terkait (Opsional)
                </label>
                <select
                  value={knmpId || ""}
                  onChange={(e) => setKnmpId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="">-- Koordinasi Umum Seluruh Sumatera --</option>
                  {knmpList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Rapat <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Waktu Mulai & Selesai
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={waktuMulai}
                    onChange={(e) => setWaktuMulai(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                  <span className="text-slate-400 font-medium">-</span>
                  <input
                    type="time"
                    value={waktuSelesai}
                    onChange={(e) => setWaktuSelesai(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tempat / Lokasi / Tautan Meeting
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ruang Rapat Lt. 4 / Zoom ID: 882-991-002"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pimpinan Rapat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PPK KNMP Pertamina / Site Manager"
                  value={pimpinanRapat}
                  onChange={(e) => setPimpinanRapat(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notulis (Default: Super Admin)
                </label>
                <input
                  type="text"
                  value={notulis}
                  onChange={(e) => setNotulis(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-blue-700 dark:text-blue-300"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Agenda, Pembahasan & Action Items */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Agenda, Pembahasan & Tindak Lanjut
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Agenda Pembahasan
              </label>
              <textarea
                rows={2}
                placeholder="Tuliskan daftar agenda rapat..."
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Poin Pembahasan & Hasil Meeting <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                placeholder="Rangkum seluruh poin diskusi, kendala, dan kesepakatan yang dicapai dalam rapat..."
                value={hasilPembahasan}
                onChange={(e) => setHasilPembahasan(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rencana Tindak Lanjut (Action Items & PIC)
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: 1. Kontraktor mengirimkan revisi schedule (PIC: Site Engineer, Batas: 2 Sept)&#10;2. Pengawas melakukan inspeksi mutu beton (PIC: Pengawas)"
                value={tindakLanjut}
                onChange={(e) => setTindakLanjut(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
          </div>

          {/* Section 3: Bagikan Notulen ke Pengguna (Multi-User Sharing) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Bagikan Notulen ke Pengguna ({selectedUserIds.length} Dipilih)
              </h4>
              <button
                type="button"
                onClick={handleSelectAllUsers}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {selectedUserIds.length === availableUsers.length ? "Batal Pilih Semua" : "Pilih Semua Pengguna"}
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pengguna yang dipilih akan dapat membaca notulen ini di akun mereka masing-masing.
            </p>

            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {availableUsers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Memuat daftar pengguna...</p>
              ) : (
                availableUsers.map((u) => {
                  const isChecked = selectedUserIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleUserSelection(u.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-xs">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {u.role_name || "User"}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : initialData ? "Perbarui Notulen" : "Simpan & Publikasikan"}
          </button>
        </div>
      </div>
    </div>
  );
};
