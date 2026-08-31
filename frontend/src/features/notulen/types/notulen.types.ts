export interface NotulenUser {
  id: number;
  name: string;
  email: string;
  role_name?: string;
}

export interface NotulenDocument {
  id: number;
  file_name: string;
  file_path: string;
  file_url?: string;
  file_type?: string;
  category?: string;
  status: string;
  created_at: string;
}

export interface Notulen {
  id: number;
  knmp_id?: number | null;
  knmp_name?: string | null;
  judul: string;
  tanggal: string;
  waktu_mulai?: string | null;
  waktu_selesai?: string | null;
  lokasi?: string | null;
  pimpinan_rapat?: string | null;
  notulis: string;
  agenda?: string | null;
  hasil_pembahasan: string;
  tindak_lanjut?: string | null;
  status: string; // 'published' | 'draft'
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
  shared_users?: NotulenUser[];
  shared_user_ids?: number[];
  documents?: NotulenDocument[];
}

export interface NotulenFormData {
  knmp_id?: number | null;
  judul: string;
  tanggal: string;
  waktu_mulai?: string;
  waktu_selesai?: string;
  lokasi?: string;
  pimpinan_rapat?: string;
  notulis: string;
  agenda?: string;
  hasil_pembahasan: string;
  tindak_lanjut?: string;
  status: string;
  shared_user_ids?: number[];
}

export interface NotulenFilter {
  knmp_id?: number | null;
  search?: string;
  tanggal_awal?: string;
  tanggal_akhir?: string;
  limit?: number;
  offset?: number;
}
