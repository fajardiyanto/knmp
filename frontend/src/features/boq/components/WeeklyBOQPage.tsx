import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Gauge,
  Pencil,
  PieChart,
  Plus,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { useAlert } from "../../../context/AlertContext";
import { formatDate } from "../../../lib/utils";
import { useAuth } from "../../auth/hooks/useAuth";
import { fetchKnmpList } from "../../knmp/api";
import {
  deleteWeeklyBOQ,
  fetchWeeklyBOQDetail,
  fetchWeeklyBOQList,
  fetchWeeklyBOQStats,
  updateWeeklyBOQStatus,
} from "../api";
import type { WeeklyBOQControl } from "../types";

const formatPct = (value?: number) => `${Number(value || 0).toFixed(2)}%`;
const formatRp = (value?: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
const num = (value?: number) => Number(value || 0);

const riskClass = (risk: string) => {
  const key = risk?.toLowerCase();
  if (key === "kritis") return "bg-rose-50 text-rose-700 border-rose-200";
  if (key === "sedang") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
};

const evidenceLabel = (status: string) => {
  if (status === "complete") return "Lengkap";
  if (status === "partial") return "Sebagian";
  return "Belum Ada";
};

const statusLabel = (status?: string) => {
  if (status === "closed") return "Selesai";
  if (status === "in_review") return "Review";
  return "Open";
};

const useReportMath = (control?: WeeklyBOQControl) =>
  useMemo(() => {
    const rows = control?.items || [];
    const totalContract = rows.reduce((sum, item) => sum + num(item.contract_value), 0);
    const realizationValue = rows.reduce((sum, item) => sum + (num(item.actual_value) || (num(item.contract_value) * num(item.evidence_supported_pct)) / 100), 0);
    const planValue = totalContract;
    const itemPlanTotal = rows.reduce((sum, item) => sum + num(item.plan_pct), 0);
    const actual = control?.evidence_supported_pct || 0;
    const claim = control?.contractor_claim_pct || itemPlanTotal;
    const delta = actual - claim;
    const remaining = Math.max(totalContract - realizationValue, 0);
    const critical = rows.filter((item) => item.risk_level === "kritis" || item.deviation_pct < -5);
    const partialEvidence = rows.filter((item) => item.evidence_status !== "complete");
    return { rows, totalContract, realizationValue, planValue, itemPlanTotal, actual, claim, delta, remaining, critical, partialEvidence };
  }, [control]);

const MiniCurve: React.FC<{ plan: number; actual: number }> = ({ plan, actual }) => {
  const planY = Math.max(14, 112 - Math.min(plan, 100));
  const actualY = Math.max(14, 112 - Math.min(actual, 100));
  return (
    <svg viewBox="0 0 280 130" className="h-40 w-full">
      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line x1="30" x2="270" y1={112 - tick} y2={112 - tick} stroke="#e2e8f0" strokeWidth="1" />
          <text x="2" y={116 - tick} fontSize="9" fill="#64748b">{tick}%</text>
        </g>
      ))}
      <polyline points={`35,110 75,94 120,76 165,54 215,${planY} 265,${planY - 4}`} fill="none" stroke="#2563eb" strokeWidth="3" />
      <polyline points={`35,112 75,102 120,88 165,68 215,${actualY} 265,${actualY - 2}`} fill="none" stroke="#16a34a" strokeWidth="3" />
      <polyline points="35,116 265,102" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="7 6" />
      <circle cx="215" cy={planY} r="4" fill="#2563eb" />
      <circle cx="215" cy={actualY} r="4" fill="#16a34a" />
    </svg>
  );
};

export const WeeklyBOQPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useAlert();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedKnmp, setSelectedKnmp] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedControlId, setSelectedControlId] = useState<number | null>(null);

  const filterParams = useMemo(
    () => ({ search, status: selectedStatus, knmp_id: selectedKnmp, start_date: startDate, end_date: endDate }),
    [search, selectedStatus, selectedKnmp, startDate, endDate]
  );

  const { data: controls = [], isLoading } = useQuery({
    queryKey: ["weekly-boq", filterParams],
    queryFn: () => fetchWeeklyBOQList(filterParams),
  });
  const { data: stats } = useQuery({
    queryKey: ["weekly-boq-stats", filterParams],
    queryFn: () => fetchWeeklyBOQStats(filterParams),
  });
  const { data: knmpOptions = [] } = useQuery({
    queryKey: ["knmp-options-boq"],
    queryFn: () => fetchKnmpList(),
  });
  const { data: selectedControl } = useQuery({
    queryKey: ["weekly-boq-detail", selectedControlId],
    queryFn: () => fetchWeeklyBOQDetail(selectedControlId!),
    enabled: selectedControlId !== null,
  });

  const activeControls = Array.isArray(controls) ? controls : [];

  useEffect(() => {
    if (activeControls.length === 0) {
      if (selectedControlId !== null) setSelectedControlId(null);
      return;
    }
    if (!selectedControlId || !activeControls.some((control) => control.id === selectedControlId)) {
      setSelectedControlId(activeControls[0].id);
    }
  }, [activeControls, selectedControlId]);

  const report = useReportMath(selectedControl);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateWeeklyBOQStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-boq"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-boq-detail"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-boq-stats"] });
      showAlert({ title: "Status Diperbarui", message: "Status kontrol BOQ berhasil disimpan.", type: "success" });
    },
    onError: (err: any) => showAlert({ title: "Gagal", message: err.message || "Gagal memperbarui status BOQ.", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWeeklyBOQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-boq"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-boq-stats"] });
      setSelectedControlId(null);
      showAlert({ title: "Berhasil Dihapus", message: "Data BOQ weekly berhasil dihapus.", type: "success" });
    },
    onError: (err: any) => showAlert({ title: "Gagal Menghapus", message: err.message || "Gagal menghapus data BOQ.", type: "error" }),
  });

  const topGaps = [...report.rows].sort((a, b) => a.deviation_pct - b.deviation_pct).slice(0, 5);

  return (
    <div className="w-full pb-10 text-slate-900">
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari titik, dokumen, item BOQ..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <SearchableSelect value={selectedKnmp} onChange={setSelectedKnmp} options={[{ value: "", label: "Semua Titik KNMP" }, ...knmpOptions.map((k) => ({ value: String(k.id), label: k.name }))]} placeholder="Semua Titik KNMP" searchPlaceholder="Cari titik..." className="w-full sm:w-64" />
          <SearchableSelect value={selectedStatus} onChange={setSelectedStatus} options={[{ value: "", label: "Semua Status" }, { value: "open", label: "Open" }, { value: "in_review", label: "Review" }, { value: "closed", label: "Selesai" }]} placeholder="Semua Status" searchPlaceholder="Cari status..." className="w-full sm:w-44" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none" />
        </div>
        <button type="button" onClick={() => navigate("/boq-weekly/create")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Input BOQ Mingguan
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Kontrol BOQ", value: stats?.total_controls || 0, icon: FileSpreadsheet, tone: "text-blue-600 bg-blue-50" },
          { label: "Rata-rata Claim", value: formatPct(stats?.avg_claim_pct), icon: Gauge, tone: "text-violet-600 bg-violet-50" },
          { label: "Verified", value: formatPct(stats?.avg_verified_pct), icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
          { label: "Item Kritis", value: stats?.critical_items || 0, icon: AlertTriangle, tone: "text-rose-600 bg-rose-50" },
          { label: "Audit Exposure", value: formatRp(stats?.total_exposure_value), icon: ClipboardCheck, tone: "text-amber-600 bg-amber-50" },
        ].map((card) => (
          <div key={card.label} className="flex min-h-[92px] items-start justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">{card.label}</p>
              <p className="mt-2 truncate text-lg font-black text-slate-950">{card.value}</p>
            </div>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tone}`}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-black text-slate-900">Daftar Laporan BOQ</h2>
            <p className="mt-1 text-xs text-slate-500">{activeControls.length} laporan pada filter aktif</p>
          </div>
          <div className="max-h-[720px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-400">Memuat data BOQ...</div>
            ) : activeControls.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">Belum ada laporan BOQ.</div>
            ) : (
              activeControls.map((control) => (
                <button key={control.id} type="button" onClick={() => setSelectedControlId(control.id)} className={`w-full border-b border-slate-100 p-4 text-left transition-colors hover:bg-slate-50 ${selectedControlId === control.id ? "bg-blue-50" : "bg-white"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-xs font-black text-slate-900">{control.title}</h3>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${control.critical_items > 0 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{control.critical_items > 0 ? "Risk" : "OK"}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{control.knmp_name || "Titik KNMP"} - {formatDate(control.week_start)}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        {!selectedControl ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">Pilih laporan BOQ atau buat input baru.</section>
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 p-5 text-white">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wide text-blue-100">
                    <span className="rounded-md bg-white/10 px-2 py-1">SIMANDOR 360</span>
                    <span>Laporan Mingguan</span>
                  </div>
                  <h1 className="text-xl font-black leading-tight md:text-2xl">Laporan Pemantauan Progress Berbasis BOQ</h1>
                  <p className="mt-2 text-sm text-blue-50">Periode: {formatDate(selectedControl.week_start)} s.d. {formatDate(selectedControl.week_end)} - Titik: {selectedControl.knmp_name || "-"}</p>
                  <p className="mt-1 text-xs text-blue-100">{selectedControl.regency_name || "-"}, {selectedControl.province_name || "-"}</p>
                </div>
                <div className="grid min-w-[230px] grid-cols-2 gap-2 rounded-xl border border-white/15 bg-white/10 p-3 text-xs">
                  <div><p className="text-blue-100">Status Proyek</p><p className="mt-1 font-black text-emerald-200">{report.critical.length > 0 ? "PERLU AKSI" : "ON TRACK"}</p></div>
                  <div><p className="text-blue-100">Risiko</p><p className="mt-1 font-black text-amber-200">{report.critical.length > 0 ? "SEDANG" : "RENDAH"}</p></div>
                  {hasPermission("boq_update") && (
                    <button type="button" onClick={() => navigate(`/boq-weekly/create?edit=${selectedControl.id}`)} className="col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 font-bold text-blue-700 hover:bg-blue-50">
                      <Pencil className="h-4 w-4" /> Edit Laporan
                    </button>
                  )}
                  <button type="button" onClick={() => showConfirm({ title: "Hapus BOQ Weekly", message: `Hapus "${selectedControl.title}" beserta item BOQ-nya?`, confirmText: "Hapus", isDestructive: true, onConfirm: () => deleteMutation.mutate(selectedControl.id) })} className="col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-rose-500 px-3 py-2 font-bold text-white hover:bg-rose-600">
                    <Trash2 className="h-4 w-4" /> Hapus Laporan
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 lg:p-5">
              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                {[
                  { label: "Laporan Kemajuan", value: formatPct(report.claim), helper: formatRp(report.planValue), icon: Gauge },
                  { label: "Hasil Cek Fisik", value: formatPct(report.actual), helper: formatRp(report.realizationValue), icon: BarChart3 },
                  { label: "Selisih Kurang", value: formatPct(report.delta), helper: formatRp(report.realizationValue - report.planValue), icon: TrendingDown },
                  { label: "Claim Kontraktor", value: formatPct(report.claim), helper: "Versi laporan", icon: Target },
                  { label: "Total Nilai Lampiran", value: formatRp(report.totalContract), helper: "Jumlah harga laporan", icon: ClipboardCheck },
                  { label: "Sisa Kontrak", value: formatRp(report.remaining), helper: `${formatPct(report.totalContract ? (report.remaining / report.totalContract) * 100 : 0)}`, icon: PieChart },
                ].map((card) => (
                  <div key={card.label} className="min-h-[110px] rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase text-blue-950">{card.label}</p>
                        <p className={`mt-2 truncate text-xl font-black ${card.label === "Selisih Bobot" && report.delta < 0 ? "text-rose-600" : "text-slate-950"}`}>{card.value}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">{card.helper}</p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><card.icon className="h-5 w-5" /></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_360px]">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-black text-blue-950">Pemantauan Progress Berbasis BOQ</h2>
                    <span className="text-xs font-bold text-slate-500">{report.rows.length} item pekerjaan</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-[1180px] w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase text-slate-600">
                        <tr>
                          <th rowSpan={2} className="border-b border-r border-slate-200 px-3 py-3">No</th>
                          <th rowSpan={2} className="border-b border-r border-slate-200 px-3 py-3">Uraian Pekerjaan</th>
                          <th rowSpan={2} className="border-b border-r border-slate-200 px-3 py-3">Sat</th>
                          <th rowSpan={2} className="border-b border-r border-slate-200 px-3 py-3 text-right">Bobot Kontrak</th>
                          <th colSpan={2} className="border-b border-r border-slate-200 bg-blue-600 px-3 py-2 text-center text-white">Laporan Kemajuan Pekerjaan</th>
                          <th colSpan={2} className="border-b border-r border-slate-200 bg-emerald-600 px-3 py-2 text-center text-white">Hasil Cek Fisik</th>
                          <th colSpan={2} className="border-b border-r border-slate-200 bg-rose-600 px-3 py-2 text-center text-white">Selisih Kurang</th>
                          <th rowSpan={2} className="border-b border-r border-slate-200 px-3 py-3 text-center">Evidence</th>
                          <th rowSpan={2} className="border-b border-slate-200 px-3 py-3 text-center">Risiko</th>
                        </tr>
                        <tr>
                          <th className="border-b border-r border-slate-200 px-3 py-2 text-right">Bobot</th><th className="border-b border-r border-slate-200 px-3 py-2 text-right">Nilai</th>
                          <th className="border-b border-r border-slate-200 px-3 py-2 text-right">Bobot</th><th className="border-b border-r border-slate-200 px-3 py-2 text-right">Nilai</th>
                          <th className="border-b border-r border-slate-200 px-3 py-2 text-right">Bobot</th><th className="border-b border-r border-slate-200 px-3 py-2 text-right">Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.rows.map((item, index) => {
                          const planValue = num(item.contract_value);
                          const actualValue = num(item.actual_value) || (num(item.contract_value) * num(item.evidence_supported_pct)) / 100;
                          const diffValue = actualValue - planValue;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/70">
                              <td className="border-r border-slate-100 px-3 py-3 text-center font-bold">{index + 1}</td>
                              <td className="border-r border-slate-100 px-3 py-3"><p className="font-black text-slate-900">{item.item_name}</p><p className="mt-1 text-[11px] text-slate-500">{item.item_code} {item.notes ? `- ${item.notes}` : ""}</p></td>
                              <td className="border-r border-slate-100 px-3 py-3 text-center">{item.unit}</td>
                              <td className="border-r border-slate-100 px-3 py-3 text-right font-bold">{formatPct(item.weight_pct)}</td>
                              <td className="border-r border-slate-100 px-3 py-3 text-right">{formatPct(item.plan_pct)}</td>
                              <td className="border-r border-slate-100 px-3 py-3 text-right">{formatRp(planValue)}</td>
                              <td className="border-r border-slate-100 px-3 py-3 text-right font-bold text-emerald-700">{formatPct(item.evidence_supported_pct)}</td>
                              <td className="border-r border-slate-100 px-3 py-3 text-right">{formatRp(actualValue)}</td>
                              <td className={`border-r border-slate-100 px-3 py-3 text-right font-black ${item.deviation_pct < 0 ? "text-rose-600" : "text-emerald-700"}`}>{formatPct(item.deviation_pct)}</td>
                              <td className={`border-r border-slate-100 px-3 py-3 text-right font-bold ${diffValue < 0 ? "text-rose-600" : "text-emerald-700"}`}>{formatRp(diffValue)}</td>
                              <td className="border-r border-slate-100 px-3 py-3 text-center"><span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600">{evidenceLabel(item.evidence_status)}</span></td>
                              <td className="px-3 py-3 text-center"><span className={`rounded-full border px-2 py-1 text-[11px] font-black ${riskClass(item.risk_level)}`}>{item.risk_level}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-black text-blue-950">Kurva S Bobot Kumulatif</h3>
                    <MiniCurve plan={report.claim} actual={report.actual} />
                    <div className="flex gap-4 text-xs font-bold text-slate-600"><span className="text-blue-600">Laporan {formatPct(report.claim)}</span><span className="text-emerald-600">Cek fisik {formatPct(report.actual)}</span></div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-black text-blue-950">Top 5 Selisih Bobot Terbesar</h3>
                    <div className="space-y-2">
                      {topGaps.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-[22px_1fr_auto] gap-2 text-xs"><span className="font-black text-slate-400">{index + 1}.</span><span className="truncate font-semibold text-slate-700">{item.item_name}</span><span className={item.deviation_pct < 0 ? "font-black text-rose-600" : "font-black text-emerald-700"}>{formatPct(item.deviation_pct)}</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-black text-blue-950">Status Issue / Temuan</h3>
                    <div className="space-y-2">
                      {(report.critical.length ? report.critical : report.partialEvidence.slice(0, 3)).map((item) => (
                        <div key={item.id} className="rounded-lg bg-slate-50 p-3 text-xs"><p className="font-black text-slate-900">{item.item_code} - {item.item_name}</p><p className="mt-1 text-slate-500">{item.notes || `Evidence ${evidenceLabel(item.evidence_status).toLowerCase()}, deviasi ${formatPct(item.deviation_pct)}.`}</p></div>
                      ))}
                      {report.critical.length === 0 && report.partialEvidence.length === 0 && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">Tidak ada temuan kritis pada item BOQ.</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-2">
                  <h3 className="mb-3 text-sm font-black text-blue-950">Dokumentasi Evidence Minggu Ini</h3>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {report.rows.slice(0, 4).map((item) => (
                      <div key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-sky-100 to-emerald-100 text-blue-700"><FileSpreadsheet className="h-8 w-8" /></div>
                        <div className="p-2"><p className="truncate text-[11px] font-black text-slate-900">{item.item_name}</p><p className="mt-1 text-[10px] font-bold text-emerald-600">{evidenceLabel(item.evidence_status)}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-black text-blue-950">Rekomendasi & Tindak Lanjut</h3>
                  <ul className="space-y-2 text-xs font-semibold text-slate-600">
                    <li>Lengkapi evidence untuk item dengan status sebagian atau belum ada.</li>
                    <li>Verifikasi ulang volume item yang memiliki deviasi negatif terbesar.</li>
                    <li>Pastikan klaim kontraktor selaras dengan progres terpasang di lapangan.</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-black text-blue-950">Checklist Itjen</h3>
                  {["Data akurat dan valid", "Evidence lengkap", "Audit trail otomatis", "Laporan siap audit"].map((label) => (
                    <div key={label} className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><ShieldCheck className="h-4 w-4 text-emerald-600" />{label}</div>
                  ))}
                  <button type="button" className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" /> Ekspor Laporan</button>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="text-xs font-black uppercase text-slate-500">Ringkasan Naratif</p><p className="mt-2 text-sm leading-relaxed text-slate-700">{selectedControl.summary || "Belum ada ringkasan naratif."}</p>{selectedControl.source_document && <p className="mt-2 text-xs font-semibold text-slate-500">Sumber: {selectedControl.source_document}</p>}</div>
                  <div className="flex items-center gap-2">
                    {["open", "in_review", "closed"].map((status) => (
                      <button key={status} type="button" onClick={() => statusMutation.mutate({ id: selectedControl.id, status })} className={`rounded-lg border px-3 py-2 text-xs font-black ${selectedControl.status === status ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}>{statusLabel(status)}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

    </div>
  );
};
