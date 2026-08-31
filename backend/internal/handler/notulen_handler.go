package handler

import (
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/middleware"
	"knmp-v2-backend/internal/service"
)

type NotulenHandler struct {
	notulenSvc *service.NotulenService
}

func NewNotulenHandler(notulenSvc *service.NotulenService) *NotulenHandler {
	return &NotulenHandler{notulenSvc: notulenSvc}
}

func getUserPrimaryRole(roles []string) string {
	if len(roles) == 0 {
		return "user"
	}
	for _, r := range roles {
		lower := strings.ToLower(strings.TrimSpace(r))
		if lower == domain.RoleSuperAdmin || lower == domain.RoleSuperAdminSp || lower == domain.RoleAdminPPK || lower == domain.RoleAdmin {
			return lower
		}
	}
	return roles[0]
}

func (h *NotulenHandler) List(c *fiber.Ctx) error {
	var knmpID *int64
	if id, err := strconv.ParseInt(c.Query("knmp_id"), 10, 64); err == nil && id > 0 {
		knmpID = &id
	}

	search := c.Query("search")
	tglAwal := c.Query("tanggal_awal")
	tglAkhir := c.Query("tanggal_akhir")
	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
	primaryRole := getUserPrimaryRole(userRoles)

	filter := domain.NotulenFilter{
		KnmpID:       knmpID,
		Search:       search,
		TanggalAwal:  tglAwal,
		TanggalAkhir: tglAkhir,
		UserID:       userID,
		UserRole:     primaryRole,
		Limit:        limit,
		Offset:       offset,
	}

	list, err := h.notulenSvc.List(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}

	return c.JSON(OKResponse(list))
}

func (h *NotulenHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	n, err := h.notulenSvc.GetByID(c.Context(), id)
	if err != nil || n == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Data notulen tidak ditemukan"))
	}

	// Check access if non-admin
	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
	primaryRole := getUserPrimaryRole(userRoles)

	if !domain.IsAdminRole(primaryRole) {
		isAuthorized := false
		if n.CreatedBy != nil && *n.CreatedBy == userID {
			isAuthorized = true
		} else {
			for _, uid := range n.SharedUserIDs {
				if uid == userID {
					isAuthorized = true
					break
				}
			}
		}
		if !isAuthorized {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse("Anda tidak memiliki akses untuk melihat notulen ini"))
		}
	}

	return c.JSON(OKResponse(n))
}

type CreateNotulenRequest struct {
	KnmpID          *int64   `json:"knmp_id"`
	Judul           string   `json:"judul"`
	Tanggal         string   `json:"tanggal"`
	WaktuMulai      *string  `json:"waktu_mulai"`
	WaktuSelesai    *string  `json:"waktu_selesai"`
	Lokasi          *string  `json:"lokasi"`
	PimpinanRapat   *string  `json:"pimpinan_rapat"`
	Notulis         string   `json:"notulis"`
	Agenda          *string  `json:"agenda"`
	HasilPembahasan string   `json:"hasil_pembahasan"`
	TindakLanjut    *string  `json:"tindak_lanjut"`
	Status          string   `json:"status"`
	SharedUserIDs   []int64  `json:"shared_user_ids"`
}

func (h *NotulenHandler) Create(c *fiber.Ctx) error {
	var req CreateNotulenRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Format data tidak valid"))
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
	primaryRole := getUserPrimaryRole(userRoles)

	if !domain.IsAdminRole(primaryRole) {
		return c.Status(fiber.StatusForbidden).JSON(ErrorResponse("Hanya Super Admin dan Admin PPK yang dapat menambahkan notulen rapat"))
	}

	notulis := req.Notulis
	if notulis == "" {
		notulis = "Super Admin"
	}

	n := &domain.Notulen{
		KnmpID:          req.KnmpID,
		Judul:           req.Judul,
		Tanggal:         req.Tanggal,
		WaktuMulai:      req.WaktuMulai,
		WaktuSelesai:    req.WaktuSelesai,
		Lokasi:          req.Lokasi,
		PimpinanRapat:   req.PimpinanRapat,
		Notulis:         notulis,
		Agenda:          req.Agenda,
		HasilPembahasan: req.HasilPembahasan,
		TindakLanjut:    req.TindakLanjut,
		Status:          req.Status,
		CreatedBy:       &userID,
	}

	if err := h.notulenSvc.Create(c.Context(), n, req.SharedUserIDs, primaryRole); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}

	return c.Status(fiber.StatusCreated).JSON(OKResponse(n))
}

func (h *NotulenHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	var req CreateNotulenRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Format data tidak valid"))
	}

	userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
	primaryRole := getUserPrimaryRole(userRoles)

	if !domain.IsAdminRole(primaryRole) {
		return c.Status(fiber.StatusForbidden).JSON(ErrorResponse("Hanya Super Admin dan Admin PPK yang dapat mengubah notulen rapat"))
	}

	notulis := req.Notulis
	if notulis == "" {
		notulis = "Super Admin"
	}

	n := &domain.Notulen{
		ID:              id,
		KnmpID:          req.KnmpID,
		Judul:           req.Judul,
		Tanggal:         req.Tanggal,
		WaktuMulai:      req.WaktuMulai,
		WaktuSelesai:    req.WaktuSelesai,
		Lokasi:          req.Lokasi,
		PimpinanRapat:   req.PimpinanRapat,
		Notulis:         notulis,
		Agenda:          req.Agenda,
		HasilPembahasan: req.HasilPembahasan,
		TindakLanjut:    req.TindakLanjut,
		Status:          req.Status,
	}

	if err := h.notulenSvc.Update(c.Context(), n, req.SharedUserIDs, primaryRole); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}

	return c.JSON(OKResponse(n))
}

func (h *NotulenHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
	primaryRole := getUserPrimaryRole(userRoles)

	if !domain.IsAdminRole(primaryRole) {
		return c.Status(fiber.StatusForbidden).JSON(ErrorResponse("Hanya Super Admin dan Admin PPK yang dapat menghapus notulen rapat"))
	}

	if err := h.notulenSvc.Delete(c.Context(), id, primaryRole); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}

	return c.JSON(OKResponse("Notulen berhasil dihapus"))
}

type ShareNotulenRequest struct {
	UserIDs []int64 `json:"user_ids"`
}

func (h *NotulenHandler) Share(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	var req ShareNotulenRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Format data tidak valid"))
	}

	userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
	primaryRole := getUserPrimaryRole(userRoles)

	if !domain.IsAdminRole(primaryRole) {
		return c.Status(fiber.StatusForbidden).JSON(ErrorResponse("Hanya Super Admin dan Admin PPK yang dapat membagikan notulen rapat"))
	}

	if err := h.notulenSvc.ShareToUsers(c.Context(), id, req.UserIDs, primaryRole); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}

	return c.JSON(OKResponse("Notulen berhasil dibagikan"))
}
