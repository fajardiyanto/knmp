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
	KNMPID                 int64              `json:"knmp_id"`
	KNMPName               string             `json:"knmp_name"`
	JenisKNMP              string             `json:"jenis_knmp"`
	RegionalName           string             `json:"regional_name"`
	ProvinceName           string             `json:"province_name"`
	RegencyName            string             `json:"regency_name"`
	DistrictName           string             `json:"district_name"`
	SubDistrictName        string             `json:"sub_district_name"`
	Lat                    string             `json:"lat"`
	Long                   string             `json:"long"`
	NomorKontrak           string             `json:"nomor_kontrak"`
	SPMK                   string             `json:"spmk"`
	NilaiKontrak           float64            `json:"nilai_kontrak"`
	TanggalKontrak         string             `json:"tanggal_kontrak"`
	TanggalMulai           string             `json:"tanggal_mulai"`
	MasaPelaksanaan        int                `json:"masa_pelaksanaan"`
	TanggalSelesai         string             `json:"tanggal_selesai"`
	KontraktorName         string             `json:"kontraktor_name"`
	KonsultanPengawas      string             `json:"konsultan_pengawas"`
	WakilPPK               string             `json:"wakil_ppk"`
	SiteManager            string             `json:"site_manager"`
	PeriodType             string             `json:"period_type"` // harian, mingguan, bulanan, custom
	PeriodLabel            string             `json:"period_label"`
	Date                   string             `json:"date"`
	Week                   int                `json:"week"`
	Month                  int                `json:"month"`
	Year                   int                `json:"year"`
	MonthName              string             `json:"month_name"`
	StartDate              string             `json:"start_date"`
	EndDate                string             `json:"end_date"`
	Cuaca                  string             `json:"cuaca"`
	TimeElapsedPct         float64            `json:"time_elapsed_pct"`
	ProgressPlan           float64            `json:"progress_plan"`
	ProgressActual         float64            `json:"progress_actual"`
	ProgressDeviasi        float64            `json:"progress_deviasi"`
	FinancialPagu          float64            `json:"financial_pagu"`
	FinancialRealisasi     float64            `json:"financial_realisasi"`
	ProgKeuanganPct        float64            `json:"prog_keuangan_pct"`
	FinancialSisa          float64            `json:"financial_sisa"`
	TotalPekerja           int                `json:"total_pekerja"`
	TotalIssues            int                `json:"total_issues"`
	HighlightCapaian       string             `json:"highlight_capaian"`
	HighlightMasalah       string             `json:"highlight_masalah"`
	HighlightTindakLanjut  string             `json:"highlight_tindak_lanjut"`
	MgmtPencapaian         string             `json:"mgmt_pencapaian"`
	MgmtRecovery           string             `json:"mgmt_recovery"`
	MgmtRencana            string             `json:"mgmt_rencana"`
	Quality                QualityPerformance `json:"quality"`
	HSE                    HSEPerformance     `json:"hse"`
	Materials              []MaterialItem     `json:"materials"`
	DocTrackers            []DocTrackerItem   `json:"doc_trackers"`
	LookAheads             []LookAheadItem    `json:"look_aheads"`
	WorkPackages           []WorkPackageItem  `json:"work_packages"`
	Milestones             []MilestoneItem    `json:"milestones"`
	Issues                 []*Issue           `json:"issues"`
	Payments               []*Pembayaran      `json:"payments"`
	Laporans               []*Laporan         `json:"laporans"`
	Absensis               []*Absensi         `json:"absensis"`
	LaporanID              *int64             `json:"laporan_id,omitempty"`
	LaporanNama            string             `json:"laporan_nama"`
	PelaksanaanID          int64              `json:"pelaksanaan_id"`
	PelaksanaanName        string             `json:"pelaksanaan_name"`
	JenisBangunanList      []string           `json:"jenis_bangunan_list"`
	TenagaKerja            int                `json:"tenaga_kerja"`
	Keterangan             string             `json:"keterangan"`
	StatusLaporan          string             `json:"status_laporan"`
	Documents              []*Document        `json:"documents"`
}

type QualityPerformance struct {
	UjiMutuBaru        int `json:"uji_mutu_baru"`
	UjiMutuBuka        int `json:"uji_mutu_buka"`
	UjiMutuSelesai     int `json:"uji_mutu_selesai"`
	UjiMutuTerlambat   int `json:"uji_mutu_terlambat"`
	TemuanNcrBaru      int `json:"temuan_ncr_baru"`
	TemuanNcrBuka      int `json:"temuan_ncr_buka"`
	TemuanNcrSelesai   int `json:"temuan_ncr_selesai"`
	TemuanNcrTerlambat int `json:"temuan_ncr_terlambat"`
	DaftarCacatBaru    int `json:"daftar_cacat_baru"`
	DaftarCacatBuka    int `json:"daftar_cacat_buka"`
	DaftarCacatSelesai int `json:"daftar_cacat_selesai"`
	PerbaikanBaru      int `json:"perbaikan_baru"`
	PerbaikanSelesai   int `json:"perbaikan_selesai"`
}

type HSEPerformance struct {
	JamKerjaSelamatBulanIni  int `json:"jam_kerja_selamat_bulan_ini"`
	JamKerjaSelamatKumulatif int `json:"jam_kerja_selamat_kumulatif"`
	KecelakaanFatal          int `json:"kecelakaan_fatal"`
	NearMiss                 int `json:"near_miss"`
	UnsafeCondition          int `json:"unsafe_condition"`
	ToolboxMeetingBulanIni   int `json:"toolbox_meeting_bulan_ini"`
	ToolboxMeetingKumulatif  int `json:"toolbox_meeting_kumulatif"`
	InspeksiBulanIni         int `json:"inspeksi_bulan_ini"`
	InspeksiKumulatif        int `json:"inspeksi_kumulatif"`
	LostTimeInjury           int `json:"lost_time_injury"`
}

type MaterialItem struct {
	Nama      string  `json:"nama"`
	Rencana   float64 `json:"rencana"`
	Realisasi float64 `json:"realisasi"`
	Status    string  `json:"status"`
}

type DocTrackerItem struct {
	Nama   string `json:"nama"`
	Wajib  int    `json:"wajib"`
	Kirim  int    `json:"kirim"`
	Setuju int    `json:"setuju"`
	Status string `json:"status"`
}

type LookAheadItem struct {
	No     int    `json:"no"`
	Judul  string `json:"judul"`
	Target string `json:"target"`
}

type WorkPackageItem struct {
	No              int     `json:"no"`
	Name            string  `json:"name"`
	Bobot           float64 `json:"bobot"`
	LaluActual      float64 `json:"lalu_actual"`
	BulanIniPlan    float64 `json:"bulan_ini_plan"`
	BulanIniActual  float64 `json:"bulan_ini_actual"`
	KumulatifPlan   float64 `json:"kumulatif_plan"`
	KumulatifActual float64 `json:"kumulatif_actual"`
	Deviasi         float64 `json:"deviasi"`
	Status          string  `json:"status"`
}

type MilestoneItem struct {
	No          int    `json:"no"`
	Name        string `json:"name"`
	PlanDate    string `json:"plan_date"`
	ActualDate  string `json:"actual_date"`
	DeviasiHari int    `json:"deviasi_hari"`
	Status      string `json:"status"`
}

type WeeklyPPKReportData struct {
	JenisLaporan          string                      `json:"jenis_laporan"`
	PPKName               string                      `json:"ppk_name"`
	PPKNip                string                      `json:"ppk_nip"`
	KadisName             string                      `json:"kadis_name"`
	KadisNip              string                      `json:"kadis_nip"`
	Wilayah               string                      `json:"wilayah"`
	TotalLokasi           int                         `json:"total_lokasi"`
	TotalKontraktor       int                         `json:"total_kontraktor"`
	SumberDana            string                      `json:"sumber_dana"`
	TahunAnggaran         int                         `json:"tahun_anggaran"`
	MingguKe              int                         `json:"minggu_ke"`
	TanggalAwal           string                      `json:"tanggal_awal"`
	TanggalAkhir          string                      `json:"tanggal_akhir"`
	TanggalLaporan        string                      `json:"tanggal_laporan"`

	RingkasanNarasi       string                      `json:"ringkasan_narasi"`

	CapaianFisikKumulatif float64                     `json:"capaian_fisik_kumulatif"`
	LokasiOnProgress      int                         `json:"lokasi_on_progress"`
	LokasiSelesai         int                         `json:"lokasi_selesai"`
	LokasiPersiapan       int                         `json:"lokasi_persiapan"`
	LokasiTertunda        int                         `json:"lokasi_tertunda"`
	NilaiKontrakKumulatif float64                     `json:"nilai_kontrak_kumulatif"`
	RealisasiKeuangan     float64                     `json:"realisasi_keuangan"`
	RealisasiKeuanganPct  float64                     `json:"realisasi_keuangan_pct"`
	SisaAnggaran          float64                     `json:"sisa_anggaran"`
	SisaAnggaranPct       float64                     `json:"sisa_anggaran_pct"`

	GISPoints             []WeeklyGISPoint            `json:"gis_points"`
	ProgressRekap         []WeeklyProgressRekapItem   `json:"progress_rekap"`
	ProgressTotalLalu     float64                     `json:"progress_total_lalu"`
	ProgressTotalIni      float64                     `json:"progress_total_ini"`
	ProgressTotalKumulatif float64                    `json:"progress_total_kumulatif"`

	RekapLokasi           []WeeklyLokasiStatusItem    `json:"rekap_lokasi"`
	ProgressKlaster       []WeeklyKlasterProgressItem `json:"progress_klaster"`
	LaporanLapangan       []WeeklyLaporanItem         `json:"laporan_lapangan"`
	Issues                []WeeklyIssueItem           `json:"issues"`
	WorkPlans             []WeeklyWorkPlanItem        `json:"work_plans"`
	Photos                []WeeklyPhotoItem           `json:"photos"`

	K3Kecelakaan          int                         `json:"k3_kecelakaan"`
	K3NearMiss            int                         `json:"k3_near_miss"`
	K3Pelatihan           int                         `json:"k3_pelatihan"`
	K3KepatuhanAPD        float64                     `json:"k3_kepatuhan_apd"`
}

type WeeklyLaporanItem struct {
	No               int     `json:"no"`
	KnmpName         string  `json:"knmp_name"`
	NamaPelaksana    string  `json:"nama_pelaksana"`
	Tanggal          string  `json:"tanggal"`
	JenisLaporan     string  `json:"jenis_laporan"`
	Cuaca            string  `json:"cuaca"`
	TenagaKerja      int     `json:"tenaga_kerja"`
	RencanaProgres   float64 `json:"rencana_progres"`
	RealisasiProgres float64 `json:"realisasi_progres"`
	Status           string  `json:"status"`
	Keterangan       string  `json:"keterangan"`
}

type WeeklyGISPoint struct {
	ID        int64   `json:"id"`
	Name      string  `json:"name"`
	Lat       float64 `json:"lat"`
	Long      float64 `json:"long"`
	Progress  float64 `json:"progress"`
	Status    string  `json:"status"`
	Regency   string  `json:"regency"`
	Province  string  `json:"province"`
}

type WeeklyProgressRekapItem struct {
	No         int     `json:"no"`
	Uraian     string  `json:"uraian"`
	Lokasi     int     `json:"lokasi"`
	MingguLalu float64 `json:"minggu_lalu"`
	MingguIni  float64 `json:"minggu_ini"`
	Kumulatif  float64 `json:"kumulatif"`
	Keterangan string  `json:"keterangan"`
}

type WeeklyLokasiStatusItem struct {
	No         int     `json:"no"`
	Status     string  `json:"status"`
	Jumlah     int     `json:"jumlah"`
	Persentase float64 `json:"persentase"`
	Keterangan string  `json:"keterangan"`
}

type WeeklyKlasterProgressItem struct {
	Code      string  `json:"code"`
	Name      string  `json:"name"`
	Progress  float64 `json:"progress"`
}

type WeeklyIssueItem struct {
	No              int    `json:"no"`
	Deskripsi       string `json:"deskripsi"`
	Lokasi          string `json:"lokasi"`
	Penyebab        string `json:"penyebab"`
	Dampak          string `json:"dampak"`
	TingkatRisiko   string `json:"tingkat_risiko"`
	RencanaMitigasi string `json:"rencana_mitigasi"`
	PIC             string `json:"pic"`
	TargetSelesai   string `json:"target_selesai"`
	Status          string `json:"status"`
}

type WeeklyWorkPlanItem struct {
	No     int     `json:"no"`
	Uraian string  `json:"uraian"`
	Target float64 `json:"target"`
}

type WeeklyPhotoItem struct {
	Title   string `json:"title"`
	FileURL string `json:"file_url"`
}
