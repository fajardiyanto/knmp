package service

import (
	"context"
	"errors"
	"fmt"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
	"knmp-v2-backend/pkg/storage"
)

type NotulenService struct {
	notulenRepo repository.NotulenRepository
	docRepo     repository.DocumentRepository
	storage     storage.Storage
}

func NewNotulenService(
	notulenRepo repository.NotulenRepository,
	docRepo repository.DocumentRepository,
	storage storage.Storage,
) *NotulenService {
	return &NotulenService{
		notulenRepo: notulenRepo,
		docRepo:     docRepo,
		storage:     storage,
	}
}

// CanManageNotulen returns true only if the user has superadmin or admin_ppk or admin role
func CanManageNotulen(userRole string) bool {
	return domain.IsAdminRole(userRole)
}

func (s *NotulenService) GetByID(ctx context.Context, id int64) (*domain.Notulen, error) {
	n, err := s.notulenRepo.GetByID(ctx, id)
	if err != nil || n == nil {
		return nil, err
	}

	// Fetch documents attached to this notulen
	docs, err := s.docRepo.ListByEntity(ctx, "notulen", n.ID)
	if err == nil {
		for _, doc := range docs {
			doc.FileURL = s.storage.GetFileURL(doc.FilePath)
		}
		n.Documents = docs
	}

	return n, nil
}

func (s *NotulenService) List(ctx context.Context, filter domain.NotulenFilter) ([]*domain.Notulen, error) {
	list, err := s.notulenRepo.List(ctx, filter)
	if err != nil {
		return nil, err
	}

	for _, n := range list {
		docs, err := s.docRepo.ListByEntity(ctx, "notulen", n.ID)
		if err == nil {
			for _, doc := range docs {
				doc.FileURL = s.storage.GetFileURL(doc.FilePath)
			}
			n.Documents = docs
		}
	}

	return list, nil
}

func (s *NotulenService) Create(ctx context.Context, n *domain.Notulen, sharedUserIDs []int64, userRole string) error {
	if !CanManageNotulen(userRole) {
		return errors.New("hanya Super Admin dan Admin PPK yang memiliki hak akses untuk menambahkan notulen rapat")
	}

	if n.Judul == "" {
		return errors.New("judul/agenda rapat wajib diisi")
	}
	if n.Tanggal == "" {
		return errors.New("tanggal rapat wajib diisi")
	}
	if n.HasilPembahasan == "" {
		return errors.New("poin pembahasan / hasil rapat wajib diisi")
	}
	if n.Notulis == "" {
		n.Notulis = "Super Admin"
	}

	return s.notulenRepo.Create(ctx, n, sharedUserIDs)
}

func (s *NotulenService) Update(ctx context.Context, n *domain.Notulen, sharedUserIDs []int64, userRole string) error {
	if !CanManageNotulen(userRole) {
		return errors.New("hanya Super Admin dan Admin PPK yang memiliki hak akses untuk mengubah notulen rapat")
	}

	existing, err := s.notulenRepo.GetByID(ctx, n.ID)
	if err != nil || existing == nil {
		return errors.New("data notulen tidak ditemukan")
	}

	if n.Judul == "" {
		return errors.New("judul/agenda rapat wajib diisi")
	}
	if n.Tanggal == "" {
		return errors.New("tanggal rapat wajib diisi")
	}
	if n.HasilPembahasan == "" {
		return errors.New("poin pembahasan / hasil rapat wajib diisi")
	}
	if n.Notulis == "" {
		n.Notulis = "Super Admin"
	}

	return s.notulenRepo.Update(ctx, n, sharedUserIDs)
}

func (s *NotulenService) Delete(ctx context.Context, id int64, userRole string) error {
	if !CanManageNotulen(userRole) {
		return errors.New("hanya Super Admin dan Admin PPK yang memiliki hak akses untuk menghapus notulen rapat")
	}
	return s.notulenRepo.Delete(ctx, id)
}

func (s *NotulenService) ShareToUsers(ctx context.Context, notulenID int64, userIDs []int64, userRole string) error {
	if !CanManageNotulen(userRole) {
		return errors.New("hanya Super Admin dan Admin PPK yang dapat membagikan notulen rapat")
	}

	existing, err := s.notulenRepo.GetByID(ctx, notulenID)
	if err != nil || existing == nil {
		return errors.New("data notulen tidak ditemukan")
	}

	if len(userIDs) == 0 {
		return fmt.Errorf("pilih minimal 1 user untuk dibagikan")
	}

	return s.notulenRepo.ShareToUsers(ctx, notulenID, userIDs)
}

func (s *NotulenService) GetSharedUsers(ctx context.Context, notulenID int64) ([]*domain.User, error) {
	return s.notulenRepo.GetSharedUsers(ctx, notulenID)
}
