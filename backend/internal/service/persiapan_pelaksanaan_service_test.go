package service

import (
	"context"
	"testing"
	"time"

	"knmp-v2-backend/internal/domain"
)

type mockPersiapanRepo struct {
	persiapans map[int64]*domain.Persiapan
	pcms       map[int64]*domain.PCM
}

func (m *mockPersiapanRepo) GetByID(ctx context.Context, id int64) (*domain.Persiapan, error) {
	if p, ok := m.persiapans[id]; ok {
		return p, nil
	}
	return nil, nil
}

func (m *mockPersiapanRepo) List(ctx context.Context, jenis string, knmpID *int64) ([]*domain.Persiapan, error) {
	var res []*domain.Persiapan
	for _, p := range m.persiapans {
		res = append(res, p)
	}
	return res, nil
}

func (m *mockPersiapanRepo) Create(ctx context.Context, p *domain.Persiapan) error {
	p.ID = int64(len(m.persiapans) + 1)
	m.persiapans[p.ID] = p
	return nil
}

func (m *mockPersiapanRepo) Update(ctx context.Context, p *domain.Persiapan) error {
	m.persiapans[p.ID] = p
	return nil
}

func (m *mockPersiapanRepo) Delete(ctx context.Context, id int64) error {
	delete(m.persiapans, id)
	return nil
}

func (m *mockPersiapanRepo) GetPCM(ctx context.Context, persiapanKontrakID int64) (*domain.PCM, error) {
	for _, p := range m.pcms {
		if p.PersiapanKontrakID == persiapanKontrakID {
			return p, nil
		}
	}
	return nil, nil
}

func (m *mockPersiapanRepo) GetPCMByID(ctx context.Context, id int64) (*domain.PCM, error) {
	if p, ok := m.pcms[id]; ok {
		return p, nil
	}
	return nil, nil
}

func (m *mockPersiapanRepo) ListPCM(ctx context.Context, persiapanKontrakID *int64) ([]*domain.PCM, error) {
	var res []*domain.PCM
	for _, p := range m.pcms {
		res = append(res, p)
	}
	return res, nil
}

func (m *mockPersiapanRepo) CreateOrUpdatePCM(ctx context.Context, pcm *domain.PCM) error {
	pcm.ID = int64(len(m.pcms) + 1)
	m.pcms[pcm.ID] = pcm
	return nil
}

func (m *mockPersiapanRepo) DeletePCM(ctx context.Context, id int64) error {
	delete(m.pcms, id)
	return nil
}

type mockPelaksanaanRepo struct {
	pelaksanaans map[int64]*domain.Pelaksanaan
}

func (m *mockPelaksanaanRepo) GetByID(ctx context.Context, id int64) (*domain.Pelaksanaan, error) {
	if p, ok := m.pelaksanaans[id]; ok {
		return p, nil
	}
	return nil, nil
}

func (m *mockPelaksanaanRepo) List(ctx context.Context, knmpID *int64) ([]*domain.Pelaksanaan, error) {
	var res []*domain.Pelaksanaan
	for _, p := range m.pelaksanaans {
		res = append(res, p)
	}
	return res, nil
}

func (m *mockPelaksanaanRepo) Create(ctx context.Context, p *domain.Pelaksanaan) error {
	p.ID = int64(len(m.pelaksanaans) + 1)
	m.pelaksanaans[p.ID] = p
	return nil
}

func (m *mockPelaksanaanRepo) Update(ctx context.Context, p *domain.Pelaksanaan) error {
	m.pelaksanaans[p.ID] = p
	return nil
}

func (m *mockPelaksanaanRepo) Delete(ctx context.Context, id int64) error {
	delete(m.pelaksanaans, id)
	return nil
}

func TestPersiapan_Pelaksanaan_Services(t *testing.T) {
	mockPer := &mockPersiapanRepo{
		persiapans: make(map[int64]*domain.Persiapan),
		pcms:       make(map[int64]*domain.PCM),
	}
	mockPel := &mockPelaksanaanRepo{
		pelaksanaans: make(map[int64]*domain.Pelaksanaan),
	}
	mockDoc := &mockDocRepo{docs: make(map[int64]*domain.Document)}
	mockSto := &mockStorage{}

	perSvc := NewPersiapanService(mockPer, mockDoc, mockSto)
	pelSvc := NewPelaksanaanService(mockPel, mockDoc, mockSto)

	ctx := context.Background()

	// 1. Create Persiapan Kontrak
	knmpID := int64(1)
	statusAktif := "aktif"
	kontrak := &domain.Persiapan{
		KnmpID:  &knmpID,
		Nama:    "Kontrak Pembangunan Dermaga & Kampung Nelayan",
		Tanggal: time.Now().Format("2006-01-02"),
		Jenis:   "kontrak",
		Status:  &statusAktif,
	}
	err := perSvc.Create(ctx, kontrak)
	if err != nil || kontrak.ID == 0 {
		t.Fatalf("failed to create persiapan kontrak: %v", err)
	}

	// 2. Save PCM
	pcm := &domain.PCM{
		PersiapanKontrakID: kontrak.ID,
		Nama:               "Berita Acara Pre-Construction Meeting",
		Tanggal:            time.Now().Format("2006-01-02"),
	}
	err = perSvc.CreateOrUpdatePCM(ctx, pcm)
	if err != nil || pcm.ID == 0 {
		t.Fatalf("failed to save PCM: %v", err)
	}

	// 3. Create Pelaksanaan
	pel := &domain.Pelaksanaan{
		KnmpID:  &knmpID,
		Nama:    "Pekerjaan Pondasi & Dermaga Nelayan",
		Tanggal: time.Now().Format("2006-01-02"),
	}
	err = pelSvc.Create(ctx, pel)
	if err != nil || pel.ID == 0 {
		t.Fatalf("failed to create pelaksanaan: %v", err)
	}

	fetchedPel, err := pelSvc.GetByID(ctx, pel.ID)
	if err != nil || fetchedPel == nil {
		t.Fatalf("failed to fetch pelaksanaan: %v", err)
	}
	if fetchedPel.MilestoneProg != 0 {
		t.Errorf("expected 0 milestone for 0 docs, got %d", fetchedPel.MilestoneProg)
	}
}
