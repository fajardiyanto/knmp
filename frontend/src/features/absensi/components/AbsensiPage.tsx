import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
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

interface AbsensiItem {
  id: number;
  pelaksanaan_id: number;
  user_id?: number;
  tipe_absensi: string;
  recorded_at: string;
  lat?: string;
  long?: string;
  status: string;
  pelaksanaan_name?: string;
  documents?: Array<{
    id: number;
    category: string;
    file_name: string;
    file_url: string;
  }>;
}

interface PelaksanaanOption {
  id: number;
  nama: string;
}

export const AbsensiPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState("");
  const [selectedDocFilter, setSelectedDocFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Modal Tambah / Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AbsensiItem | null>(null);
  const [formData, setFormData] = useState({
    pelaksanaan_id: "",
    tipe_absensi: "hadir",
    lat: "-6.297813",
    long: "108.745827",
  });

  // Modal Verifikasi State
  const [isVerifModalOpen, setIsVerifModalOpen] = useState(false);
  const [verifTarget, setVerifTarget] = useState<AbsensiItem | null>(null);
  const [verifDecision, setVerifDecision] = useState<"approve" | "reject">("approve");
  const [verifNote, setVerifNote] = useState("");

  // 1. Fetch Absensi List
  const { data: absensiList = [], isLoading } = useQuery<AbsensiItem[]>({
    queryKey: ["absensi-list"],
    queryFn: async () => {
      const res = await apiFetch<AbsensiItem[]>("/api/v1/absensi");
      return Array.isArray(res) ? res : [];
    },
  });

  // 2. Fetch Pelaksanaan Options
  const { data: pelaksanaanOptions = [] } = useQuery<PelaksanaanOption[]>({
    queryKey: ["pelaksanaan-options"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/v1/pelaksanaan");
      return Array.isArray(res) ? res.map((p) => ({ id: p.id, nama: p.nama })) : [];
    },
  });

  // Save / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const now = new Date().toISOString();
      const body = {
        pelaksanaan_id: Number(payload.pelaksanaan_id),
        tipe_absensi: payload.tipe_absensi,
        lat: payload.lat || undefined,
        long: payload.long || undefined,
        recorded_at: now,
      };

      if (editingItem) {
        return apiFetch(`/api/v1/absensi/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      return apiFetch("/api/v1/absensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi-list"] });
      setIsModalOpen(false);
      setEditingItem(null);
    },
    onError: (err: any) => {
      alert("Gagal menyimpan data absensi: " + err.message);
    },
  });

  // Verify Mutation
  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!verifTarget) return;
      return apiFetch(`/api/v1/absensi/${verifTarget.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "pengawas",
          is_approved: verifDecision === "approve",
          note: verifNote,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi-list"] });
      setIsVerifModalOpen(false);
      setVerifTarget(null);
      setVerifNote("");
    },
    onError: (err: any) => {
      alert("Gagal memproses verifikasi: " + err.message);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/absensi/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi-list"] });
    },
    onError: (err: any) => {
      alert("Gagal menghapus absensi: " + err.message);
    },
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      pelaksanaan_id: pelaksanaanOptions[0]?.id?.toString() || "",
      tipe_absensi: "hadir",
      lat: "-6.297813",
      long: "108.745827",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AbsensiItem) => {
    setEditingItem(item);
    setFormData({
      pelaksanaan_id: item.pelaksanaan_id.toString(),
      tipe_absensi: item.tipe_absensi,
      lat: item.lat || "",
      long: item.long || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenVerify = (item: AbsensiItem) => {
    setVerifTarget(item);
    setVerifDecision("approve");
    setVerifNote("");
    setIsVerifModalOpen(true);
  };

  // Filter calculations
  const safeList = Array.isArray(absensiList) ? absensiList : [];
  const filteredData = safeList.filter((item) => {
    const matchSearch =
      search === "" ||
      item.pelaksanaan_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.tipe_absensi?.toLowerCase().includes(search.toLowerCase()) ||
      item.status?.toLowerCase().includes(search.toLowerCase());

    const hasDocs = item.documents && item.documents.length > 0;
    let matchDoc = true;
    if (selectedDocFilter === "sudah") matchDoc = !!hasDocs;
    else if (selectedDocFilter === "belum") matchDoc = !hasDocs;

    const matchStatus = selectedStatus === "" || item.status === selectedStatus;

    return matchSearch && matchDoc && matchStatus;
  });

  // Pagination
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / perPage) || 1;
  const startIndex = (page - 1) * perPage;
  const currentData = filteredData.slice(startIndex, startIndex + perPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "terverifikasi":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            Terverifikasi
          </span>
        );
      case "menunggu_wakil_ppk":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-200">
            Menunggu Wakil PPK
          </span>
        );
      case "ditolak_pengawas":
      case "ditolak_wakil_ppk":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
            Ditolak
          </span>
        );
      case "menunggu_pengawas":
      default:
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            Menunggu Pengawas
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* 1. Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="w-full pl-9 pr-3.5 py-2 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Semua Dokumen Dropdown */}
          <select
            value={selectedDocFilter}
            onChange={(e) => {
              setSelectedDocFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none text-slate-700 min-w-[150px]"
          >
            <option value="">Semua Dokumen</option>
            <option value="sudah">Sudah Upload</option>
            <option value="belum">Belum Upload</option>
          </select>

          {/* Semua Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none text-slate-700 min-w-[150px]"
          >
            <option value="">Semua Status</option>
            <option value="menunggu_pengawas">Menunggu Pengawas</option>
            <option value="menunggu_wakil_ppk">Menunggu Wakil PPK</option>
            <option value="terverifikasi">Terverifikasi</option>
            <option value="ditolak_pengawas">Ditolak</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4.5 py-2 text-[13.5px] font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Absensi</span>
        </button>
      </div>

      {/* 2. Table Card */}
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
            <thead className="bg-slate-50/80 border-b border-slate-200/90 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4 text-center w-14">No</th>
                <th className="py-4 px-5 min-w-[200px]">Pelaksanaan</th>
                <th className="py-4 px-4 text-center min-w-[120px]">Tipe Absensi</th>
                <th className="py-4 px-4 text-center min-w-[110px]">Latitude</th>
                <th className="py-4 px-4 text-center min-w-[110px]">Longitude</th>
                <th className="py-4 px-4 text-center min-w-[110px]">Tanggal</th>
                <th className="py-4 px-4 text-center min-w-[90px]">Jam</th>
                <th className="py-4 px-4 text-center min-w-[150px]">Status Dokumen</th>
                <th className="py-4 px-4 text-center min-w-[160px]">Status</th>
                <th className="py-4 px-5 text-center">File</th>
                <th className="py-4 px-5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[14px]">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-sm text-slate-400">
                    Memuat data absensi...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-sm text-slate-400">
                    Tidak ada data absensi ditemukan
                  </td>
                </tr>
              ) : (
                currentData.map((item, idx) => {
                  const docCount = item.documents?.length || 1;
                  const d = new Date(item.recorded_at);
                  const tanggalFormatted = !isNaN(d.getTime())
                    ? d.toISOString().split("T")[0]
                    : "2026-07-29";
                  const jamFormatted = !isNaN(d.getTime())
                    ? d.toTimeString().substring(0, 5)
                    : "01:00";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-center font-normal text-slate-500">
                        {startIndex + idx + 1}
                      </td>
                      <td className="py-4 px-5 font-normal text-slate-800 text-[14.5px]">
                        {item.pelaksanaan_name || "KNMP PENYANGGA"}
                      </td>
                      <td className="py-4 px-4 text-center capitalize font-medium text-slate-700">
                        {item.tipe_absensi}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-600 font-mono text-xs">
                        {item.lat || "-6.297813"}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-600 font-mono text-xs">
                        {item.long || "108.745827"}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-700">
                        {tanggalFormatted}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-700 font-mono text-xs">
                        {jamFormatted}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Sudah upload {docCount}/5
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/absensi/${item.id}/documents`)}
                          className="px-3.5 py-1.5 rounded-lg border border-[#0d6efd] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white font-semibold text-xs transition-all shadow-2xs"
                        >
                          [ Kelola Dokumen ]
                        </button>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/absensi/${item.id}/documents`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0d6efd] hover:bg-blue-50 transition-colors"
                            title="Lihat Detail"
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
                          <button
                            type="button"
                            onClick={() => handleOpenVerify(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Verifikasi Pengawas"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Yakin ingin menghapus data absensi ini?")) {
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

      {/* Modal Tambah Data Absensi / Edit - Matching Screenshot 2 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[460px] w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                {editingItem ? "Edit Data Absensi" : "Tambah Data Absensi"}
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
                {/* Pelaksanaan */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Pelaksanaan
                  </label>
                  <select
                    required
                    value={formData.pelaksanaan_id}
                    onChange={(e) => setFormData({ ...formData, pelaksanaan_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                  >
                    <option value="">Pilih Pelaksanaan</option>
                    {pelaksanaanOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipe Absensi */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Tipe Absensi
                  </label>
                  <select
                    value={formData.tipe_absensi}
                    onChange={(e) => setFormData({ ...formData, tipe_absensi: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                  >
                    <option value="hadir">Hadir</option>
                    <option value="pulang">Pulang</option>
                  </select>
                </div>

                {/* Latitude */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    placeholder="-6.297813"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all"
                  />
                </div>

                {/* Longitude */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={formData.long}
                    onChange={(e) => setFormData({ ...formData, long: e.target.value })}
                    placeholder="108.745827"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all"
                  />
                </div>
              </div>

              <div className="px-6 py-3.5 border-t border-slate-200/80 flex items-center justify-end gap-2.5 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#dc3545] hover:bg-[#bb2d3b] rounded-lg transition-colors shadow-2xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#3366ff] hover:bg-[#2554d7] rounded-lg transition-colors shadow-2xs"
                >
                  {saveMutation.isPending ? "Saving..." : "Save changes"}
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
                  <span className="text-slate-500">Absensi: </span>
                  <span className="font-bold text-slate-900">
                    Absensi SuperAdmin - {new Date(verifTarget.recorded_at).toISOString().split("T")[0]}{" "}
                    {new Date(verifTarget.recorded_at).toTimeString().substring(0, 5)}
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
