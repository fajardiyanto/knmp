package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/middleware"
	"knmp-v2-backend/internal/service"
	"knmp-v2-backend/pkg/validator"
)

type PersiapanHandler struct {
	persiapanSvc *service.PersiapanService
}

func NewPersiapanHandler(persiapanSvc *service.PersiapanService) *PersiapanHandler {
	return &PersiapanHandler{persiapanSvc: persiapanSvc}
}

func (h *PersiapanHandler) List(c *fiber.Ctx) error {
	jenis := c.Query("jenis")
	var knmpID *int64
	if id, err := strconv.ParseInt(c.Query("knmp_id"), 10, 64); err == nil {
		knmpID = &id
	} else {
		userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
		isGlobal := false
		for _, r := range userRoles {
			if r == "superadmin" || r == "admin_ppk" || r == "ppk" {
				isGlobal = true
				break
			}
		}
		if !isGlobal {
			if userKnmpIDs, ok := c.Locals(middleware.CtxUserKnmpIDsKey).([]int64); ok && len(userKnmpIDs) > 0 {
				knmpID = &userKnmpIDs[0]
			}
		}
	}

	list, err := h.persiapanSvc.List(c.Context(), jenis, knmpID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(list))
}

func (h *PersiapanHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	p, err := h.persiapanSvc.GetByID(c.Context(), id)
	if err != nil || p == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Persiapan tidak ditemukan"))
	}
	return c.JSON(OKResponse(p))
}

type CreatePersiapanRequest struct {
	KnmpID     *int64  `json:"knmp_id"`
	Nama       string  `json:"nama" validate:"required"`
	Tanggal    string  `json:"tanggal" validate:"required"`
	Jenis      string  `json:"jenis" validate:"required"` // 'kontrak' | 'lapangan'
	Keterangan *string `json:"keterangan"`
	Status     *string `json:"status"`
}

func (h *PersiapanHandler) Create(c *fiber.Ctx) error {
	var req CreatePersiapanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	if err := validator.Validate(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(ValidationErrorResponse("Validasi gagal", err.Error()))
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	p := &domain.Persiapan{
		KnmpID:     req.KnmpID,
		UserID:     &userID,
		Nama:       req.Nama,
		Tanggal:    req.Tanggal,
		Jenis:      req.Jenis,
		Keterangan: req.Keterangan,
		Status:     req.Status,
		CreatedBy:  &userID,
	}

	if err := h.persiapanSvc.Create(c.Context(), p); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(p))
}

func (h *PersiapanHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	var req CreatePersiapanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	p := &domain.Persiapan{
		ID:         id,
		KnmpID:     req.KnmpID,
		UserID:     &userID,
		Nama:       req.Nama,
		Tanggal:    req.Tanggal,
		Jenis:      req.Jenis,
		Keterangan: req.Keterangan,
		Status:     req.Status,
		UpdatedBy:  &userID,
	}

	if err := h.persiapanSvc.Update(c.Context(), p); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(p))
}

func (h *PersiapanHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	if err := h.persiapanSvc.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(fiber.Map{"message": "Persiapan berhasil dihapus"}))
}

func (h *PersiapanHandler) ListPCM(c *fiber.Ctx) error {
	var kontrakID *int64
	if id, err := strconv.ParseInt(c.Query("kontrak_id"), 10, 64); err == nil {
		kontrakID = &id
	}

	list, err := h.persiapanSvc.ListPCM(c.Context(), kontrakID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(list))
}

func (h *PersiapanHandler) GetPCM(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	pcm, err := h.persiapanSvc.GetPCM(c.Context(), id)
	if err != nil || pcm == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Data PCM belum ada"))
	}
	return c.JSON(OKResponse(pcm))
}

func (h *PersiapanHandler) GetPCMByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	pcm, err := h.persiapanSvc.GetPCMByID(c.Context(), id)
	if err != nil || pcm == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Data PCM tidak ditemukan"))
	}
	return c.JSON(OKResponse(pcm))
}

type SavePCMRequest struct {
	ID                 *int64  `json:"id"`
	PersiapanKontrakID int64   `json:"persiapan_kontrak_id" validate:"required"`
	Nama               string  `json:"nama" validate:"required"`
	Tanggal            string  `json:"tanggal" validate:"required"`
	Keterangan         *string `json:"keterangan"`
}

func (h *PersiapanHandler) SavePCM(c *fiber.Ctx) error {
	var req SavePCMRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	if err := validator.Validate(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(ValidationErrorResponse("Validasi gagal", err.Error()))
	}

	pcm := &domain.PCM{
		PersiapanKontrakID: req.PersiapanKontrakID,
		Nama:               req.Nama,
		Tanggal:            req.Tanggal,
		Keterangan:         req.Keterangan,
	}
	if req.ID != nil {
		pcm.ID = *req.ID
	}

	if err := h.persiapanSvc.CreateOrUpdatePCM(c.Context(), pcm); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(pcm))
}

func (h *PersiapanHandler) DeletePCM(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	if err := h.persiapanSvc.DeletePCM(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(fiber.Map{"message": "Data PCM berhasil dihapus"}))
}

// --- PELAKSANAAN HANDLER ---

type PelaksanaanHandler struct {
	pelaksanaanSvc *service.PelaksanaanService
}

func NewPelaksanaanHandler(pelaksanaanSvc *service.PelaksanaanService) *PelaksanaanHandler {
	return &PelaksanaanHandler{pelaksanaanSvc: pelaksanaanSvc}
}

func (h *PelaksanaanHandler) List(c *fiber.Ctx) error {
	var knmpID *int64
	if id, err := strconv.ParseInt(c.Query("knmp_id"), 10, 64); err == nil {
		knmpID = &id
	} else {
		userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
		isGlobal := false
		for _, r := range userRoles {
			if r == "superadmin" || r == "admin_ppk" || r == "ppk" {
				isGlobal = true
				break
			}
		}
		if !isGlobal {
			if userKnmpIDs, ok := c.Locals(middleware.CtxUserKnmpIDsKey).([]int64); ok && len(userKnmpIDs) > 0 {
				knmpID = &userKnmpIDs[0]
			}
		}
	}

	list, err := h.pelaksanaanSvc.List(c.Context(), knmpID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(list))
}

func (h *PelaksanaanHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	p, err := h.pelaksanaanSvc.GetByID(c.Context(), id)
	if err != nil || p == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Pelaksanaan tidak ditemukan"))
	}
	return c.JSON(OKResponse(p))
}

type CreatePelaksanaanRequest struct {
	KnmpID       *int64  `json:"knmp_id"`
	Nama         string  `json:"nama" validate:"required"`
	Tanggal      string  `json:"tanggal" validate:"required"`
	JenisLaporan *string `json:"jenis_laporan"`
	StatusK3     *string `json:"status_k3"`
	Kendala      *string `json:"kendala"`
	Keterangan   *string `json:"keterangan"`
}

func (h *PelaksanaanHandler) Create(c *fiber.Ctx) error {
	var req CreatePelaksanaanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	if err := validator.Validate(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(ValidationErrorResponse("Validasi gagal", err.Error()))
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	p := &domain.Pelaksanaan{
		KnmpID:       req.KnmpID,
		UserID:       &userID,
		Nama:         req.Nama,
		Tanggal:      req.Tanggal,
		JenisLaporan: req.JenisLaporan,
		StatusK3:     req.StatusK3,
		Kendala:      req.Kendala,
		Keterangan:   req.Keterangan,
		CreatedBy:    &userID,
	}

	if err := h.pelaksanaanSvc.Create(c.Context(), p); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(p))
}

func (h *PelaksanaanHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	var req CreatePelaksanaanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	p := &domain.Pelaksanaan{
		ID:           id,
		KnmpID:       req.KnmpID,
		UserID:       &userID,
		Nama:         req.Nama,
		Tanggal:      req.Tanggal,
		JenisLaporan: req.JenisLaporan,
		StatusK3:     req.StatusK3,
		Kendala:      req.Kendala,
		Keterangan:   req.Keterangan,
		UpdatedBy:    &userID,
	}

	if err := h.pelaksanaanSvc.Update(c.Context(), p); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(p))
}

func (h *PelaksanaanHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	if err := h.pelaksanaanSvc.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(fiber.Map{"message": "Pelaksanaan berhasil dihapus"}))
}
