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
  AlertCircle,
  ShieldAlert,
  Edit3,
  Eye,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";
import type { Notulen, NotulenFormData, NotulenUser, ShareUserPayload } from "../types/notulen.types";
import { fetchNotulenDetail, createNotulen, updateNotulen, fetchUsersForShare } from "../api";
import { fetchKnmpList } from "../../knmp/api";
import { RichTextEditor } from "./RichTextEditor";
import { SearchableKnmpSelect } from "./SearchableKnmpSelect";

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
  // Mapping of userId -> access_type ('viewer' | 'editor')
  const [userAccessMap, setUserAccessMap] = useState<Record<number, "viewer" | "editor">>({});
  const [userSearch, setUserSearch] = useState("");
  const [knmpList, setKnmpList] = useState<Array<{ id: number; name: string }>>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [userAccessLevel, setUserAccessLevel] = useState<string>("owner");

  useEffect(() => {
    // Fetch users for sharing
    fetchUsersForShare()
      .then((users) => setAvailableUsers(users || []))
      .catch(() => setAvailableUsers([]));

    // Fetch KNMP points (346 points)
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
          setUserAccessLevel(data.user_access || (canManage ? "owner" : "viewer"));

          // Populate userAccessMap
          const map: Record<number, "viewer" | "editor"> = {};
          if (data.shared_users && data.shared_users.length > 0) {
            data.shared_users.forEach((u) => {
              map[u.user_id] = u.access_type || "viewer";
            });
          } else if (data.shared_user_ids) {
            data.shared_user_ids.forEach((uid) => {
              map[uid] = "viewer";
            });
          }
          setUserAccessMap(map);
        })
        .catch((err: any) => {
          setErrorMsg(err?.message || "Gagal memuat detail notulen");
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

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

  const handleSelectAllUsers = (accessType: "viewer" | "editor" = "viewer") => {
    if (selectedUserIds.length === availableUsers.length) {
      setUserAccessMap({});
    } else {
      const newMap: Record<number, "viewer" | "editor"> = {};
      availableUsers.forEach((u) => {
        newMap[u.id] = accessType;
      });
      setUserAccessMap(newMap);
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

    const sharedPayload: ShareUserPayload[] = Object.entries(userAccessMap).map(([uidStr, access]) => ({
      user_id: Number(uidStr),
      access_type: access,
    }));

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
      shared_users: sharedPayload,
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

  // Permission verification:
  // If in create mode -> only superadmin/admin_ppk can create.
  // If in edit mode -> superadmin/admin_ppk OR user with 'editor' access level can edit.
  const canEditCurrent = canManage || userAccessLevel === "owner" || userAccessLevel === "editor";

  if (!isEditMode && !canManage) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm max-w-lg mx-auto my-12 shadow-sm space-y-3">
        <div className="font-bold text-base">Akses Ditolak (403 Forbidden)</div>
        <p className="text-slate-600 dark:text-slate-400 text-xs">
          Hanya Super Admin dan Admin PPK yang memiliki hak akses untuk membuat notulen rapat baru.
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

  if (isEditMode && !canEditCurrent && !loading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm max-w-lg mx-auto my-12 shadow-sm space-y-3">
        <div className="font-bold text-base flex items-center justify-center gap-2">
          <ShieldAlert className="w-5 h-5" /> Mode Read Only
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-xs">
          Anda hanya memiliki hak akses Viewer (Read-Only) pada dokumen notulen ini.
        </p>
        <Link
          to={`/notulen/${id}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all inline-block"
        >
          Buka Halaman Dokumen
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
              {/* Searchable KNMP Points Combobox (346 Titik) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Titik Lokasi KNMP (Bisa Cari 346 Titik)
                </label>
                <SearchableKnmpSelect
                  options={knmpList}
                  value={knmpId}
                  onChange={(val) => setKnmpId(val)}
                  placeholder="Cari titik lokasi nelayan..."
                  allOptionLabel="-- Koordinasi Seluruh Sumatera --"
                />
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

          {/* Distribution & Multi-User Sharing Panel (Editor vs Viewer Roles) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Distribusi Akses ({selectedUserIds.length})</span>
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllUsers("viewer")}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {selectedUserIds.length === availableUsers.length ? "Batal Semua" : "Pilih Semua"}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pilih pengguna dan tentukan hak akses: <strong className="text-emerald-600 dark:text-emerald-400">Editor (Bisa Edit)</strong> atau <strong className="text-slate-600 dark:text-slate-300">Viewer (Read-Only)</strong>.
            </p>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama atau email pengguna..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
              />
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 p-2 space-y-1">
              {filteredUsers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Tidak ada pengguna yang cocok</p>
              ) : (
                filteredUsers.map((u) => {
                  const isChecked = Boolean(userAccessMap[u.id]);
                  const accessType = userAccessMap[u.id] || "viewer";

                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUserSelection(u.id)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-colors space-y-2 ${
                        isChecked
                          ? "bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/60 dark:border-blue-800/60"
                          : "hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-transparent text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 truncate flex-1">
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
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {u.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                          </div>
                        </div>

                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 uppercase shrink-0">
                          {u.role_name || "User"}
                        </span>
                      </div>

                      {/* Granular Permission Selector: Viewer vs Editor */}
                      {isChecked && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-end space-x-1.5 pt-1 border-t border-blue-100 dark:border-blue-900/50"
                        >
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mr-1">
                            Hak Akses:
                          </span>
                          <button
                            type="button"
                            onClick={(e) => setUserAccessType(u.id, "viewer", e)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all ${
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
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all ${
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
        </div>
      </div>
    </div>
  );
};
