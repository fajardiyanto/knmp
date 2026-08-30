package service

import (
	"context"
	"testing"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type mockAbsensiRepo struct {
	absensis map[int64]*domain.Absensi
}

func (m *mockAbsensiRepo) GetByID(ctx context.Context, id int64) (*domain.Absensi, error) {
	if a, ok := m.absensis[id]; ok {
		return a, nil
	}
	return nil, nil
}

func (m *mockAbsensiRepo) List(ctx context.Context, filter repository.AbsensiFilter) ([]*domain.Absensi, error) {
	var res []*domain.Absensi
	for _, a := range m.absensis {
		res = append(res, a)
	}
	return res, nil
}

func (m *mockAbsensiRepo) Create(ctx context.Context, a *domain.Absensi) error {
	a.ID = int64(len(m.absensis) + 1)
	m.absensis[a.ID] = a
	return nil
}

func (m *mockAbsensiRepo) Update(ctx context.Context, a *domain.Absensi) error {
	m.absensis[a.ID] = a
	return nil
}

func (m *mockAbsensiRepo) UpdateStatus(ctx context.Context, id int64, status string) error {
	if a, ok := m.absensis[id]; ok {
		a.Status = status
	}
	return nil
}

func (m *mockAbsensiRepo) Delete(ctx context.Context, id int64) error {
	delete(m.absensis, id)
	return nil
}

type mockIssueRepo struct {
	issues map[int64]*domain.Issue
}

func (m *mockIssueRepo) GetByID(ctx context.Context, id int64) (*domain.Issue, error) {
	if i, ok := m.issues[id]; ok {
		return i, nil
	}
	return nil, nil
}

func (m *mockIssueRepo) List(ctx context.Context, filter repository.IssueFilter) ([]*domain.Issue, error) {
	var res []*domain.Issue
	for _, i := range m.issues {
		res = append(res, i)
	}
	return res, nil
}

func (m *mockIssueRepo) Create(ctx context.Context, i *domain.Issue) error {
	i.ID = int64(len(m.issues) + 1)
	m.issues[i.ID] = i
	return nil
}

func (m *mockIssueRepo) Update(ctx context.Context, i *domain.Issue) error {
	m.issues[i.ID] = i
	return nil
}

func (m *mockIssueRepo) UpdateStatus(ctx context.Context, id int64, status string) error {
	if i, ok := m.issues[id]; ok {
		i.Status = status
	}
	return nil
}

func (m *mockIssueRepo) Delete(ctx context.Context, id int64) error {
	delete(m.issues, id)
	return nil
}

type mockPembayaranRepo struct {
	pembayarans map[int64]*domain.Pembayaran
}

func (m *mockPembayaranRepo) GetByID(ctx context.Context, id int64) (*domain.Pembayaran, error) {
	if p, ok := m.pembayarans[id]; ok {
		return p, nil
	}
	return nil, nil
}

func (m *mockPembayaranRepo) List(ctx context.Context, persiapanKontrakID *int64) ([]*domain.Pembayaran, error) {
	var res []*domain.Pembayaran
	for _, p := range m.pembayarans {
		res = append(res, p)
	}
	return res, nil
}

func (m *mockPembayaranRepo) Create(ctx context.Context, p *domain.Pembayaran) error {
	p.ID = int64(len(m.pembayarans) + 1)
	m.pembayarans[p.ID] = p
	return nil
}

func (m *mockPembayaranRepo) Update(ctx context.Context, p *domain.Pembayaran) error {
	m.pembayarans[p.ID] = p
	return nil
}

func (m *mockPembayaranRepo) Delete(ctx context.Context, id int64) error {
	delete(m.pembayarans, id)
	return nil
}

func (m *mockPembayaranRepo) GetSummary(ctx context.Context) (map[string]any, error) {
	return map[string]any{
		"total_kontrak":        1000000000.0,
		"total_dibayarkan":     500000000.0,
		"sisa_pembayaran":      500000000.0,
		"persentase_bayar":     50.0,
		"total_termin_selesai": 2,
	}, nil
}

func (m *mockPembayaranRepo) GetTerminStats(ctx context.Context) ([]map[string]any, error) {
	return []map[string]any{}, nil
}

func TestAbsensi_Issue_Pembayaran_Services(t *testing.T) {
	mockAbs := &mockAbsensiRepo{absensis: make(map[int64]*domain.Absensi)}
	mockIss := &mockIssueRepo{issues: make(map[int64]*domain.Issue)}
	mockPem := &mockPembayaranRepo{pembayarans: make(map[int64]*domain.Pembayaran)}
	mockVer := &mockVerifRepo{verifs: make(map[int64]*domain.Verification)}
	mockDoc := &mockDocRepo{docs: make(map[int64]*domain.Document)}
	mockSto := &mockStorage{}

	absSvc := NewAbsensiService(mockAbs, mockVer, mockDoc, mockSto)
	issSvc := NewIssueService(mockIss, mockVer, mockDoc, mockSto)
	pemSvc := NewPembayaranService(mockPem, mockDoc, mockSto)

	ctx := context.Background()

	// 1. Test Absensi Mobile Create
	abs, err := absSvc.CreateMobile(ctx, 1, 10, "hadir", nil, nil, nil)
	if err != nil || abs == nil || abs.ID == 0 {
		t.Fatalf("failed to create mobile absensi: %v", err)
	}
	if abs.TipeAbsensi != "hadir" {
		t.Errorf("expected hadir, got %s", abs.TipeAbsensi)
	}

	// 2. Test Issue (Tingkat Kritis)
	knmpID := int64(1)
	iss := &domain.Issue{
		KnmpID:        &knmpID,
		KategoriIssue: "cuaca",
		Tingkat:       "kritis",
		Status:        "open",
		UraianMasalah: "Gelombang tinggi menghambat pasokan material ke titik nelayan",
	}
	err = issSvc.Create(ctx, iss)
	if err != nil || iss.ID == 0 {
		t.Fatalf("failed to create issue: %v", err)
	}
	if iss.Tingkat != "kritis" {
		t.Errorf("expected tingkat kritis, got %s", iss.Tingkat)
	}

	// 3. Test Pembayaran
	pem := &domain.Pembayaran{
		PersiapanKontrakID: 1,
		Name:               "Pencairan Termin 2 (50%)",
		Termin:             "termin_2",
		RealisasiAnggaran:  500000000,
		RealisasiFisik:     52.5,
	}
	err = pemSvc.Create(ctx, pem)
	if err != nil || pem.ID == 0 {
		t.Fatalf("failed to create pembayaran: %v", err)
	}

	summary, err := pemSvc.GetSummary(ctx)
	if err != nil {
		t.Fatalf("failed to get pembayaran summary: %v", err)
	}
	if summary["total_kontrak"] != 1000000000.0 || summary["persentase_bayar"] != 50.0 {
		t.Errorf("unexpected summary: %+v", summary)
	}
}
