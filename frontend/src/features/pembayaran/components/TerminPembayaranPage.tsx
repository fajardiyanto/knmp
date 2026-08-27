import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  RotateCcw,
  Plus,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Home,
  FileUp,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { useAlert } from "../../../context/AlertContext";
import { formatRupiah } from "../../../lib/utils";

interface PembayaranItem {
  id: number;
  persiapan_kontrak_id: number;
  kategori?: string;
  name: string;
  termin: string;
  realisasi_anggaran: number;
  realisasi_fisik: number;
  norek_pekerja?: string;
  persiapan_name?: string;
  documents?: Array<{
    id: number;
    file_name: string;
    file_url: string;
  }>;
}

interface KontrakOption {
  id: number;
  nama: string;
}

const TERMIN_CONFIGS = [
  {
    name: "Termin 1",
    pct: "25%",
    desc: "Dibayarkan saat progress fisik mencapai 25%.",
    badgeClass: "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 font-bold",
  },
  {
    name: "Termin 2",
    pct: "50%",
    desc: "Dibayarkan saat progress fisik mencapai 50%.",
    badgeClass: "bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/80 font-bold",
  },
  {
    name: "Termin 3",
    pct: "75%",
    desc: "Dibayarkan saat progress fisik mencapai 75%.",
    badgeClass: "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 font-bold",
  },
  {
    name: "Termin 4",
    pct: "95%",
    desc: "Dibayarkan saat progress fisik mencapai 95%.",
    badgeClass: "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 font-bold",
  },
  {
    name: "Retensi",
    pct: "100%",
    desc: "Retensi 5% dibayarkan setelah tanda tangan FHO.",
    badgeClass: "bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 font-bold",
  },
];

export const TerminPembayaranPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useAlert();

  // Filters
  const [search, setSearch] = useState("");
  const [selectedKontrak, setSelectedKontrak] = useState("");
  const [selectedTermin, setSelectedTermin] = useState("");
  const [selectedDocFilter, setSelectedDocFilter] = useState("");

  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PembayaranItem | null>(null);
  const [formData, setFormData] = useState({
    persiapan_kontrak_id: "",
    name: "",
    termin: "Termin 1",
    realisasi_anggaran: "100000000",
    realisasi_fisik: "0.00",
    norek_pekerja: "",
  });

  // 1. Fetch Pembayaran List
  const { data: pembayaranList = [], isLoading } = useQuery<PembayaranItem[]>({
    queryKey: ["pembayaran-list"],
    queryFn: () => apiFetch<PembayaranItem[]>("/api/v1/pembayaran"),
  });

  // 2. Fetch Kontrak Options for dropdown
  const { data: kontrakOptions = [] } = useQuery<KontrakOption[]>({
    queryKey: ["kontrak-options"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/v1/persiapan?jenis=kontrak");
      return res.map((k) => ({ id: k.id, nama: k.nama }));
    },
  });

  // Save / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const body = {
        persiapan_kontrak_id: Number(payload.persiapan_kontrak_id),
        kategori: "Termin",
        name: payload.name,
        termin: payload.termin,
        realisasi_anggaran: Number(payload.realisasi_anggaran) || 0,
        realisasi_fisik: Number(payload.realisasi_fisik) || 0,
        norek_pekerja: payload.norek_pekerja || undefined,
      };

      if (editingItem) {
        return apiFetch(`/api/v1/pembayaran/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      return apiFetch("/api/v1/pembayaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pembayaran-list"] });
      setIsModalOpen(false);
      setEditingItem(null);
      showAlert({
        title: "Berhasil Disimpan",
        message: "Data termin pembayaran berhasil disimpan.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menyimpan",
        message: err.message || "Gagal menyimpan data termin.",
        type: "error",
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/pembayaran/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pembayaran-list"] });
      showAlert({
        title: "Berhasil Dihapus",
        message: "Data pembayaran termin berhasil dihapus.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menghapus",
        message: err.message || "Gagal menghapus pembayaran.",
        type: "error",
      });
    },
  });

  const handleReset = () => {
    setSearch("");
    setSelectedKontrak("");
    setSelectedTermin("");
    setSelectedDocFilter("");
    setPage(1);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      persiapan_kontrak_id: kontrakOptions[0]?.id?.toString() || "",
      name: "",
      termin: "Termin 1",
      realisasi_anggaran: "100000000",
      realisasi_fisik: "0.00",
      norek_pekerja: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PembayaranItem) => {
    setEditingItem(item);
    setFormData({
      persiapan_kontrak_id: item.persiapan_kontrak_id.toString(),
      name: item.name,
      termin: item.termin,
      realisasi_anggaran: item.realisasi_anggaran.toString(),
      realisasi_fisik: item.realisasi_fisik.toString(),
      norek_pekerja: item.norek_pekerja || "",
    });
    setIsModalOpen(true);
  };

  // Filter calculations
  const safePembayaranList = Array.isArray(pembayaranList) ? pembayaranList : [];
  const filteredData = safePembayaranList.filter((item) => {
    const matchSearch =
      search === "" ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.persiapan_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.norek_pekerja?.toLowerCase().includes(search.toLowerCase());

    const matchKontrak = selectedKontrak === "" || item.persiapan_kontrak_id.toString() === selectedKontrak;
    const matchTermin = selectedTermin === "" || item.termin === selectedTermin;

    const hasDocs = item.documents && item.documents.length > 0;
    let matchDoc = true;
    if (selectedDocFilter === "ada") matchDoc = !!hasDocs;
    else if (selectedDocFilter === "tidak_ada") matchDoc = !hasDocs;

    return matchSearch && matchKontrak && matchTermin && matchDoc;
  });

  // Calculate stats for 5 Termin Milestone Cards
  const getTerminStats = (terminName: string) => {
    const items = safePembayaranList.filter((p) => p.termin === terminName);
    const sum = items.reduce((acc, curr) => acc + Number(curr.realisasi_anggaran || 0), 0);
    const count = items.length;
    return { sum, count };
  };

  // Pagination
  const totalRecords = filteredData.length;
  const totalRawCount = safePembayaranList.length;
  const totalPages = Math.ceil(totalRecords / perPage) || 1;
  const startIndex = (page - 1) * perPage;
  const currentData = filteredData.slice(startIndex, startIndex + perPage);

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Termin Pembayaran
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau realisasi pembayaran per termin.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Dashboard</span>
            <span className="text-slate-300">&gt;</span>
            <span className="text-slate-400">Keuangan</span>
            <span className="text-slate-300">&gt;</span>
            <span className="text-slate-700 font-semibold">Termin Pembayaran</span>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pembayaran</span>
          </button>
        </div>
      </div>

      {/* 2. Top Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Cari</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Nama, kontrak, rekening..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#0d6efd] focus:border-[#0d6efd] placeholder:text-slate-400 text-slate-700"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Kontrak Filter */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Kontrak</label>
            <select
              value={selectedKontrak}
              onChange={(e) => {
                setSelectedKontrak(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none text-slate-700"
            >
              <option value="">Semua Kontrak</option>
              {kontrakOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Termin Filter */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Termin</label>
            <select
              value={selectedTermin}
              onChange={(e) => {
                setSelectedTermin(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none text-slate-700"
            >
              <option value="">Semua Termin</option>
              <option value="Termin 1">Termin 1</option>
              <option value="Termin 2">Termin 2</option>
              <option value="Termin 3">Termin 3</option>
              <option value="Termin 4">Termin 4</option>
              <option value="Retensi">Retensi</option>
            </select>
          </div>

          {/* Dokumen Filter */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Dokumen</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedDocFilter}
                onChange={(e) => {
                  setSelectedDocFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none text-slate-700"
              >
                <option value="">Semua Dokumen</option>
                <option value="ada">Ada Dokumen</option>
                <option value="tidak_ada">Tanpa Dokumen</option>
              </select>

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Termin Milestone Cards (5 Cards) */}
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Termin Pembayaran
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Skema termin sesuai progress pekerjaan dan retensi setelah FHO.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {TERMIN_CONFIGS.map((cfg) => {
            const stats = getTerminStats(cfg.name);
            return (
              <div
                key={cfg.name}
                className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${cfg.badgeClass}`}>
                      {cfg.name}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{cfg.pct}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {cfg.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Realisasi</span>
                    <span className="font-bold text-slate-900">{formatRupiah(stats.sum)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Data</span>
                    <span className="font-bold text-slate-900">{stats.count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-700"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200/90 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4 text-center w-14">No</th>
                <th className="py-4 px-5 min-w-[180px]">Nama Pembayaran</th>
                <th className="py-4 px-5 min-w-[200px]">Kontrak</th>
                <th className="py-4 px-4 text-center min-w-[120px]">Termin</th>
                <th className="py-4 px-5 min-w-[240px]">Ketentuan</th>
                <th className="py-4 px-5 min-w-[160px]">Realisasi Anggaran</th>
                <th className="py-4 px-4 text-center min-w-[130px]">Status Dokumen</th>
                <th className="py-4 px-5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13.5px]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    Memuat data termin pembayaran...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    Tidak ada data pembayaran ditemukan
                  </td>
                </tr>
              ) : (
                currentData.map((item, idx) => {
                  const cfg = TERMIN_CONFIGS.find((c) => c.name === item.termin) || TERMIN_CONFIGS[0];
                  const hasDoc = item.documents && item.documents.length > 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-center font-normal text-slate-500">
                        {startIndex + idx + 1}
                      </td>
                      <td className="py-4 px-5 font-normal text-slate-800 text-[14.5px]">
                        {item.name}
                      </td>
                      <td className="py-4 px-5 text-slate-700 font-normal">
                        {item.persiapan_name || "Survey KNMP HUB"}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded text-xs font-medium ${cfg.badgeClass}`}>
                          {item.termin}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-600 font-normal">
                        {cfg.desc}
                      </td>
                      <td className="py-4 px-5 font-normal text-slate-800">
                        {formatRupiah(item.realisasi_anggaran)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                            hasDoc
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {hasDoc ? "Sudah upload" : "Belum upload"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/pembayaran/${item.id}/documents`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0d6efd] hover:bg-blue-50 transition-colors"
                            title="Dokumen"
                          >
                            <FileUp className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0d6efd] hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              showConfirm({
                                title: "Hapus Termin Pembayaran",
                                message: `Apakah Anda yakin ingin menghapus ${item.name}?`,
                                confirmText: "Hapus",
                                isDestructive: true,
                                onConfirm: () => deleteMutation.mutate(item.id),
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Row */}
        <div className="p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div>
            Menampilkan {totalRecords > 0 ? startIndex + 1 : 0} sampai{" "}
            {Math.min(startIndex + perPage, totalRecords)} dari total {totalRecords}{" "}
            {totalRecords !== totalRawCount && `(disaring dari total ${totalRawCount} entri)`}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors ${
                    page === p
                      ? "bg-[#0d6efd] text-white shadow-xs"
                      : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah / Edit Pembayaran - Pixel-perfect matching Screenshot 2 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[540px] w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                {editingItem ? "Edit Pembayaran" : "Tambah Pembayaran"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(formData);
              }}
            >
              <div className="p-6 space-y-4 text-xs">
                {/* Kontrak */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Kontrak
                  </label>
                  <select
                    required
                    value={formData.persiapan_kontrak_id}
                    onChange={(e) => setFormData({ ...formData, persiapan_kontrak_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                  >
                    <option value="">Pilih Kontrak</option>
                    {kontrakOptions.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nama Pembayaran & Termin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      Nama Pembayaran
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Pembayaran Termin 1"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      Termin
                    </label>
                    <select
                      value={formData.termin}
                      onChange={(e) => setFormData({ ...formData, termin: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                    >
                      <option value="">Pilih Termin</option>
                      <option value="Termin 1">Termin 1 (25%)</option>
                      <option value="Termin 2">Termin 2 (50%)</option>
                      <option value="Termin 3">Termin 3 (75%)</option>
                      <option value="Termin 4">Termin 4 (95%)</option>
                      <option value="Retensi">Retensi (100%)</option>
                    </select>
                  </div>
                </div>

                {/* Realisasi Anggaran & Realisasi Fisik */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      Realisasi Anggaran (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.realisasi_anggaran}
                      onChange={(e) => setFormData({ ...formData, realisasi_anggaran: e.target.value })}
                      placeholder="100000000"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      Realisasi Fisik (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.realisasi_fisik}
                      onChange={(e) => setFormData({ ...formData, realisasi_fisik: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all"
                    />
                  </div>
                </div>

                {/* No. Rekening Pekerja */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    No. Rekening Pekerja
                  </label>
                  <input
                    type="text"
                    value={formData.norek_pekerja}
                    onChange={(e) => setFormData({ ...formData, norek_pekerja: e.target.value })}
                    placeholder="Masukkan nomor rekening / virtual account"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="px-6 py-3.5 border-t border-slate-200/80 flex items-center justify-end gap-2.5 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#3366ff] hover:bg-[#2554d7] rounded-lg transition-colors shadow-2xs"
                >
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
