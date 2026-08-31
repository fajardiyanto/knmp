package service

import (
	"context"
	"testing"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type mockKnmpRepo struct {
	knmps []*domain.Knmp
}

func (m *mockKnmpRepo) GetByID(ctx context.Context, id int64) (*domain.Knmp, error) {
	for _, k := range m.knmps {
		if k.ID == id {
			return k, nil
		}
	}
	return nil, nil
}

func (m *mockKnmpRepo) List(ctx context.Context, filter repository.KnmpFilter) ([]*domain.Knmp, error) {
	return m.knmps, nil
}

func (m *mockKnmpRepo) Create(ctx context.Context, knmp *domain.Knmp) error {
	knmp.ID = int64(len(m.knmps) + 1)
	m.knmps = append(m.knmps, knmp)
	return nil
}

func (m *mockKnmpRepo) Update(ctx context.Context, knmp *domain.Knmp) error {
	for i, k := range m.knmps {
		if k.ID == knmp.ID {
			m.knmps[i] = knmp
			return nil
		}
	}
	return nil
}

func (m *mockKnmpRepo) Delete(ctx context.Context, id int64) error {
	return nil
}

func (m *mockKnmpRepo) GetWidgetStats(ctx context.Context, userKnmpIDs []int64) (map[string]any, error) {
	return map[string]any{
		"total_knmp":          346,
		"avg_progress_fisik":  68.5,
		"total_financial_val": 45000000000.0,
		"total_workers":       1820,
	}, nil
}

func (m *mockKnmpRepo) ListMap(ctx context.Context) ([]*domain.Knmp, error) {
	return m.knmps, nil
}

func (m *mockKnmpRepo) ListPeriodes(ctx context.Context) ([]*domain.Periode, error) {
	return []*domain.Periode{{ID: 1, Year: 2026, TanggalMulai: "2026-01-01", TanggalAkhir: "2026-12-31"}}, nil
}

func (m *mockKnmpRepo) CreatePeriode(ctx context.Context, p *domain.Periode) error {
	return nil
}

func (m *mockKnmpRepo) UpdatePeriode(ctx context.Context, p *domain.Periode) error {
	return nil
}

func (m *mockKnmpRepo) DeletePeriode(ctx context.Context, id int64) error {
	return nil
}

func (m *mockKnmpRepo) ListJenisBangunans(ctx context.Context, activeOnly bool) ([]*domain.JenisBangunan, error) {
	return []*domain.JenisBangunan{{ID: 1, Nama: "Dermaga Apung"}}, nil
}

func (m *mockKnmpRepo) CreateJenisBangunan(ctx context.Context, jb *domain.JenisBangunan) error {
	return nil
}

func (m *mockKnmpRepo) UpdateJenisBangunan(ctx context.Context, jb *domain.JenisBangunan) error {
	return nil
}

func (m *mockKnmpRepo) DeleteJenisBangunan(ctx context.Context, id int64) error {
	return nil
}

type mockGeoRepo struct{}

func (m *mockGeoRepo) ListRegionals(ctx context.Context) ([]*domain.Regional, error) {
	return []*domain.Regional{{ID: 1, Name: "Sumatera Bagian Utara"}}, nil
}

func (m *mockGeoRepo) ListProvincesByRegional(ctx context.Context, regionalID int64) ([]*domain.Province, error) {
	return []*domain.Province{{ID: 11, RegionalID: 1, Name: "Aceh"}}, nil
}

func (m *mockGeoRepo) ListRegenciesByProvince(ctx context.Context, provinceID int64) ([]*domain.Regency, error) {
	return []*domain.Regency{{ID: 1101, ProvinceID: 11, Name: "Kabupaten Aceh Besar"}}, nil
}

func (m *mockGeoRepo) ListDistrictsByRegency(ctx context.Context, regencyID int64) ([]*domain.District, error) {
	return []*domain.District{{ID: 110101, RegencyID: 1101, Name: "Kecamatan Peukan Bada"}}, nil
}

func (m *mockGeoRepo) ListSubDistrictsByDistrict(ctx context.Context, districtID int64) ([]*domain.SubDistrict, error) {
	return []*domain.SubDistrict{{ID: 11010101, DistrictID: 110101, Name: "Desa Lampulo"}}, nil
}

func TestKnmpService_GISAndGeoLookups(t *testing.T) {
	lat := "5.5482"
	long := "95.3237"
	mockK := &mockKnmpRepo{
		knmps: []*domain.Knmp{
			{
				ID:        1,
				Name:      "KNMP Titik 1 Lampulo",
				JenisKnmp: "hub",
				Lat:       &lat,
				Long:      &long,
			},
		},
	}
	mockG := &mockGeoRepo{}

	svc := NewKnmpService(mockK, mockG)
	ctx := context.Background()

	// 1. Test ListMap for GIS
	points, err := svc.ListMap(ctx)
	if err != nil || len(points) == 0 {
		t.Fatalf("expected map points, got error: %v", err)
	}
	if points[0].Name != "KNMP Titik 1 Lampulo" || *points[0].Lat != "5.5482" {
		t.Errorf("unexpected map point: %+v", points[0])
	}

	// 2. Test GetWidgetStats
	stats, err := svc.GetWidgetStats(ctx, nil)
	if err != nil {
		t.Fatalf("failed to get widget stats: %v", err)
	}
	if stats["total_knmp"] != 346 || stats["avg_progress_fisik"] != 68.5 {
		t.Errorf("unexpected widget stats: %+v", stats)
	}

	// 3. Test Cascading Geo Lookups
	regionals, err := svc.ListRegionals(ctx)
	if err != nil || len(regionals) == 0 {
		t.Fatalf("failed to list regionals: %v", err)
	}
	provinces, err := svc.ListProvinces(ctx, regionals[0].ID)
	if err != nil || len(provinces) == 0 {
		t.Fatalf("failed to list provinces: %v", err)
	}
	regencies, err := svc.ListRegencies(ctx, provinces[0].ID)
	if err != nil || len(regencies) == 0 {
		t.Fatalf("failed to list regencies: %v", err)
	}
	districts, err := svc.ListDistricts(ctx, regencies[0].ID)
	if err != nil || len(districts) == 0 {
		t.Fatalf("failed to list districts: %v", err)
	}
	subDistricts, err := svc.ListSubDistricts(ctx, districts[0].ID)
	if err != nil || len(subDistricts) == 0 {
		t.Fatalf("failed to list sub-districts: %v", err)
	}
	if subDistricts[0].Name != "Desa Lampulo" {
		t.Errorf("expected Desa Lampulo, got %s", subDistricts[0].Name)
	}
}
