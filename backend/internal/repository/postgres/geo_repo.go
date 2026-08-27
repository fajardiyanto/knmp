package postgres

import (
	"context"

	"github.com/jmoiron/sqlx"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type geoRepo struct {
	db *sqlx.DB
}

func NewGeoRepo(db *sqlx.DB) repository.GeoRepository {
	return &geoRepo{db: db}
}

func (r *geoRepo) ListRegionals(ctx context.Context) ([]*domain.Regional, error) {
	var results []*domain.Regional
	query := `SELECT id, name, created_at, updated_at FROM regionals ORDER BY id ASC`
	err := r.db.SelectContext(ctx, &results, query)
	return results, err
}

func (r *geoRepo) ListProvincesByRegional(ctx context.Context, regionalID int64) ([]*domain.Province, error) {
	var results []*domain.Province
	query := `SELECT id, regional_id, name, created_at, updated_at FROM provinces WHERE regional_id = $1 ORDER BY name ASC`
	err := r.db.SelectContext(ctx, &results, query, regionalID)
	return results, err
}

func (r *geoRepo) ListRegenciesByProvince(ctx context.Context, provinceID int64) ([]*domain.Regency, error) {
	var results []*domain.Regency
	query := `SELECT id, province_id, name, type, created_at, updated_at FROM regencies WHERE province_id = $1 ORDER BY name ASC`
	err := r.db.SelectContext(ctx, &results, query, provinceID)
	return results, err
}

func (r *geoRepo) ListDistrictsByRegency(ctx context.Context, regencyID int64) ([]*domain.District, error) {
	var results []*domain.District
	query := `SELECT id, regency_id, name, created_at, updated_at FROM districts WHERE regency_id = $1 ORDER BY name ASC`
	err := r.db.SelectContext(ctx, &results, query, regencyID)
	return results, err
}

func (r *geoRepo) ListSubDistrictsByDistrict(ctx context.Context, districtID int64) ([]*domain.SubDistrict, error) {
	var results []*domain.SubDistrict
	query := `SELECT id, district_id, name, created_at, updated_at FROM sub_districts WHERE district_id = $1 ORDER BY name ASC`
	err := r.db.SelectContext(ctx, &results, query, districtID)
	return results, err
}
