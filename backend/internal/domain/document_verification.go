package domain

import "time"

type Document struct {
	ID               int64      `db:"id" json:"id"`
	DocumentableType string     `db:"documentable_type" json:"documentable_type"`
	DocumentableID   int64      `db:"documentable_id" json:"documentable_id"`
	FileName         string     `db:"file_name" json:"file_name"`
	FilePath         string     `db:"file_path" json:"file_path"`
	FileType         *string    `db:"file_type" json:"file_type,omitempty"`
	Category         string     `db:"category" json:"category"`
	Version          string     `db:"version" json:"version"`
	Status           string     `db:"status" json:"status"` // 'pending', 'verified', 'rejected'
	Note             *string    `db:"note" json:"note,omitempty"`
	UploadedAt       time.Time  `db:"uploaded_at" json:"uploaded_at"`
	VerifiedAt       *time.Time `db:"verified_at" json:"verified_at,omitempty"`
	UploadedBy       *int64     `db:"uploaded_by" json:"uploaded_by,omitempty"`
	VerifiedBy       *int64     `db:"verified_by" json:"verified_by,omitempty"`
	CreatedAt        time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt        *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`

	// URL for frontend viewing / downloading
	FileURL          string     `db:"-" json:"file_url"`
}

type Verification struct {
	ID             int64      `db:"id" json:"id"`
	VerifiableType string     `db:"verifiable_type" json:"verifiable_type"` // 'laporan', 'absensi', 'issue', 'document'
	VerifiableID   int64      `db:"verifiable_id" json:"verifiable_id"`
	Step           string     `db:"step" json:"step"`                       // 'pengawas', 'wakil_ppk'
	Status         string     `db:"status" json:"status"`                   // 'pending', 'approved', 'rejected', 'unverified'
	Note           *string    `db:"note" json:"note,omitempty"`
	VerifiedBy     *int64     `db:"verified_by" json:"verified_by,omitempty"`
	VerifiedAt     time.Time  `db:"verified_at" json:"verified_at"`
	IsCurrent      bool       `db:"is_current" json:"is_current"`
	SupersededAt   *time.Time `db:"superseded_at" json:"superseded_at,omitempty"`
	CreatedAt      time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt      *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`

	// Relational details
	VerifierName   *string    `db:"verifier_name" json:"verifier_name,omitempty"`
}
