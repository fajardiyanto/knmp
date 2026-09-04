import type { DocumentItem } from "../preparation/types";

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
  additional_data?: string | LaporanBulananData;
  pelaksanaan_name?: string;
  user_name?: string;
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
  period_type?: "harian" | "mingguan" | "bulanan" | "custom";
  period_label?: string;
  date?: string;
  week?: number;
  month: number;
  year: number;
  month_name: string;
  start_date?: string;
  end_date?: string;
  cuaca?: string;
  progress_plan: number;
  progress_actual: number;
  progress_deviasi: number;
  time_elapsed_pct?: number;
  prog_keuangan_pct?: number;
  financial_pagu: number;
  financial_realisasi: number;
  financial_sisa: number;
  total_pekerja: number;
  total_issues: number;
  highlight_capaian?: string;
  highlight_masalah?: string;
  highlight_tindak_lanjut?: string;
  mgmt_pencapaian?: string;
  mgmt_recovery?: string;
  mgmt_rencana?: string;
  quality?: {
    uji_mutu_baru: number;
    uji_mutu_buka: number;
    uji_mutu_selesai: number;
    uji_mutu_terlambat: number;
    temuan_ncr_baru: number;
    temuan_ncr_buka: number;
    temuan_ncr_selesai: number;
    temuan_ncr_terlambat: number;
    daftar_cacat_baru: number;
    daftar_cacat_buka: number;
    daftar_cacat_selesai: number;
    perbaikan_baru: number;
    perbaikan_selesai: number;
  };
  hse?: {
    jam_kerja_selamat_bulan_ini: number;
    jam_kerja_selamat_kumulatif: number;
    kecelakaan_fatal: number;
    near_miss: number;
    unsafe_condition: number;
    toolbox_meeting_bulan_ini: number;
    toolbox_meeting_kumulatif: number;
    inspeksi_bulan_ini: number;
    inspeksi_kumulatif: number;
    lost_time_injury: number;
  };
  materials?: Array<{
    nama: string;
    rencana: number;
    realisasi: number;
    status: string;
  }>;
  doc_trackers?: Array<{
    nama: string;
    wajib: number;
    kirim: number;
    setuju: number;
    status: string;
  }>;
  look_aheads?: Array<{
    no: number;
    judul: string;
    target: string;
  }>;
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
  laporans?: Array<{
    id: number;
    nama: string;
    tanggal: string;
    jenis_laporan: string;
    keberapa?: number;
    cuaca?: string;
    jumlah_tenaga_kerja: number;
    rencana_progres_fisik: number;
    realisasi_progres_fisik: number;
    keterangan?: string;
  }>;
  absensis?: Array<{
    id: number;
    tipe_absensi: string;
    recorded_at: string;
    status: string;
  }>;
  laporan_id?: number;
  laporan_nama?: string;
  pelaksanaan_id?: number;
  pelaksanaan_name?: string;
  jenis_bangunan_list?: string[];
  tenaga_kerja?: number;
  keterangan?: string;
  status_laporan?: string;
  documents?: DocumentItem[];
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

// FORMAT LAPORAN BULANAN KONSTRUKSI KNMP (KKP Official Format)
export interface LaporanBulananData {
  bulan_tahun: string;
  bulan_kontrak_ke: string;
  status_proyek: "On Track" | "Warning" | "Critical";
  identitas_acuan: LaporanBulananIdentitas;
  checklist_fasilitas: LaporanBulananFasilitas[];
  ringkasan_boq: LaporanBulananRingkasanBoQ[];
  detail_boq: LaporanBulananDetailBoQ[];
  matriks_risiko: LaporanBulananRisiko[];
  dokumentasi_foto: LaporanBulananFoto[];
  pengesahan: LaporanBulananPengesahan;
}

export interface LaporanBulananIdentitas {
  paket_pekerjaan: string;
  lokasi: string;
  jenis_titik: "HUB" | "PENYANGGA";
  no_kontrak_spmk: string;
  kontraktor: string;
  pengawas_ppk: string;
  rencana_kum_pct: number;
  aktual_kum_pct: number;
  deviasi_pct: number;
  termin_keuangan: string;
}

export interface LaporanBulananFasilitas {
  no: number;
  fasilitas: string;
  lingkup: "Ya" | "N/A";
  status: "Belum" | "Proses" | "Selesai";
  catatan: string;
}

export interface LaporanBulananRingkasanBoQ {
  no: number;
  kelompok_boq: string;
  nilai_kontrak: number;
  bobot_pct: number;
  renc_kum_pct: number;
  akt_kum_pct: number;
  deviasi_pct: number;
  keterangan: string;
}

export interface LaporanBulananDetailBoQ {
  no: number;
  kode_boq: string;
  area: string;
  uraian: string;
  bobot_pct: number;
  akt_kum_pct: number;
  nilai_realisasi: number;
  termin_mc: string;
  deviasi_pct: number;
  catatan: string;
}

export interface LaporanBulananRisiko {
  no: number;
  aspek: string;
  kondisi_bulan_ini: string;
  risiko_deviasi: string;
  tindak_lanjut: string;
  pic_target: string;
}

export interface LaporanBulananFoto {
  slot: number; // 1, 2, 3, 4
  file_url: string;
  file_name?: string;
  kode_boq_area: string;
  tanggal: string;
  keterangan: string;
}

export interface LaporanBulananPengesahan {
  pembuat_nama: string;
  pembuat_tanggal: string;
  pemeriksa_nama: string;
  pemeriksa_tanggal: string;
  penyetuju_nama: string;
  penyetuju_tanggal: string;
}
