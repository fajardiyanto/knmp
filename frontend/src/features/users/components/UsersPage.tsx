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
        message: "Data pengguna berhasil diperbarui.",
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
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: UserItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      email: item.email,
      password: "",
      role: item.role_name || item.roles?.[0] || "Kontraktor",
      knmp_id: item.knmp_ids?.[0]?.toString() || "",
    });
    setIsModalOpen(true);
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
      {/* 1. Filter Bar - Matching Screenshot */}
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
              className="w-full pl-9 pr-3.5 py-2 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] placeholder:text-slate-400 text-slate-700"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Role Dropdown */}
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 text-[13.5px] bg-white border border-slate-200 rounded-xl outline-none text-slate-700 min-w-[140px]"
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
          className="px-4.5 py-2 text-[13.5px] font-semibold bg-[#0d6efd] text-white rounded-xl hover:bg-[#0b5ed7] transition-all flex items-center gap-2 shadow-xs shrink-0"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[480px] w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                {editingItem ? "Edit User" : "Tambah User"}
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
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all"
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
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all"
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
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] transition-all bg-white text-slate-700"
                  >
                    <option value="Wakil PPK">Wakil PPK</option>
                    <option value="PPK">PPK</option>
                    <option value="Pengawas">Pengawas</option>
                    <option value="Admin_ppk">Admin PPK</option>
                    <option value="Kontraktor">Kontraktor</option>
                  </select>
                </div>

                {/* KNMP */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    KNMP Assignment (Opsional)
                  </label>
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
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
