package service

import (
	"context"
	"errors"
	"mime/multipart"
	"time"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
	"knmp-v2-backend/pkg/storage"
)

// --- ABSENSI SERVICE ---

type AbsensiService struct {
	absensiRepo repository.AbsensiRepository
	verifRepo   repository.VerificationRepository
	docRepo     repository.DocumentRepository
	storage     storage.Storage
}

func NewAbsensiService(
	absensiRepo repository.AbsensiRepository,
	verifRepo repository.VerificationRepository,
	docRepo repository.DocumentRepository,
	storage storage.Storage,
) *AbsensiService {
	return &AbsensiService{
		absensiRepo: absensiRepo,
		verifRepo:   verifRepo,
		docRepo:     docRepo,
		storage:     storage,
	}
}

func (s *AbsensiService) GetByID(ctx context.Context, id int64) (*domain.Absensi, error) {
	a, err := s.absensiRepo.GetByID(ctx, id)
	if err != nil || a == nil {
		return nil, err
	}
	docs, _ := s.docRepo.ListByEntity(ctx, "absensi", a.ID)
	for _, d := range docs {
		d.FileURL = s.storage.GetFileURL(d.FilePath)
	}
	a.Documents = docs

	verif, _ := s.verifRepo.GetLatestVerification(ctx, "absensi", a.ID, "wakil_ppk")
	if verif == nil {
		verif, _ = s.verifRepo.GetLatestVerification(ctx, "absensi", a.ID, "pengawas")
	}
	a.CurrentVerification = verif

	return a, nil
}

func (s *AbsensiService) List(ctx context.Context, filter repository.AbsensiFilter) ([]*domain.Absensi, error) {
	list, err := s.absensiRepo.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	for _, a := range list {
		docs, _ := s.docRepo.ListByEntity(ctx, "absensi", a.ID)
		for _, d := range docs {
			d.FileURL = s.storage.GetFileURL(d.FilePath)
		}
		a.Documents = docs

		verif, _ := s.verifRepo.GetLatestVerification(ctx, "absensi", a.ID, "wakil_ppk")
		if verif == nil {
			verif, _ = s.verifRepo.GetLatestVerification(ctx, "absensi", a.ID, "pengawas")
		}
		a.CurrentVerification = verif
	}
	return list, nil
}

func (s *AbsensiService) CreateMobile(
	ctx context.Context,
	pelaksanaanID int64,
	userID int64,
	tipeAbsensi string,
	lat, long *string,
	photo *multipart.FileHeader,
) (*domain.Absensi, error) {
	a := &domain.Absensi{
		PelaksanaanID: pelaksanaanID,
		UserID:        &userID,
		TipeAbsensi:   tipeAbsensi,
		RecordedAt:    time.Now(),
		Lat:           lat,
		Long:          long,
		Status:        "menunggu_pengawas",
		CreatedBy:     &userID,
	}

	if err := s.absensiRepo.Create(ctx, a); err != nil {
		return nil, err
	}

	if photo != nil {
		relPath, fileName, fileType, err := s.storage.SaveUploadedFile(photo, "absensi")
		if err == nil {
			doc := &domain.Document{
				DocumentableType: "absensi",
				DocumentableID:   a.ID,
				FileName:         fileName,
				FilePath:         relPath,
				FileType:         &fileType,
				Category:         "foto_absensi",
				Status:           "pending",
				UploadedBy:       &userID,
			}
			_ = s.docRepo.Create(ctx, doc)
		}
	}

	return s.GetByID(ctx, a.ID)
}

func (s *AbsensiService) Verify(ctx context.Context, id int64, step string, isApproved bool, note string, verifierID int64) error {
	a, err := s.absensiRepo.GetByID(ctx, id)
	if err != nil || a == nil {
		return errors.New("absensi tidak ditemukan")
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

	if err := s.absensiRepo.UpdateStatus(ctx, a.ID, newStatus); err != nil {
		return err
	}

	notePtr := &note
	if note == "" {
		notePtr = nil
	}

	v := &domain.Verification{
		VerifiableType: "absensi",
		VerifiableID:   a.ID,
		Step:           step,
		Status:         verifStatus,
		Note:           notePtr,
		VerifiedBy:     &verifierID,
		IsCurrent:      true,
	}

	return s.verifRepo.CreateVerification(ctx, v)
}

func (s *AbsensiService) Unverify(ctx context.Context, id int64, step string, note string, verifierID int64) error {
	var targetStatus string
	if step == "pengawas" {
		targetStatus = "menunggu_pengawas"
	} else if step == "wakil_ppk" {
		targetStatus = "menunggu_wakil_ppk"
	} else {
		return errors.New("step tidak valid")
	}

	if err := s.absensiRepo.UpdateStatus(ctx, id, targetStatus); err != nil {
		return err
	}

	notePtr := &note
	if note == "" {
		notePtr = nil
	}

	v := &domain.Verification{
		VerifiableType: "absensi",
		VerifiableID:   id,
		Step:           step,
		Status:         "unverified",
		Note:           notePtr,
		VerifiedBy:     &verifierID,
		IsCurrent:      true,
	}

	return s.verifRepo.CreateVerification(ctx, v)
}

// --- ISSUE SERVICE ---

type IssueService struct {
	issueRepo repository.IssueRepository
	verifRepo repository.VerificationRepository
	docRepo   repository.DocumentRepository
	storage   storage.Storage
}

func NewIssueService(
	issueRepo repository.IssueRepository,
	verifRepo repository.VerificationRepository,
	docRepo repository.DocumentRepository,
	storage storage.Storage,
) *IssueService {
	return &IssueService{
		issueRepo: issueRepo,
		verifRepo: verifRepo,
		docRepo:   docRepo,
		storage:   storage,
	}
}

func (s *IssueService) GetByID(ctx context.Context, id int64) (*domain.Issue, error) {
	i, err := s.issueRepo.GetByID(ctx, id)
	if err != nil || i == nil {
		return nil, err
	}
	docs, _ := s.docRepo.ListByEntity(ctx, "issue", i.ID)
	for _, d := range docs {
		d.FileURL = s.storage.GetFileURL(d.FilePath)
	}
	i.Documents = docs

	verif, _ := s.verifRepo.GetLatestVerification(ctx, "issue", i.ID, "wakil_ppk")
	if verif == nil {
		verif, _ = s.verifRepo.GetLatestVerification(ctx, "issue", i.ID, "pengawas")
	}
	i.CurrentVerification = verif

	return i, nil
}

func (s *IssueService) List(ctx context.Context, filter repository.IssueFilter) ([]*domain.Issue, error) {
	list, err := s.issueRepo.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	for _, i := range list {
		docs, _ := s.docRepo.ListByEntity(ctx, "issue", i.ID)
		for _, d := range docs {
			d.FileURL = s.storage.GetFileURL(d.FilePath)
		}
		i.Documents = docs

		verif, _ := s.verifRepo.GetLatestVerification(ctx, "issue", i.ID, "wakil_ppk")
		if verif == nil {
			verif, _ = s.verifRepo.GetLatestVerification(ctx, "issue", i.ID, "pengawas")
		}
		i.CurrentVerification = verif
	}
	return list, nil
}

func (s *IssueService) Create(ctx context.Context, i *domain.Issue) error {
	return s.issueRepo.Create(ctx, i)
}

func (s *IssueService) Update(ctx context.Context, i *domain.Issue) error {
	return s.issueRepo.Update(ctx, i)
}

func (s *IssueService) Delete(ctx context.Context, id int64) error {
	return s.issueRepo.Delete(ctx, id)
}

func (s *IssueService) CreateMobile(
	ctx context.Context,
	knmpID int64,
	kategoriIssue, tingkat, uraianMasalah string,
	userID int64,
	photos []*multipart.FileHeader,
) (*domain.Issue, error) {
	issue := &domain.Issue{
		KnmpID:        &knmpID,
		KategoriIssue: kategoriIssue,
		Tingkat:       tingkat,
		Status:        "menunggu_pengawas",
		UraianMasalah: uraianMasalah,
		CreatedBy:     &userID,
	}

	if err := s.issueRepo.Create(ctx, issue); err != nil {
		return nil, err
	}

	for _, photo := range photos {
		relPath, fileName, fileType, err := s.storage.SaveUploadedFile(photo, "issue")
		if err == nil {
			doc := &domain.Document{
				DocumentableType: "issue",
				DocumentableID:   issue.ID,
				FileName:         fileName,
				FilePath:         relPath,
				FileType:         &fileType,
				Category:         "foto",
				Status:           "pending",
				UploadedBy:       &userID,
			}
			_ = s.docRepo.Create(ctx, doc)
		}
	}

	return s.GetByID(ctx, issue.ID)
}

func (s *IssueService) Verify(ctx context.Context, id int64, step string, isApproved bool, note string, verifierID int64) error {
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
		if isApproved {
			newStatus = "terverifikasi"
			verifStatus = "approved"
		} else {
			newStatus = "ditolak_wakil_ppk"
			verifStatus = "rejected"
		}
	}

	if err := s.issueRepo.UpdateStatus(ctx, id, newStatus); err != nil {
		return err
	}

	notePtr := &note
	if note == "" {
		notePtr = nil
	}

	v := &domain.Verification{
		VerifiableType: "issue",
		VerifiableID:   id,
		Step:           step,
		Status:         verifStatus,
		Note:           notePtr,
		VerifiedBy:     &verifierID,
		IsCurrent:      true,
	}

	return s.verifRepo.CreateVerification(ctx, v)
}

func (s *IssueService) Unverify(ctx context.Context, id int64, step string, note string, verifierID int64) error {
	var targetStatus string
	if step == "pengawas" {
		targetStatus = "menunggu_pengawas"
	} else if step == "wakil_ppk" {
		targetStatus = "menunggu_wakil_ppk"
	}

	if err := s.issueRepo.UpdateStatus(ctx, id, targetStatus); err != nil {
		return err
	}

	notePtr := &note
	if note == "" {
		notePtr = nil
	}

	v := &domain.Verification{
		VerifiableType: "issue",
		VerifiableID:   id,
		Step:           step,
		Status:         "unverified",
		Note:           notePtr,
		VerifiedBy:     &verifierID,
		IsCurrent:      true,
	}

	return s.verifRepo.CreateVerification(ctx, v)
}

// --- PEMBAYARAN SERVICE ---

type PembayaranService struct {
	pembayaranRepo repository.PembayaranRepository
	docRepo        repository.DocumentRepository
	storage        storage.Storage
}

func NewPembayaranService(
	pembayaranRepo repository.PembayaranRepository,
	docRepo repository.DocumentRepository,
	storage storage.Storage,
) *PembayaranService {
	return &PembayaranService{
		pembayaranRepo: pembayaranRepo,
		docRepo:        docRepo,
		storage:        storage,
	}
}

func (s *PembayaranService) GetByID(ctx context.Context, id int64) (*domain.Pembayaran, error) {
	p, err := s.pembayaranRepo.GetByID(ctx, id)
	if err != nil || p == nil {
		return nil, err
	}
	docs, _ := s.docRepo.ListByEntity(ctx, "pembayaran", p.ID)
	for _, d := range docs {
		d.FileURL = s.storage.GetFileURL(d.FilePath)
	}
	p.Documents = docs
	return p, nil
}

func (s *PembayaranService) List(ctx context.Context, persiapanKontrakID *int64) ([]*domain.Pembayaran, error) {
	list, err := s.pembayaranRepo.List(ctx, persiapanKontrakID)
	if err != nil {
		return nil, err
	}
	for _, p := range list {
		docs, _ := s.docRepo.ListByEntity(ctx, "pembayaran", p.ID)
		for _, d := range docs {
			d.FileURL = s.storage.GetFileURL(d.FilePath)
		}
		p.Documents = docs
	}
	return list, nil
}

func (s *PembayaranService) Create(ctx context.Context, p *domain.Pembayaran) error {
	return s.pembayaranRepo.Create(ctx, p)
}

func (s *PembayaranService) Update(ctx context.Context, p *domain.Pembayaran) error {
	return s.pembayaranRepo.Update(ctx, p)
}

func (s *PembayaranService) Delete(ctx context.Context, id int64) error {
	return s.pembayaranRepo.Delete(ctx, id)
}

func (s *PembayaranService) GetSummary(ctx context.Context) (map[string]any, error) {
	return s.pembayaranRepo.GetSummary(ctx)
}

func (s *PembayaranService) GetTerminStats(ctx context.Context) ([]map[string]any, error) {
	return s.pembayaranRepo.GetTerminStats(ctx)
}
