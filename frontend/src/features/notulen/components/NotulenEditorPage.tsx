import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  FileText,
  Building,
  Save,
  Send,
  Sparkles,
  Check,
  Search,
  Eye,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";
import type { Notulen, NotulenFormData, NotulenUser } from "../types/notulen.types";
import { fetchNotulenDetail, createNotulen, updateNotulen, fetchUsersForShare } from "../api";
import { fetchKnmpList } from "../../knmp/api";
import { RichTextEditor } from "./RichTextEditor";

export const NotulenEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const { user, hasRole } = useAuth();
  const isSuperAdmin =
    hasRole("superadmin") ||
    hasRole("super admin") ||
    user?.roles?.some((r) => r.toLowerCase().includes("super"));
  const isAdminPPK =
    hasRole("admin_ppk") ||
    hasRole("admin") ||
    user?.roles?.some((r) => r.toLowerCase().includes("admin") || r.toLowerCase().includes("ppk"));
  const canManage = isSuperAdmin || isAdminPPK;

  const [judul, setJudul] = useState("");
  const [knmpId, setKnmpId] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [waktuMulai, setWaktuMulai] = useState("09:00");
  const [waktuSelesai, setWaktuSelesai] = useState("11:30");
  const [lokasi, setLokasi] = useState("Ruang Rapat Utama / Daring (Zoom)");
  const [pimpinanRapat, setPimpinanRapat] = useState("PPK KNMP Pertamina");
  const [notulis, setNotulis] = useState("Super Admin");
  const [agenda, setAgenda] = useState("");
  const [hasilPembahasan, setHasilPembahasan] = useState("");
  const [tindakLanjut, setTindakLanjut] = useState("");
  const [status, setStatus] = useState("published");

  const [availableUsers, setAvailableUsers] = useState<NotulenUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [knmpList, setKnmpList] = useState<Array<{ id: number; name: string }>>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Fetch users for sharing
    fetchUsersForShare()
      .then((users) => setAvailableUsers(users || []))
      .catch(() => setAvailableUsers([]));

    // Fetch KNMP points
    fetchKnmpList()
      .then((res: any) => {
        if (Array.isArray(res)) {
          setKnmpList(res);
        } else if (res && Array.isArray(res.data)) {
          setKnmpList(res.data);
        }
      })
      .catch(() => {});

    // If edit mode, load existing data
    if (isEditMode && id) {
      setLoading(true);
      fetchNotulenDetail(Number(id))
        .then((data) => {
          setJudul(data.judul || "");
          setKnmpId(data.knmp_id || null);
          setTanggal(data.tanggal ? data.tanggal.split("T")[0] : new Date().toISOString().split("T")[0]);
          setWaktuMulai(data.waktu_mulai || "09:00");
          setWaktuSelesai(data.waktu_selesai || "11:30");
          setLokasi(data.lokasi || "");
          setPimpinanRapat(data.pimpinan_rapat || "");
          setNotulis(data.notulis || "Super Admin");
          setAgenda(data.agenda || "");
          setHasilPembahasan(data.hasil_pembahasan || "");
          setTindakLanjut(data.tindak_lanjut || "");
          setStatus(data.status || "published");
          setSelectedUserIds(data.shared_user_ids || []);
        })
        .catch((err: any) => {
          setErrorMsg(err?.message || "Gagal memuat detail notulen");
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

  const toggleUserSelection = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((uid) => uid !== userId));
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

  const handleSave = async (publishStatus: "published" | "draft" = "published") => {
    if (!judul.trim()) {
      setErrorMsg("Judul / Topik Notulen Rapat wajib diisi");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!tanggal) {
      setErrorMsg("Tanggal rapat wajib diisi");
      return;
    }
    if (!hasilPembahasan.trim()) {
      setErrorMsg("Poin pembahasan / isi hasil rapat wajib diisi");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const payload: NotulenFormData = {
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
      status: publishStatus,
      shared_user_ids: selectedUserIds,
    };

    try {
      if (isEditMode && id) {
        await updateNotulen(Number(id), payload);
        navigate(`/notulen/${id}`);
      } else {
        const created = await createNotulen(payload);
        navigate(`/notulen/${created.id}`);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal menyimpan notulen rapat");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.role_name && u.role_name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  if (!canManage) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm max-w-lg mx-auto my-12 shadow-sm space-y-3">
        <div className="font-bold text-base">Akses Ditolak (403 Forbidden)</div>
        <p className="text-slate-600 dark:text-slate-400 text-xs">
          Hanya Super Admin dan Admin PPK yang memiliki hak akses untuk membuat atau mengedit notulen rapat.
        </p>
        <Link
          to="/notulen"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all inline-block"
        >
          Kembali ke Daftar Notulen
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-xs font-medium">Memuat editor notulen rapat...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Top Confluence Command Bar */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Link
            to="/notulen"
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Kembali ke Daftar Notulen"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="truncate">
            <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Notulen Rapat</span>
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold truncate">
                {isEditMode ? "Edit Notulen" : "Dokumen Baru"}
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {judul || "Notulensi Tanpa Judul"}
            </h2>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Draf</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={saving}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{saving ? "Menyimpan..." : "Publikasikan Dokumen"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Two-Column Confluence Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Main Rich Text Document Canvas */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Header Document Cover / Badge */}
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-blue-900 text-white font-black text-[10px] rounded-lg tracking-wider uppercase">
                PERTAMINA
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                NOTULENSI RAPAT KOORDINASI RESMI
              </span>
            </div>

            {/* Document Title Input */}
            <div>
              <input
                type="text"
                required
                placeholder="Judul / Topik Notulen Rapat..."
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                className="w-full bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none pb-2 transition-colors"
              />
            </div>

            {/* Meeting Agenda */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                I. Agenda Pembahasan
              </label>
              <textarea
                rows={2}
                placeholder="Tuliskan daftar agenda rapat koordinasi..."
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            {/* Rich Text Editor: Poin Pembahasan & Hasil Rapat */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>II. Poin Pembahasan & Hasil Meeting (Rich Text Editor)</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">Dukungan Tabel, Callouts, Heading, & List</span>
              </div>
              <RichTextEditor
                value={hasilPembahasan}
                onChange={setHasilPembahasan}
                placeholder="Rangkum seluruh poin pembahasan, paparan kontraktor, arahan PPK, serta keputusan yang disepakati..."
                minHeight="320px"
              />
            </div>

            {/* Rich Text Editor / Checklist: Tindak Lanjut (Action Items) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>III. Rencana Tindak Lanjut (Action Items & PIC)</span>
                </label>
                <span className="text-[11px] text-slate-400">Gunakan Checkbox & Tabel PIC</span>
              </div>
              <RichTextEditor
                value={tindakLanjut}
                onChange={setTindakLanjut}
                placeholder="Tuliskan butir-butir tindak lanjut beserta penanggung jawab (PIC) dan batas waktu pelaksanaan..."
                minHeight="180px"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Properties & Multi-User Sharing Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Properties Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Atribut & Pelaksanaan Rapat
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Titik Lokasi KNMP Terkait
                </label>
                <select
                  value={knmpId || ""}
                  onChange={(e) => setKnmpId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                >
                  <option value="">-- Koordinasi Seluruh Sumatera --</option>
                  {knmpList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Tanggal Rapat <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Waktu Pelaksanaan
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={waktuMulai}
                    onChange={(e) => setWaktuMulai(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    type="time"
                    value={waktuSelesai}
                    onChange={(e) => setWaktuSelesai(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Tempat / Lokasi / Link Meeting
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ruang Rapat Lt. 4 / Zoom ID"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Pimpinan Rapat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PPK KNMP Pertamina"
                  value={pimpinanRapat}
                  onChange={(e) => setPimpinanRapat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Notulis (Default: Super Admin)
                </label>
                <input
                  type="text"
                  value={notulis}
                  onChange={(e) => setNotulis(e.target.value)}
                  className="w-full px-3 py-2 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold text-blue-800 dark:text-blue-300"
                />
              </div>
            </div>
          </div>

          {/* Distribution & Multi-User Sharing Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Distribusi Akses ({selectedUserIds.length})</span>
              </h3>
              <button
                type="button"
                onClick={handleSelectAllUsers}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {selectedUserIds.length === availableUsers.length ? "Batal Semua" : "Pilih Semua"}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pilih pengguna yang berhak membaca dan menerima hasil notulensi ini.
            </p>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
              />
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 p-2">
              {filteredUsers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Tidak ada pengguna yang cocok</p>
              ) : (
                filteredUsers.map((u) => {
                  const isChecked = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUserSelection(u.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200"
                          : "hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            isChecked
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 uppercase shrink-0">
                        {u.role_name || "User"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
