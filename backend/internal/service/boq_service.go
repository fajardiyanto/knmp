package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	_ "image/gif"
	"image/jpeg"
	_ "image/png"
	"strings"
	"sync"
	"time"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
	"knmp-v2-backend/pkg/storage"
)

type boqCacheEntry struct {
	data      *domain.WeeklyBOQControl
	expiresAt time.Time
}

type WeeklyBOQService struct {
	repo    repository.WeeklyBOQRepository
	storage storage.Storage
	mu      sync.RWMutex
	cache   map[int64]boqCacheEntry
}

func NewWeeklyBOQService(repo repository.WeeklyBOQRepository, st ...storage.Storage) *WeeklyBOQService {
	var s storage.Storage
	if len(st) > 0 {
		s = st[0]
	}
	return &WeeklyBOQService{
		repo:    repo,
		storage: s,
		cache:   make(map[int64]boqCacheEntry),
	}
}

func (s *WeeklyBOQService) List(ctx context.Context, filter repository.WeeklyBOQFilter) ([]*domain.WeeklyBOQControl, error) {
	return s.repo.List(ctx, filter)
}

func (s *WeeklyBOQService) GetByID(ctx context.Context, id int64) (*domain.WeeklyBOQControl, error) {
	s.mu.RLock()
	entry, found := s.cache[id]
	s.mu.RUnlock()

	if found && time.Now().Before(entry.expiresAt) {
		return entry.data, nil
	}

	item, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if item != nil {
		s.mu.Lock()
		s.cache[id] = boqCacheEntry{
			data:      item,
			expiresAt: time.Now().Add(5 * time.Minute),
		}
		s.mu.Unlock()
	}
	return item, nil
}

func (s *WeeklyBOQService) invalidateCache(id int64) {
	s.mu.Lock()
	if id > 0 {
		delete(s.cache, id)
	} else {
		s.cache = make(map[int64]boqCacheEntry)
	}
	s.mu.Unlock()
}

func (s *WeeklyBOQService) Create(ctx context.Context, control *domain.WeeklyBOQControl, items []*domain.WeeklyBOQItem) error {
	if err := s.prepareWeeklyBOQ(control, items); err != nil {
		return err
	}
	s.invalidateCache(0)
	return s.repo.Create(ctx, control, items)
}

func (s *WeeklyBOQService) Update(ctx context.Context, control *domain.WeeklyBOQControl, items []*domain.WeeklyBOQItem) error {
	if control.ID == 0 {
		return errors.New("id BOQ wajib diisi")
	}
	if err := s.prepareWeeklyBOQ(control, items); err != nil {
		return err
	}
	s.invalidateCache(control.ID)
	return s.repo.Update(ctx, control, items)
}

func (s *WeeklyBOQService) prepareWeeklyBOQ(control *domain.WeeklyBOQControl, items []*domain.WeeklyBOQItem) error {
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
	} else if s.storage != nil {
		// Automatically extract base64 images to static files so payload stays tiny
		if optimizedJSON, err := s.extractAndSaveBase64Images(control.ID, control.ManualTables); err == nil && len(optimizedJSON) > 0 {
			control.ManualTables = optimizedJSON
		}
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
	return nil
}

func (s *WeeklyBOQService) extractAndSaveBase64Images(controlID int64, rawJSON json.RawMessage) (json.RawMessage, error) {
	if len(rawJSON) == 0 {
		return rawJSON, nil
	}
	var root map[string]interface{}
	if err := json.Unmarshal(rawJSON, &root); err != nil {
		return rawJSON, err
	}

	modified := false
	for lampiranKey, lampiranVal := range root {
		lampiranMap, ok := lampiranVal.(map[string]interface{})
		if !ok {
			continue
		}
		rowsVal, ok := lampiranMap["rows"]
		if !ok {
			continue
		}
		rowsList, ok := rowsVal.([]interface{})
		if !ok {
			continue
		}

		for _, rowVal := range rowsList {
			rowMap, ok := rowVal.(map[string]interface{})
			if !ok {
				continue
			}
			imagesVal, ok := rowMap["images"]
			if !ok {
				continue
			}
			imagesList, ok := imagesVal.([]interface{})
			if !ok {
				continue
			}

			for _, imgVal := range imagesList {
				imgMap, ok := imgVal.(map[string]interface{})
				if !ok {
					continue
				}
				dataURL, _ := imgMap["data_url"].(string)
				if !strings.HasPrefix(dataURL, "data:image/") {
					continue
				}

				parts := strings.SplitN(dataURL, ",", 2)
				if len(parts) != 2 {
					continue
				}

				header := parts[0]
				b64Data := parts[1]
				dec, err := base64.StdEncoding.DecodeString(b64Data)
				if err != nil {
					continue
				}

				ext := ".jpg"
				contentType := "image/jpeg"
				if strings.Contains(header, "png") {
					ext = ".png"
					contentType = "image/png"
				} else if strings.Contains(header, "webp") {
					ext = ".webp"
					contentType = "image/webp"
				}

				// Optimize JPEG compression to minimize file size
				var finalBytes []byte
				imgDec, _, decErr := image.Decode(bytes.NewReader(dec))
				if decErr == nil {
					var buf bytes.Buffer
					if err := jpeg.Encode(&buf, imgDec, &jpeg.Options{Quality: 80}); err == nil {
						finalBytes = buf.Bytes()
						ext = ".jpg"
						contentType = "image/jpeg"
					} else {
						finalBytes = dec
					}
				} else {
					finalBytes = dec
				}

				filename := fmt.Sprintf("boq_%d_%s_%d%s", controlID, lampiranKey, time.Now().UnixNano(), ext)
				savedPath, _, _, err := s.storage.SaveFileBytes(filename, contentType, finalBytes, "boq")
				if err != nil {
					continue
				}

				relURL := s.storage.GetFileURL(savedPath)
				imgMap["data_url"] = relURL
				modified = true
			}
		}
	}

	if !modified {
		return rawJSON, nil
	}
	return json.Marshal(root)
}

func (s *WeeklyBOQService) UpdateStatus(ctx context.Context, id int64, status string) error {
	if status == "" {
		return errors.New("status wajib diisi")
	}
	s.invalidateCache(id)
	return s.repo.UpdateStatus(ctx, id, status)
}

func (s *WeeklyBOQService) Delete(ctx context.Context, id int64) error {
	s.invalidateCache(id)
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
