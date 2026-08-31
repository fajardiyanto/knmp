import React, { useRef } from "react";
import { X, Calendar, Clock, MapPin, User, Users, FileText, CheckSquare, Printer, Share2, Download, Building } from "lucide-react";
import type { Notulen } from "../types/notulen.types";

interface NotulenDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  notulen: Notulen | null;
  onOpenShare?: (notulen: Notulen) => void;
  canManage?: boolean;
}

export const NotulenDetailModal: React.FC<NotulenDetailModalProps> = ({
  isOpen,
  onClose,
  notulen,
  onOpenShare,
  canManage = false,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !notulen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDateIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/30 rounded-lg">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-blue-400">
                Berita Acara & Notulensi Rapat Resmi
              </span>
              <h3 className="text-base font-bold text-white line-clamp-1">{notulen.judul}</h3>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canManage && onOpenShare && (
              <button
                onClick={() => onOpenShare(notulen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-xl text-xs font-bold transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-100 dark:bg-slate-950">
          <div
            ref={printRef}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-8 max-w-3xl mx-auto space-y-6 text-slate-800 dark:text-slate-200"
          >
            {/* Header Document BUMN */}
            <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-blue-900 text-white text-[10px] font-black rounded uppercase tracking-wider">
                    PERTAMINA
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    KNMP PROYEK SE-SUMATERA
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase mt-1 tracking-tight">
                  NOTULENSI & BERITA ACARA RAPAT
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nomor Arsip: NOT-KNMP/{notulen.id}/{new Date(notulen.tanggal).getFullYear()}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-full uppercase">
                  {notulen.status}
                </span>
              </div>
            </div>

            {/* Metadata Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="w-32 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Hari / Tanggal:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatDateIndo(notulen.tanggal)}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-32 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> Waktu:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {notulen.waktu_mulai || "09:00"} - {notulen.waktu_selesai || "Selesai"} WIB
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-32 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Tempat/Platform:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {notulen.lokasi || "Ruang Rapat Koordinasi"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="w-32 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-600" /> Titik KNMP:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {notulen.knmp_name || "Koordinasi Seluruh Sumatera"}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-32 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" /> Pimpinan Rapat:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {notulen.pimpinan_rapat || "PPK KNMP Pertamina"}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-32 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" /> Notulis Rapat:
                  </span>
                  <span className="font-semibold text-blue-700 dark:text-blue-400">
                    {notulen.notulis || "Super Admin"}
                  </span>
                </div>
              </div>
            </div>

            {/* Agenda */}
            {notulen.agenda && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">
                  I. Agenda Pembahasan
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {notulen.agenda}
                </p>
              </div>
            )}

            {/* Hasil Pembahasan */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">
                II. Poin Pembahasan & Hasil Rapat
              </h4>
              <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {notulen.hasil_pembahasan}
              </div>
            </div>

            {/* Tindak Lanjut */}
            {notulen.tindak_lanjut && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">
                  III. Rencana Tindak Lanjut (Action Items & PIC)
                </h4>
                <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  {notulen.tindak_lanjut}
                </div>
              </div>
            )}

            {/* Peserta yang Dibagikan (Shared Recipients) */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 mb-2 flex items-center justify-between">
                <span>IV. Distribusi & Penerima Notulen ({notulen.shared_users?.length || 0} Pengguna)</span>
              </h4>
              {notulen.shared_users && notulen.shared_users.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {notulen.shared_users.map((u) => (
                    <div
                      key={u.id}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center space-x-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px]">
                        {u.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="truncate flex-1">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{u.role_name || "User"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Notulen ini belum dibagikan ke pengguna lain.</p>
              )}
            </div>

            {/* Tanda Tangan Notulen */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs border-t border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Pimpinan Rapat,</p>
                <div className="h-16"></div>
                <p className="font-bold text-slate-900 dark:text-white underline">
                  {notulen.pimpinan_rapat || "PPK KNMP Pertamina"}
                </p>
                <p className="text-[10px] text-slate-400">Pimpinan Sidang / Rapat</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Notulis,</p>
                <div className="h-16"></div>
                <p className="font-bold text-slate-900 dark:text-white underline">
                  {notulen.notulis || "Super Admin"}
                </p>
                <p className="text-[10px] text-slate-400">Notulis Rapat Koordinasi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
