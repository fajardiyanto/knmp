import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  Printer,
  ZoomIn,
  ZoomOut,
  FileText,
  Calendar,
  Layers,
  Building2,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { useAuth } from "../../auth/hooks/useAuth";
import { DailyFormatPrintView, type LaporanHarianData, DEFAULT_8_FASILITAS_HARIAN, DEFAULT_5_ASPEK_HARIAN } from "./DailyFormatPrintView";
import { WeeklyFormatPrintView, type LaporanMingguanData, DEFAULT_10_FASILITAS_MINGGUAN, DEFAULT_8_BOQ_MINGGUAN, DEFAULT_6_KONTROL_MINGGUAN } from "./WeeklyFormatPrintView";
import { MonthlyFormatPrintView } from "./MonthlyFormatPrintView";
import type { LaporanBulananData } from "../types";

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

interface WeeklyPPKReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeek?: number;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const getDayName = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(d);
  } catch {
    return "Senin";
  }
};

export const WeeklyPPKReportModal: React.FC<WeeklyPPKReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [reportType, setReportType] = useState<"harian" | "mingguan" | "bulanan">("mingguan");
  const [selectedDate, setSelectedDate] = useState<string>("2026-08-24");
  const [startDate, setStartDate] = useState<string>("2026-08-17");
  const [endDate, setEndDate] = useState<string>("2026-08-24");
  const [bulan, setBulan] = useState<number>(8); // Agustus (1-indexed: 8)
  const [tahun] = useState<number>(2026);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const [selectedPelaksanaanId, setSelectedPelaksanaanId] = useState<string>("");
  const [pelaksanaans, setPelaksanaans] = useState<any[]>([]);

  const [reportData, setReportData] = useState<WeeklyPPKReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Load Pelaksanaan List for Titik Filter
  useEffect(() => {
    if (isOpen) {
      apiFetch<any[]>("/api/v1/pelaksanaan")
        .then((res) => {
          if (Array.isArray(res)) setPelaksanaans(res);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Fetch Real Backend Data from Endpoint
  const loadReportData = () => {
    setLoading(true);
    setErrorMsg("");
    apiFetch<WeeklyPPKReportData>(
      `/api/v1/laporan/weekly-ppk-report?type=${reportType}&date=${selectedDate}&start_date=${startDate}&end_date=${endDate}&month=${bulan}&year=${tahun}`
    )
      .then((data) => {
        if (data) {
          setReportData({
            ...data,
            gis_points: Array.isArray(data.gis_points) ? data.gis_points : [],
            progress_rekap: Array.isArray(data.progress_rekap) ? data.progress_rekap : [],
            rekap_lokasi: Array.isArray(data.rekap_lokasi) ? data.rekap_lokasi : [],
            progress_klaster: Array.isArray(data.progress_klaster) ? data.progress_klaster : [],
            laporan_lapangan: Array.isArray(data.laporan_lapangan) ? data.laporan_lapangan : [],
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
  }, [isOpen, reportType, selectedDate, startDate, endDate, bulan, tahun]);

  const activePelaksanaan = useMemo(() => {
    if (!selectedPelaksanaanId) return null;
    return pelaksanaans.find((p) => p.id.toString() === selectedPelaksanaanId) || null;
  }, [selectedPelaksanaanId, pelaksanaans]);

  const handlePrint = () => {
    window.print();
  };

  const getReportTitle = () => {
    if (reportType === "harian") return "FORMAT LAPORAN HARIAN KONSTRUKSI KNMP";
    if (reportType === "bulanan") return "FORMAT LAPORAN BULANAN KONSTRUKSI KNMP";
    return "FORMAT LAPORAN MINGGUAN KONSTRUKSI KNMP";
  };

  // Build Harian Data Object conforming to KKP Daily Format
  // Build Harian Data Object conforming to KKP Daily Format
  const harianData: LaporanHarianData = useMemo(() => {
    const p = activePelaksanaan;
    const knmp = p?.knmp || {};
    const persiapan = p?.persiapan || {};
    const perush = p?.perusahaan || persiapan.perusahaan || {};

    const photosList = reportData?.photos || [];
    const rekapItems = reportData?.progress_rekap || [];
    const rencKum = reportData?.progress_total_lalu ?? 0;
    const aktKum = reportData?.progress_total_kumulatif || reportData?.capaian_fisik_kumulatif || 0;

    return {
      tanggal: selectedDate,
      hari: getDayName(selectedDate),
      minggu_ke: reportData?.minggu_ke || 1,
      cuaca: "-",
      identitas: {
        paket_pekerjaan: p?.nama || knmp?.name || "-",
        lokasi: knmp?.regency_name || knmp?.name || "-",
        jenis_titik: ((knmp?.jenis || "").toUpperCase() === "PENYANGGA" ? "PENYANGGA" : (knmp?.jenis ? "HUB" : "-")) as "HUB" | "PENYANGGA",
        no_kontrak_spmk: persiapan.nomor_spmk || persiapan.nomor_kontrak || "-",
        kontraktor: perush.nama || (reportData?.total_kontraktor ? `${reportData.total_kontraktor} Kontraktor Pelaksana` : "-"),
        pengawas_ppk: reportData?.ppk_name ? `${reportData.ppk_name} / Tim Pengawas` : "-",
        sisa_waktu_hari: p?.sisa_waktu_hari ?? "-",
        progres_harian_pct: (aktKum > 0 ? (aktKum / 90).toFixed(2) : "0.00"),
      },
      checklist_fasilitas: p || reportData?.total_lokasi ? DEFAULT_8_FASILITAS_HARIAN.map((f, i) => ({
        no: i + 1,
        fasilitas: f,
        lingkup: "Ya" as const,
        status: (aktKum >= 100 ? "Selesai" : aktKum > 0 ? "Proses" : "Belum") as any,
        catatan: "-",
      })) : [],
      detail_boq: rekapItems.length
        ? rekapItems.slice(0, 6).map((item, idx) => ({
            no: idx + 1,
            kode_boq: `DIV-${idx + 1}.1`,
            area: item.uraian || "-",
            uraian: item.uraian ? `Pekerjaan ${item.uraian}` : "-",
            satuan: "m3",
            vol_kontrak: item.lokasi ? item.lokasi * 10 : 0,
            renc_hari: Number((item.minggu_lalu / 6).toFixed(2)) || 0,
            realisasi: Number((item.minggu_ini / 6).toFixed(2)) || 0,
            kum_sd_hari: Number(item.kumulatif?.toFixed(2)) || 0,
            bukti: item.keterangan || "-",
          }))
        : [],
      aspek_k3_kendala: reportData?.issues?.length ? DEFAULT_5_ASPEK_HARIAN.map((a, i) => {
        const issue = reportData?.issues?.[i];
        return {
          no: i + 1,
          aspek: a,
          catatan: issue ? issue.deskripsi : "-",
          dampak: issue ? issue.dampak : "-",
          tindak_lanjut: issue ? issue.rencana_mitigasi : "-",
          pic_target: issue ? issue.pic : "-",
        };
      }) : [],
      dokumentasi_foto: photosList.length ? [1, 2, 3, 4].map((slot) => ({
        slot,
        file_url: photosList[slot - 1]?.file_url || "",
        file_name: photosList[slot - 1]?.title || "-",
        kode_boq_area: "-",
        tanggal: selectedDate,
        keterangan: photosList[slot - 1]?.title || "-",
      })) : [],
      pengesahan: {
        pembuat_nama: perush.nama || user?.name || "-",
        pembuat_tanggal: selectedDate,
        pemeriksa_nama: reportData?.kadis_name || "-",
        pemeriksa_tanggal: selectedDate,
        penyetuju_nama: reportData?.ppk_name || "-",
        penyetuju_tanggal: selectedDate,
      },
    };
  }, [activePelaksanaan, reportData, selectedDate, user]);

  // Build Mingguan Data Object conforming to KKP Weekly Format
  const mingguanData: LaporanMingguanData = useMemo(() => {
    const p = activePelaksanaan;
    const knmp = p?.knmp || {};
    const persiapan = p?.persiapan || {};
    const perush = p?.perusahaan || persiapan.perusahaan || {};

    const photosList = reportData?.photos || [];
    const rekapItems = reportData?.progress_rekap || [];

    const rencKum = reportData?.progress_total_lalu ?? 0;
    const aktKum = reportData?.progress_total_kumulatif || reportData?.capaian_fisik_kumulatif || 0;
    const deviasi = Number((aktKum - rencKum).toFixed(2));
    const status = deviasi < -5 ? "Critical" : deviasi < 0 ? "Warning" : "On Track";

    return {
      periode_awal: startDate,
      periode_akhir: endDate,
      minggu_ke: reportData?.minggu_ke || 1,
      status_proyek: status,
      identitas: {
        paket_pekerjaan: p?.nama || knmp?.name || "-",
        lokasi: knmp?.regency_name || knmp?.name || "-",
        jenis_titik: ((knmp?.jenis || "").toUpperCase() === "PENYANGGA" ? "PENYANGGA" : (knmp?.jenis ? "HUB" : "-")) as "HUB" | "PENYANGGA",
        no_kontrak_spmk: persiapan.nomor_spmk || persiapan.nomor_kontrak || "-",
        kontraktor: perush.nama || (reportData?.total_kontraktor ? `${reportData.total_kontraktor} Kontraktor Pelaksana` : "-"),
        pengawas_ppk: reportData?.ppk_name ? `${reportData.ppk_name} / Tim Pengawas` : "-",
        rencana_kum_pct: rencKum,
        aktual_kum_pct: aktKum,
      },
      checklist_fasilitas: p || reportData?.total_lokasi ? DEFAULT_10_FASILITAS_MINGGUAN.map((f, i) => ({
        no: i + 1,
        fasilitas: f,
        lingkup: "Ya" as const,
        status: (aktKum >= 100 ? "Selesai" : aktKum > 0 ? "Proses" : "Belum") as any,
        catatan: "-",
      })) : [],
      ringkasan_boq: [],
      detail_boq: rekapItems.length
        ? rekapItems.slice(0, 7).map((item, idx) => ({
            no: idx + 1,
            kode_boq: `DIV-${idx + 1}`,
            area: item.uraian || "-",
            uraian: item.uraian ? `Pekerjaan ${item.uraian}` : "-",
            bobot_pct: 0,
            renc_mgg: Number(item.minggu_lalu?.toFixed(2)) || 0,
            real_mgg: Number(item.minggu_ini?.toFixed(2)) || 0,
            akt_kum: Number(item.kumulatif?.toFixed(2)) || 0,
            deviasi_pct: Number(((item.minggu_ini || 0) - (item.minggu_lalu || 0)).toFixed(2)),
            bukti_mc: item.keterangan || "-",
          }))
        : [],
      kontrol_mingguan: reportData?.issues?.length
        ? DEFAULT_6_KONTROL_MINGGUAN.map((a, i) => {
            const issue = reportData?.issues?.[i];
            return {
              no: i + 1,
              aspek: a,
              kondisi: issue ? (issue.status || "-") : "-",
              isu_risiko: issue ? (issue.dampak || "-") : "-",
              keputusan_dibutuhkan: issue ? (issue.rencana_mitigasi || "-") : "-",
              pic_target: issue ? (issue.pic || "-") : "-",
            };
          })
        : [],
      dokumentasi_foto: photosList.length ? [1, 2, 3, 4].map((slot) => ({
        slot,
        file_url: photosList[slot - 1]?.file_url || "",
        file_name: photosList[slot - 1]?.title || "-",
        kode_boq_area: "-",
        tanggal: endDate,
        keterangan: photosList[slot - 1]?.title || "-",
      })) : [],
      pengesahan: {
        pembuat_nama: perush.nama || user?.name || "-",
        pembuat_tanggal: endDate,
        pemeriksa_nama: reportData?.kadis_name || "-",
        pemeriksa_tanggal: endDate,
        penyetuju_nama: reportData?.ppk_name || "-",
        penyetuju_tanggal: endDate,
      },
    };
  }, [activePelaksanaan, reportData, startDate, endDate, user]);

  // Build Bulanan Data Object conforming to KKP Monthly Format
  const bulananData: LaporanBulananData = useMemo(() => {
    const p = activePelaksanaan;
    const knmp = p?.knmp || {};
    const persiapan = p?.persiapan || {};
    const perush = p?.perusahaan || persiapan.perusahaan || {};

    const photosList = reportData?.photos || [];
    const rencKum = reportData?.progress_total_lalu ?? 0;
    const aktKum = reportData?.progress_total_kumulatif || reportData?.capaian_fisik_kumulatif || 0;
    const deviasi = Number((aktKum - rencKum).toFixed(2));

    return {
      bulan_tahun: `${MONTHS[bulan - 1]} ${tahun}`,
      bulan_kontrak_ke: Math.ceil((reportData?.minggu_ke || 1) / 4).toString(),
      status_proyek: deviasi < -5 ? "Critical" : deviasi < 0 ? "Warning" : "On Track",
      identitas_acuan: {
        paket_pekerjaan: p?.nama || knmp?.name || "-",
        lokasi: knmp?.regency_name || knmp?.name || "-",
        jenis_titik: ((knmp?.jenis || "").toUpperCase() === "PENYANGGA" ? "PENYANGGA" : (knmp?.jenis ? "HUB" : "-")) as "HUB" | "PENYANGGA",
        no_kontrak_spmk: persiapan.nomor_spmk || persiapan.nomor_kontrak || "-",
        kontraktor: perush.nama || (reportData?.total_kontraktor ? `${reportData.total_kontraktor} Kontraktor Pelaksana` : "-"),
        pengawas_ppk: reportData?.ppk_name ? `${reportData.ppk_name} / Tim Pengawas` : "-",
        rencana_kum_pct: rencKum,
        aktual_kum_pct: aktKum,
        deviasi_pct: deviasi,
        termin_keuangan: "-",
      },
      checklist_fasilitas: p || reportData?.total_lokasi ? DEFAULT_10_FASILITAS_MINGGUAN.map((f, i) => ({
        no: i + 1,
        fasilitas: f,
        lingkup: "Ya" as const,
        status: (aktKum >= 100 ? "Selesai" : aktKum > 0 ? "Proses" : "Belum") as any,
        catatan: "-",
      })) : [],
      ringkasan_boq: [],
      detail_boq: [],
      matriks_risiko: reportData?.issues?.length
        ? [
            "Kurva-S/jadwal",
            "Pembayaran/termin",
            "Perubahan kontrak",
            "Mutu/QC/NCR",
            "K3 & lingkungan",
            "Readiness operasional",
          ].map((a, i) => {
            const issue = reportData?.issues?.[i];
            return {
              no: i + 1,
              aspek: a,
              kondisi_bulan_ini: issue ? (issue.status || "-") : "-",
              risiko_deviasi: issue ? (issue.dampak || "-") : "-",
              tindak_lanjut: issue ? (issue.rencana_mitigasi || "-") : "-",
              pic_target: issue ? (issue.pic || "-") : "-",
            };
          })
        : [],
      dokumentasi_foto: photosList.length ? [1, 2, 3, 4].map((slot) => ({
        slot,
        file_url: photosList[slot - 1]?.file_url || "",
        file_name: photosList[slot - 1]?.title || "-",
        kode_boq_area: "-",
        tanggal: `${tahun}-0${bulan}-28`,
        keterangan: photosList[slot - 1]?.title || "-",
      })) : [],
      pengesahan: {
        pembuat_nama: perush.nama || user?.name || "-",
        pembuat_tanggal: `${tahun}-0${bulan}-28`,
        pemeriksa_nama: reportData?.kadis_name || "-",
        pemeriksa_tanggal: `${tahun}-0${bulan}-28`,
        penyetuju_nama: reportData?.ppk_name || "-",
        penyetuju_tanggal: `${tahun}-0${bulan}-28`,
      },
    };
  }, [activePelaksanaan, reportData, bulan, tahun, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-[98vw] xl:max-w-[96vw] h-[95vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Top Control Bar (Matching user screenshot) */}
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
                <span className="text-xs text-blue-200">
                  {activePelaksanaan ? activePelaksanaan.nama : `Program KNMP Wilayah Sumatra (${reportData?.total_lokasi || 346} Titik)`}
                </span>
              </div>
              <h3 className="text-base font-black text-white tracking-tight">
                {getReportTitle()}
              </h3>
            </div>
          </div>

          {/* Center: Filter Jenis Laporan (Harian / Mingguan / Bulanan), Tanggal & Proyek */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Mode Switcher */}
            <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/15 text-xs">
              <button
                type="button"
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
                type="button"
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
                type="button"
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
                <span className="text-blue-200 font-medium">Tanggal:</span>
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
                <span className="text-blue-200 font-medium">Rentang:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium cursor-pointer"
                />
                <span className="text-white/60 text-xs font-bold">s.d.</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium cursor-pointer"
                />
              </div>
            )}

            {reportType === "bulanan" && (
              <div className="flex items-center space-x-2 bg-black/25 px-3 py-1 rounded-xl border border-white/15 text-xs animate-fade-in">
                <span className="text-blue-200 font-medium">Bulan:</span>
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

            {/* Titik / Proyek Pelaksanaan Selector */}
            <div className="flex items-center space-x-2 bg-black/25 px-3 py-1 rounded-xl border border-white/15 text-xs">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={selectedPelaksanaanId}
                onChange={(e) => setSelectedPelaksanaanId(e.target.value)}
                className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg border border-white/20 focus:outline-none max-w-[200px] truncate cursor-pointer"
              >
                <option value="">Semua Titik (Wilayah Sumatra)</option>
                {pelaksanaans.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Controls: Zoom, Print, Close */}
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-1 bg-black/25 px-2 py-1 rounded-xl border border-white/15 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(prev - 10, 60))}
                className="p-1 hover:bg-white/10 rounded text-blue-200 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1 text-white">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(prev + 10, 140))}
                className="p-1 hover:bg-white/10 rounded text-blue-200 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF A4</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Render Official 2-Page KKP Format for Harian, Mingguan, or Bulanan */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 md:p-6 bg-slate-100 dark:bg-slate-950">
          {loading ? (
            <div className="p-16 text-center text-slate-500 dark:text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-xs font-medium">Memuat format resmi laporan KKP...</p>
            </div>
          ) : errorMsg && !reportData ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 text-xs max-w-md mx-auto my-12 shadow-sm space-y-2">
              <div className="font-bold">Gagal Mengambil Data</div>
              <p>{errorMsg}</p>
              <button
                type="button"
                onClick={loadReportData}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            /* OFFICIAL STANDARDIZED KKP 2-PAGE DOCUMENT SHEET */
            <div
              className="mx-auto transition-transform duration-200 origin-top flex flex-col items-center"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
            >
              <div ref={printRef} className="w-full">
                {reportType === "harian" && (
                  <DailyFormatPrintView isEmbedded={true} data={harianData} />
                )}
                {reportType === "mingguan" && (
                  <WeeklyFormatPrintView isEmbedded={true} data={mingguanData} />
                )}
                {reportType === "bulanan" && (
                  <MonthlyFormatPrintView isEmbedded={true} data={bulananData} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
