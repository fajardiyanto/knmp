export interface NotulenUser {
  id: number;
  name: string;
  email: string;
  role_name?: string;
}

export interface NotulenShareDetail {
  user_id: number;
  name: string;
  email: string;
  role_name?: string;
  access_type: "viewer" | "editor";
  shared_at?: string;
}

export interface ShareUserPayload {
  user_id: number;
  access_type: "viewer" | "editor";
}

export interface Notulen {
  id: number;
  knmp_id?: number | null;
  judul: string;
  tanggal: string;
  waktu_mulai?: string;
  waktu_selesai?: string;
  lokasi?: string;
  pimpinan_rapat?: string;
  notulis?: string;
  agenda?: string;
  hasil_pembahasan: string;
  tindak_lanjut?: string;
  status: "published" | "draft" | string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;

  // Joined relational data
  knmp_name?: string;
  created_by_name?: string;
  shared_users?: NotulenShareDetail[];
  shared_user_ids?: number[];
  user_access?: "owner" | "editor" | "viewer" | string;
  documents?: Array<{
    id: number;
    file_path: string;
    file_url?: string;
    original_name: string;
  }>;
}

export interface NotulenFormData {
  knmp_id?: number | null;
  judul: string;
  tanggal: string;
  waktu_mulai?: string;
  waktu_selesai?: string;
  lokasi?: string;
  pimpinan_rapat?: string;
  notulis?: string;
  agenda?: string;
  hasil_pembahasan: string;
  tindak_lanjut?: string;
  status?: string;
  shared_users?: ShareUserPayload[];
  shared_user_ids?: number[];
}

export interface NotulenFilter {
  knmp_id?: number;
  search?: string;
  tanggal_awal?: string;
  tanggal_akhir?: string;
  limit?: number;
  offset?: number;
}
