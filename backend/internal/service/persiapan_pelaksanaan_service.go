package service

import (
	"context"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
	"knmp-v2-backend/pkg/storage"
)

type PersiapanService struct {
	persiapanRepo repository.PersiapanRepository
	docRepo       repository.DocumentRepository
	storage       storage.Storage
}

func NewPersiapanService(
	persiapanRepo repository.PersiapanRepository,
	docRepo repository.DocumentRepository,
	storage storage.Storage,
) *PersiapanService {
	return &PersiapanService{
		persiapanRepo: persiapanRepo,
		docRepo:       docRepo,
		storage:       storage,
	}
}

func (s *PersiapanService) GetByID(ctx context.Context, id int64) (*domain.Persiapan, error) {
	p, err := s.persiapanRepo.GetByID(ctx, id)
	if err != nil || p == nil {
		return nil, err
	}
	docs, _ := s.docRepo.ListByEntity(ctx, "persiapan", p.ID)
	for _, d := range docs {
		d.FileURL = s.storage.GetFileURL(d.FilePath)
	}
	p.Documents = docs
	return p, nil
}

func (s *PersiapanService) List(ctx context.Context, jenis string, knmpID *int64) ([]*domain.Persiapan, error) {
	persiapans, err := s.persiapanRepo.List(ctx, jenis, knmpID)
	if err != nil {
		return nil, err
	}
	for _, p := range persiapans {
		docs, _ := s.docRepo.ListByEntity(ctx, "persiapan", p.ID)
		for _, d := range docs {
			d.FileURL = s.storage.GetFileURL(d.FilePath)
		}
		p.Documents = docs
	}
	return persiapans, nil
}

func (s *PersiapanService) Create(ctx context.Context, p *domain.Persiapan) error {
	return s.persiapanRepo.Create(ctx, p)
}

func (s *PersiapanService) Update(ctx context.Context, p *domain.Persiapan) error {
	return s.persiapanRepo.Update(ctx, p)
}

func (s *PersiapanService) Delete(ctx context.Context, id int64) error {
	return s.persiapanRepo.Delete(ctx, id)
}

func (s *PersiapanService) GetPCM(ctx context.Context, persiapanKontrakID int64) (*domain.PCM, error) {
	pcm, err := s.persiapanRepo.GetPCM(ctx, persiapanKontrakID)
	if err != nil || pcm == nil {
		return nil, err
	}
	docs, _ := s.docRepo.ListByEntity(ctx, "pcm", pcm.ID)
	for _, d := range docs {
		d.FileURL = s.storage.GetFileURL(d.FilePath)
	}
	pcm.Documents = docs
	return pcm, nil
}

func (s *PersiapanService) GetPCMByID(ctx context.Context, id int64) (*domain.PCM, error) {
	pcm, err := s.persiapanRepo.GetPCMByID(ctx, id)
	if err != nil || pcm == nil {
		return nil, err
	}
	docs, _ := s.docRepo.ListByEntity(ctx, "pcm", pcm.ID)
	for _, d := range docs {
		d.FileURL = s.storage.GetFileURL(d.FilePath)
	}
	pcm.Documents = docs
	return pcm, nil
}

func (s *PersiapanService) ListPCM(ctx context.Context, persiapanKontrakID *int64) ([]*domain.PCM, error) {
	list, err := s.persiapanRepo.ListPCM(ctx, persiapanKontrakID)
	if err != nil {
		return nil, err
	}
	for _, pcm := range list {
		docs, _ := s.docRepo.ListByEntity(ctx, "pcm", pcm.ID)
		for _, d := range docs {
			d.FileURL = s.storage.GetFileURL(d.FilePath)
		}
		pcm.Documents = docs
	}
	return list, nil
}

func (s *PersiapanService) CreateOrUpdatePCM(ctx context.Context, pcm *domain.PCM) error {
	return s.persiapanRepo.CreateOrUpdatePCM(ctx, pcm)
}

func (s *PersiapanService) DeletePCM(ctx context.Context, id int64) error {
	return s.persiapanRepo.DeletePCM(ctx, id)
}

// --- PELAKSANAAN SERVICE ---

type PelaksanaanService struct {
	pelaksanaanRepo repository.PelaksanaanRepository
	docRepo         repository.DocumentRepository
	storage         storage.Storage
}

func NewPelaksanaanService(
	pelaksanaanRepo repository.PelaksanaanRepository,
	docRepo repository.DocumentRepository,
	storage storage.Storage,
) *PelaksanaanService {
	return &PelaksanaanService{
		pelaksanaanRepo: pelaksanaanRepo,
		docRepo:         docRepo,
		storage:         storage,
	}
}

func (s *PelaksanaanService) GetByID(ctx context.Context, id int64) (*domain.Pelaksanaan, error) {
	p, err := s.pelaksanaanRepo.GetByID(ctx, id)
	if err != nil || p == nil {
		return nil, err
	}
	docs, _ := s.docRepo.ListByEntity(ctx, "pelaksanaan", p.ID)
	for _, d := range docs {
		d.FileURL = s.storage.GetFileURL(d.FilePath)
	}
	p.Documents = docs

	// Milestone calculation: 0, 50, 75, 90
	if len(docs) >= 3 {
		p.MilestoneProg = 90
	} else if len(docs) == 2 {
		p.MilestoneProg = 75
	} else if len(docs) == 1 {
		p.MilestoneProg = 50
	} else {
		p.MilestoneProg = 0
	}

	return p, nil
}

func (s *PelaksanaanService) List(ctx context.Context, knmpID *int64) ([]*domain.Pelaksanaan, error) {
	list, err := s.pelaksanaanRepo.List(ctx, knmpID)
	if err != nil {
		return nil, err
	}
	for _, p := range list {
		docs, _ := s.docRepo.ListByEntity(ctx, "pelaksanaan", p.ID)
		for _, d := range docs {
			d.FileURL = s.storage.GetFileURL(d.FilePath)
		}
		p.Documents = docs
		if len(docs) >= 3 {
			p.MilestoneProg = 90
		} else if len(docs) == 2 {
			p.MilestoneProg = 75
		} else if len(docs) == 1 {
			p.MilestoneProg = 50
		} else {
			p.MilestoneProg = 0
		}
	}
	return list, nil
}

func (s *PelaksanaanService) Create(ctx context.Context, p *domain.Pelaksanaan) error {
	return s.pelaksanaanRepo.Create(ctx, p)
}

func (s *PelaksanaanService) Update(ctx context.Context, p *domain.Pelaksanaan) error {
	return s.pelaksanaanRepo.Update(ctx, p)
}

func (s *PelaksanaanService) Delete(ctx context.Context, id int64) error {
	return s.pelaksanaanRepo.Delete(ctx, id)
}
