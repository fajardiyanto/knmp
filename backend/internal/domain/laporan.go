package domain

import "time"

type Laporan struct {
	ID                    int64      `db:"id" json:"id"`
	PelaksanaanID         int64      `db:"pelaksanaan_id" json:"pelaksanaan_id"`
	UserID                *int64     `db:"user_id" json:"user_id,omitempty"`
	Nama                  string     `db:"nama" json:"nama"`
	Tanggal               string     `db:"tanggal" json:"tanggal"`
	JenisLaporan          string     `db:"jenis_laporan" json:"jenis_laporan"` // 'harian', 'mingguan', 'bulanan'
	Keberapa              *int       `db:"keberapa" json:"keberapa,omitempty"`
	Cuaca                 *string    `db:"cuaca" json:"cuaca,omitempty"`
	JumlahTenagaKerja     int        `db:"jumlah_tenaga_kerja" json:"jumlah_tenaga_kerja"`
	RencanaProgresFisik   float64    `db:"rencana_progres_fisik" json:"rencana_progres_fisik"`
	RealisasiProgresFisik float64    `db:"realisasi_progres_fisik" json:"realisasi_progres_fisik"`
	Status                string     `db:"status" json:"status"` // 'menunggu_pengawas', 'menunggu_wakil_ppk', 'terverifikasi', 'ditolak_pengawas', 'ditolak_wakil_ppk'
	Lat                   *string    `db:"lat" json:"lat,omitempty"`
	Long                  *string    `db:"long" json:"long,omitempty"`
	Keterangan            *string    `db:"keterangan" json:"keterangan,omitempty"`
	AdditionalData        *string    `db:"additional_data" json:"additional_data,omitempty"`
	CreatedBy             *int64     `db:"created_by" json:"created_by,omitempty"`
	UpdatedBy             *int64     `db:"updated_by" json:"updated_by,omitempty"`
	CreatedAt             time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt             time.Time  `db:"updated_at" json:"updated_at"`

	// Derived / Relational
	Deviasi               float64                  `db:"-" json:"deviasi"`
	PelaksanaanName       *string                  `db:"pelaksanaan_name" json:"pelaksanaan_name,omitempty"`
	UserName              *string                  `db:"user_name" json:"user_name,omitempty"`
	JenisBangunanDetails []*LaporanJenisBangunan   `db:"-" json:"jenis_bangunan_details,omitempty"`
	Documents             []*Document              `db:"-" json:"documents,omitempty"`
	CurrentVerification   *Verification            `db:"-" json:"current_verification,omitempty"`
}

type LaporanJenisBangunan struct {
	ID                    int64       `db:"id" json:"id"`
	LaporanID             int64       `db:"laporan_id" json:"laporan_id"`
	JenisBangunanID       int64       `db:"jenis_bangunan_id" json:"jenis_bangunan_id"`
	RencanaProgresFisik   float64     `db:"rencana_progres_fisik" json:"rencana_progres_fisik"`
	RealisasiProgresFisik float64     `db:"realisasi_progres_fisik" json:"realisasi_progres_fisik"`
	Keterangan            *string     `db:"keterangan" json:"keterangan,omitempty"`
	CreatedAt             time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt             time.Time   `db:"updated_at" json:"updated_at"`

	// Relational / Populated
	Deviasi               float64     `db:"-" json:"deviasi"`
	JenisBangunanName     *string     `db:"jenis_bangunan_name" json:"jenis_bangunan_name,omitempty"`
	Documents             []*Document `db:"-" json:"documents,omitempty"`
}
