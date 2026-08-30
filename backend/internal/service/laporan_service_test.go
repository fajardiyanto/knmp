package service

import (
	"context"
	"testing"
	"time"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type mockLaporanRepo struct {
	laporans map[int64]*domain.Laporan
}

func (m *mockLaporanRepo) GetByID(ctx context.Context, id int64) (*domain.Laporan, error) {
	if l, ok := m.laporans[id]; ok {
		return l, nil
	}
	return nil, nil
}

func (m *mockLaporanRepo) List(ctx context.Context, filter repository.LaporanFilter) ([]*domain.Laporan, error) {
	var res []*domain.Laporan
	for _, l := range m.laporans {
		res = append(res, l)
	}
	return res, nil
}

func (m *mockLaporanRepo) Create(ctx context.Context, l *domain.Laporan, details []*domain.LaporanJenisBangunan) error {
	l.ID = int64(len(m.laporans) + 1)
	m.laporans[l.ID] = l
	return nil
}

func (m *mockLaporanRepo) Update(ctx context.Context, l *domain.Laporan, details []*domain.LaporanJenisBangunan) error {
	m.laporans[l.ID] = l
	return nil
}

func (m *mockLaporanRepo) UpdateStatus(ctx context.Context, id int64, status string) error {
	if l, ok := m.laporans[id]; ok {
		l.Status = status
	}
	return nil
}

func (m *mockLaporanRepo) Delete(ctx context.Context, id int64) error {
	delete(m.laporans, id)
	return nil
}

func (m *mockLaporanRepo) GetDetailsByLaporanID(ctx context.Context, laporanID int64) ([]*domain.LaporanJenisBangunan, error) {
	return []*domain.LaporanJenisBangunan{}, nil
}

func (m *mockLaporanRepo) GetMonthlyProjectReportData(ctx context.Context, filter repository.ProjectReportFilter) (*domain.MonthlyProjectReportData, error) {
	return &domain.MonthlyProjectReportData{
		KNMPID:             1,
		KNMPName:           "KNMP Titik 1 Banda Aceh",
		NomorKontrak:       "KNMP/01/2026",
		NilaiKontrak:       1500000000,
		ProgressPlan:       85.0,
		ProgressActual:     88.5,
		ProgressDeviasi:    3.5,
		FinancialPagu:      1500000000,
		FinancialRealisasi: 1200000000,
		ProgKeuanganPct:    80.0,
		TotalPekerja:       18,
	}, nil
}

type mockVerifRepo struct {
	verifs map[int64]*domain.Verification
}

func (m *mockVerifRepo) CreateVerification(ctx context.Context, v *domain.Verification) error {
	v.ID = int64(len(m.verifs) + 1)
	m.verifs[v.ID] = v
	return nil
}

func (m *mockVerifRepo) GetLatestVerification(ctx context.Context, vType string, id int64, step string) (*domain.Verification, error) {
	for _, v := range m.verifs {
		if v.VerifiableType == vType && v.VerifiableID == id && v.Step == step {
			return v, nil
		}
	}
	return nil, nil
}

func (m *mockVerifRepo) ListVerifications(ctx context.Context, vType string, id int64) ([]*domain.Verification, error) {
	var res []*domain.Verification
	for _, v := range m.verifs {
		if v.VerifiableType == vType && v.VerifiableID == id {
			res = append(res, v)
		}
	}
	return res, nil
}

func (m *mockVerifRepo) SupersedeActiveVerifications(ctx context.Context, vType string, id int64) error {
	return nil
}

func TestLaporanService_CreateAndGet(t *testing.T) {
	mockLap := &mockLaporanRepo{laporans: make(map[int64]*domain.Laporan)}
	mockVer := &mockVerifRepo{verifs: make(map[int64]*domain.Verification)}
	mockDoc := &mockDocRepo{docs: make(map[int64]*domain.Document)}
	mockSto := &mockStorage{}

	svc := NewLaporanService(mockLap, mockVer, mockDoc, mockSto)

	// 1. Create Laporan
	lap := &domain.Laporan{
		PelaksanaanID:         1,
		Nama:                  "Laporan Mingguan Ke-4",
		JenisLaporan:          "mingguan",
		Tanggal:               time.Now().Format("2006-01-02"),
		RencanaProgresFisik:   45.0,
		RealisasiProgresFisik: 47.5,
		JumlahTenagaKerja:     14,
	}

	err := svc.Create(context.Background(), lap, nil)
	if err != nil {
		t.Fatalf("expected create success, got error: %v", err)
	}
	if lap.ID == 0 {
		t.Fatalf("expected generated ID, got 0")
	}
	if lap.Status != "menunggu_pengawas" {
		t.Errorf("expected default status menunggu_pengawas, got %s", lap.Status)
	}

	// 2. GetByID
	fetched, err := svc.GetByID(context.Background(), lap.ID)
	if err != nil {
		t.Fatalf("expected fetched laporan, got %v", err)
	}
	if fetched == nil || fetched.Nama != "Laporan Mingguan Ke-4" {
		t.Fatalf("expected Laporan Mingguan Ke-4, got %+v", fetched)
	}

	// 3. GetMonthlyProjectReportData
	report, err := svc.GetMonthlyProjectReportData(context.Background(), repository.ProjectReportFilter{
		KNMPID: 1,
	})
	if err != nil {
		t.Fatalf("expected monthly report data, got error: %v", err)
	}
	if report.ProgressActual != 88.5 || report.ProgKeuanganPct != 80.0 {
		t.Errorf("expected ProgressActual 88.5 and ProgKeuanganPct 80.0, got %f and %f", report.ProgressActual, report.ProgKeuanganPct)
	}
}
