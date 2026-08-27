import React, { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import {
  useKnmpMutations,
  useRegionals,
  useProvinces,
  useRegencies,
  useDistricts,
  useSubDistricts,
} from "../hooks/useKnmp";
import type { Knmp } from "../types";

interface KnmpFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Knmp | null;
}

export const KnmpFormModal: React.FC<KnmpFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { create, update } = useKnmpMutations();

  const [name, setName] = useState("");
  const [jenisKnmp, setJenisKnmp] = useState<"existing" | "baru">("baru");
  const [status, setStatus] = useState<"aktif" | "nonaktif">("aktif");
  const [lat, setLat] = useState("");
  const [long, setLong] = useState("");

  const [regionalId, setRegionalId] = useState<number | undefined>(undefined);
  const [provinceId, setProvinceId] = useState<number | undefined>(undefined);
  const [regencyId, setRegencyId] = useState<number | undefined>(undefined);
  const [districtId, setDistrictId] = useState<number | undefined>(undefined);
  const [subDistrictId, setSubDistrictId] = useState<number | undefined>(undefined);

  const { data: regionals } = useRegionals();
  const { data: provinces } = useProvinces(regionalId);
  const { data: regencies } = useRegencies(provinceId);
  const { data: districts } = useDistricts(regencyId);
  const { data: subDistricts } = useSubDistricts(districtId);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setJenisKnmp(initialData.jenis_knmp);
      setStatus(initialData.status);
      setLat(initialData.lat || "");
      setLong(initialData.long || "");
      setRegionalId(initialData.regional_id);
      setProvinceId(initialData.province_id);
      setRegencyId(initialData.regency_id);
      setDistrictId(initialData.district_id);
      setSubDistrictId(initialData.sub_district_id);
    } else {
      setName("");
      setJenisKnmp("baru");
      setStatus("aktif");
      setLat("");
      setLong("");
      setRegionalId(undefined);
      setProvinceId(undefined);
      setRegencyId(undefined);
      setDistrictId(undefined);
      setSubDistrictId(undefined);
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Knmp> = {
      name,
      jenis_knmp: jenisKnmp,
      status,
      lat: lat || undefined,
      long: long || undefined,
      regional_id: regionalId,
      province_id: provinceId,
      regency_id: regencyId,
      district_id: districtId,
      sub_district_id: subDistrictId,
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
      title={initialData ? "Ubah Data Lokasi KNMP" : "Tambah Lokasi KNMP Baru"}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lokasi KNMP *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004B87]"
              placeholder="Contoh: KNMP Balongan Indramayu"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jenis KNMP *
            </label>
            <select
              value={jenisKnmp}
              onChange={(e) => setJenisKnmp(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004B87]"
            >
              <option value="baru">KNMP Baru</option>
              <option value="existing">KNMP Existing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Operasional
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004B87]"
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Non-Aktif</option>
            </select>
          </div>
        </div>

        {/* Cascading Geo Selects */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Lokasi Administrasi
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Regional</label>
              <select
                value={regionalId || ""}
                onChange={(e) => {
                  setRegionalId(e.target.value ? Number(e.target.value) : undefined);
                  setProvinceId(undefined);
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Pilih Regional...</option>
                {regionals?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Provinsi</label>
              <select
                value={provinceId || ""}
                disabled={!regionalId}
                onChange={(e) => {
                  setProvinceId(e.target.value ? Number(e.target.value) : undefined);
                  setRegencyId(undefined);
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
              >
                <option value="">Pilih Provinsi...</option>
                {provinces?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Kabupaten/Kota</label>
              <select
                value={regencyId || ""}
                disabled={!provinceId}
                onChange={(e) => {
                  setRegencyId(e.target.value ? Number(e.target.value) : undefined);
                  setDistrictId(undefined);
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
              >
                <option value="">Pilih Kabupaten/Kota...</option>
                {regencies?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.type} {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Kecamatan</label>
              <select
                value={districtId || ""}
                disabled={!regencyId}
                onChange={(e) => {
                  setDistrictId(e.target.value ? Number(e.target.value) : undefined);
                  setSubDistrictId(undefined);
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
              >
                <option value="">Pilih Kecamatan...</option>
                {districts?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Desa / Kelurahan</label>
              <select
                value={subDistrictId || ""}
                disabled={!districtId}
                onChange={(e) => setSubDistrictId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
              >
                <option value="">Pilih Desa / Kelurahan...</option>
                {subDistricts?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* GPS Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              placeholder="-6.123456"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
            <input
              type="text"
              value={long}
              onChange={(e) => setLong(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              placeholder="106.789012"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={create.isPending || update.isPending}>
            Simpan Lokasi
          </Button>
        </div>
      </form>
    </Modal>
  );
};
