package service

import (
	"context"
	"encoding/json"
	"errors"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type WeeklyBOQService struct {
	repo repository.WeeklyBOQRepository
}

func NewWeeklyBOQService(repo repository.WeeklyBOQRepository) *WeeklyBOQService {
	return &WeeklyBOQService{repo: repo}
}

func (s *WeeklyBOQService) List(ctx context.Context, filter repository.WeeklyBOQFilter) ([]*domain.WeeklyBOQControl, error) {
	return s.repo.List(ctx, filter)
}

func (s *WeeklyBOQService) GetByID(ctx context.Context, id int64) (*domain.WeeklyBOQControl, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *WeeklyBOQService) Create(ctx context.Context, control *domain.WeeklyBOQControl, items []*domain.WeeklyBOQItem) error {
	if control.KnmpID == 0 {
		return errors.New("knmp_id wajib diisi")
	}
	if control.WeekStart == "" || control.WeekEnd == "" {
		return errors.New("periode minggu wajib diisi")
	}
	if control.Title == "" {
		control.Title = "Weekly BOQ Progress Control"
	}
	if control.Status == "" {
		control.Status = "open"
	}
	if control.Summary == "" {
		control.Summary = "Progress dihitung sebagai verified quantity dikali approved BOQ dan hanya diakui penuh jika didukung evidence valid."
	}
	if len(control.ManualTables) == 0 {
		control.ManualTables = json.RawMessage(`{}`)
	}
	for _, item := range items {
		if item.DeviationPct == 0 {
			item.DeviationPct = item.EvidenceSupportedPct - item.PlanPct
		}
		if item.ActualValue == 0 && item.ContractValue > 0 {
			item.ActualValue = item.ContractValue * item.EvidenceSupportedPct / 100
		}
		if item.EvidenceStatus == "" {
			item.EvidenceStatus = "missing"
		}
		if item.RiskLevel == "" {
			item.RiskLevel = riskFromDeviation(item.DeviationPct, item.EvidenceStatus)
		}
	}
	return s.repo.Create(ctx, control, items)
}

func (s *WeeklyBOQService) UpdateStatus(ctx context.Context, id int64, status string) error {
	if status == "" {
		return errors.New("status wajib diisi")
	}
	return s.repo.UpdateStatus(ctx, id, status)
}

func (s *WeeklyBOQService) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}

func (s *WeeklyBOQService) GetStats(ctx context.Context, filter repository.WeeklyBOQFilter) (*domain.WeeklyBOQStats, error) {
	return s.repo.GetStats(ctx, filter)
}

func riskFromDeviation(deviation float64, evidenceStatus string) string {
	if evidenceStatus == "missing" || deviation <= -5 {
		return "kritis"
	}
	if deviation <= -2 || evidenceStatus == "partial" {
		return "sedang"
	}
	return "rendah"
}
