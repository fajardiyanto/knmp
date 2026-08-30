package service

import (
	"context"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type KnmpService struct {
	knmpRepo repository.KnmpRepository
	geoRepo  repository.GeoRepository
}

func NewKnmpService(knmpRepo repository.KnmpRepository, geoRepo repository.GeoRepository) *KnmpService {
	return &KnmpService{
		knmpRepo: knmpRepo,
		geoRepo:  geoRepo,
	}
}

func (s *KnmpService) GetByID(ctx context.Context, id int64) (*domain.Knmp, error) {
	return s.knmpRepo.GetByID(ctx, id)
}

func (s *KnmpService) List(ctx context.Context, filter repository.KnmpFilter) ([]*domain.Knmp, error) {
	return s.knmpRepo.List(ctx, filter)
}

func (s *KnmpService) Create(ctx context.Context, k *domain.Knmp) error {
	return s.knmpRepo.Create(ctx, k)
}

func (s *KnmpService) Update(ctx context.Context, k *domain.Knmp) error {
	return s.knmpRepo.Update(ctx, k)
}

func (s *KnmpService) Delete(ctx context.Context, id int64) error {
	return s.knmpRepo.Delete(ctx, id)
}

func (s *KnmpService) GetWidgetStats(ctx context.Context, userKnmpIDs []int64) (map[string]any, error) {
	return s.knmpRepo.GetWidgetStats(ctx, userKnmpIDs)
}

func (s *KnmpService) ListMap(ctx context.Context) ([]*domain.Knmp, error) {
	return s.knmpRepo.ListMap(ctx)
}

// Geo Lookups
func (s *KnmpService) ListRegionals(ctx context.Context) ([]*domain.Regional, error) {
	return s.geoRepo.ListRegionals(ctx)
}

func (s *KnmpService) ListProvinces(ctx context.Context, regionalID int64) ([]*domain.Province, error) {
	return s.geoRepo.ListProvincesByRegional(ctx, regionalID)
}

func (s *KnmpService) ListRegencies(ctx context.Context, provinceID int64) ([]*domain.Regency, error) {
	return s.geoRepo.ListRegenciesByProvince(ctx, provinceID)
}

func (s *KnmpService) ListDistricts(ctx context.Context, regencyID int64) ([]*domain.District, error) {
	return s.geoRepo.ListDistrictsByRegency(ctx, regencyID)
}

func (s *KnmpService) ListSubDistricts(ctx context.Context, districtID int64) ([]*domain.SubDistrict, error) {
	return s.geoRepo.ListSubDistrictsByDistrict(ctx, districtID)
}

// Master Periode & Jenis Bangunan
func (s *KnmpService) ListPeriodes(ctx context.Context) ([]*domain.Periode, error) {
	return s.knmpRepo.ListPeriodes(ctx)
}

func (s *KnmpService) CreatePeriode(ctx context.Context, p *domain.Periode) error {
	return s.knmpRepo.CreatePeriode(ctx, p)
}

func (s *KnmpService) UpdatePeriode(ctx context.Context, p *domain.Periode) error {
	return s.knmpRepo.UpdatePeriode(ctx, p)
}

func (s *KnmpService) DeletePeriode(ctx context.Context, id int64) error {
	return s.knmpRepo.DeletePeriode(ctx, id)
}

func (s *KnmpService) ListJenisBangunans(ctx context.Context, activeOnly bool) ([]*domain.JenisBangunan, error) {
	return s.knmpRepo.ListJenisBangunans(ctx, activeOnly)
}

func (s *KnmpService) CreateJenisBangunan(ctx context.Context, jb *domain.JenisBangunan) error {
	return s.knmpRepo.CreateJenisBangunan(ctx, jb)
}

func (s *KnmpService) UpdateJenisBangunan(ctx context.Context, jb *domain.JenisBangunan) error {
	return s.knmpRepo.UpdateJenisBangunan(ctx, jb)
}

func (s *KnmpService) DeleteJenisBangunan(ctx context.Context, id int64) error {
	return s.knmpRepo.DeleteJenisBangunan(ctx, id)
}
