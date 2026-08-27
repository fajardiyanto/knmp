import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  RotateCcw,
  Plus,
  TrendingUp,
  BarChart3,
  CreditCard,
  FileText,
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

export const TotalAnggaranPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    realisasi_anggaran: "100000000",
    realisasi_fisik: "0.00",
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
        name: payload.name,
        termin: "Termin 1",
        realisasi_anggaran: Number(payload.realisasi_anggaran) || 0,
        realisasi_fisik: Number(payload.realisasi_fisik) || 0,
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
    },
    onError: (err: any) => {
      alert("Gagal menyimpan data anggaran: " + err.message);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/pembayaran/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pembayaran-list"] });
    },
    onError: (err: any) => {
      alert("Gagal menghapus data pembayaran: " + err.message);
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
      realisasi_anggaran: "100000000",
      realisasi_fisik: "0.00",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PembayaranItem) => {
    setEditingItem(item);
    setFormData({
      persiapan_kontrak_id: item.persiapan_kontrak_id.toString(),
      name: item.name,
      realisasi_anggaran: item.realisasi_anggaran.toString(),
      realisasi_fisik: item.realisasi_fisik.toString(),
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

  // 4 Summary Metrics
  const totalAnggaran = filteredData.reduce((acc, curr) => acc + Number(curr.realisasi_anggaran || 0), 0);
  const avgRealisasiFisik =
    filteredData.length > 0
      ? Math.round(filteredData.reduce((acc, curr) => acc + Number(curr.realisasi_fisik || 0), 0) / filteredData.length)
      : 0;
  const totalPembayaranCount = filteredData.length;
  const docUploadedCount = filteredData.filter((d) => d.documents && d.documents.length > 0).length;
  const unuploadedDocCount = totalPembayaranCount - docUploadedCount;

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
            Total Anggaran dan Realisasi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan anggaran dan realisasi pembayaran.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Dashboard</span>
            <span className="text-slate-300">&gt;</span>
            <span className="text-slate-400">Keuangan</span>
            <span className="text-slate-300">&gt;</span>
            <span className="text-slate-700 font-semibold">Total Anggaran dan Realisasi</span>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Anggaran</span>
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

      {/* 3. Summary Container Box with 4 Cards */}
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Total Anggaran dan Realisasi
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan nilai pembayaran berdasarkan filter aktif.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Anggaran */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-white relative">
            <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0d6efd] flex items-center justify-center absolute top-4 right-4">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="space-y-1 pr-8">
              <span className="text-xs font-medium text-slate-500 block">Total Anggaran</span>
              <h4 className="text-base lg:text-lg font-bold text-slate-900">
                {formatRupiah(totalAnggaran)}
              </h4>
              <p className="text-[11px] text-slate-400">Akumulasi nilai realisasi tercatat.</p>
            </div>
          </div>

          {/* Rata-rata Realisasi Fisik */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-white relative">
            <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0d6efd] flex items-center justify-center absolute top-4 right-4">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="space-y-1 pr-8">
              <span className="text-xs font-medium text-slate-500 block">Rata-rata Realisasi Fisik</span>
              <h4 className="text-base lg:text-lg font-bold text-slate-900">
                {avgRealisasiFisik}%
              </h4>
              <p className="text-[11px] text-slate-400">Rata-rata progress dari data terfilter.</p>
            </div>
          </div>

          {/* Total Pembayaran */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-white relative">
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center absolute top-4 right-4">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="space-y-1 pr-8">
              <span className="text-xs font-medium text-slate-500 block">Total Pembayaran</span>
              <h4 className="text-base lg:text-lg font-bold text-slate-900">
                {totalPembayaranCount}
              </h4>
              <p className="text-[11px] text-slate-400">Jumlah record pembayaran.</p>
            </div>
          </div>

          {/* Dokumen */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-white relative">
            <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center absolute top-4 right-4">
              <FileText className="w-4 h-4" />
            </div>
            <div className="space-y-1 pr-8">
              <span className="text-xs font-medium text-slate-500 block">Dokumen</span>
              <h4 className="text-base lg:text-lg font-bold text-slate-900">
                {docUploadedCount} <span className="text-xs font-normal text-slate-500">terunggah</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                {unuploadedDocCount} pembayaran belum memiliki dokumen.
              </p>
            </div>
          </div>
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
                <th className="py-4 px-5 min-w-[200px]">Nama Pembayaran</th>
                <th className="py-4 px-5 min-w-[200px]">Kontrak</th>
                <th className="py-4 px-5 min-w-[160px]">Realisasi Anggaran</th>
                <th className="py-4 px-5 min-w-[200px]">Realisasi Fisik</th>
                <th className="py-4 px-5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[14px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    Memuat data anggaran...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    Tidak ada data pembayaran ditemukan
                  </td>
                </tr>
              ) : (
                currentData.map((item, idx) => {
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
                      <td className="py-4 px-5 font-normal text-slate-800">
                        {formatRupiah(item.realisasi_anggaran)}
                      </td>
                      <td className="py-4 px-5">
                        <div className="space-y-1.5">
                          <span className="text-xs font-normal text-slate-700 block font-mono">
                            {Number(item.realisasi_fisik).toFixed(2)}%
                          </span>
                          <div className="w-full max-w-[220px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0d6efd] rounded-full transition-all"
                              style={{ width: `${Math.min(Number(item.realisasi_fisik), 100)}%` }}
                            />
                          </div>
                        </div>
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
                              if (window.confirm(`Yakin ingin menghapus ${item.name}?`)) {
                                deleteMutation.mutate(item.id);
                              }
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

      {/* Modal Tambah / Edit Anggaran - Pixel-perfect matching Screenshot 2 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[500px] w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                {editingItem ? "Edit Anggaran" : "Tambah Anggaran"}
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

                {/* Nama Anggaran */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Nama Anggaran
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Anggaran Kontrak"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all"
                  />
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
