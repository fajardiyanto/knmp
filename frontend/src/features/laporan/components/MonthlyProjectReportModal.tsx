import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Printer,
  X,
  RefreshCw,
  Edit3,
  Check,
  Building2,
  Calendar,
  FileSpreadsheet,
  Sun,
  BarChart3,
  FileText,
  CalendarRange,
  LayoutTemplate,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { fetchMonthlyProjectReport } from "../api";
import { apiFetch } from "../../../lib/api-client";
import { MonthlyProjectReportData } from "../types";
import { useAuth } from "../../auth/hooks/useAuth";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { ModernDatePicker } from "../../../components/ui/ModernDatePicker";
import { ModernDateRangePicker } from "../../../components/ui/ModernDateRangePicker";

interface MonthlyProjectReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialKnmpId?: number;
}

interface KnmpOption {
  id: number;
  name: string;
  regional_name?: string;
  province_name?: string;
}

type PeriodType = "harian" | "mingguan" | "bulanan" | "custom";
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

export const MonthlyProjectReportModal: React.FC<MonthlyProjectReportModalProps> = ({
  isOpen,
  onClose,
  initialKnmpId,
}) => {
  const { user } = useAuth();
  const userKnmpId = user?.knmp_ids && user.knmp_ids.length > 0 ? user.knmp_ids[0] : undefined;
  const isFieldUser = Boolean(user?.roles?.some((r) => r === "operator" || r === "kontraktor"));

  // Filter States
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

  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  useEffect(() => {
    if (initialKnmpId) {
      setSelectedKnmpId(initialKnmpId);
    } else if (userKnmpId) {
      setSelectedKnmpId(userKnmpId);
    }
  }, [initialKnmpId, userKnmpId]);

  // Editable fields for Section 2 (Highlights)
  const [customHighlights, setCustomHighlights] = useState({
    capaian: "Penyelesaian struktur dasar dermaga dan pendaratan ikan, mobilisasi material utama on track.",
    masalah: "Tidak ada kendala kritis di lapangan.",
    tindakLanjut: "Mempertahankan ritme kerja harian bersama tim pengawas.",
  });

  // Editable fields for Section 13 (Management Summary)
  const [customManagement, setCustomManagement] = useState({
    pencapaian: "Progress fisik berjalan sesuai target perencanaan.",
    deviasiPenyebab: "Sesuai jadwal rencana.",
    recoveryAction: "Mempertahankan ritme kerja sesuai schedule Kurva-S.",
    dukungan: "Koordinasi berkala bersama direksi pekerjaan.",
    rencanaBulanDepan: "Melanjutkan tahapan pekerjaan fisik berikutnya.",
  });

  // Fetch list of all KNMPs for selector (for admin/pengawas)
  const { data: knmpsData } = useQuery<KnmpOption[]>({
    queryKey: ["knmp-list-report"],
    queryFn: () => apiFetch<KnmpOption[]>("/api/v1/knmp"),
    enabled: isOpen,
  });

  // Fetch Report Data based on selected KNMP & Period
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery<MonthlyProjectReportData>({
    queryKey: [
      "project-report",
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

  useEffect(() => {
    if (reportData) {
      setCustomHighlights({
        capaian: reportData.highlight_capaian || "Pekerjaan konstruksi dan administrasi berjalan sesuai jadwal.",
        masalah: reportData.highlight_masalah || "Tidak ada kendala kritis di lapangan.",
        tindakLanjut: reportData.highlight_tindak_lanjut || "Mempertahankan ritme kerja harian bersama tim pengawas.",
      });
      setCustomManagement({
        pencapaian: reportData.mgmt_pencapaian || "Progress fisik berjalan sesuai target perencanaan.",
        deviasiPenyebab: "Sesuai jadwal rencana.",
        recoveryAction: reportData.mgmt_recovery || "Mempertahankan ritme kerja sesuai schedule Kurva-S.",
        dukungan: "Koordinasi berkala bersama direksi pekerjaan.",
        rencanaBulanDepan: reportData.mgmt_rencana || "Melanjutkan tahapan pekerjaan fisik berikutnya.",
      });
    }
  }, [reportData]);

  useEffect(() => {
    if (initialKnmpId) {
      setSelectedKnmpId(initialKnmpId);
    } else if (userKnmpId) {
      setSelectedKnmpId(userKnmpId);
    } else if (knmpsData && knmpsData.length > 0 && !selectedKnmpId) {
      setSelectedKnmpId(knmpsData[0].id);
    }
  }, [initialKnmpId, userKnmpId, knmpsData]);

  if (!isOpen) return null;

  const data = reportData;

  const handlePrint = () => {
    window.print();
  };

  const getRAGBadge = (status?: string) => {
    const s = (status || "GREEN").toUpperCase();
    if (s === "GREEN" || s === "NORMAL") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span> NORMAL
        </span>
      );
    }
    if (s === "YELLOW" || s === "PERHATIAN") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-600"></span> PERHATIAN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-400">
        <span className="w-2 h-2 rounded-full bg-rose-600"></span> KRITIS
      </span>
    );
  };

  const getRAGDot = (status?: string) => {
    const s = (status || "GREEN").toUpperCase();
    if (s === "GREEN" || s === "NORMAL")
      return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs"></span>;
    if (s === "YELLOW" || s === "PERHATIAN")
      return <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs"></span>;
    if (s === "RED" || s === "KRITIS")
      return <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-xs"></span>;
    return <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>;
  };

  const formatRupiah = (val?: number) => {
    if (!val) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const currentKnmpName =
    knmpsData?.find((k) => k.id === selectedKnmpId)?.name || data?.knmp_name || `KNMP Titik ${selectedKnmpId}`;

  // S-Curve points calculation
  const planProgress = data?.progress_plan || 0;
  const actualProgress = data?.progress_actual || 0;
  const deviasi = data?.progress_deviasi || 0;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      {/* 1. Header Toolbar (Hidden during Print) */}
      <div className="print:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-slate-800 dark:text-white shadow-md dark:shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Generator Laporan Proyek Terpadu (Kontraktor)
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 rounded-full text-[10px] uppercase font-bold tracking-wider">
                {periodType}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isFieldUser ? `Proyek Anda: ${currentKnmpName}` : "Format Pengendalian Proyek Resmi KNMP Wilayah Sumatera"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Orientation Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setOrientation("landscape")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                orientation === "landscape"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
              title="Tampilan Landscape (Mendatar / A4 Landscape)"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Landscape</span>
            </button>
            <button
              type="button"
              onClick={() => setOrientation("portrait")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                orientation === "portrait"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
              title="Tampilan Portrait (Tegak / A4 Portrait)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Portrait</span>
            </button>
          </div>

          {/* Zoom Controller */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(50, prev - 15))}
              disabled={zoom <= 50}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Perkecil Ukuran (Zoom Out)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-md cursor-pointer transition-colors"
              title="Reset Zoom ke 100%"
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(200, prev + 15))}
              disabled={zoom >= 200}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Perbesar Ukuran (Zoom In)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isEditMode
                ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md font-bold"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {isEditMode ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditMode ? "Selesai Edit" : "Edit Teks"}</span>
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-500" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 transition-colors ml-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Secondary Filter & Period Selection Bar (Hidden during Print) */}
      <div className="print:hidden bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Left: Period Type Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-950 p-1 rounded-xl border border-slate-300/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setPeriodType("harian")}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              periodType === "harian"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Harian</span>
          </button>
          <button
            type="button"
            onClick={() => setPeriodType("mingguan")}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              periodType === "mingguan"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Mingguan</span>
          </button>
          <button
            type="button"
            onClick={() => setPeriodType("bulanan")}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              periodType === "bulanan"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Bulanan</span>
          </button>
          <button
            type="button"
            onClick={() => setPeriodType("custom")}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              periodType === "custom"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Rentang Tanggal</span>
          </button>
        </div>

        {/* Right: Dynamic Period Inputs & KNMP Scoping */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* KNMP Selector / Scoped Badge */}
          {isFieldUser ? (
            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-700/60 rounded-xl px-3 py-1.5 text-blue-700 dark:text-blue-200">
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-xs">{currentKnmpName}</span>
            </div>
          ) : (
            <div className="w-full sm:w-[260px]">
              <SearchableSelect
                value={selectedKnmpId.toString()}
                onChange={(val) => setSelectedKnmpId(Number(val))}
                options={
                  knmpsData?.map((k) => ({
                    value: k.id.toString(),
                    label: `${k.name} (${k.province_name || "Sumatera"})`,
                  })) || []
                }
                placeholder="Cari titik KNMP..."
                searchPlaceholder="Cari dari 346 titik..."
                className="w-full"
              />
            </div>
          )}

          {/* Conditional Inputs based on Period Type */}
          {periodType === "harian" && (
            <ModernDatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              label="Tanggal"
            />
          )}

          {periodType === "mingguan" && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white shadow-2xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Minggu:</span>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value={1} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Minggu ke-1</option>
                  <option value={2} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Minggu ke-2</option>
                  <option value={3} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Minggu ke-3</option>
                  <option value={4} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Minggu ke-4</option>
                  <option value={5} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Minggu ke-5</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white shadow-2xs">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer pr-1"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {periodType === "bulanan" && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer pr-1"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {periodType === "custom" && (
            <ModernDateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
              }}
            />
          )}
        </div>
      </div>

      {/* 3. Printable Report Document Canvas (Landscape / Portrait A3/A4 Style) */}
      <div className="flex-1 overflow-auto p-3 md:p-6 flex justify-center items-start bg-slate-200/70 dark:bg-slate-950/70 print:p-0 print:bg-white print:overflow-visible">
        {/* Dynamic @page CSS based on selected orientation & zoom reset for printing */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: ${orientation};
              margin: ${orientation === "landscape" ? "5mm" : "7mm"};
            }
            .printable-report-canvas {
              zoom: 1 !important;
              transform: none !important;
              max-width: 100% !important;
              margin: 0 !important;
            }
          }
        `}} />

        <div
          style={{
            zoom: zoom !== 100 ? `${zoom}%` : undefined,
          }}
          className={`printable-report-canvas w-full ${orientation === "portrait" ? "max-w-[900px]" : "max-w-[1360px]"} bg-white text-slate-950 shadow-2xl rounded-sm p-5 print:p-2 print:shadow-none print:max-w-none text-[9.5px] leading-tight border border-slate-300 font-sans print:border-none transition-transform origin-top`}
        >
          
          {/* ========================================================
              TOP HEADER BAR (Logos, Title, Doc Number & RAG Legend)
             ======================================================== */}
          <div className={`border border-slate-900 ${orientation === "portrait" ? "grid grid-cols-12" : "flex items-stretch"} mb-2`}>
            {/* Left: KNMP Logo */}
            <div className={`${orientation === "portrait" ? "col-span-12 sm:col-span-3 border-b sm:border-b-0 border-r" : "w-48 border-r"} p-2 border-slate-900 flex items-center gap-2 bg-slate-50/20`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-lg flex flex-col items-center justify-center text-white shrink-0 shadow-xs border border-blue-500/40">
                <span className="text-[11px] font-black tracking-tighter leading-none">KNMP</span>
                <span className="text-[6px] font-bold text-red-400">MERAH PUTIH</span>
              </div>
              <div className="leading-tight">
                <div className="font-black text-[10px] text-blue-950">KNMP</div>
                <div className="text-[7.5px] font-bold text-red-600 tracking-tight">KAMPUNG NELAYAN</div>
                <div className="text-[7.5px] font-black text-red-700 tracking-tight">MERAH PUTIH</div>
                <div className="text-[8.5px] font-black text-slate-900 mt-0.5 tracking-wider">SUMATERA</div>
              </div>
            </div>

            {/* Center: Main Title */}
            <div className={`${orientation === "portrait" ? "col-span-12 sm:col-span-9 border-b sm:border-b-0" : "flex-1 border-r"} text-center py-2 px-3 flex flex-col justify-center border-slate-900`}>
              <h1 className="text-[15px] sm:text-[16px] font-black tracking-tight text-[#002060] uppercase leading-none">
                {periodType === "harian"
                  ? "LAPORAN HARIAN PROYEK"
                  : periodType === "mingguan"
                  ? "LAPORAN MINGGUAN PROYEK"
                  : periodType === "custom"
                  ? "LAPORAN PROGRES PERIODE PROYEK"
                  : "LAPORAN BULANAN PROYEK"}
              </h1>
              <h2 className="text-[11px] sm:text-[12px] font-black text-[#c00000] uppercase tracking-wide mt-0.5">
                KONTRAKTOR PELAKSANA
              </h2>
              <p className="text-[8.5px] sm:text-[9px] font-bold text-[#002060] uppercase tracking-wider mt-0.5">
                KAMPUNG NELAYAN MERAH PUTIH (KNMP) - WILAYAH SUMATERA
              </p>
            </div>

            {/* Right 1: Report Number & Period Box */}
            <div className={`${orientation === "portrait" ? "col-span-6 border-r border-t" : "w-48 border-r"} p-1.5 border-slate-900 flex flex-col justify-center text-center text-[9px] bg-slate-50/60`}>
              <div className="font-bold text-[#002060] uppercase text-[8px] border-b border-slate-300 pb-0.5">
                NOMOR LAPORAN
              </div>
              <div className="font-mono font-black text-slate-900 my-0.5 text-[8.5px] truncate">
                MR-KNMP-SUM-{String(data?.knmp_id || selectedKnmpId).padStart(3, "0")}-{selectedYear}
              </div>
              <div className="font-bold text-slate-600 text-[8px] uppercase border-t border-slate-300 pt-0.5">
                PERIODE LAPORAN
              </div>
              <div className="text-[8.5px] font-semibold text-slate-900 truncate">
                {data?.period_label || `${data?.month_name || MONTHS[selectedMonth - 1]?.label} ${selectedYear}`}
              </div>
            </div>

            {/* Right 2: Status (RAG) Legend */}
            <div className={`${orientation === "portrait" ? "col-span-6 border-t" : "w-44"} p-1.5 border-slate-900 flex flex-col justify-center text-[8px] space-y-0.5 bg-slate-50/40`}>
              <div className="font-black text-slate-800 text-center uppercase tracking-wider border-b border-slate-300 pb-0.5 text-[8.5px]">
                STATUS KINERJA (RAG)
              </div>
              <div className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-2xs shrink-0"></span>
                <span className="font-bold text-emerald-900">HIJAU</span>
                <span className="text-slate-600">: Sesuai Rencana</span>
              </div>
              <div className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-2xs shrink-0"></span>
                <span className="font-bold text-amber-900">KUNING</span>
                <span className="text-slate-600">: Perlu Perhatian</span>
              </div>
              <div className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shadow-2xs shrink-0"></span>
                <span className="font-bold text-rose-900">MERAH</span>
                <span className="text-slate-600">: Tindakan Segera</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              ROW 1: 1. IDENTITAS PROYEK + 3. TIME VS PROGRESS
             ======================================================== */}
          <div className="grid grid-cols-12 gap-1.5 mb-2">
            {/* SECTION 1: IDENTITAS PROYEK */}
            <div className={`${orientation === "portrait" ? "col-span-12" : "col-span-7"} border border-slate-900 flex flex-col`}>
              <div className="bg-[#002060] text-white px-2 py-0.5 font-black text-[9px] uppercase tracking-wider">
                1. IDENTITAS PROYEK
              </div>
              <div className="p-1.5 grid grid-cols-3 gap-x-2 gap-y-1 text-[8.5px] bg-white flex-1">
                {/* Col 1 */}
                <div className="space-y-1 border-r border-slate-200 pr-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Paket Pekerjaan</span>
                    <span className="font-bold text-slate-900 text-right truncate max-w-[120px]">{data?.knmp_name || currentKnmpName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Lokasi</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[120px]">
                      {data?.district_name || "-"}, {data?.regency_name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Nomor Kontrak</span>
                    <span className="font-mono font-bold text-slate-900 text-right">{data?.nomor_kontrak || "SP/KNMP-SUM/2026/08"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">SPMK</span>
                    <span className="font-mono font-semibold text-slate-800 text-right">{data?.spmk || "SPMK-082/01"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Nilai Kontrak</span>
                    <span className="font-bold text-emerald-800 font-mono text-right">{formatRupiah(data?.nilai_kontrak)}</span>
                  </div>
                </div>

                {/* Col 2 */}
                <div className="space-y-1 border-r border-slate-200 pr-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Tanggal Kontrak</span>
                    <span className="font-semibold text-slate-800 text-right">{data?.tanggal_kontrak || "01 Mei 2026"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Tanggal Mulai</span>
                    <span className="font-semibold text-slate-800 text-right">{data?.tanggal_mulai || "08 Mei 2026"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Masa Pelaksanaan</span>
                    <span className="font-bold text-slate-900 text-right">{data?.masa_pelaksanaan || 120} Hari Kalender</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Tgl. Selesai (Kontrak)</span>
                    <span className="font-semibold text-slate-800 text-right">{data?.tanggal_selesai || "08 Sep 2026"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Tgl. Selesai (Revisi)</span>
                    <span className="text-slate-700 text-right">-</span>
                  </div>
                </div>

                {/* Col 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Kontraktor</span>
                    <span className="font-bold text-slate-900 text-right truncate max-w-[110px]">{data?.kontraktor_name || "PT. Mina Bahari Nusantara"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Konsultan / Pengawas</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[110px]">{data?.konsultan_pengawas || "Konsultan Supervisi Wilayah"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Wakil Pimpro / PPK</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[110px]">{data?.wakil_ppk || "Muhammad Iqbal S.Pi, M.Si"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Site Manager</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[110px]">{data?.site_manager || "Ir. Hendra Gunawan"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Periode Laporan</span>
                    <span className="font-bold text-blue-900 text-right">{data?.period_label || `${data?.month_name || "Agustus"} ${selectedYear}`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: TIME VS PROGRESS (S-CURVE) */}
            <div className={`${orientation === "portrait" ? "col-span-12" : "col-span-5"} border border-slate-900 flex flex-col`}>
              <div className="bg-[#002060] text-white px-2 py-0.5 font-black text-[9px] uppercase tracking-wider text-center">
                3. WAKTU VS PROGRES FISIK (KURVA-S)
              </div>
              <div className="p-1.5 flex gap-2 flex-1 bg-white items-center">
                {/* SVG S-Curve Chart */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="text-[7.5px] font-bold text-slate-600 text-center uppercase">
                    TIME ELAPSED VS PROGRESS (S-CURVE)
                  </div>
                  <div className="h-20 w-full relative">
                    <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
                      {/* Grid Lines */}
                      <line x1="25" y1="10" x2="295" y2="10" stroke="#e2e8f0" strokeWidth="0.8" />
                      <line x1="25" y1="32" x2="295" y2="32" stroke="#e2e8f0" strokeWidth="0.8" />
                      <line x1="25" y1="55" x2="295" y2="55" stroke="#e2e8f0" strokeWidth="0.8" />
                      <line x1="25" y1="78" x2="295" y2="78" stroke="#e2e8f0" strokeWidth="0.8" />
                      <line x1="25" y1="95" x2="295" y2="95" stroke="#cbd5e1" strokeWidth="1" />

                      {/* Y-Axis Labels */}
                      <text x="5" y="13" fontSize="6" fill="#64748b" fontFamily="monospace">100%</text>
                      <text x="8" y="35" fontSize="6" fill="#64748b" fontFamily="monospace">75%</text>
                      <text x="8" y="58" fontSize="6" fill="#64748b" fontFamily="monospace">50%</text>
                      <text x="8" y="81" fontSize="6" fill="#64748b" fontFamily="monospace">25%</text>
                      <text x="12" y="96" fontSize="6" fill="#64748b" fontFamily="monospace">0%</text>

                      {/* Plan Curve (Blue) */}
                      <path
                        d="M 25 95 Q 120 70, 180 40 T 295 10"
                        fill="none"
                        stroke="#002060"
                        strokeWidth="1.8"
                      />

                      {/* Actual Curve (Green) */}
                      <path
                        d="M 25 95 Q 110 80, 180 45"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.2"
                      />

                      {/* Forecast Curve (Orange Dashed) */}
                      <path
                        d="M 180 45 Q 240 28, 295 20"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                      />

                      {/* Points */}
                      <circle cx="180" cy="45" r="2.5" fill="#10b981" />
                    </svg>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-3 text-[7.5px] mt-0.5">
                    <span className="flex items-center gap-1 font-bold text-[#002060]">
                      <span className="w-3 h-0.5 bg-[#002060]"></span> PLAN
                    </span>
                    <span className="flex items-center gap-1 font-bold text-emerald-700">
                      <span className="w-3 h-0.5 bg-emerald-500"></span> ACTUAL
                    </span>
                    <span className="flex items-center gap-1 font-bold text-amber-700">
                      <span className="w-3 h-0.5 border-t border-dashed border-amber-500"></span> FORECAST
                    </span>
                  </div>
                </div>

                {/* S-Curve Summary Box */}
                <div className="w-32 border border-slate-300 p-1 bg-slate-50/60 flex flex-col justify-between text-[7.5px] space-y-0.5">
                  <div className="font-bold text-slate-800 text-center uppercase border-b border-slate-300 pb-0.5 text-[8px]">
                    RINGKASAN S-CURVE
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Time Elapsed</span>
                    <span className="font-mono font-bold text-slate-900">75.0 %</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Progress Plan</span>
                    <span className="font-mono font-bold text-blue-900">{planProgress.toFixed(2)} %</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Progress Actual</span>
                    <span className="font-mono font-bold text-emerald-700">{actualProgress.toFixed(2)} %</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Deviasi</span>
                    <span className={`font-mono font-bold ${deviasi >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {deviasi >= 0 ? "+" : ""}{deviasi.toFixed(2)} %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Forecast at Comp.</span>
                    <span className="font-mono font-bold text-slate-900">100.0 %</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-0.5">
                    <span className="font-bold text-slate-700">Status</span>
                    {getRAGBadge(deviasi >= 0 ? "NORMAL" : "PERHATIAN")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              ROW 2: 2. RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)
             ======================================================== */}
          <div className="border border-slate-900 mb-2">
            <div className="bg-[#002060] text-white px-2 py-0.5 font-black text-[9px] uppercase tracking-wider">
              2. RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)
            </div>
            <div className="p-1.5 grid grid-cols-12 gap-2 bg-white">
              {/* Overall Project Status */}
              <div className={`${orientation === "portrait" ? "col-span-12 sm:col-span-4" : "col-span-3"} border border-slate-300 p-2 rounded bg-slate-50/50 flex flex-col justify-center text-center`}>
                <div className="text-[8px] font-bold text-slate-600 uppercase mb-1">
                  OVERALL PROJECT STATUS
                </div>
                <div className="py-1 px-2 bg-emerald-100 border border-emerald-400 text-emerald-900 font-black text-[13px] rounded flex items-center justify-center gap-1.5 tracking-wider shadow-2xs">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span> NORMAL
                </div>
                <p className="text-[7.5px] text-slate-600 mt-1 leading-tight text-left">
                  <strong className="text-slate-800">KETERANGAN :</strong> Progres fisik dan seluruh parameter utama pekerjaan berjalan sesuai dengan rencana jadwal.
                </p>
              </div>

              {/* Ringkasan Kinerja Bulan Ini Table */}
              <div className={`${orientation === "portrait" ? "col-span-12 sm:col-span-8" : "col-span-5"} border border-slate-300`}>
                <div className="bg-slate-100 px-2 py-0.5 font-bold text-[8px] text-slate-800 text-center uppercase border-b border-slate-300">
                  RINGKASAN KINERJA BULAN INI
                </div>
                <table className="w-full text-[8px] text-left">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-600 font-bold bg-slate-50">
                      <th className="py-0.5 px-1.5">PARAMETER</th>
                      <th className="py-0.5 px-1 text-center">PLAN (%)</th>
                      <th className="py-0.5 px-1 text-center">ACTUAL (%)</th>
                      <th className="py-0.5 px-1 text-center">DEVIASI (%)</th>
                      <th className="py-0.5 px-1 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-0.5 px-1.5 font-medium">Progress Fisik</td>
                      <td className="py-0.5 px-1 text-center font-mono">{planProgress.toFixed(2)}</td>
                      <td className="py-0.5 px-1 text-center font-mono font-bold text-blue-900">{actualProgress.toFixed(2)}</td>
                      <td className="py-0.5 px-1 text-center font-mono text-emerald-700">{deviasi >= 0 ? "+" : ""}{deviasi.toFixed(2)}</td>
                      <td className="py-0.5 px-1 text-center">{getRAGDot(deviasi < -5 ? "RED" : deviasi < 0 ? "YELLOW" : "GREEN")}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 font-medium">Waktu (Time Elapsed)</td>
                      <td className="py-0.5 px-1 text-center font-mono">{(data?.time_elapsed_pct || 0).toFixed(2)}</td>
                      <td className="py-0.5 px-1 text-center font-mono">{(data?.time_elapsed_pct || 0).toFixed(2)}</td>
                      <td className="py-0.5 px-1 text-center font-mono text-emerald-700">0.00</td>
                      <td className="py-0.5 px-1 text-center">{getRAGDot("GREEN")}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 font-medium">Keuangan (Financial)</td>
                      <td className="py-0.5 px-1 text-center font-mono">{(data?.prog_keuangan_pct || 0).toFixed(2)}</td>
                      <td className="py-0.5 px-1 text-center font-mono">{(data?.prog_keuangan_pct || 0).toFixed(2)}</td>
                      <td className="py-0.5 px-1 text-center font-mono text-emerald-700">0.00</td>
                      <td className="py-0.5 px-1 text-center">{getRAGDot("GREEN")}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 font-medium">Mutu (Quality)</td>
                      <td className="py-0.5 px-1 text-center font-mono">100.00</td>
                      <td className="py-0.5 px-1 text-center font-mono">{data?.quality?.daftar_cacat_buka ? (100 - data.quality.daftar_cacat_buka * 5).toFixed(2) : "100.00"}</td>
                      <td className="py-0.5 px-1 text-center font-mono text-emerald-700">0.00</td>
                      <td className="py-0.5 px-1 text-center">{getRAGDot((data?.quality?.daftar_cacat_buka || 0) > 0 ? "YELLOW" : "GREEN")}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 font-medium">K3 / HSE</td>
                      <td className="py-0.5 px-1 text-center font-mono">100.00</td>
                      <td className="py-0.5 px-1 text-center font-mono">{data?.hse?.kecelakaan_fatal ? "50.00" : "100.00"}</td>
                      <td className="py-0.5 px-1 text-center font-mono text-emerald-700">0.00</td>
                      <td className="py-0.5 px-1 text-center">{getRAGDot((data?.hse?.kecelakaan_fatal || 0) > 0 ? "RED" : "GREEN")}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 font-medium">Material &amp; Logistik</td>
                      <td className="py-0.5 px-1 text-center font-mono">100.00</td>
                      <td className="py-0.5 px-1 text-center font-mono">{actualProgress > 0 ? actualProgress.toFixed(2) : "100.00"}</td>
                      <td className="py-0.5 px-1 text-center font-mono text-emerald-700">0.00</td>
                      <td className="py-0.5 px-1 text-center">{getRAGDot("GREEN")}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 font-medium">Dokumen &amp; Approval</td>
                      <td className="py-0.5 px-1 text-center font-mono">100.00</td>
                      <td className="py-0.5 px-1 text-center font-mono">100.00</td>
                      <td className="py-0.5 px-1 text-center font-mono text-emerald-700">0.00</td>
                      <td className="py-0.5 px-1 text-center">{getRAGDot("GREEN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Highlight Bulan Ini Box - Margin atas fixed (no justify-between gap) */}
              <div className={`${orientation === "portrait" ? "col-span-12" : "col-span-4"} border border-slate-300 p-2 bg-slate-50/50 flex flex-col justify-start text-[8px] space-y-1.5`}>
                <div className="font-bold text-slate-800 text-center uppercase border-b border-slate-300 pb-1 text-[8.5px]">
                  HIGHLIGHT BULAN INI
                </div>
                <div className="space-y-1.5 pt-0.5">
                  <div>
                    <strong className="text-blue-900 font-bold flex items-center gap-1">
                      🛡️ Capaian Utama :
                    </strong>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={customHighlights.capaian}
                        onChange={(e) => setCustomHighlights({ ...customHighlights, capaian: e.target.value })}
                        className="w-full px-1 py-0.5 text-[8px] border border-amber-300 rounded bg-amber-50"
                      />
                    ) : (
                      <p className="text-slate-700 pl-3 leading-tight">{customHighlights.capaian}</p>
                    )}
                  </div>
                  <div>
                    <strong className="text-rose-900 font-bold flex items-center gap-1">
                      ⚠️ Permasalahan Kritis :
                    </strong>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={customHighlights.masalah}
                        onChange={(e) => setCustomHighlights({ ...customHighlights, masalah: e.target.value })}
                        className="w-full px-1 py-0.5 text-[8px] border border-amber-300 rounded bg-amber-50"
                      />
                    ) : (
                      <p className="text-slate-700 pl-3 leading-tight">{customHighlights.masalah}</p>
                    )}
                  </div>
                  <div>
                    <strong className="text-emerald-900 font-bold flex items-center gap-1">
                      ⚡ Tindak Lanjut Penting :
                    </strong>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={customHighlights.tindakLanjut}
                        onChange={(e) => setCustomHighlights({ ...customHighlights, tindakLanjut: e.target.value })}
                        className="w-full px-1 py-0.5 text-[8px] border border-amber-300 rounded bg-amber-50"
                      />
                    ) : (
                      <p className="text-slate-700 pl-3 leading-tight">{customHighlights.tindakLanjut}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              ROW 3: 4. PROGRESS FISIK PEKERJAAN + 5. MILESTONE CONTROL
             ======================================================== */}
          <div className="grid grid-cols-12 gap-1.5 mb-2">
            {/* SECTION 4: PROGRESS FISIK PEKERJAAN (BOBOT PEKERJAAN) */}
            <div className={`${orientation === "portrait" ? "col-span-12" : "col-span-7"} border border-slate-900 flex flex-col`}>
              <div className="bg-[#002060] text-white px-2 py-0.5 font-black text-[9px] uppercase tracking-wider">
                4. PROGRESS FISIK PEKERJAAN (BOBOT PEKERJAAN)
              </div>
              <div className="overflow-x-auto flex-1 bg-white">
                <table className="w-full text-left text-[8px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                      <th rowSpan={2} className="py-1 px-1 text-center border-r border-slate-300 w-5">NO</th>
                      <th rowSpan={2} className="py-1 px-2 border-r border-slate-300">WORK PACKAGE / KEGIATAN</th>
                      <th rowSpan={2} className="py-1 px-1 text-center border-r border-slate-300 w-10">BOBOT (%)</th>
                      <th className="py-0.5 px-1 text-center border-r border-slate-300" colSpan={1}>KUMULATIF S.D LALU</th>
                      <th className="py-0.5 px-1 text-center border-r border-slate-300" colSpan={2}>BULAN INI</th>
                      <th className="py-0.5 px-1 text-center border-r border-slate-300" colSpan={2}>KUMULATIF S.D BULAN INI</th>
                      <th rowSpan={2} className="py-1 px-1 text-center border-r border-slate-300 w-10">DEVIASI (%)</th>
                      <th rowSpan={2} className="py-1 px-1 text-center w-8">STATUS</th>
                    </tr>
                    <tr className="bg-slate-50 border-b border-slate-300 text-slate-600 font-bold text-[7.5px]">
                      <th className="py-0.5 px-1 text-center border-r border-slate-300">ACTUAL (%)</th>
                      <th className="py-0.5 px-1 text-center border-r border-slate-300">PLAN (%)</th>
                      <th className="py-0.5 px-1 text-center border-r border-slate-300">ACTUAL (%)</th>
                      <th className="py-0.5 px-1 text-center border-r border-slate-300">PLAN (%)</th>
                      <th className="py-0.5 px-1 text-center border-r border-slate-300">ACTUAL (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data?.work_packages?.map((wp) => (
                      <tr key={wp.no} className="hover:bg-slate-50">
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">{wp.no}</td>
                        <td className="py-0.5 px-2 border-r border-slate-200 font-semibold text-slate-900">{wp.name}</td>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">{wp.bobot.toFixed(1)}</td>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">{wp.lalu_actual.toFixed(2)}</td>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">{wp.bulan_ini_plan.toFixed(2)}</td>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono font-bold text-blue-900">{wp.bulan_ini_actual.toFixed(2)}</td>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">{wp.kumulatif_plan.toFixed(2)}</td>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono font-black text-slate-950">{wp.kumulatif_actual.toFixed(2)}</td>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono font-bold text-emerald-700">0.00</td>
                        <td className="py-0.5 px-1 text-center">{getRAGDot(wp.status)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black border-t-2 border-slate-400">
                      <td colSpan={2} className="py-1 px-2 text-right border-r border-slate-300 uppercase">TOTAL :</td>
                      <td className="py-1 px-1 text-center border-r border-slate-300 font-mono">100%</td>
                      <td className="py-1 px-1 text-center border-r border-slate-300 font-mono">--</td>
                      <td className="py-1 px-1 text-center border-r border-slate-300 font-mono">{planProgress.toFixed(2)}</td>
                      <td className="py-1 px-1 text-center border-r border-slate-300 font-mono text-blue-950 font-black">{actualProgress.toFixed(2)}</td>
                      <td className="py-1 px-1 text-center border-r border-slate-300 font-mono">{planProgress.toFixed(2)}</td>
                      <td className="py-1 px-1 text-center border-r border-slate-300 font-mono text-emerald-800 font-black">{actualProgress.toFixed(2)}</td>
                      <td className="py-1 px-1 text-center border-r border-slate-300 font-mono text-emerald-700">0.00</td>
                      <td className="py-1 px-1 text-center">{getRAGDot("GREEN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 5: MILESTONE CONTROL */}
            <div className={`${orientation === "portrait" ? "col-span-12" : "col-span-5"} border border-slate-900 flex flex-col`}>
              <div className="bg-[#002060] text-white px-2 py-0.5 font-black text-[9px] uppercase tracking-wider">
                5. PENGENDALIAN TAHAPAN (MILESTONE)
              </div>
              <div className="overflow-x-auto flex-1 bg-white">
                <table className="w-full text-left text-[8px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                      <th className="py-1 px-2 border-r border-slate-300">TAHAPAN / MILESTONE</th>
                      <th className="py-1 px-1 text-center border-r border-slate-300 w-16">TGL. RENCANA</th>
                      <th className="py-1 px-1 text-center border-r border-slate-300 w-20">REALISASI / TARGET</th>
                      <th className="py-1 px-1 text-center border-r border-slate-300 w-14">DEVIASI (HARI)</th>
                      <th className="py-1 px-1 text-center w-8">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data?.milestones?.map((m) => (
                      <tr key={m.no} className="hover:bg-slate-50">
                        <td className="py-0.5 px-2 border-r border-slate-200 font-medium">{m.name}</td>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">{m.plan_date}</td>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono font-semibold">{m.actual_date}</td>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono text-emerald-700">{m.deviasi_hari}</td>
                        <td className="py-0.5 px-1 text-center">{getRAGDot(m.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ========================================================
              ROW 4: SECTION 6, 7, 8, 9 (Quality, HSE, Material, Doc Tracker)
             ======================================================== */}
          <div className="grid grid-cols-12 gap-1.5 mb-2">
            {/* 6. QUALITY PERFORMANCE */}
            <div className={`${orientation === "portrait" ? "col-span-6" : "col-span-3"} border border-slate-900 flex flex-col`}>
              <div className="bg-[#002060] text-white px-1.5 py-0.5 font-black text-[8.5px] uppercase tracking-wider truncate">
                6. KINERJA MUTU &amp; KUALITAS
              </div>
              <table className="w-full text-[7.5px] text-left border-collapse flex-1">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <th className="py-0.5 px-1 border-r border-slate-300">PARAMETER</th>
                    <th className="py-0.5 px-0.5 text-center border-r border-slate-300">BARU</th>
                    <th className="py-0.5 px-0.5 text-center border-r border-slate-300">BUKA</th>
                    <th className="py-0.5 px-0.5 text-center border-r border-slate-300">SELESAI</th>
                    <th className="py-0.5 px-0.5 text-center border-r border-slate-300">TERLAMBAT</th>
                    <th className="py-0.5 px-0.5 text-center">ST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-0.5 px-1 border-r border-slate-200 font-medium">Uji Mutu / Test Lab</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{data?.quality?.uji_mutu_baru ?? 0}</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{data?.quality?.uji_mutu_buka ?? 0}</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono font-bold text-emerald-700">{data?.quality?.uji_mutu_selesai ?? 0}</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{data?.quality?.uji_mutu_terlambat ?? 0}</td>
                    <td className="py-0.5 px-0.5 text-center">{getRAGDot("GREEN")}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-1 border-r border-slate-200 font-medium">Temuan NCR</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{data?.quality?.temuan_ncr_baru ?? 0}</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{data?.quality?.temuan_ncr_buka ?? 0}</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{data?.quality?.temuan_ncr_selesai ?? 0}</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{data?.quality?.temuan_ncr_terlambat ?? 0}</td>
                    <td className="py-0.5 px-0.5 text-center">{getRAGDot("GREEN")}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-1 border-r border-slate-200 font-medium">Daftar Cacat (Punch List)</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{data?.quality?.daftar_cacat_baru ?? 0}</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{data?.quality?.daftar_cacat_buka ?? 0}</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{data?.quality?.daftar_cacat_selesai ?? 0}</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">0</td>
                    <td className="py-0.5 px-0.5 text-center">{getRAGDot((data?.quality?.daftar_cacat_buka || 0) > 0 ? "YELLOW" : "GREEN")}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-1 border-r border-slate-200 font-medium">Tindakan Perbaikan</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{data?.quality?.perbaikan_baru ?? 0}</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">0</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{data?.quality?.perbaikan_selesai ?? 0}</td>
                    <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">0</td>
                    <td className="py-0.5 px-0.5 text-center">{getRAGDot("GREEN")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 7. K3 / HSE PERFORMANCE */}
            <div className={`${orientation === "portrait" ? "col-span-6" : "col-span-3"} border border-slate-900 flex flex-col`}>
              <div className="bg-[#002060] text-white px-1.5 py-0.5 font-black text-[8.5px] uppercase tracking-wider truncate">
                7. KINERJA K3 &amp; KESELAMATAN (HSE)
              </div>
              <table className="w-full text-[7.5px] text-left border-collapse flex-1">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <th className="py-0.5 px-1 border-r border-slate-300">PARAMETER</th>
                    <th className="py-0.5 px-1 text-center border-r border-slate-300">BULAN INI</th>
                    <th className="py-0.5 px-1 text-center">KUMULATIF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-0.5 px-1 border-r border-slate-200 font-medium">Jam Kerja Selamat</td>
                    <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">{Number(data?.hse?.jam_kerja_selamat_bulan_ini || 0).toLocaleString("id-ID")}</td>
                    <td className="py-0.5 px-1 text-center font-mono font-bold text-blue-900">{Number(data?.hse?.jam_kerja_selamat_kumulatif || 0).toLocaleString("id-ID")}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-1 border-r border-slate-200 font-medium">Kecelakaan Fatal</td>
                    <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono text-emerald-700">{data?.hse?.kecelakaan_fatal ?? 0}</td>
                    <td className="py-0.5 px-1 text-center font-mono text-emerald-700">{data?.hse?.kecelakaan_fatal ?? 0}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-1 border-r border-slate-200 font-medium">Near Miss</td>
                    <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">{data?.hse?.near_miss ?? 0}</td>
                    <td className="py-0.5 px-1 text-center font-mono">{data?.hse?.near_miss ?? 0}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-1 border-r border-slate-200 font-medium">Unsafe Condition</td>
                    <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">{data?.hse?.unsafe_condition ?? 0}</td>
                    <td className="py-0.5 px-1 text-center font-mono">{data?.hse?.unsafe_condition ?? 0}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-1 border-r border-slate-200 font-medium">Toolbox Meeting</td>
                    <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">{data?.hse?.toolbox_meeting_bulan_ini ?? 0}</td>
                    <td className="py-0.5 px-1 text-center font-mono">{data?.hse?.toolbox_meeting_kumulatif ?? 0}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-1 border-r border-slate-200 font-medium">Inspeksi Lapangan</td>
                    <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">{data?.hse?.inspeksi_bulan_ini ?? 0}</td>
                    <td className="py-0.5 px-1 text-center font-mono">{data?.hse?.inspeksi_kumulatif ?? 0}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-1 border-r border-slate-200 font-medium">Lost Time Injury (LTI)</td>
                    <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono text-emerald-700 font-bold">{data?.hse?.lost_time_injury ?? 0}</td>
                    <td className="py-0.5 px-1 text-center font-mono text-emerald-700 font-bold">{data?.hse?.lost_time_injury ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 8. MATERIAL & PROCUREMENT STATUS */}
            <div className={`${orientation === "portrait" ? "col-span-6" : "col-span-3"} border border-slate-900 flex flex-col`}>
              <div className="bg-[#002060] text-white px-1.5 py-0.5 font-black text-[8.5px] uppercase tracking-wider truncate">
                8. STATUS MATERIAL &amp; PENGADAAN
              </div>
              <table className="w-full text-[7.5px] text-left border-collapse flex-1">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <th className="py-0.5 px-1 border-r border-slate-300">MATERIAL UTAMA</th>
                    <th className="py-0.5 px-1 text-center border-r border-slate-300">RENCANA</th>
                    <th className="py-0.5 px-1 text-center border-r border-slate-300">REALISASI</th>
                    <th className="py-0.5 px-0.5 text-center">RSK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data?.materials && data.materials.length > 0 ? (
                    data.materials.map((mat, i) => (
                      <tr key={i}>
                        <td className="py-0.5 px-1 border-r border-slate-200 font-medium">{mat.nama}</td>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">{mat.rencana.toFixed(0)}%</td>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono font-bold text-emerald-700">{mat.realisasi.toFixed(1)}%</td>
                        <td className="py-0.5 px-0.5 text-center">{getRAGDot(mat.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-2 text-center text-slate-400">Data material tidak tersedia</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 9. DOCUMENT & APPROVAL TRACKER */}
            <div className={`${orientation === "portrait" ? "col-span-6" : "col-span-3"} border border-slate-900 flex flex-col`}>
              <div className="bg-[#002060] text-white px-1.5 py-0.5 font-black text-[8.5px] uppercase tracking-wider truncate">
                9. DOKUMEN &amp; PERSETUJUAN
              </div>
              <table className="w-full text-[7.5px] text-left border-collapse flex-1">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <th className="py-0.5 px-1 border-r border-slate-300">DOKUMEN</th>
                    <th className="py-0.5 px-0.5 text-center border-r border-slate-300">WAJIB</th>
                    <th className="py-0.5 px-0.5 text-center border-r border-slate-300">KIRIM</th>
                    <th className="py-0.5 px-0.5 text-center border-r border-slate-300">SETUJU</th>
                    <th className="py-0.5 px-0.5 text-center">ST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data?.doc_trackers && data.doc_trackers.length > 0 ? (
                    data.doc_trackers.map((doc, i) => (
                      <tr key={i}>
                        <td className="py-0.5 px-1 border-r border-slate-200 font-medium">{doc.nama}</td>
                        <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{doc.wajib}</td>
                        <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono">{doc.kirim}</td>
                        <td className="py-0.5 px-0.5 text-center border-r border-slate-200 font-mono font-bold text-emerald-700">{doc.setuju}</td>
                        <td className="py-0.5 px-0.5 text-center">{getRAGDot(doc.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-2 text-center text-slate-400">Data dokumen tidak tersedia</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================
              ROW 5: SECTION 10, 11, 12, 13 (Risk, Financial, Look Ahead, Management)
             ======================================================== */}
          <div className="grid grid-cols-12 gap-1.5 mb-2">
            {/* 10. ISSUE / RISK REGISTER */}
            <div className={`${orientation === "portrait" ? "col-span-6" : "col-span-4"} border border-slate-900 flex flex-col`}>
              <div className="bg-[#002060] text-white px-1.5 py-0.5 font-black text-[8.5px] uppercase tracking-wider truncate">
                10. REGISTER KENDALA &amp; RISIKO (TOP ISSUES)
              </div>
              <table className="w-full text-[7.5px] text-left border-collapse flex-1">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <th className="py-0.5 px-1 border-r border-slate-300 w-4 text-center">ID</th>
                    <th className="py-0.5 px-1.5 border-r border-slate-300">KENDALA / RISIKO</th>
                    <th className="py-0.5 px-1 text-center border-r border-slate-300 w-8">LVL</th>
                    <th className="py-0.5 px-1.5 border-r border-slate-300">MITIGASI</th>
                    <th className="py-0.5 px-1 text-center w-10">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data?.issues && data.issues.length > 0 ? (
                    data.issues.slice(0, 3).map((iss, i) => (
                      <tr key={iss.id}>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">{i + 1}</td>
                        <td className="py-0.5 px-1.5 border-r border-slate-200 font-medium text-slate-900">{iss.judul}</td>
                        <td className="py-0.5 px-1 text-center border-r border-slate-200">
                          <span className="px-1 py-0.2 rounded font-black text-[7px] bg-amber-100 text-amber-900 border border-amber-300">
                            {iss.tingkat === "kritis" ? "H" : iss.tingkat === "sedang" ? "M" : "L"}
                          </span>
                        </td>
                        <td className="py-0.5 px-1.5 border-r border-slate-200 text-slate-600 truncate max-w-[100px]">{iss.dampak || "Mitigasi"}</td>
                        <td className="py-0.5 px-1 text-center font-bold text-blue-800">{iss.status.toUpperCase()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-2 text-slate-400">Tidak ada isu aktif</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 11. FINANCIAL / PAYMENT STATUS */}
            <div className={`${orientation === "portrait" ? "col-span-6" : "col-span-3"} border border-slate-900 flex flex-col`}>
              <div className="bg-[#002060] text-white px-1.5 py-0.5 font-black text-[8.5px] uppercase tracking-wider truncate">
                11. STATUS KEUANGAN &amp; PEMBAYARAN
              </div>
              <div className="p-1 space-y-0.5 text-[7.5px] bg-white flex-1 flex flex-col justify-between">
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Nilai Kontrak</span>
                  <span className="font-bold font-mono text-slate-900">{formatRupiah(data?.nilai_kontrak)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Addendum (+)</span>
                  <span className="font-mono text-slate-700">Rp 0</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Deduksi (-)</span>
                  <span className="font-mono text-slate-700">Rp 0</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600 font-semibold">Nilai Efektif</span>
                  <span className="font-bold font-mono text-slate-900">{formatRupiah(data?.nilai_kontrak)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Prog. Keuangan (%)</span>
                  <span className="font-bold font-mono text-blue-900">{(data?.prog_keuangan_pct || 0).toFixed(2)} %</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Pembayaran Realisasi</span>
                  <span className="font-bold font-mono text-emerald-700">{formatRupiah(data?.financial_realisasi)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-bold">Sisa Pagu</span>
                  <span className="font-bold font-mono text-slate-950">{formatRupiah(data?.financial_sisa)}</span>
                </div>
              </div>
            </div>

            {/* 12. 2-WEEK LOOK AHEAD */}
            <div className={`${orientation === "portrait" ? "col-span-6" : "col-span-2"} border border-slate-900 flex flex-col`}>
              <div className="bg-[#002060] text-white px-1 py-0.5 font-black text-[8px] uppercase tracking-wider truncate">
                12. RENCANA KERJA 2 MINGGU
              </div>
              <div className="p-1 space-y-1 text-[7.5px] bg-white flex-1">
                {data?.look_aheads && data.look_aheads.length > 0 ? (
                  data.look_aheads.map((la) => (
                    <div key={la.no} className="border-b border-slate-200 last:border-b-0 pb-0.5">
                      <strong className="text-slate-900 block font-semibold">{la.no}. {la.judul}</strong>
                      <span className="text-slate-500 font-mono">{la.target}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 py-2 text-center">Rencana kerja terjadwal</div>
                )}
              </div>
            </div>

            {/* 13. MANAGEMENT SUMMARY */}
            <div className={`${orientation === "portrait" ? "col-span-6" : "col-span-3"} border border-slate-900 flex flex-col`}>
              <div className="bg-[#002060] text-white px-1.5 py-0.5 font-black text-[8.5px] uppercase tracking-wider truncate">
                13. RINGKASAN MANAJEMEN
              </div>
              <div className="p-1.5 space-y-1.5 text-[7.5px] bg-slate-50/50 flex-1 flex flex-col justify-start">
                <div>
                  <strong className="text-slate-900">Pencapaian Utama : </strong>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={customManagement.pencapaian}
                      onChange={(e) => setCustomManagement({ ...customManagement, pencapaian: e.target.value })}
                      className="w-full px-1 py-0.5 text-[7.5px] border border-amber-300 rounded bg-amber-50"
                    />
                  ) : (
                    <span className="text-slate-700">{customManagement.pencapaian}</span>
                  )}
                </div>
                <div>
                  <strong className="text-slate-900">Recovery Action : </strong>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={customManagement.recoveryAction}
                      onChange={(e) => setCustomManagement({ ...customManagement, recoveryAction: e.target.value })}
                      className="w-full px-1 py-0.5 text-[7.5px] border border-amber-300 rounded bg-amber-50"
                    />
                  ) : (
                    <span className="text-slate-700">{customManagement.recoveryAction}</span>
                  )}
                </div>
                <div>
                  <strong className="text-slate-900">Rencana Bulan Depan : </strong>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={customManagement.rencanaBulanDepan}
                      onChange={(e) => setCustomManagement({ ...customManagement, rencanaBulanDepan: e.target.value })}
                      className="w-full px-1 py-0.5 text-[7.5px] border border-amber-300 rounded bg-amber-50"
                    />
                  ) : (
                    <span className="text-slate-700">{customManagement.rencanaBulanDepan}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              ROW 6: 14. APPROVAL (Official 3-Party Signatures & Notes)
             ======================================================== */}
          <div className="border border-slate-900 flex items-stretch mb-1">
            {/* Vertical Blue Ribbon */}
            <div className="w-7 bg-[#002060] text-white flex items-center justify-center font-black text-[9px] uppercase tracking-widest writing-vertical select-none border-r border-slate-900 py-2 shrink-0">
              <span className="rotate-180" style={{ writingMode: "vertical-rl" }}>
                14. PENGESAHAN (APPROVAL)
              </span>
            </div>

            {/* 3 Column Signature Blocks + Notes */}
            <div className="flex-1 grid grid-cols-12 gap-2 p-2 bg-white">
              {/* Kolom 1: Kontraktor */}
              <div className={`${orientation === "portrait" ? "col-span-4" : "col-span-3"} border border-slate-300 p-1.5 flex flex-col justify-between h-24 bg-slate-50/30 text-[8px]`}>
                <div>
                  <p className="font-bold text-slate-800 text-center uppercase border-b border-slate-200 pb-0.5 truncate">
                    DISUSUN : KONTRAKTOR
                  </p>
                  <div className="mt-1 space-y-0.5">
                    <div className="flex justify-between"><span className="text-slate-500">Nama</span><span className="font-semibold text-slate-900 truncate max-w-[90px]">{data?.site_manager || "Ir. Hendra Gunawan"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Jabatan</span><span className="text-slate-800">Site Manager</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tanggal</span><span className="font-mono text-slate-800">30/08/2026</span></div>
                  </div>
                </div>
                <div className="border border-dashed border-slate-400 py-1 text-center text-[7px] text-slate-400 font-mono">
                  TTD &amp; Cap Basah
                </div>
              </div>

              {/* Kolom 2: Konsultan Pengawas */}
              <div className={`${orientation === "portrait" ? "col-span-4" : "col-span-3"} border border-slate-300 p-1.5 flex flex-col justify-between h-24 bg-slate-50/30 text-[8px]`}>
                <div>
                  <p className="font-bold text-slate-800 text-center uppercase border-b border-slate-200 pb-0.5 truncate">
                    DIPERIKSA : PENGAWAS
                  </p>
                  <div className="mt-1 space-y-0.5">
                    <div className="flex justify-between"><span className="text-slate-500">Nama</span><span className="font-semibold text-slate-900 truncate max-w-[90px]">Ir. Bambang Setyadi</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Jabatan</span><span className="text-slate-800">Team Leader</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tanggal</span><span className="font-mono text-slate-800">30/08/2026</span></div>
                  </div>
                </div>
                <div className="border border-dashed border-slate-400 py-1 text-center text-[7px] text-slate-400 font-mono">
                  TTD &amp; Cap Basah
                </div>
              </div>

              {/* Kolom 3: PPK */}
              <div className={`${orientation === "portrait" ? "col-span-4" : "col-span-3"} border border-slate-300 p-1.5 flex flex-col justify-between h-24 bg-slate-50/30 text-[8px]`}>
                <div>
                  <p className="font-bold text-slate-800 text-center uppercase border-b border-slate-200 pb-0.5 truncate">
                    DIKETAHUI : PPK
                  </p>
                  <div className="mt-1 space-y-0.5">
                    <div className="flex justify-between"><span className="text-slate-500">Nama</span><span className="font-semibold text-slate-900 truncate max-w-[90px]">{data?.wakil_ppk || "Muhammad Iqbal"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Jabatan</span><span className="text-slate-800">Wakil PPK</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tanggal</span><span className="font-mono text-slate-800">30/08/2026</span></div>
                  </div>
                </div>
                <div className="border border-dashed border-slate-400 py-1 text-center text-[7px] text-slate-400 font-mono">
                  TTD &amp; Cap Basah
                </div>
              </div>

              {/* Catatan Box */}
              <div className={`${orientation === "portrait" ? "col-span-12" : "col-span-3"} border border-slate-300 p-1.5 bg-slate-50/80 text-[7px] leading-tight flex flex-col justify-between`}>
                <div>
                  <strong className="text-slate-900 font-bold block uppercase border-b border-slate-200 pb-0.5 text-[7.5px]">
                    CATATAN RESMI :
                  </strong>
                  <ol className="list-decimal pl-3 text-slate-600 mt-1 space-y-0.5">
                    <li>Semua data harus didukung evidence.</li>
                    <li>Format pengendalian internal.</li>
                    <li>Gunakan status RAG.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              BOTTOM FOOTER STRIP (Official Motto & Version)
             ======================================================== */}
          <div className="border-t border-slate-300 pt-1 flex items-center justify-between text-[7px] font-mono text-slate-500">
            <span className="font-bold text-slate-800">KNMP - KAMPUNG NELAYAN MERAH PUTIH</span>
            <span className="font-black text-[#002060]">WILAYAH SUMATERA</span>
            <span className="italic text-slate-400 hidden sm:inline">NO EVIDENCE = NO PROGRESS | NO VERIFICATION = NO ACCEPTANCE | NO CLOSURE = ISSUE REMAINS OPEN</span>
            <span className="font-bold text-slate-700">VERSION 1.0</span>
          </div>

        </div>
      </div>
    </div>
  );
};
