import React from "react";
import { Printer, X } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export interface LaporanMingguanData {
  periode_awal: string;
  periode_akhir: string;
  minggu_ke: string | number;
  status_proyek: "On Track" | "Warning" | "Critical";
  identitas: {
    paket_pekerjaan: string;
    lokasi: string;
    jenis_titik: "HUB" | "PENYANGGA";
    no_kontrak_spmk: string;
    kontraktor: string;
    pengawas_ppk: string;
    rencana_kum_pct: number | string;
    aktual_kum_pct: number | string;
  };
  checklist_fasilitas: Array<{
    no: number;
    fasilitas: string;
    lingkup: "Ya" | "N/A";
    status: "Belum" | "Proses" | "Selesai";
    catatan?: string;
  }>;
  ringkasan_boq: Array<{
    no: number;
    kelompok_boq: string;
    nilai_kontrak: number;
    bobot_pct: number;
    renc_kum_pct: number;
    akt_kum_pct: number;
    deviasi_pct: number;
    keterangan: string;
  }>;
  detail_boq: Array<{
    no: number;
    kode_boq: string;
    area: string;
    uraian: string;
    bobot_pct: number;
    renc_mgg: number;
    real_mgg: number;
    akt_kum: number;
    deviasi_pct: number;
    bukti_mc: string;
  }>;
  kontrol_mingguan: Array<{
    no: number;
    aspek: string;
    kondisi: string;
    isu_risiko: string;
    keputusan_dibutuhkan: string;
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

export const DEFAULT_10_FASILITAS_MINGGUAN = [
  "Dermaga/tambatan",
  "Gudang beku/cold storage",
  "Pabrik es/sarana dingin",
  "Shelter pendaratan ikan",
  "Sentra/pasar/pengolahan ikan",
  "Bengkel kapal/jaring",
  "SPBN/SPBUN",
  "Kantor pengelola/kios/logistik",
  "Utilitas listrik-air-drainase",
  "Akses jalan & lingkungan",
];

export const DEFAULT_8_BOQ_MINGGUAN = [
  "Persiapan & K3/SMKK",
  "Pekerjaan tanah/lahan",
  "Struktur/revetment/DPT",
  "Bangunan gedung/fasilitas",
  "MEP/utilitas",
  "Jalan, drainase, lingkungan",
  "Pengadaan/instalasi sarana",
  "Lain-lain/addendum",
];

export const DEFAULT_6_KONTROL_MINGGUAN = [
  "Tenaga kerja & alat",
  "Material kritis",
  "Mutu/QC/NCR",
  "K3/lingkungan",
  "Administrasi/instruksi",
  "Look ahead 1 minggu",
];

interface FormatMingguanPrintViewProps {
  data: LaporanMingguanData;
  isEmbedded?: boolean;
  onClose?: () => void;
}

export const FormatMingguanPrintView: React.FC<FormatMingguanPrintViewProps> = ({
  data,
  isEmbedded = false,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formatRp = (val?: number) => {
    if (val === undefined || isNaN(val)) return "-";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const formatPct = (val?: number | string) => {
    if (val === undefined || val === null || val === "") return "0.00%";
    const num = typeof val === "number" ? val : parseFloat(val);
    if (isNaN(num)) return "0.00%";
    return `${num.toFixed(2)}%`;
  };

  const sheetContent = (
    <div className="w-full max-w-[210mm] bg-white shadow-2xl print:shadow-none print:max-w-none text-slate-900 text-[11px] leading-tight font-sans mx-auto">
      {/* ================= HALAMAN 1 ================= */}
      <div className="relative min-h-[297mm] px-8 sm:px-10 pt-28 pb-14 flex flex-col justify-between border-b border-slate-300 print:border-none print:min-h-screen print:break-after-page overflow-hidden">
        {/* Official KKP Template Background */}
        <img
          src="/assets/img/kkp_official_bg.jpg"
          alt="KKP Official Background"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
        />

        <div className="relative z-10">
          {/* Judul & Status Subheader */}
          <div className="text-center mb-3">
            <h1 className="text-sm font-black uppercase tracking-wide text-slate-900">
              FORMAT LAPORAN MINGGUAN KONSTRUKSI KNMP
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs font-semibold text-slate-700">
              <span>Periode: <strong className="text-slate-900">{data.periode_awal || "-"} s.d. {data.periode_akhir || "-"}</strong></span>
              <span>Minggu ke-: <strong className="text-slate-900">{data.minggu_ke || "-"}</strong></span>
              <span className="inline-flex items-center gap-2">
                Status:
                <span className="inline-flex gap-2 font-bold">
                  <span className={data.status_proyek === "On Track" ? "text-emerald-700 font-black" : "text-slate-400"}>
                    [{data.status_proyek === "On Track" ? "✔" : " "}] On Track
                  </span>
                  <span className={data.status_proyek === "Warning" ? "text-amber-600 font-black" : "text-slate-400"}>
                    [{data.status_proyek === "Warning" ? "✔" : " "}] Warning
                  </span>
                  <span className={data.status_proyek === "Critical" ? "text-rose-600 font-black" : "text-slate-400"}>
                    [{data.status_proyek === "Critical" ? "✔" : " "}] Critical
                  </span>
                </span>
              </span>
            </div>
          </div>

          {/* 1. Identitas dan Acuan */}
          <div className="mb-3">
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
                  <td className="border border-slate-600 bg-slate-100 p-1.5 font-bold">Rencana kum.</td>
                  <td className="border border-slate-600 p-1.5 font-bold text-blue-700">
                    {formatPct(data.identitas?.rencana_kum_pct)}
                  </td>
                  <td className="border border-slate-600 bg-slate-100 p-1.5 font-bold">Aktual kum.</td>
                  <td className="border border-slate-600 p-1.5 font-bold text-emerald-700">
                    {formatPct(data.identitas?.aktual_kum_pct)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-[9px] text-slate-500 italic mt-0.5">
              Acuan BoQ/RAB: daftar kuantitas dan harga kontrak, AHSP/HSP, volume terpasang terukur, bukti lapangan, kurva-S, BA opname/MC, serta perubahan pekerjaan/addendum bila ada.
            </p>
          </div>

          {/* 2. Checklist Fasilitas KNMP (10 Fasilitas Standar) */}
          <div className="mb-3">
            <h3 className="font-bold text-xs text-slate-900 mb-1">2. Checklist Fasilitas KNMP</h3>
            <table className="w-full border-collapse border border-slate-700 text-[10px]">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold text-center">
                  <th className="border border-slate-600 p-1 w-7">No</th>
                  <th className="border border-slate-600 p-1 text-left">Fasilitas/area</th>
                  <th className="border border-slate-600 p-1 w-20">Lingkup</th>
                  <th className="border border-slate-600 p-1 w-40">Status</th>
                  <th className="border border-slate-600 p-1">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {(data.checklist_fasilitas?.length ? data.checklist_fasilitas : DEFAULT_10_FASILITAS_MINGGUAN.map((f, i) => ({
                  no: i + 1,
                  fasilitas: f,
                  lingkup: "Ya" as const,
                  status: "Proses" as const,
                  catatan: "",
                }))).map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-600 p-0.5 text-center font-bold">{f.no || idx + 1}</td>
                    <td className="border border-slate-600 p-0.5 font-semibold">{f.fasilitas}</td>
                    <td className="border border-slate-600 p-0.5 text-center">
                      <span className="inline-flex gap-1.5">
                        <span>[{f.lingkup === "Ya" ? "✔" : " "}] Ya</span>
                        <span>[{f.lingkup === "N/A" ? "✔" : " "}] N/A</span>
                      </span>
                    </td>
                    <td className="border border-slate-600 p-0.5 text-center">
                      <span className="inline-flex gap-1 text-[9px]">
                        <span>[{f.status === "Belum" ? "✔" : " "}] Belum</span>
                        <span>[{f.status === "Proses" ? "✔" : " "}] Proses</span>
                        <span>[{f.status === "Selesai" ? "✔" : " "}] Selesai</span>
                      </span>
                    </td>
                    <td className="border border-slate-600 p-0.5 text-slate-700">{f.catatan || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. Ringkasan BoQ/RAB per Kelompok Pekerjaan */}
          <div className="mb-3">
            <h3 className="font-bold text-xs text-slate-900 mb-1">3. Ringkasan BoQ/RAB per Kelompok Pekerjaan</h3>
            <table className="w-full border-collapse border border-slate-700 text-[10px]">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold text-center">
                  <th className="border border-slate-600 p-1 w-7">No</th>
                  <th className="border border-slate-600 p-1 text-left">Kelompok BoQ</th>
                  <th className="border border-slate-600 p-1 w-24">Nilai kontrak</th>
                  <th className="border border-slate-600 p-1 w-14">Bobot</th>
                  <th className="border border-slate-600 p-1 w-16">Renc. kum.</th>
                  <th className="border border-slate-600 p-1 w-16">Akt. kum.</th>
                  <th className="border border-slate-600 p-1 w-14">Deviasi</th>
                  <th className="border border-slate-600 p-1">Ket.</th>
                </tr>
              </thead>
              <tbody>
                {(data.ringkasan_boq?.length ? data.ringkasan_boq : DEFAULT_8_BOQ_MINGGUAN.map((k, i) => ({
                  no: i + 1,
                  kelompok_boq: k,
                  nilai_kontrak: 0,
                  bobot_pct: 12.5,
                  renc_kum_pct: 0,
                  akt_kum_pct: 0,
                  deviasi_pct: 0,
                  keterangan: "",
                }))).map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-600 p-0.5 text-center font-bold">{item.no || idx + 1}</td>
                    <td className="border border-slate-600 p-0.5 font-semibold">{item.kelompok_boq}</td>
                    <td className="border border-slate-600 p-0.5 text-right font-mono">{formatRp(item.nilai_kontrak)}</td>
                    <td className="border border-slate-600 p-0.5 text-center font-mono">{formatPct(item.bobot_pct)}</td>
                    <td className="border border-slate-600 p-0.5 text-center font-mono text-blue-700">{formatPct(item.renc_kum_pct)}</td>
                    <td className="border border-slate-600 p-0.5 text-center font-mono font-bold text-emerald-700">{formatPct(item.akt_kum_pct)}</td>
                    <td className={`border border-slate-600 p-0.5 text-center font-mono font-bold ${item.deviasi_pct < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                      {item.deviasi_pct > 0 ? `+${item.deviasi_pct.toFixed(2)}%` : `${item.deviasi_pct.toFixed(2)}%`}
                    </td>
                    <td className="border border-slate-600 p-0.5 text-slate-700">{item.keterangan || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. Detail BoQ Progres Mingguan */}
          <div>
            <h3 className="font-bold text-xs text-slate-900 mb-1">4. Detail BoQ Progres Mingguan</h3>
            <table className="w-full border-collapse border border-slate-700 text-[10px]">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold text-center">
                  <th className="border border-slate-600 p-1 w-7">No</th>
                  <th className="border border-slate-600 p-1 w-16">Kode BoQ</th>
                  <th className="border border-slate-600 p-1 w-20">Area</th>
                  <th className="border border-slate-600 p-1 text-left">Uraian</th>
                  <th className="border border-slate-600 p-1 w-14">Bobot</th>
                  <th className="border border-slate-600 p-1 w-14">Renc. mgg</th>
                  <th className="border border-slate-600 p-1 w-14">Real. mgg</th>
                  <th className="border border-slate-600 p-1 w-14">Akt. kum.</th>
                  <th className="border border-slate-600 p-1 w-14">Deviasi</th>
                  <th className="border border-slate-600 p-1 w-16">Bukti/MC</th>
                </tr>
              </thead>
              <tbody>
                {(data.detail_boq?.length ? data.detail_boq : [1, 2, 3, 4, 5, 6].map((n) => ({
                  no: n,
                  kode_boq: `DIV-${n}`,
                  area: "-",
                  uraian: "-",
                  bobot_pct: 0,
                  renc_mgg: 0,
                  real_mgg: 0,
                  akt_kum: 0,
                  deviasi_pct: 0,
                  bukti_mc: "MC-01",
                }))).map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-600 p-0.5 text-center font-bold">{item.no || idx + 1}</td>
                    <td className="border border-slate-600 p-0.5 text-center font-mono font-bold">{item.kode_boq}</td>
                    <td className="border border-slate-600 p-0.5">{item.area || "-"}</td>
                    <td className="border border-slate-600 p-0.5">{item.uraian || "-"}</td>
                    <td className="border border-slate-600 p-0.5 text-center font-mono">{formatPct(item.bobot_pct)}</td>
                    <td className="border border-slate-600 p-0.5 text-center font-mono text-blue-700">{formatPct(item.renc_mgg)}</td>
                    <td className="border border-slate-600 p-0.5 text-center font-mono font-bold text-emerald-700">{formatPct(item.real_mgg)}</td>
                    <td className="border border-slate-600 p-0.5 text-center font-mono font-bold">{formatPct(item.akt_kum)}</td>
                    <td className={`border border-slate-600 p-0.5 text-center font-mono font-bold ${item.deviasi_pct < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                      {item.deviasi_pct > 0 ? `+${item.deviasi_pct.toFixed(2)}%` : `${item.deviasi_pct.toFixed(2)}%`}
                    </td>
                    <td className="border border-slate-600 p-0.5 text-center">{item.bukti_mc || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[9px] text-slate-500 italic mt-0.5">
              Bandingkan realisasi mingguan terhadap rencana kurva-S/baseline. Deviasi negatif perlu penyebab dan recovery plan.
            </p>
          </div>
        </div>

        <div className="text-right text-[9px] text-slate-400 pt-2">
          Halaman 1 dari 2 — Laporan Mingguan Konstruksi KNMP
        </div>
      </div>

      {/* ================= HALAMAN 2 ================= */}
      <div className="relative min-h-[297mm] px-8 sm:px-10 pt-28 pb-14 flex flex-col justify-between print:min-h-screen print:break-before-page overflow-hidden">
        {/* Official KKP Template Background */}
        <img
          src="/assets/img/kkp_official_bg.jpg"
          alt="KKP Official Background"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
        />

        <div className="relative z-10">

          {/* 5. Kontrol Mingguan dan Look Ahead (6 Aspek) */}
          <div className="mb-4">
            <h3 className="font-bold text-xs text-slate-900 mb-1.5">5. Kontrol Mingguan dan Look Ahead</h3>
            <table className="w-full border-collapse border border-slate-700 text-[10px]">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold text-center">
                  <th className="border border-slate-600 p-1 w-7">No</th>
                  <th className="border border-slate-600 p-1 w-36 text-left">Aspek</th>
                  <th className="border border-slate-600 p-1 text-left">Kondisi</th>
                  <th className="border border-slate-600 p-1 text-left">Isu/Risiko</th>
                  <th className="border border-slate-600 p-1 text-left">Keputusan dibutuhkan</th>
                  <th className="border border-slate-600 p-1 w-28 text-left">PIC/Target</th>
                </tr>
              </thead>
              <tbody>
                {(data.kontrol_mingguan?.length ? data.kontrol_mingguan : DEFAULT_6_KONTROL_MINGGUAN.map((a, i) => ({
                  no: i + 1,
                  aspek: a,
                  kondisi: "Berjalan sesuai baseline",
                  isu_risiko: "Terkendali",
                  keputusan_dibutuhkan: "Monitoring lapangan rutin",
                  pic_target: "Site Manager",
                }))).map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-600 p-1 text-center font-bold">{item.no || idx + 1}</td>
                    <td className="border border-slate-600 p-1 font-semibold">{item.aspek}</td>
                    <td className="border border-slate-600 p-1 text-slate-700">{item.kondisi || "-"}</td>
                    <td className="border border-slate-600 p-1 text-slate-700">{item.isu_risiko || "-"}</td>
                    <td className="border border-slate-600 p-1 text-slate-700">{item.keputusan_dibutuhkan || "-"}</td>
                    <td className="border border-slate-600 p-1 font-semibold text-slate-800">{item.pic_target || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 6. Dokumentasi Foto Mingguan (2x2 Grid) */}
          <div className="mb-6">
            <h3 className="font-bold text-xs text-slate-900 mb-2">6. Dokumentasi Foto Mingguan</h3>
            <div className="grid grid-cols-2 gap-3.5">
              {[1, 2, 3, 4].map((slot) => {
                const foto = data.dokumentasi_foto?.find((f) => f.slot === slot) || {
                  slot,
                  file_url: "",
                  kode_boq_area: "",
                  tanggal: data.periode_akhir,
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
                          [Dokumentasi Progres Mingguan #{slot}]
                        </div>
                      )}
                    </div>

                    <div className="text-[9.5px] space-y-0.5 border-t border-slate-200 pt-1 text-slate-700">
                      <div><strong>Kode BoQ/area:</strong> {foto.kode_boq_area || "-"}</div>
                      <div><strong>Tanggal:</strong> {foto.tanggal || data.periode_akhir || "-"}</div>
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

          {/* 7. Pengesahan (3 Kolom) */}
          <div>
            <h3 className="font-bold text-xs text-slate-900 mb-1.5">7. Pengesahan</h3>
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
                    <div><strong>Tanggal:</strong> {data.pengesahan?.pembuat_tanggal || data.periode_akhir || "-"}</div>
                  </td>
                  <td className="border border-slate-600 p-3 h-28 align-bottom text-left">
                    <div className="text-slate-400 italic text-[9px] mb-8 text-center">[Tanda Tangan & Cap]</div>
                    <div><strong>Nama:</strong> {data.pengesahan?.pemeriksa_nama || "-"}</div>
                    <div><strong>Tanggal:</strong> {data.pengesahan?.pemeriksa_tanggal || data.periode_akhir || "-"}</div>
                  </td>
                  <td className="border border-slate-600 p-3 h-28 align-bottom text-left">
                    <div className="text-slate-400 italic text-[9px] mb-8 text-center">[Tanda Tangan & Cap]</div>
                    <div><strong>Nama:</strong> {data.pengesahan?.penyetuju_nama || "-"}</div>
                    <div><strong>Tanggal:</strong> {data.pengesahan?.penyetuju_tanggal || data.periode_akhir || "-"}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-right text-[9px] text-slate-400 pt-2">
          Halaman 2 dari 2 — Laporan Mingguan Konstruksi KNMP
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
          <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm">
            KKP
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Preview Format Laporan Mingguan Konstruksi KNMP</h4>
            <p className="text-[11px] text-slate-500">Standar Resmi Kementerian Kelautan dan Perikanan (2 Halaman A4)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-bold text-slate-700">
            <Printer className="w-3.5 h-3.5 text-blue-600" />
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
