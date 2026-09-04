package domain

import "time"

type Pelaksanaan struct {
	ID             int64       `db:"id" json:"id"`
	KnmpID         *int64      `db:"knmp_id" json:"knmp_id,omitempty"`
	UserID         *int64      `db:"user_id" json:"user_id,omitempty"`
	Nama           string      `db:"nama" json:"nama"`
	Tanggal        string      `db:"tanggal" json:"tanggal"`
	JenisLaporan   *string     `db:"jenis_laporan" json:"jenis_laporan,omitempty"`
	StatusK3       *string     `db:"status_k3" json:"status_k3,omitempty"`
	Kendala        *string     `db:"kendala" json:"kendala,omitempty"`
	Keterangan     *string     `db:"keterangan" json:"keterangan,omitempty"`
	AdditionalData *string     `db:"additional_data" json:"additional_data,omitempty"`
	CreatedBy      *int64      `db:"created_by" json:"created_by,omitempty"`
	UpdatedBy      *int64      `db:"updated_by" json:"updated_by,omitempty"`
	CreatedAt      time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time   `db:"updated_at" json:"updated_at"`
	DeletedAt      *time.Time  `db:"deleted_at" json:"deleted_at,omitempty"`

	// Relational details
	KnmpName      *string     `db:"knmp_name" json:"knmp_name,omitempty"`
	UserName      *string     `db:"user_name" json:"user_name,omitempty"`
	Documents     []*Document `db:"-" json:"documents,omitempty"`
	MilestoneProg int         `db:"-" json:"milestone_progress"` // 0, 50, 75, 90
}
