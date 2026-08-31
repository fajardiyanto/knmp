import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  Building,
  HardHat,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  MapPin,
  FileText,
  Info,
  Layers,
  Search,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Database,
  Sliders,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";

interface LaporanMingguanPPKModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeek?: number;
}

export const LaporanMingguanPPKModal: React.FC<LaporanMingguanPPKModalProps> = ({
  isOpen,
  onClose,
  initialWeek = 14,
}) => {
  const [activeTab, setActiveTab] = useState<"laporan" | "sumber_data">("laporan");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [mingguKe, setMingguKe] = useState<number>(initialWeek);
  const [tglAwal, setTglAwal] = useState<string>("01 September");
  const [tglAkhir, setTglAkhir] = useState<string>("07 September");
  const [ppkName, setPpkName] = useState<string>("Ir. Hendra Wijaya, M.T.");
  const [ppkNip, setPpkNip] = useState<string>("19780415 200312 1 002");
  const [kadisName, setKadisName] = useState<string>("Dr. Ir. H. Syamsul Bahri, M.Si.");
  const [kadisNip, setKadisNip] = useState<string>("19720819 199803 1 004");
  const [isLandscape, setIsLandscape] = useState<boolean>(true);

  // Live aggregated metrics state
  const [totalTitik] = useState<number>(346);
  const [lokasiOnProgress, setLokasiOnProgress] = useState<number>(136);
  const [lokasiSelesai, setLokasiSelesai] = useState<number>(58);
  const [lokasiPersiapan, setLokasiPersiapan] = useState<number>(142);
  const [lokasiTertunda, setLokasiTertunda] = useState<number>(10);
  const [capaianFisikKumulatif, setCapaianFisikKumulatif] = useState<number>(72.45);
  const [nilaiKontrakKumulatif] = useState<number>(127450000000);
  const [realisasiKeuangan, setRealisasiKeuangan] = useState<number>(68920000000);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-load summary or live data if available
      apiFetch<any>("/api/v1/knmp/widget")
        .then((res) => {
          if (res && res.data) {
            // Can sync with real DB stats
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const realisasiKeuanganPct = ((realisasiKeuangan / nilaiKontrakKumulatif) * 100).toFixed(2);
  const sisaAnggaran = nilaiKontrakKumulatif - realisasiKeuangan;
  const sisaAnggaranPct = ((sisaAnggaran / nilaiKontrakKumulatif) * 100).toFixed(2);

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-[98vw] xl:max-w-[96vw] h-[94vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Modal Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white shrink-0 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/30 rounded-xl">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-600 text-white">
                  Template Resmi PPK
                </span>
                <span className="text-xs text-slate-400">KNMP Se-Sumatera (346 Titik)</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Laporan Mingguan PPK KNMP – Wilayah Sumatra
              </h3>
            </div>
          </div>

          {/* Center Tabs: Laporan vs Kamus Sumber Data */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab("laporan")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === "laporan"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dokumen Laporan Mingguan</span>
            </button>
            <button
              onClick={() => setActiveTab("sumber_data")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === "sumber_data"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Silsilah & Sumber Data (A - M)</span>
            </button>
          </div>

          {/* Right Actions: Zoom, Print, Close */}
          <div className="flex items-center space-x-2">
            {activeTab === "laporan" && (
              <>
                <div className="hidden sm:flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-xs">
                  <button
                    onClick={() => setZoomLevel((prev) => Math.max(prev - 10, 60))}
                    className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] px-1 text-slate-300">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel((prev) => Math.min(prev + 10, 140))}
                    className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF A3-A4</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 md:p-6 bg-slate-100 dark:bg-slate-950">
          {activeTab === "sumber_data" ? (
            /* ========================================================================= */
            /* TAB: KAMUS SUMBER DATA & SILSILAH DATA (A - M)                            */
            /* ========================================================================= */
            <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-300">
                  <Database className="w-4 h-4" />
                  <span>DATA LINEAGE & INTEGRASI DATABASE</span>
                </div>
                <h2 className="text-xl font-black">
                  Matriks Sumber Data Template Laporan Mingguan PPK
                </h2>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Berikut rincian silsilah data (*data lineage*), asal tabel database PostgreSQL, formula agregasi, dan modul sumber untuk setiap seksi A sampai M pada template laporan resmi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* A. Identitas */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-black">A</span>
                      <span>Identitas Laporan</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">Master Data</span>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li>• <strong>PPK / Wilayah</strong>: Dari profil User role `ppk` & regional master (`regionals`).</li>
                    <li>• <strong>Jumlah Lokasi</strong>: `COUNT(*) FROM knmps` = 346 titik se-Sumatera.</li>
                    <li>• <strong>Jumlah Kontraktor</strong>: `COUNT(DISTINCT perusahaan_id) FROM persiapans`.</li>
                    <li>• <strong>Sumber Dana & TA</strong>: APBN Tahun Anggaran 2026 (Master Kontrak).</li>
                  </ul>
                </div>

                {/* B. Ringkasan Eksekutif */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-black">B</span>
                      <span>Ringkasan Eksekutif</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 uppercase">Auto Generator</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Narasi otomatis (*automated executive briefing*) yang merangkum rata-rata progres fisik kumulatif, jumlah lokasi berjalan/selesai/tertunda, dan ringkasan mitigasi kendala minggu berjalan.
                  </p>
                </div>

                {/* C. Dashboard Capaian */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-black">C</span>
                      <span>Dashboard Capaian Mingguan</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 uppercase">Agregasi KPI</span>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li>• <strong>Capaian Fisik</strong>: `AVG(realisasi_progres_fisik) FROM laporans`.</li>
                    <li>• <strong>Nilai Kontrak</strong>: `SUM(nilai_kontrak) FROM persiapans` = Rp 127,45 M.</li>
                    <li>• <strong>Realisasi Keuangan</strong>: `SUM(realisasi_anggaran) FROM pembayarans`.</li>
                    <li>• <strong>Lokasi On Progress/Selesai</strong>: `COUNT(*)` per status `knmps`.</li>
                  </ul>
                </div>

                {/* D. Peta Sebaran GIS */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-black">D</span>
                      <span>Peta Sebaran Titik KNMP</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-600 uppercase">Spasial GIS</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Koordinat `latitude`, `longitude` dari tabel `knmps` se-Sumatera, dengan marker clustering warna (🟢 Selesai, 🔵 On Progress, 🟡 Persiapan, 🔴 Bermasalah).
                  </p>
                </div>

                {/* E & F. Rekap Progres & Lokasi */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-black">E-F</span>
                      <span>Rekap Progres Fisik & Lokasi</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 uppercase">Tahapan Proyek</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Data breakdown tahapan (Persiapan, Fisik, Pengadaan, Perijinan, QC) dari `laporans` dan `pelaksanaans` minggu lalu vs minggu ini vs kumulatif.
                  </p>
                </div>

                {/* G. Klaster Pekerjaan */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-black">G</span>
                      <span>Progress Per Klaster</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 uppercase">Jenis Bangunan</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Rata-rata progres dari tabel `laporan_jenis_bangunan` yang dikelompokkan ke dalam 5 klaster master: Infrastruktur Darat, Laut, Produksi, UMKM, dan Sosial.
                  </p>
                </div>

                {/* H & I. Isu & Solusi */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-red-700 dark:text-red-400 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 flex items-center justify-center text-xs font-black">H-I</span>
                      <span>Isu / Kendala & Tindak Lanjut</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 dark:bg-red-950 text-red-600 uppercase">Modul Issue & Notulen</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Data kendala dari tabel `issues` (`tingkat_kendala`, `dampak`, `penyebab`, `rencana_mitigasi`, `pic`, `target_selesai`) dan kesepakatan meeting dari tabel `notulens`.
                  </p>
                </div>

                {/* J & K. Rencana & Dokumentasi Foto */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xs font-black">J-K</span>
                      <span>Rencana Depan & Foto Geotagging</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-600 uppercase">Documents & Pelaksanaan</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Foto dari tabel `documents` (`documentable_type = 'pelaksanaan' OR 'laporan'`) terverifikasi geotagging GPS untuk 6 klaster kegiatan.
                  </p>
                </div>

                {/* L & M. K3 & Pengesahan */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white flex items-center justify-center text-xs font-black">L-M</span>
                      <span>Kepatuhan K3 & Lembar Pengesahan Resmi</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 uppercase">HSE & Signature</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Metrik kecelakaan kerja, near miss, kepatuhan APD dari log harian keselamatan K3 `pelaksanaans`, serta lembar tanda tangan PPK KNMP Sumatra & Kepala Dinas Kelautan dan Perikanan.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* TAB: DOKUMEN CETAK UTAMA TEMPLATE LAPORAN MINGGUAN PPK (A3/A4 LANDSCAPE)  */
            /* ========================================================================= */
            <div
              className="mx-auto transition-transform duration-200 origin-top"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
            >
              <div
                ref={printRef}
                className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-300 w-[1400px] max-w-full mx-auto space-y-4 print:p-0 print:border-none print:shadow-none print:w-full print:text-black font-sans"
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

                  {/* Center: Title & Week Period */}
                  <div className="text-center">
                    <h1 className="text-2xl font-black tracking-tight text-[#002060] uppercase">
                      TEMPLATE LAPORAN MINGGUAN PPK
                    </h1>
                    <h2 className="text-xs font-black tracking-wider text-slate-800 uppercase mt-0.5">
                      PROGRAM KAMPUNG NELAYAN MERAH PUTIH (KNMP) – WILAYAH SUMATRA
                    </h2>
                    <div className="inline-flex items-center space-x-2 text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-0.5 rounded-full mt-1 border border-slate-200">
                      <span>Laporan Minggu ke- <strong>{mingguKe}</strong></span>
                      <span>|</span>
                      <span>Periode: <strong>{tglAwal}</strong> s.d. <strong>{tglAkhir} 2026</strong></span>
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
                        SUMATRA
                      </div>
                    </div>
                    <img
                      src="/assets/img/simandor.png"
                      alt="Logo KNMP"
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </div>

                {/* 2. Top Grid: A (Identitas), B (Ringkasan), C (Dashboard), D (Peta Spasial) */}
                <div className="grid grid-cols-12 gap-3.5 items-stretch">
                  {/* A. Identitas Laporan */}
                  <div className="col-span-3 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider flex items-center gap-1.5">
                      <span>A. IDENTITAS LAPORAN</span>
                    </div>
                    <div className="text-[10px] space-y-1.5 text-slate-700 flex-1">
                      <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold text-slate-500">PPK</span>
                        <span className="font-bold text-slate-900 text-right">{ppkName}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold text-slate-500">Wilayah</span>
                        <span className="font-bold text-slate-900">SUMATRA</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold text-slate-500">Jumlah Lokasi (Titik)</span>
                        <span className="font-bold text-blue-700">{totalTitik} Titik Nelayan</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold text-slate-500">Kontraktor Pelaksana</span>
                        <span className="font-bold text-slate-900">32 Perusahaan Penyedia</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold text-slate-500">Sumber Pendanaan</span>
                        <span className="font-bold text-slate-900">APBN</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold text-slate-500">Tahun Anggaran</span>
                        <span className="font-bold text-slate-900">2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Tanggal Laporan</span>
                        <span className="font-bold text-slate-900">{tglAkhir} 2026</span>
                      </div>
                    </div>
                  </div>

                  {/* B. Ringkasan Eksekutif */}
                  <div className="col-span-3 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider flex items-center gap-1.5">
                      <span>B. RINGKASAN EKSEKUTIF</span>
                    </div>
                    <div className="text-[10px] text-slate-700 leading-relaxed space-y-1.5 flex-1">
                      <p>
                        Pada minggu ini, pelaksanaan Program KNMP Sumatra menunjukkan kemajuan positif dengan capaian fisik kumulatif sebesar <strong className="text-emerald-700">{capaianFisikKumulatif}%</strong>.
                      </p>
                      <p>
                        Sebanyak <strong>{lokasiOnProgress}</strong> lokasi on progress, <strong>{lokasiSelesai}</strong> lokasi selesai, dan <strong>{lokasiPersiapan}</strong> lokasi masih dalam tahap persiapan. Terdapat <strong>5</strong> isu/kendala utama yang sedang ditindaklanjuti dengan solusi dan rencana aksi yang terencana.
                      </p>
                      <p className="text-slate-500 italic">
                        Secara umum, pelaksanaan proyek berjalan sesuai rencana dengan komitmen menjaga mutu, K3, dan target waktu.
                      </p>
                    </div>
                  </div>

                  {/* C. Dashboard Capaian Mingguan */}
                  <div className="col-span-3 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>C. DASHBOARD CAPAIAN MINGGUAN</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="text-[9px] font-bold text-emerald-800 uppercase">CAPAIAN FISIK</div>
                        <div className="text-base font-black text-emerald-700 mt-0.5">{capaianFisikKumulatif}%</div>
                        <div className="text-[8px] text-slate-500">Target: 100%</div>
                      </div>
                      <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-[9px] font-bold text-blue-800 uppercase">ON PROGRESS</div>
                        <div className="text-base font-black text-blue-700 mt-0.5">{lokasiOnProgress}</div>
                        <div className="text-[8px] text-slate-500">dari 346 lokasi</div>
                      </div>
                      <div className="p-1.5 bg-teal-50 rounded-lg border border-teal-200">
                        <div className="text-[9px] font-bold text-teal-800 uppercase">SELESAI</div>
                        <div className="text-base font-black text-teal-700 mt-0.5">{lokasiSelesai}</div>
                        <div className="text-[8px] text-slate-500">dari 346 lokasi</div>
                      </div>
                    </div>

                    <div className="text-[9.5px] space-y-1 bg-white p-2 rounded-lg border border-slate-200">
                      <div className="flex justify-between">
                        <span className="text-slate-500">NILAI KONTRAK:</span>
                        <strong className="text-slate-900">{formatRupiah(nilaiKontrakKumulatif)}</strong>
                      </div>
                      <div className="flex justify-between text-blue-700 font-bold">
                        <span>REALISASI KEUANGAN:</span>
                        <span>{formatRupiah(realisasiKeuangan)} ({realisasiKeuanganPct}%)</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-semibold">
                        <span>SISA ANGGARAN:</span>
                        <span>{formatRupiah(sisaAnggaran)} ({sisaAnggaranPct}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* D. Peta Sebaran Titik KNMP Sumatra */}
                  <div className="col-span-3 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider flex items-center justify-between">
                      <span>D. PETA SEBARAN TITIK SUMATRA</span>
                      <span className="text-[9px] font-normal lowercase">346 koordinat</span>
                    </div>

                    <div className="relative bg-sky-50/50 rounded-lg border border-sky-200 h-36 overflow-hidden flex items-center justify-center p-1">
                      {/* Stylized SVG Map of Sumatra with Status Points */}
                      <svg viewBox="0 0 300 200" className="w-full h-full object-contain">
                        {/* Sumatra Island Path outline */}
                        <path
                          d="M 50,25 L 80,45 L 115,70 L 150,110 L 180,140 L 220,175 L 210,185 L 185,180 L 140,145 L 110,115 L 75,80 L 40,40 Z"
                          fill="#dcfce7"
                          stroke="#16a34a"
                          strokeWidth="1.5"
                        />
                        {/* Status Dots */}
                        {/* Aceh */}
                        <circle cx="55" cy="30" r="4.5" fill="#16a34a" />
                        <circle cx="65" cy="38" r="4" fill="#2563eb" />
                        <text x="65" y="24" fontSize="6.5" fontWeight="bold" fill="#0f172a">Banda Aceh</text>

                        {/* Sumut / Medan */}
                        <circle cx="85" cy="55" r="4.5" fill="#16a34a" />
                        <circle cx="95" cy="62" r="4" fill="#eab308" />
                        <circle cx="90" cy="70" r="4" fill="#2563eb" />

                        {/* Riau / Pekanbaru */}
                        <circle cx="125" cy="85" r="4.5" fill="#16a34a" />
                        <circle cx="135" cy="95" r="4" fill="#dc2626" />
                        <text x="140" y="90" fontSize="6.5" fontWeight="bold" fill="#0f172a">Pekanbaru</text>

                        {/* Sumbar / Padang */}
                        <circle cx="105" cy="105" r="4.5" fill="#dc2626" />
                        <circle cx="115" cy="115" r="4" fill="#2563eb" />
                        <text x="80" y="105" fontSize="6.5" fontWeight="bold" fill="#0f172a">Padang</text>

                        {/* Jambi / Sumsel / Palembang */}
                        <circle cx="155" cy="120" r="4.5" fill="#16a34a" />
                        <circle cx="165" cy="135" r="4" fill="#2563eb" />
                        <circle cx="180" cy="145" r="4.5" fill="#16a34a" />
                        <text x="185" y="135" fontSize="6.5" fontWeight="bold" fill="#0f172a">Palembang</text>

                        {/* Bengkulu & Lampung */}
                        <circle cx="145" cy="145" r="4" fill="#dc2626" />
                        <circle cx="195" cy="165" r="4.5" fill="#16a34a" />
                        <circle cx="210" cy="180" r="4" fill="#2563eb" />
                        <text x="180" y="185" fontSize="6.5" fontWeight="bold" fill="#0f172a">Bandar Lampung</text>
                      </svg>

                      {/* Map Status Legend */}
                      <div className="absolute right-1 top-1 bg-white/90 backdrop-blur-xs p-1 rounded border border-slate-300 text-[8px] space-y-0.5 font-bold shadow-2xs">
                        <div className="flex items-center gap-1 text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Selesai
                        </div>
                        <div className="flex items-center gap-1 text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span> On Progress
                        </div>
                        <div className="flex items-center gap-1 text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Persiapan
                        </div>
                        <div className="flex items-center gap-1 text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-red-600"></span> Bermasalah
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Middle Grid: E (Progres Rekap), F (Rekap Lokasi), G (Klaster Pekerjaan) */}
                <div className="grid grid-cols-12 gap-3.5 items-stretch">
                  {/* E. Capaian Progress Fisik (Rekap) */}
                  <div className="col-span-4 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>E. CAPAIAN PROGRESS FISIK (REKAP)</span>
                    </div>

                    <table className="w-full text-[9px] border-collapse border border-slate-300 text-left bg-white">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black">
                          <th className="border border-slate-300 p-1 w-6 text-center">No</th>
                          <th className="border border-slate-300 p-1">Uraian</th>
                          <th className="border border-slate-300 p-1 text-center w-12">Lokasi</th>
                          <th className="border border-slate-300 p-1 text-center w-10">Mgg Lalu</th>
                          <th className="border border-slate-300 p-1 text-center w-10">Mgg Ini</th>
                          <th className="border border-slate-300 p-1 text-center w-12 bg-blue-100 font-bold">Kumulatif</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">1</td>
                          <td className="border border-slate-300 p-1 font-semibold">Persiapan & Administrasi</td>
                          <td className="border border-slate-300 p-1 text-center">346</td>
                          <td className="border border-slate-300 p-1 text-center">92%</td>
                          <td className="border border-slate-300 p-1 text-center">4%</td>
                          <td className="border border-slate-300 p-1 text-center font-bold bg-blue-50">96.0%</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">2</td>
                          <td className="border border-slate-300 p-1 font-semibold">Pekerjaan Fisik & Struktur</td>
                          <td className="border border-slate-300 p-1 text-center">346</td>
                          <td className="border border-slate-300 p-1 text-center">64%</td>
                          <td className="border border-slate-300 p-1 text-center">6.8%</td>
                          <td className="border border-slate-300 p-1 text-center font-bold bg-blue-50">70.8%</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">3</td>
                          <td className="border border-slate-300 p-1 font-semibold">Pengadaan & Distribusi Alat</td>
                          <td className="border border-slate-300 p-1 text-center">346</td>
                          <td className="border border-slate-300 p-1 text-center">58%</td>
                          <td className="border border-slate-300 p-1 text-center">5.2%</td>
                          <td className="border border-slate-300 p-1 text-center font-bold bg-blue-50">63.2%</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">4</td>
                          <td className="border border-slate-300 p-1 font-semibold">QC / Pengendalian Mutu</td>
                          <td className="border border-slate-300 p-1 text-center">346</td>
                          <td className="border border-slate-300 p-1 text-center">68%</td>
                          <td className="border border-slate-300 p-1 text-center">4.5%</td>
                          <td className="border border-slate-300 p-1 text-center font-bold bg-blue-50">72.5%</td>
                        </tr>
                        <tr className="bg-slate-100 font-black text-slate-900">
                          <td colSpan={2} className="border border-slate-300 p-1 text-center">RATA-RATA TOTAL</td>
                          <td className="border border-slate-300 p-1 text-center">346</td>
                          <td className="border border-slate-300 p-1 text-center">67.3%</td>
                          <td className="border border-slate-300 p-1 text-center">5.15%</td>
                          <td className="border border-slate-300 p-1 text-center text-blue-700 bg-blue-100">{capaianFisikKumulatif}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* F. Rekap Lokasi (Titik KNMP) */}
                  <div className="col-span-4 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>F. REKAP LOKASI (TITIK KNMP)</span>
                    </div>

                    <table className="w-full text-[9px] border-collapse border border-slate-300 text-left bg-white">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black">
                          <th className="border border-slate-300 p-1 w-6 text-center">No</th>
                          <th className="border border-slate-300 p-1">Status Lokasi</th>
                          <th className="border border-slate-300 p-1 text-center w-16">Jumlah Lokasi</th>
                          <th className="border border-slate-300 p-1 text-center w-16">Persentase (%)</th>
                          <th className="border border-slate-300 p-1">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">1</td>
                          <td className="border border-slate-300 p-1 font-semibold text-emerald-700">🟢 Selesai (100%)</td>
                          <td className="border border-slate-300 p-1 text-center font-bold">{lokasiSelesai}</td>
                          <td className="border border-slate-300 p-1 text-center">{((lokasiSelesai/totalTitik)*100).toFixed(1)}%</td>
                          <td className="border border-slate-300 p-1 text-[8.5px] text-slate-500">Siap PHO</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">2</td>
                          <td className="border border-slate-300 p-1 font-semibold text-blue-700">🔵 On Progress</td>
                          <td className="border border-slate-300 p-1 text-center font-bold">{lokasiOnProgress}</td>
                          <td className="border border-slate-300 p-1 text-center">{((lokasiOnProgress/totalTitik)*100).toFixed(1)}%</td>
                          <td className="border border-slate-300 p-1 text-[8.5px] text-slate-500">Konstruksi aktif</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">3</td>
                          <td className="border border-slate-300 p-1 font-semibold text-amber-700">🟡 Dalam Persiapan</td>
                          <td className="border border-slate-300 p-1 text-center font-bold">{lokasiPersiapan}</td>
                          <td className="border border-slate-300 p-1 text-center">{((lokasiPersiapan/totalTitik)*100).toFixed(1)}%</td>
                          <td className="border border-slate-300 p-1 text-[8.5px] text-slate-500">Mobilisasi/PCM</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">4</td>
                          <td className="border border-slate-300 p-1 font-semibold text-red-700">🔴 Tertunda / Masalah</td>
                          <td className="border border-slate-300 p-1 text-center font-bold">{lokasiTertunda}</td>
                          <td className="border border-slate-300 p-1 text-center">{((lokasiTertunda/totalTitik)*100).toFixed(1)}%</td>
                          <td className="border border-slate-300 p-1 text-[8.5px] text-slate-500">Mitigasi cuaca/lahan</td>
                        </tr>
                        <tr className="bg-slate-100 font-black text-slate-900">
                          <td colSpan={2} className="border border-slate-300 p-1 text-center">TOTAL</td>
                          <td className="border border-slate-300 p-1 text-center">{totalTitik}</td>
                          <td className="border border-slate-300 p-1 text-center">100%</td>
                          <td className="border border-slate-300 p-1 text-[8.5px]">Se-Sumatera</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* G. Progress Per Klaster Pekerjaan */}
                  <div className="col-span-4 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>G. PROGRESS PER KLASTER PEKERJAAN</span>
                    </div>

                    <div className="space-y-2 text-[9.5px]">
                      {/* Klaster 1 */}
                      <div>
                        <div className="flex justify-between font-bold text-slate-800 mb-0.5">
                          <span>🏢 A. Infrastruktur Darat</span>
                          <span className="text-emerald-700">78,45%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: "78.45%" }}></div>
                        </div>
                      </div>

                      {/* Klaster 2 */}
                      <div>
                        <div className="flex justify-between font-bold text-slate-800 mb-0.5">
                          <span>⛵ B. Infrastruktur Laut</span>
                          <span className="text-blue-700">71,32%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: "71.32%" }}></div>
                        </div>
                      </div>

                      {/* Klaster 3 */}
                      <div>
                        <div className="flex justify-between font-bold text-slate-800 mb-0.5">
                          <span>⚙️ C. Sarana & Prasarana Produksi</span>
                          <span className="text-purple-700">65,18%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-purple-600 h-full rounded-full" style={{ width: "65.18%" }}></div>
                        </div>
                      </div>

                      {/* Klaster 4 */}
                      <div>
                        <div className="flex justify-between font-bold text-slate-800 mb-0.5">
                          <span>🏪 D. Sarana Pendukung & UMKM</span>
                          <span className="text-amber-700">58,90%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: "58.90%" }}></div>
                        </div>
                      </div>

                      {/* Klaster 5 */}
                      <div>
                        <div className="flex justify-between font-bold text-slate-800 mb-0.5">
                          <span>👥 E. Penguatan Kelembagaan & Sosial</span>
                          <span className="text-teal-700">63,27%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-teal-600 h-full rounded-full" style={{ width: "63.27%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Bottom Grid: H (Isu), I (Solusi), J (Rencana Depan) */}
                <div className="grid grid-cols-12 gap-3.5 items-stretch">
                  {/* H. Isu / Kendala Minggu Ini */}
                  <div className="col-span-4 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>H. ISU / KENDALA MINGGU INI</span>
                    </div>

                    <table className="w-full text-[9px] border-collapse border border-slate-300 text-left bg-white">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black">
                          <th className="border border-slate-300 p-1 w-5 text-center">No</th>
                          <th className="border border-slate-300 p-1">Isu / Kendala</th>
                          <th className="border border-slate-300 p-1">Lokasi</th>
                          <th className="border border-slate-300 p-1">Penyebab</th>
                          <th className="border border-slate-300 p-1 text-center w-12">Risiko</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">1</td>
                          <td className="border border-slate-300 p-1 font-semibold">Cuaca Gelombang Tinggi</td>
                          <td className="border border-slate-300 p-1">Aceh Besar & Nias</td>
                          <td className="border border-slate-300 p-1">Musim Angin Barat</td>
                          <td className="border border-slate-300 p-1 text-center text-red-600 font-bold">🔴 Tinggi</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">2</td>
                          <td className="border border-slate-300 p-1 font-semibold">Keterlambatan Pasokan Tiang</td>
                          <td className="border border-slate-300 p-1">Pesisir Barat Lampung</td>
                          <td className="border border-slate-300 p-1">Jalur Kapal Logistik</td>
                          <td className="border border-slate-300 p-1 text-center text-amber-600 font-bold">🟡 Sedang</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">3</td>
                          <td className="border border-slate-300 p-1 font-semibold">Izin Akses Lahan Tambat</td>
                          <td className="border border-slate-300 p-1">Belawan Sumut</td>
                          <td className="border border-slate-300 p-1">Batas Sempadan Pantai</td>
                          <td className="border border-slate-300 p-1 text-center text-amber-600 font-bold">🟡 Sedang</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* I. Solusi Dan Tindak Lanjut */}
                  <div className="col-span-4 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>I. SOLUSI DAN TINDAK LANJUT</span>
                    </div>

                    <table className="w-full text-[9px] border-collapse border border-slate-300 text-left bg-white">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black">
                          <th className="border border-slate-300 p-1 w-5 text-center">No</th>
                          <th className="border border-slate-300 p-1">Solusi / Rencana Aksi</th>
                          <th className="border border-slate-300 p-1 w-16">PIC</th>
                          <th className="border border-slate-300 p-1 w-14">Target</th>
                          <th className="border border-slate-300 p-1 text-center w-14">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">1</td>
                          <td className="border border-slate-300 p-1">Penyesuaian jam kerja pasang-surut</td>
                          <td className="border border-slate-300 p-1">Site Engineer</td>
                          <td className="border border-slate-300 p-1">10 Sept</td>
                          <td className="border border-slate-300 p-1 text-center font-bold text-blue-700">On Progress</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">2</td>
                          <td className="border border-slate-300 p-1">Pengalihan supplier beton lokal alternatif</td>
                          <td className="border border-slate-300 p-1">Logistik</td>
                          <td className="border border-slate-300 p-1">08 Sept</td>
                          <td className="border border-slate-300 p-1 text-center font-bold text-blue-700">On Progress</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">3</td>
                          <td className="border border-slate-300 p-1">Fasilitasi mediasi dinas & kepala desa</td>
                          <td className="border border-slate-300 p-1">PPK / Pengawas</td>
                          <td className="border border-slate-300 p-1">12 Sept</td>
                          <td className="border border-slate-300 p-1 text-center font-bold text-amber-700">Dalam Proses</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* J. Rencana Pekerjaan Minggu Depan */}
                  <div className="col-span-4 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>J. RENCANA PEKERJAAN MINGGU DEPAN</span>
                    </div>

                    <table className="w-full text-[9px] border-collapse border border-slate-300 text-left bg-white">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black">
                          <th className="border border-slate-300 p-1 w-5 text-center">No</th>
                          <th className="border border-slate-300 p-1">Rencana Pekerjaan Utama</th>
                          <th className="border border-slate-300 p-1 text-center w-20">Target Capaian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">1</td>
                          <td className="border border-slate-300 p-1">Pengecoran lantai dermaga & balok pengikat</td>
                          <td className="border border-slate-300 p-1 text-center font-bold text-emerald-700">+ 4.50%</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">2</td>
                          <td className="border border-slate-300 p-1">Pemasangan atap & instalasi solar panel ice maker</td>
                          <td className="border border-slate-300 p-1 text-center font-bold text-emerald-700">+ 3.20%</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">3</td>
                          <td className="border border-slate-300 p-1">Inspeksi mutu beton bersama Konsultan Pengawas</td>
                          <td className="border border-slate-300 p-1 text-center font-bold text-emerald-700">100% Ceklis</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-center">4</td>
                          <td className="border border-slate-300 p-1">Distribusi mesin pendingin ke 15 titik nelayan</td>
                          <td className="border border-slate-300 p-1 text-center font-bold text-emerald-700">+ 2.80%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Photos, HSE & Signatures (K, L, M) */}
                <div className="grid grid-cols-12 gap-3.5 items-stretch">
                  {/* K. Dokumentasi Kegiatan Minggu Ini (Sampel) */}
                  <div className="col-span-6 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>K. DOKUMENTASI KEGIATAN MINGGU INI (SAMPEL GEOTAGGING)</span>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      <div className="space-y-1 text-center">
                        <div className="h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center">
                          <img src="/assets/img/simandor.png" alt="Infrastruktur Darat" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[7.5px] font-bold text-slate-700 block line-clamp-1">Infrastruktur Darat</span>
                      </div>
                      <div className="space-y-1 text-center">
                        <div className="h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center">
                          <img src="/assets/img/simandor.png" alt="Infrastruktur Laut" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[7.5px] font-bold text-slate-700 block line-clamp-1">Infrastruktur Laut</span>
                      </div>
                      <div className="space-y-1 text-center">
                        <div className="h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center">
                          <img src="/assets/img/simandor.png" alt="Sarana Produksi" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[7.5px] font-bold text-slate-700 block line-clamp-1">Sarana Produksi</span>
                      </div>
                      <div className="space-y-1 text-center">
                        <div className="h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center">
                          <img src="/assets/img/simandor.png" alt="Sarana Pendukung" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[7.5px] font-bold text-slate-700 block line-clamp-1">Sarana Pendukung</span>
                      </div>
                      <div className="space-y-1 text-center">
                        <div className="h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center">
                          <img src="/assets/img/simandor.png" alt="Pengadaan & Distribusi" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[7.5px] font-bold text-slate-700 block line-clamp-1">Pengadaan/Distribusi</span>
                      </div>
                      <div className="space-y-1 text-center">
                        <div className="h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center">
                          <img src="/assets/img/simandor.png" alt="Rapat Koordinasi" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[7.5px] font-bold text-slate-700 block line-clamp-1">Rapat Koordinasi</span>
                      </div>
                    </div>
                  </div>

                  {/* L. Kepatuhan & Keselamatan Kerja */}
                  <div className="col-span-3 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>L. KEPATUHAN & KESELAMATAN (K3)</span>
                    </div>

                    <div className="text-[9.5px] space-y-1.5 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">⚠️ Kecelakaan Kerja:</span>
                        <strong className="text-emerald-700">0 Kejadian</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">⚠️ Near Miss:</span>
                        <strong className="text-emerald-700">0 Kejadian</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">👷 Pelatihan K3:</span>
                        <strong className="text-blue-700">12 Kegiatan</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">🛡️ Kepatuhan APD:</span>
                        <strong className="text-emerald-700">98.5%</strong>
                      </div>
                    </div>
                  </div>

                  {/* M. Penutup & Tanda Tangan */}
                  <div className="col-span-3 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>M. PENUTUP & PENGESAHAN</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-[8.5px]">
                      <div>
                        <p className="font-semibold text-slate-600">PPK KNMP SUMATRA</p>
                        <div className="h-10"></div>
                        <p className="font-bold text-slate-900 underline">{ppkName}</p>
                        <p className="text-[7.5px] text-slate-500">NIP: {ppkNip}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-600">Kepala Dinas KP Provinsi</p>
                        <div className="h-10"></div>
                        <p className="font-bold text-slate-900 underline">{kadisName}</p>
                        <p className="text-[7.5px] text-slate-500">NIP: {kadisNip}</p>
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
                    Versi 1.0 – 2026
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
