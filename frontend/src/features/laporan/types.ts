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

export interface MonthlyProjectReportData {
  knmp_id: number;
  knmp_name: string;
  jenis_knmp: string;
  regional_name: string;
  province_name: string;
  regency_name: string;
  district_name: string;
  sub_district_name: string;
  lat: string;
  long: string;
  nomor_kontrak: string;
  spmk: string;
  nilai_kontrak: number;
  tanggal_kontrak: string;
  tanggal_mulai: string;
  masa_pelaksanaan: number;
  tanggal_selesai: string;
  kontraktor_name: string;
  konsultan_pengawas: string;
  wakil_ppk: string;
  site_manager: string;
  month: number;
  year: number;
  month_name: string;
  progress_plan: number;
  progress_actual: number;
  progress_deviasi: number;
  financial_pagu: number;
  financial_realisasi: number;
  financial_sisa: number;
  total_pekerja: number;
  total_issues: number;
  work_packages: WorkPackageItem[];
  milestones: MilestoneItem[];
  issues?: Array<{
    id: number;
    judul: string;
    kategori_issue: string;
    dampak?: string;
    tingkat: string;
    status: string;
  }>;
  payments?: Array<{
    id: number;
    name: string;
    termin: string;
    realisasi_anggaran: number;
    realisasi_fisik: number;
  }>;
}

export interface WorkPackageItem {
  no: number;
  name: string;
  bobot: number;
  lalu_actual: number;
  bulan_ini_plan: number;
  bulan_ini_actual: number;
  kumulatif_plan: number;
  kumulatif_actual: number;
  deviasi: number;
  status: string;
}

export interface MilestoneItem {
  no: number;
  name: string;
  plan_date: string;
  actual_date: string;
  deviasi_hari: number;
  status: string;
}
