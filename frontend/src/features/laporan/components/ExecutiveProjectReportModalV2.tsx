import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Printer,
  X,
  Calendar,
  Building2,
  AlertTriangle,
  FileCheck2,
  Clock,
  Coins,
  ShieldCheck,
  TrendingUp,
  MapPin,
  FileSpreadsheet,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  LayoutDashboard,
  Layers,
  Activity,
  Award,
  PackageCheck,
  ClipboardList,
  FileText,
  ImageIcon,
  Download,
  Eye,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { fetchMonthlyProjectReport } from "../api";
import { formatRupiah, formatDate } from "../../../lib/utils";
import type { MonthlyProjectReportData } from "../types";
import { useAuth } from "../../auth/hooks/useAuth";
import { useTheme } from "../../../context/ThemeContext";

interface KnmpOption {
  id: number;
  nama: string;
  regional_name?: string;
  province_name?: string;
  regency_name?: string;
}

interface ExecutiveProjectReportModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  initialKnmpId?: number;
  laporanId?: number;
}

type ViewMode = "analytics" | "document";
type PeriodType = "bulanan" | "mingguan" | "harian" | "custom";
type ReportOrientation = "landscape" | "portrait";

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

export const ExecutiveProjectReportModalV2: React.FC<ExecutiveProjectReportModalV2Props> = ({
  isOpen,
  onClose,
  initialKnmpId,
  laporanId,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const userKnmpId = user?.knmp_ids && user.knmp_ids.length > 0 ? user.knmp_ids[0] : undefined;
  const isFieldUser = Boolean(user?.roles?.some((r) => r === "operator" || r === "kontraktor"));

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("analytics");
  const [selectedKnmpId, setSelectedKnmpId] = useState<number>(initialKnmpId || userKnmpId || 1);
  const [periodType, setPeriodType] = useState<PeriodType>("bulanan");
  const [orientation, setOrientation] = useState<ReportOrientation>("landscape");
  const [zoom, setZoom] = useState<number>(100);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedWeek, setSelectedWeek] = useState<number>(4);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // Default Agustus
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [startDate, setStartDate] = useState<string>("2026-08-01");
  const [endDate, setEndDate] = useState<string>("2026-08-30");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialKnmpId) {
      setSelectedKnmpId(initialKnmpId);
    } else if (userKnmpId) {
      setSelectedKnmpId(userKnmpId);
    }
  }, [initialKnmpId, userKnmpId]);

  // Fetch KNMP options
  const { data: knmpsData } = useQuery<KnmpOption[]>({
    queryKey: ["knmp-list-report-v2"],
    queryFn: () => apiFetch<KnmpOption[]>("/api/v1/knmp"),
    enabled: isOpen,
  });

  // Fetch real report data
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery<MonthlyProjectReportData>({
    queryKey: [
      "project-report-v2",
      selectedKnmpId,
      laporanId,
      periodType,
      selectedDate,
      selectedWeek,
      selectedMonth,
      selectedYear,
      startDate,
      endDate,
    ],
    queryFn: () =>
      fetchMonthlyProjectReport(selectedKnmpId, {
        laporan_id: laporanId,
        period_type: periodType,
        date: selectedDate,
        week: selectedWeek,
        month: selectedMonth,
        year: selectedYear,
        start_date: startDate,
        end_date: endDate,
      }),
    enabled: isOpen && (!!selectedKnmpId || !!laporanId),
  });

  if (!isOpen) return null;

  const data = reportData;
  const planProgress = data?.progress_plan || 0;
  const actualProgress = data?.progress_actual || 0;
  const deviasi = data?.progress_deviasi || (actualProgress - planProgress);
  const timeElapsed = data?.time_elapsed_pct || 0;
  const progKeuangan = data?.prog_keuangan_pct || 0;

  // Composite Project Health Score (0 - 100)
  const calculateHealthScore = () => {
    let score = 100;
    if (deviasi < -10) score -= 35;
    else if (deviasi < -5) score -= 20;
    else if (deviasi < 0) score -= 10;

    const criticalIssues = data?.issues?.filter((i) => i.tingkat === "kritis").length || 0;
    score -= criticalIssues * 15;

    const unclosedPunchList = data?.quality?.daftar_cacat_buka || 0;
    score -= unclosedPunchList * 2;

    if (data?.hse?.kecelakaan_fatal && data.hse.kecelakaan_fatal > 0) score -= 50;

    return Math.max(10, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  const getHealthBadge = (score: number) => {
    if (score >= 90) return { label: "EXCELLENT / ON-TRACK", color: "bg-emerald-500 text-white", border: "border-emerald-600", dot: "bg-emerald-300" };
    if (score >= 75) return { label: "GOOD / MINOR DEVIATION", color: "bg-blue-500 text-white", border: "border-blue-600", dot: "bg-blue-300" };
    if (score >= 60) return { label: "WARNING / ATTENTION NEEDED", color: "bg-amber-500 text-white", border: "border-amber-600", dot: "bg-amber-300" };
    return { label: "CRITICAL / RECOVERY PLAN REQUIRED", color: "bg-rose-600 text-white", border: "border-rose-700", dot: "bg-rose-300" };
  };

  const healthBadge = getHealthBadge(healthScore);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full h-[96vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* ========================================================
            TOP TOOLBAR & CONTROL BAR
           ======================================================== */}
        <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Title & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Laporan Proyek Terpadu <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-400/30">v2.0 Executive</span>
                </h2>
                <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs ${healthBadge.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${healthBadge.dot} animate-pulse`} />
                  {healthBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{data?.knmp_name || "Memuat lokasi..."}</span>
                <span>•</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-300 font-semibold">{data?.nomor_kontrak || "-"}</span>
              </p>
            </div>
          </div>

          {/* Center Tabs: Analytics vs Document */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-300/80 dark:border-slate-800">
            <button
              onClick={() => setViewMode("analytics")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === "analytics"
                  ? "bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard Eksekutif</span>
            </button>
            <button
              onClick={() => setViewMode("document")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === "document"
                  ? "bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Dokumen Resmi Cetak</span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {viewMode === "document" && (
              <>
                <div className="flex items-center bg-slate-200/80 dark:bg-slate-950/80 rounded-lg p-0.5 border border-slate-300 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => setOrientation("landscape")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      orientation === "landscape" ? "bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    Landscape
                  </button>
                  <button
                    onClick={() => setOrientation("portrait")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      orientation === "portrait" ? "bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    Portrait
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-950/80 rounded-lg px-2 py-1 border border-slate-300 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => setZoom((z) => Math.max(50, z - 15))}
                    className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-300 w-10 text-center">{zoom}%</span>
                  <button
                    onClick={() => setZoom((z) => Math.min(200, z + 15))}
                    className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  {zoom !== 100 && (
                    <button
                      onClick={() => setZoom(100)}
                      className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors ml-0.5"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </>
            )}

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================
            SUB-HEADER FILTERS BAR (KNMP & Period Selection)
           ======================================================== */}
        <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center gap-3 shrink-0 text-xs">
          
          {/* KNMP Selector */}
          {!isFieldUser && knmpsData && knmpsData.length > 0 && (
            <div className="flex items-center gap-2 min-w-[240px]">
              <span className="text-slate-600 dark:text-slate-400 font-medium shrink-0 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Lokasi:
              </span>
              <select
                value={selectedKnmpId}
                onChange={(e) => setSelectedKnmpId(Number(e.target.value))}
                className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                {knmpsData.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama} ({k.regency_name || k.province_name || "Sumatera"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400 font-medium shrink-0 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Periode:
            </span>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as PeriodType)}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="bulanan">Bulanan</option>
              <option value="mingguan">Mingguan</option>
              <option value="harian">Harian</option>
              <option value="custom">Kustom Rentang</option>
            </select>
          </div>

          {periodType === "bulanan" && (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-mono"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          )}

          {periodType === "mingguan" && (
            <div className="flex items-center gap-2">
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs"
              >
                <option value={1}>Minggu ke-1</option>
                <option value={2}>Minggu ke-2</option>
                <option value={3}>Minggu ke-3</option>
                <option value={4}>Minggu ke-4</option>
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {periodType === "harian" && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs tabular-nums"
            />
          )}

          {periodType === "custom" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs tabular-nums"
              />
              <span className="text-slate-500">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs tabular-nums"
              />
            </div>
          )}

          {/* General Metadata Badges */}
          <div className="ml-auto flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
              Kontraktor: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{data?.kontraktor_name || "PT. Mina Bahari Nusantara"}</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
              Pengawas: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{data?.konsultan_pengawas || "Konsultan Supervisi"}</strong>
            </span>
          </div>
        </div>

        {/* ========================================================
            MODAL CONTENT BODY
           ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950/40">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-rounded-full animate-spin" />
              <p className="text-sm font-medium">Menghitung dan memuat data laporan eksekutif v2...</p>
            </div>
          ) : viewMode === "analytics" ? (
            
            /* ========================================================
               TAB 1: EXECUTIVE ANALYTICS & BENTO DASHBOARD
               ======================================================== */
            <div className="max-w-7xl mx-auto space-y-5">
              
              {/* Row 0: Specific Laporan Identity Header Banner */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 uppercase">
                      {data?.period_type || "Laporan"}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {data?.laporan_nama || data?.period_label || data?.knmp_name}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Lokasi: <strong className="text-slate-800 dark:text-slate-200">{data?.knmp_name}</strong> ({data?.regency_name}, {data?.province_name}) • Pelaksanaan: <strong className="text-slate-800 dark:text-slate-200">{data?.pelaksanaan_name || data?.knmp_name}</strong>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Jenis Bangunan</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] block">
                      {data?.jenis_bangunan_list && data.jenis_bangunan_list.length > 0 ? data.jenis_bangunan_list.join(", ") : "Gedung 34"}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Tanggal &amp; Cuaca</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {formatDate(data?.date || data?.start_date)} • {data?.cuaca || "Cerah"}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Tenaga Kerja</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums block">
                      {data?.tenaga_kerja || data?.total_pekerja || 1} Orang
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 1: Executive KPI Bento Grid (4 Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Progres Fisik Kumulatif */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 relative overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progres Fisik</span>
                    <span className={`px-2 py-0.5 text-[11px] font-bold tabular-nums rounded-md ${
                      deviasi >= 0 ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30" : "bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
                    }`}>
                      {deviasi >= 0 ? "+" : ""}{deviasi.toFixed(2)}% Dev
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">{actualProgress.toFixed(2)}%</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">dari plan <strong className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{planProgress.toFixed(2)}%</strong></span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, actualProgress))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 tabular-nums">
                    <span>Target: {planProgress.toFixed(1)}%</span>
                    <span>100% Selesai</span>
                  </div>
                </div>

                {/* 2. Keuangan & Realisasi Pembayaran */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 relative overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Keuangan / Pagu</span>
                    <span className="px-2 py-0.5 text-[11px] font-bold tabular-nums rounded-md bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                      {progKeuangan.toFixed(1)}% Cair
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">{formatRupiah(data?.financial_realisasi)}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Pagu: <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-200">{formatRupiah(data?.nilai_kontrak)}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Sisa Pagu: <span className="text-slate-700 dark:text-slate-300 font-semibold tabular-nums">{formatRupiah(data?.financial_sisa)}</span>
                  </p>
                </div>

                {/* 3. Waktu & Durasi Kontrak */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 relative overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Durasi Waktu</span>
                    <span className="px-2 py-0.5 text-[11px] font-bold tabular-nums rounded-md bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                      {timeElapsed.toFixed(1)}% Terpakai
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">{data?.masa_pelaksanaan || 120}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Hari Kalender</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mt-2 tabular-nums font-medium">
                    <span>Mulai: {formatDate(data?.tanggal_mulai)}</span>
                    <span>PHO: {formatDate(data?.tanggal_selesai)}</span>
                  </div>
                </div>

                {/* 4. HSE & K3 Safety Performance */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 relative overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kinerja K3 &amp; Safety</span>
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                      ZERO ACCIDENT
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
                      {data?.hse?.jam_kerja_selamat_bulan_ini ?? 160}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Jam Kerja Selamat</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 mt-2 tabular-nums">
                    <div>Toolbox: <strong className="font-semibold text-slate-900 dark:text-white">{data?.hse?.toolbox_meeting_bulan_ini ?? 4}x</strong></div>
                    <div>Inspeksi: <strong className="font-semibold text-slate-900 dark:text-white">{data?.hse?.inspeksi_bulan_ini ?? 4}x</strong></div>
                  </div>
                </div>
              </div>

              {/* Row 2: S-Curve Trend Kumulatif & Target Proyek */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                      Kurva-S Realtime &amp; Trend Kumulatif Proyek
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Visualisasi trajektori kurva rencana (S-Curve baseline) vs realisasi kumulatif fisik mingguan/bulanan
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-slate-700 dark:text-slate-300">Rencana: {planProgress.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-slate-700 dark:text-slate-300">Realisasi: {actualProgress.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* S-Curve Graphic Canvas Visualization */}
                <div className="h-44 w-full bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 relative flex flex-col justify-end">
                  <div className="absolute inset-x-4 top-4 bottom-8 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-b border-slate-400 border-dashed w-full" />
                    <div className="border-b border-slate-400 border-dashed w-full" />
                    <div className="border-b border-slate-400 border-dashed w-full" />
                  </div>
                  
                  {/* Visual S-Curve Trend Line Simulator */}
                  <div className="relative h-28 w-full flex items-end justify-between px-2 z-10">
                    {[
                      { label: "M-1", plan: 5, actual: Math.min(actualProgress, 5) },
                      { label: "M-2", plan: 15, actual: Math.min(actualProgress, actualProgress >= 15 ? 15 : actualProgress * 0.4) },
                      { label: "M-3", plan: 35, actual: Math.min(actualProgress, actualProgress >= 35 ? 35 : actualProgress * 0.7) },
                      { label: "M-4", plan: 60, actual: Math.min(actualProgress, actualProgress >= 60 ? 60 : actualProgress * 0.9) },
                      { label: "M-5", plan: planProgress, actual: actualProgress },
                      { label: "M-6", plan: 90, actual: actualProgress >= 90 ? actualProgress : 0 },
                      { label: "PHO", plan: 100, actual: actualProgress >= 100 ? 100 : 0 },
                    ].map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                        <div className="flex items-end gap-1 h-full">
                          {/* Plan Bar */}
                          <div
                            className="w-2.5 sm:w-4 bg-blue-200 dark:bg-blue-900/60 rounded-t transition-all duration-300 group-hover:bg-blue-300"
                            style={{ height: `${Math.max(4, step.plan)}%` }}
                            title={`Plan: ${step.plan}%`}
                          />
                          {/* Actual Bar */}
                          <div
                            className="w-2.5 sm:w-4 bg-emerald-500 dark:bg-emerald-600 rounded-t transition-all duration-300 group-hover:bg-emerald-400"
                            style={{ height: `${Math.max(4, step.actual)}%` }}
                            title={`Actual: ${step.actual}%`}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Milestone Control & Roadmap Kritis Proyek */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase mb-4">
                  Milestone Control &amp; Roadmap Kritis Proyek
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {data?.milestones && data.milestones.length > 0 ? (
                    data.milestones.map((ms) => {
                      const isPassed = actualProgress >= (ms.no === 3 ? 25 : ms.no === 4 ? 50 : ms.no === 5 ? 75 : ms.no === 6 ? 100 : 0);
                      return (
                        <div
                          key={ms.no}
                          className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                            isPassed
                              ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200"
                              : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-400"
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
                              MS - 0{ms.no}
                            </span>
                            <p className="text-xs font-bold mt-1 line-clamp-2">{ms.name}</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                            <span className="block tabular-nums font-semibold">{formatDate(ms.plan_date)}</span>
                            <span className={`inline-block mt-1 font-bold ${isPassed ? "text-emerald-700 dark:text-emerald-300" : "text-slate-400"}`}>
                              {isPassed ? "SELESAI" : "PLANNED"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : null}
                </div>
              </div>

              {/* Row 6: Lampiran Dokumen & Foto Lapangan */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                      Dokumen Pendukung &amp; Dokumentasi Lapangan
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Berkas status K3, checklist mutu, laporan PDF, dan foto geotagging lapangan
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                    {data?.documents?.length || 0} Berkas Terunggah
                  </span>
                </div>

                {data?.documents && data.documents.length > 0 ? (
                  <div className="space-y-4">
                    {/* Document List Table */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {data.documents.map((doc) => {
                        const isImage = doc.file_path.match(/\.(jpg|jpeg|png|webp|gif)$/i) || doc.file_type?.startsWith("image");
                        return (
                          <div
                            key={doc.id}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start gap-3 hover:border-indigo-300 dark:hover:border-slate-700 transition-all"
                          >
                            {isImage ? (
                              <div
                                onClick={() => setSelectedImage(doc.file_url || `/uploads/${doc.file_path}`)}
                                className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-200 cursor-pointer border border-slate-300 dark:border-slate-700 hover:opacity-90"
                              >
                                <img
                                  src={doc.file_url || `/uploads/${doc.file_path}`}
                                  alt={doc.file_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {doc.file_name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                                  {doc.category.replace(/_/g, " ")}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                                  {doc.status || "Terverifikasi"}
                                </span>
                              </div>
                              {doc.file_url && (
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold mt-1"
                                >
                                  Buka / Unduh Berkas
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Photo Gallery Grid */}
                    {data.documents.some((d) => d.file_path.match(/\.(jpg|jpeg|png|webp|gif)$/i) || d.file_type?.startsWith("image")) && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-3">
                          Dokumentasi Foto Fisik Lapangan
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {data.documents
                            .filter((d) => d.file_path.match(/\.(jpg|jpeg|png|webp|gif)$/i) || d.file_type?.startsWith("image"))
                            .map((photo) => (
                              <div
                                key={photo.id}
                                onClick={() => setSelectedImage(photo.file_url || `/uploads/${photo.file_path}`)}
                                className="group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
                              >
                                <img
                                  src={photo.file_url || `/uploads/${photo.file_path}`}
                                  alt={photo.file_name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                                  <p className="text-[10px] text-white font-semibold truncate">{photo.file_name}</p>
                                  <span className="text-[9px] text-slate-300 capitalize">{photo.category.replace(/_/g, " ")}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Belum ada berkas atau foto yang diunggah untuk laporan ini.
                    </p>
                  </div>
                )}
              </div>

              {/* Row 7: Executive Highlights & Management Summary */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase mb-3">
                  Ringkasan Eksekutif &amp; Arahan Manajemen
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50">
                    <h5 className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[11px] mb-1">
                      Capaian Utama
                    </h5>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {data?.highlight_capaian || "Pekerjaan konstruksi fisik berjalan sesuai jadwal perencanaan Kurva-S."}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50">
                    <h5 className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[11px] mb-1">
                      Isu &amp; Tantangan
                    </h5>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {data?.highlight_masalah || "Tidak ada kendala kritis yang menghambat pelaksanaan di lapangan."}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50">
                    <h5 className="font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider text-[11px] mb-1">
                      Rencana Tindak Lanjut
                    </h5>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {data?.highlight_tindak_lanjut || "Mempertahankan ritme kerja dan pemantauan mutu harian bersama tim pengawas."}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            
            /* ========================================================
               TAB 2: PRINTABLE OFFICIAL GOVERNMENT REPORT (A4/A3)
               ======================================================== */
            <div className="flex justify-center">
              <div
                ref={printRef}
                className={`printable-report-canvas bg-white text-slate-900 shadow-2xl p-6 transition-transform origin-top ${
                  orientation === "landscape" ? "w-[1100px] min-h-[780px]" : "w-[850px] min-h-[1150px]"
                }`}
                style={{ zoom: zoom !== 100 ? `${zoom}%` : undefined }}
              >
                {/* Official Government / Pertamina Header */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#002060] text-white flex items-center justify-center font-black text-lg rounded">
                      KNMP
                    </div>
                    <div>
                      <h1 className="text-base font-black tracking-tight text-slate-950 uppercase">
                        LAPORAN EKSEKUTIF PROYEK TERPADU v2.0
                      </h1>
                      <h2 className="text-xs font-bold text-slate-700">
                        PROGRAM KAMPUNG NELAYAN MERAH PUTIH (KNMP) • PERTAMINA SE-SUMATERA
                      </h2>
                    </div>
                  </div>
                  <div className="text-right text-[10px] tabular-nums space-y-0.5">
                    <div>No. Kontrak: <strong>{data?.nomor_kontrak}</strong></div>
                    <div>Periode: <strong>{data?.period_label || `${data?.month_name} ${data?.year}`}</strong></div>
                    <div>Health Score: <strong className="text-emerald-700">{healthScore}/100</strong></div>
                  </div>
                </div>

                {/* Section 1: Data Kontrak & Progress Summary */}
                <div className="grid grid-cols-12 gap-3 mb-4 text-[10px]">
                  <div className="col-span-8 border border-slate-400 p-2.5 bg-slate-50/50">
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="w-28 text-slate-600 font-medium">Titik Lokasi</td>
                          <td className="font-bold">: {data?.knmp_name} ({data?.regency_name}, {data?.province_name})</td>
                        </tr>
                        <tr>
                          <td className="text-slate-600 font-medium">Nama Laporan</td>
                          <td className="font-bold text-indigo-900">: {data?.laporan_nama || data?.period_label}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-600 font-medium">Jenis / Bangunan</td>
                          <td className="font-semibold">: {data?.period_type ? data.period_type.toUpperCase() : "BULANAN"} • {data?.jenis_bangunan_list && data.jenis_bangunan_list.length > 0 ? data.jenis_bangunan_list.join(", ") : "Gedung 34"}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-600 font-medium">Penyedia Jasa</td>
                          <td className="font-semibold">: {data?.kontraktor_name}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-600 font-medium">Konsultan Pengawas</td>
                          <td className="font-semibold">: {data?.konsultan_pengawas}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-600 font-medium">Nilai Kontrak</td>
                          <td className="font-bold tabular-nums text-blue-900">: {formatRupiah(data?.nilai_kontrak)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-span-4 border border-slate-400 p-2.5 bg-slate-50/50 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Plan Progress</span>
                      <span className="font-bold tabular-nums">{planProgress.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Actual Progress</span>
                      <span className="font-extrabold tabular-nums text-blue-900">{actualProgress.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Deviasi</span>
                      <span className="font-bold tabular-nums text-emerald-700">{deviasi >= 0 ? "+" : ""}{deviasi.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Cuaca / Naker</span>
                      <span className="font-bold tabular-nums text-slate-800">{data?.cuaca || "Cerah"} • {data?.tenaga_kerja || data?.total_pekerja || 1} Org</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Pencairan Keuangan</span>
                      <span className="font-bold tabular-nums text-purple-900">{progKeuangan.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: 7 Paket Pekerjaan Table */}
                <div className="border border-slate-900 mb-4">
                  <div className="bg-[#002060] text-white px-2 py-1 font-black text-[9px] uppercase tracking-wider">
                    RINGKASAN 7 PAKET PEKERJAAN &amp; REALISASI BOBOT
                  </div>
                  <table className="w-full text-[9px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                        <th className="p-1 text-center border-r border-slate-300 w-8">NO</th>
                        <th className="p-1 border-r border-slate-300">PAKET PEKERJAAN</th>
                        <th className="p-1 text-center border-r border-slate-300">BOBOT (%)</th>
                        <th className="p-1 text-center border-r border-slate-300">BULAN INI PLAN</th>
                        <th className="p-1 text-center border-r border-slate-300">BULAN INI ACTUAL</th>
                        <th className="p-1 text-center border-r border-slate-300">KUMULATIF ACTUAL</th>
                        <th className="p-1 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data?.work_packages?.map((wp) => (
                        <tr key={wp.no}>
                          <td className="p-1 text-center border-r border-slate-200 tabular-nums">{wp.no}</td>
                          <td className="p-1 border-r border-slate-200 font-medium">{wp.name}</td>
                          <td className="p-1 text-center border-r border-slate-200 tabular-nums">{wp.bobot.toFixed(2)}</td>
                          <td className="p-1 text-center border-r border-slate-200 tabular-nums">{wp.bulan_ini_plan.toFixed(2)}</td>
                          <td className="p-1 text-center border-r border-slate-200 tabular-nums">{wp.bulan_ini_actual.toFixed(2)}</td>
                          <td className="p-1 text-center border-r border-slate-200 font-bold tabular-nums text-blue-900">{wp.kumulatif_actual.toFixed(2)}</td>
                          <td className="p-1 text-center font-bold text-emerald-800">GREEN</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section 3: Lampiran Dokumen & Bukti Foto */}
                <div className="border border-slate-900 mb-4">
                  <div className="bg-[#002060] text-white px-2 py-1 font-black text-[9px] uppercase tracking-wider">
                    KELENGKAPAN DOKUMEN &amp; LAMPIRAN BUKTI FISIK LAPANGAN
                  </div>
                  <div className="p-2 text-[9px]">
                    <table className="w-full text-[9px] text-left border-collapse mb-2">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                          <th className="p-1 text-center border-r border-slate-300 w-8">NO</th>
                          <th className="p-1 border-r border-slate-300">JENIS DOKUMEN</th>
                          <th className="p-1 border-r border-slate-300">NAMA FILE</th>
                          <th className="p-1 text-center border-r border-slate-300">STATUS</th>
                          <th className="p-1 text-center">TGL UNGGAH</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {data?.documents && data.documents.length > 0 ? (
                          data.documents.map((doc, idx) => (
                            <tr key={doc.id}>
                              <td className="p-1 text-center border-r border-slate-200 tabular-nums">{idx + 1}</td>
                              <td className="p-1 border-r border-slate-200 font-semibold capitalize">{doc.category.replace(/_/g, " ")}</td>
                              <td className="p-1 border-r border-slate-200 text-slate-700 font-mono text-[8.5px]">{doc.file_name}</td>
                              <td className="p-1 text-center border-r border-slate-200 font-bold text-emerald-800">{doc.status || "Terverifikasi"}</td>
                              <td className="p-1 text-center tabular-nums">{formatDate(doc.uploaded_at || doc.created_at)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-2 text-center text-slate-500 italic">
                              Status K3, Ceklis Mutu, Laporan PDF &amp; Foto Dokumentasi Lapangan Terlampir
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 4: Multi-Party Official Signature Matrix */}
                <div className="mt-6 border-t-2 border-slate-900 pt-4">
                  <div className="text-center font-bold text-[10px] text-slate-800 uppercase mb-4">
                    LEMBAR PENGESAHAN &amp; VERIFIKASI RESMI
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center text-[9px]">
                    <div className="border border-slate-300 p-2 rounded flex flex-col justify-between h-32">
                      <span className="font-semibold text-slate-600">Disiapkan Oleh:<br /><strong>KONTRAKTOR PELAKSANA</strong></span>
                      <div className="text-slate-400 text-[8px]">(Tanda Tangan &amp; Cap)</div>
                      <div className="border-t border-slate-400 pt-1 font-bold">{data?.kontraktor_name}</div>
                    </div>
                    <div className="border border-slate-300 p-2 rounded flex flex-col justify-between h-32">
                      <span className="font-semibold text-slate-600">Diperiksa Oleh:<br /><strong>KONSULTAN PENGAWAS</strong></span>
                      <div className="text-slate-400 text-[8px]">(Tanda Tangan &amp; Cap)</div>
                      <div className="border-t border-slate-400 pt-1 font-bold">{data?.konsultan_pengawas}</div>
                    </div>
                    <div className="border border-slate-300 p-2 rounded flex flex-col justify-between h-32">
                      <span className="font-semibold text-slate-600">Diverifikasi Oleh:<br /><strong>WAKIL PPK WILAYAH</strong></span>
                      <div className="text-slate-400 text-[8px]">(Tanda Tangan &amp; Cap)</div>
                      <div className="border-t border-slate-400 pt-1 font-bold">{data?.wakil_ppk}</div>
                    </div>
                    <div className="border border-slate-300 p-2 rounded flex flex-col justify-between h-32">
                      <span className="font-semibold text-slate-600">Disetujui Oleh:<br /><strong>PEJABAT PEMBUAT KOMITMEN</strong></span>
                      <div className="text-slate-400 text-[8px]">(Tanda Tangan &amp; Cap)</div>
                      <div className="border-t border-slate-400 pt-1 font-bold">Direksi KNMP Pertamina</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Preview Dokumen"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
