package domain

import "time"

type Persiapan struct {
	ID             int64      `db:"id" json:"id"`
	KnmpID         *int64     `db:"knmp_id" json:"knmp_id,omitempty"`
	UserID         *int64     `db:"user_id" json:"user_id,omitempty"`
	Nama           string     `db:"nama" json:"nama"`
	Tanggal        string     `db:"tanggal" json:"tanggal"`
	Jenis          string     `db:"jenis" json:"jenis"` // 'kontrak' | 'lapangan'
	Keterangan     *string    `db:"keterangan" json:"keterangan,omitempty"`
	Status         *string    `db:"status" json:"status,omitempty"`
	AdditionalData *string    `db:"additional_data" json:"additional_data,omitempty"`
	CreatedBy      *int64     `db:"created_by" json:"created_by,omitempty"`
	UpdatedBy      *int64     `db:"updated_by" json:"updated_by,omitempty"`
	CreatedAt      time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt      *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`

	// Relational details
	KnmpName  *string     `db:"knmp_name" json:"knmp_name,omitempty"`
	UserName  *string     `db:"user_name" json:"user_name,omitempty"`
	Documents []*Document `db:"-" json:"documents,omitempty"`
}

type PCM struct {
	ID                 int64       `db:"id" json:"id"`
	PersiapanKontrakID int64       `db:"persiapan_kontrak_id" json:"persiapan_kontrak_id"`
	Nama               string      `db:"nama" json:"nama"`
	Tanggal            string      `db:"tanggal" json:"tanggal"`
	Keterangan         *string     `db:"keterangan" json:"keterangan,omitempty"`
	CreatedAt          time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt          time.Time   `db:"updated_at" json:"updated_at"`
	DeletedAt          *time.Time  `db:"deleted_at" json:"deleted_at,omitempty"`
	KontrakNama        *string     `db:"kontrak_nama" json:"kontrak_nama,omitempty"`
	Documents          []*Document `db:"-" json:"documents,omitempty"`
}
