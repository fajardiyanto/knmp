import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  RotateCcw,
  Upload,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { useAlert } from "../../../context/AlertContext";

interface KnmpItem {
  id: number;
  name: string;
  regional_name?: string;
  province_name?: string;
  regency_name?: string;
  district_name?: string;
  sub_district_name?: string;
  lat?: string;
  long?: string;
  status: string;
  jenis_knmp: string;
  created_at: string;
}

export const KnmpPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useAlert();

  const [search, setSearch] = useState("");
  const [selectedRegional, setSelectedRegional] = useState("");
  const [selectedProvinsi, setSelectedProvinsi] = useState("");
  const [selectedKabupaten, setSelectedKabupaten] = useState("");
  const [selectedKecamatan, setSelectedKecamatan] = useState("");
  const [selectedKelurahan, setSelectedKelurahan] = useState("");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnmpItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    jenis_knmp: "penyangga",
    lat: "",
    long: "",
    status: "aktif",
  });

  // 1. Fetch All Locations
  const { data: allKnmp = [], isLoading } = useQuery<KnmpItem[]>({
    queryKey: ["knmps", search, selectedRegional, selectedProvinsi, selectedKabupaten],
    queryFn: () =>
      apiFetch<KnmpItem[]>(`/api/v1/knmp?search=${encodeURIComponent(search)}`),
  });

  // Client-side filtering & pagination
  const filteredData = allKnmp.filter((k) => {
    if (search && !k.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedRegional && k.regional_name !== selectedRegional) return false;
    if (selectedProvinsi && k.province_name !== selectedProvinsi) return false;
    if (selectedKabupaten && k.regency_name !== selectedKabupaten) return false;
    return true;
  });

  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / perPage) || 1;
  const startIndex = (page - 1) * perPage;
  const currentData = filteredData.slice(startIndex, startIndex + perPage);

  // Status stats
  const onTrackCount = allKnmp.filter((k) => k.status === "aktif" || k.status === "on_track").length;
  const perluPerhatianCount = allKnmp.filter((k) => k.status === "perlu_perhatian").length;
  const kritisCount = allKnmp.filter((k) => k.status === "kritis").length;
  const pemeliharaanCount = allKnmp.filter((k) => k.status === "pemeliharaan").length;

  const handleReset = () => {
    setSearch("");
    setSelectedRegional("");
    setSelectedProvinsi("");
    setSelectedKabupaten("");
    setSelectedKecamatan("");
    setSelectedKelurahan("");
    setPage(1);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      jenis_knmp: "penyangga",
      lat: "",
      long: "",
      status: "aktif",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: KnmpItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      jenis_knmp: item.jenis_knmp || "penyangga",
      lat: item.lat || "",
      long: item.long || "",
      status: item.status || "aktif",
    });
    setIsModalOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/knmp/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knmps"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets"] });
      showAlert({
        title: "Berhasil Dihapus",
        message: "Data lokasi KNMP berhasil dihapus.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menghapus",
        message: err.message || "Gagal menghapus data KNMP.",
        type: "error",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (editingItem) {
        return apiFetch(`/api/v1/knmp/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      return apiFetch("/api/v1/knmp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["knmps"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets"] });
      showAlert({
        title: "Berhasil Disimpan",
        message: "Data lokasi KNMP berhasil disimpan.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menyimpan",
        message: err.message || "Gagal menyimpan data KNMP.",
        type: "error",
      });
    },
  });

  return (
    <div className="space-y-7 w-full font-sans">
      
      {/* 1. Top Action Row: Search & Cascading Dropdown Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:min-w-[180px] lg:max-w-[220px]">
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

          {/* Regional Dropdown */}
          <select
            value={selectedRegional}
            onChange={(e) => setSelectedRegional(e.target.value)}
            className="w-full lg:w-auto px-3.5 py-2.5 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none text-slate-700 sm:min-w-[130px]"
          >
            <option value="">Regional</option>
            <option value="Sumatera">Sumatera</option>
            <option value="Jawa">Jawa</option>
            <option value="Kalimantan">Kalimantan</option>
            <option value="Sulawesi">Sulawesi</option>
          </select>

          {/* Provinsi Dropdown */}
          <select
            value={selectedProvinsi}
            onChange={(e) => setSelectedProvinsi(e.target.value)}
            className="w-full lg:w-auto px-3.5 py-2.5 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none text-slate-700 sm:min-w-[140px]"
          >
            <option value="">Provinsi</option>
            <option value="SUMATERA UTARA">SUMATERA UTARA</option>
            <option value="RIAU">RIAU</option>
            <option value="KEPULAUAN RIAU">KEPULAUAN RIAU</option>
            <option value="SUMATERA BARAT">SUMATERA BARAT</option>
            <option value="KEPULAUAN BANGKA BELITUNG">BANGKA BELITUNG</option>
            <option value="LAMPUNG">LAMPUNG</option>
            <option value="ACEH">ACEH</option>
          </select>

          {/* Kabupaten / Kota */}
          <select
            value={selectedKabupaten}
            onChange={(e) => setSelectedKabupaten(e.target.value)}
            className="w-full lg:w-auto px-3.5 py-2.5 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none text-slate-700 sm:min-w-[150px]"
          >
            <option value="">Kabupaten / Kota</option>
            <option value="KABUPATEN DELI SERDANG">KAB. DELI SERDANG</option>
            <option value="KABUPATEN ASAHAN">KAB. ASAHAN</option>
            <option value="KABUPATEN TAPANULI TENGAH">KAB. TAPANULI TENGAH</option>
            <option value="KABUPATEN MANDAILING NATAL">KAB. MANDAILING NATAL</option>
            <option value="KABUPATEN LINGGA">KAB. LINGGA</option>
            <option value="KABUPATEN NATUNA">KAB. NATUNA</option>
          </select>

          {/* Kecamatan */}
          <select
            value={selectedKecamatan}
            onChange={(e) => setSelectedKecamatan(e.target.value)}
            className="w-full lg:w-auto px-3.5 py-2.5 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none text-slate-700 sm:min-w-[130px]"
          >
            <option value="">Kecamatan</option>
          </select>

          {/* Kelurahan / Desa */}
          <select
            value={selectedKelurahan}
            onChange={(e) => setSelectedKelurahan(e.target.value)}
            className="w-full lg:w-auto px-3.5 py-2.5 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none text-slate-700 sm:min-w-[140px]"
          >
            <option value="">Kelurahan / Desa</option>
          </select>
        </div>

        {/* Action Buttons: Reset, Import, Tambah KNMP */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-none px-3.5 py-2.5 text-[13px] sm:text-[13.5px] font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="flex-1 sm:flex-none px-3.5 py-2.5 text-[13px] sm:text-[13.5px] font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="w-full sm:w-auto px-4 py-2.5 text-[13px] sm:text-[13.5px] font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah KNMP</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* On Track */}
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-500">On Track</span>
            <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight">{onTrackCount} Lokasi</h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </div>

        {/* Perlu Perhatian */}
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-500">Perlu Perhatian</span>
            <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight">{perluPerhatianCount} Lokasi</h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
        </div>

        {/* Kritis */}
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-500">Kritis</span>
            <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight">{kritisCount} Lokasi</h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-7 h-7" />
          </div>
        </div>

        {/* Pemeliharaan */}
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-500">Pemeliharaan</span>
            <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight">{pemeliharaanCount} Lokasi</h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Wrench className="w-7 h-7" />
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
            <thead className="bg-slate-50/80 border-b border-slate-200/90 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4 text-center w-14">No</th>
                <th className="py-4 px-5">Nama KNMP</th>
                <th className="py-4 px-5">Regional</th>
                <th className="py-4 px-5">Provinsi</th>
                <th className="py-4 px-5">Kabupaten/Kota</th>
                <th className="py-4 px-5">Jenis KNMP</th>
                <th className="py-4 px-4">Kecamatan</th>
                <th className="py-4 px-4">Kelurahan/Desa</th>
                <th className="py-4 px-4">Latitude</th>
                <th className="py-4 px-4">Longitude</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-sm text-slate-400">
                    Memuat data KNMP...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-sm text-slate-400">
                    Tidak ada data KNMP ditemukan
                  </td>
                </tr>
              ) : (
                currentData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-center font-normal text-slate-500 text-[14px]">
                      {startIndex + idx + 1}
                    </td>
                    <td className="py-4 px-5 font-normal text-slate-800 text-[14.5px]">
                      {item.name}
                    </td>
                    <td className="py-4 px-5 text-[13.5px]">{item.regional_name || "Sumatera"}</td>
                    <td className="py-4 px-5 text-[13.5px]">{item.province_name || "SUMATERA UTARA"}</td>
                    <td className="py-4 px-5 text-[13.5px]">{item.regency_name || "KABUPATEN DELI SERDANG"}</td>
                    <td className="py-4 px-5 text-[13.5px] capitalize">{item.jenis_knmp || "Penyangga"}</td>
                    <td className="py-4 px-4 text-[13.5px]">{item.district_name || "-"}</td>
                    <td className="py-4 px-4 text-[13.5px]">{item.sub_district_name || "-"}</td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-600">{item.lat || "-"}</td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-600">{item.long || "-"}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        On Track
                      </span>
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
                              title: "Hapus Lokasi KNMP",
                              message: `Apakah Anda yakin ingin menghapus lokasi "${item.name}"?`,
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

            {/* Page number buttons */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-colors ${
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
                <span className="px-1 text-slate-400 font-bold">...</span>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-colors ${
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

      {/* Modal Tambah/Edit KNMP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? "Edit Lokasi KNMP" : "Tambah Lokasi KNMP Baru"}
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
                  Nama Lokasi KNMP
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: KNMP Kelambir"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-[#0d6efd]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis KNMP
                  </label>
                  <select
                    value={formData.jenis_knmp}
                    onChange={(e) => setFormData({ ...formData, jenis_knmp: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-[#0d6efd]"
                  >
                    <option value="penyangga">Penyangga</option>
                    <option value="baru">Baru</option>
                    <option value="existing">Existing</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-[#0d6efd]"
                  >
                    <option value="aktif">On Track / Aktif</option>
                    <option value="perlu_perhatian">Perlu Perhatian</option>
                    <option value="kritis">Kritis</option>
                    <option value="pemeliharaan">Pemeliharaan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    placeholder="3.69835"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-[#0d6efd]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={formData.long}
                    onChange={(e) => setFormData({ ...formData, long: e.target.value })}
                    placeholder="98.85239"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-[#0d6efd]"
                  />
                </div>
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
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan Lokasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
