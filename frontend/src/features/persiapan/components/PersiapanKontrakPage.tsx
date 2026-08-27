import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  RotateCcw,
  Plus,
  Edit,
  Trash2,
  Folder,
  FileText,
  Image as ImageIcon,
  Slash,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Upload,
  CheckCircle,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { useAlert } from "../../../context/AlertContext";
import { formatDate } from "../../../lib/utils";

interface PersiapanItem {
  id: number;
  nama: string;
  user_name?: string;
  knmp_id?: number;
  knmp_name?: string;
  tanggal: string;
  jenis: string;
  keterangan?: string;
  documents?: Array<{
    id: number;
    category: string;
    file_name: string;
    file_url: string;
    mime_type: string;
  }>;
  created_at: string;
}

interface KnmpOption {
  id: number;
  name: string;
}

interface UserOption {
  id: number;
  name: string;
}

export const PersiapanKontrakPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useAlert();

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedKnmp, setSelectedKnmp] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersiapanItem | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    knmp_id: "",
    tanggal: new Date().toISOString().split("T")[0],
    keterangan: "",
  });

  // Modal Kelola Dokumen
  const [selectedDocPersiapan, setSelectedDocPersiapan] = useState<PersiapanItem | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Fetch Persiapan Kontrak list
  const { data: list = [], isLoading } = useQuery<PersiapanItem[]>({
    queryKey: ["persiapan-kontrak"],
    queryFn: () => apiFetch<PersiapanItem[]>("/api/v1/persiapan?jenis=kontrak"),
  });

  // 2. Fetch KNMP options
  const { data: knmpOptions = [] } = useQuery<KnmpOption[]>({
    queryKey: ["knmp-options"],
    queryFn: () => apiFetch<KnmpOption[]>("/api/v1/knmp"),
  });

  // 3. Fetch User options
  const { data: userOptions = [] } = useQuery<UserOption[]>({
    queryKey: ["user-options"],
    queryFn: () => apiFetch<UserOption[]>("/api/v1/users"),
  });

  // Filtering
  const safeList = Array.isArray(list) ? list : [];
  const filteredData = safeList.filter((item) => {
    if (search && !item.nama.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedUser && item.user_name !== selectedUser) return false;
    if (selectedKnmp && item.knmp_name !== selectedKnmp) return false;
    if (selectedFileType === "document") {
      const hasDoc = item.documents?.some((d) => !d.mime_type?.includes("image"));
      if (!hasDoc) return false;
    } else if (selectedFileType === "image") {
      const hasImg = item.documents?.some((d) => d.mime_type?.includes("image"));
      if (!hasImg) return false;
    } else if (selectedFileType === "empty") {
      if (item.documents && item.documents.length > 0) return false;
    }
    return true;
  });

  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / perPage) || 1;
  const startIndex = (page - 1) * perPage;
  const currentData = filteredData.slice(startIndex, startIndex + perPage);

  // Summary Metrics
  const totalDataCount = list.length;
  let docOnlyCount = 0;
  let imgOnlyCount = 0;
  let emptyFileCount = 0;

  list.forEach((item) => {
    const docs = item.documents || [];
    if (docs.length === 0) {
      emptyFileCount++;
    } else {
      const hasImg = docs.some((d) => d.mime_type?.includes("image"));
      const hasDoc = docs.some((d) => !d.mime_type?.includes("image"));
      if (hasDoc) docOnlyCount++;
      if (hasImg) imgOnlyCount++;
    }
  });

  const handleReset = () => {
    setSearch("");
    setSelectedUser("");
    setSelectedKnmp("");
    setSelectedFileType("");
    setPage(1);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      nama: "",
      knmp_id: "",
      tanggal: new Date().toISOString().split("T")[0],
      keterangan: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PersiapanItem) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      knmp_id: item.knmp_id ? item.knmp_id.toString() : "",
      tanggal: item.tanggal?.split("T")[0] || "",
      keterangan: item.keterangan || "",
    });
    setIsModalOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/persiapan/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persiapan-kontrak"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets"] });
      showAlert({
        title: "Berhasil Dihapus",
        message: "Data persiapan kontrak berhasil dihapus.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menghapus",
        message: err.message || "Gagal menghapus data persiapan kontrak.",
        type: "error",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = {
        nama: data.nama,
        knmp_id: data.knmp_id ? Number(data.knmp_id) : undefined,
        tanggal: data.tanggal,
        jenis: "kontrak",
        keterangan: data.keterangan || "-",
      };

      if (editingItem) {
        return apiFetch(`/api/v1/persiapan/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      return apiFetch("/api/v1/persiapan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["persiapan-kontrak"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets"] });
    },
  });

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocPersiapan || !uploadCategory || !uploadFile) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("documentable_type", "persiapan");
      fd.append("documentable_id", selectedDocPersiapan.id.toString());
      fd.append("category", uploadCategory);
      fd.append("file", uploadFile);

      await apiFetch("/api/v1/documents", {
        method: "POST",
        body: fd,
      });

      queryClient.invalidateQueries({ queryKey: ["persiapan-kontrak"] });
      setUploadCategory(null);
      setUploadFile(null);
      showAlert({
        title: "Berhasil Diunggah",
        message: "Dokumen kontrak berhasil diunggah.",
        type: "success",
      });
    } catch (err: any) {
      showAlert({
        title: "Gagal Mengunggah",
        message: err.message || "Gagal mengunggah dokumen kontrak.",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const standardForms = [
    { code: "form_01_spmk", name: "Form 01 - Surat Perintah Mulai Kerja (SPMK)" },
    { code: "form_02_surat_perjanjian_kontrak", name: "Form 02 - Surat Perjanjian Kontrak" },
    { code: "form_03_surat_penyerahan_lapangan", name: "Form 03 - Surat Penyerahan Lapangan" },
    { code: "form_04_jadwal_pelaksanaan_pekerjaan", name: "Form 04 - Jadwal Pelaksanaan Pekerjaan" },
    { code: "form_05_jadwal_pengadaan_bahan", name: "Form 05 - Jadwal Pengadaan Bahan" },
    { code: "form_06_jadwal_pengadaan_peralatan", name: "Form 06 - Jadwal Pengadaan Peralatan" },
    { code: "form_07_jadwal_tenaga_kerja", name: "Form 07 - Jadwal Tenaga Kerja" },
    { code: "form_08_metode_pelaksanaan", name: "Form 08 - Metode Pelaksanaan Pekerjaan" },
    { code: "form_09_organisasi_kerja", name: "Form 09 - Struktur Organisasi Kerja" },
    { code: "form_10_rencana_k3", name: "Form 10 - Rencana Keselamatan Konstruksi (K3)" },
    { code: "form_11_surat_permohonan_pcm", name: "Form 11 - Surat Permohonan PCM" },
  ];

  return (
    <div className="space-y-7 w-full font-sans">
      
      {/* 1. Top Action Row: Search, Dropdowns, Reset, Tambah Data */}
      <div className="flex flex-wrap items-center justify-between gap-3.5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative min-w-[200px] max-w-[260px]">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2.5 text-[13.5px] bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] outline-none transition-all placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          </div>

          {/* User Filter Dropdown */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3.5 py-2.5 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none text-slate-700 min-w-[140px]"
          >
            <option value="">Semua User</option>
            {userOptions.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name}
              </option>
            ))}
          </select>

          {/* KNMP Filter Dropdown */}
          <select
            value={selectedKnmp}
            onChange={(e) => setSelectedKnmp(e.target.value)}
            className="px-3.5 py-2.5 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none text-slate-700 min-w-[150px]"
          >
            <option value="">Semua KNMP</option>
            {knmpOptions.map((k) => (
              <option key={k.id} value={k.name}>
                {k.name}
              </option>
            ))}
          </select>

          {/* File Filter Dropdown */}
          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="px-3.5 py-2.5 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none text-slate-700 min-w-[130px]"
          >
            <option value="">Semua File</option>
            <option value="document">Dokumen</option>
            <option value="image">Gambar</option>
            <option value="empty">Tanpa File</option>
          </select>
        </div>

        {/* Action Buttons: Reset & Tambah Data */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 text-[13.5px] font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center gap-2 shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4.5 py-2.5 text-[13.5px] font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Data */}
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-500">Total Data</span>
            <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight">{totalDataCount}</h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Folder className="w-7 h-7" />
          </div>
        </div>

        {/* Dokumen */}
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-500">Dokumen</span>
            <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight">{docOnlyCount}</h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <FileText className="w-7 h-7" />
          </div>
        </div>

        {/* Gambar */}
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-500">Gambar</span>
            <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight">{imgOnlyCount}</h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ImageIcon className="w-7 h-7" />
          </div>
        </div>

        {/* Tanpa File */}
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-500">Tanpa File</span>
            <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight">{emptyFileCount}</h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            <Slash className="w-7 h-7" />
          </div>
        </div>

      </div>

      {/* 3. Per Page Selector & Data Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Top Controls */}
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

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200/90 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4 text-center w-14">No</th>
                <th className="py-4 px-5 min-w-[200px]">Nama / Kontraktor</th>
                <th className="py-4 px-5 min-w-[140px]">User</th>
                <th className="py-4 px-5 min-w-[150px]">Titik KNMP</th>
                <th className="py-4 px-5 min-w-[140px]">Tanggal</th>
                <th className="py-4 px-5 min-w-[180px]">Keterangan</th>
                <th className="py-4 px-5 text-center min-w-[180px]">Dokumen (11 Formulir)</th>
                <th className="py-4 px-5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[14px]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    Memuat data persiapan kontrak...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    Tidak ada data persiapan kontrak ditemukan
                  </td>
                </tr>
              ) : (
                currentData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-center font-normal text-slate-500 text-[14px]">
                      {startIndex + idx + 1}
                    </td>
                    <td className="py-4 px-5 font-normal text-slate-800 text-[14.5px]">
                      {item.nama}
                    </td>
                    <td className="py-4 px-5 text-[14px] font-normal text-slate-700">
                      {item.user_name || "SuperAdmin"}
                    </td>
                    <td className="py-4 px-5 text-[14px] font-normal text-slate-700">
                      {item.knmp_name || "-"}
                    </td>
                    <td className="py-4 px-5 text-[14px] font-normal text-slate-600">
                      {formatDate(item.tanggal)}
                    </td>
                    <td className="py-4 px-5 text-[14px] font-normal text-slate-500">
                      {item.keterangan || "-"}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <button
                        type="button"
                        onClick={() => navigate(`/persiapan_kontrak/${item.id}/documents`)}
                        className="px-3.5 py-1.5 rounded-lg border border-[#0d6efd] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white font-medium text-xs transition-all shadow-2xs"
                      >
                        [ Kelola Dokumen ]
                      </button>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0d6efd] hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            showConfirm({
                              title: "Hapus Persiapan Kontrak",
                              message: `Apakah Anda yakin ingin menghapus ${item.nama}?`,
                              confirmText: "Hapus",
                              isDestructive: true,
                              onConfirm: () => deleteMutation.mutate(item.id),
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Row */}
        <div className="p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-[13.5px] text-slate-600 font-normal">
          <div>
            Menampilkan {totalRecords > 0 ? startIndex + 1 : 0} sampai{" "}
            {Math.min(startIndex + perPage, totalRecords)} dari total {totalRecords}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-xl font-medium text-xs transition-colors ${
                    page === p
                      ? "bg-[#0d6efd] text-white shadow-xs"
                      : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400 font-normal">...</span>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  className={`w-8 h-8 rounded-xl font-medium text-xs transition-colors ${
                    page === totalPages
                      ? "bg-[#0d6efd] text-white shadow-xs"
                      : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Modal Kelola Dokumen (11 Form Checklist) */}
      {selectedDocPersiapan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kelola 11 Dokumen Formulir: {selectedDocPersiapan.nama}
                </h3>
                <p className="text-xs text-slate-500">
                  Lokasi: {selectedDocPersiapan.knmp_name || "Semua Lokasi"} | Tanggal: {formatDate(selectedDocPersiapan.tanggal)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocPersiapan(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              {standardForms.map((form) => {
                const uploaded = selectedDocPersiapan.documents?.find((d) => d.category === form.code);

                return (
                  <div key={form.code} className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                    <div className="flex items-center gap-3">
                      {uploaded ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{form.name}</p>
                        {uploaded && (
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{uploaded.file_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {uploaded ? (
                        <a
                          href={uploaded.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#0d6efd] font-semibold text-xs hover:bg-blue-100"
                        >
                          Lihat / Unduh
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUploadCategory(form.code)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Unggah</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDocPersiapan(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload File Formulir */}
      {uploadCategory && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Unggah Berkas Dokumen Formulir
            </h3>
            <form onSubmit={handleUploadDoc} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Berkas PDF / Gambar *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#0d6efd] hover:file:bg-blue-100"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadCategory(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-xl font-semibold shadow-xs"
                >
                  {isUploading ? "Mengunggah..." : "Upload File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Data Persiapan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? "Edit Data Persiapan Kontrak" : "Tambah Data Persiapan Kontrak"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(formData);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama / Kontraktor / Survey *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: PT. Sadatani Jaya Tama"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Titik Lokasi KNMP
                </label>
                <select
                  value={formData.knmp_id}
                  onChange={(e) => setFormData({ ...formData, knmp_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] bg-white"
                >
                  <option value="">- (Tidak Terikat Titik Tertentu)</option>
                  {knmpOptions.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Kontrak *
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keterangan
                </label>
                <textarea
                  rows={3}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Catatan tambahan..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-xl font-semibold shadow-xs"
                >
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
