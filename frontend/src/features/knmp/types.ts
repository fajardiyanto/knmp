export interface Knmp {
  id: number;
  regional_id?: number;
  province_id?: number;
  regency_id?: number;
  district_id?: number;
  sub_district_id?: number;
  name: string;
  jenis_knmp: "existing" | "baru";
  lat?: string;
  long?: string;
  status: "aktif" | "nonaktif";
  created_at: string;
  updated_at: string;
  regional_name?: string;
  province_name?: string;
  regency_name?: string;
  district_name?: string;
  sub_district_name?: string;
}

export interface Regional {
  id: number;
  name: string;
}

export interface Province {
  id: number;
  regional_id: number;
  name: string;
}

export interface Regency {
  id: number;
  province_id: number;
  name: string;
  type: string;
}

export interface District {
  id: number;
  regency_id: number;
  name: string;
}

export interface SubDistrict {
  id: number;
  district_id: number;
  name: string;
}

export interface JenisBangunan {
  id: number;
  nama: string;
  deskripsi?: string;
  is_active: boolean;
}
