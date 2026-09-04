import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, RotateCcw } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { useReportsMutations } from "../hooks/useReports";
import type { Laporan } from "../types";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  laporan: Laporan | null;
  mode: "verify" | "unverify";
  step: "pengawas" | "wakil_ppk";
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  laporan,
  mode,
  step,
}) => {
  const { verify, unverify } = useReportsMutations();
  const [status, setStatus] = useState<"approved" | "rejected">("approved");
  const [note, setNote] = useState("");

  if (!laporan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "verify") {
      await verify.mutateAsync({
        id: laporan.id,
        status,
        note,
      });
    } else {
      await unverify.mutateAsync({
        id: laporan.id,
        note,
      });
    }
    onClose();
    setNote("");
  };

  const stepTitle = step === "pengawas" ? "Verifikasi Pengawas Lapangan (Tahap 1)" : "Approval Wakil PPK (Tahap 2)";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "verify" ? stepTitle : `Pembatalan Verifikasi (${stepTitle})`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
          <div className="font-semibold text-slate-900">{laporan.nama}</div>
          <div className="text-slate-500">
            Proyek: {laporan.pelaksanaan_name} &bull; Realisasi: {laporan.realisasi_progres_fisik}% (Deviasi:{" "}
            <span className={laporan.deviasi >= 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
              {laporan.deviasi > 0 ? `+${laporan.deviasi}%` : `${laporan.deviasi}%`}
            </span>
            )
          </div>
        </div>

        {mode === "verify" ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Keputusan Verifikasi *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  status === "approved"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="approved"
                  checked={status === "approved"}
                  onChange={() => setStatus("approved")}
                  className="hidden"
                />
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs">Setujui (Approve)</span>
              </label>

              <label
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  status === "rejected"
                    ? "border-rose-500 bg-rose-50 text-rose-900 font-semibold"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="rejected"
                  checked={status === "rejected"}
                  onChange={() => setStatus("rejected")}
                  className="hidden"
                />
                <XCircle className="w-4 h-4 text-rose-600" />
                <span className="text-xs">Tolak (Reject)</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Tindakan ini akan mengembalikan status laporan ke tahapan sebelumnya untuk perbaikan data.
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan / Alasan Evaluasi {status === "rejected" ? "*" : ""}
          </label>
          <textarea
            required={status === "rejected" || mode === "unverify"}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004B87]"
            placeholder="Tuliskan catatan teknis hasil peninjauan fisik lapangan..."
          />
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            variant={status === "rejected" ? "danger" : "primary"}
            isLoading={verify.isPending || unverify.isPending}
          >
            {mode === "verify" ? "Kirim Keputusan" : "Batalkan Verifikasi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
