package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	pdfreader "github.com/ledongthuc/pdf"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
	"knmp-v2-backend/pkg/storage"
)

type AIAnalysisService struct {
	repo     repository.AIAnalysisRepository
	docRepo  repository.DocumentRepository
	storage  storage.Storage
	aiConfig AIProviderConfig
	http     *http.Client
}

type AIProviderConfig struct {
	OpenAIAPIKey   string
	DeepSeekAPIKey string
	GeminiAPIKey   string
	ClaudeAPIKey   string
	OpenAIModel    string
	DeepSeekModel  string
	GeminiModel    string
	ClaudeModel    string
}

type AIAnalysisInput struct {
	KnmpID         *int64
	AssignedUserID *int64
	SubmittedBy    *int64
	SourceChannel  string
	SourceSender   *string
	ModelProvider  string
	Title          string
	InputText      string
	Metadata       map[string]any
	File           *multipart.FileHeader
	ExternalFile   *AIAnalysisExternalFile
	UserKnmpIDs    []int64
	IsGlobal       bool
}

type AIAnalysisExternalFile struct {
	FileName    string
	ContentType string
	Data        []byte
	PreviewText string
}

func NewAIAnalysisService(
	repo repository.AIAnalysisRepository,
	docRepo repository.DocumentRepository,
	storage storage.Storage,
	aiConfig ...AIProviderConfig,
) *AIAnalysisService {
	cfg := AIProviderConfig{}
	if len(aiConfig) > 0 {
		cfg = aiConfig[0]
	}
	cfg = cfg.withDefaults()
	return &AIAnalysisService{
		repo:     repo,
		docRepo:  docRepo,
		storage:  storage,
		aiConfig: cfg,
		http:     &http.Client{Timeout: 45 * time.Second},
	}
}

func (cfg AIProviderConfig) withDefaults() AIProviderConfig {
	if cfg.OpenAIModel == "" {
		cfg.OpenAIModel = "gpt-4o-mini"
	}
	if cfg.DeepSeekModel == "" {
		cfg.DeepSeekModel = "deepseek-chat"
	}
	if cfg.GeminiModel == "" {
		cfg.GeminiModel = "gemini-3.7-flash"
	}
	if cfg.ClaudeModel == "" {
		cfg.ClaudeModel = "claude-sonnet-4-6"
	}
	return cfg
}

func (s *AIAnalysisService) List(ctx context.Context, filter repository.AIAnalysisFilter) ([]*domain.AIAnalysis, error) {
	items, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	for _, item := range items {
		s.attachDocuments(ctx, item)
	}
	return items, nil
}

func (s *AIAnalysisService) GetByID(ctx context.Context, id int64) (*domain.AIAnalysis, error) {
	item, err := s.repo.GetByID(ctx, id)
	if err != nil || item == nil {
		return item, err
	}
	s.attachDocuments(ctx, item)
	return item, nil
}

func (s *AIAnalysisService) Analyze(ctx context.Context, input AIAnalysisInput) (*domain.AIAnalysis, error) {
	channel := strings.ToLower(strings.TrimSpace(input.SourceChannel))
	if channel == "" {
		channel = "web"
	}
	if channel != "web" && channel != "telegram" && channel != "whatsapp" {
		return nil, errors.New("source_channel harus web, telegram, atau whatsapp")
	}

	provider := normalizeAIProvider(input.ModelProvider)
	title := strings.TrimSpace(input.Title)
	if title == "" {
		title = fmt.Sprintf("Scan %s", strings.Title(channel))
	}

	extractedText := strings.TrimSpace(input.InputText)
	var doc *domain.Document
	var uploadedFile *multipart.FileHeader
	var externalFile *AIAnalysisExternalFile
	if input.File != nil {
		fileText := extractPreviewText(input.File)
		fileText = sanitizeExtractedText(fileText)
		if fileText != "" {
			if extractedText != "" {
				extractedText += "\n\n"
			}
			extractedText += fileText
		}
		uploadedFile = input.File
	}
	if input.ExternalFile != nil && len(input.ExternalFile.Data) > 0 {
		externalPreview := input.ExternalFile.PreviewText
		if externalPreview == "" && strings.EqualFold(filepath.Ext(input.ExternalFile.FileName), ".pdf") {
			externalPreview = extractPDFTextFromBytes(input.ExternalFile.Data)
		}
		externalPreview = sanitizeExtractedText(externalPreview)
		if externalPreview != "" {
			if extractedText != "" {
				extractedText += "\n\n"
			}
			extractedText += externalPreview
		}
		externalFile = input.ExternalFile
	}

	if input.KnmpID == nil {
		detectedID, err := s.repo.DetectKNMPFromText(ctx, title+"\n"+extractedText, scopeForDetection(input))
		if err != nil {
			return nil, err
		}
		input.KnmpID = detectedID
	}

	if input.KnmpID != nil && !input.IsGlobal && len(input.UserKnmpIDs) > 0 {
		if !containsInt64(input.UserKnmpIDs, *input.KnmpID) {
			return nil, errors.New("titik KNMP tidak termasuk akses user")
		}
	}

	extractedTextReadable := isReadableExtractedText(extractedText)
	result, providerStatus, providerErr := s.analyzeWithProvider(ctx, provider, title, extractedText)
	if !extractedTextReadable {
		result = markUnreadableDocumentResult(result)
	}
	documentValid := input.KnmpID != nil && result.isKNMPRelated

	metadata := map[string]any{
		"engine":          result.engine,
		"model_provider":  provider,
		"provider_status": providerStatus,
		"document_type":   result.documentType,
		"is_knmp_related": result.isKNMPRelated,
		"document_valid":  documentValid,
		"text_readable":   extractedTextReadable,
		"validation_note": documentValidationNote(input.KnmpID, result.isKNMPRelated),
		"target_module":   result.targetModule,
		"draft_input":     result.draftInput,
		"extracted_facts": result.extractedFacts,
	}
	if providerErr != nil {
		metadata["provider_error"] = providerErr.Error()
	}
	for key, value := range input.Metadata {
		metadata[key] = value
	}
	metadataJSON, _ := json.Marshal(metadata)

	var inputTextPtr *string
	if strings.TrimSpace(input.InputText) != "" {
		value := strings.TrimSpace(input.InputText)
		inputTextPtr = &value
	}
	var extractedTextPtr *string
	if extractedText != "" {
		extractedTextPtr = &extractedText
	}
	metadataStr := string(metadataJSON)

	analysis := &domain.AIAnalysis{
		KnmpID:          input.KnmpID,
		AssignedUserID:  input.AssignedUserID,
		SubmittedBy:     input.SubmittedBy,
		SourceChannel:   channel,
		SourceSender:    input.SourceSender,
		ModelProvider:   provider,
		Title:           title,
		Summary:         result.summary,
		InputText:       inputTextPtr,
		ExtractedText:   extractedTextPtr,
		RiskLevel:       result.riskLevel,
		RiskScore:       result.riskScore,
		Status:          "perlu_review",
		Findings:        result.findings,
		Recommendations: result.recommendations,
		Metadata:        &metadataStr,
	}

	if err := s.repo.Create(ctx, analysis); err != nil {
		return nil, err
	}

	if uploadedFile != nil {
		relPath, fileName, fileType, err := s.storage.SaveUploadedFile(uploadedFile, "ai-analysis")
		if err == nil {
			doc = &domain.Document{
				DocumentableType: "ai_analysis",
				DocumentableID:   analysis.ID,
				FileName:         fileName,
				FilePath:         relPath,
				FileType:         &fileType,
				Category:         "scan_input",
				Version:          "1.0",
				Status:           "pending",
				UploadedBy:       input.SubmittedBy,
			}
		}
	}
	if externalFile != nil {
		relPath, fileName, fileType, err := s.storage.SaveFileBytes(externalFile.FileName, externalFile.ContentType, externalFile.Data, "ai-analysis")
		if err == nil {
			doc = &domain.Document{
				DocumentableType: "ai_analysis",
				DocumentableID:   analysis.ID,
				FileName:         fileName,
				FilePath:         relPath,
				FileType:         &fileType,
				Category:         "scan_input",
				Version:          "1.0",
				Status:           "pending",
				UploadedBy:       input.SubmittedBy,
			}
		}
	}
	if doc != nil {
		_ = s.docRepo.Create(ctx, doc)
	}

	return s.GetByID(ctx, analysis.ID)
}

func normalizeAIProvider(provider string) string {
	normalized := strings.ToLower(strings.TrimSpace(provider))
	normalized = strings.ReplaceAll(normalized, " ", "_")
	switch normalized {
	case "codex", "openai", "openai_codex":
		return "codex"
	case "deepseek":
		return "deepseek"
	case "gemini", "google", "google_gemini":
		return "gemini"
	case "claude", "anthropic", "anthropic_claude":
		return "claude"
	case "rule_based", "local", "":
		return "rule_based"
	default:
		return "rule_based"
	}
}

func (s *AIAnalysisService) UpdateStatus(ctx context.Context, id int64, status string) error {
	if status != "perlu_review" && status != "ditindaklanjuti" && status != "selesai" && status != "diabaikan" {
		return errors.New("status analisa tidak valid")
	}
	return s.repo.UpdateStatus(ctx, id, status)
}

func (s *AIAnalysisService) Delete(ctx context.Context, id int64) error {
	docs, _ := s.docRepo.ListByEntity(ctx, "ai_analysis", id)
	for _, doc := range docs {
		_ = s.docRepo.Delete(ctx, doc.ID)
	}
	return s.repo.Delete(ctx, id)
}

func (s *AIAnalysisService) GetStats(ctx context.Context, userKnmpIDs []int64) (*domain.AIAnalysisStats, error) {
	return s.repo.GetStats(ctx, userKnmpIDs)
}

func (s *AIAnalysisService) attachDocuments(ctx context.Context, item *domain.AIAnalysis) {
	docs, _ := s.docRepo.ListByEntity(ctx, "ai_analysis", item.ID)
	for _, doc := range docs {
		doc.FileURL = s.storage.GetFileURL(doc.FilePath)
	}
	item.Documents = docs
}

type anomalyResult struct {
	riskLevel       string
	riskScore       int
	engine          string
	documentType    string
	isKNMPRelated   bool
	summary         string
	findings        []string
	recommendations []string
	targetModule    string
	draftInput      map[string]any
	extractedFacts  []string
}

func (s *AIAnalysisService) analyzeWithProvider(ctx context.Context, provider, title, text string) (anomalyResult, string, error) {
	if provider == "rule_based" {
		result := analyzeAnomalies(text, title)
		result.engine = "rule_based_v1"
		return result, "local_rule_based", nil
	}

	apiKey := s.apiKeyForProvider(provider)
	if strings.TrimSpace(apiKey) == "" {
		result := analyzeAnomalies(text, title)
		result.engine = "rule_based_v1"
		return result, "fallback_rule_based_missing_api_key", nil
	}

	result, err := s.requestAIAnalysis(ctx, provider, apiKey, title, text)
	if err != nil {
		fallback := analyzeAnomalies(text, title)
		fallback.engine = "rule_based_v1"
		return fallback, "fallback_rule_based_provider_error", err
	}

	result.engine = provider + "_llm"
	return result, "ai_provider_success", nil
}

func (s *AIAnalysisService) apiKeyForProvider(provider string) string {
	switch provider {
	case "codex":
		return s.aiConfig.OpenAIAPIKey
	case "deepseek":
		return s.aiConfig.DeepSeekAPIKey
	case "gemini":
		return s.aiConfig.GeminiAPIKey
	case "claude":
		return s.aiConfig.ClaudeAPIKey
	default:
		return ""
	}
}

func (s *AIAnalysisService) requestAIAnalysis(ctx context.Context, provider, apiKey, title, text string) (anomalyResult, error) {
	prompt := buildAIAnalysisPrompt(title, text)
	switch provider {
	case "codex":
		return s.requestOpenAICompatible(ctx, "https://api.openai.com/v1/chat/completions", apiKey, s.aiConfig.OpenAIModel, prompt)
	case "deepseek":
		return s.requestOpenAICompatible(ctx, "https://api.deepseek.com/chat/completions", apiKey, s.aiConfig.DeepSeekModel, prompt)
	case "gemini":
		return s.requestGemini(ctx, apiKey, prompt)
	case "claude":
		return s.requestClaude(ctx, apiKey, prompt)
	default:
		return anomalyResult{}, errors.New("provider AI tidak dikenali")
	}
}

func buildAIAnalysisPrompt(title, text string) string {
	if strings.TrimSpace(text) == "" {
		text = "(Tidak ada teks hasil ekstraksi. Beri risiko dan rekomendasi review visual dokumen.)"
	}
	return fmt.Sprintf(`Anda adalah analis monitoring proyek KNMP.
Baca dokumen/laporan berikut, cari anomali proyek, lalu tulis ringkasan yang enak dibaca untuk PPK/Pengawas.

Wajib balas JSON valid tanpa markdown:
{
  "risk_level": "rendah|sedang|tinggi",
  "risk_score": 0-100,
  "document_type": "jenis dokumen yang terbaca, contoh laporan progress, notulen, issue K3, pembayaran, atau dokumen umum",
  "is_knmp_related": true/false,
  "summary": "3-6 kalimat Bahasa Indonesia yang merangkum keseluruhan isi file, bukan hanya risiko",
  "findings": ["temuan anomali atau hal penting"],
  "recommendations": ["tindak lanjut praktis"],
  "target_module": "laporan|pelaksanaan|issue|absensi|pembayaran|persiapan|dokumen_umum",
  "draft_input": {
    "nama": "judul/nama yang cocok untuk form",
    "tanggal": "YYYY-MM-DD jika ada",
    "jenis_laporan": "harian|mingguan|bulanan jika laporan",
    "cuaca": "jika ada",
    "jumlah_tenaga_kerja": 0,
    "rencana_progres_fisik": 0,
    "realisasi_progres_fisik": 0,
    "kategori_issue": "K3|mutu|cuaca|material|lainnya jika issue",
    "tingkat": "ringan|sedang|kritis|lainnya jika issue",
    "uraian_masalah": "jika issue",
    "keterangan": "narasi singkat untuk modul tujuan"
  },
  "extracted_facts": ["fakta penting yang terbaca dari file"]
}

Fokus pada:
- tentukan dulu dokumen ini dokumen apa dan apakah berkaitan dengan Program/Titik KNMP;
- jika tidak berkaitan dengan KNMP, isi is_knmp_related=false dan target_module=dokumen_umum;
- keterlambatan progres, deviasi rencana vs realisasi, over budget;
- isu K3, mutu rendah, pekerjaan tidak sesuai, dokumen kurang lengkap;
- ketidaksesuaian lokasi/titik KNMP, tanggal, foto, atau narasi;
- rekomendasi yang bisa langsung ditindaklanjuti.

Judul: %s

Isi dokumen:
%s`, title, limitText(text, 12000))
}

func (s *AIAnalysisService) requestOpenAICompatible(ctx context.Context, endpoint, apiKey, model, prompt string) (anomalyResult, error) {
	payload := map[string]any{
		"model":       model,
		"temperature": 0.2,
		"messages": []map[string]string{
			{"role": "system", "content": "Anda mengembalikan JSON valid saja."},
			{"role": "user", "content": prompt},
		},
	}
	var response struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := s.postJSON(ctx, endpoint, apiKey, payload, nil, &response); err != nil {
		return anomalyResult{}, err
	}
	if len(response.Choices) == 0 {
		return anomalyResult{}, errors.New("provider tidak mengembalikan pilihan jawaban")
	}
	return parseAIAnalysisJSON(response.Choices[0].Message.Content)
}

func (s *AIAnalysisService) requestGemini(ctx context.Context, apiKey, prompt string) (anomalyResult, error) {
	payload := map[string]any{
		"contents": []map[string]any{
			{"parts": []map[string]string{{"text": prompt}}},
		},
		"generationConfig": map[string]any{
			"temperature":      0.2,
			"responseMimeType": "application/json",
		},
	}
	var response struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	endpoint := "https://generativelanguage.googleapis.com/v1beta/models/" + s.aiConfig.GeminiModel + ":generateContent?key=" + apiKey
	if err := s.postJSON(ctx, endpoint, "", payload, nil, &response); err != nil {
		return anomalyResult{}, err
	}
	if len(response.Candidates) == 0 || len(response.Candidates[0].Content.Parts) == 0 {
		return anomalyResult{}, errors.New("gemini tidak mengembalikan teks analisa")
	}
	return parseAIAnalysisJSON(response.Candidates[0].Content.Parts[0].Text)
}

func (s *AIAnalysisService) requestClaude(ctx context.Context, apiKey, prompt string) (anomalyResult, error) {
	payload := map[string]any{
		"model":       s.aiConfig.ClaudeModel,
		"max_tokens":  1200,
		"temperature": 0.2,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
	}
	headers := map[string]string{
		"x-api-key":         apiKey,
		"anthropic-version": "2023-06-01",
	}
	var response struct {
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := s.postJSON(ctx, "https://api.anthropic.com/v1/messages", "", payload, headers, &response); err != nil {
		return anomalyResult{}, err
	}
	for _, part := range response.Content {
		if part.Text != "" {
			return parseAIAnalysisJSON(part.Text)
		}
	}
	return anomalyResult{}, errors.New("claude tidak mengembalikan teks analisa")
}

func (s *AIAnalysisService) postJSON(ctx context.Context, endpoint, bearerToken string, payload any, headers map[string]string, target any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if bearerToken != "" {
		req.Header.Set("Authorization", "Bearer "+bearerToken)
	}
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	resp, err := s.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 512*1024))
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("provider response %d: %s", resp.StatusCode, limitText(string(respBody), 300))
	}
	if err := json.Unmarshal(respBody, target); err != nil {
		return err
	}
	return nil
}

func parseAIAnalysisJSON(raw string) (anomalyResult, error) {
	raw = strings.TrimSpace(raw)
	raw = strings.TrimPrefix(raw, "```json")
	raw = strings.TrimPrefix(raw, "```")
	raw = strings.TrimSuffix(raw, "```")
	raw = strings.TrimSpace(raw)

	start := strings.Index(raw, "{")
	end := strings.LastIndex(raw, "}")
	if start >= 0 && end > start {
		raw = raw[start : end+1]
	}

	var payload struct {
		RiskLevel       string         `json:"risk_level"`
		RiskScore       int            `json:"risk_score"`
		DocumentType    string         `json:"document_type"`
		IsKNMPRelated   bool           `json:"is_knmp_related"`
		Summary         string         `json:"summary"`
		Findings        []string       `json:"findings"`
		Recommendations []string       `json:"recommendations"`
		TargetModule    string         `json:"target_module"`
		DraftInput      map[string]any `json:"draft_input"`
		ExtractedFacts  []string       `json:"extracted_facts"`
	}
	if err := json.Unmarshal([]byte(raw), &payload); err != nil {
		return anomalyResult{}, err
	}

	level := strings.ToLower(strings.TrimSpace(payload.RiskLevel))
	if level != "rendah" && level != "sedang" && level != "tinggi" {
		level = "sedang"
	}
	score := payload.RiskScore
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}
	if score == 0 {
		score = 40
	}

	findings := cleanNonEmptyStrings(payload.Findings)
	recommendations := cleanNonEmptyStrings(payload.Recommendations)
	if len(findings) == 0 {
		findings = []string{"AI tidak menemukan anomali spesifik, perlu review manual dokumen"}
	}
	if len(recommendations) == 0 {
		recommendations = []string{"Cocokkan hasil scan dengan laporan progres dan dokumentasi terbaru"}
	}
	summary := strings.TrimSpace(payload.Summary)
	if summary == "" {
		summary = buildAnalysisSummary(level, score, findings, recommendations)
	}

	return anomalyResult{
		riskLevel:       level,
		riskScore:       score,
		documentType:    cleanDocumentType(payload.DocumentType),
		isKNMPRelated:   payload.IsKNMPRelated,
		summary:         summary,
		findings:        findings,
		recommendations: recommendations,
		targetModule:    normalizeTargetModule(payload.TargetModule),
		draftInput:      cleanDraftInput(payload.DraftInput),
		extractedFacts:  cleanNonEmptyStrings(payload.ExtractedFacts),
	}, nil
}

func analyzeAnomalies(text, title string) anomalyResult {
	source := strings.ToLower(title + "\n" + text)
	score := 15
	findings := []string{}
	recommendations := []string{}

	riskWords := map[string]int{
		"kritis": 25, "terlambat": 20, "terhambat": 18, "kendala": 15,
		"retak": 20, "rusak": 20, "k3": 12, "kecelakaan": 35,
		"minus": 15, "deviasi": 15, "tidak sesuai": 25, "kurang": 12,
		"over budget": 30, "melebihi": 20, "belum": 10,
	}
	for word, weight := range riskWords {
		if strings.Contains(source, word) {
			score += weight
			findings = append(findings, fmt.Sprintf("Terdeteksi indikasi risiko: %s", word))
		}
	}

	if strings.TrimSpace(text) == "" {
		score += 20
		findings = append(findings, "Tidak ada teks/OCR yang bisa dianalisis dari input")
		recommendations = append(recommendations, "Tambahkan keterangan singkat atau gunakan dokumen/foto yang lebih jelas")
	}

	percentages := extractPercentages(source)
	if len(percentages) >= 2 {
		min, max := percentages[0], percentages[0]
		for _, p := range percentages {
			if p < min {
				min = p
			}
			if p > max {
				max = p
			}
		}
		if max-min >= 20 {
			score += 20
			findings = append(findings, fmt.Sprintf("Ada selisih persentase besar %.0f%% antara angka progres dalam dokumen", max-min))
			recommendations = append(recommendations, "Cocokkan ulang progres rencana, realisasi, dan bukti foto pada titik terkait")
		}
	}

	requiredSignals := []string{"tanggal", "lokasi", "progres"}
	for _, signal := range requiredSignals {
		if !strings.Contains(source, signal) {
			score += 8
			findings = append(findings, fmt.Sprintf("Informasi %s belum terlihat jelas pada input", signal))
		}
	}

	if len(findings) == 0 {
		findings = append(findings, "Tidak ditemukan anomali kuat berdasarkan aturan awal")
	}
	if len(recommendations) == 0 {
		recommendations = append(recommendations, "Lakukan review visual dokumen dan cocokkan dengan data laporan terakhir")
	}
	if score > 100 {
		score = 100
	}

	level := "rendah"
	if score >= 70 {
		level = "tinggi"
	} else if score >= 40 {
		level = "sedang"
	}

	return anomalyResult{
		riskLevel:       level,
		riskScore:       score,
		engine:          "rule_based_v1",
		documentType:    inferDocumentType(source),
		isKNMPRelated:   isLikelyKNMPRelated(source),
		summary:         buildDocumentSummary(level, score, text, findings, recommendations),
		findings:        dedupeStrings(findings),
		recommendations: dedupeStrings(recommendations),
		targetModule:    inferTargetModule(source),
		draftInput:      inferDraftInput(source, title),
		extractedFacts:  inferExtractedFacts(source),
	}
}

func buildAnalysisSummary(level string, score int, findings []string, recommendations []string) string {
	summary := fmt.Sprintf("Analisa menunjukkan risiko %s dengan skor %d/100.", level, score)
	if len(findings) > 0 {
		summary += " Temuan utama: " + findings[0] + "."
	}
	if len(recommendations) > 0 {
		summary += " Rekomendasi awal: " + recommendations[0] + "."
	}
	return summary
}

func buildDocumentSummary(level string, score int, text string, findings []string, recommendations []string) string {
	summary := fmt.Sprintf("Dokumen sudah dibaca dan dikategorikan sebagai risiko %s dengan skor %d/100.", level, score)
	if isReadableExtractedText(text) {
		snippet := strings.Join(strings.Fields(text), " ")
		summary += " Isi utama dokumen: " + limitText(snippet, 280)
	} else if strings.TrimSpace(text) != "" {
		summary += " Teks dokumen tidak dapat dibaca dengan baik karena hasil ekstraksi PDF tidak valid atau dokumen berupa scan gambar tanpa OCR."
	}
	if len(findings) > 0 {
		summary += " Temuan utama: " + findings[0] + "."
	}
	if len(recommendations) > 0 {
		summary += " Tindak lanjut awal: " + recommendations[0] + "."
	}
	return summary
}

func markUnreadableDocumentResult(result anomalyResult) anomalyResult {
	result.documentType = "Dokumen tidak terbaca"
	result.isKNMPRelated = false
	result.targetModule = "dokumen_umum"
	result.summary = "Dokumen berhasil diterima, tetapi teks di dalam file tidak dapat dibaca dengan baik. Kemungkinan PDF memakai encoding tertanam, hasil scan gambar, atau file korup sehingga AI tidak bisa membuat summary isi dokumen secara akurat. Silakan unggah PDF dengan text layer yang dapat diseleksi atau file hasil OCR agar sistem bisa mencocokkan titik KNMP dan mengisi draft modul."
	result.findings = []string{
		"Teks hasil ekstraksi dokumen tidak terbaca atau berisi karakter acak",
		"Titik KNMP belum bisa dicocokkan dari isi dokumen",
	}
	result.recommendations = []string{
		"Unggah ulang dokumen dalam format PDF searchable atau hasil OCR",
		"Tambahkan caption berisi nama titik KNMP, tanggal, progres, dan keterangan utama",
	}
	result.draftInput = map[string]any{
		"keterangan": "Dokumen tidak dapat dibaca otomatis. Perlu unggah ulang dokumen searchable/OCR atau lengkapi caption.",
	}
	result.extractedFacts = []string{"Teks dokumen tidak terbaca otomatis"}
	return result
}

func normalizeTargetModule(module string) string {
	module = strings.ToLower(strings.TrimSpace(module))
	switch module {
	case "laporan", "pelaksanaan", "issue", "absensi", "pembayaran", "persiapan", "dokumen_umum":
		return module
	default:
		return "dokumen_umum"
	}
}

func cleanDocumentType(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "Dokumen umum"
	}
	return value
}

func documentValidationNote(knmpID *int64, isKNMPRelated bool) string {
	if !isKNMPRelated {
		return "Dokumen dianalisis, tetapi AI menilai dokumen tidak berkaitan dengan KNMP."
	}
	if knmpID == nil {
		return "Dokumen dianalisis, tetapi tidak ditemukan titik KNMP aktif yang cocok dari isi dokumen."
	}
	return "Dokumen valid dan cocok dengan titik KNMP."
}

func isLikelyKNMPRelated(source string) bool {
	keywords := []string{
		"knmp", "kampung nelayan", "nelayan merah putih", "ppk", "pengawas",
		"pelaksanaan konstruksi", "progres fisik", "realisasi fisik", "k3",
		"kontraktor", "spmk", "pcm", "termin",
	}
	for _, keyword := range keywords {
		if strings.Contains(source, keyword) {
			return true
		}
	}
	return false
}

func inferDocumentType(source string) string {
	switch inferTargetModule(source) {
	case "laporan":
		return "Laporan progress/pelaksanaan"
	case "issue":
		return "Laporan kendala atau K3"
	case "absensi":
		return "Dokumen absensi tenaga kerja"
	case "pembayaran":
		return "Dokumen pembayaran atau termin"
	case "persiapan":
		return "Dokumen persiapan proyek"
	default:
		if isLikelyKNMPRelated(source) {
			return "Dokumen KNMP umum"
		}
		return "Dokumen umum"
	}
}

func cleanDraftInput(input map[string]any) map[string]any {
	if len(input) == 0 {
		return map[string]any{}
	}
	cleaned := map[string]any{}
	for key, value := range input {
		key = strings.ToLower(strings.TrimSpace(key))
		if key == "" || value == nil {
			continue
		}
		switch typed := value.(type) {
		case string:
			if strings.TrimSpace(typed) != "" {
				cleaned[key] = strings.TrimSpace(typed)
			}
		default:
			cleaned[key] = value
		}
	}
	return cleaned
}

func inferTargetModule(source string) string {
	switch {
	case strings.Contains(source, "kendala") || strings.Contains(source, "masalah") || strings.Contains(source, "kritis") || strings.Contains(source, "k3"):
		return "issue"
	case strings.Contains(source, "laporan") || strings.Contains(source, "progres") || strings.Contains(source, "realisasi"):
		return "laporan"
	case strings.Contains(source, "absensi") || strings.Contains(source, "hadir") || strings.Contains(source, "pulang"):
		return "absensi"
	case strings.Contains(source, "termin") || strings.Contains(source, "pembayaran") || strings.Contains(source, "anggaran"):
		return "pembayaran"
	case strings.Contains(source, "spmk") || strings.Contains(source, "pcm") || strings.Contains(source, "mobilisasi"):
		return "persiapan"
	default:
		return "dokumen_umum"
	}
}

func inferDraftInput(source, title string) map[string]any {
	keterangan := "Belum ada keterangan terstruktur yang terbaca dari dokumen."
	if isReadableExtractedText(source) {
		keterangan = limitText(strings.Join(strings.Fields(source), " "), 500)
	}
	draft := map[string]any{
		"nama":       strings.TrimSpace(title),
		"keterangan": keterangan,
	}
	if date := extractISODate(source); date != "" {
		draft["tanggal"] = date
	}
	percentages := extractPercentages(source)
	if len(percentages) > 0 {
		draft["realisasi_progres_fisik"] = percentages[len(percentages)-1]
	}
	if len(percentages) > 1 {
		draft["rencana_progres_fisik"] = percentages[0]
	}
	if workers := extractWorkerCount(source); workers > 0 {
		draft["jumlah_tenaga_kerja"] = workers
	}
	if strings.Contains(source, "mingguan") {
		draft["jenis_laporan"] = "mingguan"
	} else if strings.Contains(source, "bulanan") {
		draft["jenis_laporan"] = "bulanan"
	} else if strings.Contains(source, "harian") {
		draft["jenis_laporan"] = "harian"
	}
	if strings.Contains(source, "cerah") {
		draft["cuaca"] = "Cerah"
	} else if strings.Contains(source, "hujan") {
		draft["cuaca"] = "Hujan"
	} else if strings.Contains(source, "berawan") {
		draft["cuaca"] = "Berawan"
	}
	if inferTargetModule(source) == "issue" {
		draft["kategori_issue"] = inferIssueCategory(source)
		draft["tingkat"] = inferIssueLevel(source)
		draft["uraian_masalah"] = limitText(strings.Join(strings.Fields(source), " "), 350)
	}
	return draft
}

func inferExtractedFacts(source string) []string {
	facts := []string{}
	if date := extractISODate(source); date != "" {
		facts = append(facts, "Tanggal terdeteksi: "+date)
	}
	for _, p := range extractPercentages(source) {
		facts = append(facts, fmt.Sprintf("Persentase terdeteksi: %.2f%%", p))
	}
	if workers := extractWorkerCount(source); workers > 0 {
		facts = append(facts, fmt.Sprintf("Jumlah tenaga kerja terdeteksi: %d orang", workers))
	}
	return facts
}

func inferIssueCategory(source string) string {
	switch {
	case strings.Contains(source, "k3") || strings.Contains(source, "kecelakaan") || strings.Contains(source, "apd"):
		return "K3"
	case strings.Contains(source, "mutu") || strings.Contains(source, "retak") || strings.Contains(source, "rusak"):
		return "mutu"
	case strings.Contains(source, "cuaca") || strings.Contains(source, "hujan"):
		return "cuaca"
	case strings.Contains(source, "material") || strings.Contains(source, "bahan"):
		return "material"
	default:
		return "lainnya"
	}
}

func inferIssueLevel(source string) string {
	switch {
	case strings.Contains(source, "kritis") || strings.Contains(source, "kecelakaan"):
		return "kritis"
	case strings.Contains(source, "sedang") || strings.Contains(source, "terlambat"):
		return "sedang"
	case strings.Contains(source, "ringan"):
		return "ringan"
	default:
		return "lainnya"
	}
}

func extractISODate(source string) string {
	patterns := []string{
		`(\d{4})-(\d{2})-(\d{2})`,
		`(\d{1,2})[/-](\d{1,2})[/-](\d{4})`,
	}
	for _, pattern := range patterns {
		match := regexp.MustCompile(pattern).FindStringSubmatch(source)
		if len(match) == 4 {
			if len(match[1]) == 4 {
				return fmt.Sprintf("%s-%s-%s", match[1], match[2], match[3])
			}
			day, _ := strconv.Atoi(match[1])
			month, _ := strconv.Atoi(match[2])
			return fmt.Sprintf("%s-%02d-%02d", match[3], month, day)
		}
	}
	return ""
}

func extractWorkerCount(source string) int {
	match := regexp.MustCompile(`(?i)(\d+)\s*(orang|org|pekerja|tenaga kerja)`).FindStringSubmatch(source)
	if len(match) < 2 {
		return 0
	}
	var value int
	_, _ = fmt.Sscanf(match[1], "%d", &value)
	return value
}

func scopeForDetection(input AIAnalysisInput) []int64 {
	if input.IsGlobal {
		return nil
	}
	return input.UserKnmpIDs
}

func extractPreviewText(file *multipart.FileHeader) string {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext == ".pdf" {
		text := extractPDFTextFromMultipart(file)
		if strings.TrimSpace(text) != "" {
			return text
		}
		return fmt.Sprintf("File %s diterima. PDF tidak memiliki text layer yang bisa dibaca otomatis.", file.Filename)
	}
	if ext != ".txt" && ext != ".csv" && ext != ".md" {
		return fmt.Sprintf("File %s diterima. OCR penuh belum aktif untuk tipe %s.", file.Filename, ext)
	}

	f, err := file.Open()
	if err != nil {
		return ""
	}
	defer f.Close()

	limited, err := io.ReadAll(io.LimitReader(f, 64*1024))
	if err != nil {
		return ""
	}
	return string(limited)
}

func extractPDFTextFromMultipart(file *multipart.FileHeader) string {
	f, err := file.Open()
	if err != nil {
		return ""
	}
	defer f.Close()

	reader, err := pdfreader.NewReader(f, file.Size)
	if err != nil {
		return ""
	}
	plain, err := reader.GetPlainText()
	if err != nil {
		return ""
	}
	data, err := io.ReadAll(io.LimitReader(plain, 128*1024))
	if err != nil {
		return ""
	}
	return string(data)
}

func extractPDFTextFromBytes(data []byte) string {
	reader, err := pdfreader.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return ""
	}
	plain, err := reader.GetPlainText()
	if err != nil {
		return ""
	}
	text, err := io.ReadAll(io.LimitReader(plain, 128*1024))
	if err != nil {
		return ""
	}
	return string(text)
}

func sanitizeExtractedText(text string) string {
	text = strings.TrimSpace(text)
	if text == "" {
		return ""
	}
	if !isReadableExtractedText(text) {
		return "Teks dokumen tidak dapat dibaca otomatis. PDF kemungkinan berupa scan gambar, memakai encoding yang tidak terbaca, atau file korup."
	}
	return text
}

func isReadableExtractedText(text string) bool {
	text = strings.TrimSpace(text)
	if text == "" {
		return false
	}
	runes := []rune(text)
	if len(runes) < 20 {
		return true
	}
	readable := 0
	weird := 0
	letters := 0
	for _, r := range runes {
		switch {
		case r == '\n' || r == '\r' || r == '\t' || r == ' ':
			readable++
		case r < 32:
			return false
		case r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9':
			readable++
			if r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' {
				letters++
			}
		case strings.ContainsRune(".,;:/()%+-_@#&[]{}'\"?!", r):
			readable++
		default:
			weird++
		}
	}
	total := readable + weird
	if total == 0 {
		return false
	}
	readableRatio := float64(readable) / float64(total)
	letterRatio := float64(letters) / float64(total)
	return readableRatio >= 0.72 && letterRatio >= 0.18
}

func extractPercentages(text string) []float64 {
	matches := regexp.MustCompile(`([0-9]+(?:[.,][0-9]+)?)\s*%`).FindAllStringSubmatch(text, -1)
	values := make([]float64, 0, len(matches))
	for _, match := range matches {
		raw := strings.ReplaceAll(match[1], ",", ".")
		var value float64
		if _, err := fmt.Sscanf(raw, "%f", &value); err == nil {
			values = append(values, value)
		}
	}
	return values
}

func dedupeStrings(values []string) []string {
	seen := map[string]bool{}
	result := []string{}
	for _, value := range values {
		if !seen[value] {
			seen[value] = true
			result = append(result, value)
		}
	}
	return result
}

func cleanNonEmptyStrings(values []string) []string {
	result := []string{}
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			result = append(result, value)
		}
	}
	return dedupeStrings(result)
}

func limitText(value string, maxRunes int) string {
	runes := []rune(value)
	if len(runes) <= maxRunes {
		return value
	}
	return string(runes[:maxRunes]) + "\n\n[teks dipotong otomatis untuk batas analisa]"
}

func containsInt64(values []int64, target int64) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}
