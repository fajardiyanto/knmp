import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Home,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { useAlert } from "../../../context/AlertContext";

interface JenisBangunanItem {
  id: number;
  nama: string;
  deskripsi?: string;
  is_active: boolean;
  laporan_count?: number;
  created_at?: string;
}

export const JenisBangunanPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useAlert();

  // Filters
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JenisBangunanItem | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    status: "Aktif",
    deskripsi: "",
  });

  // 1. Fetch List
  const { data: jenisBangunanList = [], isLoading } = useQuery<JenisBangunanItem[]>({
    queryKey: ["jenis-bangunan-list"],
    queryFn: async () => {
      const res = await apiFetch<JenisBangunanItem[]>("/api/v1/jenis-bangunan");
      return Array.isArray(res) ? res : [];
    },
  });

  // Save / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const body = {
        nama: payload.nama,
        deskripsi: payload.deskripsi || undefined,
        is_active: payload.status === "Aktif",
      };

      if (editingItem) {
        return apiFetch(`/api/v1/jenis-bangunan/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      return apiFetch("/api/v1/jenis-bangunan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jenis-bangunan-list"] });
      setIsModalOpen(false);
      setEditingItem(null);
      showAlert({
        title: "Berhasil Disimpan",
        message: "Data jenis bangunan berhasil disimpan.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menyimpan",
        message: err.message || "Gagal menyimpan data jenis bangunan.",
        type: "error",
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/jenis-bangunan/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jenis-bangunan-list"] });
      showAlert({
        title: "Berhasil Dihapus",
        message: "Data jenis bangunan berhasil dihapus.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menghapus",
        message: err.message || "Gagal menghapus data jenis bangunan.",
        type: "error",
      });
    },
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      nama: "",
      status: "Aktif",
      deskripsi: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: JenisBangunanItem) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      status: item.is_active ? "Aktif" : "Non-Aktif",
      deskripsi: item.deskripsi || "",
    });
    setIsModalOpen(true);
  };

  // Filter calculations
  const safeList = Array.isArray(jenisBangunanList) ? jenisBangunanList : [];
  const filteredData = safeList.filter((item) => {
    const s = search.toLowerCase();
    const matchSearch =
      s === "" ||
      item.nama?.toLowerCase().includes(s) ||
      item.deskripsi?.toLowerCase().includes(s);

    let matchStatus = true;
    if (selectedStatus === "Aktif") matchStatus = item.is_active === true;
    else if (selectedStatus === "Non-Aktif") matchStatus = item.is_active === false;

    return matchSearch && matchStatus;
  });

  // Pagination
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / perPage) || 1;
  const startIndex = (page - 1) * perPage;
  const currentData = filteredData.slice(startIndex, startIndex + perPage);

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* 1. Header & Breadcrumbs - Matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Jenis Bangunan
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Dashboard</span>
            <span className="text-slate-300">&gt;</span>
            <span className="text-slate-700 font-semibold">Jenis Bangunan</span>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jenis</span>
          </button>
        </div>
      </div>

      {/* 2. Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#0d6efd] focus:border-[#0d6efd] placeholder:text-slate-400 text-slate-700"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none text-slate-700 min-w-[140px]"
          >
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Non-Aktif">Non-Aktif</option>
          </select>
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
                <th className="py-4 px-6 min-w-[220px]">Nama</th>
                <th className="py-4 px-4 text-center min-w-[120px]">Status</th>
                <th className="py-4 px-6 min-w-[180px]">Laporan</th>
                <th className="py-4 px-6 min-w-[240px]">Deskripsi</th>
                <th className="py-4 px-5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13.5px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    Memuat data jenis bangunan...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    Tidak ada data jenis bangunan ditemukan
                  </td>
                </tr>
              ) : (
                currentData.map((item, idx) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-center font-medium text-slate-500">
                        {startIndex + idx + 1}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {item.nama}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-0.5 rounded-md text-xs font-semibold ${
                            item.is_active
                              ? "bg-white text-emerald-600 border border-emerald-400"
                              : "bg-slate-100 text-slate-500 border border-slate-300"
                          }`}
                        >
                          {item.is_active ? "Aktif" : "Non-Aktif"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        -
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs">
                        {item.deskripsi || "-"}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
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
                                title: "Hapus Jenis Bangunan",
                                message: `Apakah Anda yakin ingin menghapus jenis bangunan "${item.nama}"?`,
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

      {/* Modal Tambah Jenis Bangunan / Edit - Matching Screenshot 2 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[440px] w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                {editingItem ? "Edit Jenis Bangunan" : "Tambah Jenis Bangunan"}
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
                {/* Nama */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Nama <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Gedung Kantor"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                </div>

                {/* Deskripsi */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Deskripsi
                  </label>
                  <textarea
                    rows={3}
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    placeholder="Catatan tambahan..."
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
