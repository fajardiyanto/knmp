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
	DeletedAt             *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`

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
	DeletedAt             *time.Time  `db:"deleted_at" json:"deleted_at,omitempty"`

	// Relational / Populated
	Deviasi               float64     `db:"-" json:"deviasi"`
	JenisBangunanName     *string     `db:"jenis_bangunan_name" json:"jenis_bangunan_name,omitempty"`
	Documents             []*Document `db:"-" json:"documents,omitempty"`
}

type MonthlyProjectReportData struct {
	KNMPID             int64              `json:"knmp_id"`
	KNMPName           string             `json:"knmp_name"`
	JenisKNMP          string             `json:"jenis_knmp"`
	RegionalName       string             `json:"regional_name"`
	ProvinceName       string             `json:"province_name"`
	RegencyName        string             `json:"regency_name"`
	DistrictName       string             `json:"district_name"`
	SubDistrictName    string             `json:"sub_district_name"`
	Lat                string             `json:"lat"`
	Long               string             `json:"long"`
	NomorKontrak       string             `json:"nomor_kontrak"`
	SPMK               string             `json:"spmk"`
	NilaiKontrak       float64            `json:"nilai_kontrak"`
	TanggalKontrak     string             `json:"tanggal_kontrak"`
	TanggalMulai       string             `json:"tanggal_mulai"`
	MasaPelaksanaan    int                `json:"masa_pelaksanaan"`
	TanggalSelesai     string             `json:"tanggal_selesai"`
	KontraktorName     string             `json:"kontraktor_name"`
	KonsultanPengawas  string             `json:"konsultan_pengawas"`
	WakilPPK           string             `json:"wakil_ppk"`
	SiteManager        string             `json:"site_manager"`
	Month              int                `json:"month"`
	Year               int                `json:"year"`
	MonthName          string             `json:"month_name"`
	ProgressPlan       float64            `json:"progress_plan"`
	ProgressActual     float64            `json:"progress_actual"`
	ProgressDeviasi    float64            `json:"progress_deviasi"`
	FinancialPagu      float64            `json:"financial_pagu"`
	FinancialRealisasi float64            `json:"financial_realisasi"`
	FinancialSisa      float64            `json:"financial_sisa"`
	TotalPekerja       int                `json:"total_pekerja"`
	TotalIssues        int                `json:"total_issues"`
	WorkPackages       []WorkPackageItem  `json:"work_packages"`
	Milestones         []MilestoneItem    `json:"milestones"`
	Issues             []*Issue           `json:"issues"`
	Payments           []*Pembayaran      `json:"payments"`
}

type WorkPackageItem struct {
	No               int     `json:"no"`
	Name             string  `json:"name"`
	Bobot            float64 `json:"bobot"`
	LaluActual       float64 `json:"lalu_actual"`
	BulanIniPlan     float64 `json:"bulan_ini_plan"`
	BulanIniActual   float64 `json:"bulan_ini_actual"`
	KumulatifPlan    float64 `json:"kumulatif_plan"`
	KumulatifActual  float64 `json:"kumulatif_actual"`
	Deviasi          float64 `json:"deviasi"`
	Status           string  `json:"status"`
}

type MilestoneItem struct {
	No          int     `json:"no"`
	Name        string  `json:"name"`
	PlanDate    string  `json:"plan_date"`
	ActualDate  string  `json:"actual_date"`
	DeviasiHari int     `json:"deviasi_hari"`
	Status      string  `json:"status"`
}
