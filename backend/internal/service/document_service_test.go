package service

import (
	"context"
	"mime/multipart"
	"testing"
	"time"

	"knmp-v2-backend/internal/domain"
)

type mockDocRepo struct {
	docs map[int64]*domain.Document
}

func (m *mockDocRepo) GetByID(ctx context.Context, id int64) (*domain.Document, error) {
	if d, ok := m.docs[id]; ok {
		return d, nil
	}
	return nil, nil
}

func (m *mockDocRepo) ListByEntity(ctx context.Context, docType string, docID int64) ([]*domain.Document, error) {
	var list []*domain.Document
	for _, d := range m.docs {
		if d.DocumentableType == docType && d.DocumentableID == docID {
			list = append(list, d)
		}
	}
	return list, nil
}

func (m *mockDocRepo) ListByEntityAndCategory(ctx context.Context, docType string, docID int64, category string) ([]*domain.Document, error) {
	var list []*domain.Document
	for _, d := range m.docs {
		if d.DocumentableType == docType && d.DocumentableID == docID && d.Category == category {
			list = append(list, d)
		}
	}
	return list, nil
}

func (m *mockDocRepo) Create(ctx context.Context, doc *domain.Document) error {
	doc.ID = int64(len(m.docs) + 1)
	m.docs[doc.ID] = doc
	return nil
}

func (m *mockDocRepo) Update(ctx context.Context, doc *domain.Document) error {
	m.docs[doc.ID] = doc
	return nil
}

func (m *mockDocRepo) Delete(ctx context.Context, id int64) error {
	delete(m.docs, id)
	return nil
}

func (m *mockDocRepo) Verify(ctx context.Context, id int64, status string, note *string, verifiedBy int64) error {
	if d, ok := m.docs[id]; ok {
		d.Status = status
		d.Note = note
		d.VerifiedBy = &verifiedBy
		now := time.Now()
		d.VerifiedAt = &now
	}
	return nil
}

type mockStorage struct{}

func (m *mockStorage) SaveUploadedFile(file *multipart.FileHeader, subDir string) (string, string, string, error) {
	return "uploads/" + subDir + "/test_file.png", "test_file.png", "image/png", nil
}

func (m *mockStorage) GetFileURL(filePath string) string {
	return "/uploads/" + filePath
}

func (m *mockStorage) DeleteFile(filePath string) error {
	return nil
}

func (m *mockStorage) GetFilePath(filePath string) string {
	return "./storage/uploads/" + filePath
}

func TestDocumentService_GetByIDAndVerify(t *testing.T) {
	mockRepo := &mockDocRepo{
		docs: map[int64]*domain.Document{
			1: {
				ID:               1,
				DocumentableType: "laporan",
				DocumentableID:   10,
				FileName:         "status_k3.png",
				FilePath:         "laporan/status_k3.png",
				Category:         "status_k3_doc",
				Status:           "pending",
			},
		},
	}
	mockStor := &mockStorage{}

	svc := NewDocumentService(mockRepo, mockStor)

	// Test 1: GetByID
	doc, err := svc.GetByID(context.Background(), 1)
	if err != nil {
		t.Fatalf("expected doc, got error: %v", err)
	}
	if doc == nil || doc.FileName != "status_k3.png" {
		t.Fatalf("expected status_k3.png, got %+v", doc)
	}
	if doc.FileURL != "/uploads/laporan/status_k3.png" {
		t.Errorf("expected file url /uploads/laporan/status_k3.png, got %s", doc.FileURL)
	}

	// Test 2: Verify
	note := "Dokumen K3 lengkap dan valid"
	err = svc.Verify(context.Background(), 1, "verified", &note, 99)
	if err != nil {
		t.Fatalf("expected verify success, got %v", err)
	}
	if doc.Status != "verified" {
		t.Errorf("expected verified status, got %s", doc.Status)
	}
	if doc.VerifiedBy == nil || *doc.VerifiedBy != 99 {
		t.Errorf("expected verified by 99, got %v", doc.VerifiedBy)
	}

	// Test 3: Delete
	err = svc.Delete(context.Background(), 1)
	if err != nil {
		t.Fatalf("expected delete success, got %v", err)
	}
	deletedDoc, _ := svc.GetByID(context.Background(), 1)
	if deletedDoc != nil {
		t.Errorf("expected doc to be deleted, found %+v", deletedDoc)
	}
}
