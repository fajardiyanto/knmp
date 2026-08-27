package handler

import (
	"mime/multipart"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/middleware"
	"knmp-v2-backend/internal/repository"
	"knmp-v2-backend/internal/service"
	"knmp-v2-backend/pkg/validator"
)

// --- ABSENSI HANDLER ---

type AbsensiHandler struct {
	absensiSvc *service.AbsensiService
}

func NewAbsensiHandler(absensiSvc *service.AbsensiService) *AbsensiHandler {
	return &AbsensiHandler{absensiSvc: absensiSvc}
}

func (h *AbsensiHandler) List(c *fiber.Ctx) error {
	filter := repository.AbsensiFilter{
		TipeAbsensi: c.Query("tipe_absensi"),
		Status:      c.Query("status"),
	}
	if pelID, err := strconv.ParseInt(c.Query("pelaksanaan_id"), 10, 64); err == nil {
		filter.PelaksanaanID = &pelID
	}

	list, err := h.absensiSvc.List(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(list))
}

func (h *AbsensiHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	a, err := h.absensiSvc.GetByID(c.Context(), id)
	if err != nil || a == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Absensi tidak ditemukan"))
	}
	return c.JSON(OKResponse(a))
}

func (h *AbsensiHandler) StoreMobile(c *fiber.Ctx) error {
	pelaksanaanID, _ := strconv.ParseInt(c.FormValue("pelaksanaan_id"), 10, 64)
	tipeAbsensi := c.FormValue("tipe_absensi")
	if pelaksanaanID == 0 || tipeAbsensi == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("pelaksanaan_id dan tipe_absensi wajib diisi"))
	}

	latStr := c.FormValue("lat")
	longStr := c.FormValue("long")
	var lat, long *string
	if latStr != "" {
		lat = &latStr
	}
	if longStr != "" {
		long = &longStr
	}

	photo, _ := c.FormFile("photo")
	if photo == nil {
		photo, _ = c.FormFile("foto")
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	result, err := h.absensiSvc.CreateMobile(c.Context(), pelaksanaanID, userID, tipeAbsensi, lat, long, photo)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(result))
}

func (h *AbsensiHandler) Verify(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	var req VerifyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	userPerms, _ := c.Locals(middleware.CtxUserPermsKey).([]string)

	step := "pengawas"
	for _, p := range userPerms {
		if p == "absensi_verify_wakil_ppk" {
			step = "wakil_ppk"
			break
		}
	}

	isApproved := req.Status == "approved"
	if err := h.absensiSvc.Verify(c.Context(), id, step, isApproved, req.Note, userID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}

	updated, _ := h.absensiSvc.GetByID(c.Context(), id)
	return c.JSON(OKResponse(updated))
}

func (h *AbsensiHandler) Unverify(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	var req UnverifyRequest
	_ = c.BodyParser(&req)

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	userPerms, _ := c.Locals(middleware.CtxUserPermsKey).([]string)

	step := "pengawas"
	for _, p := range userPerms {
		if p == "absensi_unverify_wakil_ppk" {
			step = "wakil_ppk"
			break
		}
	}

	if err := h.absensiSvc.Unverify(c.Context(), id, step, req.Note, userID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}

	updated, _ := h.absensiSvc.GetByID(c.Context(), id)
	return c.JSON(OKResponse(updated))
}

// --- ISSUE HANDLER ---

type IssueHandler struct {
	issueSvc *service.IssueService
}

func NewIssueHandler(issueSvc *service.IssueService) *IssueHandler {
	return &IssueHandler{issueSvc: issueSvc}
}

func (h *IssueHandler) List(c *fiber.Ctx) error {
	filter := repository.IssueFilter{
		KategoriIssue: c.Query("kategori_issue"),
		Tingkat:       c.Query("tingkat"),
		Status:        c.Query("status"),
	}
	if knmpID, err := strconv.ParseInt(c.Query("knmp_id"), 10, 64); err == nil {
		filter.KnmpID = &knmpID
	}

	list, err := h.issueSvc.List(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(list))
}

func (h *IssueHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	i, err := h.issueSvc.GetByID(c.Context(), id)
	if err != nil || i == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Issue tidak ditemukan"))
	}
	return c.JSON(OKResponse(i))
}

type CreateIssueWebRequest struct {
	KnmpID        *int64 `json:"knmp_id"`
	KategoriIssue string `json:"kategori_issue" validate:"required"`
	Tingkat       string `json:"tingkat" validate:"required"`
	UraianMasalah string `json:"uraian_masalah" validate:"required"`
}

func (h *IssueHandler) Create(c *fiber.Ctx) error {
	var req CreateIssueWebRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	if err := validator.Validate(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(ValidationErrorResponse("Validasi gagal", err.Error()))
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	issue := &domain.Issue{
		KnmpID:        req.KnmpID,
		KategoriIssue: req.KategoriIssue,
		Tingkat:       req.Tingkat,
		Status:        "menunggu_pengawas",
		UraianMasalah: req.UraianMasalah,
		CreatedBy:     &userID,
	}

	if err := h.issueSvc.Create(c.Context(), issue); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(issue))
}

func (h *IssueHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	var req CreateIssueWebRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}

	existing, err := h.issueSvc.GetByID(c.Context(), id)
	if err != nil || existing == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Issue tidak ditemukan"))
	}

	existing.KnmpID = req.KnmpID
	existing.KategoriIssue = req.KategoriIssue
	existing.Tingkat = req.Tingkat
	existing.UraianMasalah = req.UraianMasalah

	if err := h.issueSvc.Update(c.Context(), existing); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(existing))
}

func (h *IssueHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	if err := h.issueSvc.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(fiber.Map{"message": "Issue berhasil dihapus"}))
}

func (h *IssueHandler) StoreMobile(c *fiber.Ctx) error {
	knmpID, _ := strconv.ParseInt(c.FormValue("knmp_id"), 10, 64)
	kategori := c.FormValue("kategori_issue")
	tingkat := c.FormValue("tingkat")
	uraian := c.FormValue("uraian_masalah")

	if kategori == "" || tingkat == "" || uraian == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("kategori_issue, tingkat, dan uraian_masalah wajib diisi"))
	}

	form, _ := c.MultipartForm()
	var photos []*multipart.FileHeader
	if form != nil {
		for k, files := range form.File {
			if strings.HasPrefix(k, "photos") || strings.HasPrefix(k, "foto") {
				photos = append(photos, files...)
			}
		}
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	result, err := h.issueSvc.CreateMobile(c.Context(), knmpID, kategori, tingkat, uraian, userID, photos)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(result))
}

func (h *IssueHandler) Verify(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	var req VerifyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	userPerms, _ := c.Locals(middleware.CtxUserPermsKey).([]string)

	step := "pengawas"
	for _, p := range userPerms {
		if p == "issue_verify_wakil_ppk" {
			step = "wakil_ppk"
			break
		}
	}

	isApproved := req.Status == "approved"
	if err := h.issueSvc.Verify(c.Context(), id, step, isApproved, req.Note, userID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}

	updated, _ := h.issueSvc.GetByID(c.Context(), id)
	return c.JSON(OKResponse(updated))
}

func (h *IssueHandler) Unverify(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	var req UnverifyRequest
	_ = c.BodyParser(&req)

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	userPerms, _ := c.Locals(middleware.CtxUserPermsKey).([]string)

	step := "pengawas"
	for _, p := range userPerms {
		if p == "issue_unverify_wakil_ppk" {
			step = "wakil_ppk"
			break
		}
	}

	if err := h.issueSvc.Unverify(c.Context(), id, step, req.Note, userID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}

	updated, _ := h.issueSvc.GetByID(c.Context(), id)
	return c.JSON(OKResponse(updated))
}

// --- PEMBAYARAN HANDLER ---

type PembayaranHandler struct {
	pembayaranSvc *service.PembayaranService
}

func NewPembayaranHandler(pembayaranSvc *service.PembayaranService) *PembayaranHandler {
	return &PembayaranHandler{pembayaranSvc: pembayaranSvc}
}

func (h *PembayaranHandler) List(c *fiber.Ctx) error {
	var pkID *int64
	if id, err := strconv.ParseInt(c.Query("persiapan_kontrak_id"), 10, 64); err == nil {
		pkID = &id
	}

	list, err := h.pembayaranSvc.List(c.Context(), pkID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(list))
}

func (h *PembayaranHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	p, err := h.pembayaranSvc.GetByID(c.Context(), id)
	if err != nil || p == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Data pembayaran tidak ditemukan"))
	}
	return c.JSON(OKResponse(p))
}

type CreatePembayaranRequest struct {
	PersiapanKontrakID int64   `json:"persiapan_kontrak_id" validate:"required"`
	Kategori           *string `json:"kategori"`
	Name               string  `json:"name" validate:"required"`
	Termin             string  `json:"termin" validate:"required"`
	RealisasiAnggaran  float64 `json:"realisasi_anggaran"`
	RealisasiFisik     float64 `json:"realisasi_fisik"`
	NorekPekerja       *string `json:"norek_pekerja"`
}

func (h *PembayaranHandler) Create(c *fiber.Ctx) error {
	var req CreatePembayaranRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	if err := validator.Validate(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(ValidationErrorResponse("Validasi gagal", err.Error()))
	}

	p := &domain.Pembayaran{
		PersiapanKontrakID: req.PersiapanKontrakID,
		Kategori:           req.Kategori,
		Name:               req.Name,
		Termin:             req.Termin,
		RealisasiAnggaran:  req.RealisasiAnggaran,
		RealisasiFisik:     req.RealisasiFisik,
		NorekPekerja:       req.NorekPekerja,
	}

	if err := h.pembayaranSvc.Create(c.Context(), p); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(p))
}

func (h *PembayaranHandler) Summary(c *fiber.Ctx) error {
	summary, err := h.pembayaranSvc.GetSummary(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(summary))
}

func (h *PembayaranHandler) Termin(c *fiber.Ctx) error {
	stats, err := h.pembayaranSvc.GetTerminStats(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(stats))
}
