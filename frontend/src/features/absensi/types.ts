import type { DocumentItem } from "../persiapan/types";
import type { VerificationAudit } from "../laporan/types";

export interface Absensi {
  id: number;
  pelaksanaan_id: number;
  user_id?: number;
  tipe_absensi: "masuk" | "pulang";
  recorded_at: string;
  lat?: string;
  long?: string;
  status: string;
  user_name?: string;
  pelaksanaan_name?: string;
  created_at: string;
  updated_at: string;
  documents?: DocumentItem[];
  current_verification?: VerificationAudit;
}
