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
        period_type: periodType,
        date: selectedDate,
        week: selectedWeek,
        month: selectedMonth,
        year: selectedYear,
        start_date: startDate,
        end_date: endDate,
      }),
    enabled: isOpen && !!selectedKnmpId,
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
              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-mono"
            />
          )}

          {periodType === "custom" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-mono"
              />
              <span className="text-slate-500">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-mono"
              />
            </div>
          )}

          {/* General Metadata Badges */}
          <div className="ml-auto flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
              Kontraktor: <strong className="text-slate-900 dark:text-slate-100">{data?.kontraktor_name || "PT. Mina Bahari Nusantara"}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
              Pengawas: <strong className="text-slate-900 dark:text-slate-100">{data?.konsultan_pengawas || "Konsultan Supervisi"}</strong>
            </span>
          </div>
        </div>

        {/* ========================================================
            MODAL CONTENT BODY
           ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950/40">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Menghitung dan memuat data laporan eksekutif v2...</p>
            </div>
          ) : viewMode === "analytics" ? (
            
            /* ========================================================
               TAB 1: EXECUTIVE ANALYTICS & BENTO DASHBOARD
               ======================================================== */
            <div className="max-w-7xl mx-auto space-y-5">
              
              {/* Row 1: Executive KPI Bento Grid (4 Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Progres Fisik Kumulatif */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 relative overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progres Fisik</span>
                    <span className={`px-2 py-0.5 text-[11px] font-mono font-black rounded-md ${
                      deviasi >= 0 ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30" : "bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
                    }`}>
                      {deviasi >= 0 ? "+" : ""}{deviasi.toFixed(2)}% Dev
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{actualProgress.toFixed(2)}%</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">dari plan <strong className="font-mono text-slate-700 dark:text-slate-200">{planProgress.toFixed(2)}%</strong></span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, actualProgress))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                    <span>Target: {planProgress.toFixed(1)}%</span>
                    <span>100% Selesai</span>
                  </div>
                </div>

                {/* 2. Keuangan & Realisasi Pembayaran */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 relative overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Keuangan / Pagu</span>
                    <span className="px-2 py-0.5 text-[11px] font-mono font-black rounded-md bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                      {progKeuangan.toFixed(1)}% Cair
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatRupiah(data?.financial_realisasi)}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Pagu: <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">{formatRupiah(data?.nilai_kontrak)}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                    Sisa Pagu: <span className="text-slate-700 dark:text-slate-300 font-semibold">{formatRupiah(data?.financial_sisa)}</span>
                  </p>
                </div>

                {/* 3. Waktu & Durasi Kontrak */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 relative overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Durasi Waktu</span>
                    <span className="px-2 py-0.5 text-[11px] font-mono font-black rounded-md bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                      {timeElapsed.toFixed(1)}% Terpakai
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{data?.masa_pelaksanaan || 120}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Hari Kalender</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mt-2 font-mono">
                    <span>Mulai: {formatDate(data?.tanggal_mulai)}</span>
                    <span>PHO: {formatDate(data?.tanggal_selesai)}</span>
                  </div>
                </div>

                {/* 4. HSE & K3 Safety Performance */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 relative overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kinerja HSE / K3</span>
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> ZERO ACCIDENT
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{Number(data?.hse?.jam_kerja_selamat_kumulatif || (actualProgress > 0 ? 1920 : 0)).toLocaleString("id-ID")}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Jam Selamat</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-300 mt-2">
                    <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded">Toolbox: <strong className="text-slate-900 dark:text-white font-mono">{data?.hse?.toolbox_meeting_kumulatif || (actualProgress > 0 ? 12 : 0)}</strong></span>
                    <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded">Inspeksi: <strong className="text-slate-900 dark:text-white font-mono">{data?.hse?.inspeksi_kumulatif || (actualProgress > 0 ? 4 : 0)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Row 2: Visual High-Fidelity S-Curve Chart */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase">Kurva-S Realtime &amp; Trend Kumulatif Proyek</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Perbandingan Rencana Progress Kumulatif vs Realisasi Aktual Fisik &amp; Penyerapan Dana</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
                      <span className="w-3 h-1 bg-blue-600 dark:bg-blue-500 rounded-full" /> Rencana ({planProgress.toFixed(1)}%)
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="w-3 h-1 bg-emerald-600 dark:bg-emerald-500 rounded-full" /> Realisasi ({actualProgress.toFixed(1)}%)
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                      <span className="w-3 h-1 bg-amber-600 dark:bg-amber-500 rounded-full" /> Keuangan ({progKeuangan.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* S-Curve Canvas / SVG Simulation */}
                <div className="h-64 w-full relative flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 240" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradPlanV2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="gradActualV2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="1000" y2="20" stroke={isDark ? "#334155" : "#e2e8f0"} strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="0" y1="75" x2="1000" y2="75" stroke={isDark ? "#334155" : "#e2e8f0"} strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="0" y1="130" x2="1000" y2="130" stroke={isDark ? "#334155" : "#e2e8f0"} strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="0" y1="185" x2="1000" y2="185" stroke={isDark ? "#334155" : "#e2e8f0"} strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="0" y1="235" x2="1000" y2="235" stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="1.5" />

                    {/* Area fills */}
                    {actualProgress > 0 && (
                      <>
                        <path
                          d={`M 50 235 Q 300 ${235 - (planProgress * 1.2)}, 500 ${235 - (planProgress * 2.15)} L 500 235 Z`}
                          fill="url(#gradPlanV2)"
                        />
                        <path
                          d={`M 50 235 Q 300 ${235 - (actualProgress * 1.2)}, 500 ${235 - (actualProgress * 2.15)} L 500 235 Z`}
                          fill="url(#gradActualV2)"
                        />
                      </>
                    )}

                    {/* Target 100% Plan line */}
                    <path
                      d="M 50 235 Q 300 210, 550 120 T 950 25"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    />

                    {/* Actual Progress Curve */}
                    {actualProgress > 0 ? (
                      <path
                        d={`M 50 235 Q 300 ${235 - (actualProgress * 1.2)}, 500 ${235 - (actualProgress * 2.15)}`}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3.5"
                      />
                    ) : (
                      <path
                        d="M 50 235 L 500 235"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3.5"
                      />
                    )}

                    {/* Financial Curve */}
                    {progKeuangan > 0 && (
                      <path
                        d={`M 50 235 Q 300 ${235 - (progKeuangan * 1.1)}, 500 ${235 - (progKeuangan * 2.15)}`}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Current point */}
                    <circle cx="500" cy={235 - (actualProgress * 2.15)} r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Bulan 1 (Juni)</span>
                  <span>Bulan 2 (Juli)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Bulan 3 (Agustus - Posisi Saat Ini)</span>
                  <span>Bulan 4 (September - Target PHO)</span>
                </div>
              </div>

              {/* Row 3: Milestone Timeline Gantt Stepper */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Milestone Control &amp; Roadmap Kritis Proyek
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {data?.milestones && data.milestones.length > 0 ? (
                    data.milestones.map((m) => {
                      const isDone = m.actual_date !== "-";
                      return (
                        <div
                          key={m.no}
                          className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
                            isDone
                              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold">M{m.no}</span>
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            )}
                          </div>
                          <span className="text-xs font-bold leading-tight line-clamp-2 text-slate-900 dark:text-white">{m.name}</span>
                          <div className="mt-2 text-[10px] font-mono border-t border-slate-200 dark:border-slate-700/50 pt-1.5 space-y-0.5">
                            <div className="text-slate-500 dark:text-slate-400">Plan: {m.plan_date}</div>
                            <div className={isDone ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400 dark:text-slate-500"}>
                              Act: {m.actual_date}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : null}
                </div>
              </div>

              {/* Row 4: 7 Paket Pekerjaan (Work Packages) Breakdown */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Rincian 7 Paket Pekerjaan &amp; Bobot Fisik
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
                        <th className="py-2.5 px-3">NO</th>
                        <th className="py-2.5 px-3">PAKET PEKERJAAN</th>
                        <th className="py-2.5 px-3 text-center font-mono">BOBOT (%)</th>
                        <th className="py-2.5 px-3 text-center font-mono">PLAN BULAN INI</th>
                        <th className="py-2.5 px-3 text-center font-mono">ACTUAL BULAN INI</th>
                        <th className="py-2.5 px-3 text-center font-mono">KUMULATIF ACTUAL</th>
                        <th className="py-2.5 px-3 text-center">PROGRESS BAR</th>
                        <th className="py-2.5 px-3 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data?.work_packages && data.work_packages.length > 0 ? (
                        data.work_packages.map((wp) => {
                          const pct = wp.bobot > 0 ? (wp.kumulatif_actual / wp.bobot) * 100 : 0;
                          return (
                            <tr key={wp.no} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-500 dark:text-slate-400">{wp.no}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{wp.name}</td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{wp.bobot.toFixed(2)}%</td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-500 dark:text-slate-400">{wp.bulan_ini_plan.toFixed(2)}%</td>
                              <td className="py-2.5 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400">{wp.bulan_ini_actual.toFixed(2)}%</td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-300">{wp.kumulatif_actual.toFixed(2)}%</td>
                              <td className="py-2.5 px-3 min-w-[140px]">
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 text-[10px] font-black rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                  ON TRACK
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 5: Quality, Materials & Issue Register */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Quality & Mutu */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Kinerja Mutu &amp; Kualitas
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-slate-600 dark:text-slate-400">Uji Mutu / Test Lab</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{data?.quality?.uji_mutu_selesai ?? 0} Selesai</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-slate-600 dark:text-slate-400">Temuan NCR</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{data?.quality?.temuan_ncr_baru ?? 0} Kasus</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-slate-600 dark:text-slate-400">Daftar Cacat (Punch List)</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{data?.quality?.daftar_cacat_buka ?? 0} Pending</span>
                    </div>
                  </div>
                </div>

                {/* Materials Tracker */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Material &amp; Logistik Utama
                  </h4>
                  <div className="space-y-2 text-xs">
                    {data?.materials && data.materials.length > 0 ? (
                      data.materials.slice(0, 3).map((m, i) => (
                        <div key={i} className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px]">{m.nama}</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{m.realisasi.toFixed(0)}%</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-center text-slate-400">Material sesuai jadwal</div>
                    )}
                  </div>
                </div>

                {/* Issues Register */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Kendala Kritis Lapangan
                  </h4>
                  <div className="space-y-2 text-xs">
                    {data?.issues && data.issues.length > 0 ? (
                      data.issues.slice(0, 2).map((iss) => (
                        <div key={iss.id} className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40">
                          <span className="font-bold text-rose-700 dark:text-rose-300 block">{iss.judul}</span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 block">{iss.dampak || "Mitigasi aktif"}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                        Tidak ada kendala kritis
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 6: Executive Highlights & Management Summary */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Ringkasan Eksekutif &amp; Arahan Tindak Lanjut
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
                    <strong className="text-blue-900 dark:text-blue-300 font-bold block mb-1">🛡️ Capaian Utama</strong>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{data?.highlight_capaian || "Pekerjaan konstruksi dan administrasi berjalan on track."}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                    <strong className="text-amber-900 dark:text-amber-300 font-bold block mb-1">⚠️ Isu &amp; Tantangan</strong>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{data?.highlight_masalah || "Tidak ada kendala kritis di lapangan."}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                    <strong className="text-emerald-900 dark:text-emerald-300 font-bold block mb-1">⚡ Rencana Tindak Lanjut</strong>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{data?.highlight_tindak_lanjut || "Mempertahankan ritme kurva-S bersama tim pengawas."}</p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            
            /* ========================================================
               TAB 2: OFFICIAL PRINTABLE DOCUMENT VIEW (A4/A3 Standard)
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
                  <div className="text-right text-[10px] font-mono space-y-0.5">
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
                          <td className="text-slate-600 font-medium">Penyedia Jasa</td>
                          <td className="font-semibold">: {data?.kontraktor_name}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-600 font-medium">Konsultan Pengawas</td>
                          <td className="font-semibold">: {data?.konsultan_pengawas}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-600 font-medium">Nilai Kontrak</td>
                          <td className="font-bold font-mono text-blue-900">: {formatRupiah(data?.nilai_kontrak)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-span-4 border border-slate-400 p-2.5 bg-slate-50/50 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Plan Progress</span>
                      <span className="font-mono font-bold">{planProgress.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Actual Progress</span>
                      <span className="font-mono font-black text-blue-900">{actualProgress.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Deviasi</span>
                      <span className="font-mono font-bold text-emerald-700">{deviasi >= 0 ? "+" : ""}{deviasi.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Pencairan Keuangan</span>
                      <span className="font-mono font-bold text-purple-900">{progKeuangan.toFixed(2)}%</span>
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
                        <th className="p-1 text-center border-r border-slate-300 font-mono">BOBOT (%)</th>
                        <th className="p-1 text-center border-r border-slate-300 font-mono">BULAN INI PLAN</th>
                        <th className="p-1 text-center border-r border-slate-300 font-mono">BULAN INI ACTUAL</th>
                        <th className="p-1 text-center border-r border-slate-300 font-mono">KUMULATIF ACTUAL</th>
                        <th className="p-1 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data?.work_packages?.map((wp) => (
                        <tr key={wp.no}>
                          <td className="p-1 text-center border-r border-slate-200 font-mono">{wp.no}</td>
                          <td className="p-1 border-r border-slate-200 font-medium">{wp.name}</td>
                          <td className="p-1 text-center border-r border-slate-200 font-mono">{wp.bobot.toFixed(2)}</td>
                          <td className="p-1 text-center border-r border-slate-200 font-mono">{wp.bulan_ini_plan.toFixed(2)}</td>
                          <td className="p-1 text-center border-r border-slate-200 font-mono">{wp.bulan_ini_actual.toFixed(2)}</td>
                          <td className="p-1 text-center border-r border-slate-200 font-mono font-bold text-blue-900">{wp.kumulatif_actual.toFixed(2)}</td>
                          <td className="p-1 text-center font-bold text-emerald-800">GREEN</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section 3: Multi-Party Official Signature Matrix */}
                <div className="mt-8 border-t-2 border-slate-900 pt-4">
                  <div className="text-center font-bold text-[10px] text-slate-800 uppercase mb-4">
                    LEMBAR PENGESAHAN &amp; VERIFIKASI RESMI
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center text-[9px]">
                    <div className="border border-slate-300 p-2 rounded flex flex-col justify-between h-32">
                      <span className="font-semibold text-slate-600">Disiapkan Oleh:<br /><strong>KONTRAKTOR PELAKSANA</strong></span>
                      <div className="text-slate-400 font-mono text-[8px]">(Tanda Tangan &amp; Cap)</div>
                      <div className="border-t border-slate-400 pt-1 font-bold">{data?.kontraktor_name}</div>
                    </div>
                    <div className="border border-slate-300 p-2 rounded flex flex-col justify-between h-32">
                      <span className="font-semibold text-slate-600">Diperiksa Oleh:<br /><strong>KONSULTAN PENGAWAS</strong></span>
                      <div className="text-slate-400 font-mono text-[8px]">(Tanda Tangan &amp; Cap)</div>
                      <div className="border-t border-slate-400 pt-1 font-bold">{data?.konsultan_pengawas}</div>
                    </div>
                    <div className="border border-slate-300 p-2 rounded flex flex-col justify-between h-32">
                      <span className="font-semibold text-slate-600">Diverifikasi Oleh:<br /><strong>WAKIL PPK WILAYAH</strong></span>
                      <div className="text-slate-400 font-mono text-[8px]">(Tanda Tangan &amp; Cap)</div>
                      <div className="border-t border-slate-400 pt-1 font-bold">{data?.wakil_ppk}</div>
                    </div>
                    <div className="border border-slate-300 p-2 rounded flex flex-col justify-between h-32">
                      <span className="font-semibold text-slate-600">Disetujui Oleh:<br /><strong>PEJABAT PEMBUAT KOMITMEN</strong></span>
                      <div className="text-slate-400 font-mono text-[8px]">(Tanda Tangan &amp; Cap)</div>
                      <div className="border-t border-slate-400 pt-1 font-bold">Direksi KNMP Pertamina</div>
                    </div>
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
