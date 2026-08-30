package domain

import "time"

type Perusahaan struct {
	ID              int64      `db:"id" json:"id"`
	Nama            string     `db:"nama" json:"nama"`
	Alamat          *string    `db:"alamat" json:"alamat,omitempty"`
	NPWP            *string    `db:"npwp" json:"npwp,omitempty"`
	NamaDirektur    *string    `db:"nama_direktur" json:"nama_direktur,omitempty"`
	JabatanDirektur *string    `db:"jabatan_direktur" json:"jabatan_direktur,omitempty"`
	NoTelp          *string    `db:"no_telp" json:"no_telp,omitempty"`
	Email           *string    `db:"email" json:"email,omitempty"`
	NotarisAkta     *string    `db:"notaris_akta" json:"notaris_akta,omitempty"`
	TanggalAkta     *string    `db:"tanggal_akta" json:"tanggal_akta,omitempty"`
	NoAkta          *string    `db:"no_akta" json:"no_akta,omitempty"`
	NamaBank        *string    `db:"nama_bank" json:"nama_bank,omitempty"`
	NorekBank       *string    `db:"norek_bank" json:"norek_bank,omitempty"`
	CabangBank      *string    `db:"cabang_bank" json:"cabang_bank,omitempty"`
	NamaBankJaminan *string    `db:"nama_bank_jaminan" json:"nama_bank_jaminan,omitempty"`
	NoJaminan       *string    `db:"no_jaminan" json:"no_jaminan,omitempty"`
	TglJaminan      *string    `db:"tgl_jaminan" json:"tgl_jaminan,omitempty"`
	NoKontrak       *string    `db:"no_kontrak" json:"no_kontrak,omitempty"`
	NamaPaket       *string    `db:"nama_paket" json:"nama_paket,omitempty"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt       *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`
}
