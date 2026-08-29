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
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { useAlert } from "../../../context/AlertContext";

interface UserItem {
  id: number;
  name: string;
  email: string;
  role_name?: string;
  knmp_name?: string;
  roles?: string[];
  permissions?: string[];
  knmp_ids?: number[];
}

interface RoleOption {
  id: number;
  name: string;
}

interface KnmpOption {
  id: number;
  name: string;
}

export interface MenuItemOption {
  key: string;
  name: string;
  category: "UTAMA" | "PROGRAM" | "KEUANGAN" | "MODULE" | "MASTER & SETTING";
  description: string;
}

export const AVAILABLE_MENUS: MenuItemOption[] = [
  // UTAMA
  { key: "dashboard", name: "Dashboard", category: "UTAMA", description: "Halaman ringkasan eksekutif & progres" },
  { key: "chat", name: "Chat & Komunikasi", category: "UTAMA", description: "Fitur perpesanan & koordinasi tim" },
  { key: "knmp_read", name: "Lokasi KNMP", category: "UTAMA", description: "Peta sebaran & master titik KNMP" },

  // PROGRAM
  { key: "kontrak_read", name: "Contract Readiness", category: "PROGRAM", description: "Persiapan kontrak & administrasi" },
  { key: "pcm_read", name: "PCM", category: "PROGRAM", description: "Pre-Construction Meeting" },
  { key: "lapangan_read", name: "Mobilization Report", category: "PROGRAM", description: "Persiapan & mobilisasi lapangan" },
  { key: "pelaksanaan_read", name: "Pelaksanaan Konstruksi", category: "PROGRAM", description: "Laporan harian & konstruksi fisik" },
  { key: "laporan_read", name: "Laporan Progres", category: "PROGRAM", description: "Rekapitulasi berkala" },
  { key: "pho_read", name: "PHO", category: "PROGRAM", description: "Serah terima pertama pekerjaan" },
  { key: "pemeliharaan_read", name: "Pemeliharaan", category: "PROGRAM", description: "Masa retensi / pemeliharaan" },
  { key: "fho_read", name: "FHO", category: "PROGRAM", description: "Serah terima akhir pekerjaan" },

  // KEUANGAN
  { key: "anggaran_read", name: "Total Anggaran", category: "KEUANGAN", description: "Total pagu & realisasi biaya" },
  { key: "termin_read", name: "Termin Pembayaran", category: "KEUANGAN", description: "Pengajuan & riwayat termin" },

  // MODULE
  { key: "absensi_read", name: "Absensi", category: "MODULE", description: "Kehadiran tenaga kerja harian" },
  { key: "issue_read", name: "Kendala & Issue", category: "MODULE", description: "Pencatatan masalah & eskalasi" },

  // MASTER & SETTING
  { key: "user_read", name: "Manajemen User", category: "MASTER & SETTING", description: "Pengelolaan user & hak akses" },
  { key: "periode_read", name: "Periode Anggaran", category: "MASTER & SETTING", description: "Tahun & master periode anggaran" },
  { key: "jenis_bangunan_read", name: "Jenis Bangunan", category: "MASTER & SETTING", description: "Master struktur bangunan fisik" },
];

export const DEFAULT_ROLE_MENUS: Record<string, string[]> = {
  superadmin: AVAILABLE_MENUS.map((m) => m.key),
  "super admin": AVAILABLE_MENUS.map((m) => m.key),
  Admin_ppk: AVAILABLE_MENUS.map((m) => m.key),
  PPK: [
    "dashboard",
    "chat",
    "knmp_read",
    "kontrak_read",
    "pcm_read",
    "lapangan_read",
    "pelaksanaan_read",
    "laporan_read",
    "pho_read",
    "pemeliharaan_read",
    "fho_read",
    "anggaran_read",
    "termin_read",
    "absensi_read",
    "issue_read",
  ],
  "Wakil PPK": [
    "dashboard",
    "chat",
    "knmp_read",
    "kontrak_read",
    "pcm_read",
    "lapangan_read",
    "pelaksanaan_read",
    "laporan_read",
    "pho_read",
    "pemeliharaan_read",
    "fho_read",
    "anggaran_read",
    "termin_read",
    "absensi_read",
    "issue_read",
  ],
  Pengawas: [
    "dashboard",
    "chat",
    "knmp_read",
    "kontrak_read",
    "pcm_read",
    "lapangan_read",
    "pelaksanaan_read",
    "laporan_read",
    "pho_read",
    "pemeliharaan_read",
    "fho_read",
    "absensi_read",
    "issue_read",
  ],
  Kontraktor: [
    "dashboard",
    "chat",
    "kontrak_read",
    "lapangan_read",
    "pelaksanaan_read",
    "laporan_read",
    "anggaran_read",
    "termin_read",
    "absensi_read",
    "issue_read",
  ],
};

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useAlert();

  // Filters
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Kontraktor",
    knmp_id: "",
    permissions: DEFAULT_ROLE_MENUS["Kontraktor"] || [],
  });

  // 1. Fetch Users List
  const { data: usersList = [], isLoading } = useQuery<UserItem[]>({
    queryKey: ["users-list"],
    queryFn: async () => {
      const res = await apiFetch<UserItem[]>("/api/v1/users");
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

  // 3. Fetch Roles Options
  const { data: roleOptions = [] } = useQuery<RoleOption[]>({
    queryKey: ["role-options"],
    queryFn: async () => {
      try {
        const res = await apiFetch<RoleOption[]>("/api/v1/roles");
        return Array.isArray(res) ? res : [];
      } catch {
        return [
          { id: 1, name: "Wakil PPK" },
          { id: 2, name: "PPK" },
          { id: 3, name: "Pengawas" },
          { id: 4, name: "Admin_ppk" },
          { id: 5, name: "Kontraktor" },
        ];
      }
    },
  });

  // Save / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const body: any = {
        name: payload.name,
        email: payload.email,
        role: payload.role,
        knmp_ids: payload.knmp_id ? [Number(payload.knmp_id)] : [],
        permissions: payload.permissions,
      };
      if (payload.password) {
        body.password = payload.password;
      }

      if (editingItem) {
        return apiFetch(`/api/v1/users/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      return apiFetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      setIsModalOpen(false);
      setEditingItem(null);
      showAlert({
        title: "Berhasil Disimpan",
        message: "Data pengguna dan konfigurasi menu berhasil diperbarui.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menyimpan",
        message: err.message || "Gagal menyimpan data pengguna.",
        type: "error",
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      showAlert({
        title: "Berhasil Dihapus",
        message: "Data pengguna berhasil dihapus.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menghapus",
        message: err.message || "Gagal menghapus data pengguna.",
        type: "error",
      });
    },
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "Kontraktor",
      knmp_id: "",
      permissions: DEFAULT_ROLE_MENUS["Kontraktor"] || [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: UserItem) => {
    setEditingItem(item);
    const role = item.role_name || item.roles?.[0] || "Kontraktor";
    const initialPermissions =
      item.permissions && item.permissions.length > 0
        ? item.permissions
        : DEFAULT_ROLE_MENUS[role] || DEFAULT_ROLE_MENUS["Kontraktor"] || [];

    setFormData({
      name: item.name,
      email: item.email,
      password: "",
      role: role,
      knmp_id: item.knmp_ids?.[0]?.toString() || "",
      permissions: initialPermissions,
    });
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permKey: string) => {
    setFormData((prev) => {
      const current = prev.permissions;
      if (current.includes(permKey)) {
        return { ...prev, permissions: current.filter((p) => p !== permKey) };
      } else {
        return { ...prev, permissions: [...current, permKey] };
      }
    });
  };

  const handleSelectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: AVAILABLE_MENUS.map((m) => m.key),
    }));
  };

  const handleDeselectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  };

  const handleResetToRolePermissions = (roleName?: string) => {
    const targetRole = roleName || formData.role;
    const defaults = DEFAULT_ROLE_MENUS[targetRole] || DEFAULT_ROLE_MENUS["Kontraktor"] || [];
    setFormData((prev) => ({
      ...prev,
      permissions: [...defaults],
    }));
  };

  // Filter calculations
  const safeUsers = Array.isArray(usersList) ? usersList : [];
  const filteredData = safeUsers.filter((item) => {
    const matchSearch =
      search === "" ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase()) ||
      item.knmp_name?.toLowerCase().includes(search.toLowerCase());

    const itemRole = item.role_name || item.roles?.[0] || "";
    const matchRole =
      selectedRole === "" || itemRole.toLowerCase() === selectedRole.toLowerCase();

    return matchSearch && matchRole;
  });

  // Pagination
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / perPage) || 1;
  const startIndex = (page - 1) * perPage;
  const currentData = filteredData.slice(startIndex, startIndex + perPage);

  const getRoleBadge = (roleName?: string) => {
    const r = (roleName || "Kontraktor").toLowerCase();
    if (r.includes("wakil")) {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
          Wakil PPK
        </span>
      );
    }
    if (r === "ppk") {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
          PPK
        </span>
      );
    }
    if (r.includes("pengawas")) {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
          Pengawas
        </span>
      );
    }
    if (r.includes("admin")) {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
          Admin_ppk
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-600 border border-teal-200">
        Kontraktor
      </span>
    );
  };

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* 1. Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:min-w-[180px] lg:max-w-[240px]">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="w-full pl-9 pr-3.5 py-2.5 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] transition-all placeholder:text-slate-400 text-slate-700"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          </div>

          {/* Role Dropdown */}
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            className="w-full lg:w-auto px-3.5 py-2.5 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none text-slate-700 sm:min-w-[140px]"
          >
            <option value="">Role</option>
            <option value="Wakil PPK">Wakil PPK</option>
            <option value="PPK">PPK</option>
            <option value="Pengawas">Pengawas</option>
            <option value="Admin_ppk">Admin PPK</option>
            <option value="Kontraktor">Kontraktor</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-4.5 py-2.5 text-[13px] sm:text-[13.5px] font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah User</span>
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
            <thead className="bg-slate-50/80 border-b border-slate-200/90 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4 text-center w-14">No</th>
                <th className="py-4 px-5 min-w-[200px]">Nama User</th>
                <th className="py-4 px-5 min-w-[220px]">Email</th>
                <th className="py-4 px-5 min-w-[180px]">KNMP</th>
                <th className="py-4 px-4 text-center min-w-[140px]">Role</th>
                <th className="py-4 px-5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13.5px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    Memuat data user...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    Tidak ada data user ditemukan
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
                      <td className="py-4 px-5 text-slate-600 font-mono text-xs">
                        {item.email}
                      </td>
                      <td className="py-4 px-5 text-slate-600">
                        {item.knmp_name && item.knmp_name !== "-" ? item.knmp_name : ""}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getRoleBadge(item.role_name || item.roles?.[0])}
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
                                title: "Hapus Pengguna",
                                message: `Apakah Anda yakin ingin menghapus user "${item.name}"? Tindakan ini tidak dapat dibatalkan.`,
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

      {/* Modal Tambah / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-[720px] w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 shrink-0 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">
                  {editingItem ? "Edit User & Akses Menu" : "Tambah User & Akses Menu"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Atur informasi akun pengguna dan pilih menu apa saja yang dapat tampil di user tersebut.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(formData);
              }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1 custom-scrollbar">
                {/* User Info Section */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3366ff]" />
                    Informasi Akun & Peran
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Nama User */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-800">
                        Nama User <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Masukkan nama lengkap"
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all bg-white"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-800">
                        Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="nama@email.com"
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all bg-white"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-800">
                        Password {editingItem && <span className="text-slate-400 font-normal">(kosongkan jika tidak diubah)</span>}
                      </label>
                      <input
                        type="password"
                        required={!editingItem}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all bg-white"
                      />
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-800">
                        Role <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setFormData({
                            ...formData,
                            role: newRole,
                            permissions: DEFAULT_ROLE_MENUS[newRole] || formData.permissions,
                          });
                        }}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700 font-medium"
                      >
                        <option value="Wakil PPK">Wakil PPK</option>
                        <option value="PPK">PPK</option>
                        <option value="Pengawas">Pengawas</option>
                        <option value="Admin_ppk">Admin PPK</option>
                        <option value="Kontraktor">Kontraktor</option>
                      </select>
                    </div>

                    {/* KNMP */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-800">
                        Penugasan Titik KNMP (Opsional)
                      </label>
                      <select
                        value={formData.knmp_id}
                        onChange={(e) => setFormData({ ...formData, knmp_id: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                      >
                        <option value="">-- Bebas / Tanpa Khusus Titik --</option>
                        {knmpOptions.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Menu Access Selection Section */}
                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Pilih Menu yang Tampil di User
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold text-[10px] rounded-full border border-blue-200/60">
                          {formData.permissions.length} dari {AVAILABLE_MENUS.length} Menu Aktif
                        </span>
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSelectAllPermissions}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#3366ff] hover:bg-blue-50 rounded-md border border-blue-200 transition-colors"
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetToRolePermissions()}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
                      >
                        Default Role
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllPermissions}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-md border border-rose-200 transition-colors"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>

                  {/* Menu Groups */}
                  {(["UTAMA", "PROGRAM", "KEUANGAN", "MODULE", "MASTER & SETTING"] as const).map(
                    (category) => {
                      const categoryMenus = AVAILABLE_MENUS.filter((m) => m.category === category);
                      if (categoryMenus.length === 0) return null;

                      return (
                        <div key={category} className="space-y-2">
                          <span className="text-[10.5px] font-bold text-slate-500 tracking-wider uppercase">
                            {category}
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {categoryMenus.map((menu) => {
                              const isChecked = formData.permissions.includes(menu.key);

                              return (
                                <label
                                  key={menu.key}
                                  onClick={() => handleTogglePermission(menu.key)}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                    isChecked
                                      ? "bg-blue-50/50 border-blue-300/80 shadow-2xs"
                                      : "bg-white border-slate-200/80 hover:bg-slate-50 opacity-75"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}} // Handled by container click
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#3366ff] focus:ring-[#3366ff] cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <span
                                        className={`font-semibold text-xs truncate ${
                                          isChecked ? "text-blue-900" : "text-slate-700"
                                        }`}
                                      >
                                        {menu.name}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                                      {menu.description}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="px-6 py-3.5 border-t border-slate-200/80 flex items-center justify-end gap-2.5 bg-slate-50/70 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#3366ff] hover:bg-[#2554d7] rounded-lg transition-colors shadow-xs flex items-center gap-2"
                >
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan User & Akses Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
