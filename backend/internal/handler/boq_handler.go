package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/middleware"
	"knmp-v2-backend/internal/repository"
	"knmp-v2-backend/internal/service"
)

type WeeklyBOQHandler struct {
	svc *service.WeeklyBOQService
}

func NewWeeklyBOQHandler(svc *service.WeeklyBOQService) *WeeklyBOQHandler {
	return &WeeklyBOQHandler{svc: svc}
}

func (h *WeeklyBOQHandler) List(c *fiber.Ctx) error {
	filter := weeklyBOQFilterFromCtx(c)
	list, err := h.svc.List(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(list))
}

func (h *WeeklyBOQHandler) Stats(c *fiber.Ctx) error {
	filter := weeklyBOQFilterFromCtx(c)
	stats, err := h.svc.GetStats(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(stats))
}

func (h *WeeklyBOQHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}
	item, err := h.svc.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	if item == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Data BOQ tidak ditemukan"))
	}
	return c.JSON(OKResponse(item))
}

type createWeeklyBOQRequest struct {
	KnmpID                int64                   `json:"knmp_id"`
	WeekStart             string                  `json:"week_start"`
	WeekEnd               string                  `json:"week_end"`
	Title                 string                  `json:"title"`
	SourceDocument        *string                 `json:"source_document"`
	ContractorClaimPct    float64                 `json:"contractor_claim_pct"`
	SupervisorVerifiedPct float64                 `json:"supervisor_verified_pct"`
	EvidenceSupportedPct  float64                 `json:"evidence_supported_pct"`
	AuditExposureValue    float64                 `json:"audit_exposure_value"`
	Status                string                  `json:"status"`
	Summary               string                  `json:"summary"`
	Items                 []*domain.WeeklyBOQItem `json:"items"`
}

func (h *WeeklyBOQHandler) Create(c *fiber.Ctx) error {
	var req createWeeklyBOQRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	knmpIDs, _ := c.Locals(middleware.CtxUserKnmpIDsKey).([]int64)
	roles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
	if !isSuperAdminRole(roles) && !containsInt64(knmpIDs, req.KnmpID) {
		return c.Status(fiber.StatusForbidden).JSON(ErrorResponse("Anda tidak memiliki akses input BOQ untuk titik KNMP ini"))
	}
	control := &domain.WeeklyBOQControl{
		KnmpID:                req.KnmpID,
		WeekStart:             req.WeekStart,
		WeekEnd:               req.WeekEnd,
		Title:                 req.Title,
		SourceDocument:        req.SourceDocument,
		ContractorClaimPct:    req.ContractorClaimPct,
		SupervisorVerifiedPct: req.SupervisorVerifiedPct,
		EvidenceSupportedPct:  req.EvidenceSupportedPct,
		AuditExposureValue:    req.AuditExposureValue,
		Status:                req.Status,
		Summary:               req.Summary,
		CreatedBy:             &userID,
	}
	if err := h.svc.Create(c.Context(), control, req.Items); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}
	created, _ := h.svc.GetByID(c.Context(), control.ID)
	return c.Status(fiber.StatusCreated).JSON(OKResponse(created))
}

func (h *WeeklyBOQHandler) UpdateStatus(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}
	var req struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	if err := h.svc.UpdateStatus(c.Context(), id, req.Status); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}
	updated, _ := h.svc.GetByID(c.Context(), id)
	return c.JSON(OKResponse(updated))
}

func (h *WeeklyBOQHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}
	if err := h.svc.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(fiber.Map{"message": "Data BOQ berhasil dihapus"}))
}

func weeklyBOQFilterFromCtx(c *fiber.Ctx) repository.WeeklyBOQFilter {
	filter := repository.WeeklyBOQFilter{
		Search:    c.Query("search"),
		Status:    c.Query("status"),
		StartDate: c.Query("start_date"),
		EndDate:   c.Query("end_date"),
	}
	if knmpID, err := strconv.ParseInt(c.Query("knmp_id"), 10, 64); err == nil {
		filter.KnmpID = &knmpID
	}
	knmpIDs, _ := c.Locals(middleware.CtxUserKnmpIDsKey).([]int64)
	roles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
	isSuperAdmin := false
	for _, role := range roles {
		if domain.IsSuperAdminRole(role) {
			isSuperAdmin = true
			break
		}
	}
	if !isSuperAdmin {
		if len(knmpIDs) == 0 {
			filter.UserKnmpIDs = []int64{-1}
		} else {
			filter.UserKnmpIDs = knmpIDs
		}
	}
	return filter
}

func isSuperAdminRole(roles []string) bool {
	for _, role := range roles {
		if domain.IsSuperAdminRole(role) {
			return true
		}
	}
	return false
}

func containsInt64(values []int64, target int64) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}
