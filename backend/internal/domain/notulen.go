package domain

import "time"

type Notulen struct {
	ID              int64      `db:"id" json:"id"`
	KnmpID          *int64     `db:"knmp_id" json:"knmp_id,omitempty"`
	Judul           string     `db:"judul" json:"judul"`
	Tanggal         string     `db:"tanggal" json:"tanggal"`
	WaktuMulai      *string    `db:"waktu_mulai" json:"waktu_mulai,omitempty"`
	WaktuSelesai    *string    `db:"waktu_selesai" json:"waktu_selesai,omitempty"`
	Lokasi          *string    `db:"lokasi" json:"lokasi,omitempty"`
	PimpinanRapat   *string    `db:"pimpinan_rapat" json:"pimpinan_rapat,omitempty"`
	Notulis         string     `db:"notulis" json:"notulis"`
	Agenda          *string    `db:"agenda" json:"agenda,omitempty"`
	HasilPembahasan string     `db:"hasil_pembahasan" json:"hasil_pembahasan"`
	TindakLanjut    *string    `db:"tindak_lanjut" json:"tindak_lanjut,omitempty"`
	Status          string     `db:"status" json:"status"` // 'published' | 'draft'
	CreatedBy       *int64     `db:"created_by" json:"created_by,omitempty"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt       *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`

	// Relational details
	KnmpName      *string     `db:"knmp_name" json:"knmp_name,omitempty"`
	CreatedByName *string     `db:"created_by_name" json:"created_by_name,omitempty"`
	SharedUsers   []*User     `db:"-" json:"shared_users,omitempty"`
	SharedUserIDs []int64     `db:"-" json:"shared_user_ids,omitempty"`
	Documents     []*Document `db:"-" json:"documents,omitempty"`
}

type NotulenShare struct {
	ID        int64     `db:"id" json:"id"`
	NotulenID int64     `db:"notulen_id" json:"notulen_id"`
	UserID    int64     `db:"user_id" json:"user_id"`
	SharedAt  time.Time `db:"shared_at" json:"shared_at"`
}

type NotulenFilter struct {
	KnmpID       *int64
	Search       string
	TanggalAwal  string
	TanggalAkhir string
	UserID       int64  // Current logged in user
	UserRole     string // Current logged in user role (to decide if global or scoped)
	Limit        int
	Offset       int
}
