import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  FileText,
  Building,
  Printer,
  Share2,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";
import type { Notulen } from "../types/notulen.types";
import { fetchNotulenDetail, deleteNotulen } from "../api";
import { NotulenShareModal } from "./NotulenShareModal";

export const NotulenDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

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

  const [notulen, setNotulen] = useState<Notulen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const loadDetail = () => {
    if (id) {
      setLoading(true);
      fetchNotulenDetail(Number(id))
        .then((data) => setNotulen(data))
        .catch((err: any) => setError(err?.message || "Gagal memuat detail notulen"))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!notulen) return;
    if (!window.confirm("Apakah Anda yakin ingin menghapus notulen rapat ini?")) return;
    try {
      await deleteNotulen(notulen.id);
      navigate("/notulen");
    } catch (err: any) {
      alert(err?.message || "Gagal menghapus notulen");
    }
  };

  const formatDateIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 dark:text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-xs font-medium">Memuat dokumen notulen rapat...</p>
      </div>
    );
  }

  if (error || !notulen) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm max-w-lg mx-auto my-12 shadow-sm space-y-3">
        <div className="font-bold text-base">Dokumen Tidak Ditemukan</div>
        <p className="text-slate-600 dark:text-slate-400 text-xs">{error || "Notulen tidak tersedia"}</p>
        <Link
          to="/notulen"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all inline-block"
        >
          Kembali ke Daftar Notulen
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
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
                {notulen.knmp_name || "Koordinasi Sumatera"}
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {notulen.judul}
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {canManage && (
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan ({notulen.shared_users?.length || 0})</span>
            </button>
          )}

          {canManage && (
            <Link
              to={`/notulen/${notulen.id}/edit`}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Link>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF A4</span>
          </button>

          {canManage && (
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
              title="Hapus Dokumen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Confluence Document Page Sheet */}
      <div
        ref={printRef}
        className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-slate-800 dark:text-slate-200 print:shadow-none print:border-none print:p-0"
      >
        {/* Document Header BUMN */}
        <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-blue-900 text-white text-[10px] font-black rounded uppercase tracking-wider">
                PERTAMINA
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                KAMPUNG NELAYAN MERAH PUTIH (KNMP)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase mt-2 tracking-tight">
              BERITA ACARA & NOTULENSI RAPAT
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Nomor: NOT-KNMP/{notulen.id}/{new Date(notulen.tanggal).getFullYear()}
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-full uppercase shrink-0">
            {notulen.status}
          </span>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {notulen.judul}
          </h2>
        </div>

        {/* Properties Metadata Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <div className="space-y-2.5">
            <div className="flex items-start">
              <span className="w-36 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Hari / Tanggal:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatDateIndo(notulen.tanggal)}
              </span>
            </div>
            <div className="flex items-start">
              <span className="w-36 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Waktu:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {notulen.waktu_mulai || "09:00"} - {notulen.waktu_selesai || "Selesai"} WIB
              </span>
            </div>
            <div className="flex items-start">
              <span className="w-36 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Tempat/Platform:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {notulen.lokasi || "Ruang Rapat Koordinasi"}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start">
              <span className="w-36 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-600" /> Titik KNMP:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {notulen.knmp_name || "Koordinasi Seluruh Sumatera"}
              </span>
            </div>
            <div className="flex items-start">
              <span className="w-36 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" /> Pimpinan Rapat:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {notulen.pimpinan_rapat || "PPK KNMP Pertamina"}
              </span>
            </div>
            <div className="flex items-start">
              <span className="w-36 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" /> Notulis:
              </span>
              <span className="font-bold text-blue-700 dark:text-blue-400">
                {notulen.notulis || "Super Admin"}
              </span>
            </div>
          </div>
        </div>

        {/* I. Agenda */}
        {notulen.agenda && (
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1">
              I. Agenda Pembahasan
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-1">
              {notulen.agenda}
            </p>
          </div>
        )}

        {/* II. Poin Pembahasan & Hasil Meeting (Rich Text Content) */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>II. Poin Pembahasan & Hasil Meeting</span>
          </h3>
          <div
            className="confluence-rendered-content prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-xs leading-relaxed"
            dangerouslySetInnerHTML={{ __html: notulen.hasil_pembahasan }}
          />
        </div>

        {/* III. Tindak Lanjut (Action Items) */}
        {notulen.tindak_lanjut && (
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-800 pb-1 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>III. Rencana Tindak Lanjut (Action Items & PIC)</span>
            </h3>
            <div
              className="confluence-rendered-content prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-xs leading-relaxed bg-emerald-50/40 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60"
              dangerouslySetInnerHTML={{ __html: notulen.tindak_lanjut }}
            />
          </div>
        )}

        {/* IV. Distribusi & Penerima Notulen */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center justify-between">
            <span>IV. Distribusi Penerima Notulen ({notulen.shared_users?.length || 0} Pengguna)</span>
            {canManage && (
              <button
                onClick={() => setIsShareOpen(true)}
                className="text-[11px] font-bold text-purple-600 hover:underline normal-case print:hidden"
              >
                + Kelola Akses Sharing
              </button>
            )}
          </h3>

          {notulen.shared_users && notulen.shared_users.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {notulen.shared_users.map((u) => (
                <div
                  key={u.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center space-x-2.5"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                    {u.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="truncate flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">{u.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{u.role_name || "User"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Notulen ini belum dibagikan ke pengguna lain.</p>
          )}
        </div>

        {/* V. Lembar Pengesahan / Tanda Tangan */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs border-t border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Pimpinan Rapat,</p>
            <div className="h-20"></div>
            <p className="font-bold text-slate-900 dark:text-white underline">
              {notulen.pimpinan_rapat || "PPK KNMP Pertamina"}
            </p>
            <p className="text-[10px] text-slate-400">Pimpinan Sidang / Rapat Koordinasi</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Notulis,</p>
            <div className="h-20"></div>
            <p className="font-bold text-slate-900 dark:text-white underline">
              {notulen.notulis || "Super Admin"}
            </p>
            <p className="text-[10px] text-slate-400">Notulis Rapat Koordinasi KNMP</p>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <NotulenShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        notulen={notulen}
        onSuccess={() => loadDetail()}
      />
    </div>
  );
};
