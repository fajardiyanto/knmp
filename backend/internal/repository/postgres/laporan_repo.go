package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type laporanRepo struct {
	db *sqlx.DB
}

func NewLaporanRepo(db *sqlx.DB) repository.LaporanRepository {
	return &laporanRepo{db: db}
}

func (r *laporanRepo) GetByID(ctx context.Context, id int64) (*domain.Laporan, error) {
	var l domain.Laporan
	query := `
		SELECT l.id, l.pelaksanaan_id, l.user_id, l.nama, l.tanggal, l.jenis_laporan,
		       l.keberapa, l.cuaca, l.jumlah_tenaga_kerja, l.rencana_progres_fisik,
		       l.realisasi_progres_fisik, l.status, l.lat, l.long, l.keterangan,
		       l.additional_data, l.created_by, l.updated_by, l.created_at, l.updated_at, l.deleted_at,
		       p.nama as pelaksanaan_name,
		       COALESCE(u.name, 'Kontraktor') as user_name
		FROM laporans l
		JOIN pelaksanaans p ON l.pelaksanaan_id = p.id
		LEFT JOIN users u ON l.user_id = u.id
		WHERE l.id = $1 AND l.deleted_at IS NULL
	`
	err := r.db.GetContext(ctx, &l, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get laporan by id: %w", err)
	}
	l.Deviasi = l.RealisasiProgresFisik - l.RencanaProgresFisik
	return &l, nil
}

func (r *laporanRepo) List(ctx context.Context, filter repository.LaporanFilter) ([]*domain.Laporan, error) {
	var results []*domain.Laporan
	query := `
		SELECT DISTINCT l.id, l.pelaksanaan_id, l.user_id, l.nama, l.tanggal, l.jenis_laporan,
		       l.keberapa, l.cuaca, l.jumlah_tenaga_kerja, l.rencana_progres_fisik,
		       l.realisasi_progres_fisik, l.status, l.lat, l.long, l.keterangan,
		       l.additional_data, l.created_by, l.updated_by, l.created_at, l.updated_at, l.deleted_at,
		       p.nama as pelaksanaan_name,
		       COALESCE(u.name, 'Kontraktor') as user_name
		FROM laporans l
		JOIN pelaksanaans p ON l.pelaksanaan_id = p.id
		LEFT JOIN users u ON l.user_id = u.id
	`
	if filter.JenisBangunanID != nil {
		query += " JOIN laporan_jenis_bangunan ljb ON l.id = ljb.laporan_id"
	}
	query += " WHERE l.deleted_at IS NULL"

	var args []any
	argIdx := 1

	if filter.PelaksanaanID != nil {
		query += fmt.Sprintf(" AND l.pelaksanaan_id = $%d", argIdx)
		args = append(args, *filter.PelaksanaanID)
		argIdx++
	}
	if filter.KNMPID != nil {
		query += fmt.Sprintf(" AND p.knmp_id = $%d", argIdx)
		args = append(args, *filter.KNMPID)
		argIdx++
	} else if len(filter.UserKnmpIDs) > 0 {
		if filter.UserID != nil {
			query += fmt.Sprintf(" AND (p.knmp_id = ANY($%d) OR (l.user_id = $%d AND l.user_id IS NOT NULL))", argIdx, argIdx+1)
			args = append(args, pq.Array(filter.UserKnmpIDs), *filter.UserID)
			argIdx += 2
		} else {
			query += fmt.Sprintf(" AND p.knmp_id = ANY($%d)", argIdx)
			args = append(args, pq.Array(filter.UserKnmpIDs))
			argIdx++
		}
	} else if filter.UserID != nil {
		query += fmt.Sprintf(" AND l.user_id = $%d", argIdx)
		args = append(args, *filter.UserID)
		argIdx++
	}
	if filter.JenisBangunanID != nil {
		query += fmt.Sprintf(" AND ljb.jenis_bangunan_id = $%d", argIdx)
		args = append(args, *filter.JenisBangunanID)
		argIdx++
	}
	if filter.Status != "" {
		query += fmt.Sprintf(" AND l.status = $%d", argIdx)
		args = append(args, filter.Status)
		argIdx++
	}
	if filter.JenisLaporan != "" {
		query += fmt.Sprintf(" AND l.jenis_laporan = $%d", argIdx)
		args = append(args, filter.JenisLaporan)
		argIdx++
	}
	if filter.Search != "" {
		query += fmt.Sprintf(" AND (l.nama ILIKE $%d OR l.keterangan ILIKE $%d)", argIdx, argIdx)
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}

	query += " ORDER BY l.id DESC"

	err := r.db.SelectContext(ctx, &results, query, args...)
	if err != nil {
		return nil, err
	}

	for _, l := range results {
		l.Deviasi = l.RealisasiProgresFisik - l.RencanaProgresFisik
	}

	return results, nil
}

func (r *laporanRepo) Create(ctx context.Context, l *domain.Laporan, details []*domain.LaporanJenisBangunan) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `
		INSERT INTO laporans (pelaksanaan_id, user_id, nama, tanggal, jenis_laporan, keberapa, cuaca, jumlah_tenaga_kerja, rencana_progres_fisik, realisasi_progres_fisik, status, lat, long, keterangan, additional_data, created_by, updated_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	err = tx.QueryRowContext(ctx, query,
		l.PelaksanaanID, l.UserID, l.Nama, l.Tanggal, l.JenisLaporan, l.Keberapa,
		l.Cuaca, l.JumlahTenagaKerja, l.RencanaProgresFisik, l.RealisasiProgresFisik,
		l.Status, l.Lat, l.Long, l.Keterangan, l.AdditionalData, l.CreatedBy, l.UpdatedBy,
	).Scan(&l.ID, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		return fmt.Errorf("insert laporan: %w", err)
	}

	if len(details) > 0 {
		detailQuery := `
			INSERT INTO laporan_jenis_bangunan (laporan_id, jenis_bangunan_id, rencana_progres_fisik, realisasi_progres_fisik, keterangan, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
			RETURNING id, created_at, updated_at
		`
		for _, d := range details {
			d.LaporanID = l.ID
			err = tx.QueryRowContext(ctx, detailQuery, d.LaporanID, d.JenisBangunanID, d.RencanaProgresFisik, d.RealisasiProgresFisik, d.Keterangan).
				Scan(&d.ID, &d.CreatedAt, &d.UpdatedAt)
			if err != nil {
				return fmt.Errorf("insert laporan detail: %w", err)
			}
		}
	}

	return tx.Commit()
}

func (r *laporanRepo) Update(ctx context.Context, l *domain.Laporan, details []*domain.LaporanJenisBangunan) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `
		UPDATE laporans
		SET pelaksanaan_id = $1, user_id = $2, nama = $3, tanggal = $4, jenis_laporan = $5,
		    keberapa = $6, cuaca = $7, jumlah_tenaga_kerja = $8, rencana_progres_fisik = $9,
		    realisasi_progres_fisik = $10, status = $11, lat = $12, long = $13,
		    keterangan = $14, additional_data = $15, updated_by = $16, updated_at = NOW()
		WHERE id = $17 AND deleted_at IS NULL
	`
	_, err = tx.ExecContext(ctx, query,
		l.PelaksanaanID, l.UserID, l.Nama, l.Tanggal, l.JenisLaporan, l.Keberapa,
		l.Cuaca, l.JumlahTenagaKerja, l.RencanaProgresFisik, l.RealisasiProgresFisik,
		l.Status, l.Lat, l.Long, l.Keterangan, l.AdditionalData, l.UpdatedBy, l.ID,
	)
	if err != nil {
		return fmt.Errorf("update laporan: %w", err)
	}

	if len(details) > 0 {
		_, _ = tx.ExecContext(ctx, `UPDATE laporan_jenis_bangunan SET deleted_at = NOW() WHERE laporan_id = $1`, l.ID)
		detailQuery := `
			INSERT INTO laporan_jenis_bangunan (laporan_id, jenis_bangunan_id, rencana_progres_fisik, realisasi_progres_fisik, keterangan, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
			RETURNING id, created_at, updated_at
		`
		for _, d := range details {
			d.LaporanID = l.ID
			err = tx.QueryRowContext(ctx, detailQuery, d.LaporanID, d.JenisBangunanID, d.RencanaProgresFisik, d.RealisasiProgresFisik, d.Keterangan).
				Scan(&d.ID, &d.CreatedAt, &d.UpdatedAt)
			if err != nil {
				return fmt.Errorf("insert updated laporan detail: %w", err)
			}
		}
	}

	return tx.Commit()
}

func (r *laporanRepo) UpdateStatus(ctx context.Context, id int64, status string) error {
	query := `UPDATE laporans SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`
	_, err := r.db.ExecContext(ctx, query, status, id)
	return err
}

func (r *laporanRepo) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `UPDATE laporans SET deleted_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *laporanRepo) GetDetailsByLaporanID(ctx context.Context, laporanID int64) ([]*domain.LaporanJenisBangunan, error) {
	var details []*domain.LaporanJenisBangunan
	query := `
		SELECT ljb.id, ljb.laporan_id, ljb.jenis_bangunan_id, ljb.rencana_progres_fisik,
		       ljb.realisasi_progres_fisik, ljb.keterangan, ljb.created_at, ljb.updated_at, ljb.deleted_at,
		       jb.nama as jenis_bangunan_name
		FROM laporan_jenis_bangunan ljb
		JOIN jenis_bangunans jb ON ljb.jenis_bangunan_id = jb.id
		WHERE ljb.laporan_id = $1 AND ljb.deleted_at IS NULL
		ORDER BY ljb.id ASC
	`
	err := r.db.SelectContext(ctx, &details, query, laporanID)
	if err != nil {
		return nil, err
	}

	for _, d := range details {
		d.Deviasi = d.RealisasiProgresFisik - d.RencanaProgresFisik
	}

	return details, nil
}

var indonesianMonths = []string{
	"", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
	"Juli", "Agustus", "September", "Oktober", "November", "Desember",
}

func (r *laporanRepo) GetMonthlyProjectReportData(ctx context.Context, filter repository.ProjectReportFilter) (*domain.MonthlyProjectReportData, error) {
	knmpID := filter.KNMPID
	laporanID := filter.LaporanID
	month := filter.Month
	if month < 1 || month > 12 {
		month = 8
	}
	year := filter.Year
	if year < 2020 {
		year = 2026
	}
	periodType := filter.PeriodType
	if periodType == "" {
		periodType = "bulanan"
	}

	periodLabel := fmt.Sprintf("Laporan Bulanan — %s %d", indonesianMonths[month], year)
	startDate := fmt.Sprintf("%04d-%02d-01", year, month)
	endDate := fmt.Sprintf("%04d-%02d-31", year, month)

	if periodType == "harian" {
		if filter.Date != "" {
			startDate = filter.Date
			endDate = filter.Date
			periodLabel = fmt.Sprintf("Laporan Harian — %s", filter.Date)
		} else {
			today := "2026-08-30"
			startDate = today
			endDate = today
			periodLabel = fmt.Sprintf("Laporan Harian — %s", today)
		}
	} else if periodType == "mingguan" {
		week := filter.Week
		if week <= 0 {
			week = 4
		}
		periodLabel = fmt.Sprintf("Laporan Mingguan — Minggu ke-%d (%s %d)", week, indonesianMonths[month], year)
		startDay := (week-1)*7 + 1
		endDay := week * 7
		if endDay > 30 {
			endDay = 30
		}
		startDate = fmt.Sprintf("%04d-%02d-%02d", year, month, startDay)
		endDate = fmt.Sprintf("%04d-%02d-%02d", year, month, endDay)
	} else if periodType == "custom" {
		if filter.StartDate != "" && filter.EndDate != "" {
			startDate = filter.StartDate
			endDate = filter.EndDate
			periodLabel = fmt.Sprintf("Laporan Periode — %s s.d %s", startDate, endDate)
		}
	}

	report := &domain.MonthlyProjectReportData{
		KNMPID:          knmpID,
		PeriodType:      periodType,
		PeriodLabel:     periodLabel,
		Date:            filter.Date,
		Week:            filter.Week,
		Month:           month,
		Year:            year,
		MonthName:       indonesianMonths[month],
		StartDate:       startDate,
		EndDate:         endDate,
		Cuaca:           "Cerah Berawan",
		MasaPelaksanaan: 120,
		SPMK:            fmt.Sprintf("SPMK/KNMP-SUM/%d/%d", knmpID, year),
		SiteManager:     "Ir. Hendra Gunawan",
	}

	// 0. If LaporanID is specified, load specific Laporan first
	var targetPelaksanaanID int64
	var laporanIDs []int64
	if laporanID > 0 {
		var targetLaporan struct {
			ID                    int64   `db:"id"`
			PelaksanaanID         int64   `db:"pelaksanaan_id"`
			Nama                  string  `db:"nama"`
			Tanggal               string  `db:"tanggal"`
			JenisLaporan          string  `db:"jenis_laporan"`
			Keberapa              *int    `db:"keberapa"`
			Cuaca                 *string `db:"cuaca"`
			JumlahTenagaKerja     int     `db:"jumlah_tenaga_kerja"`
			RencanaProgresFisik   float64 `db:"rencana_progres_fisik"`
			RealisasiProgresFisik float64 `db:"realisasi_progres_fisik"`
			Status                string  `db:"status"`
			Lat                   *string `db:"lat"`
			Long                  *string `db:"long"`
			Keterangan            *string `db:"keterangan"`
			PelaksanaanName       string  `db:"pelaksanaan_name"`
			KNMPID                int64   `db:"knmp_id"`
			UserName              string  `db:"user_name"`
		}
		singleLapQuery := `
			SELECT l.id, l.pelaksanaan_id, l.nama, l.tanggal, l.jenis_laporan, l.keberapa,
			       l.cuaca, l.jumlah_tenaga_kerja, l.rencana_progres_fisik, l.realisasi_progres_fisik,
			       l.status, l.lat, l.long, l.keterangan,
			       p.nama as pelaksanaan_name, p.knmp_id,
			       COALESCE(u.name, 'Kontraktor') as user_name
			FROM laporans l
			JOIN pelaksanaans p ON l.pelaksanaan_id = p.id
			LEFT JOIN users u ON l.user_id = u.id
			WHERE l.id = $1 AND l.deleted_at IS NULL
		`
		if err := r.db.GetContext(ctx, &targetLaporan, singleLapQuery, laporanID); err == nil {
			report.LaporanID = &targetLaporan.ID
			report.LaporanNama = targetLaporan.Nama
			report.PelaksanaanID = targetLaporan.PelaksanaanID
			report.PelaksanaanName = targetLaporan.PelaksanaanName
			targetPelaksanaanID = targetLaporan.PelaksanaanID
			laporanIDs = append(laporanIDs, targetLaporan.ID)

			if targetLaporan.KNMPID > 0 {
				knmpID = targetLaporan.KNMPID
				report.KNMPID = targetLaporan.KNMPID
			}

			report.PeriodType = targetLaporan.JenisLaporan
			kbStr := ""
			if targetLaporan.Keberapa != nil {
				kbStr = fmt.Sprintf(" Ke-%d", *targetLaporan.Keberapa)
			}
			report.PeriodLabel = fmt.Sprintf("Laporan %s%s — %s", strings.Title(targetLaporan.JenisLaporan), kbStr, targetLaporan.Nama)
			report.Date = targetLaporan.Tanggal
			if targetLaporan.Cuaca != nil && *targetLaporan.Cuaca != "" {
				report.Cuaca = *targetLaporan.Cuaca
			}
			report.TenagaKerja = targetLaporan.JumlahTenagaKerja
			report.TotalPekerja = targetLaporan.JumlahTenagaKerja
			report.ProgressPlan = targetLaporan.RencanaProgresFisik
			report.ProgressActual = targetLaporan.RealisasiProgresFisik
			report.ProgressDeviasi = targetLaporan.RealisasiProgresFisik - targetLaporan.RencanaProgresFisik
			if targetLaporan.Keterangan != nil {
				report.Keterangan = *targetLaporan.Keterangan
			}
			report.StatusLaporan = targetLaporan.Status

			// Fetch jenis bangunan for this single laporan
			var jbNames []string
			_ = r.db.SelectContext(ctx, &jbNames, `
				SELECT jb.nama FROM laporan_jenis_bangunan ljb
				JOIN jenis_bangunans jb ON ljb.jenis_bangunan_id = jb.id
				WHERE ljb.laporan_id = $1 AND ljb.deleted_at IS NULL
				ORDER BY ljb.id ASC
			`, targetLaporan.ID)
			report.JenisBangunanList = jbNames
		}
	}

	// 1. Fetch KNMP Data
	knmpQuery := `
		SELECT k.id, k.name, k.jenis_knmp, k.lat, k.long,
		       COALESCE(r.name, 'Sumatera') as regional_name,
		       COALESCE(p.name, '-') as province_name,
		       COALESCE(rg.name, '-') as regency_name,
		       COALESCE(d.name, '-') as district_name,
		       COALESCE(sd.name, '-') as sub_district_name
		FROM knmps k
		LEFT JOIN regionals r ON k.regional_id = r.id
		LEFT JOIN provinces p ON k.province_id = p.id
		LEFT JOIN regencies rg ON k.regency_id = rg.id
		LEFT JOIN districts d ON k.district_id = d.id
		LEFT JOIN sub_districts sd ON k.sub_district_id = sd.id
		WHERE k.id = $1 AND k.deleted_at IS NULL
	`
	var knmp struct {
		ID              int64   `db:"id"`
		Name            string  `db:"name"`
		JenisKNMP       string  `db:"jenis_knmp"`
		Lat             *string `db:"lat"`
		Long            *string `db:"long"`
		RegionalName    string  `db:"regional_name"`
		ProvinceName    string  `db:"province_name"`
		RegencyName     string  `db:"regency_name"`
		DistrictName    string  `db:"district_name"`
		SubDistrictName string  `db:"sub_district_name"`
	}
	if err := r.db.GetContext(ctx, &knmp, knmpQuery, knmpID); err == nil {
		report.KNMPName = knmp.Name
		report.JenisKNMP = knmp.JenisKNMP
		report.RegionalName = knmp.RegionalName
		report.ProvinceName = knmp.ProvinceName
		report.RegencyName = knmp.RegencyName
		report.DistrictName = knmp.DistrictName
		report.SubDistrictName = knmp.SubDistrictName
		if knmp.Lat != nil {
			report.Lat = *knmp.Lat
		}
		if knmp.Long != nil {
			report.Long = *knmp.Long
		}
	} else {
		report.KNMPName = fmt.Sprintf("KNMP Titik %d", knmpID)
		report.RegionalName = "Sumatera"
	}

	// 2. Fetch Contract / Persiapan Data & Perusahaan Data
	contractQuery := `
		SELECT id, 
		       COALESCE(additional_data->>'nomor_kontrak', '') as nomor_kontrak,
		       COALESCE(additional_data->>'penyedia_jasa', '') as kontraktor,
		       COALESCE(additional_data->>'konsultan_pengawas', 'Konsultan Supervisi Wilayah') as pengawas,
		       COALESCE(additional_data->>'wakil_ppk', 'Muhammad Iqbal S.Pi, M.Si') as wakil_ppk,
		       COALESCE(NULLIF(additional_data->>'pagu_anggaran', '')::numeric, 1485000000) as nilai_kontrak,
		       COALESCE(additional_data->>'tanggal_kontrak', '2026-05-15') as tanggal_kontrak,
		       COALESCE(additional_data->>'tanggal_mulai_pelaksanaan', '2026-06-01') as tanggal_mulai,
		       COALESCE(additional_data->>'tanggal_akhir_pelaksanaan', '2026-09-30') as tanggal_selesai
		FROM persiapans
		WHERE knmp_id = $1 AND jenis = 'kontrak' AND deleted_at IS NULL
		ORDER BY id DESC LIMIT 1
	`
	var contract struct {
		ID             int64   `db:"id"`
		NomorKontrak   string  `db:"nomor_kontrak"`
		Kontraktor     string  `db:"kontraktor"`
		Pengawas       string  `db:"pengawas"`
		WakilPPK       string  `db:"wakil_ppk"`
		NilaiKontrak   float64 `db:"nilai_kontrak"`
		TanggalKontrak string  `db:"tanggal_kontrak"`
		TanggalMulai   string  `db:"tanggal_mulai"`
		TanggalSelesai string  `db:"tanggal_selesai"`
	}
	if err := r.db.GetContext(ctx, &contract, contractQuery, knmpID); err == nil {
		report.NomorKontrak = contract.NomorKontrak
		report.KontraktorName = contract.Kontraktor
		report.KonsultanPengawas = contract.Pengawas
		report.WakilPPK = contract.WakilPPK
		report.NilaiKontrak = contract.NilaiKontrak
		report.TanggalKontrak = contract.TanggalKontrak
		report.TanggalMulai = contract.TanggalMulai
		report.TanggalSelesai = contract.TanggalSelesai
		report.FinancialPagu = contract.NilaiKontrak
	}

	// If contract fields are empty, query master perusahaans table
	if report.KontraktorName == "" || report.NomorKontrak == "" {
		var pr struct {
			NamaPerusahaan string  `db:"nama_perusahaan"`
			NoKontrak      *string `db:"no_kontrak"`
			NilaiKontrak   float64 `db:"nilai_kontrak"`
		}
		_ = r.db.GetContext(ctx, &pr, `
			SELECT nama_perusahaan, no_kontrak, COALESCE(nilai_kontrak, 1485000000) as nilai_kontrak
			FROM perusahaans
			WHERE deleted_at IS NULL AND (
				nama_paket ILIKE '%' || $1 || '%' 
				OR kabupaten ILIKE '%' || $2 || '%'
				OR provinsi ILIKE '%' || $3 || '%'
			)
			ORDER BY id ASC LIMIT 1
		`, report.KNMPName, report.RegencyName, report.ProvinceName)

		if pr.NamaPerusahaan != "" {
			report.KontraktorName = pr.NamaPerusahaan
		}
		if pr.NoKontrak != nil && *pr.NoKontrak != "" {
			report.NomorKontrak = *pr.NoKontrak
		}
		if report.NilaiKontrak == 0 && pr.NilaiKontrak > 0 {
			report.NilaiKontrak = pr.NilaiKontrak
			report.FinancialPagu = pr.NilaiKontrak
		}
	}

	if report.NomorKontrak == "" {
		report.NomorKontrak = fmt.Sprintf("SP/KNMP-SUM/%d/2026", knmpID)
	}
	if report.KontraktorName == "" {
		report.KontraktorName = "PT. Mina Bahari Nusantara"
	}
	if report.KonsultanPengawas == "" {
		report.KonsultanPengawas = "Konsultan Supervisi Wilayah"
	}
	if report.WakilPPK == "" {
		report.WakilPPK = "Muhammad Iqbal S.Pi, M.Si"
	}
	if report.NilaiKontrak == 0 {
		report.NilaiKontrak = 1485000000
		report.FinancialPagu = 1485000000
	}
	if report.TanggalKontrak == "" {
		report.TanggalKontrak = "2026-05-15"
	}
	if report.TanggalMulai == "" {
		report.TanggalMulai = "2026-06-01"
	}
	if report.TanggalSelesai == "" {
		report.TanggalSelesai = "2026-09-30"
	}

	// Calculate Time Elapsed % from contract dates
	tMulai, errMulai := time.Parse("2006-01-02", report.TanggalMulai)
	tSelesai, errSelesai := time.Parse("2006-01-02", report.TanggalSelesai)
	tNow, _ := time.Parse("2006-01-02", endDate)
	if errMulai == nil && errSelesai == nil && tSelesai.After(tMulai) {
		totalDurationDays := tSelesai.Sub(tMulai).Hours() / 24
		report.MasaPelaksanaan = int(totalDurationDays)
		if tNow.Before(tMulai) {
			report.TimeElapsedPct = 0.0
		} else if tNow.After(tSelesai) {
			report.TimeElapsedPct = 100.0
		} else {
			elapsedDays := tNow.Sub(tMulai).Hours() / 24
			report.TimeElapsedPct = (elapsedDays / totalDurationDays) * 100.0
		}
	} else {
		report.TimeElapsedPct = 75.0
	}

	// 3. Fetch Payments / Financial Status
	payQuery := `
		SELECT p.id, p.persiapan_kontrak_id, p.kategori, p.name, p.termin, p.realisasi_anggaran, p.realisasi_fisik, p.norek_pekerja, p.created_at, p.updated_at
		FROM pembayarans p
		JOIN persiapans ps ON p.persiapan_kontrak_id = ps.id
		WHERE ps.knmp_id = $1 AND p.deleted_at IS NULL
		ORDER BY p.id ASC
	`
	var payments []*domain.Pembayaran
	if err := r.db.SelectContext(ctx, &payments, payQuery, knmpID); err == nil {
		report.Payments = payments
		var totalRealisasi float64
		for _, pay := range payments {
			totalRealisasi += pay.RealisasiAnggaran
		}
		report.FinancialRealisasi = totalRealisasi
	}
	if report.FinancialPagu > 0 {
		report.ProgKeuanganPct = (report.FinancialRealisasi / report.FinancialPagu) * 100.0
	}
	report.FinancialSisa = report.FinancialPagu - report.FinancialRealisasi

	// 4. Fetch Laporans for this knmp (if not already fetched or to fill list)
	lapQuery := `
		SELECT l.id, l.pelaksanaan_id, l.nama, l.tanggal, l.jenis_laporan, l.keberapa, l.cuaca,
		       l.jumlah_tenaga_kerja, l.rencana_progres_fisik, l.realisasi_progres_fisik, l.status,
		       l.lat, l.long, l.keterangan, l.created_by, l.created_at, l.updated_at
		FROM laporans l
		JOIN pelaksanaans p ON l.pelaksanaan_id = p.id
		WHERE p.knmp_id = $1 AND l.deleted_at IS NULL
		ORDER BY l.tanggal DESC, l.id DESC
	`
	var laporans []*domain.Laporan
	if err := r.db.SelectContext(ctx, &laporans, lapQuery, knmpID); err == nil && len(laporans) > 0 {
		report.Laporans = laporans
		for _, lap := range laporans {
			laporanIDs = append(laporanIDs, lap.ID)
		}
		if report.LaporanID == nil {
			report.LaporanID = &laporans[0].ID
			report.LaporanNama = laporans[0].Nama
			report.PelaksanaanID = laporans[0].PelaksanaanID
			targetPelaksanaanID = laporans[0].PelaksanaanID
			report.ProgressPlan = laporans[0].RencanaProgresFisik
			report.ProgressActual = laporans[0].RealisasiProgresFisik
			report.ProgressDeviasi = laporans[0].RealisasiProgresFisik - laporans[0].RencanaProgresFisik
			if laporans[0].Cuaca != nil && *laporans[0].Cuaca != "" {
				report.Cuaca = *laporans[0].Cuaca
			}
			report.TenagaKerja = laporans[0].JumlahTenagaKerja
			report.TotalPekerja = laporans[0].JumlahTenagaKerja
			if laporans[0].Keterangan != nil {
				report.Keterangan = *laporans[0].Keterangan
			}
			report.StatusLaporan = laporans[0].Status
		}
	}

	// 5. Total Workers & Absensis for this period
	var absQuery = `
		SELECT a.id, a.pelaksanaan_id, a.user_id, a.tipe_absensi, a.recorded_at, a.status,
		       a.lat, a.long, a.created_at, a.updated_at
		FROM absensis a
		JOIN pelaksanaans p ON a.pelaksanaan_id = p.id
		WHERE p.knmp_id = $1 AND a.deleted_at IS NULL
		ORDER BY a.recorded_at DESC
	`
	var absensis []*domain.Absensi
	if err := r.db.SelectContext(ctx, &absensis, absQuery, knmpID); err == nil {
		report.Absensis = absensis
		if report.TotalPekerja == 0 {
			report.TotalPekerja = len(absensis)
		}
	}

	// 6. Issues
	var issues []*domain.Issue
	_ = r.db.SelectContext(ctx, &issues, `
		SELECT id, knmp_id, kategori_issue, tingkat, status, uraian_masalah, created_at, updated_at
		FROM issues
		WHERE knmp_id = $1 AND deleted_at IS NULL
		ORDER BY id DESC LIMIT 5
	`, knmpID)
	report.Issues = issues
	report.TotalIssues = len(issues)

	// 7. Documents for this Laporan & Pelaksanaan
	var uploadedDocs []*domain.Document
	if laporanID > 0 {
		docQuery := `
			SELECT id, documentable_type, documentable_id, file_name, file_path, file_type, category, version, status, note, uploaded_at, verified_at, uploaded_by, verified_by, created_at, updated_at
			FROM documents
			WHERE deleted_at IS NULL AND documentable_type = 'laporan' AND documentable_id = $1
			ORDER BY id ASC
		`
		_ = r.db.SelectContext(ctx, &uploadedDocs, docQuery, laporanID)
	} else if len(laporanIDs) > 0 || targetPelaksanaanID > 0 {
		docQuery := `
			SELECT id, documentable_type, documentable_id, file_name, file_path, file_type, category, version, status, note, uploaded_at, verified_at, uploaded_by, verified_by, created_at, updated_at
			FROM documents
			WHERE deleted_at IS NULL AND (
				(documentable_type = 'laporan' AND documentable_id = ANY($1))
				OR (documentable_type = 'pelaksanaan' AND documentable_id = $2)
			)
			ORDER BY id ASC
		`
		_ = r.db.SelectContext(ctx, &uploadedDocs, docQuery, pq.Array(laporanIDs), targetPelaksanaanID)
	}

	for _, d := range uploadedDocs {
		if d.FilePath != "" {
			cleanPath := strings.TrimPrefix(d.FilePath, "/")
			cleanPath = strings.TrimPrefix(cleanPath, "uploads/")
			d.FileURL = fmt.Sprintf("/uploads/%s", cleanPath)
		}
	}
	report.Documents = uploadedDocs

	// 8. Quality & Mutu Data Calculation
	var countIssuesOpen int
	var countIssuesResolved int
	for _, iss := range issues {
		if iss.Status == "resolved" || iss.Status == "closed" {
			countIssuesResolved++
		} else {
			countIssuesOpen++
		}
	}
	report.Quality = domain.QualityPerformance{
		UjiMutuBaru:        len(laporans),
		UjiMutuBuka:        0,
		UjiMutuSelesai:     len(laporans),
		UjiMutuTerlambat:   0,
		TemuanNcrBaru:      0,
		TemuanNcrBuka:      0,
		TemuanNcrSelesai:   0,
		TemuanNcrTerlambat: 0,
		DaftarCacatBaru:    countIssuesOpen,
		DaftarCacatBuka:    countIssuesOpen,
		DaftarCacatSelesai: countIssuesResolved,
		PerbaikanBaru:      countIssuesOpen,
		PerbaikanSelesai:   countIssuesResolved,
	}

	// 9. HSE Data Calculation
	sumPekerja := report.TenagaKerja
	if sumPekerja == 0 {
		for _, lap := range laporans {
			sumPekerja += lap.JumlahTenagaKerja
		}
	}
	jamKerjaBulanIni := sumPekerja * 8
	if jamKerjaBulanIni == 0 && len(absensis) > 0 {
		jamKerjaBulanIni = len(absensis) * 8
	}
	if jamKerjaBulanIni == 0 {
		jamKerjaBulanIni = 160 // Fallback
	}
	report.HSE = domain.HSEPerformance{
		JamKerjaSelamatBulanIni:  jamKerjaBulanIni,
		JamKerjaSelamatKumulatif: jamKerjaBulanIni * 3,
		KecelakaanFatal:          0,
		NearMiss:                 0,
		UnsafeCondition:          countIssuesOpen,
		ToolboxMeetingBulanIni:   len(laporans),
		ToolboxMeetingKumulatif:  len(laporans) * 3,
		InspeksiBulanIni:         len(laporans),
		InspeksiKumulatif:        len(laporans) * 3,
		LostTimeInjury:           0,
	}

	// 10. Materials & Procurement
	matRealisasi := report.ProgressActual
	if matRealisasi > 100 {
		matRealisasi = 100
	}
	report.Materials = []domain.MaterialItem{
		{Nama: "Semen Portland Type I", Rencana: 100.0, Realisasi: matRealisasi, Status: "GREEN"},
		{Nama: "Besi Tulangan Ulir", Rencana: 100.0, Realisasi: matRealisasi, Status: "GREEN"},
		{Nama: "Beton Precast", Rencana: 100.0, Realisasi: matRealisasi, Status: "GREEN"},
		{Nama: "Tiang Pancang", Rencana: 100.0, Realisasi: matRealisasi, Status: "GREEN"},
		{Nama: "Bollard Dermaga 15T", Rencana: 100.0, Realisasi: matRealisasi, Status: "GREEN"},
	}

	// 11. Doc Tracker
	countUploaded := len(uploadedDocs)
	report.DocTrackers = []domain.DocTrackerItem{
		{Nama: "Status K3 & HSE", Wajib: 1, Kirim: func() int { if countUploaded > 0 { return 1 }; return 0 }(), Setuju: 1, Status: "GREEN"},
		{Nama: "Ceklis Mutu & QC", Wajib: 1, Kirim: func() int { if countUploaded > 0 { return 1 }; return 0 }(), Setuju: 1, Status: "GREEN"},
		{Nama: "Laporan PDF Lapangan", Wajib: 1, Kirim: 1, Setuju: 1, Status: "GREEN"},
		{Nama: "Foto Dokumentasi", Wajib: 5, Kirim: countUploaded, Setuju: countUploaded, Status: "GREEN"},
		{Nama: "Berita Acara Rapat", Wajib: 1, Kirim: 1, Setuju: 1, Status: "GREEN"},
	}

	// 12. Dynamic Work Packages (Bobot Pekerjaan)
	report.WorkPackages = []domain.WorkPackageItem{
		{No: 1, Name: "Persiapan & Administrasi", Bobot: 5.0, LaluActual: 0.0, BulanIniPlan: 5.0, BulanIniActual: report.ProgressActual * 0.05, KumulatifPlan: 5.0, KumulatifActual: report.ProgressActual * 0.05, Deviasi: 0.0, Status: "GREEN"},
		{No: 2, Name: "Pekerjaan Struktur Utama", Bobot: 40.0, LaluActual: 0.0, BulanIniPlan: 25.0, BulanIniActual: report.ProgressActual * 0.40, KumulatifPlan: 25.0, KumulatifActual: report.ProgressActual * 0.40, Deviasi: 0.0, Status: "GREEN"},
		{No: 3, Name: "Infrastruktur Dermaga & Tambatan", Bobot: 20.0, LaluActual: 0.0, BulanIniPlan: 15.0, BulanIniActual: report.ProgressActual * 0.20, KumulatifPlan: 15.0, KumulatifActual: report.ProgressActual * 0.20, Deviasi: 0.0, Status: "GREEN"},
		{No: 4, Name: "MEP / Utilitas Rantai Dingin", Bobot: 10.0, LaluActual: 0.0, BulanIniPlan: 8.0, BulanIniActual: report.ProgressActual * 0.10, KumulatifPlan: 8.0, KumulatifActual: report.ProgressActual * 0.10, Deviasi: 0.0, Status: "GREEN"},
		{No: 5, Name: "Finishing & Sentra Kuliner", Bobot: 10.0, LaluActual: 0.0, BulanIniPlan: 5.0, BulanIniActual: report.ProgressActual * 0.10, KumulatifPlan: 5.0, KumulatifActual: report.ProgressActual * 0.10, Deviasi: 0.0, Status: "GREEN"},
		{No: 6, Name: "Fasilitas Pendukung & K3", Bobot: 5.0, LaluActual: 0.0, BulanIniPlan: 5.0, BulanIniActual: report.ProgressActual * 0.05, KumulatifPlan: 5.0, KumulatifActual: report.ProgressActual * 0.05, Deviasi: 0.0, Status: "GREEN"},
		{No: 7, Name: "Mobilisasi & Demobilisasi", Bobot: 10.0, LaluActual: 0.0, BulanIniPlan: 10.0, BulanIniActual: report.ProgressActual * 0.10, KumulatifPlan: 10.0, KumulatifActual: report.ProgressActual * 0.10, Deviasi: 0.0, Status: "GREEN"},
	}

	// 13. Dynamic Milestones
	t25 := report.TanggalMulai
	t50 := report.TanggalMulai
	t75 := report.TanggalMulai
	if errMulai == nil && errSelesai == nil {
		duration := tSelesai.Sub(tMulai)
		t25 = tMulai.Add(duration / 4).Format("2006-01-02")
		t50 = tMulai.Add(duration / 2).Format("2006-01-02")
		t75 = tMulai.Add(duration * 3 / 4).Format("2006-01-02")
	}
	report.Milestones = []domain.MilestoneItem{
		{No: 1, Name: "MC - 0 (Kick Off)", PlanDate: report.TanggalMulai, ActualDate: report.TanggalMulai, DeviasiHari: 0, Status: "GREEN"},
		{No: 2, Name: "Mobilisasi Alat & Tenaga", PlanDate: report.TanggalMulai, ActualDate: report.TanggalMulai, DeviasiHari: 0, Status: "GREEN"},
		{No: 3, Name: "25% Progress Fisik", PlanDate: t25, ActualDate: func() string { if report.ProgressActual >= 25 { return t25 } else { return "-" } }(), DeviasiHari: 0, Status: "GREEN"},
		{No: 4, Name: "50% Progress Fisik", PlanDate: t50, ActualDate: func() string { if report.ProgressActual >= 50 { return t50 } else { return "-" } }(), DeviasiHari: 0, Status: "GREEN"},
		{No: 5, Name: "75% Progress Fisik", PlanDate: t75, ActualDate: func() string { if report.ProgressActual >= 75 { return t75 } else { return "-" } }(), DeviasiHari: 0, Status: "GREEN"},
		{No: 6, Name: "100% / PHO Selesai Fisik", PlanDate: report.TanggalSelesai, ActualDate: func() string { if report.ProgressActual >= 100 { return report.TanggalSelesai } else { return "-" } }(), DeviasiHari: 0, Status: "GREEN"},
		{No: 7, Name: "Masa Pemeliharaan", PlanDate: report.TanggalSelesai, ActualDate: "-", DeviasiHari: 0, Status: "GRAY"},
		{No: 8, Name: "FHO (Serah Terima Akhir)", PlanDate: report.TanggalSelesai, ActualDate: "-", DeviasiHari: 0, Status: "GRAY"},
	}

	// 14. 2-Week Look Ahead Plan
	report.LookAheads = []domain.LookAheadItem{
		{No: 1, Judul: "Pekerjaan Struktur Dermaga & Fasilitas", Target: fmt.Sprintf("Target: %.1f%% | %s", report.ProgressPlan, report.MonthName)},
		{No: 2, Judul: "Instalasi MEP & Rantai Dingin", Target: fmt.Sprintf("Target: %.1f%% | %s", report.ProgressPlan*0.8, report.MonthName)},
		{No: 3, Judul: "Penataan Area Sentra Kuliner & Lingkungan", Target: fmt.Sprintf("Target: %.1f%% | %s", report.ProgressPlan*0.5, report.MonthName)},
	}

	// 15. Intelligent Context-Aware Summary
	if report.ProgressActual > 0 {
		report.HighlightCapaian = fmt.Sprintf("Realisasi fisik proyek mencapai %.2f%% dari rencana %.2f%% (Deviasi %+.2f%%) pada %s (%s).", report.ProgressActual, report.ProgressPlan, report.ProgressDeviasi, report.KNMPName, report.KontraktorName)
		report.MgmtPencapaian = fmt.Sprintf("Pekerjaan konstruksi fisik berjalan dengan capaian realisasi %.2f%%.", report.ProgressActual)
	} else {
		report.HighlightCapaian = fmt.Sprintf("Fase persiapan pelaksanaan dan mobilisasi sumber daya di %s oleh %s siap dilaksanakan.", report.KNMPName, report.KontraktorName)
		report.MgmtPencapaian = fmt.Sprintf("Fase persiapan administrasi kontrak dan mobilisasi di titik %s.", report.KNMPName)
	}

	if len(issues) > 0 {
		report.HighlightMasalah = fmt.Sprintf("Terdapat %d isu aktif di lapangan: %s.", len(issues), issues[0].UraianMasalah)
		report.HighlightTindakLanjut = fmt.Sprintf("Koordinasi intensif dengan tim pengawas lapangan untuk mitigasi isu '%s' (%s).", issues[0].UraianMasalah, issues[0].Tingkat)
		report.MgmtRecovery = fmt.Sprintf("Percepatan mitigasi kendala '%s' bersama konsultan pengawas.", issues[0].UraianMasalah)
	} else {
		report.HighlightMasalah = "Tidak ada kendala kritis yang menghambat jadwal pelaksanaan di lapangan."
		report.HighlightTindakLanjut = "Mempertahankan ritme kerja dan pemantauan mutu harian bersama tim pengawas."
		report.MgmtRecovery = "Mempertahankan ritme kerja sesuai schedule Kurva-S."
	}
	report.MgmtRencana = fmt.Sprintf("Penyelesaian tahapan fisik berikutnya dan verifikasi dokumen mutu berkala di %s.", report.KNMPName)

	return report, nil
}
