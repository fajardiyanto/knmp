package repository

import (
	"context"
	"knmp-v2-backend/internal/domain"
)

type UserRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	List(ctx context.Context, search string) ([]*domain.User, error)
	Create(ctx context.Context, user *domain.User) error
	Update(ctx context.Context, user *domain.User) error
	Delete(ctx context.Context, id int64) error
	GetUserRoles(ctx context.Context, userID int64) ([]string, error)
	GetUserPermissions(ctx context.Context, userID int64) ([]string, error)
	GetUserKnmpIDs(ctx context.Context, userID int64) ([]int64, error)
	AssignRole(ctx context.Context, userID int64, roleName string) error
	AssignKnmps(ctx context.Context, userID int64, knmpIDs []int64) error
	ListRoles(ctx context.Context) ([]*domain.Role, error)
}

type GeoRepository interface {
	ListRegionals(ctx context.Context) ([]*domain.Regional, error)
	ListProvincesByRegional(ctx context.Context, regionalID int64) ([]*domain.Province, error)
	ListRegenciesByProvince(ctx context.Context, provinceID int64) ([]*domain.Regency, error)
	ListDistrictsByRegency(ctx context.Context, regencyID int64) ([]*domain.District, error)
	ListSubDistrictsByDistrict(ctx context.Context, districtID int64) ([]*domain.SubDistrict, error)
}

type KnmpFilter struct {
	Search        string
	RegionalID    *int64
	ProvinceID    *int64
	RegencyID     *int64
	DistrictID    *int64
	SubDistrictID *int64
	JenisKnmp     string
	Status        string
	UserKnmpIDs   []int64
	Limit         int
	Offset        int
}

type KnmpRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.Knmp, error)
	List(ctx context.Context, filter KnmpFilter) ([]*domain.Knmp, error)
	Create(ctx context.Context, knmp *domain.Knmp) error
	Update(ctx context.Context, knmp *domain.Knmp) error
	Delete(ctx context.Context, id int64) error
	GetWidgetStats(ctx context.Context) (map[string]any, error)
	ListMap(ctx context.Context) ([]*domain.Knmp, error)
	ListPeriodes(ctx context.Context) ([]*domain.Periode, error)
	CreatePeriode(ctx context.Context, p *domain.Periode) error
	UpdatePeriode(ctx context.Context, p *domain.Periode) error
	DeletePeriode(ctx context.Context, id int64) error
	ListJenisBangunans(ctx context.Context, activeOnly bool) ([]*domain.JenisBangunan, error)
	CreateJenisBangunan(ctx context.Context, jb *domain.JenisBangunan) error
	UpdateJenisBangunan(ctx context.Context, jb *domain.JenisBangunan) error
	DeleteJenisBangunan(ctx context.Context, id int64) error
}

type PersiapanRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.Persiapan, error)
	List(ctx context.Context, jenis string, knmpID *int64) ([]*domain.Persiapan, error)
	Create(ctx context.Context, p *domain.Persiapan) error
	Update(ctx context.Context, p *domain.Persiapan) error
	Delete(ctx context.Context, id int64) error
	GetPCM(ctx context.Context, persiapanKontrakID int64) (*domain.PCM, error)
	GetPCMByID(ctx context.Context, id int64) (*domain.PCM, error)
	ListPCM(ctx context.Context, persiapanKontrakID *int64) ([]*domain.PCM, error)
	CreateOrUpdatePCM(ctx context.Context, pcm *domain.PCM) error
	DeletePCM(ctx context.Context, id int64) error
}

type PelaksanaanRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.Pelaksanaan, error)
	List(ctx context.Context, knmpID *int64) ([]*domain.Pelaksanaan, error)
	Create(ctx context.Context, p *domain.Pelaksanaan) error
	Update(ctx context.Context, p *domain.Pelaksanaan) error
	Delete(ctx context.Context, id int64) error
}

type LaporanFilter struct {
	PelaksanaanID   *int64
	JenisBangunanID *int64
	Status          string
	JenisLaporan    string
	Search          string
}

type LaporanRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.Laporan, error)
	List(ctx context.Context, filter LaporanFilter) ([]*domain.Laporan, error)
	Create(ctx context.Context, l *domain.Laporan, details []*domain.LaporanJenisBangunan) error
	Update(ctx context.Context, l *domain.Laporan, details []*domain.LaporanJenisBangunan) error
	UpdateStatus(ctx context.Context, id int64, status string) error
	Delete(ctx context.Context, id int64) error
	GetDetailsByLaporanID(ctx context.Context, laporanID int64) ([]*domain.LaporanJenisBangunan, error)
}

type AbsensiFilter struct {
	PelaksanaanID *int64
	TipeAbsensi   string
	Status        string
}

type AbsensiRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.Absensi, error)
	List(ctx context.Context, filter AbsensiFilter) ([]*domain.Absensi, error)
	Create(ctx context.Context, a *domain.Absensi) error
	Update(ctx context.Context, a *domain.Absensi) error
	UpdateStatus(ctx context.Context, id int64, status string) error
	Delete(ctx context.Context, id int64) error
}

type IssueFilter struct {
	KnmpID        *int64
	KategoriIssue string
	Tingkat       string
	Status        string
}

type IssueRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.Issue, error)
	List(ctx context.Context, filter IssueFilter) ([]*domain.Issue, error)
	Create(ctx context.Context, issue *domain.Issue) error
	Update(ctx context.Context, issue *domain.Issue) error
	UpdateStatus(ctx context.Context, id int64, status string) error
	Delete(ctx context.Context, id int64) error
}

type PembayaranRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.Pembayaran, error)
	List(ctx context.Context, persiapanKontrakID *int64) ([]*domain.Pembayaran, error)
	Create(ctx context.Context, p *domain.Pembayaran) error
	Update(ctx context.Context, p *domain.Pembayaran) error
	Delete(ctx context.Context, id int64) error
	GetSummary(ctx context.Context) (map[string]any, error)
	GetTerminStats(ctx context.Context) ([]map[string]any, error)
}

type DocumentRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.Document, error)
	ListByEntity(ctx context.Context, docType string, docID int64) ([]*domain.Document, error)
	ListByEntityAndCategory(ctx context.Context, docType string, docID int64, category string) ([]*domain.Document, error)
	Create(ctx context.Context, doc *domain.Document) error
	Update(ctx context.Context, doc *domain.Document) error
	Delete(ctx context.Context, id int64) error
	Verify(ctx context.Context, id int64, status string, note *string, verifiedBy int64) error
}

type VerificationRepository interface {
	GetLatestVerification(ctx context.Context, verifiableType string, verifiableID int64, step string) (*domain.Verification, error)
	ListVerifications(ctx context.Context, verifiableType string, verifiableID int64) ([]*domain.Verification, error)
	CreateVerification(ctx context.Context, v *domain.Verification) error
	SupersedeActiveVerifications(ctx context.Context, verifiableType string, verifiableID int64) error
}
