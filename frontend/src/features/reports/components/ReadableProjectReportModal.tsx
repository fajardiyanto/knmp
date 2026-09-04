import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Calendar,
  Camera,
  CheckCircle,
  ClipboardList,
  FileText,
  MapPin,
  Printer,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";

interface WeeklyProgressRekapItem {
  no: number;
  uraian: string;
  lokasi: number;
  minggu_lalu: number;
  minggu_ini: number;
  kumulatif: number;
  keterangan: string;
}

interface WeeklyIssueItem {
  no: number;
  deskripsi: string;
  lokasi: string;
  penyebab: string;
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
  progress_rekap: WeeklyProgressRekapItem[];
  progress_total_lalu: number;
  progress_total_ini: number;
  progress_total_kumulatif: number;
  laporan_lapangan: WeeklyLaporanItem[];
  issues: WeeklyIssueItem[];
  work_plans: WeeklyWorkPlanItem[];
  photos: WeeklyPhotoItem[];
  k3_kecelakaan: number;
  k3_near_miss: number;
  k3_pelatihan: number;
  k3_kepatuhan_apd: number;
}

interface ReadableProjectReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num || 0);

const formatPct = (num: number) => `${Number(num || 0).toFixed(2).replace(".00", "")}%`;

const toDateInputValue = (date: Date) => date.toISOString().split("T")[0];

const getDefaultPeriod = () => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 7);

  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
  };
};

export const ReadableProjectReportModal: React.FC<ReadableProjectReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const defaultPeriod = useMemo(() => getDefaultPeriod(), []);
  const [startDate, setStartDate] = useState(defaultPeriod.start);
  const [endDate, setEndDate] = useState(defaultPeriod.end);
  const [reportData, setReportData] = useState<WeeklyPPKReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  const loadReportData = () => {
    setLoading(true);
    setErrorMsg("");
    apiFetch<WeeklyPPKReportData>(
      `/api/v1/laporan/weekly-ppk-report?type=mingguan&start_date=${startDate}&end_date=${endDate}&month=8&year=2026`
    )
      .then((data) => {
        setReportData({
          ...data,
          progress_rekap: Array.isArray(data.progress_rekap) ? data.progress_rekap : [],
          laporan_lapangan: Array.isArray(data.laporan_lapangan) ? data.laporan_lapangan : [],
          issues: Array.isArray(data.issues) ? data.issues : [],
          work_plans: Array.isArray(data.work_plans) ? data.work_plans : [],
          photos: Array.isArray(data.photos) ? data.photos : [],
        });
      })
      .catch((err) => {
        setErrorMsg(err?.message || "Gagal memuat laporan ringkas.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadReportData();
    }
  }, [isOpen, startDate, endDate]);

  const statusText = useMemo(() => {
    if (!reportData) return "";
    if (reportData.capaian_fisik_kumulatif >= 100) return "selesai";
    if (reportData.capaian_fisik_kumulatif > 0) return "berjalan";
    return "dalam persiapan";
  }, [reportData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-6xl h-[94vh] bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
        <div className="px-4 sm:px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002060] text-white flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Laporan Ringkas
              </p>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Narasi Progres Program KNMP
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent outline-none font-semibold text-slate-700"
              />
              <span className="text-slate-400">s.d.</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent outline-none font-semibold text-slate-700"
              />
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 px-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 text-xs font-bold"
              title="Cetak laporan"
            >
              <Printer className="w-4 h-4" />
              Cetak
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0">
          {loading ? (
            <div className="h-full min-h-[420px] flex items-center justify-center text-sm font-semibold text-slate-500">
              Menyiapkan laporan...
            </div>
          ) : errorMsg || !reportData ? (
            <div className="max-w-md mx-auto mt-16 bg-white border border-rose-200 rounded-xl p-5 text-center text-sm text-rose-700">
              {errorMsg || "Data laporan tidak tersedia."}
            </div>
          ) : (
            <article
              ref={reportRef}
              className="mx-auto max-w-4xl bg-white border border-slate-200 shadow-sm rounded-xl p-6 sm:p-9 space-y-7 print:shadow-none print:border-none print:rounded-none print:max-w-none"
            >
              <header className="border-b border-slate-200 pb-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#002060]">
                      Program Kampung Nelayan Merah Putih
                    </p>
                    <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
                      Laporan Progres {reportData.wilayah}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                      Periode {reportData.tanggal_awal} sampai {reportData.tanggal_akhir}. Disusun oleh {reportData.ppk_name}.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Tanggal laporan</p>
                    <p className="text-sm font-black text-slate-900">{reportData.tanggal_laporan}</p>
                    <p className="mt-2 inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 capitalize">
                      {statusText}
                    </p>
                  </div>
                </div>
              </header>

              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Metric icon={MapPin} label="Lokasi" value={`${reportData.total_lokasi}`} hint="titik KNMP" />
                <Metric icon={TrendingUp} label="Capaian Fisik" value={formatPct(reportData.capaian_fisik_kumulatif)} hint={`naik ${formatPct(reportData.progress_total_ini)}`} />
                <Metric icon={Banknote} label="Realisasi Keuangan" value={formatPct(reportData.realisasi_keuangan_pct)} hint={formatRupiah(reportData.realisasi_keuangan)} />
                <Metric icon={Users} label="Kontraktor" value={`${reportData.total_kontraktor}`} hint="penyedia aktif" />
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-black text-slate-950">Ringkasan Eksekutif</h3>
                <p className="text-[15px] leading-7 text-slate-700">
                  {reportData.ringkasan_narasi}
                </p>
                <p className="text-[15px] leading-7 text-slate-700">
                  Dari total {reportData.total_lokasi} lokasi dalam scope laporan, terdapat {reportData.lokasi_on_progress} lokasi on progress, {reportData.lokasi_selesai} lokasi selesai, {reportData.lokasi_persiapan} lokasi dalam persiapan, dan {reportData.lokasi_tertunda} lokasi memiliki kendala aktif. Nilai kontrak tercatat {formatRupiah(reportData.nilai_kontrak_kumulatif)} dengan sisa anggaran {formatRupiah(reportData.sisa_anggaran)}.
                </p>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <SectionTitle icon={ClipboardList} title="Progres Pekerjaan" />
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {reportData.progress_rekap.slice(0, 4).map((item) => (
                      <div key={item.no} className="p-3">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-bold text-slate-800">{item.uraian}</p>
                          <span className="text-sm font-black text-blue-700">{formatPct(item.kumulatif)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${Math.min(100, Math.max(0, item.kumulatif))}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500">
                          Minggu lalu {formatPct(item.minggu_lalu)}, minggu ini {formatPct(item.minggu_ini)}.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <SectionTitle icon={CheckCircle} title="Laporan Lapangan Terbaru" />
                  <div className="space-y-2">
                    {reportData.laporan_lapangan.slice(0, 4).map((lap) => (
                      <div key={lap.no} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-slate-900">{lap.nama_pelaksana}</p>
                            <p className="text-xs text-slate-500">{lap.knmp_name} - {lap.tanggal}</p>
                          </div>
                          <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                            {formatPct(lap.realisasi_progres)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{lap.keterangan || "-"}</p>
                      </div>
                    ))}
                    {reportData.laporan_lapangan.length === 0 && (
                      <EmptyText text="Belum ada laporan lapangan pada periode ini." />
                    )}
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <SectionTitle icon={AlertTriangle} title="Isu dan Tindak Lanjut" />
                  <div className="space-y-2">
                    {reportData.issues.slice(0, 3).map((issue) => (
                      <div key={issue.no} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-black text-slate-900">{issue.deskripsi}</p>
                          <span className="text-xs font-bold text-amber-700">{issue.tingkat_risiko}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{issue.lokasi} - PIC {issue.pic}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{issue.rencana_mitigasi}</p>
                      </div>
                    ))}
                    {reportData.issues.length === 0 && (
                      <EmptyText text="Tidak ada isu aktif yang tercatat pada periode ini." />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <SectionTitle icon={ShieldCheck} title="K3 dan Rencana Berikutnya" />
                  <div className="grid grid-cols-2 gap-2">
                    <K3Card label="Kecelakaan" value={`${reportData.k3_kecelakaan}`} />
                    <K3Card label="Near Miss" value={`${reportData.k3_near_miss}`} />
                    <K3Card label="Kegiatan K3" value={`${reportData.k3_pelatihan}`} />
                    <K3Card label="Kepatuhan APD" value={formatPct(reportData.k3_kepatuhan_apd)} />
                  </div>
                  <div className="border border-slate-200 rounded-lg p-3">
                    <p className="text-sm font-black text-slate-900">Rencana minggu berikutnya</p>
                    <ul className="mt-2 space-y-1.5">
                      {reportData.work_plans.slice(0, 3).map((plan) => (
                        <li key={plan.no} className="text-sm leading-6 text-slate-600">
                          {plan.no}. {plan.uraian}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <SectionTitle icon={Camera} title="Dokumentasi" />
                {reportData.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {reportData.photos.slice(0, 4).map((photo, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                          <img
                            src={photo.file_url}
                            alt={photo.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs font-semibold text-slate-600 truncate">{photo.title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyText text="Belum ada foto dokumentasi pada periode ini." />
                )}
              </section>
            </article>
          )}
        </div>
      </div>
    </div>
  );
};

const Metric = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
}) => (
  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
    <Icon className="w-5 h-5 text-[#002060]" />
    <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{hint}</p>
  </div>
);

const SectionTitle = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-[#002060]" />
    <h3 className="text-base font-black text-slate-950">{title}</h3>
  </div>
);

const K3Card = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <p className="text-xs font-bold text-slate-500">{label}</p>
    <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
  </div>
);

const EmptyText = ({ text }: { text: string }) => (
  <div className="border border-dashed border-slate-300 rounded-lg p-4 text-sm text-slate-500 bg-slate-50">
    {text}
  </div>
);
