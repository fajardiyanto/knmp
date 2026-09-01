package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/middleware"
	"knmp-v2-backend/internal/repository"
	"knmp-v2-backend/internal/service"
	"knmp-v2-backend/pkg/validator"
)

type KnmpHandler struct {
	knmpSvc *service.KnmpService
}

func NewKnmpHandler(knmpSvc *service.KnmpService) *KnmpHandler {
	return &KnmpHandler{knmpSvc: knmpSvc}
}

func (h *KnmpHandler) List(c *fiber.Ctx) error {
	filter := repository.KnmpFilter{
		Search:    c.Query("search"),
		NamaPT:    c.Query("nama_pt"),
		JenisKnmp: c.Query("jenis_knmp"),
		Status:    c.Query("status"),
	}
	if filter.NamaPT == "" {
		filter.NamaPT = c.Query("penyedia")
	}

	if regID, err := strconv.ParseInt(c.Query("regional_id"), 10, 64); err == nil {
		filter.RegionalID = &regID
	}
	if provID, err := strconv.ParseInt(c.Query("province_id"), 10, 64); err == nil {
		filter.ProvinceID = &provID
	}
	if regencyID, err := strconv.ParseInt(c.Query("regency_id"), 10, 64); err == nil {
		filter.RegencyID = &regencyID
	}
	if distID, err := strconv.ParseInt(c.Query("district_id"), 10, 64); err == nil {
		filter.DistrictID = &distID
	}
	if subDistID, err := strconv.ParseInt(c.Query("sub_district_id"), 10, 64); err == nil {
		filter.SubDistrictID = &subDistID
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "0"))
	if perPage > 0 {
		filter.Limit = perPage
		filter.Offset = (page - 1) * perPage
	}

	userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
	isGlobal := false
	for _, r := range userRoles {
		if domain.IsSuperAdminRole(r) {
			isGlobal = true
			break
		}
	}
	if !isGlobal {
		if userKnmpIDs, ok := c.Locals(middleware.CtxUserKnmpIDsKey).([]int64); ok && len(userKnmpIDs) > 0 {
			filter.UserKnmpIDs = userKnmpIDs
		} else {
			filter.UserKnmpIDs = []int64{-1}
		}
	}

	list, err := h.knmpSvc.List(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(list))
}

func (h *KnmpHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	knmp, err := h.knmpSvc.GetByID(c.Context(), id)
	if err != nil || knmp == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("KNMP tidak ditemukan"))
	}
	return c.JSON(OKResponse(knmp))
}

type CreateKnmpRequest struct {
	RegionalID    *int64  `json:"regional_id"`
	ProvinceID    *int64  `json:"province_id"`
	RegencyID     *int64  `json:"regency_id"`
	DistrictID    *int64  `json:"district_id"`
	SubDistrictID *int64  `json:"sub_district_id"`
	Name          string  `json:"name" validate:"required"`
	JenisKnmp     string  `json:"jenis_knmp"`
	Lat           *string `json:"lat"`
	Long          *string `json:"long"`
	Status        string  `json:"status"`
}

func (h *KnmpHandler) Create(c *fiber.Ctx) error {
	var req CreateKnmpRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	if err := validator.Validate(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(ValidationErrorResponse("Validasi gagal", err.Error()))
	}

	if req.JenisKnmp == "" {
		req.JenisKnmp = "existing"
	}
	if req.Status == "" {
		req.Status = "aktif"
	}

	knmp := &domain.Knmp{
		RegionalID:    req.RegionalID,
		ProvinceID:    req.ProvinceID,
		RegencyID:     req.RegencyID,
		DistrictID:    req.DistrictID,
		SubDistrictID: req.SubDistrictID,
		Name:          req.Name,
		JenisKnmp:     req.JenisKnmp,
		Lat:           req.Lat,
		Long:          req.Long,
		Status:        req.Status,
	}

	if err := h.knmpSvc.Create(c.Context(), knmp); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(knmp))
}

func (h *KnmpHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	var req CreateKnmpRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	if err := validator.Validate(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(ValidationErrorResponse("Validasi gagal", err.Error()))
	}

	knmp := &domain.Knmp{
		ID:            id,
		RegionalID:    req.RegionalID,
		ProvinceID:    req.ProvinceID,
		RegencyID:     req.RegencyID,
		DistrictID:    req.DistrictID,
		SubDistrictID: req.SubDistrictID,
		Name:          req.Name,
		JenisKnmp:     req.JenisKnmp,
		Lat:           req.Lat,
		Long:          req.Long,
		Status:        req.Status,
	}

	if err := h.knmpSvc.Update(c.Context(), knmp); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(knmp))
}

func (h *KnmpHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	if err := h.knmpSvc.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(fiber.Map{"message": "KNMP berhasil dihapus"}))
}

func (h *KnmpHandler) Widget(c *fiber.Ctx) error {
	userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
	isGlobal := false
	for _, r := range userRoles {
		if domain.IsSuperAdminRole(r) {
			isGlobal = true
			break
		}
	}
	var userKnmpIDs []int64
	if !isGlobal {
		if ids, ok := c.Locals(middleware.CtxUserKnmpIDsKey).([]int64); ok && len(ids) > 0 {
			userKnmpIDs = ids
		} else {
			userKnmpIDs = []int64{-1}
		}
	}

	stats, err := h.knmpSvc.GetWidgetStats(c.Context(), userKnmpIDs)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(stats))
}

func (h *KnmpHandler) Map(c *fiber.Ctx) error {
	filter := repository.KnmpFilter{}
	userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
	isGlobal := false
	for _, r := range userRoles {
		if domain.IsSuperAdminRole(r) {
			isGlobal = true
			break
		}
	}
	if !isGlobal {
		if userKnmpIDs, ok := c.Locals(middleware.CtxUserKnmpIDsKey).([]int64); ok && len(userKnmpIDs) > 0 {
			filter.UserKnmpIDs = userKnmpIDs
		} else {
			filter.UserKnmpIDs = []int64{-1}
		}
	}

	points, err := h.knmpSvc.List(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(points))
}

// Geo endpoints
func (h *KnmpHandler) ListRegionals(c *fiber.Ctx) error {
	res, err := h.knmpSvc.ListRegionals(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(res))
}

func (h *KnmpHandler) ListProvinces(c *fiber.Ctx) error {
	regionalID, _ := strconv.ParseInt(c.Params("regionalId"), 10, 64)
	res, err := h.knmpSvc.ListProvinces(c.Context(), regionalID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(res))
}

func (h *KnmpHandler) ListRegencies(c *fiber.Ctx) error {
	provinceID, _ := strconv.ParseInt(c.Params("provinceId"), 10, 64)
	res, err := h.knmpSvc.ListRegencies(c.Context(), provinceID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(res))
}

func (h *KnmpHandler) ListDistricts(c *fiber.Ctx) error {
	regencyID, _ := strconv.ParseInt(c.Params("regencyId"), 10, 64)
	res, err := h.knmpSvc.ListDistricts(c.Context(), regencyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(res))
}

func (h *KnmpHandler) ListSubDistricts(c *fiber.Ctx) error {
	districtID, _ := strconv.ParseInt(c.Params("districtId"), 10, 64)
	res, err := h.knmpSvc.ListSubDistricts(c.Context(), districtID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(res))
}

// Master Jenis Bangunan & Periode
func (h *KnmpHandler) ListJenisBangunan(c *fiber.Ctx) error {
	activeOnly := c.Query("is_active") == "1"
	res, err := h.knmpSvc.ListJenisBangunans(c.Context(), activeOnly)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(res))
}

type JenisBangunanRequest struct {
	Nama      string  `json:"nama" validate:"required"`
	Deskripsi *string `json:"deskripsi"`
	IsActive  bool    `json:"is_active"`
}

func (h *KnmpHandler) CreateJenisBangunan(c *fiber.Ctx) error {
	var req JenisBangunanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	jb := &domain.JenisBangunan{
		Nama:      req.Nama,
		Deskripsi: req.Deskripsi,
		IsActive:  req.IsActive,
	}
	if err := h.knmpSvc.CreateJenisBangunan(c.Context(), jb); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(jb))
}

func (h *KnmpHandler) UpdateJenisBangunan(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}
	var req JenisBangunanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	jb := &domain.JenisBangunan{
		ID:        id,
		Nama:      req.Nama,
		Deskripsi: req.Deskripsi,
		IsActive:  req.IsActive,
	}
	if err := h.knmpSvc.UpdateJenisBangunan(c.Context(), jb); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(jb))
}

func (h *KnmpHandler) DeleteJenisBangunan(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}
	if err := h.knmpSvc.DeleteJenisBangunan(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(fiber.Map{"message": "Jenis bangunan berhasil dihapus"}))
}

func (h *KnmpHandler) ListPeriodes(c *fiber.Ctx) error {
	res, err := h.knmpSvc.ListPeriodes(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(res))
}

type PeriodeRequest struct {
	Year         int    `json:"year" validate:"required"`
	TanggalMulai string `json:"tanggal_mulai"`
	TanggalAkhir string `json:"tanggal_akhir"`
}

func (h *KnmpHandler) CreatePeriode(c *fiber.Ctx) error {
	var req PeriodeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	p := &domain.Periode{
		Year:         req.Year,
		TanggalMulai: req.TanggalMulai,
		TanggalAkhir: req.TanggalAkhir,
	}
	if err := h.knmpSvc.CreatePeriode(c.Context(), p); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(p))
}

func (h *KnmpHandler) UpdatePeriode(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}
	var req PeriodeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	p := &domain.Periode{
		ID:           id,
		Year:         req.Year,
		TanggalMulai: req.TanggalMulai,
		TanggalAkhir: req.TanggalAkhir,
	}
	if err := h.knmpSvc.UpdatePeriode(c.Context(), p); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(p))
}

func (h *KnmpHandler) DeletePeriode(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}
	if err := h.knmpSvc.DeletePeriode(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(fiber.Map{"message": "Periode berhasil dihapus"}))
}
