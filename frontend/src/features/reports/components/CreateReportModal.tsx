import React, { useState } from "react";
import { Plus, Trash2, Camera, AlertCircle } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { useReportsMutations } from "../hooks/useReports";
import { useExecutionList } from "../../execution/hooks/useExecution";
import { useJenisBangunans } from "../../knmp/hooks/useKnmp";
import { useAlert } from "../../../context/AlertContext";

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BuildingDetailInput {
  jenis_bangunan_id: number;
  rencana_progres_fisik: number;
  realisasi_progres_fisik: number;
  keterangan: string;
  photos: File[];
}

export const CreateReportModal: React.FC<CreateReportModalProps> = ({ isOpen, onClose }) => {
  const { showAlert } = useAlert();
  const { createMobile } = useReportsMutations();
  const { data: pelaksanaans } = useExecutionList();
  const { data: jenisBangunans } = useJenisBangunans();

  const [pelaksanaanId, setPelaksanaanId] = useState<number | undefined>(undefined);
  const [nama, setNama] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [jenisLaporan, setJenisLaporan] = useState<"harian" | "mingguan" | "bulanan">("harian");
  const [keberapa, setKeberapa] = useState<number | undefined>(1);
  const [cuaca, setCuaca] = useState("cerah");
  const [jumlahTenagaKerja, setJumlahTenagaKerja] = useState<number>(10);
  const [lat, setLat] = useState("");
  const [long, setLong] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const [details, setDetails] = useState<BuildingDetailInput[]>([
    {
      jenis_bangunan_id: 1,
      rencana_progres_fisik: 40.0,
      realisasi_progres_fisik: 39.5,
      keterangan: "Pemasangan atap dan rangka",
      photos: [],
    },
  ]);

  const addDetailRow = () => {
    const defaultJbId = jenisBangunans?.[0]?.id || 1;
    setDetails([
      ...details,
      {
        jenis_bangunan_id: defaultJbId,
        rencana_progres_fisik: 0,
        realisasi_progres_fisik: 0,
        keterangan: "",
        photos: [],
      },
    ]);
  };

  const removeDetailRow = (index: number) => {
    if (details.length <= 1) return;
    setDetails(details.filter((_, idx) => idx !== index));
  };

  const updateDetail = (index: number, field: keyof BuildingDetailInput, value: any) => {
    const updated = [...details];
    updated[index] = { ...updated[index], [field]: value };
    setDetails(updated);
  };

  const handlePhotoChange = (index: number, files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files).slice(0, 5); // max 5
    updateDetail(index, "photos", fileArray);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelaksanaanId) {
      showAlert({
        title: "Pilih Proyek Pelaksanaan",
        message: "Silakan pilih proyek pelaksanaan terlebih dahulu sebelum menyimpan laporan.",
        type: "warning",
      });
      return;
    }

    const formData = new FormData();
    formData.append("pelaksanaan_id", pelaksanaanId.toString());
    formData.append("nama", nama);
    formData.append("tanggal", tanggal);
    formData.append("jenis_laporan", jenisLaporan);
    if (keberapa) formData.append("keberapa", keberapa.toString());
    formData.append("cuaca", cuaca);
    formData.append("jumlah_tenaga_kerja", jumlahTenagaKerja.toString());
    if (lat) formData.append("lat", lat);
    if (long) formData.append("long", long);
    if (keterangan) formData.append("keterangan", keterangan);

    // Format indexed array fields for backend
    details.forEach((d, idx) => {
      formData.append(`jenis_bangunan_details[${idx}][jenis_bangunan_id]`, d.jenis_bangunan_id.toString());
      formData.append(`jenis_bangunan_details[${idx}][rencana_progres_fisik]`, d.rencana_progres_fisik.toString());
      formData.append(`jenis_bangunan_details[${idx}][realisasi_progres_fisik]`, d.realisasi_progres_fisik.toString());
      if (d.keterangan) {
        formData.append(`jenis_bangunan_details[${idx}][keterangan]`, d.keterangan);
      }
      d.photos.forEach((file) => {
        formData.append(`jenis_bangunan_details[${idx}][photos][]`, file);
      });
    });

    await createMobile.mutateAsync(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buat Laporan Progres Fisik" maxWidth="3xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Main Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Proyek Pelaksanaan *
            </label>
            <select
              required
              value={pelaksanaanId || ""}
              onChange={(e) => setPelaksanaanId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Pilih Proyek Pelaksanaan...</option>
              {pelaksanaans?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({p.knmp_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jenis Laporan *
            </label>
            <select
              value={jenisLaporan}
              onChange={(e) => setJenisLaporan(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="harian">Laporan Harian</option>
              <option value="mingguan">Laporan Mingguan</option>
              <option value="bulanan">Laporan Bulanan</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Laporan *
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              placeholder="Contoh: Laporan Harian Pekerjaan 26 Agustus"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Laporan *
            </label>
            <input
              type="date"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi Cuaca</label>
            <select
              value={cuaca}
              onChange={(e) => setCuaca(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="cerah">☀️ Cerah</option>
              <option value="berawan">⛅ Berawan</option>
              <option value="mendung">☁️ Mendung</option>
              <option value="hujan">🌧️ Hujan</option>
              <option value="badai">⛈️ Badai</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jumlah Tenaga Kerja (Orang)
            </label>
            <input
              type="number"
              min={0}
              value={jumlahTenagaKerja}
              onChange={(e) => setJumlahTenagaKerja(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Urutan Ke-</label>
            <input
              type="number"
              min={1}
              value={keberapa || ""}
              onChange={(e) => setKeberapa(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              placeholder="Mis. Minggu ke-3"
            />
          </div>
        </div>

        {/* Building Details Table with Deviation Calculation */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Rincian Progres Fisik Per Jenis Bangunan
              </h4>
              <p className="text-[11px] text-slate-500">
                Kalkulasi otomatis deviasi fisik: Realisasi (%) - Rencana (%)
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addDetailRow} className="gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Item Bangunan</span>
            </Button>
          </div>

          <div className="space-y-3">
            {details.map((item, idx) => {
              const deviasi = Number((item.realisasi_progres_fisik - item.rencana_progres_fisik).toFixed(2));

              return (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-700">Item #{idx + 1}</span>
                    {details.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDetailRow(idx)}
                        className="text-red-500 hover:text-red-700 text-xs p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Jenis Bangunan *
                      </label>
                      <select
                        value={item.jenis_bangunan_id}
                        onChange={(e) => updateDetail(idx, "jenis_bangunan_id", Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        {jenisBangunans?.map((jb) => (
                          <option key={jb.id} value={jb.id}>
                            {jb.nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Rencana (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.rencana_progres_fisik}
                        onChange={(e) =>
                          updateDetail(idx, "rencana_progres_fisik", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Realisasi (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.realisasi_progres_fisik}
                        onChange={(e) =>
                          updateDetail(idx, "realisasi_progres_fisik", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">Deviasi Fisik:</span>
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                          deviasi >= 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {deviasi > 0 ? `+${deviasi}%` : `${deviasi}%`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#004B87] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Upload Foto ({item.photos.length}/5)</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handlePhotoChange(idx, e.target.files)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={createMobile.isPending}>
            Kirim Laporan Progres
          </Button>
        </div>
      </form>
    </Modal>
  );
};
