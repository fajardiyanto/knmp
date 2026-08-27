export interface Persiapan {
  id: number;
  knmp_id: number;
  user_id?: number;
  nama: string;
  tanggal: string;
  jenis: "kontrak" | "lapangan";
  keterangan?: string;
  status?: string;
  knmp_name?: string;
  created_at: string;
  updated_at: string;
  documents?: DocumentItem[];
}

export interface PCM {
  id: number;
  persiapan_kontrak_id: number;
  nama: string;
  tanggal: string;
  keterangan?: string;
  created_at: string;
  updated_at: string;
  documents?: DocumentItem[];
}

export interface DocumentItem {
  id: number;
  documentable_type: string;
  documentable_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  category: string;
  status: "pending" | "verified" | "rejected";
  note?: string;
  file_url: string;
}
