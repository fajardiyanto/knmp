package domain

import "time"

type Absensi struct {
	ID                  int64         `db:"id" json:"id"`
	PelaksanaanID       int64         `db:"pelaksanaan_id" json:"pelaksanaan_id"`
	UserID              *int64        `db:"user_id" json:"user_id,omitempty"`
	TipeAbsensi         string        `db:"tipe_absensi" json:"tipe_absensi"` // 'hadir' | 'pulang'
	RecordedAt          time.Time     `db:"recorded_at" json:"recorded_at"`
	Lat                 *string       `db:"lat" json:"lat,omitempty"`
	Long                *string       `db:"long" json:"long,omitempty"`
	Status              string        `db:"status" json:"status"` // 'menunggu_pengawas', 'menunggu_wakil_ppk', 'terverifikasi', 'ditolak_pengawas', 'ditolak_wakil_ppk'
	CreatedBy           *int64        `db:"created_by" json:"created_by,omitempty"`
	UpdatedBy           *int64        `db:"updated_by" json:"updated_by,omitempty"`
	CreatedAt           time.Time     `db:"created_at" json:"created_at"`
	UpdatedAt           time.Time     `db:"updated_at" json:"updated_at"`

	// Relational details
	PelaksanaanName     *string       `db:"pelaksanaan_name" json:"pelaksanaan_name,omitempty"`
	Documents           []*Document   `db:"-" json:"documents,omitempty"`
	CurrentVerification *Verification `db:"-" json:"current_verification,omitempty"`
}

type Issue struct {
	ID                  int64         `db:"id" json:"id"`
	KnmpID              *int64        `db:"knmp_id" json:"knmp_id,omitempty"`
	KategoriIssue       string        `db:"kategori_issue" json:"kategori_issue"` // 'K3', 'mutu', 'cuaca', 'material'
	Tingkat             string        `db:"tingkat" json:"tingkat"`               // 'ringan', 'sedang', 'kritis', 'lainnya'
	Status              string        `db:"status" json:"status"`
	UraianMasalah       string        `db:"uraian_masalah" json:"uraian_masalah"`
	CreatedBy           *int64        `db:"created_by" json:"created_by,omitempty"`
	CreatedAt           time.Time     `db:"created_at" json:"created_at"`
	UpdatedAt           time.Time     `db:"updated_at" json:"updated_at"`

	// Relational details
	KnmpName            *string       `db:"knmp_name" json:"knmp_name,omitempty"`
	CreatedByName       *string       `db:"created_by_name" json:"created_by_name,omitempty"`
	Documents           []*Document   `db:"-" json:"documents,omitempty"`
	CurrentVerification *Verification `db:"-" json:"current_verification,omitempty"`
}

type Pembayaran struct {
	ID                 int64       `db:"id" json:"id"`
	PersiapanKontrakID int64       `db:"persiapan_kontrak_id" json:"persiapan_kontrak_id"`
	Kategori           *string     `db:"kategori" json:"kategori,omitempty"`
	Name               string      `db:"name" json:"name"`
	Termin             string      `db:"termin" json:"termin"`
	RealisasiAnggaran  float64     `db:"realisasi_anggaran" json:"realisasi_anggaran"`
	RealisasiFisik     float64     `db:"realisasi_fisik" json:"realisasi_fisik"`
	NorekPekerja       *string     `db:"norek_pekerja" json:"norek_pekerja,omitempty"`
	CreatedAt          time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt          time.Time   `db:"updated_at" json:"updated_at"`

	// Relational details
	PersiapanName      *string     `db:"persiapan_name" json:"persiapan_name,omitempty"`
	Documents          []*Document `db:"-" json:"documents,omitempty"`
}
