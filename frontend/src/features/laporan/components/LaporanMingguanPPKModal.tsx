import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Printer,
  ZoomIn,
  ZoomOut,
  FileText,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { useAuth } from "../../auth/hooks/useAuth";

interface WeeklyGISPoint {
  id: number;
  name: string;
  lat: number;
  long: number;
  progress: number;
  status: string;
  regency: string;
  province: string;
}

interface WeeklyProgressRekapItem {
  no: number;
  uraian: string;
  lokasi: number;
  minggu_lalu: number;
  minggu_ini: number;
  kumulatif: number;
  keterangan: string;
}

interface WeeklyLokasiStatusItem {
  no: number;
  status: string;
  jumlah: number;
  persentase: number;
  keterangan: string;
}

interface WeeklyKlasterProgressItem {
  code: string;
  name: string;
  progress: number;
}

interface WeeklyIssueItem {
  no: number;
  deskripsi: string;
  lokasi: string;
  penyebab: string;
  dampak: string;
  tingkat_risiko: string;
  rencana_mitigasi: string;
  pic: string;
  target_selesai: string;
  status: string;
}

interface WeeklyWorkPlanItem {
  no: number;
  uraian: string;
  target: number;
}

interface WeeklyPhotoItem {
  title: string;
  file_url: string;
}

interface WeeklyLaporanItem {
  no: number;
  knmp_name: string;
  nama_pelaksana: string;
  tanggal: string;
  jenis_laporan: string;
  cuaca: string;
  tenaga_kerja: number;
  rencana_progres: number;
  realisasi_progres: number;
  status: string;
  keterangan: string;
}

interface WeeklyPPKReportData {
  jenis_laporan?: string;
  ppk_name: string;
  ppk_nip: string;
  kadis_name: string;
  kadis_nip: string;
  wilayah: string;
  total_lokasi: number;
  total_kontraktor: number;
  sumber_dana: string;
  tahun_anggaran: number;
  minggu_ke: number;
  tanggal_awal: string;
  tanggal_akhir: string;
  tanggal_laporan: string;
  ringkasan_narasi: string;
  capaian_fisik_kumulatif: number;
  lokasi_on_progress: number;
  lokasi_selesai: number;
  lokasi_persiapan: number;
  lokasi_tertunda: number;
  nilai_kontrak_kumulatif: number;
  realisasi_keuangan: number;
  realisasi_keuangan_pct: number;
  sisa_anggaran: number;
  sisa_anggaran_pct: number;
  gis_points: WeeklyGISPoint[];
  progress_rekap: WeeklyProgressRekapItem[];
  progress_total_lalu: number;
  progress_total_ini: number;
  progress_total_kumulatif: number;
  rekap_lokasi: WeeklyLokasiStatusItem[];
  progress_klaster: WeeklyKlasterProgressItem[];
  laporan_lapangan: WeeklyLaporanItem[];
  issues: WeeklyIssueItem[];
  work_plans: WeeklyWorkPlanItem[];
  photos: WeeklyPhotoItem[];
  k3_kecelakaan: number;
  k3_near_miss: number;
  k3_pelatihan: number;
  k3_kepatuhan_apd: number;
}

interface LaporanMingguanPPKModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeek?: number;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const LaporanMingguanPPKModal: React.FC<LaporanMingguanPPKModalProps> = ({
  isOpen,
  onClose,
  initialWeek = 14,
}) => {
  const [reportType, setReportType] = useState<"harian" | "mingguan" | "bulanan">("mingguan");
  const [selectedDate, setSelectedDate] = useState<string>("2026-08-24");
  const [mingguKe, setMingguKe] = useState<number>(initialWeek);
  const [bulan, setBulan] = useState<number>(8); // Agustus (1-indexed: 8)
  const [tahun] = useState<number>(2026);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const [reportData, setReportData] = useState<WeeklyPPKReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch Real Backend Data from Endpoint
  const loadReportData = () => {
    setLoading(true);
    setErrorMsg("");
    apiFetch<WeeklyPPKReportData>(
      `/api/v1/laporan/weekly-ppk-report?type=${reportType}&date=${selectedDate}&week=${mingguKe}&month=${bulan}&year=${tahun}`
    )
      .then((data) => {
        if (data) {
          setReportData({
            ...data,
            gis_points: Array.isArray(data.gis_points) ? data.gis_points : [],
            progress_rekap: Array.isArray(data.progress_rekap) ? data.progress_rekap : [],
            rekap_lokasi: Array.isArray(data.rekap_lokasi) ? data.rekap_lokasi : [],
            progress_klaster: Array.isArray(data.progress_klaster) ? data.progress_klaster : [],
            issues: Array.isArray(data.issues) ? data.issues : [],
            work_plans: Array.isArray(data.work_plans) ? data.work_plans : [],
            photos: Array.isArray(data.photos) ? data.photos : [],
          });
        }
      })
      .catch((err) => {
        setErrorMsg(err?.message || "Gagal memuat data laporan dari server");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      loadReportData();
    }
  }, [isOpen, reportType, selectedDate, mingguKe, bulan, tahun]);

  if (!isOpen) return null;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const getReportTitle = () => {
    if (reportType === "harian") return "LAPORAN HARIAN PROYEK TERPADU";
    if (reportType === "bulanan") return "LAPORAN BULANAN PROYEK TERPADU";
    return "TEMPLATE LAPORAN MINGGUAN PPK";
  };

  const getReportSubtitle = () => {
    if (reportType === "harian") return `Laporan Harian – ${reportData?.tanggal_laporan || selectedDate}`;
    if (reportType === "bulanan") return `Laporan Bulanan – ${MONTHS[bulan - 1]} ${tahun}`;
    return `Laporan Minggu ke-${mingguKe} – Wilayah Sumatera`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-[98vw] xl:max-w-[96vw] h-[95vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-[#002060] text-white shrink-0 gap-3">
          {/* Left: Branding & Subtitle */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono">
                  DOKUMEN RESMI PPK
                </span>
                <span className="text-xs text-blue-200">Program KNMP Wilayah Sumatra ({reportData?.total_lokasi || 346} Titik)</span>
              </div>
              <h3 className="text-base font-black text-white tracking-tight">
                {getReportTitle()}
              </h3>
            </div>
          </div>

          {/* Center: Filter Jenis Laporan (Harian / Mingguan / Bulanan) & Input Spesifik */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Mode Switcher */}
            <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/15 text-xs">
              <button
                onClick={() => setReportType("harian")}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  reportType === "harian"
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "text-blue-100 hover:text-white hover:bg-white/5"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Harian</span>
              </button>
              <button
                onClick={() => setReportType("mingguan")}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  reportType === "mingguan"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-blue-100 hover:text-white hover:bg-white/5"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Mingguan</span>
              </button>
              <button
                onClick={() => setReportType("bulanan")}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  reportType === "bulanan"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-blue-100 hover:text-white hover:bg-white/5"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Bulanan</span>
              </button>
            </div>

            {/* Dynamic Specific Filter Inputs */}
            {reportType === "harian" && (
              <div className="flex items-center space-x-2 bg-black/25 px-3 py-1 rounded-xl border border-white/15 text-xs animate-fade-in">
                <span className="text-blue-200 font-medium">Pilih Tanggal:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-lg border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium cursor-pointer"
                />
              </div>
            )}

            {reportType === "mingguan" && (
              <div className="flex items-center space-x-2 bg-black/25 px-3 py-1 rounded-xl border border-white/15 text-xs animate-fade-in">
                <span className="text-blue-200 font-medium">Minggu ke:</span>
                <button
                  onClick={() => setMingguKe((prev) => Math.max(1, prev - 1))}
                  className="p-1 hover:bg-white/10 rounded text-white cursor-pointer"
                  title="Minggu Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-amber-400 px-1">{mingguKe}</span>
                <button
                  onClick={() => setMingguKe((prev) => Math.min(52, prev + 1))}
                  className="p-1 hover:bg-white/10 rounded text-white cursor-pointer"
                  title="Minggu Berikutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-blue-200 font-medium ml-2">Bulan:</span>
                <select
                  value={bulan}
                  onChange={(e) => setBulan(Number(e.target.value))}
                  className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-lg border border-white/20 focus:outline-none cursor-pointer"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={idx} value={idx + 1} className="bg-slate-900 text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {reportType === "bulanan" && (
              <div className="flex items-center space-x-2 bg-black/25 px-3 py-1 rounded-xl border border-white/15 text-xs animate-fade-in">
                <span className="text-blue-200 font-medium">Pilih Bulan:</span>
                <select
                  value={bulan}
                  onChange={(e) => setBulan(Number(e.target.value))}
                  className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-lg border border-white/20 focus:outline-none cursor-pointer"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={idx} value={idx + 1} className="bg-slate-900 text-white">
                      {m}
                    </option>
                  ))}
                </select>
                <span className="text-blue-200 font-medium ml-1">Tahun:</span>
                <span className="font-bold text-amber-400">{tahun}</span>
              </div>
            )}
          </div>

          {/* Right Controls: Zoom, Print, Close */}
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-1 bg-black/25 px-2 py-1 rounded-xl border border-white/15 text-xs">
              <button
                onClick={() => setZoomLevel((prev) => Math.max(prev - 10, 60))}
                className="p-1 hover:bg-white/10 rounded text-blue-200 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1 text-white">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(prev + 10, 140))}
                className="p-1 hover:bg-white/10 rounded text-blue-200 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF A3-A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 md:p-6 bg-slate-100 dark:bg-slate-950">
          {loading ? (
            <div className="p-16 text-center text-slate-500 dark:text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-xs font-medium">Memuat real data laporan dari server...</p>
            </div>
          ) : errorMsg || !reportData ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 text-xs max-w-md mx-auto my-12 shadow-sm space-y-2">
              <div className="font-bold">Gagal Mengambil Data Real</div>
              <p>{errorMsg || "Data laporan tidak tersedia"}</p>
              <button
                onClick={loadReportData}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            /* DOKUMEN CETAK UTAMA TEMPLATE LAPORAN RESMI (A3/A4) */
            <div
              className="mx-auto transition-transform duration-200 origin-top"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
            >
              <div
                ref={printRef}
                className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-300 w-[1420px] max-w-full mx-auto space-y-4 print:p-0 print:border-none print:shadow-none print:w-full print:text-black font-sans"
              >
                {/* 1. Header Banner & Logos */}
                <div className="flex items-center justify-between border-b-2 border-[#002060] pb-3">
                  {/* Left: Logo KKP */}
                  <div className="flex items-center space-x-3">
                    <img
                      src="/assets/img/kkp-logo.png"
                      alt="Logo KKP"
                      className="w-14 h-14 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/assets/img/simandor.png";
                      }}
                    />
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 leading-tight">
                        KEMENTERIAN KELAUTAN DAN PERIKANAN
                      </div>
                      <div className="text-[9px] text-slate-500 font-semibold uppercase">
                        DIREKTORAT JENDERAL PERIKANAN TANGKAP
                      </div>
                    </div>
                  </div>

                  {/* Center: Dynamic Title & Period */}
                  <div className="text-center">
                    <h1 className="text-2xl font-black tracking-tight text-[#002060] uppercase">
                      {getReportTitle()}
                    </h1>
                    <h2 className="text-xs font-black tracking-wider text-slate-800 uppercase mt-0.5">
                      PROGRAM KAMPUNG NELAYAN MERAH PUTIH (KNMP) – WILAYAH SUMATERA
                    </h2>
                    <div className="inline-flex items-center space-x-2 text-[11px] font-bold text-slate-700 bg-slate-100 px-3.5 py-0.5 rounded-full mt-1 border border-slate-200">
                      {reportType === "harian" ? (
                        <span>Laporan Harian Tanggal: <strong>{reportData.tanggal_laporan || selectedDate}</strong></span>
                      ) : reportType === "bulanan" ? (
                        <span>Laporan Bulanan Periode: <strong>{MONTHS[bulan - 1]} {reportData.tahun_anggaran}</strong></span>
                      ) : (
                        <>
                          <span>Laporan Minggu ke- <strong>{reportData.minggu_ke}</strong></span>
                          <span>|</span>
                          <span>Periode: <strong>{reportData.tanggal_awal}</strong> s.d. <strong>{reportData.tanggal_akhir} {reportData.tahun_anggaran}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Logo KNMP Sumatra */}
                  <div className="flex items-center space-x-2 text-right">
                    <div>
                      <div className="text-base font-black tracking-tighter text-[#002060]">
                        KNMP
                      </div>
                      <div className="text-[8px] font-bold uppercase text-red-600 tracking-wider">
                        KAMPUNG NELAYAN MERAH PUTIH
                      </div>
                      <div className="text-[10px] font-black uppercase text-[#002060] tracking-widest">
                        SUMATERA
                      </div>
                    </div>
                    <img
                      src="/assets/img/simandor.png"
                      alt="Logo KNMP"
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </div>

                {/* 2. Top Grid: A (Identitas), B (Ringkasan), C (Dashboard) */}
                <div className="grid grid-cols-12 gap-3.5 items-stretch">
                  {/* A. Identitas Laporan */}
                  <div className="col-span-4 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider flex items-center gap-1.5">
                      <span>A. IDENTITAS LAPORAN</span>
                    </div>
                    <div className="text-[10px] space-y-1.5 text-slate-700 flex-1">
                      <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold text-slate-500">PPK</span>
                        <span className="font-bold text-slate-900 text-right">{reportData.ppk_name}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold text-slate-500">Wilayah</span>
                        <span className="font-bold text-slate-900">{reportData.wilayah}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold text-slate-500">Jumlah Lokasi (Titik)</span>
                        <span className="font-bold text-blue-700">{reportData.total_lokasi} Titik Nelayan</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold text-slate-500">Kontraktor Pelaksana</span>
                        <span className="font-bold text-slate-900">{reportData.total_kontraktor} Perusahaan Penyedia</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold text-slate-500">Sumber Pendanaan</span>
                        <span className="font-bold text-slate-900">{reportData.sumber_dana}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold text-slate-500">Tahun Anggaran</span>
                        <span className="font-bold text-slate-900">{reportData.tahun_anggaran}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Tanggal Laporan</span>
                        <span className="font-bold text-slate-900">{reportData.tanggal_laporan}</span>
                      </div>
                    </div>
                  </div>

                  {/* B. Ringkasan Eksekutif */}
                  <div className="col-span-4 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider flex items-center gap-1.5">
                      <span>B. RINGKASAN EKSEKUTIF</span>
                    </div>
                    <div className="text-[10px] text-slate-700 leading-relaxed space-y-1.5 flex-1">
                      <p>{reportData.ringkasan_narasi}</p>
                    </div>
                  </div>

                  {/* C. Dashboard Capaian Mingguan */}
                  <div className="col-span-4 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>C. DASHBOARD CAPAIAN MINGGUAN</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="text-[8.5px] font-bold text-emerald-800 uppercase">CAPAIAN FISIK</div>
                        <div className="text-base font-black text-emerald-700 mt-0.5">{reportData.capaian_fisik_kumulatif}%</div>
                        <div className="text-[7.5px] text-slate-500">Target: 100%</div>
                      </div>
                      <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-[8.5px] font-bold text-blue-800 uppercase">ON PROGRESS</div>
                        <div className="text-base font-black text-blue-700 mt-0.5">{reportData.lokasi_on_progress}</div>
                        <div className="text-[7.5px] text-slate-500">dari {reportData.total_lokasi} lokasi</div>
                      </div>
                      <div className="p-1.5 bg-teal-50 rounded-lg border border-teal-200">
                        <div className="text-[8.5px] font-bold text-teal-800 uppercase">SELESAI</div>
                        <div className="text-base font-black text-teal-700 mt-0.5">{reportData.lokasi_selesai}</div>
                        <div className="text-[7.5px] text-slate-500">dari {reportData.total_lokasi} lokasi</div>
                      </div>
                    </div>

                    <div className="text-[9.5px] space-y-1 bg-white p-2 rounded-lg border border-slate-200">
                      <div className="flex justify-between">
                        <span className="text-slate-500">NILAI KONTRAK:</span>
                        <strong className="text-slate-900">{formatRupiah(reportData.nilai_kontrak_kumulatif)}</strong>
                      </div>
                      <div className="flex justify-between text-blue-700 font-bold">
                        <span>REALISASI KEUANGAN:</span>
                        <span>{formatRupiah(reportData.realisasi_keuangan)} ({reportData.realisasi_keuangan_pct}%)</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-semibold">
                        <span>SISA ANGGARAN:</span>
                        <span>{formatRupiah(reportData.sisa_anggaran)} ({reportData.sisa_anggaran_pct}%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Middle Grid: D (Progres Rekap Full Width) */}
                <div className="grid grid-cols-12 gap-3 items-start">
                  {/* D. Capaian Progress Fisik (Rekap) */}
                  <div className="col-span-12 bg-slate-50 rounded-xl border border-slate-300 p-2.5 space-y-2">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>D. CAPAIAN PROGRESS FISIK (REKAP)</span>
                    </div>

                    <table className="w-full text-[9px] border-collapse border border-slate-300 text-left bg-white">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black">
                          <th className="border border-slate-300 p-1 w-8 text-center">No</th>
                          <th className="border border-slate-300 p-1">Uraian Pekerjaan</th>
                          <th className="border border-slate-300 p-1 text-center w-20">Lokasi</th>
                          <th className="border border-slate-300 p-1 text-center w-16">Mgg Lalu</th>
                          <th className="border border-slate-300 p-1 text-center w-16">Mgg Ini</th>
                          <th className="border border-slate-300 p-1 text-center w-20 bg-blue-100 font-bold">Kumulatif</th>
                          <th className="border border-slate-300 p-1">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(reportData.progress_rekap || []).map((row) => (
                          <tr key={row.no}>
                            <td className="border border-slate-300 p-1 text-center">{row.no}</td>
                            <td className="border border-slate-300 p-1 font-semibold">{row.uraian}</td>
                            <td className="border border-slate-300 p-1 text-center">{row.lokasi}</td>
                            <td className="border border-slate-300 p-1 text-center">{row.minggu_lalu}%</td>
                            <td className="border border-slate-300 p-1 text-center">{row.minggu_ini}%</td>
                            <td className="border border-slate-300 p-1 text-center font-bold bg-blue-50">{row.kumulatif}%</td>
                            <td className="border border-slate-300 p-1 text-[8.5px] text-slate-500">{row.keterangan || "-"}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-black text-slate-900">
                          <td colSpan={2} className="border border-slate-300 p-1 text-center">RATA-RATA TOTAL</td>
                          <td className="border border-slate-300 p-1 text-center">{reportData.total_lokasi}</td>
                          <td className="border border-slate-300 p-1 text-center">{reportData.progress_total_lalu}%</td>
                          <td className="border border-slate-300 p-1 text-center">{reportData.progress_total_ini}%</td>
                          <td className="border border-slate-300 p-1 text-center text-blue-700 bg-blue-100">{reportData.progress_total_kumulatif}%</td>
                          <td className="border border-slate-300 p-1 text-[8.5px]">Se-Sumatera</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. E. Rekapitulasi Laporan Kegiatan Lapangan dari Kontraktor */}
                <div className="bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2">
                  <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider flex items-center justify-between">
                    <span>E. REKAPITULASI LAPORAN KEGIATAN LAPANGAN (HARIAN / MINGGUAN KONTRAKTOR)</span>
                    <span className="text-[9px] font-normal text-blue-200">
                      Total: {(reportData.laporan_lapangan || []).length} Laporan Tercatat
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-[9px] border-collapse border border-slate-300 text-left bg-white">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black">
                          <th className="border border-slate-300 p-1 w-6 text-center">No</th>
                          <th className="border border-slate-300 p-1">Lokasi Titik KNMP</th>
                          <th className="border border-slate-300 p-1">Nama / Pelaksana</th>
                          <th className="border border-slate-300 p-1 text-center w-20">Tanggal</th>
                          <th className="border border-slate-300 p-1 text-center w-16">Jenis</th>
                          <th className="border border-slate-300 p-1 text-center w-16">Cuaca</th>
                          <th className="border border-slate-300 p-1 text-center w-16">Tenaga Kerja</th>
                          <th className="border border-slate-300 p-1 text-center w-16">Rencana</th>
                          <th className="border border-slate-300 p-1 text-center w-16">Realisasi</th>
                          <th className="border border-slate-300 p-1 text-center w-24">Status</th>
                          <th className="border border-slate-300 p-1">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportData.laporan_lapangan && reportData.laporan_lapangan.length > 0 ? (
                          reportData.laporan_lapangan.map((lap) => (
                            <tr key={lap.no} className="hover:bg-slate-50">
                              <td className="border border-slate-300 p-1 text-center font-bold">{lap.no}</td>
                              <td className="border border-slate-300 p-1 font-semibold text-[#002060]">{lap.knmp_name}</td>
                              <td className="border border-slate-300 p-1">{lap.nama_pelaksana}</td>
                              <td className="border border-slate-300 p-1 text-center">{lap.tanggal}</td>
                              <td className="border border-slate-300 p-1 text-center">
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[8px] font-bold">
                                  {lap.jenis_laporan}
                                </span>
                              </td>
                              <td className="border border-slate-300 p-1 text-center">{lap.cuaca}</td>
                              <td className="border border-slate-300 p-1 text-center">{lap.tenaga_kerja} Org</td>
                              <td className="border border-slate-300 p-1 text-center">{lap.rencana_progres}%</td>
                              <td className="border border-slate-300 p-1 text-center font-bold text-emerald-700 bg-emerald-50/50">{lap.realisasi_progres}%</td>
                              <td className="border border-slate-300 p-1 text-center">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[8px] font-semibold">
                                  {lap.status}
                                </span>
                              </td>
                              <td className="border border-slate-300 p-1 text-[8.5px] text-slate-600">{lap.keterangan || "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={11} className="border border-slate-300 p-3 text-center text-slate-400 italic text-[8.5px]">
                              Tidak ada entri laporan harian/mingguan kontraktor yang tercatat pada database.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Bottom Grid: F (Isu), G (Solusi) */}
                <div className="grid grid-cols-12 gap-3 items-start">
                  {/* F. Isu / Kendala Minggu Ini */}
                  <div className="col-span-6 bg-slate-50 rounded-xl border border-slate-300 p-2.5 space-y-2">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>F. ISU / KENDALA LAPANGAN</span>
                    </div>

                    <table className="w-full text-[9px] border-collapse border border-slate-300 text-left bg-white">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black">
                          <th className="border border-slate-300 p-1 w-6 text-center">No</th>
                          <th className="border border-slate-300 p-1">Isu / Kendala</th>
                          <th className="border border-slate-300 p-1">Lokasi</th>
                          <th className="border border-slate-300 p-1">Penyebab</th>
                          <th className="border border-slate-300 p-1 text-center w-16">Risiko</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportData.issues && reportData.issues.length > 0 ? (
                          reportData.issues.map((iss) => (
                            <tr key={iss.no}>
                              <td className="border border-slate-300 p-1 text-center">{iss.no}</td>
                              <td className="border border-slate-300 p-1 font-semibold">{iss.deskripsi}</td>
                              <td className="border border-slate-300 p-1">{iss.lokasi}</td>
                              <td className="border border-slate-300 p-1">{iss.penyebab}</td>
                              <td className="border border-slate-300 p-1 text-center font-bold">{iss.tingkat_risiko}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="border border-slate-300 p-2.5 text-center text-slate-400 italic text-[8.5px]">
                              Tidak ada kendala aktif yang tercatat pada database.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* G. Solusi Dan Tindak Lanjut */}
                  <div className="col-span-6 bg-slate-50 rounded-xl border border-slate-300 p-2.5 space-y-2">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>G. SOLUSI DAN TINDAK LANJUT</span>
                    </div>

                    <table className="w-full text-[9px] border-collapse border border-slate-300 text-left bg-white">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black">
                          <th className="border border-slate-300 p-1 w-6 text-center">No</th>
                          <th className="border border-slate-300 p-1">Solusi / Rencana Aksi</th>
                          <th className="border border-slate-300 p-1 w-24">PIC</th>
                          <th className="border border-slate-300 p-1 w-20">Target</th>
                          <th className="border border-slate-300 p-1 text-center w-24">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportData.issues && reportData.issues.length > 0 ? (
                          reportData.issues.map((iss) => (
                            <tr key={iss.no}>
                              <td className="border border-slate-300 p-1 text-center">{iss.no}</td>
                              <td className="border border-slate-300 p-1">{iss.rencana_mitigasi}</td>
                              <td className="border border-slate-300 p-1 font-semibold">{iss.pic}</td>
                              <td className="border border-slate-300 p-1">{iss.target_selesai}</td>
                              <td className="border border-slate-300 p-1 text-center font-bold text-blue-700">{iss.status}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="border border-slate-300 p-2.5 text-center text-slate-400 italic text-[8.5px]">
                              Tidak ada rencana aksi tindak lanjut yang tercatat.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 6. Photos, HSE & Signatures (H, I, J) */}
                <div className="grid grid-cols-12 gap-3.5 items-stretch">
                  {/* H. Dokumentasi Kegiatan Lapangan (Sampel Geotagging) */}
                  <div className="col-span-6 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>H. DOKUMENTASI KEGIATAN LAPANGAN (SAMPEL GEOTAGGING GPS)</span>
                    </div>

                    {reportData.photos && reportData.photos.length > 0 ? (
                      <div className="grid grid-cols-6 gap-2">
                        {reportData.photos.map((item, idx) => (
                          <div key={idx} className="space-y-1 text-center group">
                            <div className="h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center relative shadow-xs">
                              <img
                                src={item.file_url}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  if (e.currentTarget.parentElement) {
                                    e.currentTarget.parentElement.innerHTML =
                                      '<div class="flex flex-col items-center justify-center p-1 text-slate-400 text-[8px] font-semibold"><span class="text-xs mb-0.5">📷</span><span>Foto Lapangan</span></div>';
                                  }
                                }}
                              />
                              <div className="absolute top-0.5 right-0.5 bg-black/60 text-white text-[6.5px] font-bold px-1 py-0.2 rounded backdrop-blur-xs">
                                GPS 📍
                              </div>
                            </div>
                            <span className="text-[7.5px] font-bold text-slate-700 block line-clamp-1" title={item.title}>
                              {item.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-16 flex items-center justify-center bg-white rounded-lg border border-dashed border-slate-300 text-slate-400 text-[8.5px] italic">
                        Belum ada foto dokumentasi kegiatan lapangan yang diunggah.
                      </div>
                    )}
                  </div>

                  {/* I. Kepatuhan & Keselamatan Kerja */}
                  <div className="col-span-3 bg-slate-50 rounded-xl border border-slate-300 p-2.5 space-y-2">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>I. KEPATUHAN & KESELAMATAN (K3)</span>
                    </div>

                    <div className="text-[9.5px] space-y-1.5 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">⚠️ Kecelakaan Kerja:</span>
                        <strong className="text-emerald-700">{reportData.k3_kecelakaan} Kejadian</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">⚠️ Near Miss:</span>
                        <strong className="text-emerald-700">{reportData.k3_near_miss} Kejadian</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">👷 Pelatihan K3:</span>
                        <strong className="text-blue-700">{reportData.k3_pelatihan} Kegiatan</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">🛡️ Kepatuhan APD:</span>
                        <strong className="text-emerald-700">{reportData.k3_kepatuhan_apd}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* J. Penutup & Tanda Tangan */}
                  <div className="col-span-3 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>J. PENUTUP & PENGESAHAN</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-[8.5px]">
                      <div>
                        <p className="font-semibold text-slate-600">PPK KNMP SUMATRA</p>
                        <div className="h-10"></div>
                        <p className="font-bold text-slate-900 underline">{reportData.ppk_name}</p>
                        <p className="text-[7.5px] text-slate-500">NIP: {reportData.ppk_nip}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-600">Kepala Dinas KP Provinsi</p>
                        <div className="h-10"></div>
                        <p className="font-bold text-slate-900 underline">{reportData.kadis_name}</p>
                        <p className="text-[7.5px] text-slate-500">NIP: {reportData.kadis_nip}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Footer Notes & Slogan */}
                <div className="border-t-2 border-[#002060] pt-2 flex items-center justify-between text-[8px] text-slate-500">
                  <div>
                    <strong>Catatan:</strong> 1. Laporan ini wajib disampaikan setiap minggu (paling lambat hari Senin pukul 10.00 WIB) | 2. Lampiran: Data Pendukung, Foto, Notulen Rapat.
                  </div>
                  <div className="font-black text-[#002060] uppercase tracking-wider text-center">
                    "Bersinergi Membangun Desa Pesisir, Ekonomi Naik, Nelayan Sejahtera"
                  </div>
                  <div className="font-mono font-bold text-slate-600">
                    Versi 1.0 – {reportData.tahun_anggaran}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
