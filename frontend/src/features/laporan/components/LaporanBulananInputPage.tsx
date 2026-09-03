import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Printer,
  Plus,
  Trash2,
  Camera,
  Building2,
  FileSpreadsheet,
  ShieldCheck,
  CheckSquare,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { useAlert } from "../../../context/AlertContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { createLaporan, updateLaporan, fetchLaporanDetail } from "../api";
import { FormatBulananPrintView } from "./FormatBulananPrintView";
import type {
  LaporanBulananData,
  LaporanBulananFasilitas,
  LaporanBulananRingkasanBoQ,
  LaporanBulananDetailBoQ,
  LaporanBulananRisiko,
  LaporanBulananFoto,
} from "../types";

const DEFAULT_10_FASILITAS: string[] = [
  "Dermaga/tambatan",
  "Gudang beku/cold storage",
  "Pabrik es/sarana dingin",
  "Shelter pendaratan ikan",
  "Sentra/pasar/pengolahan ikan",
  "Bengkel kapal/jaring",
  "SPBN/SPBUN",
  "Kantor pengelola/kios/logistik",
  "Utilitas listrik-air-drainase",
  "Akses jalan & lingkungan",
];

const DEFAULT_8_KELOMPOK_BOQ: string[] = [
  "Persiapan & K3/SMKK",
  "Pekerjaan tanah/lahan",
  "Struktur/revetment/DPT",
  "Bangunan gedung/fasilitas",
  "MEP/utilitas",
  "Jalan, drainase, lingkungan",
  "Pengadaan/instalasi sarana",
  "Lain-lain/addendum",
];

const DEFAULT_6_ASPEK_RISIKO: string[] = [
  "Kurva-S/jadwal",
  "Pembayaran/termin",
  "Perubahan kontrak",
  "Mutu/QC/NCR",
  "K3 & lingkungan",
  "Readiness operasional",
];

const initialData = (): LaporanBulananData => ({
  bulan_tahun: new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date()),
  bulan_kontrak_ke: "1",
  status_proyek: "On Track",
  identitas_acuan: {
    paket_pekerjaan: "",
    lokasi: "",
    jenis_titik: "HUB",
    no_kontrak_spmk: "",
    kontraktor: "",
    pengawas_ppk: "",
    rencana_kum_pct: 0,
    aktual_kum_pct: 0,
    deviasi_pct: 0,
    termin_keuangan: "Termin 1 (25%)",
  },
  checklist_fasilitas: DEFAULT_10_FASILITAS.map((f, i) => ({
    no: i + 1,
    fasilitas: f,
    lingkup: "Ya",
    status: "Proses",
    catatan: "",
  })),
  ringkasan_boq: DEFAULT_8_KELOMPOK_BOQ.map((k, i) => ({
    no: i + 1,
    kelompok_boq: k,
    nilai_kontrak: 0,
    bobot_pct: 0,
    renc_kum_pct: 0,
    akt_kum_pct: 0,
    deviasi_pct: 0,
    keterangan: "",
  })),
  detail_boq: [
    {
      no: 1,
      kode_boq: "DIV-1.1",
      area: "Dermaga",
      uraian: "Pemasangan tiang pancang baja & capping beam",
      bobot_pct: 12.5,
      akt_kum_pct: 10.2,
      nilai_realisasi: 151470000,
      termin_mc: "MC-01",
      deviasi_pct: -2.3,
      catatan: "Menunggu pasang surut air laut",
    },
  ],
  matriks_risiko: DEFAULT_6_ASPEK_RISIKO.map((a, i) => ({
    no: i + 1,
    aspek: a,
    kondisi_bulan_ini: "Berjalan normal sesuai rencana",
    risiko_deviasi: "Risiko rendah",
    tindak_lanjut: "Pemantauan rutin dan percepatan shift kerja",
    pic_target: "Site Manager",
  })),
  dokumentasi_foto: [1, 2, 3, 4].map((slot) => ({
    slot,
    file_url: "",
    kode_boq_area: "",
    tanggal: new Date().toISOString().split("T")[0],
    keterangan: "",
  })),
  pengesahan: {
    pembuat_nama: "",
    pembuat_tanggal: new Date().toISOString().split("T")[0],
    pemeriksa_nama: "",
    pemeriksa_tanggal: new Date().toISOString().split("T")[0],
    penyetuju_nama: "",
    penyetuju_tanggal: new Date().toISOString().split("T")[0],
  },
});

export const LaporanBulananInputPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const { showAlert } = useAlert();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"identitas" | "boq" | "risiko" | "foto">("identitas");
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Selected Pelaksanaan & Basic Info
  const [pelaksanaanId, setPelaksanaanId] = useState<number | string>("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);

  // Form State (7 Sections)
  const [formData, setFormData] = useState<LaporanBulananData>(initialData);

  // Fetch Pelaksanaans for dropdown
  const { data: pelaksanaans = [] } = useQuery<any[]>({
    queryKey: ["pelaksanaan-list-all"],
    queryFn: () => apiFetch<any[]>("/api/v1/pelaksanaan"),
  });

  // If edit mode, fetch existing Laporan
  const { data: existingLaporan, isLoading: isLoadingLaporan } = useQuery({
    queryKey: ["laporan-detail-edit", id],
    queryFn: () => (id ? fetchLaporanDetail(Number(id)) : null),
    enabled: isEditMode,
  });

  // Fetch Pelaksanaan detail for autofill
  const { data: pelaksanaanDetail } = useQuery<any>({
    queryKey: ["pelaksanaan-detail-autofill", pelaksanaanId],
    queryFn: () => (pelaksanaanId ? apiFetch<any>(`/api/v1/pelaksanaan/${pelaksanaanId}`) : null),
    enabled: !!pelaksanaanId,
  });

  // Autofill from Pelaksanaan
  useEffect(() => {
    if (pelaksanaanDetail && !isEditMode) {
      const p = pelaksanaanDetail;
      const knmp = p.knmp || {};
      const persiapan = p.persiapan || {};
      const perush = p.perusahaan || persiapan.perusahaan || {};

      setFormData((prev) => ({
        ...prev,
        identitas_acuan: {
          ...prev.identitas_acuan,
          paket_pekerjaan: prev.identitas_acuan.paket_pekerjaan || p.nama || knmp.name || "",
          lokasi: prev.identitas_acuan.lokasi || knmp.regency_name || knmp.name || "",
          jenis_titik: (knmp.jenis || "HUB").toUpperCase() === "PENYANGGA" ? "PENYANGGA" : "HUB",
          no_kontrak_spmk: prev.identitas_acuan.no_kontrak_spmk || persiapan.nomor_spmk || persiapan.nomor_kontrak || "SPMK/KNMP/2026",
          kontraktor: prev.identitas_acuan.kontraktor || perush.nama || "PT. Bahari Nusantara Perkasa",
          pengawas_ppk: prev.identitas_acuan.pengawas_ppk || "PT. Ciriajasa Cipta Mandiri (Pengawas)",
        },
        pengesahan: {
          ...prev.pengesahan,
          pembuat_nama: prev.pengesahan.pembuat_nama || perush.nama || user?.name || "Kontraktor Pelaksana",
          pemeriksa_nama: prev.pengesahan.pemeriksa_nama || "Konsultan Pengawas KNMP",
          penyetuju_nama: prev.pengesahan.penyetuju_nama || "PPK Kementerian Kelautan dan Perikanan",
        },
      }));

      if (!reportTitle) {
        setReportTitle(`Laporan Bulanan Konstruksi - ${p.nama || knmp.name || ""}`);
      }
    }
  }, [pelaksanaanDetail, isEditMode]);

  // Populate form if editing
  useEffect(() => {
    if (existingLaporan) {
      setPelaksanaanId(existingLaporan.pelaksanaan_id);
      setReportTitle(existingLaporan.nama);
      setReportDate(existingLaporan.tanggal);

      if (existingLaporan.additional_data) {
        try {
          const parsed =
            typeof existingLaporan.additional_data === "string"
              ? JSON.parse(existingLaporan.additional_data)
              : existingLaporan.additional_data;

          if (parsed && typeof parsed === "object") {
            setFormData({
              ...initialData(),
              ...parsed,
              identitas_acuan: { ...initialData().identitas_acuan, ...(parsed.identitas_acuan || {}) },
              checklist_fasilitas: parsed.checklist_fasilitas?.length ? parsed.checklist_fasilitas : initialData().checklist_fasilitas,
              ringkasan_boq: parsed.ringkasan_boq?.length ? parsed.ringkasan_boq : initialData().ringkasan_boq,
              detail_boq: parsed.detail_boq || [],
              matriks_risiko: parsed.matriks_risiko?.length ? parsed.matriks_risiko : initialData().matriks_risiko,
              dokumentasi_foto: parsed.dokumentasi_foto?.length ? parsed.dokumentasi_foto : initialData().dokumentasi_foto,
              pengesahan: { ...initialData().pengesahan, ...(parsed.pengesahan || {}) },
            });
            return;
          }
        } catch (_) {}
      }

      // Fallback populate
      setFormData((prev) => ({
        ...prev,
        identitas_acuan: {
          ...prev.identitas_acuan,
          paket_pekerjaan: existingLaporan.pelaksanaan_name || existingLaporan.nama,
          rencana_kum_pct: existingLaporan.rencana_progres_fisik || 0,
          aktual_kum_pct: existingLaporan.realisasi_progres_fisik || 0,
          deviasi_pct: (existingLaporan.realisasi_progres_fisik || 0) - (existingLaporan.rencana_progres_fisik || 0),
        },
      }));
    }
  }, [existingLaporan]);

  // Auto calculate deviasi in Section 1
  useEffect(() => {
    const renc = Number(formData.identitas_acuan.rencana_kum_pct) || 0;
    const akt = Number(formData.identitas_acuan.aktual_kum_pct) || 0;
    const dev = Number((akt - renc).toFixed(2));
    if (formData.identitas_acuan.deviasi_pct !== dev) {
      setFormData((prev) => ({
        ...prev,
        identitas_acuan: { ...prev.identitas_acuan, deviasi_pct: dev },
      }));
    }
  }, [formData.identitas_acuan.rencana_kum_pct, formData.identitas_acuan.aktual_kum_pct]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!pelaksanaanId) {
        throw new Error("Pilih proyek pelaksanaan terlebih dahulu");
      }
      if (!reportTitle.trim()) {
        throw new Error("Judul laporan wajib diisi");
      }

      const payload = {
        pelaksanaan_id: Number(pelaksanaanId),
        nama: reportTitle,
        tanggal: reportDate,
        jenis_laporan: "bulanan",
        keberapa: Number(formData.bulan_kontrak_ke) || 1,
        cuaca: "cerah",
        jumlah_tenaga_kerja: 10,
        rencana_progres_fisik: formData.identitas_acuan.rencana_kum_pct || 0,
        realisasi_progres_fisik: formData.identitas_acuan.aktual_kum_pct || 0,
        keterangan: `Laporan Bulanan Bulan ke-${formData.bulan_kontrak_ke} (${formData.status_proyek})`,
        additional_data: formData,
        jenis_bangunan_details: [],
      };

      if (isEditMode && id) {
        return updateLaporan(Number(id), payload);
      }
      return createLaporan(payload);
    },
    onSuccess: () => {
      showAlert({
        title: "Berhasil Disimpan",
        message: "Format Laporan Bulanan Konstruksi KNMP berhasil disimpan.",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["laporan-list"] });
      navigate("/laporan");
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Menyimpan",
        message: err.message || "Terjadi kesalahan saat menyimpan laporan.",
        type: "error",
      });
    },
  });

  // Photo Upload Handler
  const handlePhotoUpload = (slot: number, file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showAlert({ title: "File Terlalu Besar", message: "Ukuran maksimal foto 5 MB.", type: "warning" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = typeof e.target?.result === "string" ? e.target.result : "";
      setFormData((prev) => ({
        ...prev,
        dokumentasi_foto: prev.dokumentasi_foto.map((f) =>
          f.slot === slot ? { ...f, file_url: dataUrl, file_name: file.name } : f
        ),
      }));
    };
    reader.readAsDataURL(file);
  };

  // Add & Delete Row in Detail BoQ
  const handleAddDetailBoQ = () => {
    const nextNo = formData.detail_boq.length + 1;
    setFormData((prev) => ({
      ...prev,
      detail_boq: [
        ...prev.detail_boq,
        {
          no: nextNo,
          kode_boq: `DIV-${nextNo}`,
          area: "",
          uraian: "",
          bobot_pct: 0,
          akt_kum_pct: 0,
          nilai_realisasi: 0,
          termin_mc: "MC-01",
          deviasi_pct: 0,
          catatan: "",
        },
      ],
    }));
  };

  const handleRemoveDetailBoQ = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      detail_boq: prev.detail_boq.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/laporan")}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            title="Kembali ke Daftar Laporan"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isEditMode ? "Edit Format Laporan Bulanan" : "Input Format Laporan Bulanan Konstruksi"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                Standar Resmi KKP
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Formulir 7 Bagian Resmi Monitoring Kampung Nelayan Merah Putih (KKP & Pertamina)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setShowPrintPreview(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Preview Cetak KKP (2 Halaman)</span>
          </button>

          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saveMutation.isPending ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Simpan Laporan"}</span>
          </button>
        </div>
      </div>

      {/* Subheader: Project Selection & Primary Parameters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Proyek Pelaksanaan */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Pilih Proyek Pelaksanaan <span className="text-rose-500">*</span>
            </label>
            <select
              value={pelaksanaanId}
              onChange={(e) => setPelaksanaanId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Proyek KNMP --</option>
              {pelaksanaans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Judul Laporan */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Judul Laporan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Contoh: Laporan Bulanan Konstruksi - KNMP Asahan"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Tanggal Laporan */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Tanggal Dokumen</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Bulan / Tahun */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bulan / Tahun</label>
            <input
              type="text"
              value={formData.bulan_tahun}
              onChange={(e) => setFormData({ ...formData, bulan_tahun: e.target.value })}
              placeholder="Contoh: September 2026"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Bulan Kontrak Ke- */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bulan Kontrak Ke-</label>
            <input
              type="text"
              value={formData.bulan_kontrak_ke}
              onChange={(e) => setFormData({ ...formData, bulan_kontrak_ke: e.target.value })}
              placeholder="1"
              className="w-full px-3.5 py-2 text-xs text-center font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Proyek Pill Buttons */}
          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Proyek (Evaluasi Bulanan)</label>
            <div className="grid grid-cols-3 gap-2">
              {(["On Track", "Warning", "Critical"] as const).map((st) => {
                const isSelected = formData.status_proyek === st;
                const colors = {
                  "On Track": isSelected
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300",
                  Warning: isSelected
                    ? "bg-amber-500 text-white font-bold shadow-xs"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300",
                  Critical: isSelected
                    ? "bg-rose-600 text-white font-bold shadow-xs"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300",
                };
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFormData({ ...formData, status_proyek: st })}
                    className={`px-3 py-2 rounded-xl text-xs transition-all text-center font-semibold cursor-pointer ${colors[st]}`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (4 Sections) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 overflow-x-auto">
        {[
          { id: "identitas", label: "1. Identitas & Fasilitas", icon: Building2, desc: "Info Kontrak & Checklist 10 Fasilitas" },
          { id: "boq", label: "2. Ringkasan & Detail BoQ", icon: FileSpreadsheet, desc: "8 Kelompok BoQ & Rincian MC" },
          { id: "risiko", label: "3. Risiko & Readiness", icon: ShieldCheck, desc: "6 Aspek Evaluasi K3 & Mutu" },
          { id: "foto", label: "4. Foto & Pengesahan", icon: Camera, desc: "4 Slot Foto Wajib & Tanda Tangan" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[200px] flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold cursor-pointer ${
                active
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className={`p-2 rounded-lg ${active ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold leading-none">{tab.label}</p>
                <p className="text-[11px] text-slate-400 font-normal mt-1">{tab.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Form Content Area */}
      <div className="space-y-6">
        {/* ================= TAB 1: IDENTITAS & FASILITAS ================= */}
        {activeTab === "identitas" && (
          <div className="space-y-6">
            {/* 1. Identitas dan Acuan */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">
                    1
                  </span>
                  Identitas dan Acuan Proyek
                </h3>
                <span className="text-xs text-slate-500">
                  Data otomatis sinkron dengan Kontrak & Pelaksanaan
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Paket Pekerjaan</label>
                  <input
                    type="text"
                    value={formData.identitas_acuan.paket_pekerjaan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identitas_acuan: { ...formData.identitas_acuan, paket_pekerjaan: e.target.value },
                      })
                    }
                    placeholder="Pembangunan Fasilitas KNMP..."
                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Lokasi (Desa / Kec / Kab)</label>
                  <input
                    type="text"
                    value={formData.identitas_acuan.lokasi}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identitas_acuan: { ...formData.identitas_acuan, lokasi: e.target.value },
                      })
                    }
                    placeholder="Kab. Asahan, Sumatera Utara"
                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Jenis Titik</label>
                  <div className="flex items-center gap-6 py-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="jenis_titik"
                        checked={formData.identitas_acuan.jenis_titik === "HUB"}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            identitas_acuan: { ...formData.identitas_acuan, jenis_titik: "HUB" },
                          })
                        }
                        className="text-blue-600 h-4 w-4"
                      />
                      HUB
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="jenis_titik"
                        checked={formData.identitas_acuan.jenis_titik === "PENYANGGA"}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            identitas_acuan: { ...formData.identitas_acuan, jenis_titik: "PENYANGGA" },
                          })
                        }
                        className="text-blue-600 h-4 w-4"
                      />
                      PENYANGGA
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">No. Kontrak / SPMK</label>
                  <input
                    type="text"
                    value={formData.identitas_acuan.no_kontrak_spmk}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identitas_acuan: { ...formData.identitas_acuan, no_kontrak_spmk: e.target.value },
                      })
                    }
                    placeholder="SPMK-01/KNMP/2026"
                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Kontraktor Pelaksana</label>
                  <input
                    type="text"
                    value={formData.identitas_acuan.kontraktor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identitas_acuan: { ...formData.identitas_acuan, kontraktor: e.target.value },
                      })
                    }
                    placeholder="PT. Pelaksana Konstruksi"
                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Pengawas / PPK</label>
                  <input
                    type="text"
                    value={formData.identitas_acuan.pengawas_ppk}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identitas_acuan: { ...formData.identitas_acuan, pengawas_ppk: e.target.value },
                      })
                    }
                    placeholder="Konsultan Pengawas / Tim PPK"
                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Rencana Kumulatif (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.identitas_acuan.rencana_kum_pct}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identitas_acuan: {
                          ...formData.identitas_acuan,
                          rencana_kum_pct: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-blue-600 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Aktual Kumulatif (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.identitas_acuan.aktual_kum_pct}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identitas_acuan: {
                          ...formData.identitas_acuan,
                          aktual_kum_pct: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-emerald-600 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Deviasi (%) [Otomatis]</label>
                  <input
                    type="text"
                    readOnly
                    value={`${formData.identitas_acuan.deviasi_pct > 0 ? "+" : ""}${formData.identitas_acuan.deviasi_pct.toFixed(2)}%`}
                    className={`w-full px-3.5 py-2 font-black border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed ${
                      formData.identitas_acuan.deviasi_pct < 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Termin / Keuangan</label>
                  <input
                    type="text"
                    value={formData.identitas_acuan.termin_keuangan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identitas_acuan: { ...formData.identitas_acuan, termin_keuangan: e.target.value },
                      })
                    }
                    placeholder="Termin 1 (25%) Cair..."
                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <strong>Acuan BoQ/RAB:</strong> daftar kuantitas dan harga kontrak, AHSP/HSP, volume terpasang terukur, bukti lapangan, kurva-S, BA opname/MC, serta perubahan pekerjaan/addendum bila ada.
              </div>
            </div>

            {/* 2. Checklist Fasilitas KNMP */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">
                    2
                  </span>
                  Checklist Fasilitas KNMP (10 Item Standar)
                </h3>
                <span className="text-xs text-slate-500">
                  Tentukan lingkup dan status pekerjaan per fasilitas
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <th className="p-3 text-center w-12">No</th>
                      <th className="p-3">Fasilitas / Area</th>
                      <th className="p-3 w-36 text-center">Lingkup</th>
                      <th className="p-3 w-56 text-center">Status Pekerjaan</th>
                      <th className="p-3">Catatan / Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formData.checklist_fasilitas.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-400">{item.no || idx + 1}</td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{item.fasilitas}</td>
                        <td className="p-3 text-center">
                          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
                            {(["Ya", "N/A"] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  const updated = [...formData.checklist_fasilitas];
                                  updated[idx].lingkup = opt;
                                  setFormData({ ...formData, checklist_fasilitas: updated });
                                }}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                  item.lingkup === opt
                                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow-2xs"
                                    : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
                            {(["Belum", "Proses", "Selesai"] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => {
                                  const updated = [...formData.checklist_fasilitas];
                                  updated[idx].status = st;
                                  setFormData({ ...formData, checklist_fasilitas: updated });
                                }}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                                  item.status === st
                                    ? st === "Selesai"
                                      ? "bg-emerald-600 text-white shadow-2xs"
                                      : st === "Proses"
                                      ? "bg-blue-600 text-white shadow-2xs"
                                      : "bg-slate-600 text-white shadow-2xs"
                                    : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.catatan}
                            onChange={(e) => {
                              const updated = [...formData.checklist_fasilitas];
                              updated[idx].catatan = e.target.value;
                              setFormData({ ...formData, checklist_fasilitas: updated });
                            }}
                            placeholder="Tambah catatan..."
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: BOQ & PROGRES ================= */}
        {activeTab === "boq" && (
          <div className="space-y-6">
            {/* 3. Ringkasan BoQ/RAB per Kelompok Pekerjaan */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">
                    3
                  </span>
                  Ringkasan BoQ/RAB per Kelompok Pekerjaan (8 Item Standar)
                </h3>
                <span className="text-xs text-slate-500">
                  Nilai kontrak, bobot, rencana kumulatif vs realisasi
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <th className="p-3 text-center w-10">No</th>
                      <th className="p-3">Kelompok BoQ</th>
                      <th className="p-3 w-36">Nilai Kontrak (Rp)</th>
                      <th className="p-3 w-24">Bobot (%)</th>
                      <th className="p-3 w-28">Renc. Kum (%)</th>
                      <th className="p-3 w-28">Akt. Kum (%)</th>
                      <th className="p-3 w-24">Deviasi (%)</th>
                      <th className="p-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formData.ringkasan_boq.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-2.5 text-center font-bold text-slate-400">{item.no || idx + 1}</td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">{item.kelompok_boq}</td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={item.nilai_kontrak || ""}
                            onChange={(e) => {
                              const updated = [...formData.ringkasan_boq];
                              updated[idx].nilai_kontrak = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, ringkasan_boq: updated });
                            }}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            value={item.bobot_pct || ""}
                            onChange={(e) => {
                              const updated = [...formData.ringkasan_boq];
                              updated[idx].bobot_pct = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, ringkasan_boq: updated });
                            }}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 text-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            value={item.renc_kum_pct || ""}
                            onChange={(e) => {
                              const updated = [...formData.ringkasan_boq];
                              const renc = parseFloat(e.target.value) || 0;
                              updated[idx].renc_kum_pct = renc;
                              updated[idx].deviasi_pct = Number((updated[idx].akt_kum_pct - renc).toFixed(2));
                              setFormData({ ...formData, ringkasan_boq: updated });
                            }}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 text-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-blue-600"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            value={item.akt_kum_pct || ""}
                            onChange={(e) => {
                              const updated = [...formData.ringkasan_boq];
                              const akt = parseFloat(e.target.value) || 0;
                              updated[idx].akt_kum_pct = akt;
                              updated[idx].deviasi_pct = Number((akt - updated[idx].renc_kum_pct).toFixed(2));
                              setFormData({ ...formData, ringkasan_boq: updated });
                            }}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 text-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-emerald-600"
                          />
                        </td>
                        <td className="p-2.5 text-center font-bold">
                          <span className={item.deviasi_pct < 0 ? "text-rose-600" : "text-emerald-600"}>
                            {item.deviasi_pct > 0 ? `+${item.deviasi_pct.toFixed(2)}%` : `${item.deviasi_pct.toFixed(2)}%`}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.keterangan}
                            onChange={(e) => {
                              const updated = [...formData.ringkasan_boq];
                              updated[idx].keterangan = e.target.value;
                              setFormData({ ...formData, ringkasan_boq: updated });
                            }}
                            placeholder="Keterangan..."
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Detail BoQ, Nilai Progres, dan Pembayaran */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">
                      4
                    </span>
                    Detail BoQ, Nilai Progres, dan Pembayaran
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nilai realisasi mengikuti volume terukur x harga satuan kontrak
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddDetailBoQ}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Item BoQ
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <th className="p-2.5 w-8 text-center">No</th>
                      <th className="p-2.5 w-24">Kode BoQ</th>
                      <th className="p-2.5 w-28">Area</th>
                      <th className="p-2.5">Uraian Pekerjaan</th>
                      <th className="p-2.5 w-20">Bobot %</th>
                      <th className="p-2.5 w-24">Akt. Kum %</th>
                      <th className="p-2.5 w-36">Nilai Realisasi</th>
                      <th className="p-2.5 w-24">Termin/MC</th>
                      <th className="p-2.5 w-20">Deviasi %</th>
                      <th className="p-2.5">Catatan</th>
                      <th className="p-2.5 w-10 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formData.detail_boq.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-6 text-center text-slate-400 italic">
                          Belum ada item detail BoQ. Klik "+ Tambah Item BoQ" untuk menambah.
                        </td>
                      </tr>
                    ) : (
                      formData.detail_boq.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 text-center font-bold text-slate-400">{item.no || idx + 1}</td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.kode_boq}
                              onChange={(e) => {
                                const updated = [...formData.detail_boq];
                                updated[idx].kode_boq = e.target.value;
                                setFormData({ ...formData, detail_boq: updated });
                              }}
                              placeholder="DIV-1.1"
                              className="w-full px-2 py-1 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.area}
                              onChange={(e) => {
                                const updated = [...formData.detail_boq];
                                updated[idx].area = e.target.value;
                                setFormData({ ...formData, detail_boq: updated });
                              }}
                              placeholder="Dermaga"
                              className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.uraian}
                              onChange={(e) => {
                                const updated = [...formData.detail_boq];
                                updated[idx].uraian = e.target.value;
                                setFormData({ ...formData, detail_boq: updated });
                              }}
                              placeholder="Pemasangan tiang..."
                              className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.01"
                              value={item.bobot_pct || ""}
                              onChange={(e) => {
                                const updated = [...formData.detail_boq];
                                updated[idx].bobot_pct = parseFloat(e.target.value) || 0;
                                setFormData({ ...formData, detail_boq: updated });
                              }}
                              placeholder="0"
                              className="w-full px-2 py-1 text-xs text-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.01"
                              value={item.akt_kum_pct || ""}
                              onChange={(e) => {
                                const updated = [...formData.detail_boq];
                                updated[idx].akt_kum_pct = parseFloat(e.target.value) || 0;
                                setFormData({ ...formData, detail_boq: updated });
                              }}
                              placeholder="0"
                              className="w-full px-2 py-1 text-xs text-center font-bold text-emerald-600 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              value={item.nilai_realisasi || ""}
                              onChange={(e) => {
                                const updated = [...formData.detail_boq];
                                updated[idx].nilai_realisasi = parseFloat(e.target.value) || 0;
                                setFormData({ ...formData, detail_boq: updated });
                              }}
                              placeholder="0"
                              className="w-full px-2 py-1 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.termin_mc}
                              onChange={(e) => {
                                const updated = [...formData.detail_boq];
                                updated[idx].termin_mc = e.target.value;
                                setFormData({ ...formData, detail_boq: updated });
                              }}
                              placeholder="MC-01"
                              className="w-full px-2 py-1 text-xs text-center font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.01"
                              value={item.deviasi_pct || ""}
                              onChange={(e) => {
                                const updated = [...formData.detail_boq];
                                updated[idx].deviasi_pct = parseFloat(e.target.value) || 0;
                                setFormData({ ...formData, detail_boq: updated });
                              }}
                              placeholder="0"
                              className="w-full px-2 py-1 text-xs text-center font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.catatan}
                              onChange={(e) => {
                                const updated = [...formData.detail_boq];
                                updated[idx].catatan = e.target.value;
                                setFormData({ ...formData, detail_boq: updated });
                              }}
                              placeholder="Catatan..."
                              className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveDetailBoQ(idx)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: RISIKO & READINESS ================= */}
        {activeTab === "risiko" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">
                      5
                    </span>
                    Kontrak, Keuangan, Risiko, dan Readiness (6 Aspek Utama)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluasi komprehensif jadwal, keuangan, mutu, K3, dan kesiapan operasional
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3 w-48">Aspek Penilaian</th>
                      <th className="p-3">Kondisi Bulan Ini</th>
                      <th className="p-3">Risiko / Deviasi</th>
                      <th className="p-3">Tindak Lanjut / Mitigasi</th>
                      <th className="p-3 w-36">PIC / Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formData.matriks_risiko.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-3 text-center font-bold text-slate-400">{item.no || idx + 1}</td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{item.aspek}</td>
                        <td className="p-3">
                          <textarea
                            rows={2}
                            value={item.kondisi_bulan_ini}
                            onChange={(e) => {
                              const updated = [...formData.matriks_risiko];
                              updated[idx].kondisi_bulan_ini = e.target.value;
                              setFormData({ ...formData, matriks_risiko: updated });
                            }}
                            placeholder="Kondisi riil bulan ini..."
                            className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 resize-none outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3">
                          <textarea
                            rows={2}
                            value={item.risiko_deviasi}
                            onChange={(e) => {
                              const updated = [...formData.matriks_risiko];
                              updated[idx].risiko_deviasi = e.target.value;
                              setFormData({ ...formData, matriks_risiko: updated });
                            }}
                            placeholder="Potensi risiko..."
                            className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 resize-none outline-none focus:ring-2 focus:ring-blue-500 text-rose-700 dark:text-rose-400 font-medium"
                          />
                        </td>
                        <td className="p-3">
                          <textarea
                            rows={2}
                            value={item.tindak_lanjut}
                            onChange={(e) => {
                              const updated = [...formData.matriks_risiko];
                              updated[idx].tindak_lanjut = e.target.value;
                              setFormData({ ...formData, matriks_risiko: updated });
                            }}
                            placeholder="Rencana tindak lanjut..."
                            className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 resize-none outline-none focus:ring-2 focus:ring-blue-500 text-blue-700 dark:text-blue-300 font-medium"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.pic_target}
                            onChange={(e) => {
                              const updated = [...formData.matriks_risiko];
                              updated[idx].pic_target = e.target.value;
                              setFormData({ ...formData, matriks_risiko: updated });
                            }}
                            placeholder="PIC / Target"
                            className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: FOTO & PENGESAHAN ================= */}
        {activeTab === "foto" && (
          <div className="space-y-6">
            {/* 6. Dokumentasi Foto Bulanan */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">
                      6
                    </span>
                    Dokumentasi Foto Bulanan (4 Slot Wajib)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Foto wajib dikaitkan dengan kode BoQ/area agar progres volume mudah diverifikasi.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((slot) => {
                  const foto = formData.dokumentasi_foto.find((f) => f.slot === slot) || {
                    slot,
                    file_url: "",
                    kode_boq_area: "",
                    tanggal: "",
                    keterangan: "",
                  };

                  return (
                    <div
                      key={slot}
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                          FOTO {slot}
                        </span>
                        {foto.file_url && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                dokumentasi_foto: prev.dokumentasi_foto.map((f) =>
                                  f.slot === slot ? { ...f, file_url: "", file_name: "" } : f
                                ),
                              }));
                            }}
                            className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>

                      {/* Image Box / Dropzone */}
                      <div className="relative aspect-[16/9] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex flex-col items-center justify-center shadow-2xs">
                        {foto.file_url ? (
                          <img
                            src={foto.file_url}
                            alt={`Foto ${slot}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <label className="flex flex-col items-center justify-center cursor-pointer p-6 text-center h-full w-full hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                            <Camera className="w-10 h-10 text-slate-400 mb-2" />
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              Upload Foto {slot}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG s.d 5MB</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handlePhotoUpload(slot, e.target.files?.[0] || null)}
                            />
                          </label>
                        )}
                      </div>

                      {/* Meta Fields */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Kode BoQ / Area
                          </label>
                          <input
                            type="text"
                            value={foto.kode_boq_area}
                            onChange={(e) => {
                              const updated = [...formData.dokumentasi_foto];
                              const fIdx = updated.findIndex((f) => f.slot === slot);
                              if (fIdx >= 0) updated[fIdx].kode_boq_area = e.target.value;
                              setFormData({ ...formData, dokumentasi_foto: updated });
                            }}
                            placeholder="Contoh: DIV-1.1 Dermaga"
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Tanggal Pengambilan
                          </label>
                          <input
                            type="date"
                            value={foto.tanggal}
                            onChange={(e) => {
                              const updated = [...formData.dokumentasi_foto];
                              const fIdx = updated.findIndex((f) => f.slot === slot);
                              if (fIdx >= 0) updated[fIdx].tanggal = e.target.value;
                              setFormData({ ...formData, dokumentasi_foto: updated });
                            }}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          Keterangan Visual
                        </label>
                        <input
                          type="text"
                          value={foto.keterangan}
                          onChange={(e) => {
                            const updated = [...formData.dokumentasi_foto];
                            const fIdx = updated.findIndex((f) => f.slot === slot);
                            if (fIdx >= 0) updated[fIdx].keterangan = e.target.value;
                            setFormData({ ...formData, dokumentasi_foto: updated });
                          }}
                          placeholder="Keterangan progres fisik lapangan..."
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7. Pengesahan */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">
                      7
                    </span>
                    Pengesahan (3 Kolom Penandatangan)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pihak pembuat, pemeriksa, dan pejabat pembuat komitmen
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                {/* Dibuat Oleh */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 space-y-3.5">
                  <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 block border-b pb-2">
                    Dibuat oleh: KONTRAKTOR
                  </span>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Nama Lengkap</label>
                    <input
                      type="text"
                      value={formData.pengesahan.pembuat_nama}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pengesahan: { ...formData.pengesahan, pembuat_nama: e.target.value },
                        })
                      }
                      placeholder="Nama Kontraktor"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Tanggal Pengesahan</label>
                    <input
                      type="date"
                      value={formData.pengesahan.pembuat_tanggal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pengesahan: { ...formData.pengesahan, pembuat_tanggal: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Diperiksa Oleh */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 space-y-3.5">
                  <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 block border-b pb-2">
                    Diperiksa oleh: PENGAWAS
                  </span>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Nama Lengkap</label>
                    <input
                      type="text"
                      value={formData.pengesahan.pemeriksa_nama}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pengesahan: { ...formData.pengesahan, pemeriksa_nama: e.target.value },
                        })
                      }
                      placeholder="Konsultan Pengawas"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Tanggal Pengesahan</label>
                    <input
                      type="date"
                      value={formData.pengesahan.pemeriksa_tanggal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pengesahan: { ...formData.pengesahan, pemeriksa_tanggal: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Disetujui Oleh */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 space-y-3.5">
                  <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 block border-b pb-2">
                    Disetujui oleh: PPK
                  </span>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Nama Lengkap</label>
                    <input
                      type="text"
                      value={formData.pengesahan.penyetuju_nama}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pengesahan: { ...formData.pengesahan, penyetuju_nama: e.target.value },
                        })
                      }
                      placeholder="Pejabat Pembuat Komitmen"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Tanggal Pengesahan</label>
                    <input
                      type="date"
                      value={formData.pengesahan.penyetuju_tanggal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pengesahan: { ...formData.pengesahan, penyetuju_tanggal: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-between sticky bottom-4 z-40">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Bagian Aktif: <strong className="text-slate-800 dark:text-slate-200 uppercase">{activeTab}</strong>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/laporan")}
            className="px-4.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saveMutation.isPending ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Simpan Laporan"}</span>
          </button>
        </div>
      </div>

      {/* Official 2-Page Print / PDF Modal */}
      {showPrintPreview && (
        <FormatBulananPrintView
          data={formData}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </div>
  );
};
