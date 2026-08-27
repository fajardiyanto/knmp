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
  Download,
  Trash2,
  Plus,
  X,
  FileCheck,
  ImageIcon,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";
import { formatDate } from "../../../lib/utils";

interface LaporanDetail {
  id: number;
  nama: string;
  user_name?: string;
  pelaksanaan_name?: string;
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

interface LaporanDocDef {
  no: number;
  code: string;
  name: string;
  badge?: string;
  isMulti?: boolean;
  isCustom?: boolean;
}

const DEFAULT_LAPORAN_DOCS: LaporanDocDef[] = [
  { no: 1, code: "status_k3_doc", name: "Status K3" },
  { no: 2, code: "ceklis_mutu_doc", name: "Ceklis Mutu" },
  { no: 3, code: "laporan_pdf_doc", name: "Laporan PDF" },
  { no: 4, code: "foto_kegiatan", name: "Foto (min 5)", badge: "min 5", isMulti: true },
];

export const UploadDokumenLaporanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [customDocs, setCustomDocs] = useState<LaporanDocDef[]>([
    { no: 5, code: "foto_kegiatan_tambahan", name: "Foto kegiatan tambahan", badge: "Tambahan", isMulti: true, isCustom: true },
  ]);

  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [customDocName, setCustomDocName] = useState("");
  const [customUploadFile, setCustomUploadFile] = useState<File | null>(null);

  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);

  // 1. Fetch Laporan Detail
  const { data: laporan, isLoading } = useQuery<LaporanDetail>({
    queryKey: ["laporan-detail", id],
    queryFn: () => apiFetch<LaporanDetail>(`/api/v1/laporan/${id}`),
    enabled: !!id,
  });

  const allDocDefs = [...DEFAULT_LAPORAN_DOCS, ...customDocs];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ category, file }: { category: string; file: File }) => {
      const fd = new FormData();
      fd.append("documentable_type", "laporan");
      fd.append("documentable_id", id || "0");
      fd.append("category", category);
      fd.append("file", file);

      return apiFetch("/api/v1/documents", {
        method: "POST",
        body: fd,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laporan-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["laporan-list"] });
      setUploadingCategory(null);
    },
    onError: (err: any) => {
      alert("Gagal mengunggah berkas: " + err.message);
      setUploadingCategory(null);
    },
  });

  // Delete Document Mutation
  const deleteDocMutation = useMutation({
    mutationFn: (docId: number) =>
      apiFetch(`/api/v1/documents/${docId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laporan-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["laporan-list"] });
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
      queryClient.invalidateQueries({ queryKey: ["laporan-detail", id] });
    },
  });

  const handleFileSelect = (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingCategory(category);
      uploadMutation.mutate({ category, file });
    }
  };

  const handleAddCustomDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDocName.trim()) return;

    const code = `custom_laporan_${Date.now()}`;
    const newDocDef: LaporanDocDef = {
      no: allDocDefs.length + 1,
      code,
      name: customDocName.trim(),
      badge: "Tambahan",
      isMulti: true,
      isCustom: true,
    };

    setCustomDocs((prev) => [...prev, newDocDef]);

    if (customUploadFile) {
      setUploadingCategory(code);
      try {
        const fd = new FormData();
        fd.append("documentable_type", "laporan");
        fd.append("documentable_id", id || "0");
        fd.append("category", code);
        fd.append("file", customUploadFile);

        await apiFetch("/api/v1/documents", {
          method: "POST",
          body: fd,
        });

        queryClient.invalidateQueries({ queryKey: ["laporan-detail", id] });
        queryClient.invalidateQueries({ queryKey: ["laporan-list"] });
      } catch (err: any) {
        alert("Gagal mengunggah dokumen: " + err.message);
      } finally {
        setUploadingCategory(null);
      }
    }

    setCustomDocName("");
    setCustomUploadFile(null);
    setIsAddCustomOpen(false);
  };

  // Calculations for 4 Summary Cards
  const docs = laporan?.documents || [];
  const requiredCount = DEFAULT_LAPORAN_DOCS.length; // 4
  const uploadedFilesCount = docs.length;
  const pendingCount = Math.max(requiredCount - uploadedFilesCount, 0);

  const verifiedDocsCount = docs.filter((d) => d.status === "terverifikasi").length;
  const verifiedPct = uploadedFilesCount > 0 ? Math.round((verifiedDocsCount / uploadedFilesCount) * 100) : 0;
  const belumVerifCount = Math.max(uploadedFilesCount - verifiedDocsCount, 0);
  const belumVerifPct = uploadedFilesCount > 0 ? 100 - verifiedPct : 100;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-500 text-sm">
        Memuat berkas dokumen laporan...
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* 1. Go Back Button */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/laporan")}
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
              Target: <span className="font-bold text-slate-900">{laporan?.nama || "Kontraktor"}</span>
            </p>
            <p className="text-xs font-semibold text-[#0d6efd]">
              Sistem akan mendeteksi kelengkapan dokumen
            </p>
          </div>
        </div>

        {/* Right 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Belum Upload */}
          <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-2xl px-5 py-3.5 flex items-center gap-3.5 min-w-[175px]">
            <div className="w-11 h-11 rounded-full bg-[#ef4444] text-white flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#ef4444] tracking-wider uppercase">
                BELUM UPLOAD
              </div>
              <div className="text-2xl font-normal text-slate-900 leading-tight my-0.5">
                {pendingCount}
              </div>
              <div className="text-xs font-semibold text-[#ef4444]">Pending</div>
            </div>
          </div>

          {/* Upload */}
          <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl px-5 py-3.5 flex items-center gap-3.5 min-w-[175px]">
            <div className="w-11 h-11 rounded-full bg-[#22c55e] text-white flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#16a34a] tracking-wider uppercase">
                UPLOAD
              </div>
              <div className="text-2xl font-normal text-slate-900 leading-tight my-0.5">
                {uploadedFilesCount}
              </div>
              <div className="text-xs font-semibold text-[#16a34a]">{requiredCount} Required</div>
            </div>
          </div>

          {/* Terverifikasi */}
          <div className="bg-[#f0f9ff] border border-[#e0f2fe] rounded-2xl px-5 py-3.5 flex items-center gap-3.5 min-w-[175px]">
            <div className="w-11 h-11 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#0284c7] tracking-wider uppercase">
                TERVERIFIKASI
              </div>
              <div className="text-2xl font-normal text-slate-900 leading-tight my-0.5">
                {verifiedDocsCount}
              </div>
              <div className="text-xs font-semibold text-[#0284c7]">{verifiedPct}%</div>
            </div>
          </div>

          {/* Belum Verif */}
          <div className="bg-[#fefce8] border border-[#fef9c3] rounded-2xl px-5 py-3.5 flex items-center gap-3.5 min-w-[175px]">
            <div className="w-11 h-11 rounded-full bg-[#eab308] text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#ca8a04] tracking-wider uppercase">
                BELUM VERIF.
              </div>
              <div className="text-2xl font-normal text-slate-900 leading-tight my-0.5">
                {belumVerifCount}
              </div>
              <div className="text-xs font-semibold text-[#ca8a04]">{belumVerifPct}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Document Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200/90 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4 text-center w-14">No.</th>
                <th className="py-4 px-5 min-w-[220px]">Dokumen</th>
                <th className="py-4 px-5 min-w-[340px]">Upload File</th>
                <th className="py-4 px-4 text-center">Tgl Upload</th>
                <th className="py-4 px-4 text-center">Verifikasi Pengawas</th>
                <th className="py-4 px-4 text-center">Tgl Verifikasi</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-5 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allDocDefs.map((def) => {
                const matchingDocs = docs.filter((d) => d.category === def.code);
                const hasDocs = matchingDocs.length > 0;
                const isUploadingThis = uploadingCategory === def.code;
                const primaryDoc = matchingDocs[0];
                const isVerified = matchingDocs.some((d) => d.status === "terverifikasi");

                return (
                  <tr key={def.code} className="hover:bg-slate-50/60 transition-colors">
                    {/* No. */}
                    <td className="py-4 px-4 text-center font-medium text-slate-500 text-[13.5px] align-top">
                      {def.isCustom ? (
                        <span className="inline-block w-4 h-4 rounded-full bg-slate-300 text-white text-[10px] leading-4 text-center font-bold">
                          &bull;
                        </span>
                      ) : (
                        def.no
                      )}
                    </td>

                    {/* Dokumen Name & Badges */}
                    <td className="py-4 px-5 align-top">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-normal text-slate-800 text-[14.5px]">
                          {def.name}
                        </span>
                        {def.badge && (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              def.badge === "Tambahan"
                                ? "bg-sky-50 text-sky-600 border border-sky-200"
                                : "bg-amber-50 text-amber-600 border border-amber-200"
                            }`}
                          >
                            {def.badge}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Upload File / Files List */}
                    <td className="py-4 px-5">
                      <div className="space-y-2">
                        {/* If files uploaded, show each file box */}
                        {matchingDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-2 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs"
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-mono text-emerald-950 font-medium truncate">
                                {doc.file_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors shadow-2xs"
                                title="Lihat Berkas"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={doc.file_url}
                                download
                                className="p-1.5 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-lg transition-colors shadow-2xs"
                                title="Download Berkas"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm("Hapus file ini?")) {
                                    deleteDocMutation.mutate(doc.id);
                                  }
                                }}
                                className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors shadow-2xs"
                                title="Hapus Berkas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* If single file and not uploaded yet */}
                        {!def.isMulti && !hasDocs && (
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

                        {/* If multi file: Tambah file button */}
                        {def.isMulti && (
                          <div>
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                                onChange={(e) => handleFileSelect(def.code, e)}
                                disabled={isUploadingThis}
                              />
                              <span className="text-[#0d6efd] font-bold">+</span>
                              <span>{isUploadingThis ? "Mengunggah..." : "Tambah file"}</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Tgl Upload */}
                    <td className="py-4 px-4 text-center text-[13px] text-slate-600 font-medium align-top">
                      {primaryDoc ? formatDate(primaryDoc.created_at) : "-"}
                    </td>

                    {/* Verifikasi Pengawas */}
                    <td className="py-4 px-4 text-center align-top">
                      {isVerified ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-emerald-700 text-xs block">
                            Terverifikasi
                          </span>
                          <span className="text-[10.5px] text-slate-400 block font-mono">
                            Oleh: SuperAdmin
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {formatDate(primaryDoc?.verified_at || primaryDoc?.created_at || "")}
                          </span>
                        </div>
                      ) : hasDocs ? (
                        <span className="text-xs font-bold text-amber-600">
                          Dalam Verifikasi
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          Belum Diverifikasi
                        </span>
                      )}
                    </td>

                    {/* Tgl Verifikasi */}
                    <td className="py-4 px-4 text-center text-[13px] text-slate-600 font-medium align-top">
                      {primaryDoc?.verified_at ? formatDate(primaryDoc.verified_at) : "-"}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center text-[13px] font-medium align-top">
                      {isVerified ? (
                        <span className="text-emerald-600 font-bold">verified</span>
                      ) : hasDocs ? (
                        <span className="text-blue-600 font-bold">Dalam Verifikasi</span>
                      ) : (
                        <span className="text-slate-400">Belum Upload</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-5 text-center text-xs align-top">
                      {hasDocs ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              verifyDocMutation.mutate({
                                docId: primaryDoc.id,
                                status: isVerified ? "dalam_verifikasi" : "terverifikasi",
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                              isVerified
                                ? "bg-[#198754] text-white hover:bg-[#157347]"
                                : "bg-[#0dcaf0] text-white hover:bg-[#0bb5d8]"
                            }`}
                          >
                            {isVerified ? "Terverifikasi" : "Verifikasi"}
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

        {/* Sub-footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-600">
          <div>
            4 dokumen wajib + {customDocs.length} tambahan
          </div>

          <button
            type="button"
            onClick={() => setIsAddCustomOpen(true)}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dokumen</span>
          </button>
        </div>
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
                Tambah Dokumen (Tambahan)
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
                    placeholder="e.g., Foto kegiatan tambahan"
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
