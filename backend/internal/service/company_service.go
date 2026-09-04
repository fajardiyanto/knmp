package service

import (
	"context"
	"errors"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type PerusahaanService struct {
	repo repository.PerusahaanRepository
}

func NewPerusahaanService(repo repository.PerusahaanRepository) *PerusahaanService {
	return &PerusahaanService{repo: repo}
}

func (s *PerusahaanService) GetByID(ctx context.Context, id int64) (*domain.Perusahaan, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *PerusahaanService) GetByNama(ctx context.Context, nama string) (*domain.Perusahaan, error) {
	return s.repo.GetByNama(ctx, nama)
}

func (s *PerusahaanService) GetByKontrak(ctx context.Context, noKontrak string) (*domain.Perusahaan, error) {
	return s.repo.GetByKontrak(ctx, noKontrak)
}

func (s *PerusahaanService) List(ctx context.Context, search string, limit, offset int) ([]*domain.Perusahaan, int, error) {
	return s.repo.List(ctx, search, limit, offset)
}

func (s *PerusahaanService) Create(ctx context.Context, p *domain.Perusahaan) error {
	if p.Nama == "" {
		return errors.New("nama perusahaan wajib diisi")
	}
	return s.repo.Create(ctx, p)
}

func (s *PerusahaanService) Update(ctx context.Context, p *domain.Perusahaan) error {
	if p.ID == 0 {
		return errors.New("id perusahaan wajib diisi")
	}
	return s.repo.Update(ctx, p)
}

func (s *PerusahaanService) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}
