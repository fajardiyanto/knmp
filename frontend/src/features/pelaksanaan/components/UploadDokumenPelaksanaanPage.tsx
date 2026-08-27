import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  Eye,
  Trash2,
  Plus,
  X,
  FileCheck,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { useAlert } from "../../../context/AlertContext";
import { formatDate } from "../../../lib/utils";

interface PelaksanaanDetail {
  id: number;
  nama: string;
  user_name?: string;
  knmp_name?: string;
  tanggal: string;
  keterangan?: string;
  documents?: Array<{
    id: number;
    category: string;
    file_name: string;
    file_path: string;
    file_url: string;
    mime_type: string;
    size: number;
    created_at: string;
    status?: string;
    verified_by?: number;
    verified_at?: string;
  }>;
}

interface RequiredDocDef {
  no: number;
  code: string;
  name: string;
  isCustom?: boolean;
}

const SECTION_1_DOCS: RequiredDocDef[] = [
  { no: 1, code: "p1_progress_fisik", name: "Progress Fisik" },
  { no: 2, code: "p1_mutu_pekerjaan_awal", name: "Mutu Pekerjaan Awal" },
  { no: 3, code: "p1_pekerjaan_kritis_awal", name: "Pekerjaan Kritis Awal" },
  { no: 4, code: "p1_material", name: "Material" },
  { no: 5, code: "p1_peralatan", name: "Peralatan" },
  { no: 6, code: "p1_tenaga_kerja", name: "Tenaga Kerja" },
  { no: 7, code: "p1_k3_lingkungan", name: "K3 & Lingkungan" },
  { no: 8, code: "p1_metode_kerja", name: "Metode Kerja" },
  { no: 9, code: "p1_jadwal_pelaksanaan", name: "Jadwal Pelaksanaan" },
  { no: 10, code: "p1_admin_dokumen", name: "Admin & Dokumen" },
  { no: 11, code: "p1_deviasi_risiko", name: "Deviasi / Risiko" },
];

const SECTION_2_DOCS: RequiredDocDef[] = [
  { no: 12, code: "p2_progress_fisik", name: "Progress Fisik" },
  { no: 13, code: "p2_mutu_pekerjaan", name: "Mutu Pekerjaan" },
  { no: 14, code: "p2_pekerjaan_kritis", name: "Pekerjaan Kritis" },
  { no: 15, code: "p2_volume_pekerjaan", name: "Volume Pekerjaan" },
  { no: 16, code: "p2_material", name: "Material" },
  { no: 17, code: "p2_tenaga_kerja", name: "Tenaga Kerja" },
  { no: 18, code: "p2_peralatan", name: "Peralatan" },
  { no: 19, code: "p2_metode_kerja", name: "Metode Kerja" },
  { no: 20, code: "p2_k3_lingkungan", name: "K3 & Lingkungan" },
  { no: 21, code: "p2_risiko_deviasi", name: "Risiko / Deviasi" },
  { no: 22, code: "p2_dokumen_administrasi", name: "Dokumen Administrasi" },
];

const SECTION_3_DOCS: RequiredDocDef[] = [
  { no: 23, code: "p3_progress_fisik", name: "Progress Fisik" },
  { no: 24, code: "p3_pekerjaan_kritis", name: "Pekerjaan Kritis" },
  { no: 25, code: "p3_mutu_pekerjaan", name: "Mutu Pekerjaan" },
  { no: 26, code: "p3_volume_pekerjaan", name: "Volume Pekerjaan" },
  { no: 27, code: "p3_penyelesaian_item_utama", name: "Penyelesaian Item Utama" },
  { no: 28, code: "p3_potensi_keterlambatan", name: "Potensi Keterlambatan" },
  { no: 29, code: "p3_material_peralatan", name: "Material & Peralatan" },
  { no: 30, code: "p3_tenaga_kerja", name: "Tenaga Kerja" },
  { no: 31, code: "p3_k3_lingkungan", name: "K3 & Lingkungan" },
  { no: 32, code: "p3_metode_kerja", name: "Metode Kerja" },
  { no: 33, code: "p3_dokumen_administrasi", name: "Dokumen Administrasi" },
];

export const UploadDokumenPelaksanaanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useAlert();

  const [customDocs1, setCustomDocs1] = useState<RequiredDocDef[]>([]);
  const [customDocs2, setCustomDocs2] = useState<RequiredDocDef[]>([]);
  const [customDocs3, setCustomDocs3] = useState<RequiredDocDef[]>([]);

  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<1 | 2 | 3>(1);
  const [customDocName, setCustomDocName] = useState("");
  const [customUploadFile, setCustomUploadFile] = useState<File | null>(null);

  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);

  // 1. Fetch Detail Pelaksanaan
  const { data: pelaksanaan, isLoading } = useQuery<PelaksanaanDetail>({
    queryKey: ["pelaksanaan-detail", id],
    queryFn: () => apiFetch<PelaksanaanDetail>(`/api/v1/pelaksanaan/${id}`),
    enabled: !!id,
  });

  const allDocs1 = [...SECTION_1_DOCS, ...customDocs1];
  const allDocs2 = [...SECTION_2_DOCS, ...customDocs2];
  const allDocs3 = [...SECTION_3_DOCS, ...customDocs3];
  const allDocDefs = [...allDocs1, ...allDocs2, ...allDocs3];

  // Document Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ category, file }: { category: string; file: File }) => {
      const fd = new FormData();
      fd.append("documentable_type", "pelaksanaan");
      fd.append("documentable_id", id || "0");
      fd.append("category", category);
      fd.append("file", file);

      return apiFetch("/api/v1/documents", {
        method: "POST",
        body: fd,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pelaksanaan-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["pelaksanaan-list"] });
      setUploadingCategory(null);
      showAlert({
        title: "Berhasil Diunggah",
        message: "Berkas dokumen pelaksanaan berhasil diunggah.",
        type: "success",
      });
    },
    onError: (err: any) => {
      showAlert({
        title: "Gagal Mengunggah",
        message: err.message || "Gagal mengunggah berkas.",
        type: "error",
      });
      setUploadingCategory(null);
    },
  });

  // Delete Document Mutation
  const deleteDocMutation = useMutation({
    mutationFn: (docId: number) =>
      apiFetch(`/api/v1/documents/${docId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pelaksanaan-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["pelaksanaan-list"] });
    },
  });

  // Verify Document Mutation
  const verifyDocMutation = useMutation({
    mutationFn: ({ docId, status }: { docId: number; status: string }) =>
      apiFetch(`/api/v1/documents/${docId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pelaksanaan-detail", id] });
    },
  });

  const handleFileSelect = (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingCategory(category);
      uploadMutation.mutate({ category, file });
    }
  };

  const handleOpenAddCustom = (section: 1 | 2 | 3) => {
    setActiveSection(section);
    setCustomDocName("");
    setCustomUploadFile(null);
    setIsAddCustomOpen(true);
  };

  const handleAddCustomDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDocName.trim()) return;

    const code = `custom_pelaksanaan_s${activeSection}_${Date.now()}`;
    const newDocDef = {
      no: (activeSection === 1 ? allDocs1.length + 1 : activeSection === 2 ? 11 + allDocs2.length + 1 : 22 + allDocs3.length + 1),
      code,
      name: customDocName.trim(),
      isCustom: true,
    };

    if (activeSection === 1) setCustomDocs1((prev) => [...prev, newDocDef]);
    else if (activeSection === 2) setCustomDocs2((prev) => [...prev, newDocDef]);
    else setCustomDocs3((prev) => [...prev, newDocDef]);

    if (customUploadFile) {
      setUploadingCategory(code);
      try {
        const fd = new FormData();
        fd.append("documentable_type", "pelaksanaan");
        fd.append("documentable_id", id || "0");
        fd.append("category", code);
        fd.append("file", customUploadFile);

        await apiFetch("/api/v1/documents", {
          method: "POST",
          body: fd,
        });

        queryClient.invalidateQueries({ queryKey: ["pelaksanaan-detail", id] });
        queryClient.invalidateQueries({ queryKey: ["pelaksanaan-list"] });
        showAlert({
          title: "Berhasil Diunggah",
          message: "Dokumen pelaksanaan berhasil diunggah.",
          type: "success",
        });
      } catch (err: any) {
        showAlert({
          title: "Gagal Mengunggah",
          message: err.message || "Gagal mengunggah dokumen.",
          type: "error",
        });
      } finally {
        setUploadingCategory(null);
      }
    }

    setCustomDocName("");
    setCustomUploadFile(null);
    setIsAddCustomOpen(false);
  };

  // Calculations for 4 Summary Cards
  const docs = pelaksanaan?.documents || [];
  const totalRequired = allDocDefs.length;
  const uploadedCount = allDocDefs.filter((d) => docs.some((doc) => doc.category === d.code)).length;
  const belumUploadCount = totalRequired - uploadedCount;

  const verifiedCount = docs.filter((d) => d.status === "terverifikasi").length;
  const verifiedPct = uploadedCount > 0 ? Math.round((verifiedCount / uploadedCount) * 100) : 0;
  const belumVerifCount = uploadedCount - verifiedCount;
  const belumVerifPct = uploadedCount > 0 ? 100 - verifiedPct : 100;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-500 text-sm">
        Memuat berkas dokumen pelaksanaan...
      </div>
    );
  }

  const renderSectionTable = (
    title: string,
    subtitle: string,
    sectionDocs: RequiredDocDef[],
    sectionNumber: 1 | 2 | 3,
    customCount: number
  ) => {
    return (
      <div className="space-y-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-100 space-y-1">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>

        {/* Section Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200/90 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4 text-center w-14">No.</th>
                <th className="py-4 px-5 min-w-[220px]">Dokumen</th>
                <th className="py-4 px-5 min-w-[240px]">Upload File</th>
                <th className="py-4 px-4 text-center">Tgl Upload</th>
                <th className="py-4 px-4 text-center">Verifikasi Pengawas</th>
                <th className="py-4 px-4 text-center">Tgl Verifikasi</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-5 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sectionDocs.map((def) => {
                const doc = docs.find((d) => d.category === def.code);
                const isUploaded = !!doc;
                const isVerified = doc?.status === "terverifikasi";
                const isUploadingThis = uploadingCategory === def.code;

                return (
                  <tr key={def.code} className="hover:bg-slate-50/60 transition-colors">
                    {/* No. */}
                    <td className="py-4 px-4 text-center font-medium text-slate-500 text-[13.5px]">
                      {def.no}
                    </td>

                    {/* Dokumen Name */}
                    <td className="py-4 px-5 font-normal text-slate-800 text-[14.5px]">
                      {def.name}
                    </td>

                    {/* Upload File Interactive Box */}
                    <td className="py-4 px-5">
                      {isUploaded ? (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs">
                          <div className="truncate pr-2">
                            <span className="font-bold text-emerald-900 block truncate">
                              {doc.file_name}
                            </span>
                            <span className="text-[11px] text-emerald-700 font-mono">
                              {(doc.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-emerald-700 hover:text-emerald-900"
                              title="Lihat Berkas"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                showConfirm({
                                  title: "Hapus Berkas Dokumen",
                                  message: "Apakah Anda yakin ingin menghapus file dokumen pelaksanaan ini?",
                                  confirmText: "Hapus",
                                  isDestructive: true,
                                  onConfirm: () => deleteDocMutation.mutate(doc.id),
                                });
                              }}
                              className="p-1 text-rose-500 hover:text-rose-700"
                              title="Hapus File"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="relative flex flex-col items-center justify-center p-3 border-2 border-dashed border-[#b6d0ff] bg-[#eef4ff] hover:bg-[#e2edff] rounded-xl cursor-pointer transition-all text-center">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                            onChange={(e) => handleFileSelect(def.code, e)}
                            disabled={isUploadingThis}
                          />
                          <span className="text-xs font-bold text-[#0d6efd]">
                            {isUploadingThis ? "Mengunggah..." : "Klik untuk upload"}
                          </span>
                          <span className="text-[10.5px] text-slate-500 mt-0.5">
                            Dokumen & Foto (max 20MB)
                          </span>
                        </label>
                      )}
                    </td>

                    {/* Tgl Upload */}
                    <td className="py-4 px-4 text-center text-[13px] text-slate-600 font-medium">
                      {doc ? formatDate(doc.created_at) : "-"}
                    </td>

                    {/* Verifikasi Pengawas */}
                    <td className="py-4 px-4 text-center">
                      {isVerified ? (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Terverifikasi
                        </span>
                      ) : isUploaded ? (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Belum Diverifikasi
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          Belum Diverifikasi
                        </span>
                      )}
                    </td>

                    {/* Tgl Verifikasi */}
                    <td className="py-4 px-4 text-center text-[13px] text-slate-600 font-medium">
                      {doc?.verified_at ? formatDate(doc.verified_at) : "-"}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center text-[13px] font-medium">
                      {isVerified ? (
                        <span className="text-emerald-600 font-bold">Terverifikasi</span>
                      ) : isUploaded ? (
                        <span className="text-blue-600 font-bold">Sudah Upload</span>
                      ) : (
                        <span className="text-slate-400">Belum Upload</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-5 text-center text-xs">
                      {isUploaded ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              verifyDocMutation.mutate({
                                docId: doc.id,
                                status: isVerified ? "dalam_verifikasi" : "terverifikasi",
                              })
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isVerified
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {isVerified ? "Batal Verif" : "Verifikasi"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Menunggu upload</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Section Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-600">
          <div>
            11 dokumen wajib + {customCount} tambahan
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddCustom(sectionNumber)}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dokumen</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 w-full font-sans pb-12">
      {/* 1. Go Back Button */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/pelaksanaan")}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
      </div>

      {/* 2. Header Section: Target Title & 4 Summary Cards */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-transparent">
        {/* Left Title Info */}
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-2xl bg-[#0d6efd] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">
              Upload Dokumen
            </h2>
            <p className="text-[13.5px] font-semibold text-slate-600">
              Target: <span className="font-bold text-slate-900">{pelaksanaan?.nama || "Pelaksanaan"}</span>
            </p>
            <p className="text-xs font-semibold text-[#0d6efd]">
              Sistem akan mendeteksi kelengkapan dokumen
            </p>
          </div>
        </div>

        {/* Right 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 w-full">
          {/* Belum Upload */}
          <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-2xl p-3.5 sm:px-4 sm:py-3.5 flex items-center gap-3 min-w-0 w-full shadow-2xs">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#ef4444] text-white flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] sm:text-[11px] font-bold text-[#ef4444] tracking-wider uppercase truncate">
                BELUM UPLOAD
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight my-0.5">
                {belumUploadCount}
              </div>
              <div className="text-xs font-semibold text-[#ef4444] truncate">Pending</div>
            </div>
          </div>

          {/* Upload */}
          <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-3.5 sm:px-4 sm:py-3.5 flex items-center gap-3 min-w-0 w-full shadow-2xs">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#22c55e] text-white flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] sm:text-[11px] font-bold text-[#16a34a] tracking-wider uppercase truncate">
                UPLOAD
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight my-0.5">
                {uploadedCount}
              </div>
              <div className="text-xs font-semibold text-[#16a34a] truncate">{uploadedCount} Required</div>
            </div>
          </div>

          {/* Terverifikasi */}
          <div className="bg-[#f0f9ff] border border-[#e0f2fe] rounded-2xl p-3.5 sm:px-4 sm:py-3.5 flex items-center gap-3 min-w-0 w-full shadow-2xs">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] sm:text-[11px] font-bold text-[#0284c7] tracking-wider uppercase truncate">
                TERVERIFIKASI
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight my-0.5">
                {verifiedCount}
              </div>
              <div className="text-xs font-semibold text-[#0284c7] truncate">{verifiedPct}%</div>
            </div>
          </div>

          {/* Belum Verif */}
          <div className="bg-[#fefce8] border border-[#fef9c3] rounded-2xl p-3.5 sm:px-4 sm:py-3.5 flex items-center gap-3 min-w-0 w-full shadow-2xs">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#eab308] text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] sm:text-[11px] font-bold text-[#ca8a04] tracking-wider uppercase truncate">
                BELUM VERIF.
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight my-0.5">
                {belumVerifCount}
              </div>
              <div className="text-xs font-semibold text-[#ca8a04] truncate">{belumVerifPct}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Three Stage Sections */}
      <div className="space-y-8">
        {/* Section 1: 50% */}
        {renderSectionTable(
          "Dokumen Progress & Mutu Awal (50%)",
          "Dokumen nomor 1-11 untuk tahap 1.",
          allDocs1,
          1,
          customDocs1.length
        )}

        {/* Section 2: 75% */}
        {renderSectionTable(
          "Dokumen Pengendalian Progress (75%)",
          "Dokumen nomor 12-22 untuk tahap 2.",
          allDocs2,
          2,
          customDocs2.length
        )}

        {/* Section 3: 90% */}
        {renderSectionTable(
          "Dokumen Pekerjaan Kritis (90%)",
          "Dokumen nomor 23-33 untuk tahap 3.",
          allDocs3,
          3,
          customDocs3.length
        )}
      </div>

      {/* 4. Keterangan Status Upload & Verifikasi Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 lg:p-6 shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-slate-800">
          Keterangan Status Upload & Verifikasi
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-emerald-600">Terverifikasi</div>
            <p className="text-slate-500">Dokumen sudah diverifikasi oleh pengawas KNMP.</p>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-blue-600">Dalam Verifikasi</div>
            <p className="text-slate-500">Dokumen sedang diverifikasi oleh pengawas.</p>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-amber-600">Belum Diverifikasi</div>
            <p className="text-slate-500">Menunggu antrian diverifikasi oleh pengawas.</p>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-rose-600">Belum Upload</div>
            <p className="text-slate-500">Dokumen belum diupload ke sistem.</p>
          </div>
        </div>
      </div>

      {/* 5. Persyaratan Dokumen Alert Box */}
      <div className="bg-[#eef4ff] border border-[#d6e4ff] rounded-2xl p-5 lg:p-6 text-xs text-slate-700 space-y-2">
        <h4 className="font-bold text-[#0d6efd] text-[13px] flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>Persyaratan Dokumen</span>
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-600 font-medium">
          <li>Halaman ini menampilkan daftar dokumen yang perlu dilengkapi.</li>
          <li>Setiap dokumen dapat diunggah, ditinjau, dan diverifikasi sesuai statusnya.</li>
          <li>Gunakan pola upload dan verifikasi yang sama dengan Persiapan Lapangan saat logic backend ditambahkan.</li>
        </ul>
      </div>

      {/* Modal Tambah Dokumen (Tambahan) */}
      {isAddCustomOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[460px] w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Tambah Dokumen (Tahap {activeSection})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddCustomOpen(false);
                  setCustomUploadFile(null);
                  setCustomDocName("");
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomDoc}>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Nama Dokumen
                  </label>
                  <input
                    type="text"
                    required
                    value={customDocName}
                    onChange={(e) => setCustomDocName(e.target.value)}
                    placeholder="e.g., Dokumen Tambahan"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#3366ff] focus:border-[#3366ff] placeholder:text-slate-400 transition-all"
                  />
                  <p className="text-[11px] text-slate-500">
                    Berikan nama kategori internal dokumen Anda
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    File Dokumen
                  </label>
                  <div className="flex items-center justify-between border border-slate-200 rounded-lg overflow-hidden p-1 bg-white">
                    <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors">
                      Choose Files
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.heic,.heif"
                        onChange={(e) => setCustomUploadFile(e.target.files?.[0] || null)}
                      />
                    </label>

                    <span className="text-xs text-slate-500 truncate px-2 flex-1">
                      {customUploadFile ? customUploadFile.name : "No file chosen"}
                    </span>

                    <button
                      type="button"
                      className="px-3 py-1 text-xs font-semibold text-[#3366ff] hover:text-[#2554d7] transition-colors"
                    >
                      Upload
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Format: PDF/DOC/XLS/JPG/PNG/WEBP/HEIC/HEIF, Max 20MB
                  </p>
                </div>
              </div>

              <div className="px-6 py-3.5 border-t border-slate-200/80 flex items-center justify-end gap-2.5 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddCustomOpen(false);
                    setCustomUploadFile(null);
                    setCustomDocName("");
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#3366ff] hover:bg-[#2554d7] rounded-lg transition-colors shadow-2xs"
                >
                  Unggah Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
