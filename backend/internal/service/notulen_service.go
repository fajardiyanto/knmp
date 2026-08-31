package service

import (
	"context"
	"errors"

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

func (s *NotulenService) CanEdit(ctx context.Context, notulenID int64, userID int64, userRole string) bool {
	if domain.IsAdminRole(userRole) {
		return true
	}
	if notulenID <= 0 || userID <= 0 {
		return false
	}
	access, err := s.notulenRepo.GetUserAccess(ctx, notulenID, userID)
	if err == nil && access == "editor" {
		return true
	}
	return false
}

func (s *NotulenService) GetByID(ctx context.Context, id int64, currentUserID int64, currentUserRole string) (*domain.Notulen, error) {
	n, err := s.notulenRepo.GetByID(ctx, id)
	if err != nil || n == nil {
		return nil, err
	}

	// Compute UserAccess level for current user
	if domain.IsAdminRole(currentUserRole) {
		n.UserAccess = "owner"
	} else if n.CreatedBy != nil && *n.CreatedBy == currentUserID {
		n.UserAccess = "owner"
	} else {
		access, _ := s.notulenRepo.GetUserAccess(ctx, n.ID, currentUserID)
		if access == "editor" {
			n.UserAccess = "editor"
		} else {
			n.UserAccess = "viewer"
		}
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
		if domain.IsAdminRole(filter.UserRole) {
			n.UserAccess = "owner"
		} else {
			access, _ := s.notulenRepo.GetUserAccess(ctx, n.ID, filter.UserID)
			if access == "editor" {
				n.UserAccess = "editor"
			} else {
				n.UserAccess = "viewer"
			}
		}

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

func (s *NotulenService) Create(ctx context.Context, n *domain.Notulen, sharedUsers []domain.ShareUserItem, userRole string) error {
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

	return s.notulenRepo.Create(ctx, n, sharedUsers)
}

func (s *NotulenService) Update(ctx context.Context, n *domain.Notulen, sharedUsers []domain.ShareUserItem, userID int64, userRole string) error {
	canEdit := s.CanEdit(ctx, n.ID, userID, userRole)
	if !canEdit {
		return errors.New("anda tidak memiliki hak akses editor untuk mengubah notulen rapat ini")
	}

	existing, err := s.notulenRepo.GetByID(ctx, n.ID)
	if err != nil || existing == nil {
		return errors.New("notulen tidak ditemukan")
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

	return s.notulenRepo.Update(ctx, n, sharedUsers)
}

func (s *NotulenService) Delete(ctx context.Context, id int64, userRole string) error {
	if !CanManageNotulen(userRole) {
		return errors.New("hanya Super Admin dan Admin PPK yang memiliki hak akses untuk menghapus notulen rapat")
	}

	return s.notulenRepo.Delete(ctx, id)
}

func (s *NotulenService) Share(ctx context.Context, notulenID int64, sharedUsers []domain.ShareUserItem, userRole string) error {
	if !CanManageNotulen(userRole) {
		return errors.New("hanya Super Admin dan Admin PPK yang memiliki hak akses untuk membagikan notulen rapat")
	}

	return s.notulenRepo.ShareToUsers(ctx, notulenID, sharedUsers)
}
