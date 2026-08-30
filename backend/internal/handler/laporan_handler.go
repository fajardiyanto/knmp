package handler

import (
	"encoding/json"
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

type LaporanHandler struct {
	laporanSvc *service.LaporanService
}

func NewLaporanHandler(laporanSvc *service.LaporanService) *LaporanHandler {
	return &LaporanHandler{laporanSvc: laporanSvc}
}

func (h *LaporanHandler) List(c *fiber.Ctx) error {
	filter := repository.LaporanFilter{
		Status:       c.Query("status"),
		JenisLaporan: c.Query("jenis_laporan"),
		Search:       c.Query("search"),
	}

	if pelID, err := strconv.ParseInt(c.Query("pelaksanaan_id"), 10, 64); err == nil {
		filter.PelaksanaanID = &pelID
	}
	if knmpID, err := strconv.ParseInt(c.Query("knmp_id"), 10, 64); err == nil {
		filter.KNMPID = &knmpID
	}
	if jbID, err := strconv.ParseInt(c.Query("jenis_bangunan_id"), 10, 64); err == nil {
		filter.JenisBangunanID = &jbID
	}

	userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)
	isGlobal := false
	for _, r := range userRoles {
		if r == "superadmin" || r == "admin_ppk" || r == "ppk" {
			isGlobal = true
			break
		}
	}

	if !isGlobal {
		userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
		if userID > 0 {
			filter.UserID = &userID
		}
		if userKnmpIDs, ok := c.Locals(middleware.CtxUserKnmpIDsKey).([]int64); ok && len(userKnmpIDs) > 0 {
			filter.UserKnmpIDs = userKnmpIDs
		}
	}

	list, err := h.laporanSvc.List(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(list))
}

func (h *LaporanHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	l, err := h.laporanSvc.GetByID(c.Context(), id)
	if err != nil || l == nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("Laporan tidak ditemukan"))
	}
	return c.JSON(OKResponse(l))
}

type LaporanDetailInput struct {
	JenisBangunanID       int64   `json:"jenis_bangunan_id" validate:"required"`
	RencanaProgresFisik   float64 `json:"rencana_progres_fisik"`
	RealisasiProgresFisik float64 `json:"realisasi_progres_fisik"`
	Keterangan            *string `json:"keterangan"`
}

type CreateLaporanRequest struct {
	PelaksanaanID        int64                `json:"pelaksanaan_id" validate:"required"`
	Nama                 string               `json:"nama" validate:"required"`
	Tanggal              string               `json:"tanggal" validate:"required"`
	JenisLaporan         string               `json:"jenis_laporan" validate:"required"` // 'harian', 'mingguan', 'bulanan'
	Keberapa             *int                 `json:"keberapa"`
	Cuaca                *string              `json:"cuaca"`
	JumlahTenagaKerja    int                  `json:"jumlah_tenaga_kerja"`
	RencanaProgresFisik  float64              `json:"rencana_progres_fisik"`
	RealisasiProgresFisik float64              `json:"realisasi_progres_fisik"`
	Lat                  *string              `json:"lat"`
	Long                 *string              `json:"long"`
	Keterangan           *string              `json:"keterangan"`
	JenisBangunanDetails []LaporanDetailInput `json:"jenis_bangunan_details"`
}

func (h *LaporanHandler) Create(c *fiber.Ctx) error {
	var req CreateLaporanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	if err := validator.Validate(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(ValidationErrorResponse("Validasi gagal", err.Error()))
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	l := &domain.Laporan{
		PelaksanaanID:         req.PelaksanaanID,
		UserID:                &userID,
		Nama:                  req.Nama,
		Tanggal:               req.Tanggal,
		JenisLaporan:          req.JenisLaporan,
		Keberapa:              req.Keberapa,
		Cuaca:                 req.Cuaca,
		JumlahTenagaKerja:     req.JumlahTenagaKerja,
		RencanaProgresFisik:   req.RencanaProgresFisik,
		RealisasiProgresFisik: req.RealisasiProgresFisik,
		Status:                "menunggu_pengawas",
		Lat:                   req.Lat,
		Long:                  req.Long,
		Keterangan:            req.Keterangan,
		CreatedBy:             &userID,
	}

	var details []*domain.LaporanJenisBangunan
	for _, d := range req.JenisBangunanDetails {
		details = append(details, &domain.LaporanJenisBangunan{
			JenisBangunanID:       d.JenisBangunanID,
			RencanaProgresFisik:   d.RencanaProgresFisik,
			RealisasiProgresFisik: d.RealisasiProgresFisik,
			Keterangan:            d.Keterangan,
		})
	}

	if err := h.laporanSvc.Create(c.Context(), l, details); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(l))
}

func (h *LaporanHandler) StoreMobile(c *fiber.Ctx) error {
	pelaksanaanID, _ := strconv.ParseInt(c.FormValue("pelaksanaan_id"), 10, 64)
	if pelaksanaanID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("pelaksanaan_id wajib diisi"))
	}

	nama := c.FormValue("nama")
	tanggal := c.FormValue("tanggal")
	jenisLaporan := c.FormValue("jenis_laporan")
	cuaca := c.FormValue("cuaca")
	jumlahTenagaKerja, _ := strconv.Atoi(c.FormValue("jumlah_tenaga_kerja"))

	var keberapa *int
	if kb, err := strconv.Atoi(c.FormValue("keberapa")); err == nil {
		keberapa = &kb
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
	keteranganStr := c.FormValue("keterangan")
	var keterangan *string
	if keteranganStr != "" {
		keterangan = &keteranganStr
	}

	userID, _ := c.Locals(middleware.CtxUserIDKey).(int64)
	l := &domain.Laporan{
		PelaksanaanID:     pelaksanaanID,
		UserID:            &userID,
		Nama:              nama,
		Tanggal:           tanggal,
		JenisLaporan:      jenisLaporan,
		Keberapa:          keberapa,
		Cuaca:             &cuaca,
		JumlahTenagaKerja: jumlahTenagaKerja,
		Lat:               lat,
		Long:              long,
		Keterangan:        keterangan,
		CreatedBy:         &userID,
	}

	// Parse multipart building details & photos
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Gagal memproses form multipart"))
	}

	var details []*domain.LaporanJenisBangunan
	photosMap := make(map[int][]*multipart.FileHeader)

	// Check if details passed as JSON string or form arrays
	if detailsJSON := c.FormValue("jenis_bangunan_details_json"); detailsJSON != "" {
		var rawDetails []LaporanDetailInput
		_ = json.Unmarshal([]byte(detailsJSON), &rawDetails)
		for idx, d := range rawDetails {
			details = append(details, &domain.LaporanJenisBangunan{
				JenisBangunanID:       d.JenisBangunanID,
				RencanaProgresFisik:   d.RencanaProgresFisik,
				RealisasiProgresFisik: d.RealisasiProgresFisik,
				Keterangan:            d.Keterangan,
			})
			fileKey := "photos_" + strconv.Itoa(idx)
			if files, ok := form.File[fileKey]; ok {
				photosMap[idx] = files
			}
		}
	} else {
		// Parse indexed array fields: jenis_bangunan_details[0][jenis_bangunan_id]
		for i := 0; i < 20; i++ {
			prefix := "jenis_bangunan_details[" + strconv.Itoa(i) + "]"
			jbIDStr := c.FormValue(prefix + "[jenis_bangunan_id]")
			if jbIDStr == "" {
				break
			}
			jbID, _ := strconv.ParseInt(jbIDStr, 10, 64)
			rencana, _ := strconv.ParseFloat(c.FormValue(prefix+"[rencana_progres_fisik]"), 64)
			realisasi, _ := strconv.ParseFloat(c.FormValue(prefix+"[realisasi_progres_fisik]"), 64)
			ket := c.FormValue(prefix + "[keterangan]")
			var ketPtr *string
			if ket != "" {
				ketPtr = &ket
			}

			idx := len(details)
			details = append(details, &domain.LaporanJenisBangunan{
				JenisBangunanID:       jbID,
				RencanaProgresFisik:   rencana,
				RealisasiProgresFisik: realisasi,
				Keterangan:            ketPtr,
			})

			// Collect photos: jenis_bangunan_details[0][photos][]
			for k, fileList := range form.File {
				if strings.HasPrefix(k, prefix+"[photos]") {
					photosMap[idx] = append(photosMap[idx], fileList...)
				}
			}
		}
	}

	result, err := h.laporanSvc.CreateMobile(c.Context(), l, details, photosMap)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(result))
}

type VerifyRequest struct {
	Status string `json:"status" validate:"required"` // 'approved' | 'rejected'
	Note   string `json:"note"`
}

func (h *LaporanHandler) Verify(c *fiber.Ctx) error {
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

	// Determine step based on permissions
	step := "pengawas"
	for _, p := range userPerms {
		if p == "laporan_verify_wakil_ppk" {
			step = "wakil_ppk"
			break
		}
	}

	isApproved := req.Status == "approved"
	if err := h.laporanSvc.Verify(c.Context(), id, step, isApproved, req.Note, userID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}

	updated, _ := h.laporanSvc.GetByID(c.Context(), id)
	return c.JSON(OKResponse(updated))
}

type UnverifyRequest struct {
	Note string `json:"note"`
}

func (h *LaporanHandler) Unverify(c *fiber.Ctx) error {
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
		if p == "laporan_unverify_wakil_ppk" {
			step = "wakil_ppk"
			break
		}
	}

	if err := h.laporanSvc.Unverify(c.Context(), id, step, req.Note, userID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}

	updated, _ := h.laporanSvc.GetByID(c.Context(), id)
	return c.JSON(OKResponse(updated))
}

func (h *LaporanHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID tidak valid"))
	}

	if err := h.laporanSvc.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(fiber.Map{"message": "Laporan berhasil dihapus"}))
}

func (h *LaporanHandler) GetMonthlyProjectReportData(c *fiber.Ctx) error {
	knmpID, err := strconv.ParseInt(c.Query("knmp_id"), 10, 64)
	if err != nil || knmpID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("knmp_id wajib diisi"))
	}

	periodType := c.Query("period_type", "bulanan")
	date := c.Query("date")
	week, _ := strconv.Atoi(c.Query("week", "0"))
	month, _ := strconv.Atoi(c.Query("month", "8"))
	year, _ := strconv.Atoi(c.Query("year", "2026"))
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	filter := repository.ProjectReportFilter{
		KNMPID:     knmpID,
		PeriodType: periodType,
		Date:       date,
		Week:       week,
		Month:      month,
		Year:       year,
		StartDate:  startDate,
		EndDate:    endDate,
	}

	data, err := h.laporanSvc.GetMonthlyProjectReportData(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}

	return c.JSON(OKResponse(data))
}
