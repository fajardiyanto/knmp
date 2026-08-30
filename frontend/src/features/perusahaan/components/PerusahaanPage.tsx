import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  User,
  Phone,
  Mail,
  CreditCard,
  ShieldCheck,
  Landmark,
  X,
  FileSignature,
  Award,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { useAlert } from "../../../context/AlertContext";
import { CompanyDetailModal, PerusahaanDetail } from "../../knmp/components/CompanyDetailModal";

interface PerusahaanItem {
  id: number;
  nama: string;
  alamat?: string;
  npwp?: string;
  nama_direktur?: string;
  jabatan_direktur?: string;
  no_telp?: string;
  email?: string;
  notaris_akta?: string;
  tanggal_akta?: string;
  no_akta?: string;
  nama_bank?: string;
  norek_bank?: string;
  cabang_bank?: string;
  nama_bank_jaminan?: string;
  no_jaminan?: string;
  tgl_jaminan?: string;
  no_kontrak?: string;
  nama_paket?: string;
  created_at: string;
}

export const PerusahaanPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useAlert();

  const [search, setSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPerusahaanId, setSelectedPerusahaanId] = useState<number | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PerusahaanItem | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    alamat: "",
    npwp: "",
    nama_direktur: "",
    jabatan_direktur: "Direktur",
    no_telp: "",
    email: "",
    notaris_akta: "",
    tanggal_akta: "",
    no_akta: "",
    nama_bank: "",
    norek_bank: "",
    cabang_bank: "",
    nama_bank_jaminan: "",
    no_jaminan: "",
    tgl_jaminan: "",
    no_kontrak: "",
    nama_paket: "",
  });

  // Fetch list of companies from DB
  const { data: rawPerusahaan, isLoading } = useQuery<any>({
    queryKey: ["perusahaans", search],
    queryFn: () =>
      apiFetch<any>(
        `/api/v1/perusahaan?search=${encodeURIComponent(search)}&per_page=100`
      ),
  });

  const allPerusahaan: PerusahaanItem[] = Array.isArray(rawPerusahaan)
    ? rawPerusahaan
    : Array.isArray(rawPerusahaan?.data)
    ? rawPerusahaan.data
    : [];

  // Extract distinct banks for filter
  const bankList = Array.from(
    new Set(allPerusahaan.map((p) => p.nama_bank).filter(Boolean) as string[])
  ).sort();

  // Client filtering
  const filteredData = allPerusahaan.filter((p) => {
    if (!p) return false;
    if (selectedBank && p.nama_bank !== selectedBank) return false;
    return true;
  });

  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / perPage) || 1;
  const startIndex = (page - 1) * perPage;
  const currentData = filteredData.slice(startIndex, startIndex + perPage);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      nama: "",
      alamat: "",
      npwp: "",
      nama_direktur: "",
      jabatan_direktur: "Direktur",
      no_telp: "",
      email: "",
      notaris_akta: "",
      tanggal_akta: "",
      no_akta: "",
      nama_bank: "",
      norek_bank: "",
      cabang_bank: "",
      nama_bank_jaminan: "",
      no_jaminan: "",
      tgl_jaminan: "",
      no_kontrak: "",
      nama_paket: "",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: PerusahaanItem) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama || "",
      alamat: item.alamat || "",
      npwp: item.npwp || "",
      nama_direktur: item.nama_direktur || "",
      jabatan_direktur: item.jabatan_direktur || "Direktur",
      no_telp: item.no_telp || "",
      email: item.email || "",
      notaris_akta: item.notaris_akta || "",
      tanggal_akta: item.tanggal_akta || "",
      no_akta: item.no_akta || "",
      nama_bank: item.nama_bank || "",
      norek_bank: item.norek_bank || "",
      cabang_bank: item.cabang_bank || "",
      nama_bank_jaminan: item.nama_bank_jaminan || "",
      no_jaminan: item.no_jaminan || "",
      tgl_jaminan: item.tgl_jaminan || "",
      no_kontrak: item.no_kontrak || "",
      nama_paket: item.nama_paket || "",
    });
    setIsFormModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (editingItem) {
        return apiFetch(`/api/v1/perusahaan/${editingItem.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      }
      return apiFetch("/api/v1/perusahaan", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perusahaans"] });
      setIsFormModalOpen(false);
      showAlert({
        type: "success",
        title: "Berhasil",
        message: editingItem ? "Data perusahaan berhasil diperbarui" : "Perusahaan baru berhasil ditambahkan",
      });
    },
    onError: (err: any) => {
      showAlert({
        type: "error",
        title: "Gagal Menyimpan",
        message: err.message || "Gagal menyimpan data perusahaan",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/perusahaan/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perusahaans"] });
      showAlert({
        type: "success",
        title: "Berhasil",
        message: "Data perusahaan berhasil dihapus",
      });
    },
    onError: (err: any) => {
      showAlert({
        type: "error",
        title: "Gagal Menghapus",
        message: err.message || "Gagal menghapus data perusahaan",
      });
    },
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0d6efd] dark:text-blue-400 border border-blue-100 dark:border-blue-900/60">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Daftar Perusahaan Rekanan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola master data rekanan penyedia jasa konstruksi, data direksi, NPWP, perbankan, dan legalitas kontrak.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Perusahaan</span>
          </button>
        </div>
      </div>

      {/* 2. Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Perusahaan
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {allPerusahaan.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">PT / CV</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Bank Penyalur
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {bankList.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">Mitra Bank</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Jaminan Pelaksanaan (5%)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {allPerusahaan.filter((p) => p.nama_bank_jaminan || p.no_jaminan).length}
            </span>
            <span className="text-xs font-semibold text-slate-500">Terverifikasi</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Kontrak Terdaftar
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {allPerusahaan.filter((p) => p.no_kontrak).length}
            </span>
            <span className="text-xs font-semibold text-slate-500">Paket SPMK</span>
          </div>
        </div>
      </div>

      {/* 3. Filter and Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari PT, Direktur, NPWP, Bank, atau No. Kontrak..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedBank}
              onChange={(e) => {
                setSelectedBank(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs sm:text-sm text-slate-700 dark:text-slate-300"
            >
              <option value="">Semua Bank</option>
              {bankList.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Tampilkan:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">No</th>
                <th className="py-3.5 px-4">Nama Perusahaan</th>
                <th className="py-3.5 px-4">Direktur / Pimpinan</th>
                <th className="py-3.5 px-4">NPWP</th>
                <th className="py-3.5 px-4">Kontak (Telp / Email)</th>
                <th className="py-3.5 px-4">Rekening Bank</th>
                <th className="py-3.5 px-4">No. Kontrak / SPMK</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                    Memuat daftar perusahaan rekanan...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                    Tidak ada data perusahaan ditemukan
                  </td>
                </tr>
              ) : (
                currentData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {startIndex + idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>{item.nama}</span>
                      </div>
                      {item.alamat && (
                        <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs truncate">
                          {item.alamat}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.nama_direktur || "-"}
                      </div>
                      <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {item.jabatan_direktur || "Direktur"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {item.npwp || "-"}
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      {item.no_telp && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.no_telp}</span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.email}</span>
                        </div>
                      )}
                      {!item.no_telp && !item.email && "-"}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.nama_bank || "-"}
                      </div>
                      <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block mt-0.5">
                        {item.norek_bank || "-"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        {item.no_kontrak || "-"}
                      </span>
                      {item.nama_paket && (
                        <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block max-w-xs truncate mt-0.5">
                          {item.nama_paket}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPerusahaanId(item.id);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Lihat Detail Profil & Legalitas"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Perusahaan"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            showConfirm({
                              title: "Hapus Perusahaan",
                              message: `Apakah Anda yakin ingin menghapus data rekanan "${item.nama}"?`,
                              confirmText: "Hapus",
                              isDestructive: true,
                              onConfirm: () => deleteMutation.mutate(item.id),
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Hapus Perusahaan"
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

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Menampilkan {totalRecords === 0 ? 0 : startIndex + 1} s/d {Math.min(startIndex + perPage, totalRecords)} dari {totalRecords} perusahaan
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium"
            >
              Sebelumnya
            </button>
            <span className="px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-200">
              Halaman {page} dari {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium"
            >
              Selanjutnya
            </button>
          </div>
        </div>

      </div>

      {/* Detail Modal */}
      <CompanyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPerusahaanId(null);
        }}
        perusahaanId={selectedPerusahaanId || undefined}
      />

      {/* Add / Edit Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingItem ? "Edit Data Perusahaan Rekanan" : "Tambah Perusahaan Rekanan Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Perusahaan / Rekanan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: PT. Laksana Aneka Sarana"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Direktur / Pimpinan
                  </label>
                  <input
                    type="text"
                    value={formData.nama_direktur}
                    onChange={(e) => setFormData({ ...formData, nama_direktur: e.target.value })}
                    placeholder="Nama Lengkap Direktur"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan Pimpinan
                  </label>
                  <input
                    type="text"
                    value={formData.jabatan_direktur}
                    onChange={(e) => setFormData({ ...formData, jabatan_direktur: e.target.value })}
                    placeholder="Direktur / Kuasa Direktur"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NPWP Perusahaan
                  </label>
                  <input
                    type="text"
                    value={formData.npwp}
                    onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                    placeholder="01.707.370.1-404.000"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. Telepon / HP
                  </label>
                  <input
                    type="text"
                    value={formData.no_telp}
                    onChange={(e) => setFormData({ ...formData, no_telp: e.target.value })}
                    placeholder="08129674773"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Kantor
                  </label>
                  <textarea
                    rows={2}
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    placeholder="Alamat lengkap kantor pusat..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Penyalur
                  </label>
                  <input
                    type="text"
                    value={formData.nama_bank}
                    onChange={(e) => setFormData({ ...formData, nama_bank: e.target.value })}
                    placeholder="Bank Mandiri / BRI / BSI"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    value={formData.norek_bank}
                    onChange={(e) => setFormData({ ...formData, norek_bank: e.target.value })}
                    placeholder="71216000062 A.n PT..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Kontrak / SPMK
                  </label>
                  <input
                    type="text"
                    value={formData.no_kontrak}
                    onChange={(e) => setFormData({ ...formData, no_kontrak: e.target.value })}
                    placeholder="B.21952/DJPT.6/PI.420/PPK/VIII/2026"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Jaminan Pelaksanaan
                  </label>
                  <input
                    type="text"
                    value={formData.nama_bank_jaminan}
                    onChange={(e) => setFormData({ ...formData, nama_bank_jaminan: e.target.value })}
                    placeholder="Bank Garansi (5%)"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-xl font-semibold shadow-xs"
                >
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan Perusahaan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
