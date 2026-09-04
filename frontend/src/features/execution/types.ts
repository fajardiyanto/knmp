import type { DocumentItem } from "../preparation/types";

export interface Pelaksanaan {
  id: number;
  knmp_id: number;
  user_id?: number;
  nama: string;
  tanggal: string;
  jenis_laporan?: string;
  status_k3?: string;
  kendala?: string;
  keterangan?: string;
  knmp_name?: string;
  created_at: string;
  updated_at: string;
  documents?: DocumentItem[];
  milestone_progress?: number;
}
