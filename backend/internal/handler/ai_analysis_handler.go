package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"knmp-v2-backend/internal/middleware"
	"knmp-v2-backend/internal/repository"
	"knmp-v2-backend/internal/service"
)

type AIAnalysisHandler struct {
	svc                   *service.AIAnalysisService
	telegramBotToken      string
	telegramWebhookSecret string
}

func NewAIAnalysisHandler(svc *service.AIAnalysisService, telegramBotToken, telegramWebhookSecret string) *AIAnalysisHandler {
	return &AIAnalysisHandler{svc: svc, telegramBotToken: telegramBotToken, telegramWebhookSecret: telegramWebhookSecret}
}

func (h *AIAnalysisHandler) List(c *fiber.Ctx) error {
	filter := repository.AIAnalysisFilter{
		Search:        c.Query("search"),
		SourceChannel: strings.ToLower(c.Query("source_channel")),
		RiskLevel:     strings.ToLower(c.Query("risk_level")),
		Status:        c.Query("status"),
	}
	if knmpID, err := strconv.ParseInt(c.Query("knmp_id"), 10, 64); err == nil && knmpID > 0 {
		filter.KnmpID = &knmpID
	}
	if userID, err := strconv.ParseInt(c.Query("assigned_user_id"), 10, 64); err == nil && userID > 0 {
		filter.AssignedUserID = &userID
	}

	if !isSuperAdmin(c) {
		if userKnmpIDs, ok := c.Locals(middleware.CtxUserKnmpIDsKey).([]int64); ok && len(userKnmpIDs) > 0 {
			filter.UserKnmpIDs = userKnmpIDs
		} else {
			filter.UserKnmpIDs = []int64{-1}
		}
	}

	items, err := h.svc.List(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(items))
}

func (h *AIAnalysisHandler) Stats(c *fiber.Ctx) error {
	var scoped []int64
	if !isSuperAdmin(c) {
		if ids, ok := c.Locals(middleware.CtxUserKnmpIDsKey).([]int64); ok && len(ids) > 0 {
			scoped = ids
		} else {
			scoped = []int64{-1}
		}
	}
	stats, err := h.svc.GetStats(c.Context(), scoped)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(stats))
}

func (h *AIAnalysisHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}
	item, err := h.svc.GetByID(c.Context(), id)
	if err != nil || item == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Analisa tidak ditemukan"))
	}
	if !isSuperAdmin(c) && item.KnmpID != nil {
		userKnmpIDs, _ := c.Locals(middleware.CtxUserKnmpIDsKey).([]int64)
		if !containsID(userKnmpIDs, *item.KnmpID) {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse("Tidak punya akses ke titik KNMP ini"))
		}
	}
	return c.JSON(OKResponse(item))
}

func (h *AIAnalysisHandler) Create(c *fiber.Ctx) error {
	knmpID := parseOptionalInt64(c.FormValue("knmp_id"))
	assignedUserID := parseOptionalInt64(c.FormValue("assigned_user_id"))
	inputText := c.FormValue("input_text")
	title := c.FormValue("title")
	channel := c.FormValue("source_channel")
	if channel == "" {
		channel = "web"
	}
	file, _ := c.FormFile("file")

	if strings.TrimSpace(inputText) == "" && file == nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Input teks atau file wajib diisi"))
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	userKnmpIDs, _ := c.Locals(middleware.CtxUserKnmpIDsKey).([]int64)
	item, err := h.svc.Analyze(c.Context(), service.AIAnalysisInput{
		KnmpID:         knmpID,
		AssignedUserID: assignedUserID,
		SubmittedBy:    &userID,
		SourceChannel:  channel,
		ModelProvider:  c.FormValue("model_provider"),
		Title:          title,
		InputText:      inputText,
		File:           file,
		UserKnmpIDs:    userKnmpIDs,
		IsGlobal:       isSuperAdmin(c),
		Metadata: map[string]any{
			"entrypoint": "web",
		},
	})
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(item))
}

func (h *AIAnalysisHandler) UpdateStatus(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}
	var req struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&req); err != nil || req.Status == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Status wajib diisi"))
	}
	if err := h.svc.UpdateStatus(c.Context(), id, req.Status); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}
	item, _ := h.svc.GetByID(c.Context(), id)
	return c.JSON(OKResponse(item))
}

func (h *AIAnalysisHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}
	if err := h.svc.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(fiber.Map{"message": "Analisa berhasil dihapus"}))
}

func (h *AIAnalysisHandler) TelegramWebhook(c *fiber.Ctx) error {
	if h.telegramWebhookSecret != "" && c.Get("X-Telegram-Bot-Api-Secret-Token") != h.telegramWebhookSecret {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	var update struct {
		Message *struct {
			Text string `json:"text"`
			From *struct {
				ID        int64  `json:"id"`
				Username  string `json:"username"`
				FirstName string `json:"first_name"`
			} `json:"from"`
			Caption  string `json:"caption"`
			Document *struct {
				FileName string `json:"file_name"`
				FileID   string `json:"file_id"`
			} `json:"document"`
			Photo []struct {
				FileID string `json:"file_id"`
			} `json:"photo"`
		} `json:"message"`
	}
	if err := c.BodyParser(&update); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload Telegram tidak valid"))
	}
	if update.Message == nil {
		return c.JSON(OKResponse(fiber.Map{"message": "ignored"}))
	}

	text := strings.TrimSpace(update.Message.Text)
	if text == "" {
		text = strings.TrimSpace(update.Message.Caption)
	}
	title := "Input Telegram"
	var externalFile *service.AIAnalysisExternalFile
	if update.Message.Document != nil && update.Message.Document.FileName != "" {
		title = "Dokumen Telegram - " + update.Message.Document.FileName
		externalFile = h.downloadTelegramFile(update.Message.Document.FileID, update.Message.Document.FileName, "")
	} else if len(update.Message.Photo) > 0 {
		title = "Foto Telegram"
		externalFile = h.downloadTelegramFile(update.Message.Photo[len(update.Message.Photo)-1].FileID, "telegram-photo.jpg", "image/jpeg")
	}
	sender := "telegram"
	if update.Message.From != nil {
		name := strings.TrimSpace(update.Message.From.Username)
		if name == "" {
			name = strings.TrimSpace(update.Message.From.FirstName)
		}
		if name != "" {
			sender = name
		}
	}

	item, err := h.svc.Analyze(c.Context(), service.AIAnalysisInput{
		SourceChannel: "telegram",
		SourceSender:  &sender,
		ModelProvider: "rule_based",
		Title:         title,
		InputText:     text,
		ExternalFile:  externalFile,
		IsGlobal:      true,
		Metadata: map[string]any{
			"entrypoint": "telegram_webhook",
		},
	})
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(item))
}

func parseOptionalInt64(value string) *int64 {
	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil || id <= 0 {
		return nil
	}
	return &id
}

func containsID(values []int64, target int64) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

func isSuperAdmin(c *fiber.Ctx) bool {
	roles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
	for _, role := range roles {
		normalized := strings.ToLower(strings.ReplaceAll(role, " ", "_"))
		if normalized == "superadmin" || normalized == "super_admin" {
			return true
		}
	}
	return false
}

func (h *AIAnalysisHandler) downloadTelegramFile(fileID, fallbackName, contentType string) *service.AIAnalysisExternalFile {
	if h.telegramBotToken == "" || fileID == "" {
		return nil
	}

	infoURL := fmt.Sprintf("https://api.telegram.org/bot%s/getFile?file_id=%s", h.telegramBotToken, url.QueryEscape(fileID))
	resp, err := http.Get(infoURL)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil
	}

	var payload struct {
		OK     bool `json:"ok"`
		Result struct {
			FilePath string `json:"file_path"`
		} `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil || !payload.OK || payload.Result.FilePath == "" {
		return nil
	}

	downloadURL := fmt.Sprintf("https://api.telegram.org/file/bot%s/%s", h.telegramBotToken, payload.Result.FilePath)
	fileResp, err := http.Get(downloadURL)
	if err != nil {
		return nil
	}
	defer fileResp.Body.Close()
	if fileResp.StatusCode < 200 || fileResp.StatusCode >= 300 {
		return nil
	}

	data, err := io.ReadAll(io.LimitReader(fileResp.Body, 20*1024*1024))
	if err != nil || len(data) == 0 {
		return nil
	}

	fileName := fallbackName
	if fileName == "" {
		fileName = filepath.Base(payload.Result.FilePath)
	}
	ext := filepath.Ext(fileName)
	preview := fmt.Sprintf("File Telegram %s berhasil diterima. OCR penuh belum aktif untuk tipe %s.", fileName, ext)
	if strings.EqualFold(ext, ".pdf") {
		preview = ""
	}
	if strings.EqualFold(ext, ".txt") || strings.EqualFold(ext, ".csv") || strings.EqualFold(ext, ".md") {
		preview = string(data)
	}

	return &service.AIAnalysisExternalFile{
		FileName:    fileName,
		ContentType: contentType,
		Data:        data,
		PreviewText: preview,
	}
}
