import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Users,
  UserCheck,
  AlertOctagon,
  Compass,
  FileSignature,
  Users2,
  Truck,
  HardHat,
  ShieldCheck,
  Building,
  FileText,
  Wrench,
  X,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Navigation,
  DollarSign,
  CreditCard,
  CalendarCheck,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Chart, registerables } from "chart.js";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../lib/api-client";
import { Card } from "../../../components/ui/Card";
import { formatCurrency } from "../../../lib/utils";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../auth/hooks/useAuth";
import knmpDetailsMap from "../data/knmp_sumatera_details.json";

Chart.register(...registerables);

interface WidgetData {
  total_knmps: number;
  on_track: number;
  perlu_perhatian: number;
  kritis: number;
  pemeliharaan: number;
  belum_mulai: number;
  total_pelaksanaan: number;
  total_workers: number;
  today_workers: number;
  total_issues: number;
  finance: {
    pagu: number;
    realisasi: number;
    percentage: number;
    remaining_percentage: number;
  };
  deviation_10: number;
  deviation_20: number;
  approval: {
    pengawas: number;
    tim_validasi: number;
    ppk: number;
    total_docs: number;
  };
  stages: {
    perencanaan: number;
    kontrak: number;
    pcm: number;
    lapangan: number;
    pelaksanaan: number;
    laporan: number;
    pho: number;
    fho: number;
  };
}

export const DashboardPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const lineChartRef = useRef<HTMLCanvasElement | null>(null);
  const lineChartInstance = useRef<Chart | null>(null);

  const donutChartRef = useRef<HTMLCanvasElement | null>(null);
  const donutChartInstance = useRef<Chart | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdminOrPengawas = user?.roles?.some((r) =>
    ["superadmin", "super admin", "admin_ppk", "admin", "pengawas"].includes(r.toLowerCase())
  ) || false;

  const [selectedDetailKnmp, setSelectedDetailKnmp] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [activeFilter, setActiveFilter] = useState<string>("all");

  const { data: widgetData } = useQuery<WidgetData>({
    queryKey: ["dashboard-widgets"],
    queryFn: () => apiFetch<WidgetData>("/api/v1/knmp/widget"),
  });

  const { data: mapPoints } = useQuery<any[]>({
    queryKey: ["dashboard-map"],
    queryFn: () => apiFetch<any[]>("/api/v1/knmp/map"),
  });

  const totalKnmps = widgetData?.total_knmps || 0;
  const onTrack = widgetData?.on_track || 0;
  const perluPerhatian = widgetData?.perlu_perhatian || 0;
  const kritis = widgetData?.kritis || 0;
  const pemeliharaan = widgetData?.pemeliharaan || 0;
  const belumMulai = widgetData?.belum_mulai || 0;
  const totalPelaksanaan = widgetData?.total_pelaksanaan || 0;
  const totalWorkers = widgetData?.total_workers || 0;
  const todayWorkers = widgetData?.today_workers || 0;
  const totalIssues = widgetData?.total_issues || 0;

  const finance = widgetData?.finance || {
    pagu: 0,
    realisasi: 0,
    percentage: 0,
    remaining_percentage: 100,
  };

  const approval = widgetData?.approval || {
    pengawas: 0,
    tim_validasi: 0,
    ppk: 0,
    total_docs: 0,
  };

  const stagesData = widgetData?.stages || {
    perencanaan: totalKnmps,
    kontrak: 0,
    pcm: 0,
    lapangan: 0,
    pelaksanaan: 0,
    laporan: 0,
    pho: 0,
    fho: 0,
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [0.7893, 105.0],
        zoom: 6,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 18,
        }
      ).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Pin icons creation helper
    const createPin = (fillColor: string) => {
      return L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="
            width: 22px;
            height: 28px;
            filter: drop-shadow(0 2px 5px rgba(0,0,0,0.6));
            cursor: pointer;
            transition: transform 0.15s ease;
          " onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">
            <svg width="22" height="28" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M10 0C4.47715 0 0 4.47715 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.47715 15.5228 0 10 0ZM10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14Z" fill="${fillColor}"/>
            </svg>
          </div>
        `,
        iconSize: [22, 28],
        iconAnchor: [11, 28],
        popupAnchor: [0, -28],
      });
    };

    const redIcon = createPin("#ef4444"); // 0%
    const yellowIcon = createPin("#f59e0b"); // < 50%
    const blueIcon = createPin("#3b82f6"); // 50% - 74%
    const greenIcon = createPin("#10b981"); // >= 75%

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    let safePoints = Array.isArray(mapPoints) ? mapPoints : [];
    // User KNMP filtering: non-admin/pengawas users only see their own assigned KNMP
    if (!isAdminOrPengawas && user?.knmp_ids && user.knmp_ids.length > 0) {
      safePoints = safePoints.filter((m) => user.knmp_ids?.includes(m.id));
    }

    if (safePoints.length > 0) {
      const bounds = L.latLngBounds([]);

      safePoints.forEach((m) => {
        const lat = parseFloat(m.lat);
        const lng = parseFloat(m.long);
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend([lat, lng]);

          // Determine progress - default is 0% as requested since new data
          let progress = 0;
          if (typeof m.progress === "number") {
            progress = m.progress;
          } else if (typeof m.realisasi_progres_fisik === "number") {
            progress = m.realisasi_progres_fisik;
          }

          // Filter by active filter
          if (activeFilter === "0%" && progress !== 0) return;
          if (activeFilter === "<50%" && (progress === 0 || progress >= 50)) return;
          if (activeFilter === "50-74%" && (progress < 50 || progress >= 75)) return;
          if (activeFilter === ">75%" && progress < 75) return;

          let icon = redIcon;
          let colorLabel = "0% (Belum Mulai)";
          let colorBadge = "bg-rose-100 text-rose-800 border-rose-300";

          if (progress >= 75) {
            icon = greenIcon;
            colorLabel = "≥ 75%";
            colorBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";
          } else if (progress >= 50) {
            icon = blueIcon;
            colorLabel = "50% - 74%";
            colorBadge = "bg-blue-100 text-blue-800 border-blue-300";
          } else if (progress > 0) {
            icon = yellowIcon;
            colorLabel = "< 50%";
            colorBadge = "bg-amber-100 text-amber-800 border-amber-300";
          } else {
            icon = redIcon;
            colorLabel = "0% (Belum Mulai)";
            colorBadge = "bg-rose-100 text-rose-800 border-rose-300";
          }

          const popupContent = `
            <div style="font-family: inherit; font-size: 12px; color: #1e293b; min-width: 220px; padding: 4px;">
              <div style="font-weight: 700; font-size: 13.5px; margin-bottom: 6px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">${m.name}</span>
                <span class="${colorBadge}" style="font-size: 10px; padding: 2px 6px; border-radius: 4px; border-width: 1px; white-space: nowrap; font-weight: 600;">${colorLabel}</span>
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">Regional</td>
                  <td style="text-align: right; font-weight: 500;">${m.regional_name || "Sumatera"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">Provinsi</td>
                  <td style="text-align: right; font-weight: 500;">${m.province_name || "-"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">Kabupaten</td>
                  <td style="text-align: right; font-weight: 500;">${m.regency_name || "-"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">Kecamatan</td>
                  <td style="text-align: right; font-weight: 500;">${m.district_name || "-"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">Progress Fisik</td>
                  <td style="text-align: right; font-weight: 700; color: ${progress > 0 ? '#0d6efd' : '#ef4444'};">${progress}%</td>
                </tr>
              </table>
              <button type="button" class="btn-knmp-detail" data-knmp-id="${m.id}" style="margin-top: 8px; width: 100%; background: #3366ff; color: #ffffff; font-size: 11px; font-weight: 600; padding: 6px 10px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); transition: background 0.15s;">
                <span>Lihat Detail Titik KNMP</span>
                <span>&rarr;</span>
              </button>
            </div>
          `;

          const marker = L.marker([lat, lng], { icon }).bindPopup(popupContent, {
            maxWidth: 290,
            className: "custom-leaflet-popup",
          });

          marker.addTo(map);
        }
      });

      // Bind popup open listener for detail button click
      map.off("popupopen");
      map.on("popupopen", (e) => {
        const popupEl = e.popup.getElement();
        const btn = popupEl?.querySelector(".btn-knmp-detail");
        if (btn) {
          btn.addEventListener("click", () => {
            const knmpId = Number(btn.getAttribute("data-knmp-id"));
            const target = safePoints.find((p) => p.id === knmpId);
            if (target) {
              const cleanKey = target.name.toLowerCase().replace(/^knmp\s+/i, "").replace(/[^a-z0-9]/g, "");
              const extra = (knmpDetailsMap as Record<string, any>)[cleanKey] || {};
              setSelectedDetailKnmp({ ...target, extra });
              setIsDetailModalOpen(true);
            }
          });
        }
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
      }
    }
  }, [mapPoints, activeFilter, user]);

  // 2. Initialize Chart.js Line Chart (Crisp, proportional, never distorted)
  useEffect(() => {
    if (!lineChartRef.current) return;

    if (lineChartInstance.current) {
      lineChartInstance.current.destroy();
    }

    const ctx = lineChartRef.current.getContext("2d");
    if (!ctx) return;

    const gridColor = isDark ? "#1e293b" : "#f1f5f9";
    const tickColor = isDark ? "#94a3b8" : "#64748b";
    const legendColor = isDark ? "#cbd5e1" : "#475569";

    lineChartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
        datasets: [
          {
            label: "Progress Fisik",
            data: [0, 0, 0, 0, 0, 0, 30, 20, 20, 20, 20, 20],
            borderColor: "#605DFF",
            backgroundColor: "#605DFF",
            pointBackgroundColor: "#605DFF",
            pointRadius: 4.5,
            pointHoverRadius: 6,
            tension: 0.1,
          },
          {
            label: "Progress Keuangan",
            data: [0, 0, 0, 0, 0, 0, 30, 32, 32, 32, 32, 32],
            borderColor: "#FE7A36",
            backgroundColor: "#FE7A36",
            pointBackgroundColor: "#FE7A36",
            pointRadius: 4.5,
            pointHoverRadius: 6,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            position: "bottom",
            align: "start",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              padding: 20,
              font: {
                size: 12,
                family: "Inter, sans-serif",
                weight: "normal",
              },
              color: legendColor,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${context.parsed.y}%`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: tickColor,
              font: { size: 11, family: "Inter, sans-serif" },
            },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: gridColor },
            ticks: {
              color: tickColor,
              stepSize: 20,
              font: { size: 11, family: "Inter, sans-serif" },
              callback: (value) => `${value}%`,
            },
          },
        },
      },
    });

    return () => {
      lineChartInstance.current?.destroy();
    };
  }, [isDark]);

  // 3. Initialize Chart.js Donut Chart
  useEffect(() => {
    if (!donutChartRef.current) return;

    if (donutChartInstance.current) {
      donutChartInstance.current.destroy();
    }

    const ctx = donutChartRef.current.getContext("2d");
    if (!ctx) return;

    const dataValues = [
      onTrack,
      perluPerhatian,
      kritis,
      pemeliharaan,
      belumMulai,
    ];

    const allZero = dataValues.every((v) => v === 0);
    const borderColor = isDark ? "#0f172a" : "#ffffff";

    donutChartInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["On Track", "Perlu Perhatian", "Kritis", "Pemeliharaan", "Belum Mulai"],
        datasets: [
          {
            data: allZero ? [1] : dataValues,
            backgroundColor: allZero
              ? ["#10b981"]
              : ["#10b981", "#f59e0b", "#f43f5e", "#3b82f6", "#94a3b8"],
            borderWidth: 3,
            borderColor: borderColor,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        cutout: "75%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: !allZero,
          },
        },
      },
    });

    return () => {
      donutChartInstance.current?.destroy();
    };
  }, [onTrack, perluPerhatian, kritis, pemeliharaan, belumMulai, isDark]);

  const statCards = [
    {
      title: "Total Lokasi",
      value: `${totalKnmps} Lokasi`,
      badge: "Tersedia",
      badgeClass: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60",
      icon: MapPin,
      iconBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
    },
    {
      title: "On Track",
      value: `${onTrack} Lokasi`,
      badge: "Tersedia",
      badgeClass: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Perlu Perhatian",
      value: `${perluPerhatian} Lokasi`,
      badge: "Perhatian",
      badgeClass: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60",
      icon: AlertTriangle,
      iconBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
    },
    {
      title: "Kritis",
      value: `${kritis} Lokasi`,
      badge: "Kritis",
      badgeClass: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60",
      icon: Clock,
      iconBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400",
    },
    {
      title: "Total Pelaksanaan",
      value: `${totalPelaksanaan} Lokasi`,
      badge: "Tersedia",
      badgeClass: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60",
      icon: Layers,
      iconBg: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400",
    },
    {
      title: "Jumlah Tenaga Kerja",
      value: `${totalWorkers.toLocaleString("id-ID")} Pekerja`,
      badge: "Tersedia",
      badgeClass: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60",
      icon: Users,
      iconBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Tenaga Kerja Hari Ini",
      value: `${todayWorkers.toLocaleString("id-ID")} Pekerja`,
      badge: "Tersedia",
      badgeClass: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
      icon: UserCheck,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Issue",
      value: totalIssues.toString(),
      badge: "Tersedia",
      badgeClass: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60",
      icon: AlertOctagon,
      iconBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400",
    },
  ];

  const stageList = [
    { num: 1, name: "Persiapan Kontrak", icon: FileSignature, color: "text-indigo-600", bg: "bg-indigo-50", count: stagesData.kontrak },
    { num: 2, name: "Persiapan Lapangan", icon: Truck, color: "text-teal-600", bg: "bg-teal-50", count: stagesData.lapangan },
    { num: 3, name: "Pelaksanaan Konstruksi", icon: HardHat, color: "text-amber-600", bg: "bg-amber-50", count: stagesData.pelaksanaan },
    { num: 4, name: "Laporan", icon: FileText, color: "text-rose-600", bg: "bg-rose-50", count: stagesData.laporan },
    { num: 5, name: "PHO", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", count: stagesData.pho },
    { num: 6, name: "Pemeliharaan", icon: Wrench, color: "text-blue-600", bg: "bg-blue-50", count: widgetData?.pemeliharaan || 0 },
    { num: 7, name: "FHO", icon: ShieldCheck, color: "text-slate-600", bg: "bg-slate-50", count: stagesData.fho },
  ];

  const maxApproval = Math.max(approval.total_docs, 1);

  return (
    <div className="space-y-6 w-full transition-colors duration-200">
      {/* 1. Top Section: Full-Width GIS Satellite Map */}
      <Card className="p-0 overflow-hidden border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs bg-white dark:bg-slate-900">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-wide">
              Peta Sebaran Lokasi KNMP
            </h3>
            {!isAdminOrPengawas && user?.knmp_ids && user.knmp_ids.length > 0 && (
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                Titik Penugasan Anda
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 max-w-full">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs shrink-0 whitespace-nowrap cursor-pointer ${
                activeFilter === "all"
                  ? "bg-[#3366ff] text-white"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === "0%" ? "all" : "0%")}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold border rounded-xl flex items-center gap-1.5 sm:gap-2 transition-colors shadow-2xs shrink-0 whitespace-nowrap cursor-pointer ${
                activeFilter === "0%"
                  ? "bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 text-rose-700 dark:text-rose-300 ring-2 ring-rose-200 dark:ring-rose-800/40"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750"
              }`}
            >
              <svg width="13" height="16" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47715 0 0 4.47715 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.47715 15.5228 0 10 0ZM10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14Z" fill="#ef4444"/>
              </svg>
              <span className="whitespace-nowrap">0% (Belum Mulai)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === "<50%" ? "all" : "<50%")}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold border rounded-xl flex items-center gap-1.5 sm:gap-2 transition-colors shadow-2xs shrink-0 whitespace-nowrap cursor-pointer ${
                activeFilter === "<50%"
                  ? "bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 ring-2 ring-amber-200 dark:ring-amber-800/40"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750"
              }`}
            >
              <svg width="13" height="16" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47715 0 0 4.47715 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.47715 15.5228 0 10 0ZM10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14Z" fill="#f59e0b"/>
              </svg>
              <span className="whitespace-nowrap">&lt; 50%</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === "50-74%" ? "all" : "50-74%")}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold border rounded-xl flex items-center gap-1.5 sm:gap-2 transition-colors shadow-2xs shrink-0 whitespace-nowrap cursor-pointer ${
                activeFilter === "50-74%"
                  ? "bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 ring-2 ring-blue-200 dark:ring-blue-800/40"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750"
              }`}
            >
              <svg width="13" height="16" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47715 0 0 4.47715 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.47715 15.5228 0 10 0ZM10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14Z" fill="#3b82f6"/>
              </svg>
              <span className="whitespace-nowrap">50% - 74%</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === ">75%" ? "all" : ">75%")}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold border rounded-xl flex items-center gap-1.5 sm:gap-2 transition-colors shadow-2xs shrink-0 whitespace-nowrap cursor-pointer ${
                activeFilter === ">75%"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-200 dark:ring-emerald-800/40"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750"
              }`}
            >
              <svg width="13" height="16" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47715 0 0 4.47715 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.47715 15.5228 0 10 0ZM10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14Z" fill="#10b981"/>
              </svg>
              <span className="whitespace-nowrap">&ge; 75%</span>
            </button>
          </div>
        </div>

        <div ref={mapContainerRef} className="w-full min-h-[380px] h-[420px] sm:h-[500px] lg:h-[640px] bg-slate-950 relative z-10" />
      </Card>

      {/* 2. Metric Stat Cards Row (8 Cards in 2 Rows) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between hover:shadow-sm transition-all"
          >
            <div className="space-y-2">
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{card.title}</span>
              <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{card.value}</h4>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${card.badgeClass}`}>
                {card.badge}
              </span>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center`}>
              <card.icon className="w-7 h-7" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Middle Section: Dynamic Progress Chart & Approval Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        {/* Left: Progress Curve Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Grafik Deviasi Progress Fisik & Keuangan</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-[#605DFF] inline-block" /> Progress Fisik
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-[#FE7A36] inline-block" /> Progress Keuangan
              </span>
            </div>
          </div>
          <div className="h-[280px] w-full relative">
            <canvas ref={lineChartRef} />
          </div>
        </div>

        {/* Right: Status Monitoring Donut */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors duration-200">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-4">
            Status Monitoring KNMP
          </h3>
          <div className="h-[200px] w-full relative flex items-center justify-center my-2">
            <canvas ref={donutChartRef} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalKnmps}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Titik</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              <span className="text-slate-600 dark:text-slate-300">On Track ({onTrack})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <span className="text-slate-600 dark:text-slate-300">Perhatian ({perluPerhatian})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
              <span className="text-slate-600 dark:text-slate-300">Kritis ({kritis})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
              <span className="text-slate-600 dark:text-slate-300">Pemeliharaan ({pemeliharaan})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Financial & Document Approval Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        {/* Left: Financial Status */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5 transition-colors duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Status Keuangan</h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300">
              Realisasi {finance.percentage}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Pagu</span>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(finance.pagu)}</p>
            </div>
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Realisasi</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(finance.realisasi)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span>Progress Pembayaran</span>
              <span>{finance.percentage}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(finance.percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Approval Pipeline */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5 transition-colors duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Status Validasi Dokumen</h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
              {approval.total_docs} Dokumen
            </span>
          </div>

          <div className="space-y-3">
            {/* Pengawas */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center">
                <div
                  className="h-full bg-[#7367F0] text-white text-xs font-semibold px-3.5 flex items-center transition-all"
                  style={{ width: `${Math.max((approval.pengawas / maxApproval) * 100, 20)}%` }}
                >
                  Pengawas
                </div>
              </div>
              <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 w-8 text-right">{approval.pengawas}</span>
            </div>

            {/* Tim Validasi */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center">
                <div
                  className="h-full bg-[#28C76F] text-white text-xs font-semibold px-3.5 flex items-center transition-all"
                  style={{ width: `${Math.max((approval.tim_validasi / maxApproval) * 100, 20)}%` }}
                >
                  Tim Validasi
                </div>
              </div>
              <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 w-8 text-right">{approval.tim_validasi}</span>
            </div>

            {/* PPK */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center">
                <div
                  className="h-full bg-[#FF9F43] text-white text-xs font-semibold px-3.5 flex items-center transition-all"
                  style={{ width: `${Math.max((approval.ppk / maxApproval) * 100, 20)}%` }}
                >
                  PPK
                </div>
              </div>
              <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 w-8 text-right">{approval.ppk}</span>
            </div>

            {/* Total Upload */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center">
                <div
                  className="h-full bg-[#00CFE8] text-white text-xs font-semibold px-3.5 flex items-center transition-all"
                  style={{ width: "100%" }}
                >
                  Total Upload
                </div>
              </div>
              <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 w-8 text-right">{approval.total_docs}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Tahapan Proyeksi KNMP */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5 transition-colors duration-200">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tahapan Proyeksi KNMP</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {stageList.map((stage) => {
            const pct = totalKnmps > 0 ? ((stage.count / totalKnmps) * 100).toFixed(1) : "0.0";
            return (
              <div
                key={stage.num}
                className="p-4 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 rounded-2xl flex flex-col items-center text-center space-y-3.5 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate w-full">
                  {stage.num}. {stage.name}
                </span>
                <div className={`w-18 h-18 rounded-full ${stage.bg} dark:bg-slate-700/80 ${stage.color} flex items-center justify-center shadow-xs transition-transform hover:scale-105`}>
                  <stage.icon className="w-10 h-10" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{stage.count}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">{pct}%</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 text-center">
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Total Lokasi {totalKnmps}</p>
        </div>
      </div>

      {/* 6. Modal Detail Titik KNMP */}
      {isDetailModalOpen && selectedDetailKnmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-[800px] w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[92vh] transition-all">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#3366ff] shadow-2xs">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                      {selectedDetailKnmp.name}
                    </h3>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {selectedDetailKnmp.extra?.jenis || selectedDetailKnmp.jenis_knmp || "Penyangga"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedDetailKnmp.province_name || "Provinsi Sumatera"}, {selectedDetailKnmp.regency_name || "Kabupaten"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Status & Quick Progress Banner */}
              <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/60 dark:from-slate-800 dark:to-slate-850 p-4 rounded-2xl border border-blue-100/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Realisasi Fisik Konstruksi</span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">0.00%</span>
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      Belum Mulai / Baru
                    </span>
                  </div>
                </div>

                {/* Coordinate & Map Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDetailKnmp.lat && selectedDetailKnmp.long) {
                        navigator.clipboard.writeText(`${selectedDetailKnmp.lat}, ${selectedDetailKnmp.long}`);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Tersalin!" : "Salin Koordinat"}</span>
                  </button>

                  {selectedDetailKnmp.lat && selectedDetailKnmp.long && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedDetailKnmp.lat},${selectedDetailKnmp.long}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#3366ff] hover:bg-[#2554d7] text-white font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Buka Google Maps</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Data Grid Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Informasi Wilayah & Administratif */}
                <div className="bg-slate-50/70 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3366ff]" />
                    Informasi Wilayah & Administratif
                  </h4>

                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                        <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Regional</td>
                        <td className="py-2 text-right font-semibold text-slate-800 dark:text-slate-100">
                          {selectedDetailKnmp.regional_name || "Sumatera"}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                        <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Provinsi</td>
                        <td className="py-2 text-right font-semibold text-slate-800 dark:text-slate-100">
                          {selectedDetailKnmp.province_name || selectedDetailKnmp.extra?.provinsi || "-"}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                        <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Kabupaten / Kota</td>
                        <td className="py-2 text-right font-semibold text-slate-800 dark:text-slate-100">
                          {selectedDetailKnmp.regency_name || selectedDetailKnmp.extra?.kabupaten || "-"}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                        <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Kecamatan</td>
                        <td className="py-2 text-right font-semibold text-slate-800 dark:text-slate-100">
                          {selectedDetailKnmp.district_name || selectedDetailKnmp.extra?.kecamatan || "-"}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                        <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Desa / Kelurahan</td>
                        <td className="py-2 text-right font-semibold text-slate-800 dark:text-slate-100">
                          {selectedDetailKnmp.sub_district_name || selectedDetailKnmp.extra?.desa || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Titik Koordinat</td>
                        <td className="py-2 text-right font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                          {selectedDetailKnmp.lat}, {selectedDetailKnmp.long}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. Tim Proyek & Pengawasan Lapangan */}
                <div className="bg-slate-50/70 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Tim Proyek & Pengawasan
                  </h4>

                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                        <td className="py-2 text-slate-500 dark:text-slate-400 font-medium align-top">Ketua Tim / PPK</td>
                        <td className="py-2 text-right font-semibold text-slate-800 dark:text-slate-100 max-w-[200px]">
                          {selectedDetailKnmp.extra?.ketuaPPK || "Muhammad Iqbal S.Pi, M.Si"}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                        <td className="py-2 text-slate-500 dark:text-slate-400 font-medium align-top">Pengawas Lapangan</td>
                        <td className="py-2 text-right font-semibold text-slate-800 dark:text-slate-100 max-w-[200px]">
                          {selectedDetailKnmp.extra?.pengawas || "Pengawas Ditugaskan"}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                        <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Status Operasional</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {selectedDetailKnmp.status || "Aktif / On Track"}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Akun Lapangan</td>
                        <td className="py-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                          2 Pengguna Aktif Terkoneksi
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* 3. Ringkasan Status 8 Tahapan Program */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Status Tahapan & Modul Program
                  </span>
                  <span className="text-slate-400 font-normal text-[11px]">8 Tahapan Utama</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-medium">1. Persiapan Kontrak</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 block">Tersedia</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-medium">2. PCM</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 block">Siap / Terjadwal</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-medium">3. Mobilisasi</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 block">Dalam Proses</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-medium">4. Pelaksanaan Fisik</span>
                    <span className="text-xs font-bold text-rose-600 mt-1 block">0.00% Realisasi</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-medium">5. Laporan Harian</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 block">Siap Input</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-medium">6. Termin Pembayaran</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 block">5 Termin Terdaftar</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-medium">7. Absensi Pekerja</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 block">Aktif</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-medium">8. Kendala / Issue</span>
                    <span className="text-xs font-bold text-emerald-600 mt-1 block">0 Issue Terbuka</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer - Quick Navigation Links */}
            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    navigate("/pelaksanaan");
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-2xs"
                >
                  Pelaksanaan Konstruksi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    navigate("/persiapan_kontrak");
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-2xs"
                >
                  Persiapan Kontrak
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    navigate("/persiapan_lapangan");
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-2xs"
                >
                  Mobilisasi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    navigate("/issue");
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-2xs"
                >
                  Kendala / Issue
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#3366ff] hover:bg-[#2554d7] rounded-xl transition-colors shadow-2xs"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
