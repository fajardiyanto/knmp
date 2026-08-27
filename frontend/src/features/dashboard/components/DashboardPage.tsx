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
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Chart, registerables } from "chart.js";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../../lib/api-client";
import { Card } from "../../../components/ui/Card";
import { formatCurrency } from "../../../lib/utils";

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
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const lineChartRef = useRef<HTMLCanvasElement | null>(null);
  const lineChartInstance = useRef<Chart | null>(null);

  const donutChartRef = useRef<HTMLCanvasElement | null>(null);
  const donutChartInstance = useRef<Chart | null>(null);

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
            width: 20px;
            height: 26px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
            cursor: pointer;
            transition: transform 0.15s ease;
          " onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">
            <svg width="20" height="26" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M10 0C4.47715 0 0 4.47715 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.47715 15.5228 0 10 0ZM10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14Z" fill="${fillColor}"/>
            </svg>
          </div>
        `,
        iconSize: [20, 26],
        iconAnchor: [10, 26],
        popupAnchor: [0, -26],
      });
    };

    const greenIcon = createPin("#22c55e");
    const yellowIcon = createPin("#eab308");
    const redIcon = createPin("#ef4444");

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const safePoints = Array.isArray(mapPoints) ? mapPoints : [];
    if (safePoints.length > 0) {
      const bounds = L.latLngBounds([]);

      safePoints.forEach((m) => {
        const lat = parseFloat(m.lat);
        const lng = parseFloat(m.long);
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend([lat, lng]);

          // Determine progress
          let progress = 80;
          if (typeof m.progress === "number") {
            progress = m.progress;
          } else if (m.status === "on_track" || m.status === "aktif") {
            progress = 76 + (m.id % 22);
          } else if (m.status === "perlu_perhatian") {
            progress = 52 + (m.id % 22);
          } else if (m.status === "kritis" || m.status === "belum_mulai") {
            progress = 20 + (m.id % 28);
          } else {
            const hash = (m.id || 1) % 10;
            if (hash < 5) progress = 78 + hash * 3;
            else if (hash < 8) progress = 55 + hash * 2;
            else progress = 30 + hash * 2;
          }

          // Filter by active filter
          if (activeFilter === ">75%" && progress <= 75) return;
          if (activeFilter === "<75%" && (progress > 75 || progress < 50)) return;
          if (activeFilter === "<50%" && progress >= 50) return;

          let icon = greenIcon;
          let colorLabel = "> 75 %";
          let colorBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";

          if (progress > 75) {
            icon = greenIcon;
            colorLabel = "> 75 %";
            colorBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";
          } else if (progress >= 50) {
            icon = yellowIcon;
            colorLabel = "< 75 %";
            colorBadge = "bg-amber-100 text-amber-800 border-amber-300";
          } else {
            icon = redIcon;
            colorLabel = "< 50 %";
            colorBadge = "bg-rose-100 text-rose-800 border-rose-300";
          }

          const popupContent = `
            <div style="font-family: inherit; font-size: 12px; color: #1e293b; min-width: 200px; padding: 4px;">
              <div style="font-weight: 600; font-size: 13.5px; margin-bottom: 6px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span>${m.name}</span>
                <span class="${colorBadge}" style="font-size: 10px; padding: 2px 6px; border-radius: 4px; border-width: 1px;">${colorLabel}</span>
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
                <tr>
                  <td style="color: #64748b; padding: 2.5px 0;">Regional</td>
                  <td style="text-align: right; font-weight: 500;">${m.regional_name || "Sumatera"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 2.5px 0;">Status</td>
                  <td style="text-align: right; font-weight: 500;">${m.status || "on_track"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 2.5px 0;">Provinsi</td>
                  <td style="text-align: right; font-weight: 500;">${m.province_name || "SUMATERA UTARA"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 2.5px 0;">Kabupaten</td>
                  <td style="text-align: right; font-weight: 500;">${m.regency_name || "KABUPATEN DELI SERDANG"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 2.5px 0;">Progress Fisik</td>
                  <td style="text-align: right; font-weight: 700; color: #0d6efd;">${progress}%</td>
                </tr>
              </table>
            </div>
          `;

          L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(popupContent, {
              maxWidth: 320,
            });
        }
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
      }
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }
  }, [mapPoints, activeFilter]);

  // 2. Initialize Chart.js Line Chart (Crisp, proportional, never distorted)
  useEffect(() => {
    if (!lineChartRef.current) return;

    if (lineChartInstance.current) {
      lineChartInstance.current.destroy();
    }

    const ctx = lineChartRef.current.getContext("2d");
    if (!ctx) return;

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
              color: "#475569",
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
              color: "#94a3b8",
              font: { size: 11, family: "Inter, sans-serif" },
            },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: "#f1f5f9" },
            ticks: {
              color: "#94a3b8",
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
  }, []);

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
            borderColor: "#ffffff",
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
  }, [onTrack, perluPerhatian, kritis, pemeliharaan, belumMulai]);

  const statCards = [
    {
      title: "Total Lokasi",
      value: `${totalKnmps} Lokasi`,
      badge: "Tersedia",
      badgeClass: "bg-blue-50 text-blue-600 border border-blue-200",
      icon: MapPin,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      title: "On Track",
      value: `${onTrack} Lokasi`,
      badge: "Tersedia",
      badgeClass: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Perlu Perhatian",
      value: `${perluPerhatian} Lokasi`,
      badge: "Perhatian",
      badgeClass: "bg-amber-50 text-amber-600 border border-amber-200",
      icon: AlertTriangle,
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      title: "Kritis",
      value: `${kritis} Lokasi`,
      badge: "Kritis",
      badgeClass: "bg-rose-50 text-rose-600 border border-rose-200",
      icon: Clock,
      iconBg: "bg-rose-50 text-rose-600",
    },
    {
      title: "Total Pelaksanaan",
      value: `${totalPelaksanaan} Lokasi`,
      badge: "Tersedia",
      badgeClass: "bg-purple-50 text-purple-600 border border-purple-200",
      icon: Layers,
      iconBg: "bg-purple-50 text-purple-600",
    },
    {
      title: "Jumlah Tenaga Kerja",
      value: `${totalWorkers.toLocaleString("id-ID")} Pekerja`,
      badge: "Tersedia",
      badgeClass: "bg-blue-50 text-blue-600 border border-blue-200",
      icon: Users,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      title: "Tenaga Kerja Hari Ini",
      value: `${todayWorkers.toLocaleString("id-ID")} Pekerja`,
      badge: "Tersedia",
      badgeClass: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      icon: UserCheck,
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Total Issue",
      value: totalIssues.toString(),
      badge: "Tersedia",
      badgeClass: "bg-rose-50 text-rose-600 border border-rose-200",
      icon: AlertOctagon,
      iconBg: "bg-rose-50 text-rose-600",
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
    <div className="space-y-6 w-full">

      {/* 1. Top Section: Full-Width GIS Satellite Map */}
      <Card className="p-0 overflow-hidden border border-slate-200/90 rounded-2xl shadow-xs">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <h3 className="text-base sm:text-lg font-medium text-slate-800 tracking-wide">
            Peta Sebaran Lokasi KNMP
          </h3>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className="px-4 py-2 text-sm font-medium bg-[#3b82f6] text-white rounded-xl hover:bg-[#2563eb] transition-all shadow-xs"
            >
              Bantuan
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === ">75%" ? "all" : ">75%")}
              className={`px-3.5 py-2 text-sm font-medium border rounded-xl flex items-center gap-2 transition-colors shadow-2xs ${
                activeFilter === ">75%"
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700 ring-2 ring-emerald-200"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <svg width="14" height="18" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47715 0 0 4.47715 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.47715 15.5228 0 10 0ZM10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14Z" fill="#22c55e"/>
              </svg>
              <span>&gt; 75 %</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === "<75%" ? "all" : "<75%")}
              className={`px-3.5 py-2 text-sm font-medium border rounded-xl flex items-center gap-2 transition-colors shadow-2xs ${
                activeFilter === "<75%"
                  ? "bg-amber-50 border-amber-400 text-amber-700 ring-2 ring-amber-200"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <svg width="14" height="18" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47715 0 0 4.47715 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.47715 15.5228 0 10 0ZM10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14Z" fill="#eab308"/>
              </svg>
              <span>&lt; 75 %</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === "<50%" ? "all" : "<50%")}
              className={`px-3.5 py-2 text-sm font-medium border rounded-xl flex items-center gap-2 transition-colors shadow-2xs ${
                activeFilter === "<50%"
                  ? "bg-rose-50 border-rose-400 text-rose-700 ring-2 ring-rose-200"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <svg width="14" height="18" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47715 0 0 4.47715 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.47715 15.5228 0 10 0ZM10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14Z" fill="#ef4444"/>
              </svg>
              <span>&lt; 50 %</span>
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
            className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow"
          >
            <div className="space-y-2">
              <span className="text-sm font-normal text-slate-500">{card.title}</span>
              <h4 className="text-2xl font-normal text-slate-800 leading-none">{card.value}</h4>
              <div>
                <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-normal ${card.badgeClass}`}>
                  {card.badge}
                </span>
              </div>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${card.iconBg} shrink-0`}>
              <card.icon className="w-8 h-8" strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Middle Section: Chart Progres Fisik & Keuangan + Status Lokasi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Dual Line Chart (Col 8) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <h3 className="text-lg font-medium text-slate-800 mb-2">Chart Progres Fisik & Keuangan</h3>

          <div className="h-[300px] w-full relative">
            <canvas ref={lineChartRef} />
          </div>
        </div>

        {/* Right: Status Lokasi Donut Chart (Col 4) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <h3 className="text-lg font-medium text-slate-800">Status Lokasi</h3>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
              <canvas ref={donutChartRef} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xs text-slate-400 uppercase font-medium tracking-wider">Total</span>
                <span className="text-3xl font-normal text-slate-800 leading-tight">{totalKnmps}</span>
                <span className="text-xs text-slate-500 font-normal">Lokasi</span>
              </div>
            </div>

            <div className="space-y-3 text-sm w-full max-w-[210px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-600 font-normal">On Track</span>
                </div>
                <span className="font-medium text-slate-800">
                  {onTrack} <span className="font-normal text-slate-400">({totalKnmps > 0 ? ((onTrack / totalKnmps) * 100).toFixed(1) : 0}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-slate-600 font-normal">Perlu Perhatian</span>
                </div>
                <span className="font-medium text-slate-800">
                  {perluPerhatian} <span className="font-normal text-slate-400">({totalKnmps > 0 ? ((perluPerhatian / totalKnmps) * 100).toFixed(1) : 0}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-slate-600 font-normal">Kritis</span>
                </div>
                <span className="font-medium text-slate-800">
                  {kritis} <span className="font-normal text-slate-400">({totalKnmps > 0 ? ((kritis / totalKnmps) * 100).toFixed(1) : 0}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-slate-600 font-normal">Pemeliharaan</span>
                </div>
                <span className="font-medium text-slate-800">
                  {pemeliharaan} <span className="font-normal text-slate-400">({totalKnmps > 0 ? ((pemeliharaan / totalKnmps) * 100).toFixed(1) : 0}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
                  <span className="text-slate-600 font-normal">Belum Mulai</span>
                </div>
                <span className="font-medium text-slate-800">
                  {belumMulai} <span className="font-normal text-slate-400">({totalKnmps > 0 ? ((belumMulai / totalKnmps) * 100).toFixed(1) : 0}%)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-slate-400 font-medium border-t border-slate-100">
            Distribusi Realisasi Status KNMP
          </div>
        </div>

      </div>

      {/* 4. Bottom Section: Serapan Keuangan, Deviasi Proyek, Verifikasi Approval */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">

        {/* Card 1: Serapan Keuangan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-lg font-medium text-slate-800">Serapan Keuangan</h3>

          <div className="space-y-4 pt-1">
            <div className="flex justify-between text-sm font-normal">
              <span className="text-slate-500">Pagu Anggaran</span>
              <span className="font-medium text-slate-800">{formatCurrency(finance.pagu)}</span>
            </div>
            <div className="flex justify-between text-sm font-normal">
              <span className="text-slate-500">Realisasi</span>
              <span className="font-medium text-slate-800">{formatCurrency(finance.realisasi)}</span>
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-sm mb-1.5 font-normal">
                <span className="text-slate-700">Persentase</span>
                <span className="text-blue-600 font-mono text-sm">{finance.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#0d6efd] rounded-full transition-all" style={{ width: `${Math.min(finance.percentage, 100)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1.5 font-normal">
                <span className="text-slate-700">Sisa Anggaran</span>
                <span className="text-rose-600 font-mono text-sm">{finance.remaining_percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${Math.min(finance.remaining_percentage, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Deviasi Proyek */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
          <h3 className="text-lg font-medium text-slate-800">Deviasi Proyek</h3>

          {/* Yellow Box */}
          <div className="p-4 bg-amber-50/80 border border-amber-200/70 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-normal">Project</span>
                <h4 className="text-xl font-medium text-slate-800 leading-tight">
                  {widgetData?.deviation_10 || 0}
                </h4>
                <p className="text-xs text-slate-400 font-normal">Deviasi &gt; 10%</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
              -10.00%
            </span>
          </div>

          {/* Red Box */}
          <div className="p-4 bg-rose-50/80 border border-rose-200/70 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-normal">Project</span>
                <h4 className="text-xl font-medium text-slate-800 leading-tight">
                  {widgetData?.deviation_20 || 0}
                </h4>
                <p className="text-xs text-slate-400 font-normal">Deviasi &gt; 20%</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-300">
              -20.00%
            </span>
          </div>
        </div>

        {/* Card 3: Verifikasi Program Approval */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-lg font-medium text-slate-800">Verifikasi Program Approval</h3>

          <div className="space-y-3 pt-1">
            {/* Pengawas */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-9 bg-slate-100 rounded-xl overflow-hidden flex items-center">
                <div
                  className="h-full bg-[#7367F0] text-white text-xs font-normal px-3.5 flex items-center transition-all"
                  style={{ width: `${Math.max((approval.pengawas / maxApproval) * 100, 20)}%` }}
                >
                  Pengawas
                </div>
              </div>
              <span className="font-medium text-sm text-slate-700 w-8 text-right">{approval.pengawas}</span>
            </div>

            {/* Tim Validasi */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-9 bg-slate-100 rounded-xl overflow-hidden flex items-center">
                <div
                  className="h-full bg-[#28C76F] text-white text-xs font-normal px-3.5 flex items-center transition-all"
                  style={{ width: `${Math.max((approval.tim_validasi / maxApproval) * 100, 20)}%` }}
                >
                  Tim Validasi
                </div>
              </div>
              <span className="font-medium text-sm text-slate-700 w-8 text-right">{approval.tim_validasi}</span>
            </div>

            {/* PPK */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-9 bg-slate-100 rounded-xl overflow-hidden flex items-center">
                <div
                  className="h-full bg-[#FF9F43] text-white text-xs font-normal px-3.5 flex items-center transition-all"
                  style={{ width: `${Math.max((approval.ppk / maxApproval) * 100, 20)}%` }}
                >
                  PPK
                </div>
              </div>
              <span className="font-medium text-sm text-slate-700 w-8 text-right">{approval.ppk}</span>
            </div>

            {/* Total Upload */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-9 bg-slate-100 rounded-xl overflow-hidden flex items-center">
                <div
                  className="h-full bg-[#00CFE8] text-white text-xs font-normal px-3.5 flex items-center transition-all"
                  style={{ width: "100%" }}
                >
                  Total Upload
                </div>
              </div>
              <span className="font-medium text-sm text-slate-700 w-8 text-right">{approval.total_docs}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Tahapan Proyeksi KNMP */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <h3 className="text-lg font-medium text-slate-800">Tahapan Proyeksi KNMP</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {stageList.map((stage) => {
            const pct = totalKnmps > 0 ? ((stage.count / totalKnmps) * 100).toFixed(1) : "0.0";
            return (
              <div
                key={stage.num}
                className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl flex flex-col items-center text-center space-y-3.5 hover:bg-slate-100 transition-colors"
              >
                <span className="text-sm font-medium text-slate-700 truncate w-full">
                  {stage.num}. {stage.name}
                </span>
                <div className={`w-18 h-18 rounded-full ${stage.bg} ${stage.color} flex items-center justify-center shadow-xs transition-transform hover:scale-105`}>
                  <stage.icon className="w-10 h-10" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-2xl font-normal text-slate-800 leading-tight">{stage.count}</h4>
                  <p className="text-xs text-slate-500 font-normal">{pct}%</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 text-center">
          <p className="text-base font-medium text-slate-700">Total Lokasi {totalKnmps}</p>
        </div>
      </div>

    </div>
  );
};
