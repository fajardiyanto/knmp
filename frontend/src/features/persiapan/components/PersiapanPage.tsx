import React, { useState } from "react";
import { Plus, FileText, Upload, Calendar, Building, CheckCircle } from "lucide-react";
import { usePersiapanList, usePersiapanMutations } from "../hooks/usePersiapan";
import { useKnmpList } from "../../knmp/hooks/useKnmp";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Modal } from "../../../components/ui/Modal";
import { formatDate } from "../../../lib/utils";
import type { Persiapan } from "../types";

export const PersiapanPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"kontrak" | "lapangan">("kontrak");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPersiapan, setSelectedPersiapan] = useState<Persiapan | null>(null);

  // Form states
  const [knmpId, setKnmpId] = useState<number | undefined>(undefined);
  const [nama, setNama] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const { data: persiapanList, isLoading } = usePersiapanList(activeTab);
  const { data: knmps } = useKnmpList();
  const { create } = usePersiapanMutations();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!knmpId) return;

    await create.mutateAsync({
      knmp_id: knmpId,
      nama,
      tanggal,
      jenis: activeTab,
      keterangan: keterangan || undefined,
    });

    setIsCreateOpen(false);
    setNama("");
    setTanggal("");
    setKeterangan("");
  };

  const standardFormsKontrak = [
    { code: "form_01_spmk", name: "Surat Perintah Mulai Kerja (SPMK)" },
    { code: "form_02_surat_perjanjian_kontrak", name: "Surat Perjanjian Kontrak" },
    { code: "form_03_surat_penyerahan_lapangan", name: "Surat Penyerahan Lapangan" },
    { code: "form_04_jadwal_pelaksanaan_pekerjaan", name: "Jadwal Pelaksanaan Pekerjaan" },
    { code: "form_05_jadwal_pengadaan_bahan", name: "Jadwal Pengadaan Bahan" },
    { code: "form_06_jadwal_pengadaan_peralatan", name: "Jadwal Pengadaan Peralatan" },
    { code: "form_07_jadwal_tenaga_kerja", name: "Jadwal Tenaga Kerja" },
    { code: "form_08_metode_pelaksanaan", name: "Metode Pelaksanaan Pekerjaan" },
    { code: "form_09_organisasi_kerja", name: "Struktur Organisasi Kerja" },
    { code: "form_10_rencana_k3", name: "Rencana Keselamatan Konstruksi (K3)" },
    { code: "form_11_surat_permohonan_pcm", name: "Surat Permohonan PCM" },
  ];

  const standardFormsLapangan = [
    { code: "form_13_ba_pcm", name: "Berita Acara Pre-Construction Meeting (BA PCM)" },
    { code: "form_14_ba_mc_0", name: "Berita Acara Mutual Check 0% (MC-0)" },
    { code: "form_15_laporan_mobilisasi", name: "Laporan Mobilisasi Peralatan & Personil" },
  ];

  const currentStandardForms = activeTab === "kontrak" ? standardFormsKontrak : standardFormsLapangan;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Fase Persiapan Proyek</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola dokumen administrasi kontrak kerja, MC-0, dan mobilisasi lapangan
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>Tambah Dokumen Persiapan</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("kontrak")}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
            activeTab === "kontrak"
              ? "border-[#004B87] text-[#004B87]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Persiapan Kontrak (11 Formulir)
        </button>
        <button
          onClick={() => setActiveTab("lapangan")}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
            activeTab === "lapangan"
              ? "border-[#004B87] text-[#004B87]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Persiapan Lapangan & Mobilisasi
        </button>
      </div>

      {/* List / Cards */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Memuat data persiapan...</div>
        ) : persiapanList?.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            Belum ada berkas persiapan {activeTab} yang dibuat.
          </div>
        ) : (
          persiapanList?.map((item) => (
            <Card key={item.id} className="hover:border-blue-300 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{item.nama}</span>
                    <Badge variant={activeTab === "kontrak" ? "primary" : "info"}>
                      {activeTab === "kontrak" ? "Kontrak" : "Lapangan"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {item.knmp_name || "Lokasi KNMP"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(item.tanggal)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPersiapan(item)}
                    className="gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Lihat Checklist Berkas ({item.documents?.length || 0})</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Checklist / Document Inspector Modal */}
      {selectedPersiapan && (
        <Modal
          isOpen={!!selectedPersiapan}
          onClose={() => setSelectedPersiapan(null)}
          title={`Checklist Formulir: ${selectedPersiapan.nama}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200">
              Lokasi: <span className="font-semibold text-slate-800">{selectedPersiapan.knmp_name}</span> &bull; Tanggal:{" "}
              <span className="font-semibold text-slate-800">{formatDate(selectedPersiapan.tanggal)}</span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {currentStandardForms.map((form) => {
                const uploadedDoc = selectedPersiapan.documents?.find((d) => d.category === form.code);

                return (
                  <div key={form.code} className="p-3 flex items-center justify-between hover:bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      {uploadedDoc ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{form.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{form.code}</p>
                      </div>
                    </div>

                    <div>
                      {uploadedDoc ? (
                        <a
                          href={uploadedDoc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#004B87] hover:underline"
                        >
                          Unduh Berkas
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Belum Diunggah</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={`Buat Berkas Persiapan ${activeTab === "kontrak" ? "Kontrak" : "Lapangan"}`}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Lokasi KNMP *</label>
            <select
              required
              value={knmpId || ""}
              onChange={(e) => setKnmpId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Pilih Titik KNMP...</option>
              {knmps?.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.regency_name || k.province_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Judul / Nama Berkas *</label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              placeholder="Contoh: Dokumen Persiapan Kontrak SPMK 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Dokumen *</label>
            <input
              type="date"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan / Keterangan</label>
            <textarea
              rows={3}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              placeholder="Tambahkan catatan khusus jika ada..."
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={create.isPending}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
