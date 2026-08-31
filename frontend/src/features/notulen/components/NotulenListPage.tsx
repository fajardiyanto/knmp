import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Share2,
  Edit2,
  Trash2,
  Eye,
  Building,
  Filter,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";
import type { Notulen, NotulenFilter } from "../types/notulen.types";
import { fetchNotulenList, deleteNotulen } from "../api";
import { NotulenShareModal } from "./NotulenShareModal";
import { fetchKnmpList } from "../../knmp/api";
import { SearchableKnmpSelect } from "./SearchableKnmpSelect";

export const NotulenListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  // Role Permissions: only superadmin, super admin, admin_ppk, admin can manage (create/delete/share)
  const isSuperAdmin =
    hasRole("superadmin") ||
    hasRole("super admin") ||
    user?.roles?.some((r) => r.toLowerCase().includes("super"));
  const isAdminPPK =
    hasRole("admin_ppk") ||
    hasRole("admin") ||
    user?.roles?.some((r) => r.toLowerCase().includes("admin") || r.toLowerCase().includes("ppk"));
  const canManage = isSuperAdmin || isAdminPPK;

  const [notulens, setNotulens] = useState<Notulen[]>([]);
  const [knmpList, setKnmpList] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedKnmpId, setSelectedKnmpId] = useState<number | null>(null);
  const [tglAwal, setTglAwal] = useState("");
  const [tglAkhir, setTglAkhir] = useState("");

  // Share modal state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedNotulen, setSelectedNotulen] = useState<Notulen | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const filter: NotulenFilter = {
        search: search.trim() || undefined,
        knmp_id: selectedKnmpId || undefined,
        tanggal_awal: tglAwal || undefined,
        tanggal_akhir: tglAkhir || undefined,
      };
      const data = await fetchNotulenList(filter);
      setNotulens(data || []);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat daftar notulen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchKnmpList()
      .then((res: any) => {
        if (Array.isArray(res)) {
          setKnmpList(res);
        } else if (res && Array.isArray(res.data)) {
          setKnmpList(res.data);
        }
      })
      .catch(() => {});
  }, [selectedKnmpId, tglAwal, tglAkhir]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleShare = (n: Notulen, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNotulen(n);
    setIsShareOpen(true);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Apakah Anda yakin ingin menghapus notulen rapat ini?")) {
      return;
    }
    try {
      await deleteNotulen(id);
      loadData();
    } catch (err: any) {
      alert(err?.message || "Gagal menghapus notulen");
    }
  };

  // Metrics calculation
  const totalNotulen = notulens.length;
  const thisMonthNotulen = notulens.filter((n) => {
    const d = new Date(n.tanggal);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalSharedParticipants = notulens.reduce((acc, n) => acc + (n.shared_users?.length || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner Confluence Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 p-6 md:p-8 text-white shadow-xl border border-blue-900/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1.5">
              <span className="px-2.5 py-0.5 bg-blue-500/20 rounded-md">BUMN PERTAMINA</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                DOKUMENTASI KOORDINASI & BERITA ACARA RAPAT
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Notulen Rapat KNMP v2
            </h1>
            <p className="text-xs md:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
              Ruang kerja terintegrasi ala Confluence untuk menyusun Berita Acara, mengelola pimpinan sidang, mencatat notulis resmi (*Super Admin*), dan mendistribusikan tindak lanjut se-Sumatera.
            </p>
          </div>

          {canManage && (
            <Link
              to="/notulen/create"
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tulis Notulen Baru</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalNotulen}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Notulen Terdata</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{thisMonthNotulen}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rapat Bulan Ini</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalSharedParticipants}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Distribusi Penerima Notulen</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar with Searchable KNMP Points */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari judul, agenda, pimpinan, atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div className="md:col-span-3">
            <SearchableKnmpSelect
              options={knmpList}
              value={selectedKnmpId}
              onChange={(val) => setSelectedKnmpId(val)}
              placeholder="Filter Titik KNMP..."
              allOptionLabel="-- Semua Titik Lokasi --"
            />
          </div>

          <div className="md:col-span-2">
            <input
              type="date"
              value={tglAwal}
              onChange={(e) => setTglAwal(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
              title="Tanggal Awal"
            />
          </div>

          <div className="md:col-span-2">
            <input
              type="date"
              value={tglAkhir}
              onChange={(e) => setTglAkhir(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
              title="Tanggal Akhir"
            />
          </div>

          <div className="md:col-span-1 flex space-x-1">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center p-2 text-xs font-bold transition-colors"
              title="Filter"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedKnmpId(null);
                setTglAwal("");
                setTglAkhir("");
                loadData();
              }}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Reset"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Memuat data notulen rapat...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-3xl border border-red-200 dark:border-red-800 text-center text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      ) : notulens.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Belum Ada Notulen Rapat</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              {canManage
                ? "Klik tombol 'Tulis Notulen Baru' di atas untuk membuka editor ala Confluence."
                : "Belum ada notulen rapat yang dibagikan kepada akun Anda saat ini."}
            </p>
          </div>
          {canManage && (
            <Link
              to="/notulen/create"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buka Confluence Editor</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notulens.map((n) => {
            const canEditThis = canManage || n.user_access === "owner" || n.user_access === "editor";
            return (
              <div
                key={n.id}
                onClick={() => navigate(`/notulen/${n.id}`)}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between overflow-hidden cursor-pointer group"
              >
                <div>
                  {/* Card Top Header */}
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        <Calendar className="w-3 h-3" />
                        <span>{n.tanggal ? n.tanggal.split("T")[0] : "-"}</span>
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                        {n.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {n.judul}
                    </h3>

                    {n.knmp_name && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                        <Building className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{n.knmp_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Info Body */}
                  <div className="p-5 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {n.waktu_mulai || "09:00"} - {n.waktu_selesai || "Selesai"} WIB
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{n.lokasi || "Ruang Rapat"}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Pimpinan: {n.pimpinan_rapat || "PPK Pertamina"}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-medium">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Notulis: {n.notulis || "Super Admin"}</span>
                      </div>
                    </div>

                    {/* Shared Users Badge */}
                    <div className="flex items-center space-x-1.5 text-[11px] text-purple-600 dark:text-purple-400 font-semibold pt-1">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>Dibagikan ke {n.shared_users?.length || 0} Pengguna</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                  <span className="flex items-center space-x-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Buka Dokumen</span>
                  </span>

                  <div className="flex items-center space-x-1">
                    {canManage && (
                      <button
                        onClick={(e) => handleShare(n, e)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                        title="Bagikan Notulen"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canEditThis && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/notulen/${n.id}/edit`);
                        }}
                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Notulen"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canManage && (
                      <button
                        onClick={(e) => handleDelete(n.id, e)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Hapus Notulen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Modal */}
      <NotulenShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        notulen={selectedNotulen}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
