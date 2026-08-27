import React, { useState } from "react";
import { Camera } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { useIssueMutations } from "../hooks/useIssue";
import { useKnmpList } from "../../knmp/hooks/useKnmp";

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ isOpen, onClose }) => {
  const { create } = useIssueMutations();
  const { data: knmps } = useKnmpList();

  const [knmpId, setKnmpId] = useState<number | undefined>(undefined);
  const [kategori, setKategori] = useState("Keterlambatan Material");
  const [tingkat, setTingkat] = useState<"kritis" | "sedang" | "ringan">("sedang");
  const [uraian, setUraian] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!knmpId) return;

    const formData = new FormData();
    formData.append("knmp_id", knmpId.toString());
    formData.append("kategori_issue", kategori);
    formData.append("tingkat", tingkat);
    formData.append("uraian_masalah", uraian);
    photos.forEach((f) => formData.append("photos[]", f));

    await create.mutateAsync(formData);
    onClose();
    setUraian("");
    setPhotos([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lapor Kendala / Masalah Lapangan" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Lokasi KNMP *</label>
          <select
            required
            value={knmpId || ""}
            onChange={(e) => setKnmpId(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Pilih Titik KNMP...</option>
            {knmps?.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Kendala *</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="Keterlambatan Material">Keterlambatan Material</option>
              <option value="Faktor Cuaca Ekstrem">Faktor Cuaca Ekstrem</option>
              <option value="Sosial & Lahan Masyarakat">Sosial & Lahan Masyarakat</option>
              <option value="Kendala Teknis Bangunan">Kendala Teknis Bangunan</option>
              <option value="Tenaga Kerja">Tenaga Kerja</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat Urgensi *</label>
            <select
              value={tingkat}
              onChange={(e) => setTingkat(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
            >
              <option value="ringan">🟢 Ringan</option>
              <option value="sedang">🟡 Sedang</option>
              <option value="kritis">🔴 Kritis (Membutuhkan Intervensi)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Uraian Masalah *</label>
          <textarea
            required
            rows={3}
            value={uraian}
            onChange={(e) => setUraian(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            placeholder="Jelaskan detail masalah, dampak pada timeline, dan rencana mitigasi..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Foto Bukti Dokumentasi (Maks. 5 Foto)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) {
                setPhotos(Array.from(e.target.files).slice(0, 5));
              }
            }}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#004B87] hover:file:bg-blue-100"
          />
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={create.isPending}>
            Kirim Tiket Masalah
          </Button>
        </div>
      </form>
    </Modal>
  );
};
