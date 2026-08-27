import type { DocumentItem } from "../persiapan/types";
import type { VerificationAudit } from "../laporan/types";

export interface Issue {
  id: number;
  knmp_id: number;
  user_id?: number;
  kategori_issue: string;
  tingkat: "kritis" | "sedang" | "ringan";
  status: string;
  uraian_masalah: string;
  knmp_name?: string;
  user_name?: string;
  created_at: string;
  updated_at: string;
  documents?: DocumentItem[];
  current_verification?: VerificationAudit;
}
