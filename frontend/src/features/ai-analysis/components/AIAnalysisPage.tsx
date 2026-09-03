import React from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileSearch,
  FileText,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useAlert } from "../../../context/AlertContext";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { fetchUserList } from "../../users/api";
import { createAIAnalysis, deleteAIAnalysis, fetchAIAnalyses, fetchAIAnalysisStats, updateAIAnalysisStatus } from "../api";
import type { AIAnalysis } from "../types";

const riskClass: Record<string, string> = {
  rendah: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sedang: "bg-amber-50 text-amber-700 border-amber-200",
  tinggi: "bg-rose-50 text-rose-700 border-rose-200",
};

const metricToneClass: Record<string, string> = {
  slate: "bg-slate-50 text-slate-600",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
};

type AnalysisMetadata = {
  engine?: string;
  provider_status?: string;
  document_type?: string;
  is_knmp_related?: boolean;
  document_valid?: boolean;
  text_readable?: boolean;
  validation_note?: string;
  target_module?: string;
  draft_input?: Record<string, any>;
  extracted_facts?: string[];
};

export const AIAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const [search, setSearch] = React.useState("");
  const [riskFilter, setRiskFilter] = React.useState("");
  const [form, setForm] = React.useState({
    title: "",
    model_provider: "rule_based",
    assigned_user_id: "",
    input_text: "",
  });
  const [file, setFile] = React.useState<File | null>(null);

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ["ai-analyses", search, riskFilter],
    queryFn: () => fetchAIAnalyses({ search, risk_level: riskFilter }),
  });

  const { data: stats } = useQuery({
    queryKey: ["ai-analysis-stats"],
    queryFn: fetchAIAnalysisStats,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users-options-ai"],
    queryFn: () => fetchUserList(),
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("source_channel", "web");
      payload.append("model_provider", form.model_provider);
      payload.append("input_text", form.input_text);
      if (form.assigned_user_id) payload.append("assigned_user_id", form.assigned_user_id);
      if (file) payload.append("file", file);
      return createAIAnalysis(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-analyses"] });
      queryClient.invalidateQueries({ queryKey: ["ai-analysis-stats"] });
      setForm((prev) => ({ ...prev, title: "", input_text: "" }));
      setFile(null);
      showAlert({
        type: "success",
        title: "Scan Berhasil",
        message: "Input sudah dianalisis, titik KNMP dibaca otomatis jika ditemukan.",
      });
    },
    onError: (err: any) => {
      showAlert({
        type: "error",
        title: "Scan Gagal",
        message: err.message || "Gagal menganalisis input.",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AIAnalysis["status"] }) =>
      updateAIAnalysisStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-analyses"] });
      queryClient.invalidateQueries({ queryKey: ["ai-analysis-stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAIAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-analyses"] });
      queryClient.invalidateQueries({ queryKey: ["ai-analysis-stats"] });
      showAlert({
        type: "success",
        title: "Dokumen Dihapus",
        message: "Hasil scan dokumen sudah dihapus dari daftar.",
      });
    },
    onError: (err: any) => {
      showAlert({
        type: "error",
        title: "Gagal Menghapus",
        message: err.message || "Dokumen gagal dihapus.",
      });
    },
  });

  const canSubmit = form.input_text.trim() || file;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">AI Scan & Anomali Dokumen</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Scan dokumen, teks, dan foto lapangan. Titik KNMP serta sumber kanal dibaca otomatis dari input yang masuk.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Bot className="h-4 w-4 text-blue-600" />
          AI Summary aktif
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Total Scan" value={stats?.total ?? 0} icon={FileSearch} />
        <Metric label="Risiko Tinggi" value={stats?.high_risk ?? 0} icon={AlertTriangle} tone="rose" />
        <Metric label="Risiko Sedang" value={stats?.medium_risk ?? 0} icon={AlertTriangle} tone="amber" />
        <Metric label="Perlu Review" value={stats?.needs_review ?? 0} icon={Search} tone="blue" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Input Scan</h2>
          </div>

          <div className="space-y-4">
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Judul scan / nama dokumen"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            />

            <select
              value={form.model_provider}
              onChange={(e) => setForm((prev) => ({ ...prev, model_provider: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="rule_based">Auto Lokal</option>
              <option value="codex">Codex / OpenAI</option>
              <option value="deepseek">DeepSeek</option>
              <option value="gemini">Gemini</option>
              <option value="claude">Claude</option>
            </select>

            <SearchableSelect
              value={form.assigned_user_id}
              onChange={(value) => setForm((prev) => ({ ...prev, assigned_user_id: value }))}
              placeholder="Pilih user penanggung jawab"
              options={users.map((u: any) => ({ value: String(u.id), label: `${u.name} - ${u.email}` }))}
            />

            <textarea
              value={form.input_text}
              onChange={(e) => setForm((prev) => ({ ...prev, input_text: e.target.value }))}
              placeholder="Tempel isi dokumen, caption foto, atau laporan. Contoh: KNMP Batee Shoek tanggal 31/08 progres 40% realisasi 20% ada kendala material."
              rows={7}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            />

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950">
              <UploadCloud className="mb-2 h-6 w-6" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {file ? file.name : "Upload foto, PDF, atau teks"}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.txt,.csv,.md"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              Kanal input tetap otomatis dari sumber data. Jika API key provider tersedia, AI membaca dokumen dan menulis summary; jika tidak, sistem memakai analisa lokal sebagai cadangan.
            </div>

            <button
              type="button"
              disabled={!canSubmit || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Analisa Sekarang
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul, teks, atau titik KNMP"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">Semua Risiko</option>
              <option value="tinggi">Tinggi</option>
              <option value="sedang">Sedang</option>
              <option value="rendah">Rendah</option>
            </select>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              Memuat hasil analisa...
            </div>
          ) : analyses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              Belum ada hasil scan.
            </div>
          ) : (
            analyses.map((item) => {
              const metadata = parseMetadata(item.metadata);
              const isValid = metadata.document_valid === true && Boolean(item.knmp_id);
              const draftEntries = Object.entries(metadata.draft_input || {}).filter(([, value]) => value !== "" && value !== null && value !== undefined);
              return (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${riskClass[item.risk_level]}`}>
                        {item.risk_level.toUpperCase()} - {item.risk_score}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isValid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {isValid ? "Valid" : "Tidak valid"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.knmp_name || "Titik belum terdeteksi"} - {item.assigned_user_name || "Belum ditugaskan"} - {item.source_channel} - {item.model_provider}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => statusMutation.mutate({ id: item.id, status: e.target.value as AIAnalysis["status"] })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="perlu_review">Perlu review</option>
                      <option value="ditindaklanjuti">Ditindaklanjuti</option>
                      <option value="selesai">Selesai</option>
                      <option value="diabaikan">Diabaikan</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Hapus hasil scan dokumen ini?")) deleteMutation.mutate(item.id);
                      }}
                      disabled={deleteMutation.isPending}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-900 dark:bg-rose-950/40"
                      title="Hapus dokumen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm leading-relaxed text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
                  {formatSummary(item.summary, metadata)}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                    {metadata.document_type || "Jenis dokumen belum terdeteksi"}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 ${isValid ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200" : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"}`}>
                    {isValid ? `Cocok dengan ${item.knmp_name}` : metadata.validation_note || "Belum cocok dengan titik KNMP"}
                  </span>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Data Terdeteksi untuk Modul
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {formatModuleName(metadata.target_module)}
                    </span>
                  </div>
                  {metadata.target_module === "boq" && isValid && (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                      <span className="font-semibold">
                        Dokumen ini terdeteksi sebagai BOQ/progress control dan dibuat sebagai draft kontrol BOQ.
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate("/boq-weekly")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700"
                      >
                        Buka BOQ Mingguan
                      </button>
                    </div>
                  )}

                  {draftEntries.length === 0 ? (
                    <p className="text-sm text-slate-500">Belum ada field terstruktur yang bisa diambil dari file ini.</p>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2">
                      {draftEntries.map(([key, value]) => (
                        <div key={key} className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900">
                          <p className="text-[11px] font-bold uppercase text-slate-400">{formatFieldName(key)}</p>
                          <p className="mt-1 break-words text-sm font-semibold text-slate-700 dark:text-slate-200">{formatDraftValue(value)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(metadata.extracted_facts || []).length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <p className="mb-2 text-xs font-bold uppercase text-slate-500">Fakta Terbaca</p>
                      <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        {(metadata.extracted_facts || []).map((fact, idx) => (
                          <li key={`${item.id}-fact-${idx}`}>{fact}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InfoList title="Temuan Anomali" items={item.findings} />
                  <InfoList title="Rekomendasi" items={item.recommendations} icon="check" />
                </div>
              </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
};

const Metric = ({ label, value, icon: Icon, tone = "slate" }: any) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
      <div className={`rounded-xl p-3 ${metricToneClass[tone] || metricToneClass.slate}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const InfoList = ({ title, items, icon }: { title: string; items: string[]; icon?: string }) => (
  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
      {icon === "check" ? <CheckCircle2 className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
      {title}
    </div>
    <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
      {(items || []).map((item, idx) => (
        <li key={`${title}-${idx}`} className="leading-relaxed">
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const parseMetadata = (metadata?: string): AnalysisMetadata => {
  if (!metadata) return {};
  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
};

const formatModuleName = (module?: string) => {
  if (!module) return "Dokumen Umum";
  return module.replace(/_/g, " ");
};

const formatFieldName = (field: string) => field.replace(/_/g, " ");

const formatDraftValue = (value: any) => {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  const text = String(value);
  if (looksGarbled(text)) return "Teks dokumen tidak terbaca otomatis. Perlu unggah ulang PDF searchable/OCR.";
  return text;
};

const formatSummary = (summary: string | undefined, metadata: AnalysisMetadata) => {
  if (!summary) return "Belum ada summary analisa.";
  if (metadata.text_readable === false || looksGarbled(summary)) {
    return "Dokumen berhasil diterima, tetapi teks file tidak dapat dibaca dengan baik. Kemungkinan PDF berupa scan gambar, memakai encoding yang tidak terbaca, atau file korup. Unggah ulang PDF searchable/OCR atau tambahkan caption yang memuat titik KNMP, tanggal, progres, dan keterangan utama.";
  }
  return summary;
};

const looksGarbled = (value: string) => {
  if (!value) return false;
  const weirdChars = value.match(/[^\x09\x0A\x0D\x20-\x7EÀ-ÿ]/g)?.length || 0;
  const suspicious = value.match(/[ÏÐÝÚÛ]/g)?.length || 0;
  return weirdChars + suspicious > Math.max(4, value.length * 0.03);
};
