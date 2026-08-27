import type { DocumentItem } from "../persiapan/types";

export interface Laporan {
  id: number;
  pelaksanaan_id: number;
  user_id?: number;
  nama: string;
  tanggal: string;
  jenis_laporan: "harian" | "mingguan" | "bulanan";
  keberapa?: number;
  cuaca?: string;
  jumlah_tenaga_kerja: number;
  rencana_progres_fisik: number;
  realisasi_progres_fisik: number;
  deviasi: number;
  status: string;
  lat?: string;
  long?: string;
  keterangan?: string;
  pelaksanaan_name?: string;
  created_at: string;
  updated_at: string;
  jenis_bangunan_details?: LaporanJenisBangunanDetail[];
  current_verification?: VerificationAudit;
}

export interface LaporanJenisBangunanDetail {
  id: number;
  laporan_id: number;
  jenis_bangunan_id: number;
  rencana_progres_fisik: number;
  realisasi_progres_fisik: number;
  deviasi: number;
  keterangan?: string;
  jenis_bangunan_name?: string;
  documents?: DocumentItem[];
}

export interface VerificationAudit {
  id: number;
  step: "pengawas" | "wakil_ppk";
  status: "pending" | "approved" | "rejected" | "unverified";
  note?: string;
  verified_by?: number;
  verifier_name?: string;
  verified_at: string;
}
