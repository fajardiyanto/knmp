package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"knmp-v2-backend/internal/middleware"
	"knmp-v2-backend/internal/service"
)

type DocumentHandler struct {
	docSvc *service.DocumentService
}

func NewDocumentHandler(docSvc *service.DocumentService) *DocumentHandler {
	return &DocumentHandler{docSvc: docSvc}
}

func (h *DocumentHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	doc, err := h.docSvc.GetByID(c.Context(), id)
	if err != nil || doc == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Dokumen tidak ditemukan"))
	}
	return c.JSON(OKResponse(doc))
}

func (h *DocumentHandler) Download(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	doc, err := h.docSvc.GetByID(c.Context(), id)
	if err != nil || doc == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Dokumen tidak ditemukan"))
	}

	filePath := h.docSvc.GetFilePath(doc.FilePath)
	return c.Download(filePath, doc.FileName)
}

func (h *DocumentHandler) Stream(c *fiber.Ctx) error {
	reqPath := c.Query("path")
	if reqPath == "" {
		return c.Status(fiber.StatusBadRequest).SendString("Path is required")
	}

	fullPath := h.docSvc.GetFilePath(reqPath)
	return c.SendFile(fullPath)
}

func (h *DocumentHandler) Upload(c *fiber.Ctx) error {
	docType := c.FormValue("documentable_type")
	docID, _ := strconv.ParseInt(c.FormValue("documentable_id"), 10, 64)
	category := c.FormValue("category")

	if docType == "" || docID == 0 || category == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("documentable_type, documentable_id, dan category wajib diisi"))
	}

	file, err := c.FormFile("file")
	if err != nil || file == nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("File wajib diunggah"))
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	doc, err := h.docSvc.UploadDocument(c.Context(), docType, docID, category, userID, file)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(doc))
}

func (h *DocumentHandler) Verify(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	var req VerifyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	var notePtr *string
	if req.Note != "" {
		notePtr = &req.Note
	}

	if err := h.docSvc.Verify(c.Context(), id, req.Status, notePtr, userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(fiber.Map{"message": "Status dokumen berhasil diverifikasi"}))
}

func (h *DocumentHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	if err := h.docSvc.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(fiber.Map{"message": "Dokumen berhasil dihapus"}))
}
