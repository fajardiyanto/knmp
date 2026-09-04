import React, { useState } from "react";
import { Plus, CreditCard, DollarSign, PieChart, FileText, CheckCircle } from "lucide-react";
import {
  usePaymentsList,
  usePaymentsSummary,
  useTerminStats,
  usePaymentsMutations,
} from "../hooks/usePayments";
import { usePreparationList } from "../../preparation/hooks/usePreparation";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Modal } from "../../../components/ui/Modal";
import { formatCurrency, formatDate } from "../../../lib/utils";

export const PembayaranPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [persiapanKontrakId, setPersiapanKontrakId] = useState<number | undefined>(undefined);
  const [name, setName] = useState("");
  const [termin, setTermin] = useState("Termin 1 (30%)");
  const [realisasiAnggaran, setRealisasiAnggaran] = useState<number>(0);
  const [realisasiFisik, setRealisasiFisik] = useState<number>(30);
  const [norekPekerja, setNorekPekerja] = useState("");

  const { data: list, isLoading } = usePaymentsList();
  const { data: summary } = usePaymentsSummary();
  const { data: terminStats } = useTerminStats();
  const { data: persiapanKontraks } = usePreparationList("kontrak");
  const { create } = usePaymentsMutations();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!persiapanKontrakId) return;

    await create.mutateAsync({
      persiapan_kontrak_id: persiapanKontrakId,
      name,
      termin,
      realisasi_anggaran: realisasiAnggaran,
      realisasi_fisik: realisasiFisik,
      norek_pekerja: norekPekerja || undefined,
    });

    setIsCreateOpen(false);
    setName("");
    setRealisasiAnggaran(0);
    setNorekPekerja("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Keuangan & Pencairan Termin</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring penyerapan anggaran pembangunan dan pengajuan berkas pembayaran termin
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>Buat Pengajuan Pembayaran</span>
        </Button>
      </div>

      {/* Summary Widget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="bg-gradient-to-br from-[#004B87] to-slate-900 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-200 uppercase font-semibold">Total Anggaran Terserap</p>
              <h3 className="text-2xl font-bold mt-1">
                {formatCurrency(summary?.total_anggaran_terserap || 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-300" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-700 to-teal-900 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-200 uppercase font-semibold">Total Pengajuan Termin</p>
              <h3 className="text-2xl font-bold mt-1">{summary?.total_termin || 0} Pengajuan</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-300" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-700 to-slate-900 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-200 uppercase font-semibold">Kepatuhan 5 Dokumen Keuangan</p>
              <h3 className="text-2xl font-bold mt-1">100% Terverifikasi</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-indigo-300" />
            </div>
          </div>
        </Card>
      </div>

      {/* Termin List */}
      <Card title="Daftar Pengajuan Pencairan Termin" subtitle="Riwayat pencairan berdasarkan termin progres fisik">
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Nama Pengajuan & Kontrak</th>
                <th className="px-4 py-3">Termin</th>
                <th className="px-4 py-3">Realisasi Fisik</th>
                <th className="px-4 py-3">Realisasi Anggaran</th>
                <th className="px-4 py-3">No. Rekening</th>
                <th className="px-4 py-3">Tanggal Dibuat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Memuat data pembayaran...
                  </td>
                </tr>
              ) : list?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Belum ada pengajuan pembayaran termin.
                  </td>
                </tr>
              ) : (
                list?.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.persiapan_kontrak_name || "Kontrak"}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="primary">{p.termin}</Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-800">
                      {p.realisasi_fisik}%
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-700">
                      {formatCurrency(p.realisasi_anggaran)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                      {p.norek_pekerja || "-"}
                    </td>
                    <td className="px-4 py-3.5">{formatDate(p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Buat Pengajuan Pembayaran Termin">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Dokumen Kontrak *</label>
            <select
              required
              value={persiapanKontrakId || ""}
              onChange={(e) => setPersiapanKontrakId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Pilih Dokumen Kontrak...</option>
              {persiapanKontraks?.map((pk) => (
                <option key={pk.id} value={pk.id}>
                  {pk.nama} ({pk.knmp_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Pengajuan *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              placeholder="Contoh: Pengajuan Pembayaran Termin I - 30%"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Termin *</label>
              <select
                value={termin}
                onChange={(e) => setTermin(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="Uang Muka (20%)">Uang Muka (20%)</option>
                <option value="Termin 1 (30%)">Termin 1 (30%)</option>
                <option value="Termin 2 (50%)">Termin 2 (50%)</option>
                <option value="Termin 3 (75%)">Termin 3 (75%)</option>
                <option value="Pelunasan (100%)">Pelunasan (100%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Syarat Fisik (%)</label>
              <input
                type="number"
                step="0.1"
                value={realisasiFisik}
                onChange={(e) => setRealisasiFisik(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Anggaran (Rp) *</label>
            <input
              type="number"
              required
              value={realisasiAnggaran}
              onChange={(e) => setRealisasiAnggaran(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono text-emerald-700 font-bold"
              placeholder="500000000"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Rekening Penerima</label>
            <input
              type="text"
              value={norekPekerja}
              onChange={(e) => setNorekPekerja(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              placeholder="Mis. Bank Mandiri 123-00-1234567-8"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={create.isPending}>
              Simpan Pengajuan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
