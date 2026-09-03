import React from "react";
import { Printer, X } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export interface LaporanHarianData {
  tanggal: string;
  hari: string;
  minggu_ke: string | number;
  cuaca: string;
  identitas: {
    paket_pekerjaan: string;
    lokasi: string;
    jenis_titik: "HUB" | "PENYANGGA";
    no_kontrak_spmk: string;
    kontraktor: string;
    pengawas_ppk: string;
    sisa_waktu_hari: number | string;
    progres_harian_pct: number | string;
  };
  checklist_fasilitas: Array<{
    no: number;
    fasilitas: string;
    lingkup: "Ya" | "N/A";
    status: "Belum" | "Proses" | "Selesai";
    catatan?: string;
  }>;
  detail_boq: Array<{
    no: number;
    kode_boq: string;
    area: string;
    uraian: string;
    satuan: string;
    vol_kontrak: number | string;
    renc_hari: number | string;
    realisasi: number | string;
    kum_sd_hari: number | string;
    bukti: string;
  }>;
  aspek_k3_kendala: Array<{
    no: number;
    aspek: string;
    catatan: string;
    dampak: string;
    tindak_lanjut: string;
    pic_target: string;
  }>;
  dokumentasi_foto: Array<{
    slot: number;
    file_url?: string;
    file_name?: string;
    kode_boq_area?: string;
    tanggal?: string;
    keterangan?: string;
  }>;
  pengesahan: {
    pembuat_nama: string;
    pembuat_tanggal: string;
    pemeriksa_nama: string;
    pemeriksa_tanggal: string;
    penyetuju_nama: string;
    penyetuju_tanggal: string;
  };
}

export const DEFAULT_8_FASILITAS_HARIAN = [
  "Dermaga/tambatan",
  "Gudang beku/cold storage",
  "Pabrik es/sarana dingin",
  "Shelter pendaratan ikan",
  "Sentra/pasar/pengolahan ikan",
  "Bengkel kapal/jaring",
  "SPBN/SPBUN",
  "Kantor pengelola/kios/logistik",
];

export const DEFAULT_5_ASPEK_HARIAN = [
  "Mutu/QC/ukur",
  "K3/SMKK",
  "Lingkungan/cuaca",
  "Kendala/instruksi",
  "Rencana besok",
];

interface FormatHarianPrintViewProps {
  data: LaporanHarianData;
  isEmbedded?: boolean;
  onClose?: () => void;
}

export const FormatHarianPrintView: React.FC<FormatHarianPrintViewProps> = ({
  data,
  isEmbedded = false,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const sheetContent = (
    <div className="w-full max-w-[210mm] bg-white shadow-2xl print:shadow-none print:max-w-none text-slate-900 text-[11px] leading-tight font-sans mx-auto">
      {/* ================= HALAMAN 1 ================= */}
      <div className="min-h-[297mm] p-8 sm:p-10 flex flex-col justify-between border-b border-slate-300 print:border-none print:min-h-screen">
        <div>
          {/* Header / Kop Resmi */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_of_Ministry_of_Maritime_Affairs_and_Fisheries_of_the_Republic_of_Indonesia.svg"
                alt="Logo KKP"
                className="h-14 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div>
                <h2 className="text-xs font-black tracking-wider text-slate-900 uppercase">
                  KEMENTERIAN KELAUTAN DAN PERIKANAN
                </h2>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  DIREKTORAT JENDERAL PERIKANAN TANGKAP
                </p>
                <p className="text-[9px] text-slate-500 font-medium">
                  Program Kampung Nelayan Merah Putih (KNMP)
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-blue-200 bg-blue-50 text-blue-800">
                Formulir Resmi KKP
              </span>
            </div>
          </div>

          {/* Judul & Parameter Subheader */}
          <div className="text-center mb-3">
            <h1 className="text-sm font-black uppercase tracking-wide text-slate-900">
              FORMAT LAPORAN HARIAN KONSTRUKSI KNMP
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs font-semibold text-slate-700">
              <span>Tanggal: <strong className="text-slate-900">{data.tanggal || "-"}</strong></span>
              <span>Hari: <strong className="text-slate-900">{data.hari || "-"}</strong></span>
              <span>Minggu ke-: <strong className="text-slate-900">{data.minggu_ke || "-"}</strong></span>
              <span>Cuaca / pasang-surut: <strong className="text-slate-900">{data.cuaca || "Cerah"}</strong></span>
            </div>
          </div>

          {/* 1. Identitas dan Acuan */}
          <div className="mb-3.5">
            <h3 className="font-bold text-xs text-slate-900 mb-1">1. Identitas dan Acuan</h3>
            <table className="w-full border-collapse border border-slate-700 text-[10.5px]">
              <tbody>
                <tr>
                  <td className="border border-slate-600 bg-slate-100 p-1.5 font-bold w-[18%]">Paket pekerjaan</td>
                  <td className="border border-slate-600 p-1.5 w-[32%]">{data.identitas?.paket_pekerjaan || "-"}</td>
                  <td className="border border-slate-600 bg-slate-100 p-1.5 font-bold w-[18%]">Lokasi</td>
                  <td className="border border-slate-600 p-1.5 w-[32%]">{data.identitas?.lokasi || "-"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-600 bg-slate-100 p-1.5 font-bold">Jenis titik</td>
                  <td className="border border-slate-600 p-1.5">
                    <span className="inline-flex items-center gap-4">
                      <span>[{data.identitas?.jenis_titik === "HUB" ? " ✔ " : "   "}] HUB</span>
                      <span>[{data.identitas?.jenis_titik === "PENYANGGA" ? " ✔ " : "   "}] PENYANGGA</span>
                    </span>
                  </td>
                  <td className="border border-slate-600 bg-slate-100 p-1.5 font-bold">No. kontrak/SPMK</td>
                  <td className="border border-slate-600 p-1.5">{data.identitas?.no_kontrak_spmk || "-"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-600 bg-slate-100 p-1.5 font-bold">Kontraktor</td>
                  <td className="border border-slate-600 p-1.5">{data.identitas?.kontraktor || "-"}</td>
                  <td className="border border-slate-600 bg-slate-100 p-1.5 font-bold">Pengawas/PPK</td>
                  <td className="border border-slate-600 p-1.5">{data.identitas?.pengawas_ppk || "-"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-600 bg-slate-100 p-1.5 font-bold">Sisa waktu</td>
                  <td className="border border-slate-600 p-1.5 font-bold text-slate-800">
                    {data.identitas?.sisa_waktu_hari ?? "-"} hari
                  </td>
                  <td className="border border-slate-600 bg-slate-100 p-1.5 font-bold">Progres harian</td>
                  <td className="border border-slate-600 p-1.5 font-bold text-emerald-700">
                    {data.identitas?.progres_harian_pct ?? "0"}%
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-[9px] text-slate-500 italic mt-0.5">
              Acuan BoQ/RAB: daftar kuantitas dan harga kontrak, AHSP/HSP, volume terpasang terukur, bukti lapangan, kurva-S, BA opname/MC, serta perubahan pekerjaan/addendum bila ada.
            </p>
          </div>

          {/* 2. Checklist Fasilitas KNMP (8 Fasilitas Standar) */}
          <div className="mb-3.5">
            <h3 className="font-bold text-xs text-slate-900 mb-1">2. Checklist Fasilitas KNMP</h3>
            <table className="w-full border-collapse border border-slate-700 text-[10px]">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold text-center">
                  <th className="border border-slate-600 p-1 w-8">No</th>
                  <th className="border border-slate-600 p-1 text-left">Fasilitas/area</th>
                  <th className="border border-slate-600 p-1 w-24">Lingkup</th>
                  <th className="border border-slate-600 p-1 w-44">Status</th>
                  <th className="border border-slate-600 p-1">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {(data.checklist_fasilitas?.length ? data.checklist_fasilitas : DEFAULT_8_FASILITAS_HARIAN.map((f, i) => ({
                  no: i + 1,
                  fasilitas: f,
                  lingkup: "Ya" as const,
                  status: "Proses" as const,
                  catatan: "",
                }))).slice(0, 8).map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-600 p-1 text-center font-bold">{f.no || idx + 1}</td>
                    <td className="border border-slate-600 p-1 font-semibold">{f.fasilitas}</td>
                    <td className="border border-slate-600 p-1 text-center">
                      <span className="inline-flex gap-2">
                        <span>[{f.lingkup === "Ya" ? "✔" : " "}] Ya</span>
                        <span>[{f.lingkup === "N/A" ? "✔" : " "}] N/A</span>
                      </span>
                    </td>
                    <td className="border border-slate-600 p-1 text-center">
                      <span className="inline-flex gap-1.5 text-[9.5px]">
                        <span>[{f.status === "Belum" ? "✔" : " "}] Belum</span>
                        <span>[{f.status === "Proses" ? "✔" : " "}] Proses</span>
                        <span>[{f.status === "Selesai" ? "✔" : " "}] Selesai</span>
                      </span>
                    </td>
                    <td className="border border-slate-600 p-1 text-slate-700">{f.catatan || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. Detail BoQ Progres Harian */}
          <div className="mb-3.5">
            <h3 className="font-bold text-xs text-slate-900 mb-1">3. Detail BoQ Progres Harian</h3>
            <table className="w-full border-collapse border border-slate-700 text-[10px]">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold text-center">
                  <th className="border border-slate-600 p-1 w-7">No</th>
                  <th className="border border-slate-600 p-1 w-16">Kode BoQ</th>
                  <th className="border border-slate-600 p-1 w-20">Area</th>
                  <th className="border border-slate-600 p-1 text-left">Uraian</th>
                  <th className="border border-slate-600 p-1 w-10">Sat.</th>
                  <th className="border border-slate-600 p-1 w-16">Vol. kontrak</th>
                  <th className="border border-slate-600 p-1 w-14">Renc. hari</th>
                  <th className="border border-slate-600 p-1 w-14">Realisasi</th>
                  <th className="border border-slate-600 p-1 w-16">Kum. s.d. hari</th>
                  <th className="border border-slate-600 p-1 w-14">Bukti</th>
                </tr>
              </thead>
              <tbody>
                {(data.detail_boq?.length ? data.detail_boq : [1, 2, 3, 4, 5, 6].map((n) => ({
                  no: n,
                  kode_boq: `DIV-${n}`,
                  area: "-",
                  uraian: "-",
                  satuan: "m3",
                  vol_kontrak: 0,
                  renc_hari: 0,
                  realisasi: 0,
                  kum_sd_hari: 0,
                  bukti: "-",
                }))).map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-600 p-1 text-center font-bold">{item.no || idx + 1}</td>
                    <td className="border border-slate-600 p-1 text-center font-mono font-bold">{item.kode_boq || "-"}</td>
                    <td className="border border-slate-600 p-1">{item.area || "-"}</td>
                    <td className="border border-slate-600 p-1">{item.uraian || "-"}</td>
                    <td className="border border-slate-600 p-1 text-center">{item.satuan || "-"}</td>
                    <td className="border border-slate-600 p-1 text-right font-mono">{item.vol_kontrak || 0}</td>
                    <td className="border border-slate-600 p-1 text-right font-mono text-blue-700">{item.renc_hari || 0}</td>
                    <td className="border border-slate-600 p-1 text-right font-mono font-bold text-emerald-700">{item.realisasi || 0}</td>
                    <td className="border border-slate-600 p-1 text-right font-mono font-bold">{item.kum_sd_hari || 0}</td>
                    <td className="border border-slate-600 p-1 text-center">{item.bukti || "Foto"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[9px] text-slate-500 italic mt-0.5">
              Isi berdasarkan item BoQ terukur: volume harian, kumulatif, satuan, dan bukti foto/opname. Item tambah/kurang diberi kode addendum/VO bila sudah disetujui.
            </p>
          </div>

          {/* 4. Mutu, K3, Cuaca, Kendala, dan Rencana Besok */}
          <div>
            <h3 className="font-bold text-xs text-slate-900 mb-1">4. Mutu, K3, Cuaca, Kendala, dan Rencana Besok</h3>
            <table className="w-full border-collapse border border-slate-700 text-[10px]">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold text-center">
                  <th className="border border-slate-600 p-1 w-8">No</th>
                  <th className="border border-slate-600 p-1 w-36 text-left">Aspek</th>
                  <th className="border border-slate-600 p-1 text-left">Catatan/temuan</th>
                  <th className="border border-slate-600 p-1 text-left">Dampak</th>
                  <th className="border border-slate-600 p-1 text-left">Tindak lanjut</th>
                  <th className="border border-slate-600 p-1 w-28 text-left">PIC/Target</th>
                </tr>
              </thead>
              <tbody>
                {(data.aspek_k3_kendala?.length ? data.aspek_k3_kendala : DEFAULT_5_ASPEK_HARIAN.map((a, i) => ({
                  no: i + 1,
                  aspek: a,
                  catatan: "Kondisi aman dan terkendali",
                  dampak: "Nihil",
                  tindak_lanjut: "Lanjutkan pengawasan lapangan",
                  pic_target: "Pelaksana / K3",
                }))).map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-600 p-1 text-center font-bold">{item.no || idx + 1}</td>
                    <td className="border border-slate-600 p-1 font-semibold">{item.aspek}</td>
                    <td className="border border-slate-600 p-1 text-slate-700">{item.catatan || "-"}</td>
                    <td className="border border-slate-600 p-1 text-slate-700">{item.dampak || "-"}</td>
                    <td className="border border-slate-600 p-1 text-slate-700">{item.tindak_lanjut || "-"}</td>
                    <td className="border border-slate-600 p-1 font-semibold text-slate-800">{item.pic_target || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-right text-[9px] text-slate-400 pt-2">
          Halaman 1 dari 2 — Laporan Harian Konstruksi KNMP
        </div>
      </div>

      {/* ================= HALAMAN 2 ================= */}
      <div className="min-h-[297mm] p-8 sm:p-10 flex flex-col justify-between print:min-h-screen">
        <div>
          {/* Header Ringkas Halaman 2 */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-black text-xs uppercase tracking-wider text-slate-900">
                KEMENTERIAN KELAUTAN DAN PERIKANAN
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-[10px] text-slate-600">Dokumentasi & Pengesahan Laporan Harian</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              {data.tanggal || "-"}
            </span>
          </div>

          {/* 5. Dokumentasi Foto Harian (2x2 Grid) */}
          <div className="mb-6">
            <h3 className="font-bold text-xs text-slate-900 mb-2">5. Dokumentasi Foto Harian</h3>
            <div className="grid grid-cols-2 gap-3.5">
              {[1, 2, 3, 4].map((slot) => {
                const foto = data.dokumentasi_foto?.find((f) => f.slot === slot) || {
                  slot,
                  file_url: "",
                  kode_boq_area: "",
                  tanggal: data.tanggal,
                  keterangan: "",
                };

                return (
                  <div key={slot} className="border border-slate-600 p-2 rounded bg-white flex flex-col">
                    <div className="font-bold text-xs uppercase text-slate-800 mb-1 flex items-center justify-between">
                      <span>FOTO {slot}</span>
                      <span className="text-[9px] text-slate-400 font-mono">SLOT #{slot}</span>
                    </div>

                    <div className="aspect-[16/10] bg-slate-100 border border-slate-300 rounded overflow-hidden flex items-center justify-center mb-2">
                      {foto.file_url ? (
                        <img
                          src={foto.file_url}
                          alt={`Dokumentasi ${slot}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-3 text-slate-400 text-[10px] italic">
                          [Dokumentasi Visual Lapangan #{slot}]
                        </div>
                      )}
                    </div>

                    <div className="text-[9.5px] space-y-0.5 border-t border-slate-200 pt-1 text-slate-700">
                      <div><strong>Kode BoQ/area:</strong> {foto.kode_boq_area || "-"}</div>
                      <div><strong>Tanggal:</strong> {foto.tanggal || data.tanggal || "-"}</div>
                      <div><strong>Keterangan:</strong> {foto.keterangan || "-"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-slate-500 italic mt-1.5">
              Foto wajib dikaitkan dengan kode BoQ/area agar progres volume mudah diverifikasi.
            </p>
          </div>

          {/* 6. Pengesahan (3 Kolom) */}
          <div>
            <h3 className="font-bold text-xs text-slate-900 mb-1.5">6. Pengesahan</h3>
            <table className="w-full border-collapse border border-slate-700 text-[10.5px]">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold text-center">
                  <th className="border border-slate-600 p-1.5 w-1/3">Dibuat oleh</th>
                  <th className="border border-slate-600 p-1.5 w-1/3">Diperiksa oleh</th>
                  <th className="border border-slate-600 p-1.5 w-1/3">Disetujui oleh</th>
                </tr>
                <tr className="text-center text-[9.5px] text-slate-600 font-medium">
                  <th className="border border-slate-600 py-0.5">Kontraktor Pelaksana</th>
                  <th className="border border-slate-600 py-0.5">Konsultan Pengawas</th>
                  <th className="border border-slate-600 py-0.5">Pejabat Pembuat Komitmen (PPK)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-600 p-3 h-28 align-bottom text-left">
                    <div className="text-slate-400 italic text-[9px] mb-8 text-center">[Tanda Tangan & Cap]</div>
                    <div><strong>Nama:</strong> {data.pengesahan?.pembuat_nama || "-"}</div>
                    <div><strong>Tanggal:</strong> {data.pengesahan?.pembuat_tanggal || data.tanggal || "-"}</div>
                  </td>
                  <td className="border border-slate-600 p-3 h-28 align-bottom text-left">
                    <div className="text-slate-400 italic text-[9px] mb-8 text-center">[Tanda Tangan & Cap]</div>
                    <div><strong>Nama:</strong> {data.pengesahan?.pemeriksa_nama || "-"}</div>
                    <div><strong>Tanggal:</strong> {data.pengesahan?.pemeriksa_tanggal || data.tanggal || "-"}</div>
                  </td>
                  <td className="border border-slate-600 p-3 h-28 align-bottom text-left">
                    <div className="text-slate-400 italic text-[9px] mb-8 text-center">[Tanda Tangan & Cap]</div>
                    <div><strong>Nama:</strong> {data.pengesahan?.penyetuju_nama || "-"}</div>
                    <div><strong>Tanggal:</strong> {data.pengesahan?.penyetuju_tanggal || data.tanggal || "-"}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-right text-[9px] text-slate-400 pt-2">
          Halaman 2 dari 2 — Laporan Harian Konstruksi KNMP
        </div>
      </div>
    </div>
  );

  if (isEmbedded) {
    return sheetContent;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex flex-col items-center p-4 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Top Bar for Standalone Modal */}
      <div className="w-full max-w-[210mm] mb-4 flex items-center justify-between bg-white rounded-xl px-5 py-3 shadow-lg border border-slate-200 print:hidden">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm">
            KKP
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Preview Format Laporan Harian Konstruksi KNMP</h4>
            <p className="text-[11px] text-slate-500">Standar Resmi Kementerian Kelautan dan Perikanan (2 Halaman A4)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-bold text-slate-700">
            <Printer className="w-3.5 h-3.5 text-amber-600" />
            Cetak / PDF A4
          </Button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {sheetContent}
    </div>
  );
};
