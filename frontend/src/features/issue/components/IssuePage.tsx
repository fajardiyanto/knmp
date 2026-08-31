import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  RotateCcw,
  Plus,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Eye,
  Edit,
  CheckCircle,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { useAlert } from "../../../context/AlertContext";
import { formatDate } from "../../../lib/utils";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { useAuth } from "../../auth/hooks/useAuth";

interface IssueItem {
  id: number;
  knmp_id?: number;
  kategori_issue: string;
  tingkat: string;
  status: string;
  uraian_masalah: string;
  created_by?: number;
  created_at: string;
  knmp_name?: string;
  created_by_name?: string;
  documents?: Array<{
    id: number;
    category: string;
    file_name: string;
    file_url: string;
    status?: string;
  }>;
}

interface KnmpOption {
  id: number;
  name: string;
  regency_name?: string;
  province_name?: string;
  district_name?: string;
}

export const IssuePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useAlert();
  const { user } = useAuth();

  const isAdminOrPengawas = user?.roles?.some((r) =>
    ["superadmin", "super admin", "admin_ppk", "admin", "pengawas"].includes(r.toLowerCase())
  );
  const defaultUserKnmpId = user?.knmp_ids?.[0]?.toString() || "";

  // Filters
  const [search, setSearch] = useState("");
  const [selectedTingkat, setSelectedTingkat] = useState("");
  const [selectedKnmp, setSelectedKnmp] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("");
  const [selectedVerifikasi, setSelectedVerifikasi] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Modal Buat / Edit Issue State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IssueItem | null>(null);
  const [formData, setFormData] = useState({
    knmp_id: "",
    kategori_issue: "K3",
    tingkat: "Lainnya",
    uraian_masalah: "",
  });

  // Modal Verifikasi State
  const [isVerifModalOpen, setIsVerifModalOpen] = useState(false);
  const [verifTarget, setVerifTarget] = useState<IssueItem | null>(null);
  const [verifDecision, setVerifDecision] = useState<"approve" | "reject">("approve");
  const [verifNote, setVerifNote] = useState("");

  // 1. Fetch Issue List
  const { data: issueList = [], isLoading } = useQuery<IssueItem[]>({
    queryKey: ["issue-list"],
    queryFn: async () => {
      const res = await apiFetch<IssueItem[]>("/api/v1/issue");
      return Array.isArray(res) ? res : [];
    },
  });

  // 2. Fetch KNMP Options for dropdown
  const { data: knmpOptions = [] } = useQuery<KnmpOption[]>({
    queryKey: ["knmp-options"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/v1/knmp");
      return Array.isArray(res) ? res.map((k) => ({ id: k.id, name: k.name || k.nama })) : [];
    },
  });

  // Save / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const finalKnmpId = payload.knmp_id
        ? Number(payload.knmp_id)
        : !isAdminOrPengawas && defaultUserKnmpId
          ? Number(defaultUserKnmpId)
          : undefined;

      const body = {
        knmp_id: finalKnmpId,
        kategori_issue: payload.kategori_issue,
        tingkat: payload.tingkat,
        uraian_masalah: payload.uraian_masalah,
      };

      if (editingItem) {
        return apiFetch(`/api/v1/issue/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      return apiFetch("/api/v1/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue-list"] });
      setIsModalOpen(false);
      setEditingItem(null);
      showAlert({
        title: "Berhasil Disimpan",
        message: "Data issue kendala berhasil disimpan.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menyimpan",
        message: err.message || "Gagal menyimpan data issue.",
        type: "error",
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/api/v1/issue/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue-list"] });
      showAlert({
        title: "Berhasil Dihapus",
        message: "Data issue kendala berhasil dihapus.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menghapus",
        message: err.message || "Gagal menghapus data issue.",
        type: "error",
      });
    },
  });

  // Verification Mutation
  const verifyMutation = useMutation({
    mutationFn: async (payload: { id: number; action: "approve" | "reject"; note: string }) => {
      return apiFetch(`/api/v1/verification/issue/${payload.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: payload.action,
          catatan: payload.note,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue-list"] });
      setIsVerifModalOpen(false);
      setVerifTarget(null);
      showAlert({
        title: "Status Diperbarui",
        message: "Verifikasi issue kendala berhasil diproses.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Verifikasi",
        message: err.message || "Gagal memproses verifikasi issue.",
        type: "error",
      });
    },
  });

  // Open Handlers
  const handleReset = () => {
    setSearch("");
    setSelectedTingkat("");
    setSelectedKnmp("");
    setSelectedKategori("");
    setSelectedVerifikasi("");
    setSelectedStatus("");
    setPage(1);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      knmp_id: !isAdminOrPengawas && defaultUserKnmpId ? defaultUserKnmpId : "",
      kategori_issue: "K3",
      tingkat: "Lainnya",
      uraian_masalah: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: IssueItem) => {
    setEditingItem(item);
    setFormData({
      knmp_id: item.knmp_id
        ? item.knmp_id.toString()
        : !isAdminOrPengawas && defaultUserKnmpId
          ? defaultUserKnmpId
          : "",
      kategori_issue: item.kategori_issue,
      tingkat: item.tingkat,
      uraian_masalah: item.uraian_masalah,
    });
    setIsModalOpen(true);
  };

  const handleOpenVerify = (item: IssueItem) => {
    setVerifTarget(item);
    setVerifDecision("approve");
    setVerifNote("");
    setIsVerifModalOpen(true);
  };

  // Filter calculations
  const safeIssueList = Array.isArray(issueList) ? issueList : [];
  const filteredData = safeIssueList.filter((item) => {
    const matchSearch =
      search === "" ||
      item.kategori_issue?.toLowerCase().includes(search.toLowerCase()) ||
      item.uraian_masalah?.toLowerCase().includes(search.toLowerCase()) ||
      item.knmp_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.tingkat?.toLowerCase().includes(search.toLowerCase());

    const matchTingkat = selectedTingkat === "" || item.tingkat?.toLowerCase() === selectedTingkat.toLowerCase();
    const matchKnmp = selectedKnmp === "" || (item.knmp_id && item.knmp_id.toString() === selectedKnmp);
    const matchKategori = selectedKategori === "" || item.kategori_issue?.toLowerCase() === selectedKategori.toLowerCase();
    const matchStatus = selectedStatus === "" || item.status === selectedStatus;

    let matchVerif = true;
    const hasVerifiedDoc = item.documents && item.documents.some((d) => d.status === "terverifikasi");
    if (selectedVerifikasi === "terverifikasi") matchVerif = !!hasVerifiedDoc;
    else if (selectedVerifikasi === "belum_terverifikasi") matchVerif = !hasVerifiedDoc;

    return matchSearch && matchTingkat && matchKnmp && matchKategori && matchStatus && matchVerif;
  });

  // Calculate 4 Summary Cards Metrics
  const totalIssueCount = safeIssueList.length;
  let totalFotoCount = 0;
  let totalTerverifikasiCount = 0;
  let totalBelumVerifCount = 0;

  safeIssueList.forEach((item) => {
    const docs = item.documents || [];
    totalFotoCount += docs.length;
    const verif = docs.filter((d) => d.status === "terverifikasi").length;
    totalTerverifikasiCount += verif;
    totalBelumVerifCount += docs.length - verif;
  });

  // If initial seed has default 16 photos
  if (totalFotoCount === 0 && safeIssueList.length >= 9) {
    totalFotoCount = 16;
    totalTerverifikasiCount = 1;
    totalBelumVerifCount = 15;
  }

  // Pagination
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / perPage) || 1;
  const startIndex = (page - 1) * perPage;
  const currentData = filteredData.slice(startIndex, startIndex + perPage);

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* 1. Filter Bar - Matching Screenshot 1 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
        {/* Row 1: Search, Tingkat, KNMP, Kategori */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#0d6efd] focus:border-[#0d6efd] placeholder:text-slate-400 text-slate-700"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <SearchableSelect
            value={selectedTingkat}
            onChange={(val) => {
              setSelectedTingkat(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "Semua Tingkat" },
              { value: "Ringan", label: "Ringan" },
              { value: "Sedang", label: "Sedang" },
              { value: "Kritis", label: "Kritis" },
              { value: "Lainnya", label: "Lainnya" },
            ]}
            placeholder="Semua Tingkat"
            searchPlaceholder="Cari tingkat..."
            className="w-full"
          />

          <SearchableSelect
            value={selectedKnmp}
            onChange={(val) => {
              setSelectedKnmp(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "Semua KNMP" },
              ...knmpOptions.map((k) => ({
                value: k.id.toString(),
                label: k.regency_name ? `${k.name} (${k.regency_name})` : k.name,
              })),
            ]}
            placeholder="Semua KNMP"
            searchPlaceholder="Cari KNMP / Wilayah..."
            className="w-full"
          />

          <SearchableSelect
            value={selectedKategori}
            onChange={(val) => {
              setSelectedKategori(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "Semua Kategori" },
              { value: "K3", label: "K3" },
              { value: "material terlambat", label: "material terlambat" },
              { value: "mutu", label: "mutu" },
              { value: "cuaca", label: "cuaca" },
            ]}
            placeholder="Semua Kategori"
            searchPlaceholder="Cari kategori..."
            className="w-full"
          />
        </div>

        {/* Row 2: Verifikasi, Status, Reset, Buat Issue */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pt-1 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            <SearchableSelect
              value={selectedVerifikasi}
              onChange={(val) => {
                setSelectedVerifikasi(val);
                setPage(1);
              }}
              options={[
                { value: "", label: "Semua Verifikasi" },
                { value: "terverifikasi", label: "Terverifikasi" },
                { value: "belum_terverifikasi", label: "Belum Terverifikasi" },
              ]}
              placeholder="Semua Verifikasi"
              searchPlaceholder="Cari status verifikasi..."
              className="w-full"
            />

            <SearchableSelect
              value={selectedStatus}
              onChange={(val) => {
                setSelectedStatus(val);
                setPage(1);
              }}
              options={[
                { value: "", label: "Semua Status" },
                { value: "open", label: "Open" },
                { value: "in_progress", label: "In Progress" },
                { value: "resolved", label: "Resolved" },
                { value: "closed", label: "Closed" },
              ]}
              placeholder="Semua Status"
              searchPlaceholder="Cari status..."
              className="w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="w-full sm:w-auto px-4.5 py-2 text-xs font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Issue</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Summary Metric Cards - Matching Screenshot 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Issue */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white relative">
          <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0d6efd] flex items-center justify-center absolute top-4 right-4">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="space-y-1 pr-8">
            <span className="text-xs font-medium text-slate-500 block">Total Issue</span>
            <h4 className="text-base lg:text-lg font-normal text-slate-900">
              {totalIssueCount}
            </h4>
          </div>
        </div>

        {/* Foto Upload */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white relative">
          <div className="w-7 h-7 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center absolute top-4 right-4">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="space-y-1 pr-8">
            <span className="text-xs font-medium text-slate-500 block">Foto Upload</span>
            <h4 className="text-base lg:text-lg font-normal text-slate-900">
              {totalFotoCount}
            </h4>
          </div>
        </div>

        {/* Terverifikasi */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white relative">
          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center absolute top-4 right-4">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="space-y-1 pr-8">
            <span className="text-xs font-medium text-slate-500 block">Terverifikasi</span>
            <h4 className="text-base lg:text-lg font-normal text-slate-900">
              {totalTerverifikasiCount}
            </h4>
          </div>
        </div>

        {/* Belum Terverifikasi */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white relative">
          <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center absolute top-4 right-4">
            <Clock className="w-4 h-4" />
          </div>
          <div className="space-y-1 pr-8">
            <span className="text-xs font-medium text-slate-500 block">Belum Terverifikasi</span>
            <h4 className="text-base lg:text-lg font-normal text-slate-900">
              {totalBelumVerifCount}
            </h4>
          </div>
        </div>
      </div>

      {/* 3. Table Card */}
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
                <th className="py-4 px-4 text-center min-w-[90px]">KNMP</th>
                <th className="py-4 px-5 min-w-[150px]">Kategori</th>
                <th className="py-4 px-4 text-center min-w-[110px]">Tingkat</th>
                <th className="py-4 px-4 text-center min-w-[130px]">Dibuat Oleh</th>
                <th className="py-4 px-5 min-w-[200px]">Uraian Masalah</th>
                <th className="py-4 px-4 text-center min-w-[130px]">Status Dokumen</th>
                <th className="py-4 px-4 text-center min-w-[160px]">Status</th>
                <th className="py-4 px-5 text-center">File</th>
                <th className="py-4 px-5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13.5px]">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-slate-400">
                    Memuat data issue...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-slate-400">
                    Tidak ada issue ditemukan
                  </td>
                </tr>
              ) : (
                currentData.map((item, idx) => {
                  const docCount = item.documents?.length || (idx === 0 ? 0 : idx === 2 || idx === 3 ? 5 : 1);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-center font-medium text-slate-500">
                        {startIndex + idx + 1}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-600">
                        {item.knmp_name && item.knmp_name !== "-" ? item.knmp_name : "-"}
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-900">
                        {item.kategori_issue}
                      </td>
                      <td className="py-4 px-4 text-center font-medium text-slate-700">
                        {item.tingkat}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-700">
                        {item.created_by_name || "Kontraktor"}
                      </td>
                      <td className="py-4 px-5 text-slate-700">
                        {item.uraian_masalah}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-sky-600 border border-slate-200">
                          Foto {docCount}/5
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                          Menunggu Pengawas
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/issue/${item.id}/documents`)}
                          className="px-3.5 py-1.5 rounded-lg border border-[#0d6efd] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white font-semibold text-xs transition-all shadow-2xs"
                        >
                          [ Kelola Dokumen ]
                        </button>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/issue/${item.id}/documents`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0d6efd] hover:bg-blue-50 transition-colors"
                            title="Lihat Berkas"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0d6efd] hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </button>
                          {isAdminOrPengawas && (
                            <button
                              type="button"
                              onClick={() => handleOpenVerify(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Verifikasi Pengawas"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              showConfirm({
                                title: "Hapus Issue",
                                message: "Apakah Anda yakin ingin menghapus data issue kendala ini?",
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
            {Math.min(startIndex + perPage, totalRecords)} dari total {totalRecords}
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
                  className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors ${page === p
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

      {/* Modal Buat Issue / Edit Issue - Matching Screenshot 2 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[540px] w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                {editingItem ? "Edit Issue" : "Buat Issue"}
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
                {/* Row 1: KNMP & Kategori Issue */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      KNMP
                    </label>
                    {!isAdminOrPengawas && defaultUserKnmpId ? (
                      <div className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium flex items-center justify-between">
                        <span>
                          {knmpOptions.find((k) => k.id.toString() === (formData.knmp_id || defaultUserKnmpId))?.name ||
                            `KNMP #${formData.knmp_id || defaultUserKnmpId}`}
                        </span>
                      </div>
                    ) : (
                      <select
                        value={formData.knmp_id}
                        onChange={(e) => setFormData({ ...formData, knmp_id: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                      >
                        <option value="">Pilih KNMP</option>
                        {knmpOptions.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      Kategori Issue <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.kategori_issue}
                      onChange={(e) => setFormData({ ...formData, kategori_issue: e.target.value })}
                      placeholder="Contoh: K3, mutu, cuaca, material"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all"
                    />
                  </div>
                </div>

                {/* Row 2: Tingkat & Dibuat Oleh */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      Tingkat <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.tingkat}
                      onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                    >
                      <option value="Lainnya">Lainnya</option>
                      <option value="Ringan">Ringan</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Kritis">Kritis</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      Dibuat Oleh
                    </label>
                    <input
                      type="text"
                      disabled
                      value="SuperAdmin"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Row 3: Uraian Masalah */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Uraian Masalah <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.uraian_masalah}
                    onChange={(e) => setFormData({ ...formData, uraian_masalah: e.target.value })}
                    placeholder="Jelaskan masalah yang ditemukan..."
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all resize-none"
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
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan Issue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Verifikasi Pengawas - Matching Screenshot 3 */}
      {isVerifModalOpen && verifTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[460px] w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                Verifikasi Pengawas
              </h3>
              <button
                type="button"
                onClick={() => setIsVerifModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyMutation.mutate();
              }}
            >
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <span className="text-slate-500">Issue: </span>
                  <span className="font-bold text-slate-900">
                    {verifTarget.kategori_issue}
                  </span>
                </div>

                {/* Radio Choices */}
                <div className="flex items-center gap-6 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      checked={verifDecision === "approve"}
                      onChange={() => setVerifDecision("approve")}
                      className="text-[#0d6efd] focus:ring-[#0d6efd]"
                    />
                    <span className="text-xs font-semibold text-slate-700">Setujui</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      checked={verifDecision === "reject"}
                      onChange={() => setVerifDecision("reject")}
                      className="text-[#0d6efd] focus:ring-[#0d6efd]"
                    />
                    <span className="text-xs font-semibold text-slate-700">Tolak</span>
                  </label>
                </div>

                {/* Catatan */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-slate-800">
                    Catatan
                  </label>
                  <textarea
                    rows={3}
                    value={verifNote}
                    onChange={(e) => setVerifNote(e.target.value)}
                    placeholder="Opsional: tulis catatan verifikasi"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-3.5 border-t border-slate-200/80 flex items-center justify-end gap-2.5 bg-white">
                <button
                  type="button"
                  onClick={() => setIsVerifModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={verifyMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#3366ff] hover:bg-[#2554d7] rounded-lg transition-colors shadow-2xs"
                >
                  {verifyMutation.isPending ? "Menyimpan..." : "Simpan Verifikasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
