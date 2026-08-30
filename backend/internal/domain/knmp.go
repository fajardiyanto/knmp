package domain

import "time"

type Knmp struct {
	ID            int64     `db:"id" json:"id"`
	RegionalID    *int64    `db:"regional_id" json:"regional_id,omitempty"`
	ProvinceID    *int64    `db:"province_id" json:"province_id,omitempty"`
	RegencyID     *int64    `db:"regency_id" json:"regency_id,omitempty"`
	DistrictID    *int64    `db:"district_id" json:"district_id,omitempty"`
	SubDistrictID *int64    `db:"sub_district_id" json:"sub_district_id,omitempty"`
	Name          string    `db:"name" json:"name"`
	JenisKnmp     string    `db:"jenis_knmp" json:"jenis_knmp"` // 'existing' | 'baru'
	Lat           *string   `db:"lat" json:"lat,omitempty"`
	Long          *string   `db:"long" json:"long,omitempty"`
	Status        string    `db:"status" json:"status"` // 'aktif' | 'nonaktif'
	CreatedAt     time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt     *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`

	RegionalName    *string `db:"regional_name" json:"regional_name,omitempty"`
	ProvinceName    *string `db:"province_name" json:"province_name,omitempty"`
	RegencyName     *string `db:"regency_name" json:"regency_name,omitempty"`
	DistrictName    *string `db:"district_name" json:"district_name,omitempty"`
	SubDistrictName *string `db:"sub_district_name" json:"sub_district_name,omitempty"`
	NamaPT          *string `db:"nama_pt" json:"nama_pt,omitempty"`
	PerusahaanID    *int64  `db:"perusahaan_id" json:"perusahaan_id,omitempty"`
}

type Periode struct {
	ID           int64      `db:"id" json:"id"`
	Year         int        `db:"year" json:"year"`
	TanggalMulai string     `db:"tanggal_mulai" json:"tanggal_mulai"`
	TanggalAkhir string     `db:"tanggal_akhir" json:"tanggal_akhir"`
	CreatedAt    time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt    *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`
}

type JenisBangunan struct {
	ID        int64      `db:"id" json:"id"`
	Nama      string     `db:"nama" json:"nama"`
	Deskripsi *string    `db:"deskripsi" json:"deskripsi,omitempty"`
	IsActive  bool       `db:"is_active" json:"is_active"`
	CreatedAt time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`
}
