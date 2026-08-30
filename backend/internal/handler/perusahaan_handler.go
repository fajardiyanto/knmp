package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/service"
)

type PerusahaanHandler struct {
	svc *service.PerusahaanService
}

func NewPerusahaanHandler(svc *service.PerusahaanService) *PerusahaanHandler {
	return &PerusahaanHandler{svc: svc}
}

func (h *PerusahaanHandler) List(c *fiber.Ctx) error {
	search := c.Query("search")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "50"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * perPage

	list, total, err := h.svc.List(c.Context(), search, perPage, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    list,
		"meta": fiber.Map{
			"total":    total,
			"page":     page,
			"per_page": perPage,
		},
	})
}

func (h *PerusahaanHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	p, err := h.svc.GetByID(c.Context(), id)
	if err != nil || p == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Perusahaan tidak ditemukan"))
	}

	return c.JSON(OKResponse(p))
}

func (h *PerusahaanHandler) GetByNama(c *fiber.Ctx) error {
	nama := c.Query("nama")
	if nama == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Parameter nama diperlukan"))
	}

	p, err := h.svc.GetByNama(c.Context(), nama)
	if err != nil || p == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Perusahaan tidak ditemukan"))
	}

	return c.JSON(OKResponse(p))
}

func (h *PerusahaanHandler) Create(c *fiber.Ctx) error {
	var p domain.Perusahaan
	if err := c.BodyParser(&p); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}

	if err := h.svc.Create(c.Context(), &p); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}

	return c.Status(fiber.StatusCreated).JSON(OKResponse(p))
}

func (h *PerusahaanHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	var p domain.Perusahaan
	if err := c.BodyParser(&p); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	p.ID = id

	if err := h.svc.Update(c.Context(), &p); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}

	return c.JSON(OKResponse(p))
}

func (h *PerusahaanHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	if err := h.svc.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}

	return c.JSON(OKResponse("Perusahaan berhasil dihapus"))
}
