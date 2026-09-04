import type { DocumentItem } from "../preparation/types";

export interface Pembayaran {
  id: number;
  persiapan_kontrak_id: number;
  kategori?: string;
  name: string;
  termin: string;
  realisasi_anggaran: number;
  realisasi_fisik: number;
  norek_pekerja?: string;
  persiapan_kontrak_name?: string;
  created_at: string;
  updated_at: string;
  documents?: DocumentItem[];
}

export interface PembayaranSummary {
  total_anggaran_terserap: number;
  total_termin: number;
}

export interface TerminStats {
  termin: string;
  count: number;
  total_anggaran: number;
  avg_fisik: number;
}
