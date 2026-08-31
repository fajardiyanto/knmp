import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Printer,
  ZoomIn,
  ZoomOut,
  FileText,
  Database,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { apiFetch } from "../../../lib/api-client";

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

interface WeeklyPPKReportData {
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

export const LaporanMingguanPPKModal: React.FC<LaporanMingguanPPKModalProps> = ({
  isOpen,
  onClose,
  initialWeek = 14,
}) => {
  const [activeTab, setActiveTab] = useState<"laporan" | "sumber_data">("laporan");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [mingguKe, setMingguKe] = useState<number>(initialWeek);
  const [tahun] = useState<number>(2026);

  const [reportData, setReportData] = useState<WeeklyPPKReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const printRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // 1. Fetch Real Backend Data from Endpoint
  const loadReportData = () => {
    setLoading(true);
    setErrorMsg("");
    apiFetch<WeeklyPPKReportData>(`/api/v1/laporan/weekly-ppk-report?week=${mingguKe}&year=${tahun}`)
      .then((data) => {
        setReportData(data);
      })
      .catch((err) => {
        setErrorMsg(err?.message || "Gagal memuat data laporan mingguan PPK dari server");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      loadReportData();
    }
  }, [isOpen, mingguKe]);

  // 2. Initialize Real Leaflet Map with Real Coordinates
  useEffect(() => {
    if (!isOpen || activeTab !== "laporan" || !reportData) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [0.7893, 101.5], // Center of Sumatra
          zoom: 5.5,
          minZoom: 4,
          maxZoom: 14,
          zoomControl: false,
          attributionControl: false,
        });

        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            maxZoom: 18,
            subdomains: "abcd",
          }
        ).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      map.invalidateSize();

      // Clear existing layers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
        }
      });

      const createDot = (color: string) => {
        return L.divIcon({
          className: "leaflet-custom-dot",
          html: `
            <div style="
              width: 9px;
              height: 9px;
              border-radius: 50%;
              background-color: ${color};
              border: 1.5px solid #ffffff;
              box-shadow: 0 1px 3px rgba(0,0,0,0.5);
              cursor: pointer;
            "></div>
          `,
          iconSize: [9, 9],
          iconAnchor: [4.5, 4.5],
          popupAnchor: [0, -5],
        });
      };

      const greenDot = createDot("#16a34a");
      const blueDot = createDot("#2563eb");
      const yellowDot = createDot("#eab308");
      const redDot = createDot("#dc2626");

      const points = reportData.gis_points || [];
      const bounds = L.latLngBounds([]);

      points.forEach((p) => {
        if (p.lat && p.long && !isNaN(p.lat) && !isNaN(p.long)) {
          bounds.extend([p.lat, p.long]);

          let dot = yellowDot;
          if (p.progress >= 100) {
            dot = greenDot;
          } else if (p.progress >= 50) {
            dot = blueDot;
          } else if (p.progress > 0) {
            dot = yellowDot;
          }

          const marker = L.marker([p.lat, p.long], { icon: dot }).addTo(map);
          marker.bindPopup(`
            <div style="font-size: 11px; font-family: sans-serif; min-width: 150px; line-height: 1.4;">
              <strong style="color: #002060; font-size: 12px;">${p.name}</strong><br/>
              <span style="color: #64748b;">${p.regency || p.province || "Sumatera"}</span><br/>
              <div style="margin-top: 4px; font-weight: bold; color: ${
                p.progress >= 100 ? "#16a34a" : p.progress >= 50 ? "#2563eb" : "#d97706"
              };">
                Status: ${p.status}
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">
                Koord: ${p.lat.toFixed(4)}, ${p.long.toFixed(4)}
              </div>
            </div>
          `);
        }
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [15, 15] });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, activeTab, reportData]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-[98vw] xl:max-w-[96vw] h-[95vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-[#002060] text-white shrink-0 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono">
                  OFFICIAL PPK TEMPLATE
                </span>
                <span className="text-xs text-blue-200">Program KNMP Wilayah Sumatra ({reportData?.total_lokasi || 346} Titik)</span>
              </div>
              <h3 className="text-base font-black text-white tracking-tight">
                Template Laporan Mingguan PPK KNMP – Wilayah Sumatra
              </h3>
            </div>
          </div>

          {/* Week Selector */}
          <div className="flex items-center space-x-1.5 bg-black/20 px-3 py-1 rounded-xl border border-white/10 text-xs">
            <span className="text-blue-200 font-medium">Minggu ke:</span>
            <button
              onClick={() => setMingguKe((prev) => Math.max(1, prev - 1))}
              className="p-1 hover:bg-white/10 rounded text-white"
              title="Minggu Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-amber-400 px-1">{mingguKe}</span>
            <button
              onClick={() => setMingguKe((prev) => Math.min(52, prev + 1))}
              className="p-1 hover:bg-white/10 rounded text-white"
              title="Minggu Berikutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-black/20 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab("laporan")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === "laporan"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-blue-200 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dokumen Cetak Resmi (A3/A4)</span>
            </button>
            <button
              onClick={() => setActiveTab("sumber_data")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === "sumber_data"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-blue-200 hover:text-white"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Kamus & Sumber Data Real (A - M)</span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {activeTab === "laporan" && (
              <>
                <div className="hidden sm:flex items-center space-x-1 bg-black/20 px-2 py-1 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => setZoomLevel((prev) => Math.max(prev - 10, 60))}
                    className="p-1 hover:bg-white/10 rounded text-blue-200 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] px-1 text-white">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel((prev) => Math.min(prev + 10, 140))}
                    className="p-1 hover:bg-white/10 rounded text-blue-200 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF A3-A4</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
              <p className="text-xs font-medium">Memuat real data laporan mingguan PPK dari server...</p>
            </div>
          ) : errorMsg || !reportData ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 text-xs max-w-md mx-auto my-12 shadow-sm space-y-2">
              <div className="font-bold">Gagal Mengambil Data Real</div>
              <p>{errorMsg || "Data laporan tidak tersedia"}</p>
              <button
                onClick={loadReportData}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all"
              >
                Coba Lagi
              </button>
            </div>
          ) : activeTab === "sumber_data" ? (
            /* TAB 2: KAMUS DATA */
            <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
              <div className="bg-gradient-to-r from-[#002060] to-indigo-900 text-white p-6 rounded-2xl shadow-md space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <Database className="w-4 h-4" />
                  <span>REAL DATABASE INTEGRATION & DATA LINEAGE</span>
                </div>
                <h2 className="text-xl font-black">
                  Matriks Sumber Data Template Laporan Mingguan PPK (A s.d. M)
                </h2>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Semua nilai pada template laporan mingguan ini di-generate secara real-time dari database PostgreSQL backend sistem KNMP v2.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <h4 className="font-bold text-sm text-[#002060] dark:text-blue-400">
                    A. Identitas Laporan
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sumber: Tabel `users` ({reportData.ppk_name}), `knmps` (Total {reportData.total_lokasi} titik), dan `persiapans` ({reportData.total_kontraktor} Kontraktor pelaksana).
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <h4 className="font-bold text-sm text-[#002060] dark:text-blue-400">
                    B. Ringkasan Eksekutif
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sumber: Auto-generator narasi cerdas yang menghitung rata-rata capaian fisik ({reportData.capaian_fisik_kumulatif}%), lokasi selesai ({reportData.lokasi_selesai}), on progress ({reportData.lokasi_on_progress}), dan mitigasi kendala aktif ({reportData.issues.length} isu).
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <h4 className="font-bold text-sm text-[#002060] dark:text-blue-400">
                    C. Dashboard Capaian Mingguan
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sumber: `AVG(realisasi_progres_fisik)` tabel `laporans`, pagu kontrak ({formatRupiah(reportData.nilai_kontrak_kumulatif)}), dan pencairan termin tabel `pembayarans` ({formatRupiah(reportData.realisasi_keuangan)}).
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <h4 className="font-bold text-sm text-[#002060] dark:text-blue-400">
                    D. Peta Sebaran Titik KNMP Sumatra (Real GIS)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sumber: Peta interaktif Leaflet dengan titik koordinat asli `latitude` & `longitude` dari tabel `knmps` ({reportData.gis_points.length} titik terplot se-Sumatera).
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <h4 className="font-bold text-sm text-[#002060] dark:text-blue-400">
                    E - G. Rekap Progres & Klaster Pekerjaan
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sumber: Rekapitulasi tabel `pelaksanaans`, `laporans`, dan `laporan_jenis_bangunan` untuk 5 klaster master (*Darat, Laut, Produksi, UMKM, Sosial*).
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <h4 className="font-bold text-sm text-[#002060] dark:text-blue-400">
                    H - I. Isu Kendala & Solusi Tindak Lanjut
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sumber: Tabel `issues` (`tingkat_kendala`, `penyebab`, `rencana_mitigasi`, `pic`, `target_selesai`) dan butir notulensi rapat tabel `notulens`.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 md:col-span-2">
                  <h4 className="font-bold text-sm text-[#002060] dark:text-blue-400">
                    J - M. Rencana Depan, Foto Geotagging, K3 & Pengesahan
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sumber: Rencana kerja harian `pelaksanaans`, foto terverifikasi GPS tabel `documents`, log zero accident K3/HSE, serta lembar tanda tangan resmi PPK & Kepala Dinas KP.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 1: DOKUMEN CETAK UTAMA TEMPLATE LAPORAN MINGGUAN PPK (A3/A4) */
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

                  {/* Center: Title & Week Period */}
                  <div className="text-center">
                    <h1 className="text-2xl font-black tracking-tight text-[#002060] uppercase">
                      TEMPLATE LAPORAN MINGGUAN PPK
                    </h1>
                    <h2 className="text-xs font-black tracking-wider text-slate-800 uppercase mt-0.5">
                      PROGRAM KAMPUNG NELAYAN MERAH PUTIH (KNMP) – WILAYAH SUMATRA
                    </h2>
                    <div className="inline-flex items-center space-x-2 text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-0.5 rounded-full mt-1 border border-slate-200">
                      <span>Laporan Minggu ke- <strong>{reportData.minggu_ke}</strong></span>
                      <span>|</span>
                      <span>Periode: <strong>{reportData.tanggal_awal}</strong> s.d. <strong>{reportData.tanggal_akhir} {reportData.tahun_anggaran}</strong></span>
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
                  <div className="col-span-3 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider flex items-center gap-1.5">
                      <span>B. RINGKASAN EKSEKUTIF</span>
                    </div>
                    <div className="text-[10px] text-slate-700 leading-relaxed space-y-1.5 flex-1">
                      <p>{reportData.ringkasan_narasi}</p>
                    </div>
                  </div>

                  {/* C. Dashboard Capaian Mingguan */}
                  <div className="col-span-3 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
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

                  {/* D. Peta Sebaran Titik KNMP Sumatra (Real GIS Leaflet Map) */}
                  <div className="col-span-3 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider flex items-center justify-between">
                      <span>D. PETA SEBARAN TITIK SUMATRA</span>
                      <span className="text-[9px] font-normal lowercase">{reportData.gis_points.length} real GIS points</span>
                    </div>

                    {/* Real Leaflet Map Container */}
                    <div className="relative rounded-lg border border-slate-300 h-40 overflow-hidden shadow-inner">
                      <div ref={mapContainerRef} className="w-full h-full bg-slate-100 z-10" />

                      {/* Map Status Legend */}
                      <div className="absolute right-1.5 top-1.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-lg border border-slate-300 text-[8px] space-y-0.5 font-bold shadow-md z-20">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Selesai
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span> On Progress
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Dalam Persiapan
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-red-600"></span> Tertunda/Masalah
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
                        {reportData.progress_rekap?.map((row) => (
                          <tr key={row.no}>
                            <td className="border border-slate-300 p-1 text-center">{row.no}</td>
                            <td className="border border-slate-300 p-1 font-semibold">{row.uraian}</td>
                            <td className="border border-slate-300 p-1 text-center">{row.lokasi}</td>
                            <td className="border border-slate-300 p-1 text-center">{row.minggu_lalu}%</td>
                            <td className="border border-slate-300 p-1 text-center">{row.minggu_ini}%</td>
                            <td className="border border-slate-300 p-1 text-center font-bold bg-blue-50">{row.kumulatif}%</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-black text-slate-900">
                          <td colSpan={2} className="border border-slate-300 p-1 text-center">RATA-RATA TOTAL</td>
                          <td className="border border-slate-300 p-1 text-center">{reportData.total_lokasi}</td>
                          <td className="border border-slate-300 p-1 text-center">{reportData.progress_total_lalu}%</td>
                          <td className="border border-slate-300 p-1 text-center">{reportData.progress_total_ini}%</td>
                          <td className="border border-slate-300 p-1 text-center text-blue-700 bg-blue-100">{reportData.progress_total_kumulatif}%</td>
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
                        {reportData.rekap_lokasi?.map((row) => (
                          <tr key={row.no}>
                            <td className="border border-slate-300 p-1 text-center">{row.no}</td>
                            <td className="border border-slate-300 p-1 font-semibold">{row.status}</td>
                            <td className="border border-slate-300 p-1 text-center font-bold">{row.jumlah}</td>
                            <td className="border border-slate-300 p-1 text-center">{row.persentase}%</td>
                            <td className="border border-slate-300 p-1 text-[8.5px] text-slate-500">{row.keterangan}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-black text-slate-900">
                          <td colSpan={2} className="border border-slate-300 p-1 text-center">TOTAL</td>
                          <td className="border border-slate-300 p-1 text-center">{reportData.total_lokasi}</td>
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
                      {reportData.progress_klaster?.map((klaster) => (
                        <div key={klaster.code}>
                          <div className="flex justify-between font-bold text-slate-800 mb-0.5">
                            <span>{klaster.code}. {klaster.name}</span>
                            <span className="text-blue-700">{klaster.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${klaster.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
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
                        {reportData.issues && reportData.issues.length > 0 ? (
                          reportData.issues.map((iss) => (
                            <tr key={iss.no}>
                              <td className="border border-slate-300 p-1 text-center">{iss.no}</td>
                              <td className="border border-slate-300 p-1 font-semibold truncate max-w-[100px]">{iss.deskripsi}</td>
                              <td className="border border-slate-300 p-1 truncate max-w-[80px]">{iss.lokasi}</td>
                              <td className="border border-slate-300 p-1 truncate max-w-[80px]">{iss.penyebab}</td>
                              <td className="border border-slate-300 p-1 text-center font-bold">{iss.tingkat_risiko}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="border border-slate-300 p-3 text-center text-slate-400 italic">
                              Tidak ada kendala aktif yang tercatat pada database.
                            </td>
                          </tr>
                        )}
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
                        {reportData.issues && reportData.issues.length > 0 ? (
                          reportData.issues.map((iss) => (
                            <tr key={iss.no}>
                              <td className="border border-slate-300 p-1 text-center">{iss.no}</td>
                              <td className="border border-slate-300 p-1 truncate max-w-[120px]">{iss.rencana_mitigasi}</td>
                              <td className="border border-slate-300 p-1">{iss.pic}</td>
                              <td className="border border-slate-300 p-1">{iss.target_selesai}</td>
                              <td className="border border-slate-300 p-1 text-center font-bold text-blue-700">{iss.status}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="border border-slate-300 p-3 text-center text-slate-400 italic">
                              Tidak ada rencana aksi tindak lanjut yang tercatat.
                            </td>
                          </tr>
                        )}
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
                        {reportData.work_plans?.map((plan) => (
                          <tr key={plan.no}>
                            <td className="border border-slate-300 p-1 text-center">{plan.no}</td>
                            <td className="border border-slate-300 p-1 truncate max-w-[140px]">{plan.uraian}</td>
                            <td className="border border-slate-300 p-1 text-center font-bold text-emerald-700">+{plan.target}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Photos, HSE & Signatures (K, L, M) */}
                <div className="grid grid-cols-12 gap-3.5 items-stretch">
                  {/* K. Dokumentasi Kegiatan Minggu Ini (Sampel Geotagging) */}
                  <div className="col-span-6 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>K. DOKUMENTASI KEGIATAN MINGGU INI (SAMPEL GEOTAGGING GPS)</span>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {reportData.photos?.map((item, idx) => (
                        <div key={idx} className="space-y-1 text-center">
                          <div className="h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center">
                            <img
                              src={item.file_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/assets/img/simandor.png";
                              }}
                            />
                          </div>
                          <span className="text-[7.5px] font-bold text-slate-700 block line-clamp-1">
                            {item.title}
                          </span>
                        </div>
                      ))}
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

                  {/* M. Penutup & Tanda Tangan */}
                  <div className="col-span-3 bg-slate-50 rounded-xl border border-slate-300 p-3 space-y-2 flex flex-col justify-between">
                    <div className="bg-[#002060] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                      <span>M. PENUTUP & PENGESAHAN</span>
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
