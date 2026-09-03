import React from "react";
import { Printer, X, Download } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { getFileUrl } from "../../../lib/api-client";
import type { LaporanBulananData } from "../types";

interface FormatBulananPrintViewProps {
  data: LaporanBulananData;
  isEmbedded?: boolean;
  onClose?: () => void;
}

export const FormatBulananPrintView: React.FC<FormatBulananPrintViewProps> = ({
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

  const formatPct = (val?: number) => {
    if (val === undefined || isNaN(val)) return "0.00%";
    return `${val.toFixed(2)}%`;
  };

  const sheetContent = (
    <div className="w-full max-w-[210mm] bg-white shadow-2xl print:shadow-none print:max-w-none text-slate-900 text-[11px] leading-tight font-sans mx-auto">
      {/* ================= PAGE 1 ================= */}
      <div className="relative min-h-[297mm] px-8 sm:px-10 pt-[34mm] pb-6 flex flex-col justify-between border-b border-slate-300 print:border-none print:min-h-screen print:break-after-page overflow-hidden">
        {/* Official KKP Template Background */}
        <img
          src="/assets/img/kkp_official_bg.jpg"
          alt="KKP Official Background"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
        />

        <div className="relative z-10">
          {/* Judul & Status */}
          <div className="text-center mb-2">
            <h1 className="text-sm font-black uppercase tracking-wide text-slate-900">
              FORMAT LAPORAN BULANAN KONSTRUKSI KNMP
            </h1>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-0.5 text-xs font-semibold text-slate-700">
              <span>
                Bulan/Tahun: <strong className="text-slate-900">{data.bulan_tahun || "-"}</strong>
              </span>
              <span>
                Bulan kontrak ke-: <strong className="text-slate-900">{data.bulan_kontrak_ke || "-"}</strong>
                <span className="flex items-center gap-2">
                  Status:
                  <span className="inline-flex items-center gap-1 font-bold">
                    <span>[{data.status_proyek === "On Track" ? "X" : " "}] On Track</span>
                    <span>[{data.status_proyek === "Warning" ? "X" : " "}] Warning</span>
                    <span>[{data.status_proyek === "Critical" ? "X" : " "}] Critical</span>
                  </span>
                </span>
              </span>
            </div>
          </div>

          {/* 1. Identitas dan Acuan */}
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase mb-0.5">
              1. Identitas dan Acuan
            </h3>
            <table className="w-full border-collapse border border-slate-800 text-[9.5px]">
              <tbody>
                <tr>
                  <td className="border border-slate-800 py-0.5 px-1.5 font-bold w-[18%] bg-slate-50/70">Paket pekerjaan</td>
                  <td className="border border-slate-800 py-0.5 px-1.5 w-[32%]">{data.identitas_acuan.paket_pekerjaan || "-"}</td>
                  <td className="border border-slate-800 py-0.5 px-1.5 font-bold w-[18%] bg-slate-50/70">Lokasi</td>
                  <td className="border border-slate-800 py-0.5 px-1.5 w-[32%]">{data.identitas_acuan.lokasi || "-"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 py-0.5 px-1.5 font-bold bg-slate-50/70">Jenis titik</td>
                  <td className="border border-slate-800 py-0.5 px-1.5">
                    [{data.identitas_acuan.jenis_titik === "HUB" ? "X" : " "}] HUB &nbsp;&nbsp;
                    [{data.identitas_acuan.jenis_titik === "PENYANGGA" ? "X" : " "}] PENYANGGA
                  </td>
                  <td className="border border-slate-800 py-0.5 px-1.5 font-bold bg-slate-50/70">No. kontrak/SPMK</td>
                  <td className="border border-slate-800 py-0.5 px-1.5">{data.identitas_acuan.no_kontrak_spmk || "-"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 py-0.5 px-1.5 font-bold bg-slate-50/70">Kontraktor</td>
                  <td className="border border-slate-800 py-0.5 px-1.5">{data.identitas_acuan.kontraktor || "-"}</td>
                  <td className="border border-slate-800 py-0.5 px-1.5 font-bold bg-slate-50/70">Pengawas/PPK</td>
                  <td className="border border-slate-800 py-0.5 px-1.5">{data.identitas_acuan.pengawas_ppk || "-"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 py-0.5 px-1.5 font-bold bg-slate-50/70">Rencana kum.</td>
                  <td className="border border-slate-800 py-0.5 px-1.5 font-bold text-blue-700">{formatPct(data.identitas_acuan.rencana_kum_pct)}</td>
                  <td className="border border-slate-800 py-0.5 px-1.5 font-bold bg-slate-50/70">Aktual kum.</td>
                  <td className="border border-slate-800 py-0.5 px-1.5 font-bold text-emerald-700">{formatPct(data.identitas_acuan.aktual_kum_pct)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 py-0.5 px-1.5 font-bold bg-slate-50/70">Deviasi</td>
                  <td className={`border border-slate-800 py-0.5 px-1.5 font-bold ${data.identitas_acuan.deviasi_pct < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {formatPct(data.identitas_acuan.deviasi_pct)}
                  </td>
                  <td className="border border-slate-800 py-0.5 px-1.5 font-bold bg-slate-50/70">Termin/keuangan</td>
                  <td className="border border-slate-800 py-0.5 px-1.5">{data.identitas_acuan.termin_keuangan || "-"}</td>
                </tr>
              </tbody>
            </table>
            <p className="text-[8px] italic text-slate-500 mt-0.5 leading-tight">
              Acuan BoQ/RAB: daftar kuantitas dan harga kontrak, AHSP/HSP, volume terpasang terukur, bukti lapangan, kurva-S, BA opname/MC, serta perubahan pekerjaan/addendum bila ada.
            </p>
          </div>

          {/* 2. Checklist Fasilitas KNMP */}
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase mb-0.5">
              2. Checklist Fasilitas KNMP
            </h3>
            <table className="w-full border-collapse border border-slate-800 text-[8.5px]">
              <thead>
                <tr className="bg-slate-100 font-bold text-center">
                  <th className="border border-slate-800 py-0.5 px-1 w-7">No</th>
                  <th className="border border-slate-800 py-0.5 px-1 text-left">Fasilitas/area</th>
                  <th className="border border-slate-800 py-0.5 px-1 w-24">Lingkup</th>
                  <th className="border border-slate-800 py-0.5 px-1 w-36">Status</th>
                  <th className="border border-slate-800 py-0.5 px-1 text-left">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {!data.checklist_fasilitas || data.checklist_fasilitas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-slate-800 py-2.5 text-center text-slate-400 italic">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  data.checklist_fasilitas.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/50" : ""}>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-center font-medium">{item.no || idx + 1}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1 font-semibold">{item.fasilitas}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-center">
                        [{item.lingkup === "Ya" ? "X" : " "}] Ya &nbsp;
                        [{item.lingkup === "N/A" ? "X" : " "}] N/A
                      </td>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-center">
                        <span className="inline-flex items-center gap-1 text-[8px]">
                          <span>[{item.status === "Belum" ? "X" : " "}] Belum</span>
                          <span>[{item.status === "Proses" ? "X" : " "}] Proses</span>
                          <span>[{item.status === "Selesai" ? "X" : " "}] Selesai</span>
                        </span>
                      </td>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-slate-700">{item.catatan || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 3. Ringkasan BoQ/RAB per Kelompok Pekerjaan */}
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase mb-0.5">
              3. Ringkasan BoQ/RAB per Kelompok Pekerjaan
            </h3>
            <table className="w-full border-collapse border border-slate-800 text-[8.5px]">
              <thead>
                <tr className="bg-slate-100 font-bold text-center">
                  <th className="border border-slate-800 py-0.5 px-1 w-7">No</th>
                  <th className="border border-slate-800 py-0.5 px-1 text-left">Kelompok BoQ</th>
                  <th className="border border-slate-800 py-0.5 px-1 w-24">Nilai kontrak</th>
                  <th className="border border-slate-800 py-0.5 px-1 w-12">Bobot</th>
                  <th className="border border-slate-800 py-0.5 px-1 w-14">Renc. kum.</th>
                  <th className="border border-slate-800 py-0.5 px-1 w-14">Akt. kum.</th>
                  <th className="border border-slate-800 py-0.5 px-1 w-14">Deviasi</th>
                  <th className="border border-slate-800 py-0.5 px-1 text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {!data.ringkasan_boq || data.ringkasan_boq.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-slate-800 py-2.5 text-center text-slate-400 italic">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  data.ringkasan_boq.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/50" : ""}>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-center">{item.no || idx + 1}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1 font-semibold">{item.kelompok_boq}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-right">{item.nilai_kontrak ? formatRp(item.nilai_kontrak) : "-"}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-right">{formatPct(item.bobot_pct)}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-right">{formatPct(item.renc_kum_pct)}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-right font-bold text-emerald-700">{formatPct(item.akt_kum_pct)}</td>
                      <td className={`border border-slate-800 py-[1.5px] px-1 text-right font-bold ${item.deviasi_pct < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {formatPct(item.deviasi_pct)}
                      </td>
                      <td className="border border-slate-800 py-[1.5px] px-1">{item.keterangan || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 4. Detail BoQ, Nilai Progres, dan Pembayaran */}
          <div className="mb-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase mb-0.5">
              4. Detail BoQ, Nilai Progres, dan Pembayaran
            </h3>
            <table className="w-full border-collapse border border-slate-800 text-[8.5px]">
              <thead>
                <tr className="bg-slate-100 font-bold text-center">
                  <th className="border border-slate-800 py-0.5 px-1 w-6">No</th>
                  <th className="border border-slate-800 py-0.5 px-1 w-14">Kode BoQ</th>
                  <th className="border border-slate-800 py-0.5 px-1 w-20 text-left">Area</th>
                  <th className="border border-slate-800 py-0.5 px-1 text-left">Uraian</th>
                  <th className="border border-slate-800 py-0.5 px-1 text-right w-11">Bobot</th>
                  <th className="border border-slate-800 py-0.5 px-1 text-right w-14">Akt. kum.</th>
                  <th className="border border-slate-800 py-0.5 px-1 text-right w-20">Nilai realisasi</th>
                  <th className="border border-slate-800 py-0.5 px-1 w-14">Termin/MC</th>
                  <th className="border border-slate-800 py-0.5 px-1 text-right w-12">Deviasi</th>
                  <th className="border border-slate-800 py-0.5 px-1 text-left w-20">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {!data.detail_boq || data.detail_boq.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="border border-slate-800 py-2.5 text-center text-slate-400 italic">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  data.detail_boq.slice(0, 4).map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-center">{item.no || idx + 1}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1 font-mono font-bold text-center">{item.kode_boq}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1">{item.area}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1 font-medium truncate max-w-[180px]">{item.uraian}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-right">{formatPct(item.bobot_pct)}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-right font-bold text-emerald-700">{formatPct(item.akt_kum_pct)}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-right font-mono">{formatRp(item.nilai_realisasi)}</td>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-center font-semibold">{item.termin_mc || "-"}</td>
                      <td className={`border border-slate-800 py-[1.5px] px-1 text-right font-bold ${item.deviasi_pct < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {formatPct(item.deviasi_pct)}
                      </td>
                      <td className="border border-slate-800 py-[1.5px] px-1 text-slate-600">{item.catatan || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <p className="text-[7.5px] italic text-slate-500 mt-0.5 leading-tight">
              Nilai realisasi mengikuti volume terukur x harga satuan kontrak; pembayaran mengikuti ketentuan kontrak, MC/BA opname, pajak/retensi, dan addendum yang berlaku.
            </p>
          </div>
        </div>

        {/* Footer Halaman 1 */}
        <div className="pt-1 border-t border-slate-300 text-right text-[8.5px] text-slate-400">
          Halaman 1 dari 2 — Laporan Bulanan Konstruksi KNMP
        </div>
      </div>

      {/* ================= PAGE 2 ================= */}
      <div className="relative min-h-[297mm] px-8 sm:px-10 pt-[34mm] pb-6 flex flex-col justify-between print:min-h-screen print:break-before-page overflow-hidden">
        {/* Official KKP Template Background */}
        <img
          src="/assets/img/kkp_official_bg.jpg"
          alt="KKP Official Background"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
        />

        <div className="relative z-10">

          {/* 5. Kontrak, Keuangan, Risiko, dan Readiness */}
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase mb-0.5">
              5. Kontrak, Keuangan, Risiko, dan Readiness
            </h3>
            <table className="w-full border-collapse border border-slate-800 text-[8.5px]">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-slate-800 p-1.5 w-7">No</th>
                    <th className="border border-slate-800 py-0.5 px-1 text-left w-36">Aspek</th>
                    <th className="border border-slate-800 py-0.5 px-1 text-left">Kondisi bulan ini</th>
                    <th className="border border-slate-800 py-0.5 px-1 text-left w-48">Risiko/deviasi</th>
                    <th className="border border-slate-800 py-0.5 px-1 text-left w-48">Tindak lanjut</th>
                    <th className="border border-slate-800 py-0.5 px-1 text-left w-28">PIC/Target</th>
                  </tr>
                </thead>
                <tbody>
                  {!data.matriks_risiko || data.matriks_risiko.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-slate-800 py-2.5 text-center text-slate-400 italic">
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    data.matriks_risiko.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/50" : ""}>
                        <td className="border border-slate-800 py-[1.5px] px-1 text-center">{item.no || idx + 1}</td>
                        <td className="border border-slate-800 py-[1.5px] px-1 font-bold">{item.aspek}</td>
                        <td className="border border-slate-800 py-[1.5px] px-1">{item.kondisi_bulan_ini || "-"}</td>
                        <td className="border border-slate-800 py-[1.5px] px-1 text-rose-700 font-medium">{item.risiko_deviasi || "-"}</td>
                        <td className="border border-slate-800 py-[1.5px] px-1 text-blue-800">{item.tindak_lanjut || "-"}</td>
                        <td className="border border-slate-800 py-[1.5px] px-1 font-medium">{item.pic_target || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 6. Dokumentasi Foto Bulanan */}
            <div className="mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase mb-0.5">
                6. Dokumentasi Foto Bulanan
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4].map((slot) => {
                  const foto = data.dokumentasi_foto.find((f) => f.slot === slot) || {
                    slot,
                    file_url: "",
                    kode_boq_area: "",
                    tanggal: "",
                    keterangan: "",
                  };
                  return (
                    <div key={slot} className="border border-slate-800 rounded p-1.5 bg-white flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-0.5 pb-0.5 border-b border-slate-200">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-900">
                          FOTO {slot}
                        </span>
                        <span className="text-[8.5px] text-slate-500 font-medium">
                          {foto.tanggal ? `Tgl: ${foto.tanggal}` : "Tanggal: -"}
                        </span>
                      </div>

                      {/* Image Area */}
                      <div className="aspect-[16/8] bg-slate-100 border border-slate-300 rounded overflow-hidden flex items-center justify-center mb-1">
                        {foto.file_url ? (
                          <img
                            src={getFileUrl(foto.file_url)}
                            alt={`Foto ${slot}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] text-slate-400 font-semibold italic">
                            [Belum ada foto]
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="space-y-0.5 text-[8.5px] leading-tight">
                        <p>
                          <span className="font-bold text-slate-700">Kode BoQ/area:</span>{" "}
                          <span className="font-mono font-semibold">{foto.kode_boq_area || "-"}</span>
                        </p>
                        <p className="line-clamp-1">
                          <span className="font-bold text-slate-700">Keterangan:</span>{" "}
                          <span>{foto.keterangan || "-"}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[7.5px] italic text-slate-500 mt-0.5 leading-tight">
                Foto wajib dikaitkan dengan kode BoQ/area agar progres volume mudah diverifikasi.
              </p>
            </div>

            {/* 7. Pengesahan */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase mb-0.5">
                7. Pengesahan
              </h3>
              <table className="w-full border-collapse border border-slate-800 text-[9px]">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-800 py-0.5 px-1 text-center w-1/3">Dibuat oleh</th>
                    <th className="border border-slate-800 py-0.5 px-1 text-center w-1/3">Diperiksa oleh</th>
                    <th className="border border-slate-800 py-0.5 px-1 text-center w-1/3">Disetujui oleh</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-800 p-1.5 text-center align-top h-20 flex-col justify-between">
                      <p className="text-[9px] font-semibold text-slate-600 mb-4">KONTRAKTOR PELAKSANA</p>
                      <div className="mt-auto">
                        <p className="font-bold underline text-slate-900">{data.pengesahan.pembuat_nama || "(Nama Kontraktor)"}</p>
                        <p className="text-[8.5px] text-slate-500">{data.pengesahan.pembuat_tanggal ? `Tanggal: ${data.pengesahan.pembuat_tanggal}` : "Tanggal: ...................."}</p>
                      </div>
                    </td>
                    <td className="border border-slate-800 p-1.5 text-center align-top h-20 flex-col justify-between">
                      <p className="text-[9px] font-semibold text-slate-600 mb-4">KONSULTAN PENGAWAS</p>
                      <div className="mt-auto">
                        <p className="font-bold underline text-slate-900">{data.pengesahan.pemeriksa_nama || "(Nama Pengawas)"}</p>
                        <p className="text-[8.5px] text-slate-500">{data.pengesahan.pemeriksa_tanggal ? `Tanggal: ${data.pengesahan.pemeriksa_tanggal}` : "Tanggal: ...................."}</p>
                      </div>
                    </td>
                    <td className="border border-slate-800 p-1.5 text-center align-top h-20 flex-col justify-between">
                      <p className="text-[9px] font-semibold text-slate-600 mb-4">PEJABAT PEMBUAT KOMITMEN (PPK)</p>
                      <div className="mt-auto">
                        <p className="font-bold underline text-slate-900">{data.pengesahan.penyetuju_nama || "(Nama PPK)"}</p>
                        <p className="text-[8.5px] text-slate-500">{data.pengesahan.penyetuju_tanggal ? `Tanggal: ${data.pengesahan.penyetuju_tanggal}` : "Tanggal: ...................."}</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Halaman 2 */}
          <div className="pt-1 border-t border-slate-300 flex items-center justify-between text-[8.5px] text-slate-400">
            <span>Sistem Monitoring Kampung Nelayan Merah Putih (KNMP) • Pertamina Se-Sumatera</span>
            <span>Halaman 2 dari 2</span>
          </div>
        </div>
      </div>
  );

  if (isEmbedded) {
    return sheetContent;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex flex-col items-center p-4 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Top Bar for Web View (hidden when printed) */}
      <div className="w-full max-w-[210mm] mb-4 flex items-center justify-between bg-white rounded-xl px-5 py-3 shadow-lg border border-slate-200 print:hidden">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
            KKP
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Preview Format Laporan Bulanan Konstruksi KNMP</h4>
            <p className="text-[11px] text-slate-500">Standar Resmi Kementerian Kelautan dan Perikanan (2 Halaman A4)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-bold text-slate-700">
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            Cetak / PDF
          </Button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
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
