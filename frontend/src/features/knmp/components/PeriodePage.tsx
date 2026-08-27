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
import { formatDate } from "../../../lib/utils";

interface PeriodeItem {
  id: number;
  year: number;
  tanggal_mulai: string;
  tanggal_akhir: string;
  created_at?: string;
  updated_at?: string;
}

export const PeriodePage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PeriodeItem | null>(null);
  const [formData, setFormData] = useState({
    year: "2026",
    tanggal_mulai: "2026-01-01",
    tanggal_akhir: "2026-12-31",
  });

  // 1. Fetch Periode List
  const { data: periodes = [], isLoading } = useQuery<PeriodeItem[]>({
    queryKey: ["periodes-list"],
    queryFn: async () => {
      const res = await apiFetch<PeriodeItem[]>("/api/v1/periodes");
      return Array.isArray(res) ? res : [];
    },
  });

  // Save / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const body = {
        year: Number(payload.year) || 2026,
        tanggal_mulai: payload.tanggal_mulai,
        tanggal_akhir: payload.tanggal_akhir,
      };

      if (editingItem) {
        return apiFetch(`/api/v1/periodes/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      return apiFetch("/api/v1/periodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodes-list"] });
      setIsModalOpen(false);
      setEditingItem(null);
    },
    onError: (err: any) => {
      alert("Gagal menyimpan periode: " + err.message);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/periodes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodes-list"] });
    },
    onError: (err: any) => {
      alert("Gagal menghapus periode: " + err.message);
    },
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      year: "2026",
      tanggal_mulai: "2026-01-01",
      tanggal_akhir: "2026-12-31",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PeriodeItem) => {
    setEditingItem(item);
    const tm = item.tanggal_mulai ? item.tanggal_mulai.substring(0, 10) : "2026-01-01";
    const ta = item.tanggal_akhir ? item.tanggal_akhir.substring(0, 10) : "2026-12-31";
    setFormData({
      year: item.year.toString(),
      tanggal_mulai: tm,
      tanggal_akhir: ta,
    });
    setIsModalOpen(true);
  };

  // Filter calculation
  const safePeriodes = Array.isArray(periodes) ? periodes : [];
  const filteredData = safePeriodes.filter((item) => {
    const s = search.toLowerCase();
    return (
      s === "" ||
      item.year?.toString().includes(s) ||
      item.tanggal_mulai?.includes(s) ||
      item.tanggal_akhir?.includes(s)
    );
  });

  // Pagination
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / perPage) || 1;
  const startIndex = (page - 1) * perPage;
  const currentData = filteredData.slice(startIndex, startIndex + perPage);

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* 1. Header & Breadcrumb - Matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Periode Program
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Dashboard</span>
            <span className="text-slate-300">&gt;</span>
            <span className="text-slate-700 font-semibold">Periode</span>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Periode</span>
          </button>
        </div>
      </div>

      {/* 2. Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative max-w-[280px]">
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
                <th className="py-4 px-6 min-w-[200px]">Tahun</th>
                <th className="py-4 px-6 min-w-[220px]">Tanggal Mulai</th>
                <th className="py-4 px-6 min-w-[220px]">Tanggal Akhir</th>
                <th className="py-4 px-5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13.5px]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                    Memuat data periode...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                    Tidak ada data periode ditemukan
                  </td>
                </tr>
              ) : (
                currentData.map((item, idx) => {
                  const tglMulai = item.tanggal_mulai
                    ? item.tanggal_mulai.substring(0, 10)
                    : "2026-01-01";
                  const tglAkhir = item.tanggal_akhir
                    ? item.tanggal_akhir.substring(0, 10)
                    : "2026-12-31";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-center font-medium text-slate-500">
                        {startIndex + idx + 1}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {item.year}
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        {tglMulai}
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        {tglAkhir}
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
                              if (window.confirm(`Yakin ingin menghapus periode ${item.year}?`)) {
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

      {/* Modal Tambah Data Periode / Edit Data Periode - Matching Screenshot 2 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[440px] w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                {editingItem ? "Edit Data Periode" : "Tambah Data Periode"}
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
                {/* Tahun */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Tahun
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2026"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all"
                  />
                </div>

                {/* Tanggal Mulai */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_mulai}
                    onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all bg-white text-slate-700"
                  />
                </div>

                {/* Tanggal Akhir */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_akhir}
                    onChange={(e) => setFormData({ ...formData, tanggal_akhir: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all bg-white text-slate-700"
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
    </div>
  );
};
