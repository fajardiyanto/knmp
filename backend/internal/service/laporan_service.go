package service

import (
	"context"
	"errors"
	"mime/multipart"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
	"knmp-v2-backend/pkg/storage"
)

type LaporanService struct {
	laporanRepo repository.LaporanRepository
	verifRepo   repository.VerificationRepository
	docRepo     repository.DocumentRepository
	storage     storage.Storage
}

func NewLaporanService(
	laporanRepo repository.LaporanRepository,
	verifRepo repository.VerificationRepository,
	docRepo repository.DocumentRepository,
	storage storage.Storage,
) *LaporanService {
	return &LaporanService{
		laporanRepo: laporanRepo,
		verifRepo:   verifRepo,
		docRepo:     docRepo,
		storage:     storage,
	}
}

func (s *LaporanService) GetByID(ctx context.Context, id int64) (*domain.Laporan, error) {
	l, err := s.laporanRepo.GetByID(ctx, id)
	if err != nil || l == nil {
		return nil, err
	}

	// Fetch documents uploaded directly to this laporan
	docs, err := s.docRepo.ListByEntity(ctx, "laporan", l.ID)
	if err == nil {
		for _, doc := range docs {
			doc.FileURL = s.storage.GetFileURL(doc.FilePath)
		}
		l.Documents = docs
	}

	details, err := s.laporanRepo.GetDetailsByLaporanID(ctx, l.ID)
	if err == nil {
		for _, d := range details {
			dDocs, _ := s.docRepo.ListByEntity(ctx, "laporan_jenis_bangunan", d.ID)
			for _, doc := range dDocs {
				doc.FileURL = s.storage.GetFileURL(doc.FilePath)
			}
			d.Documents = dDocs
		}
		l.JenisBangunanDetails = details
	}

	verif, _ := s.verifRepo.GetLatestVerification(ctx, "laporan", l.ID, "wakil_ppk")
	if verif == nil {
		verif, _ = s.verifRepo.GetLatestVerification(ctx, "laporan", l.ID, "pengawas")
	}
	l.CurrentVerification = verif

	return l, nil
}

func (s *LaporanService) List(ctx context.Context, filter repository.LaporanFilter) ([]*domain.Laporan, error) {
	list, err := s.laporanRepo.List(ctx, filter)
	if err != nil {
		return nil, err
	}

	for _, l := range list {
		// Populate direct documents
		docs, err := s.docRepo.ListByEntity(ctx, "laporan", l.ID)
		if err == nil {
			for _, doc := range docs {
				doc.FileURL = s.storage.GetFileURL(doc.FilePath)
			}
			l.Documents = docs
		}

		details, _ := s.laporanRepo.GetDetailsByLaporanID(ctx, l.ID)
		for _, d := range details {
			dDocs, _ := s.docRepo.ListByEntity(ctx, "laporan_jenis_bangunan", d.ID)
			for _, doc := range dDocs {
				doc.FileURL = s.storage.GetFileURL(doc.FilePath)
			}
			d.Documents = dDocs
		}
		l.JenisBangunanDetails = details

		verif, _ := s.verifRepo.GetLatestVerification(ctx, "laporan", l.ID, "wakil_ppk")
		if verif == nil {
			verif, _ = s.verifRepo.GetLatestVerification(ctx, "laporan", l.ID, "pengawas")
		}
		l.CurrentVerification = verif
	}

	return list, nil
}

func (s *LaporanService) Create(ctx context.Context, l *domain.Laporan, details []*domain.LaporanJenisBangunan) error {
	if l.Status == "" {
		l.Status = "menunggu_pengawas"
	}
	return s.laporanRepo.Create(ctx, l, details)
}

func (s *LaporanService) CreateMobile(
	ctx context.Context,
	l *domain.Laporan,
	details []*domain.LaporanJenisBangunan,
	buildingPhotos map[int][]*multipart.FileHeader,
) (*domain.Laporan, error) {
	l.Status = "menunggu_pengawas"

	if err := s.laporanRepo.Create(ctx, l, details); err != nil {
		return nil, err
	}

	// Save building detail photos
	for idx, d := range details {
		if photos, ok := buildingPhotos[idx]; ok {
			for _, file := range photos {
				relPath, fileName, fileType, err := s.storage.SaveUploadedFile(file, "laporan")
				if err != nil {
					continue
				}
				doc := &domain.Document{
					DocumentableType: "laporan_jenis_bangunan",
					DocumentableID:   d.ID,
					FileName:         fileName,
					FilePath:         relPath,
					FileType:         &fileType,
					Category:         "foto",
					Status:           "pending",
					UploadedBy:       l.UserID,
				}
				_ = s.docRepo.Create(ctx, doc)
			}
		}
	}

	return s.GetByID(ctx, l.ID)
}

func (s *LaporanService) Update(ctx context.Context, l *domain.Laporan, details []*domain.LaporanJenisBangunan) error {
	// Auto-reset verification on edit per Business Rules
	l.Status = "menunggu_pengawas"
	_ = s.verifRepo.SupersedeActiveVerifications(ctx, "laporan", l.ID)
	return s.laporanRepo.Update(ctx, l, details)
}

func (s *LaporanService) Delete(ctx context.Context, id int64) error {
	return s.laporanRepo.Delete(ctx, id)
}

func (s *LaporanService) Verify(ctx context.Context, id int64, step string, isApproved bool, note string, verifierID int64) error {
	l, err := s.laporanRepo.GetByID(ctx, id)
	if err != nil || l == nil {
		return errors.New("laporan tidak ditemukan")
	}

	var newStatus string
	var verifStatus string

	if step == "pengawas" {
		if isApproved {
			newStatus = "menunggu_wakil_ppk"
			verifStatus = "approved"
		} else {
			newStatus = "ditolak_pengawas"
			verifStatus = "rejected"
		}
	} else if step == "wakil_ppk" {
		if l.Status != "menunggu_wakil_ppk" {
			return errors.New("laporan belum diverifikasi oleh pengawas")
		}
		if isApproved {
			newStatus = "terverifikasi"
			verifStatus = "approved"
		} else {
			newStatus = "ditolak_wakil_ppk"
			verifStatus = "rejected"
		}
	} else {
		return errors.New("step verifikasi tidak valid")
	}

	if err := s.laporanRepo.UpdateStatus(ctx, l.ID, newStatus); err != nil {
		return err
	}

	notePtr := &note
	if note == "" {
		notePtr = nil
	}

	v := &domain.Verification{
		VerifiableType: "laporan",
		VerifiableID:   l.ID,
		Step:           step,
		Status:         verifStatus,
		Note:           notePtr,
		VerifiedBy:     &verifierID,
		IsCurrent:      true,
	}

	return s.verifRepo.CreateVerification(ctx, v)
}

func (s *LaporanService) Unverify(ctx context.Context, id int64, step string, note string, verifierID int64) error {
	l, err := s.laporanRepo.GetByID(ctx, id)
	if err != nil || l == nil {
		return errors.New("laporan tidak ditemukan")
	}

	var targetStatus string
	if step == "pengawas" {
		targetStatus = "menunggu_pengawas"
	} else if step == "wakil_ppk" {
		targetStatus = "menunggu_wakil_ppk"
	} else {
		return errors.New("step tidak valid")
	}

	if err := s.laporanRepo.UpdateStatus(ctx, l.ID, targetStatus); err != nil {
		return err
	}

	notePtr := &note
	if note == "" {
		notePtr = nil
	}

	v := &domain.Verification{
		VerifiableType: "laporan",
		VerifiableID:   l.ID,
		Step:           step,
		Status:         "unverified",
		Note:           notePtr,
		VerifiedBy:     &verifierID,
		IsCurrent:      true,
	}

	return s.verifRepo.CreateVerification(ctx, v)
}

func (s *LaporanService) GetMonthlyProjectReportData(ctx context.Context, filter repository.ProjectReportFilter) (*domain.MonthlyProjectReportData, error) {
	return s.laporanRepo.GetMonthlyProjectReportData(ctx, filter)
}
