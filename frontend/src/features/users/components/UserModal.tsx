import React, { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { useUserMutations, useRoles } from "../hooks/useUsers";
import { useKnmpList } from "../../knmp/hooks/useKnmp";
import type { User } from "../../auth/types";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: User | null;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, initialData }) => {
  const { create, update } = useUserMutations();
  const { data: roles } = useRoles();
  const { data: knmps } = useKnmpList();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("kontraktor");
  const [selectedKnmpIds, setSelectedKnmpIds] = useState<number[]>([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email);
      setPassword("");
      setRole(initialData.roles?.[0] || "kontraktor");
      setSelectedKnmpIds(initialData.knmp_ids || []);
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRole("kontraktor");
      setSelectedKnmpIds([]);
    }
  }, [initialData, isOpen]);

  const toggleKnmpSelection = (id: number) => {
    if (selectedKnmpIds.includes(id)) {
      setSelectedKnmpIds(selectedKnmpIds.filter((kId) => kId !== id));
    } else {
      setSelectedKnmpIds([...selectedKnmpIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      email,
      password: password || undefined,
      role,
      knmp_ids: selectedKnmpIds,
    };

    if (initialData?.id) {
      await update.mutateAsync({ id: initialData.id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Ubah Akun Pengguna" : "Tambah Akun Pengguna Baru"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            placeholder="Mis. Bambang Sutrisno"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            placeholder="user@pertamina.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Kata Sandi {initialData ? "(Kosongkan jika tidak diubah)" : "*"}
          </label>
          <input
            type="password"
            required={!initialData}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Peran (Role) *</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white capitalize"
          >
            {roles?.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Assigned KNMPs */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Penugasan Wilayah Proyek KNMP
          </label>
          <p className="text-[11px] text-slate-500">
            Batasi hak akses input/verifikasi pengguna hanya pada titik terpilih. (Kosong = Akses Global)
          </p>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1">
            {knmps?.map((k) => (
              <label
                key={k.id}
                className="flex items-center gap-2 p-2 rounded bg-white border border-slate-200 text-xs text-slate-700 cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selectedKnmpIds.includes(k.id)}
                  onChange={() => toggleKnmpSelection(k.id)}
                  className="rounded text-[#004B87] focus:ring-[#004B87]"
                />
                <span className="font-medium">{k.name}</span>
                <span className="text-[10px] text-slate-400">({k.regency_name || k.province_name})</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={create.isPending || update.isPending}>
            Simpan Akun
          </Button>
        </div>
      </form>
    </Modal>
  );
};
