package service

import (
	"context"
	"math"
	"testing"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type mockWeeklyBOQRepo struct {
	createdControl *domain.WeeklyBOQControl
	createdItems   []*domain.WeeklyBOQItem
	statusID       int64
	statusValue    string
}

func (m *mockWeeklyBOQRepo) GetByID(ctx context.Context, id int64) (*domain.WeeklyBOQControl, error) {
	return &domain.WeeklyBOQControl{ID: id, KnmpID: 10}, nil
}

func (m *mockWeeklyBOQRepo) List(ctx context.Context, filter repository.WeeklyBOQFilter) ([]*domain.WeeklyBOQControl, error) {
	return []*domain.WeeklyBOQControl{}, nil
}

func (m *mockWeeklyBOQRepo) Create(ctx context.Context, control *domain.WeeklyBOQControl, items []*domain.WeeklyBOQItem) error {
	control.ID = 1
	m.createdControl = control
	m.createdItems = items
	return nil
}

func (m *mockWeeklyBOQRepo) Update(ctx context.Context, control *domain.WeeklyBOQControl, items []*domain.WeeklyBOQItem) error {
	m.createdControl = control
	m.createdItems = items
	return nil
}

func (m *mockWeeklyBOQRepo) UpdateStatus(ctx context.Context, id int64, status string) error {
	m.statusID = id
	m.statusValue = status
	return nil
}

func (m *mockWeeklyBOQRepo) Delete(ctx context.Context, id int64) error {
	return nil
}

func (m *mockWeeklyBOQRepo) GetStats(ctx context.Context, filter repository.WeeklyBOQFilter) (*domain.WeeklyBOQStats, error) {
	return &domain.WeeklyBOQStats{}, nil
}

func TestWeeklyBOQServiceCreateDefaultsAndCalculatesItemFields(t *testing.T) {
	repo := &mockWeeklyBOQRepo{}
	svc := NewWeeklyBOQService(repo)

	control := &domain.WeeklyBOQControl{
		KnmpID:                10,
		WeekStart:             "2026-08-25",
		WeekEnd:               "2026-08-31",
		ContractorClaimPct:    93.39,
		SupervisorVerifiedPct: 90.13,
		EvidenceSupportedPct:  90.13,
		AuditExposureValue:    328400000,
	}
	items := []*domain.WeeklyBOQItem{
		{
			ItemCode:             "ITJEN-01",
			ItemName:             "Progress fisik terpasang vs klaim kontraktor",
			ContractValue:        1000000000,
			PlanPct:              93.39,
			EvidenceSupportedPct: 90.13,
			EvidenceStatus:       "partial",
		},
	}

	if err := svc.Create(context.Background(), control, items); err != nil {
		t.Fatalf("create weekly boq: %v", err)
	}
	if repo.createdControl.Title != "Weekly BOQ Progress Control" {
		t.Fatalf("expected default title, got %q", repo.createdControl.Title)
	}
	if repo.createdControl.Status != "open" {
		t.Fatalf("expected default status open, got %q", repo.createdControl.Status)
	}
	if math.Abs(repo.createdItems[0].DeviationPct-(-3.26)) > 0.001 {
		t.Fatalf("expected deviation -3.26, got %.2f", repo.createdItems[0].DeviationPct)
	}
	if repo.createdItems[0].ActualValue != 901300000 {
		t.Fatalf("expected actual value 901300000, got %.0f", repo.createdItems[0].ActualValue)
	}
	if repo.createdItems[0].RiskLevel != "sedang" {
		t.Fatalf("expected risk sedang for partial evidence, got %q", repo.createdItems[0].RiskLevel)
	}
}

func TestWeeklyBOQServiceRejectsMissingRequiredFields(t *testing.T) {
	svc := NewWeeklyBOQService(&mockWeeklyBOQRepo{})
	if err := svc.Create(context.Background(), &domain.WeeklyBOQControl{}, nil); err == nil {
		t.Fatal("expected error when knmp_id is empty")
	}
	if err := svc.Create(context.Background(), &domain.WeeklyBOQControl{KnmpID: 10}, nil); err == nil {
		t.Fatal("expected error when week period is empty")
	}
}

