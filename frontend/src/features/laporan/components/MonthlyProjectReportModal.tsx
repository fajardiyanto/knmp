import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Printer,
  Download,
  X,
  RefreshCw,
  Edit3,
  Check,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  HardHat,
  FileSpreadsheet,
  Layers,
} from "lucide-react";
import { fetchMonthlyProjectReport } from "../api";
import { apiFetch } from "../../../lib/api-client";
import { MonthlyProjectReportData } from "../types";

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
  const [selectedKnmpId, setSelectedKnmpId] = useState<number>(initialKnmpId || 1);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // Default Agustus
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Custom editable state
  const [customHighlights, setCustomHighlights] = useState({
    capaian: "Penyelesaian struktur dasar, mobilisasi material utama on track, dan koordinasi lapangan dengan stakeholder nelayan berjalan kondusif.",
    masalah: "Kondisi cuaca pasang laut tinggi pada minggu ke-2 dan kendala pengiriman logistik material beton precast dari dermaga utama.",
    tindakLanjut: "Penambahan jam kerja (lembur) saat cuaca surut serta percepatan pengadaan material lokal sesuai spesifikasi teknis.",
  });

  const [customManagement, setCustomManagement] = useState({
    pencapaian: "Progress fisik mencapai deviasi positif dan pelaksanaan pekerjaan utama sesuai dengan kurva-S rencana.",
    deviasiPenyebab: "Deviasi minor pada pekerjaan persiapan akibat penyesuaian tata letak fasilitas tambat labuh nelayan.",
    recoveryAction: "Pengerahan tim tambahan untuk pekerjaan pembesian dan pengecoran plat lantai.",
    dukungan: "Persetujuan shop drawing dermaga dan permohonan penerbitan berita acara verifikasi lapangan.",
    rencanaBulanDepan: "Penyelesaian 100% struktur atas, instalasi MEP dermaga, dan persiapan uji fungsi (commissioning test).",
  });

  // Fetch list of all KNMPs for the selector
  const { data: knmpsData } = useQuery<KnmpOption[]>({
    queryKey: ["knmp-list-report"],
    queryFn: () => apiFetch<KnmpOption[]>("/api/v1/knmp"),
    enabled: isOpen,
  });

  // Fetch Monthly Report Data for the selected KNMP & Period
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery<MonthlyProjectReportData>({
    queryKey: ["monthly-project-report", selectedKnmpId, selectedMonth, selectedYear],
    queryFn: () => fetchMonthlyProjectReport(selectedKnmpId, selectedMonth, selectedYear),
    enabled: isOpen && !!selectedKnmpId,
  });

  useEffect(() => {
    if (initialKnmpId) {
      setSelectedKnmpId(initialKnmpId);
    } else if (knmpsData && knmpsData.length > 0 && !selectedKnmpId) {
      setSelectedKnmpId(knmpsData[0].id);
    }
  }, [initialKnmpId, knmpsData]);

  if (!isOpen) return null;

  const data = reportData;

  const handlePrint = () => {
    window.print();
  };

  const getRAGBadge = (status?: string) => {
    const s = (status || "GREEN").toUpperCase();
    if (s === "GREEN" || s === "NORMAL") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> NORMAL
        </span>
      );
    }
    if (s === "YELLOW" || s === "PERHATIAN") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> PERHATIAN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> KRITIS
      </span>
    );
  };

  const getRAGDot = (status: string) => {
    const s = status.toUpperCase();
    if (s === "GREEN") return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs"></span>;
    if (s === "YELLOW") return <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs"></span>;
    if (s === "RED") return <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-xs"></span>;
    return <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>;
  };

  // Generate SVG S-Curve Path Points
  const sCurvePlanPoints = [
    { x: 30, y: 140 },
    { x: 75, y: 130 },
    { x: 120, y: 115 },
    { x: 165, y: 95 },
    { x: 210, y: 75 },
    { x: 255, y: 55 },
    { x: 300, y: 40 },
    { x: 345, y: 30 },
    { x: 390, y: 22 },
    { x: 435, y: 15 },
    { x: 480, y: 10 },
    { x: 520, y: 8 },
  ];

  const sCurveActualPoints = [
    { x: 30, y: 145 },
    { x: 75, y: 135 },
    { x: 120, y: 118 },
    { x: 165, y: 100 },
    { x: 210, y: 82 },
    { x: 255, y: 68 },
    { x: 300, y: 58 },
    { x: 345, y: 50 },
  ];

  const sCurveForecastPoints = [
    { x: 345, y: 50 },
    { x: 390, y: 42 },
    { x: 435, y: 35 },
    { x: 480, y: 28 },
    { x: 520, y: 24 },
  ];

  const formatRupiah = (val?: number) => {
    if (!val) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-900/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      {/* 1. Header Toolbar (Hidden during Print) */}
      <div className="print:hidden bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 text-white shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-xs">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Monthly Project Report Generator
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-[10px] uppercase font-bold tracking-wider">
                Kontraktor
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Format Laporan Bulanan Resmi KNMP Wilayah Sumatera (Sesuai Template BUMN / Pertamina)
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Select KNMP */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedKnmpId}
              onChange={(e) => setSelectedKnmpId(Number(e.target.value))}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-2 max-w-[200px] truncate"
            >
              {knmpsData?.map((k) => (
                <option key={k.id} value={k.id} className="bg-slate-900 text-white">
                  {k.name} {k.province_name ? `(${k.province_name})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Select Month & Year */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Edit Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              isEditMode
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700"
            }`}
            title="Kustomisasi Teks Catatan"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditMode ? "Selesai Edit" : "Edit Teks"}
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {/* Print / Export PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak / PDF
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Main Printable Report Document Body */}
      <div className="flex-1 overflow-y-auto bg-slate-200 dark:bg-slate-950 p-4 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
        <div
          id="monthly-report-document"
          className="max-w-[1400px] mx-auto bg-white text-slate-900 shadow-2xl rounded-xl print:rounded-none print:shadow-none p-6 sm:p-8 font-sans border border-slate-300 print:border-none print:w-full print:max-w-none text-[11px] leading-tight space-y-4"
        >
          {/* ======================================================== */}
          {/* HEADER SECTION                                           */}
          {/* ======================================================== */}
          <div className="flex items-start justify-between border-b-2 border-[#1e3a8a] pb-3 gap-4">
            {/* Logo & Sub-header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center text-white font-black text-xs shadow-md border border-blue-400/30 shrink-0">
                KNMP
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[15px] tracking-tight text-[#1e3a8a]">KNMP</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-600 text-white rounded-xs">
                    KAMPUNG NELAYAN MERAH PUTIH
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-700 tracking-wider">
                  WILAYAH SUMATERA
                </p>
              </div>
            </div>

            {/* Title Center */}
            <div className="text-center flex-1 px-4">
              <h1 className="text-[18px] font-black text-[#1e3a8a] tracking-wide uppercase">
                MONTHLY PROJECT REPORT
              </h1>
              <p className="text-[13px] font-extrabold text-rose-600 uppercase tracking-wider">
                KONTRAKTOR PELAKSANA
              </p>
              <p className="text-[10px] font-semibold text-slate-600 uppercase">
                KAMPUNG NELAYAN MERAH PUTIH (KNMP) — WILAYAH SUMATERA
              </p>
            </div>

            {/* Right Meta & RAG Status */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Document Number & Period */}
              <div className="border border-slate-400 rounded-lg p-2 bg-slate-50/80 text-[10px] space-y-1 min-w-[170px]">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-center">
                  MONTHLY REPORT
                </div>
                <div className="text-slate-600 font-mono text-[9.5px]">
                  MR-KNMP-SUM-{data?.knmp_id || "001"}-{selectedYear}
                </div>
                <div className="font-semibold text-slate-800">
                  PERIODE: <span className="font-bold">{data?.month_name || "Agustus"} {selectedYear}</span>
                </div>
              </div>

              {/* RAG Legend */}
              <div className="border border-slate-400 rounded-lg p-2 bg-slate-50/80 text-[9.5px] space-y-1">
                <div className="font-bold text-slate-900 text-center border-b border-slate-200 pb-0.5">
                  STATUS (RAG)
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> GREEN : Sesuai Rencana
                </div>
                <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> YELLOW : Perlu Perhatian
                </div>
                <div className="flex items-center gap-1.5 text-rose-800 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> RED : Perlu Tindakan Segera
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 1. IDENTITAS PROYEK                                       */}
          {/* ======================================================== */}
          <div className="border border-[#1e3a8a] rounded-lg overflow-hidden">
            <div className="bg-[#1e3a8a] text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wide">
              1. IDENTITAS PROYEK
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-300 bg-slate-50/40 p-2.5 text-[10.5px]">
              {/* Col 1 */}
              <div className="space-y-1 pr-3">
                <div className="flex justify-between"><span className="text-slate-500">Paket Pekerjaan:</span> <span className="font-bold text-slate-900 text-right">{data?.knmp_name || "Pembangunan KNMP"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Lokasi:</span> <span className="font-semibold text-slate-800 text-right">{data?.district_name || data?.sub_district_name}, {data?.regency_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Nomor Kontrak:</span> <span className="font-semibold text-slate-800 font-mono text-[9.5px] text-right">{data?.nomor_kontrak || "SP/KNMP-SUM/01/2026"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">SPMK:</span> <span className="font-semibold text-slate-800 font-mono text-[9.5px] text-right">{data?.spmk || "SPMK/KNMP-SUM/01/2026"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Nilai Kontrak:</span> <span className="font-bold text-blue-900 text-right">{formatRupiah(data?.nilai_kontrak)}</span></div>
              </div>

              {/* Col 2 */}
              <div className="space-y-1 px-3">
                <div className="flex justify-between"><span className="text-slate-500">Tanggal Kontrak:</span> <span className="font-semibold text-slate-800">{data?.tanggal_kontrak || "15 Mei 2026"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Tanggal Mulai:</span> <span className="font-semibold text-slate-800">{data?.tanggal_mulai || "01 Juni 2026"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Masa Pelaksanaan:</span> <span className="font-bold text-slate-900">{data?.masa_pelaksanaan || 120} Hari Kalender</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Tgl. Selesai (Kontrak):</span> <span className="font-semibold text-slate-800">{data?.tanggal_selesai || "30 September 2026"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Tgl. Selesai (Revisi):</span> <span className="font-semibold text-slate-500">-</span></div>
              </div>

              {/* Col 3 */}
              <div className="space-y-1 pl-3">
                <div className="flex justify-between"><span className="text-slate-500">Kontraktor:</span> <span className="font-bold text-slate-900 text-right">{data?.kontraktor_name || "PT. Mina Bahari Nusantara"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Konsultan / Pengawas:</span> <span className="font-semibold text-slate-800 text-right">{data?.konsultan_pengawas || "Konsultan Supervisi Wilayah"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Wakil Pimpro / PPK:</span> <span className="font-semibold text-slate-800 text-right">{data?.wakil_ppk || "Muhammad Iqbal S.Pi, M.Si"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Site Manager:</span> <span className="font-semibold text-slate-800 text-right">{data?.site_manager || "Ir. Hendra Gunawan"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Periode Laporan:</span> <span className="font-bold text-blue-900 text-right">01 s.d 31 {data?.month_name} {selectedYear}</span></div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. EXECUTIVE SUMMARY & 3. TIME VS PROGRESS (S-CURVE)      */}
          {/* ======================================================== */}
          <div className="grid grid-cols-12 gap-3.5">
            {/* 2. Executive Summary Left (7 cols) */}
            <div className="col-span-7 border border-[#1e3a8a] rounded-lg overflow-hidden flex flex-col justify-between">
              <div className="bg-[#1e3a8a] text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wide">
                2. EXECUTIVE SUMMARY
              </div>
              <div className="p-2.5 space-y-2.5 flex-1 flex flex-col justify-between">
                {/* Overall Status Badge */}
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">OVERALL PROJECT STATUS:</span>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Progres dan parameter utama secara keseluruhan sesuai rencana.
                    </p>
                  </div>
                  <div className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-black text-xs tracking-wider flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> NORMAL
                  </div>
                </div>

                {/* Table Parameters */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] border border-slate-300">
                    <thead className="bg-[#1e3a8a]/10 text-[#1e3a8a] font-bold uppercase">
                      <tr className="border-b border-slate-300">
                        <th className="p-1.5">PARAMETER</th>
                        <th className="p-1.5 text-center">PLAN (%)</th>
                        <th className="p-1.5 text-center">ACTUAL (%)</th>
                        <th className="p-1.5 text-center">DEVIASI (%)</th>
                        <th className="p-1.5 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-1.5 font-semibold text-slate-800">Progress Fisik</td>
                        <td className="p-1.5 text-center font-mono">{(data?.progress_plan || 35.0).toFixed(1)}%</td>
                        <td className="p-1.5 text-center font-bold text-blue-700 font-mono">{(data?.progress_actual || 38.5).toFixed(1)}%</td>
                        <td className="p-1.5 text-center font-bold text-emerald-600 font-mono">+{(data?.progress_deviasi || 3.5).toFixed(1)}%</td>
                        <td className="p-1.5 text-center">{getRAGDot("GREEN")}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-semibold text-slate-800">Waktu (Time Elapsed)</td>
                        <td className="p-1.5 text-center font-mono">50.0%</td>
                        <td className="p-1.5 text-center font-mono">50.0%</td>
                        <td className="p-1.5 text-center font-mono">0.0%</td>
                        <td className="p-1.5 text-center">{getRAGDot("GREEN")}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-semibold text-slate-800">Keuangan (Financial)</td>
                        <td className="p-1.5 text-center font-mono">25.0%</td>
                        <td className="p-1.5 text-center font-mono">25.0%</td>
                        <td className="p-1.5 text-center font-mono">0.0%</td>
                        <td className="p-1.5 text-center">{getRAGDot("GREEN")}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-semibold text-slate-800">Mutu (Quality)</td>
                        <td className="p-1.5 text-center font-mono">100%</td>
                        <td className="p-1.5 text-center font-mono">100%</td>
                        <td className="p-1.5 text-center font-mono">0.0%</td>
                        <td className="p-1.5 text-center">{getRAGDot("GREEN")}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-semibold text-slate-800">K3 / HSE</td>
                        <td className="p-1.5 text-center font-mono">100%</td>
                        <td className="p-1.5 text-center font-mono">100%</td>
                        <td className="p-1.5 text-center font-mono">0 LTI</td>
                        <td className="p-1.5 text-center">{getRAGDot("GREEN")}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-semibold text-slate-800">Material & Logistik</td>
                        <td className="p-1.5 text-center font-mono">90%</td>
                        <td className="p-1.5 text-center font-mono">88%</td>
                        <td className="p-1.5 text-center font-mono">-2%</td>
                        <td className="p-1.5 text-center">{getRAGDot("GREEN")}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-semibold text-slate-800">Dokumen & Approval</td>
                        <td className="p-1.5 text-center font-mono">100%</td>
                        <td className="p-1.5 text-center font-mono">95%</td>
                        <td className="p-1.5 text-center font-mono">-5%</td>
                        <td className="p-1.5 text-center">{getRAGDot("GREEN")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Highlight Section */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[9.5px] space-y-1">
                  <div className="font-bold text-[#1e3a8a] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" /> HIGHLIGHT BULAN INI:
                  </div>
                  {isEditMode ? (
                    <div className="space-y-1">
                      <textarea
                        value={customHighlights.capaian}
                        onChange={(e) => setCustomHighlights({ ...customHighlights, capaian: e.target.value })}
                        className="w-full text-[9px] p-1 border rounded"
                        rows={2}
                      />
                      <textarea
                        value={customHighlights.masalah}
                        onChange={(e) => setCustomHighlights({ ...customHighlights, masalah: e.target.value })}
                        className="w-full text-[9px] p-1 border rounded"
                        rows={2}
                      />
                    </div>
                  ) : (
                    <div className="space-y-0.5 text-slate-700">
                      <p><span className="font-bold text-slate-900">• Capaian Utama:</span> {customHighlights.capaian}</p>
                      <p><span className="font-bold text-slate-900">• Permasalahan Kritis:</span> {customHighlights.masalah}</p>
                      <p><span className="font-bold text-slate-900">• Tindak Lanjut:</span> {customHighlights.tindakLanjut}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Time Vs Progress (S-Curve) Right (5 cols) */}
            <div className="col-span-5 border border-[#1e3a8a] rounded-lg overflow-hidden flex flex-col justify-between">
              <div className="bg-[#1e3a8a] text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wide">
                3. TIME VS PROGRESS (S-CURVE)
              </div>
              <div className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                {/* SVG S-Curve Chart */}
                <div className="bg-white border border-slate-300 rounded-lg p-2 relative">
                  <div className="text-[9.5px] font-bold text-center text-slate-700 mb-1">
                    TIME ELAPSED VS PROGRESS (S-CURVE)
                  </div>
                  <svg viewBox="0 0 540 160" className="w-full h-28 overflow-visible">
                    {/* Grid Lines */}
                    <line x1="30" y1="10" x2="520" y2="10" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="30" y1="45" x2="520" y2="45" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="30" y1="80" x2="520" y2="80" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="30" y1="115" x2="520" y2="115" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="30" y1="145" x2="520" y2="145" stroke="#94a3b8" />

                    {/* Y-Axis Labels */}
                    <text x="5" y="15" fontSize="8" fill="#64748b">100%</text>
                    <text x="10" y="50" fontSize="8" fill="#64748b">75%</text>
                    <text x="10" y="85" fontSize="8" fill="#64748b">50%</text>
                    <text x="10" y="120" fontSize="8" fill="#64748b">25%</text>
                    <text x="15" y="148" fontSize="8" fill="#64748b">0%</text>

                    {/* X-Axis Labels (Months 1..12) */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m, i) => (
                      <text key={m} x={30 + i * 44} y="156" fontSize="7.5" fill="#64748b" textAnchor="middle">
                        {m}
                      </text>
                    ))}

                    {/* Plan Curve (Blue) */}
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      points={sCurvePlanPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                    />
                    {sCurvePlanPoints.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="2" fill="#2563eb" />
                    ))}

                    {/* Actual Curve (Green) */}
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      points={sCurveActualPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                    />
                    {sCurveActualPoints.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#10b981" />
                    ))}

                    {/* Forecast Curve (Orange Dashed) */}
                    <polyline
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      points={sCurveForecastPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                    />
                  </svg>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 mt-1 text-[8.5px] font-bold">
                    <span className="flex items-center gap-1 text-blue-600">
                      <span className="w-2.5 h-0.5 bg-blue-600 inline-block"></span> PLAN
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <span className="w-2.5 h-0.5 bg-emerald-600 inline-block"></span> ACTUAL
                    </span>
                    <span className="flex items-center gap-1 text-orange-500">
                      <span className="w-2.5 h-0.5 border-t border-dashed border-orange-500 inline-block"></span> FORECAST
                    </span>
                  </div>
                </div>

                {/* S-Curve Summary Box */}
                <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 text-[10px] space-y-1">
                  <div className="font-bold text-[#1e3a8a] border-b border-slate-200 pb-0.5">
                    RINGKASAN S-CURVE
                  </div>
                  <div className="flex justify-between"><span className="text-slate-500">Time Elapsed:</span> <span className="font-bold">50.0%</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Progress Plan:</span> <span className="font-bold font-mono">{(data?.progress_plan || 35.0).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Progress Actual:</span> <span className="font-bold text-emerald-700 font-mono">{(data?.progress_actual || 38.5).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Deviasi:</span> <span className="font-bold text-emerald-700 font-mono">+{(data?.progress_deviasi || 3.5).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Forecast at Completion:</span> <span className="font-bold text-blue-900">100% (On-Time)</span></div>
                  <div className="flex justify-between items-center pt-0.5 border-t border-slate-200">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> NORMAL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 4. PROGRESS FISIK PEKERJAAN & 5. MILESTONE CONTROL        */}
          {/* ======================================================== */}
          <div className="grid grid-cols-12 gap-3.5">
            {/* 4. Progress Fisik (7 cols) */}
            <div className="col-span-7 border border-[#1e3a8a] rounded-lg overflow-hidden">
              <div className="bg-[#1e3a8a] text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wide">
                4. PROGRESS FISIK PEKERJAAN (BOBOT PEKERJAAN)
              </div>
              <div className="p-2 overflow-x-auto">
                <table className="w-full text-left text-[9.5px] border border-slate-300">
                  <thead className="bg-[#1e3a8a]/10 text-[#1e3a8a] font-bold text-center">
                    <tr className="border-b border-slate-300">
                      <th className="p-1" rowSpan={2}>NO</th>
                      <th className="p-1 text-left" rowSpan={2}>WORK PACKAGE / KEGIATAN</th>
                      <th className="p-1" rowSpan={2}>BOBOT (%)</th>
                      <th className="p-1 border-x border-slate-300">S.D BULAN LALU</th>
                      <th className="p-1 border-r border-slate-300" colSpan={2}>BULAN INI</th>
                      <th className="p-1 border-r border-slate-300" colSpan={2}>KUMULATIF S.D BULAN INI</th>
                      <th className="p-1" rowSpan={2}>DEVIASI (%)</th>
                      <th className="p-1" rowSpan={2}>STATUS</th>
                    </tr>
                    <tr className="border-b border-slate-300 text-[8.5px]">
                      <th className="p-0.5 border-x border-slate-300">ACTUAL (%)</th>
                      <th className="p-0.5">PLAN (%)</th>
                      <th className="p-0.5 border-r border-slate-300">ACTUAL (%)</th>
                      <th className="p-0.5">PLAN (%)</th>
                      <th className="p-0.5 border-r border-slate-300">ACTUAL (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data?.work_packages?.map((wp) => (
                      <tr key={wp.no} className="hover:bg-slate-50">
                        <td className="p-1 text-center font-bold text-slate-500">{wp.no}</td>
                        <td className="p-1 font-semibold text-slate-800">{wp.name}</td>
                        <td className="p-1 text-center font-mono">{wp.bobot.toFixed(1)}%</td>
                        <td className="p-1 text-center font-mono border-x border-slate-200">{wp.lalu_actual.toFixed(1)}%</td>
                        <td className="p-1 text-center font-mono">{wp.bulan_ini_plan.toFixed(1)}%</td>
                        <td className="p-1 text-center font-mono font-bold text-blue-700 border-r border-slate-200">{wp.bulan_ini_actual.toFixed(1)}%</td>
                        <td className="p-1 text-center font-mono">{wp.kumulatif_plan.toFixed(1)}%</td>
                        <td className="p-1 text-center font-mono font-bold text-emerald-700 border-r border-slate-200">{wp.kumulatif_actual.toFixed(1)}%</td>
                        <td className="p-1 text-center font-mono font-bold text-emerald-600">
                          {wp.deviasi >= 0 ? `+${wp.deviasi.toFixed(1)}` : wp.deviasi.toFixed(1)}%
                        </td>
                        <td className="p-1 text-center">{getRAGDot(wp.status)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={2} className="p-1 text-center">TOTAL</td>
                      <td className="p-1 text-center font-mono">100.0%</td>
                      <td className="p-1 text-center font-mono border-x border-slate-300">0.0%</td>
                      <td className="p-1 text-center font-mono">{(data?.progress_plan || 35.0).toFixed(1)}%</td>
                      <td className="p-1 text-center font-mono text-blue-700 border-r border-slate-300">{(data?.progress_actual || 38.5).toFixed(1)}%</td>
                      <td className="p-1 text-center font-mono">{(data?.progress_plan || 35.0).toFixed(1)}%</td>
                      <td className="p-1 text-center font-mono text-emerald-700 border-r border-slate-300">{(data?.progress_actual || 38.5).toFixed(1)}%</td>
                      <td className="p-1 text-center font-mono text-emerald-600">+{(data?.progress_deviasi || 3.5).toFixed(1)}%</td>
                      <td className="p-1 text-center">{getRAGDot("GREEN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Milestone Control (5 cols) */}
            <div className="col-span-5 border border-[#1e3a8a] rounded-lg overflow-hidden">
              <div className="bg-[#1e3a8a] text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wide">
                5. MILESTONE CONTROL
              </div>
              <div className="p-2 overflow-x-auto">
                <table className="w-full text-left text-[9.5px] border border-slate-300">
                  <thead className="bg-[#1e3a8a]/10 text-[#1e3a8a] font-bold text-center uppercase">
                    <tr className="border-b border-slate-300">
                      <th className="p-1 text-left">MILESTONE</th>
                      <th className="p-1">PLAN DATE</th>
                      <th className="p-1">ACTUAL / FORECAST</th>
                      <th className="p-1">DEVIASI (HARI)</th>
                      <th className="p-1">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data?.milestones?.map((m) => (
                      <tr key={m.no} className="hover:bg-slate-50">
                        <td className="p-1 font-semibold text-slate-800">{m.name}</td>
                        <td className="p-1 text-center font-mono">{m.plan_date}</td>
                        <td className="p-1 text-center font-mono font-bold text-slate-700">{m.actual_date}</td>
                        <td className="p-1 text-center font-mono">{m.deviasi_hari}</td>
                        <td className="p-1 text-center">{getRAGDot(m.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 6. QUALITY, 7. HSE, 8. MATERIAL, 9. DOCUMENTS TRACKER    */}
          {/* ======================================================== */}
          <div className="grid grid-cols-4 gap-3">
            {/* 6. Quality Performance */}
            <div className="border border-[#1e3a8a] rounded-lg overflow-hidden text-[9.5px]">
              <div className="bg-[#1e3a8a] text-white px-2 py-0.8 font-bold uppercase text-[10px]">
                6. QUALITY PERFORMANCE
              </div>
              <div className="p-1.5">
                <table className="w-full text-left border border-slate-200">
                  <thead className="bg-slate-100 font-bold text-[8.5px]">
                    <tr className="border-b border-slate-200">
                      <th className="p-1">PARAMETER</th>
                      <th className="p-0.5 text-center">OPEN</th>
                      <th className="p-0.5 text-center">CLOSED</th>
                      <th className="p-0.5 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1 font-semibold">Inspection / Test</td><td className="p-0.5 text-center">2</td><td className="p-0.5 text-center">14</td><td className="p-0.5 text-center">{getRAGDot("GREEN")}</td></tr>
                    <tr><td className="p-1 font-semibold">NCR (Non Conformance)</td><td className="p-0.5 text-center">0</td><td className="p-0.5 text-center">1</td><td className="p-0.5 text-center">{getRAGDot("GREEN")}</td></tr>
                    <tr><td className="p-1 font-semibold">Defect / Punch List</td><td className="p-0.5 text-center">1</td><td className="p-0.5 text-center">5</td><td className="p-0.5 text-center">{getRAGDot("YELLOW")}</td></tr>
                    <tr><td className="p-1 font-semibold">Corrective Action</td><td className="p-0.5 text-center">0</td><td className="p-0.5 text-center">3</td><td className="p-0.5 text-center">{getRAGDot("GREEN")}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 7. K3 / HSE Performance */}
            <div className="border border-[#1e3a8a] rounded-lg overflow-hidden text-[9.5px]">
              <div className="bg-[#1e3a8a] text-white px-2 py-0.8 font-bold uppercase text-[10px]">
                7. K3 / HSE PERFORMANCE
              </div>
              <div className="p-1.5">
                <table className="w-full text-left border border-slate-200">
                  <thead className="bg-slate-100 font-bold text-[8.5px]">
                    <tr className="border-b border-slate-200">
                      <th className="p-1">PARAMETER</th>
                      <th className="p-0.5 text-center">BULAN INI</th>
                      <th className="p-0.5 text-center">KUMULATIF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1 font-semibold">Manhours (Jam Orang)</td><td className="p-0.5 text-center font-mono">1.240</td><td className="p-0.5 text-center font-mono">3.680</td></tr>
                    <tr><td className="p-1 font-semibold">Accident (Kecelakaan)</td><td className="p-0.5 text-center font-mono text-emerald-600 font-bold">0</td><td className="p-0.5 text-center font-mono">0</td></tr>
                    <tr><td className="p-1 font-semibold">Near Miss</td><td className="p-0.5 text-center font-mono">0</td><td className="p-0.5 text-center font-mono">1</td></tr>
                    <tr><td className="p-1 font-semibold">Toolbox Meeting</td><td className="p-0.5 text-center font-mono">24x</td><td className="p-0.5 text-center font-mono">68x</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 8. Material & Procurement Status */}
            <div className="border border-[#1e3a8a] rounded-lg overflow-hidden text-[9.5px]">
              <div className="bg-[#1e3a8a] text-white px-2 py-0.8 font-bold uppercase text-[10px]">
                8. MATERIAL & PROCUREMENT
              </div>
              <div className="p-1.5">
                <table className="w-full text-left border border-slate-200">
                  <thead className="bg-slate-100 font-bold text-[8.5px]">
                    <tr className="border-b border-slate-200">
                      <th className="p-1">MATERIAL UTAMA</th>
                      <th className="p-0.5 text-center">PLAN</th>
                      <th className="p-0.5 text-center">ACTUAL</th>
                      <th className="p-0.5 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1 font-semibold">Semen & Pasir Pasang</td><td className="p-0.5 text-center">100%</td><td className="p-0.5 text-center">100%</td><td className="p-0.5 text-center">{getRAGDot("GREEN")}</td></tr>
                    <tr><td className="p-1 font-semibold">Besi Tulangan Ulir</td><td className="p-0.5 text-center">100%</td><td className="p-0.5 text-center">95%</td><td className="p-0.5 text-center">{getRAGDot("GREEN")}</td></tr>
                    <tr><td className="p-1 font-semibold">Beton Ready-Mix K-300</td><td className="p-0.5 text-center">80%</td><td className="p-0.5 text-center">75%</td><td className="p-0.5 text-center">{getRAGDot("YELLOW")}</td></tr>
                    <tr><td className="p-1 font-semibold">Bollard & Fender Dermaga</td><td className="p-0.5 text-center">50%</td><td className="p-0.5 text-center">50%</td><td className="p-0.5 text-center">{getRAGDot("GREEN")}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 9. Document & Approval Tracker */}
            <div className="border border-[#1e3a8a] rounded-lg overflow-hidden text-[9.5px]">
              <div className="bg-[#1e3a8a] text-white px-2 py-0.8 font-bold uppercase text-[10px]">
                9. DOKUMEN & APPROVAL TRACKER
              </div>
              <div className="p-1.5">
                <table className="w-full text-left border border-slate-200">
                  <thead className="bg-slate-100 font-bold text-[8.5px]">
                    <tr className="border-b border-slate-200">
                      <th className="p-1">DOKUMEN</th>
                      <th className="p-0.5 text-center">REQ</th>
                      <th className="p-0.5 text-center">APP</th>
                      <th className="p-0.5 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1 font-semibold">Shop Drawing</td><td className="p-0.5 text-center">18</td><td className="p-0.5 text-center font-bold text-emerald-700">17</td><td className="p-0.5 text-center">{getRAGDot("GREEN")}</td></tr>
                    <tr><td className="p-1 font-semibold">Material Approval</td><td className="p-0.5 text-center">12</td><td className="p-0.5 text-center font-bold text-emerald-700">12</td><td className="p-0.5 text-center">{getRAGDot("GREEN")}</td></tr>
                    <tr><td className="p-1 font-semibold">Method Statement</td><td className="p-0.5 text-center">6</td><td className="p-0.5 text-center font-bold text-emerald-700">6</td><td className="p-0.5 text-center">{getRAGDot("GREEN")}</td></tr>
                    <tr><td className="p-1 font-semibold">Inspection / Test Report</td><td className="p-0.5 text-center">20</td><td className="p-0.5 text-center font-bold text-emerald-700">19</td><td className="p-0.5 text-center">{getRAGDot("GREEN")}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 10. ISSUE REGISTER & 11. FINANCIAL STATUS                 */}
          {/* ======================================================== */}
          <div className="grid grid-cols-12 gap-3.5">
            {/* 10. Issue / Risk Register (7 cols) */}
            <div className="col-span-7 border border-[#1e3a8a] rounded-lg overflow-hidden">
              <div className="bg-[#1e3a8a] text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wide">
                10. ISSUE / RISK REGISTER (TOP ISSUE)
              </div>
              <div className="p-2 overflow-x-auto">
                <table className="w-full text-left text-[9.5px] border border-slate-300">
                  <thead className="bg-[#1e3a8a]/10 text-[#1e3a8a] font-bold uppercase">
                    <tr className="border-b border-slate-300">
                      <th className="p-1 text-center">ID</th>
                      <th className="p-1">ISSUE / RISK</th>
                      <th className="p-1 text-center">LEVEL</th>
                      <th className="p-1">MITIGASI / ACTION</th>
                      <th className="p-1">PIC</th>
                      <th className="p-1 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data?.issues && data.issues.length > 0 ? (
                      data.issues.map((iss, i) => (
                        <tr key={iss.id || i}>
                          <td className="p-1 text-center font-mono font-bold text-slate-500">#{iss.id}</td>
                          <td className="p-1 font-semibold text-slate-800">{iss.judul}</td>
                          <td className="p-1 text-center">
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-amber-100 text-amber-800">
                              {iss.tingkat || "M"}
                            </span>
                          </td>
                          <td className="p-1 text-slate-600">{iss.dampak || "Koordinasi tim lapangan & mitigasi jadwal"}</td>
                          <td className="p-1 font-semibold text-slate-700">Site Eng.</td>
                          <td className="p-1 text-center">
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-blue-100 text-blue-800">
                              {iss.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <>
                        <tr>
                          <td className="p-1 text-center font-mono font-bold">#1</td>
                          <td className="p-1 font-semibold text-slate-800">Pasang laut tinggi memperlambat pengecoran dermaga</td>
                          <td className="p-1 text-center"><span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-rose-100 text-rose-800">H</span></td>
                          <td className="p-1 text-slate-600">Shift malam saat air surut & aditif beton cepat kering</td>
                          <td className="p-1 font-semibold">Site Eng.</td>
                          <td className="p-1 text-center"><span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-blue-100 text-blue-800">OPEN</span></td>
                        </tr>
                        <tr>
                          <td className="p-1 text-center font-mono font-bold">#2</td>
                          <td className="p-1 font-semibold text-slate-800">Akses jalan masuk material sempit</td>
                          <td className="p-1 text-center"><span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-amber-100 text-amber-800">M</span></td>
                          <td className="p-1 text-slate-600">Gunakan armada pikap kecil / transfer point</td>
                          <td className="p-1 font-semibold">Logistik</td>
                          <td className="p-1 text-center"><span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-emerald-100 text-emerald-800">CLOSED</span></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 11. Financial / Payment Status (5 cols) */}
            <div className="col-span-5 border border-[#1e3a8a] rounded-lg overflow-hidden">
              <div className="bg-[#1e3a8a] text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wide">
                11. FINANCIAL / PAYMENT STATUS
              </div>
              <div className="p-2.5 space-y-1 text-[10px]">
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500">Nilai Kontrak:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(data?.nilai_kontrak)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500">Addendum / Variation (+):</span>
                  <span className="font-semibold text-slate-600">Rp 0</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500">Deduksi (-):</span>
                  <span className="font-semibold text-slate-600">Rp 0</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500 font-bold text-slate-700">Nilai Kontrak Efektif:</span>
                  <span className="font-bold text-blue-900">{formatRupiah(data?.nilai_kontrak)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500">Progress Keuangan s.d Bulan Lalu (%):</span>
                  <span className="font-semibold font-mono">0.0%</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500">Progress Keuangan Bulan Ini (%):</span>
                  <span className="font-bold text-blue-700 font-mono">25.0%</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500 font-bold">Progress Keuangan Kumulatif (%):</span>
                  <span className="font-bold text-emerald-700 font-mono">25.0%</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500">Pembayaran s.d Bulan Ini:</span>
                  <span className="font-bold text-emerald-700">{formatRupiah(data?.financial_realisasi || (data?.nilai_kontrak ? data.nilai_kontrak * 0.25 : 371250000))}</span>
                </div>
                <div className="flex justify-between pt-0.5 font-bold">
                  <span className="text-rose-700">Sisa Pembayaran:</span>
                  <span className="text-rose-700">{formatRupiah(data?.financial_sisa || (data?.nilai_kontrak ? data.nilai_kontrak * 0.75 : 1113750000))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 12. 2-WEEK LOOK AHEAD & 13. MANAGEMENT SUMMARY           */}
          {/* ======================================================== */}
          <div className="grid grid-cols-12 gap-3.5">
            {/* 12. 2-Week Look Ahead (5 cols) */}
            <div className="col-span-5 border border-[#1e3a8a] rounded-lg overflow-hidden">
              <div className="bg-[#1e3a8a] text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wide">
                12. 2-WEEK LOOK AHEAD (RINGKASAN)
              </div>
              <div className="p-2 overflow-x-auto">
                <table className="w-full text-left text-[9px] border border-slate-300">
                  <thead className="bg-[#1e3a8a]/10 text-[#1e3a8a] font-bold uppercase">
                    <tr className="border-b border-slate-300">
                      <th className="p-1">KEGIATAN UTAMA</th>
                      <th className="p-1 text-center">TARGET</th>
                      <th className="p-1">PIC</th>
                      <th className="p-1">CONSTRAINT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1 font-semibold">Pengecoran Balok Dermaga</td><td className="p-1 text-center font-mono">100%</td><td className="p-1 font-medium">Pelaksana</td><td className="p-1 text-slate-500">Pasang Laut</td></tr>
                    <tr><td className="p-1 font-semibold">Ereksi Tiang Lampu Solar Cell</td><td className="p-1 text-center font-mono">80%</td><td className="p-1 font-medium">MEP</td><td className="p-1 text-slate-500">Logistik</td></tr>
                    <tr><td className="p-1 font-semibold">Plesteran Sentra Kuliner</td><td className="p-1 text-center font-mono">100%</td><td className="p-1 font-medium">Finishing</td><td className="p-1 text-slate-500">-</td></tr>
                    <tr><td className="p-1 font-semibold">Pemasangan Kanopi Dermaga</td><td className="p-1 text-center font-mono">50%</td><td className="p-1 font-medium">Struktur</td><td className="p-1 text-slate-500">Cuaca Angin</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 13. Management Summary (7 cols) */}
            <div className="col-span-7 border border-[#1e3a8a] rounded-lg overflow-hidden flex flex-col justify-between">
              <div className="bg-[#1e3a8a] text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wide">
                13. MANAGEMENT SUMMARY
              </div>
              <div className="p-2.5 space-y-1 text-[9.5px]">
                {isEditMode ? (
                  <div className="space-y-1.5">
                    <div>
                      <label className="font-bold text-[9px] text-slate-700">Pencapaian Utama:</label>
                      <input
                        type="text"
                        value={customManagement.pencapaian}
                        onChange={(e) => setCustomManagement({ ...customManagement, pencapaian: e.target.value })}
                        className="w-full text-[9px] p-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[9px] text-slate-700">Deviasi & Penyebab:</label>
                      <input
                        type="text"
                        value={customManagement.deviasiPenyebab}
                        onChange={(e) => setCustomManagement({ ...customManagement, deviasiPenyebab: e.target.value })}
                        className="w-full text-[9px] p-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[9px] text-slate-700">Tindakan Perbaikan / Recovery Action:</label>
                      <input
                        type="text"
                        value={customManagement.recoveryAction}
                        onChange={(e) => setCustomManagement({ ...customManagement, recoveryAction: e.target.value })}
                        className="w-full text-[9px] p-1 border rounded"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-slate-700">
                    <p><span className="font-bold text-slate-900">• Pencapaian Utama:</span> {customManagement.pencapaian}</p>
                    <p><span className="font-bold text-slate-900">• Deviasi & Penyebab:</span> {customManagement.deviasiPenyebab}</p>
                    <p><span className="font-bold text-slate-900">• Tindakan Perbaikan / Recovery Action:</span> {customManagement.recoveryAction}</p>
                    <p><span className="font-bold text-slate-900">• Kebutuhan Dukungan / Keputusan:</span> {customManagement.dukungan}</p>
                    <p><span className="font-bold text-slate-900">• Rencana Bulan Selanjutnya:</span> {customManagement.rencanaBulanDepan}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 14. APPROVAL & TANDA TANGAN                              */}
          {/* ======================================================== */}
          <div className="border border-[#1e3a8a] rounded-lg overflow-hidden">
            <div className="bg-[#1e3a8a] text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wide">
              14. APPROVAL & TANDA TANGAN
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-300 bg-white p-3 text-[10px]">
              {/* Kontraktor */}
              <div className="flex flex-col items-center text-center space-y-1 px-3">
                <div className="font-bold text-slate-900 uppercase">DISUSUN OLEH</div>
                <div className="text-xs font-black text-blue-900">{data?.kontraktor_name || "PT. MINA BAHARI NUSANTARA"}</div>
                <div className="h-16 w-36 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-300 text-[9px] my-1">
                  [ TTD & CAP KONTRAKTOR ]
                </div>
                <div className="text-left w-full space-y-0.5 text-[9.5px]">
                  <div><span className="text-slate-500">Nama:</span> <span className="font-bold">{data?.site_manager || "Ir. Hendra Gunawan"}</span></div>
                  <div><span className="text-slate-500">Jabatan:</span> <span>Site Manager / Direktur</span></div>
                  <div><span className="text-slate-500">Tanggal:</span> <span>31 {data?.month_name} {selectedYear}</span></div>
                </div>
              </div>

              {/* Konsultan Pengawas */}
              <div className="flex flex-col items-center text-center space-y-1 px-3">
                <div className="font-bold text-slate-900 uppercase">DIPERIKSA & DIVERIFIKASI</div>
                <div className="text-xs font-black text-blue-900">KONSULTAN / PENGAWAS LAPANGAN</div>
                <div className="h-16 w-36 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-300 text-[9px] my-1">
                  [ TTD & CAP PENGAWAS ]
                </div>
                <div className="text-left w-full space-y-0.5 text-[9.5px]">
                  <div><span className="text-slate-500">Nama:</span> <span className="font-bold">{data?.konsultan_pengawas || "Ilya Safira, S. Ars / Tim Pengawas"}</span></div>
                  <div><span className="text-slate-500">Jabatan:</span> <span>Supervision Engineer / Pengawas</span></div>
                  <div><span className="text-slate-500">Tanggal:</span> <span>31 {data?.month_name} {selectedYear}</span></div>
                </div>
              </div>

              {/* PPK */}
              <div className="flex flex-col items-center text-center space-y-1 px-3">
                <div className="font-bold text-slate-900 uppercase">DIKETAHUI</div>
                <div className="text-xs font-black text-blue-900">WAKIL PIMPRO / PPK WILAYAH SUMATERA</div>
                <div className="h-16 w-36 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-300 text-[9px] my-1">
                  [ TTD & CAP PPK ]
                </div>
                <div className="text-left w-full space-y-0.5 text-[9.5px]">
                  <div><span className="text-slate-500">Nama:</span> <span className="font-bold">{data?.wakil_ppk || "Muhammad Iqbal S.Pi, M.Si"}</span></div>
                  <div><span className="text-slate-500">Jabatan:</span> <span>Wakil Sah PPK Sumatera</span></div>
                  <div><span className="text-slate-500">Tanggal:</span> <span>31 {data?.month_name} {selectedYear}</span></div>
                </div>
              </div>
            </div>

            {/* Notes Footer */}
            <div className="bg-slate-50 border-t border-slate-300 px-3 py-1.5 text-[8.5px] text-slate-500 space-y-0.5">
              <span className="font-bold text-slate-700">CATATAN PENGENDALIAN PROYEK:</span>
              <p>1. Semua data harus didukung evidence (foto dokumentasi lapangan, dokumen teknis, berita acara, surat-menyurat resmi).</p>
              <p>2. Format ini adalah dokumen pengendalian proyek teknis dan bukan merupakan dokumen verifikasi pencairan pembayaran termin.</p>
              <p>3. Gunakan status RAG (Red-Amber-Green) untuk memudahkan monitoring deviasi kritis dan pengambilan keputusan di tingkat pimpinan.</p>
            </div>
          </div>

          {/* Document Watermark Footer */}
          <div className="flex items-center justify-between text-[8.5px] text-slate-400 border-t border-slate-200 pt-2 font-mono">
            <span>KNMP — KAMPUNG NELAYAN MERAH PUTIH</span>
            <span>WILAYAH SUMATERA • PT PERTAMINA (PERSERO) / KKP RI</span>
            <span>VERSION 1.0 • SYSTEM GENERATED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
