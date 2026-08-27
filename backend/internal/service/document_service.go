package service

import (
	"context"
	"errors"
	"mime/multipart"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
	"knmp-v2-backend/pkg/storage"
)

type DocumentService struct {
	docRepo repository.DocumentRepository
	storage storage.Storage
}

func NewDocumentService(docRepo repository.DocumentRepository, storage storage.Storage) *DocumentService {
	return &DocumentService{
		docRepo: docRepo,
		storage: storage,
	}
}

func (s *DocumentService) GetByID(ctx context.Context, id int64) (*domain.Document, error) {
	doc, err := s.docRepo.GetByID(ctx, id)
	if err != nil || doc == nil {
		return nil, err
	}
	doc.FileURL = s.storage.GetFileURL(doc.FilePath)
	return doc, nil
}

func (s *DocumentService) UploadDocument(
	ctx context.Context,
	docType string,
	docID int64,
	category string,
	userID int64,
	file *multipart.FileHeader,
) (*domain.Document, error) {
	relPath, fileName, fileType, err := s.storage.SaveUploadedFile(file, docType)
	if err != nil {
		return nil, err
	}

	doc := &domain.Document{
		DocumentableType: docType,
		DocumentableID:   docID,
		FileName:         fileName,
		FilePath:         relPath,
		FileType:         &fileType,
		Category:         category,
		Version:          "1.0",
		Status:           "pending",
		UploadedBy:       &userID,
	}

	if err := s.docRepo.Create(ctx, doc); err != nil {
		return nil, err
	}

	doc.FileURL = s.storage.GetFileURL(doc.FilePath)
	return doc, nil
}

func (s *DocumentService) Delete(ctx context.Context, id int64) error {
	doc, err := s.docRepo.GetByID(ctx, id)
	if err != nil || doc == nil {
		return errors.New("document not found")
	}
	_ = s.storage.DeleteFile(doc.FilePath)
	return s.docRepo.Delete(ctx, id)
}

func (s *DocumentService) Verify(ctx context.Context, id int64, status string, note *string, verifiedBy int64) error {
	return s.docRepo.Verify(ctx, id, status, note, verifiedBy)
}

func (s *DocumentService) GetFilePath(filePath string) string {
	return s.storage.GetFilePath(filePath)
}
