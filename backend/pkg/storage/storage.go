package storage

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"knmp-v2-backend/internal/config"
)

type Storage interface {
	SaveUploadedFile(file *multipart.FileHeader, subDir string) (filePath string, fileName string, fileType string, err error)
	GetFileURL(filePath string) string
	DeleteFile(filePath string) error
	GetFilePath(filePath string) string
}

type LocalStorage struct {
	baseDir string
}

func NewStorage(cfg *config.Config) (Storage, error) {
	// Create base uploads folder if it doesn't exist
	if err := os.MkdirAll(cfg.StorageLocalDir, 0755); err != nil {
		return nil, fmt.Errorf("create storage dir: %w", err)
	}
	return &LocalStorage{baseDir: cfg.StorageLocalDir}, nil
}

func (s *LocalStorage) SaveUploadedFile(file *multipart.FileHeader, subDir string) (string, string, string, error) {
	src, err := file.Open()
	if err != nil {
		return "", "", "", fmt.Errorf("open uploaded file: %w", err)
	}
	defer src.Close()

	ext := strings.ToLower(filepath.Ext(file.Filename))
	uniqueName := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)

	targetFolder := filepath.Join(s.baseDir, subDir)
	if err := os.MkdirAll(targetFolder, 0755); err != nil {
		return "", "", "", fmt.Errorf("create target folder: %w", err)
	}

	fullPath := filepath.Join(targetFolder, uniqueName)
	dst, err := os.Create(fullPath)
	if err != nil {
		return "", "", "", fmt.Errorf("create destination file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", "", "", fmt.Errorf("copy file bytes: %w", err)
	}

	relPath := filepath.ToSlash(filepath.Join("uploads", subDir, uniqueName))
	fileType := file.Header.Get("Content-Type")
	if fileType == "" {
		fileType = "application/octet-stream"
	}

	return relPath, file.Filename, fileType, nil
}

func (s *LocalStorage) GetFileURL(filePath string) string {
	if filePath == "" {
		return ""
	}
	if strings.HasPrefix(filePath, "http://") || strings.HasPrefix(filePath, "https://") {
		return filePath
	}
	return "/api/v1/documents/stream?path=" + filePath
}

func (s *LocalStorage) DeleteFile(filePath string) error {
	cleanPath := strings.TrimPrefix(filePath, "uploads/")
	fullPath := filepath.Join(s.baseDir, cleanPath)
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return nil
	}
	return os.Remove(fullPath)
}

func (s *LocalStorage) GetFilePath(filePath string) string {
	cleanPath := strings.TrimPrefix(filePath, "uploads/")
	return filepath.Join(s.baseDir, cleanPath)
}
