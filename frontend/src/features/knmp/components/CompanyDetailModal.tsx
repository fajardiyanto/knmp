import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  X,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  FileSignature,
  Landmark,
  Award,
} from "lucide-react";
import { apiFetch } from "../../../lib/api-client";

export interface PerusahaanDetail {
  id: number;
  nama: string;
  alamat?: string;
  npwp?: string;
  nama_direktur?: string;
  jabatan_direktur?: string;
  no_telp?: string;
  email?: string;
  notaris_akta?: string;
  tanggal_akta?: string;
  no_akta?: string;
  nama_bank?: string;
  norek_bank?: string;
  cabang_bank?: string;
  nama_bank_jaminan?: string;
  no_jaminan?: string;
  tgl_jaminan?: string;
  no_kontrak?: string;
  nama_paket?: string;
}

interface CompanyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  namaPerusahaan?: string;
}

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  isOpen,
  onClose,
  namaPerusahaan,
}) => {
  const { data: company, isLoading } = useQuery<PerusahaanDetail>({
    queryKey: ["perusahaan-detail", namaPerusahaan],
    queryFn: () =>
      apiFetch<PerusahaanDetail>(
        `/api/v1/perusahaan/by-nama?nama=${encodeURIComponent(namaPerusahaan || "")}`
      ),
    enabled: isOpen && !!namaPerusahaan,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header - Bersih & Menyesuaikan Theme (Light = Putih, Dark = Slate 900) */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0d6efd] dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/60">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Profil Perusahaan / Rekanan Penyedia
              </span>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {company?.nama || namaPerusahaan || "Detail Penyedia Jasa"}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/60 dark:bg-slate-950/40 text-xs sm:text-sm">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Memuat profil legal perusahaan...
            </div>
          ) : (
            <>
              {/* Section 1: Pimpinan & Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Direktur & Legalitas */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Pimpinan &amp; Direksi</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Nama Direktur:</span>
                    <strong className="text-slate-900 dark:text-white text-sm font-semibold block mt-0.5">
                      {company?.nama_direktur || "-"}
                    </strong>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {company?.jabatan_direktur || "Direktur"}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">NPWP Perusahaan:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs block mt-0.5">
                      {company?.npwp || "-"}
                    </span>
                  </div>
                </div>

                {/* Kontak & Kantor */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Alamat &amp; Kontak Resmi</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Alamat Kantor:</span>
                    <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed mt-0.5">
                      {company?.alamat || "-"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">No. Telepon / HP:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        {company?.no_telp || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Email:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1 mt-0.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        {company?.email || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Data Perbankan & Rekening Operasional */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Data Rekening &amp; Perbankan Resmi</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Bank Penyalur:</span>
                    <strong className="text-slate-900 dark:text-white font-bold text-sm block mt-0.5">
                      {company?.nama_bank || "-"}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Nomor Rekening:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold text-sm block mt-0.5">
                      {company?.norek_bank || "-"}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Kantor Cabang:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs block mt-0.5">
                      {company?.cabang_bank || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Akta Notaris & Jaminan Pelaksanaan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Akta Pendirian */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                    <FileSignature className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Akta Pendirian Notaris</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Notaris:</span>{" "}
                      <strong className="text-slate-800 dark:text-slate-200">{company?.notaris_akta || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">No. Akta:</span>{" "}
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{company?.no_akta || "-"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Tanggal Akta:</span>{" "}
                      <span className="font-mono text-slate-800 dark:text-slate-200">{company?.tanggal_akta || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Jaminan Pelaksanaan (Bank Garansi) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Jaminan Pelaksanaan (5%)</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Bank Penjamin:</span>{" "}
                      <strong className="text-slate-800 dark:text-slate-200">{company?.nama_bank_jaminan || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">No. Jaminan:</span>{" "}
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{company?.no_jaminan || "-"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Tgl Jaminan:</span>{" "}
                      <span className="font-mono text-slate-800 dark:text-slate-200">{company?.tgl_jaminan || "-"}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Section 4: Paket Pekerjaan & Kontrak Terkait */}
              {company?.no_kontrak && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider mb-1.5">
                    <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Paket Pekerjaan &amp; Kontrak Induk</span>
                  </div>
                  <p className="text-slate-900 dark:text-slate-100 text-xs font-semibold leading-relaxed">
                    {company?.nama_paket || "Paket Pekerjaan Konstruksi Pembangunan KNMP"}
                  </p>
                  <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-bold">
                    No. Kontrak: {company?.no_kontrak}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
