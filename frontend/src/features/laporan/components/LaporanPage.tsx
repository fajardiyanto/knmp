import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  RotateCcw,
  Plus,
  Folder,
  FileText,
  ImageIcon,
  Slash,
  Eye,
  Edit,
  CheckCircle,
  RotateCcw as UndoIcon,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Printer,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { useAlert } from "../../../context/AlertContext";
import { formatDate } from "../../../lib/utils";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { MonthlyProjectReportModal } from "./MonthlyProjectReportModal";
import { ExecutiveProjectReportModalV2 } from "./ExecutiveProjectReportModalV2";
import { LaporanMingguanPPKModal } from "./LaporanMingguanPPKModal";

interface LaporanItem {
  id: number;
  pelaksanaan_id: number;
  user_id?: number;
  nama: string;
  tanggal: string;
  jenis_laporan: string;
  keberapa?: number;
  cuaca?: string;
  jumlah_tenaga_kerja: number;
  rencana_progres_fisik: number;
  realisasi_progres_fisik: number;
  deviasi: number;
  status: string;
  lat?: string;
  long?: string;
  keterangan?: string;
  pelaksanaan_name?: string;
  user_name?: string;
  jenis_bangunan_details?: Array<{
    id: number;
    jenis_bangunan_id: number;
    jenis_bangunan_name?: string;
    rencana_progres_fisik: number;
    realisasi_progres_fisik: number;
  }>;
  documents?: Array<{
    id: number;
    category: string;
    file_name: string;
    file_path: string;
    file_url: string;
    mime_type: string;
  }>;
}

interface PelaksanaanOption {
  id: number;
  nama: string;
}

interface JenisBangunanOption {
  id: number;
  nama: string;
}

interface UserOption {
  id: number;
  name: string;
}

export const LaporanPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useAlert();

  // Filters
  const [search, setSearch] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("");
  const [selectedJB, setSelectedJB] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedPelaksanaan, setSelectedPelaksanaan] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [isExecutiveReportV2Open, setIsExecutiveReportV2Open] = useState(false);
  const [isWeeklyPpkModalOpen, setIsWeeklyPpkModalOpen] = useState(false);
  const [monthlyReportKnmpId, setMonthlyReportKnmpId] = useState<number | undefined>(undefined);
  const [selectedLaporanId, setSelectedLaporanId] = useState<number | undefined>(undefined);
  const [editingItem, setEditingItem] = useState<LaporanItem | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    tanggal: new Date().toISOString().split("T")[0],
    jenis_laporan: "mingguan",
    jenis_bangunan_ids: [] as number[],
    keberapa: "",
    pelaksanaan_id: "",
    cuaca: "cerah",
    jumlah_tenaga_kerja: "5",
    lat: "",
    long: "",
    keterangan: "",
  });

  // 1. Fetch Laporan List
  const { data: laporanList = [], isLoading } = useQuery<LaporanItem[]>({
    queryKey: ["laporan-list"],
    queryFn: () => apiFetch<LaporanItem[]>("/api/v1/laporan"),
  });

  // 2. Fetch Pelaksanaans for dropdown
  const { data: pelaksanaanOptions = [] } = useQuery<PelaksanaanOption[]>({
    queryKey: ["pelaksanaan-options"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/v1/pelaksanaan");
      return res.map((p) => ({ id: p.id, nama: p.nama }));
    },
  });

  // 3. Fetch Jenis Bangunans for dropdown
  const { data: jbOptions = [] } = useQuery<JenisBangunanOption[]>({
    queryKey: ["jb-options"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/v1/jenis-bangunan");
      return res.map((j) => ({ id: j.id, nama: j.nama }));
    },
  });

  // 4. Fetch Users for filter
  const { data: userOptions = [] } = useQuery<UserOption[]>({
    queryKey: ["user-options"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/v1/users");
      return res.map((u) => ({ id: u.id, name: u.name }));
    },
  });

  // Save / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const body = {
        nama: payload.nama,
        tanggal: payload.tanggal,
        jenis_laporan: payload.jenis_laporan,
        pelaksanaan_id: Number(payload.pelaksanaan_id),
        keberapa: payload.keberapa ? Number(payload.keberapa) : undefined,
        cuaca: payload.cuaca || undefined,
        jumlah_tenaga_kerja: Number(payload.jumlah_tenaga_kerja) || 0,
        lat: payload.lat || undefined,
        long: payload.long || undefined,
        keterangan: payload.keterangan || undefined,
        jenis_bangunan_details: payload.jenis_bangunan_ids.map((jbId) => ({
          jenis_bangunan_id: jbId,
          rencana_progres_fisik: 10,
          realisasi_progres_fisik: 10,
        })),
      };

      if (editingItem) {
        return apiFetch(`/api/v1/laporan/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      return apiFetch("/api/v1/laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laporan-list"] });
      queryClient.invalidateQueries({ queryKey: ["laporan-list"] });
      setIsModalOpen(false);
      setEditingItem(null);
      showAlert({
        title: "Berhasil Disimpan",
        message: "Data laporan berhasil disimpan.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menyimpan",
        message: err.message || "Gagal menyimpan data laporan.",
        type: "error",
      });
    },
  });

  // Status Verify Mutation
  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`/api/v1/laporan/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laporan-list"] });
      showAlert({
        title: "Status Diperbarui",
        message: "Status verifikasi laporan berhasil diperbarui.",
        type: "success",
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/laporan/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laporan-list"] });
      showAlert({
        title: "Berhasil Dihapus",
        message: "Data laporan berhasil dihapus.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menghapus",
        message: err.message || "Gagal menghapus laporan.",
        type: "error",
      });
    },
  });

  const handleReset = () => {
    setSearch("");
    setSelectedJenis("");
    setSelectedJB("");
    setSelectedUser("");
    setSelectedPelaksanaan("");
    setSelectedFileType("");
    setSelectedStatus("");
    setPage(1);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      nama: "",
      tanggal: new Date().toISOString().split("T")[0],
      jenis_laporan: "mingguan",
      jenis_bangunan_ids: [],
      keberapa: "1",
      pelaksanaan_id: pelaksanaanOptions[0]?.id?.toString() || "",
      cuaca: "cerah",
      jumlah_tenaga_kerja: "5",
      lat: "",
      long: "",
      keterangan: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: LaporanItem) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      tanggal: item.tanggal?.split("T")[0] || item.tanggal,
      jenis_laporan: item.jenis_laporan,
      jenis_bangunan_ids: item.jenis_bangunan_details?.map((d) => d.jenis_bangunan_id) || [],
      keberapa: item.keberapa ? item.keberapa.toString() : "",
      pelaksanaan_id: item.pelaksanaan_id.toString(),
      cuaca: item.cuaca || "cerah",
      jumlah_tenaga_kerja: item.jumlah_tenaga_kerja.toString(),
      lat: item.lat || "",
      long: item.long || "",
      keterangan: item.keterangan || "",
    });
    setIsModalOpen(true);
  };

  // Filter calculations
  const safeLaporanList = Array.isArray(laporanList) ? laporanList : [];
  const filteredData = safeLaporanList.filter((item) => {
    const matchSearch =
      search === "" ||
      item.nama?.toLowerCase().includes(search.toLowerCase()) ||
      item.pelaksanaan_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.keterangan?.toLowerCase().includes(search.toLowerCase());

    const matchJenis = selectedJenis === "" || item.jenis_laporan.toLowerCase() === selectedJenis.toLowerCase();
    const matchUser = selectedUser === "" || item.user_name === selectedUser;
    const matchPelaksanaan = selectedPelaksanaan === "" || item.pelaksanaan_id.toString() === selectedPelaksanaan;
    const matchStatus = selectedStatus === "" || item.status === selectedStatus;

    const hasDocs = item.documents && item.documents.length > 0;
    const hasImages = item.documents?.some((d) =>
      d.mime_type?.startsWith("image/")
    );
    let matchFile = true;
    if (selectedFileType === "document") {
      matchFile = !!hasDocs && !hasImages;
    } else if (selectedFileType === "image") {
      matchFile = !!hasImages;
    } else if (selectedFileType === "empty") {
      matchFile = !hasDocs;
    }

    return matchSearch && matchJenis && matchUser && matchPelaksanaan && matchStatus && matchFile;
  });

  // 4 Metric Card Counts
  const totalDataCount = safeLaporanList.length;
  const docOnlyCount = safeLaporanList.filter(
    (d) => d.documents && d.documents.length > 0 && !d.documents.some((m) => m.mime_type?.startsWith("image/"))
  ).length;
  const imgOnlyCount = safeLaporanList.filter(
    (d) => d.documents && d.documents.some((m) => m.mime_type?.startsWith("image/"))
  ).length;
  const emptyFileCount = safeLaporanList.filter(
    (d) => !d.documents || d.documents.length === 0
  ).length;

  // Pagination
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / perPage) || 1;
  const startIndex = (page - 1) * perPage;
  const currentData = filteredData.slice(startIndex, startIndex + perPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "menunggu_wakil_ppk":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-200">
            Menunggu Wakil PPK
          </span>
        );
      case "menunggu_pengawas":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            Menunggu Pengawas
          </span>
        );
      case "terverifikasi":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            Terverifikasi
          </span>
        );
      case "baru":
      default:
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
            Baru
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* 1. Top Filter & Actions Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:flex xl:flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:min-w-[180px] lg:max-w-[220px]">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="w-full pl-9 pr-3.5 py-2.5 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] transition-all placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          </div>

          {/* Jenis Dropdown */}
          <SearchableSelect
            value={selectedJenis}
            onChange={(val) => {
              setSelectedJenis(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "Semua Jenis" },
              { value: "harian", label: "Harian" },
              { value: "mingguan", label: "Mingguan" },
              { value: "bulanan", label: "Bulanan" },
            ]}
            placeholder="Semua Jenis"
            searchPlaceholder="Cari jenis..."
            className="w-full sm:w-auto sm:min-w-[130px]"
          />

          {/* Jenis Bangunan Dropdown */}
          <SearchableSelect
            value={selectedJB}
            onChange={(val) => {
              setSelectedJB(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "Semua Jenis Bangunan" },
              ...jbOptions.map((jb) => ({ value: jb.nama, label: jb.nama })),
            ]}
            placeholder="Semua Jenis Bangunan"
            searchPlaceholder="Cari jenis bangunan..."
            className="w-full sm:w-auto sm:min-w-[170px]"
          />

          {/* User Dropdown */}
          <SearchableSelect
            value={selectedUser}
            onChange={(val) => {
              setSelectedUser(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "Semua User" },
              ...userOptions.map((u) => ({ value: u.name, label: u.name })),
            ]}
            placeholder="Semua User"
            searchPlaceholder="Cari user..."
            className="w-full sm:w-auto sm:min-w-[140px]"
          />

          {/* Pelaksanaan Dropdown */}
          <SearchableSelect
            value={selectedPelaksanaan}
            onChange={(val) => {
              setSelectedPelaksanaan(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "Semua Pelaksanaan" },
              ...pelaksanaanOptions.map((p) => ({ value: p.id.toString(), label: p.nama })),
            ]}
            placeholder="Semua Pelaksanaan"
            searchPlaceholder="Cari pelaksanaan..."
            className="w-full sm:w-auto sm:min-w-[170px]"
          />

          {/* File Dropdown */}
          <SearchableSelect
            value={selectedFileType}
            onChange={(val) => {
              setSelectedFileType(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "Semua File" },
              { value: "document", label: "Dokumen" },
              { value: "image", label: "Gambar" },
              { value: "empty", label: "Tanpa File" },
            ]}
            placeholder="Semua File"
            searchPlaceholder="Cari tipe file..."
            className="w-full sm:w-auto sm:min-w-[130px]"
          />

          {/* Status Dropdown */}
          <SearchableSelect
            value={selectedStatus}
            onChange={(val) => {
              setSelectedStatus(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "Semua Status" },
              { value: "baru", label: "Baru" },
              { value: "menunggu_pengawas", label: "Menunggu Pengawas" },
              { value: "menunggu_wakil_ppk", label: "Menunggu Wakil PPK" },
              { value: "terverifikasi", label: "Terverifikasi" },
            ]}
            placeholder="Semua Status"
            searchPlaceholder="Cari status..."
            className="w-full sm:w-auto sm:min-w-[160px]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setIsWeeklyPpkModalOpen(true);
            }}
            className="flex-1 sm:flex-none px-5 py-2.5 text-[13.5px] font-black bg-gradient-to-r from-[#002060] via-blue-900 to-indigo-900 hover:from-[#001848] hover:to-indigo-950 text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-950/25 cursor-pointer border border-blue-800"
            title="Buka Template Laporan Mingguan PPK Resmi (Program KNMP Wilayah Sumatra)"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Template Laporan Mingguan PPK</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-none px-4 py-2.5 text-[13px] sm:text-[13.5px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="w-full sm:w-auto px-4.5 py-2.5 text-[13px] sm:text-[13.5px] font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Laporan</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-500">Total Laporan</span>
            <h4 className="text-2xl lg:text-3xl font-normal text-slate-900 leading-tight">
              {totalDataCount}
            </h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Folder className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-500">Dokumen</span>
            <h4 className="text-2xl lg:text-3xl font-normal text-slate-900 leading-tight">
              {docOnlyCount}
            </h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <FileText className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-500">Gambar</span>
            <h4 className="text-2xl lg:text-3xl font-normal text-slate-900 leading-tight">
              {imgOnlyCount}
            </h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ImageIcon className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-500">Tanpa File</span>
            <h4 className="text-2xl lg:text-3xl font-normal text-slate-900 leading-tight">
              {emptyFileCount}
            </h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            <Slash className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* 3. Table Card with Horizontal Scroll */}
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
            <thead className="bg-slate-50/80 border-b border-slate-200/90 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-4 px-4 text-center w-14">No</th>
                <th className="py-4 px-5">Nama</th>
                <th className="py-4 px-4">Jenis</th>
                <th className="py-4 px-5 min-w-[180px]">Jenis Bangunan</th>
                <th className="py-4 px-4 text-center">Keberapa</th>
                <th className="py-4 px-4">User</th>
                <th className="py-4 px-5 min-w-[180px]">Pelaksanaan</th>
                <th className="py-4 px-4">Tanggal</th>
                <th className="py-4 px-4">Cuaca</th>
                <th className="py-4 px-4 text-center">Tenaga Kerja</th>
                <th className="py-4 px-4 text-center">Deviasi</th>
                <th className="py-4 px-5 min-w-[180px]">Keterangan</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-5 text-center">File</th>
                <th className="py-4 px-5 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13.5px]">
              {isLoading ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-sm text-slate-400">
                    Memuat data laporan...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-sm text-slate-400">
                    Tidak ada data laporan ditemukan
                  </td>
                </tr>
              ) : (
                currentData.map((item, idx) => {
                  const deviasiVal = item.deviasi || (item.realisasi_progres_fisik - item.rencana_progres_fisik);
                  const isDeviasiPos = deviasiVal >= 0;
                  const deviasiFormatted = `${isDeviasiPos ? "+" : ""}${deviasiVal.toFixed(2)}%`;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors whitespace-nowrap">
                      <td className="py-4 px-4 text-center font-normal text-slate-500">
                        {startIndex + idx + 1}
                      </td>
                      <td className="py-4 px-5 font-normal text-slate-800 text-[14.5px]">
                        {item.nama}
                      </td>
                      <td className="py-4 px-4 capitalize text-slate-700 font-normal">
                        {item.jenis_laporan}
                      </td>
                      <td className="py-4 px-5 text-slate-700 truncate max-w-[200px] font-normal">
                        {item.jenis_bangunan_details && item.jenis_bangunan_details.length > 0
                          ? item.jenis_bangunan_details.map((d) => d.jenis_bangunan_name || `Gedung ${d.jenis_bangunan_id}`).join(", ")
                          : item.keterangan?.includes("Gedung") || item.keterangan?.includes("Bangunan")
                            ? item.keterangan
                            : "Gedung 34"}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-600 font-normal">
                        {item.keberapa || "-"}
                      </td>
                      <td className="py-4 px-4 font-normal text-slate-800">
                        {item.user_name || "Kontraktor"}
                      </td>
                      <td className="py-4 px-5 font-normal text-slate-800">
                        {item.pelaksanaan_name || "-"}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-normal">
                        {formatDate(item.tanggal)}
                      </td>
                      <td className="py-4 px-4 capitalize text-slate-700 font-normal">
                        {item.cuaca || "Cerah"}
                      </td>
                      <td className="py-4 px-4 text-center font-normal text-slate-800">
                        {item.jumlah_tenaga_kerja}
                      </td>
                      <td className="py-4 px-4 text-center font-normal font-mono">
                        <span className={isDeviasiPos ? "text-emerald-600" : "text-rose-600"}>
                          {deviasiFormatted}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-500 truncate max-w-[200px]">
                        {item.keterangan || "-"}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/laporan/${item.id}/documents`)}
                          className="px-3.5 py-1.5 rounded-lg border border-[#0d6efd] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white font-semibold text-xs transition-all shadow-2xs"
                        >
                          [ Kelola Dokumen ]
                        </button>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/laporan/${item.id}/documents`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#0d6efd] hover:bg-blue-50 transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
                            onClick={() =>
                              verifyMutation.mutate({
                                id: item.id,
                                status: "terverifikasi",
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Verifikasi"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              verifyMutation.mutate({
                                id: item.id,
                                status: "menunggu_pengawas",
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Batal Verifikasi"
                          >
                            <UndoIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              showConfirm({
                                title: "Hapus Laporan",
                                message: `Apakah Anda yakin ingin menghapus laporan "${item.nama}"?`,
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Row */}
        <div className="p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-[13.5px] text-slate-600 font-medium">
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

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-colors ${page === p
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
                <span className="px-1 text-slate-400 font-bold">...</span>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-colors ${page === totalPages
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

      {/* Modal Buat / Edit Laporan - Pixel-perfect matching Screenshot 3 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[620px] w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                {editingItem ? "Edit Laporan" : "Buat Laporan"}
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
                {/* Row 1: Nama & Tanggal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Nama <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Contoh: Laporan Mingguan Tahap 1"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Tanggal <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                    />
                  </div>
                </div>

                {/* Row 2: Jenis Laporan & Jenis Bangunan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Jenis Laporan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.jenis_laporan}
                      onChange={(e) => setFormData({ ...formData, jenis_laporan: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                    >
                      <option value="">-- Pilih Jenis --</option>
                      <option value="harian">Harian</option>
                      <option value="mingguan">Mingguan</option>
                      <option value="bulanan">Bulanan</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Jenis Bangunan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      onChange={(e) => {
                        const jbId = Number(e.target.value);
                        if (jbId && !formData.jenis_bangunan_ids.includes(jbId)) {
                          setFormData({
                            ...formData,
                            jenis_bangunan_ids: [...formData.jenis_bangunan_ids, jbId],
                          });
                        }
                      }}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                    >
                      <option value="">-- Pilih Jenis Bangunan --</option>
                      {jbOptions.map((jb) => (
                        <option key={jb.id} value={jb.id}>
                          {jb.nama}
                        </option>
                      ))}
                    </select>

                    {/* Selected Badges */}
                    <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 min-h-[34px] flex flex-wrap gap-1 items-center">
                      {formData.jenis_bangunan_ids.length === 0 ? (
                        <span className="text-slate-400 text-[11px]">
                          Belum ada jenis bangunan dipilih
                        </span>
                      ) : (
                        formData.jenis_bangunan_ids.map((jbId) => {
                          const jb = jbOptions.find((j) => j.id === jbId);
                          return (
                            <span
                              key={jbId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#0d6efd] font-semibold text-[11px]"
                            >
                              {jb?.nama || `Bangunan ${jbId}`}
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    jenis_bangunan_ids: formData.jenis_bangunan_ids.filter((id) => id !== jbId),
                                  })
                                }
                                className="hover:text-rose-600"
                              >
                                &times;
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 3: Keberapa & User */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Keberapa
                    </label>
                    <input
                      type="text"
                      value={formData.keberapa}
                      onChange={(e) => setFormData({ ...formData, keberapa: e.target.value })}
                      placeholder="Contoh: minggu/bulan ke-1"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      User
                    </label>
                    <input
                      type="text"
                      disabled
                      value="SuperAdmin"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-100/70 text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Row 4: Pelaksanaan & Cuaca */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Pelaksanaan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.pelaksanaan_id}
                      onChange={(e) => setFormData({ ...formData, pelaksanaan_id: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                    >
                      <option value="">-- Pilih Pelaksanaan --</option>
                      {pelaksanaanOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Cuaca <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.cuaca}
                      onChange={(e) => setFormData({ ...formData, cuaca: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                    >
                      <option value="cerah">Cerah</option>
                      <option value="berawan">Berawan</option>
                      <option value="mendung">Mendung</option>
                      <option value="hujan">Hujan</option>
                      <option value="badai">Badai</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* Row 5: Jumlah Tenaga Kerja & Latitude */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Jumlah Tenaga Kerja <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.jumlah_tenaga_kerja}
                      onChange={(e) => setFormData({ ...formData, jumlah_tenaga_kerja: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all"
                    />
                  </div>
                </div>

                {/* Row 6: Longitude */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={formData.long}
                    onChange={(e) => setFormData({ ...formData, long: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all"
                  />
                </div>

                {/* Row 7: Keterangan */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Keterangan
                  </label>
                  <textarea
                    rows={3}
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Catatan tambahan tentang laporan ini..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all resize-none"
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
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan Laporan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Monthly Project Report Official Document Modal (v1) */}
      <MonthlyProjectReportModal
        isOpen={isMonthlyReportModalOpen}
        onClose={() => {
          setIsMonthlyReportModalOpen(false);
          setSelectedLaporanId(undefined);
        }}
        initialKnmpId={monthlyReportKnmpId}
        laporanId={selectedLaporanId}
      />

      {/* Executive Project Report Dual-Mode Modal (v2) */}
      <ExecutiveProjectReportModalV2
        isOpen={isExecutiveReportV2Open}
        onClose={() => {
          setIsExecutiveReportV2Open(false);
          setSelectedLaporanId(undefined);
        }}
        initialKnmpId={monthlyReportKnmpId}
        laporanId={selectedLaporanId}
      />

      {/* Official PPK Weekly Report Modal (Template Wilayah Sumatra) */}
      <LaporanMingguanPPKModal
        isOpen={isWeeklyPpkModalOpen}
        onClose={() => setIsWeeklyPpkModalOpen(false)}
      />
    </div>
  );
};
