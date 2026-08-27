package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type knmpRepo struct {
	db *sqlx.DB
}

func NewKnmpRepo(db *sqlx.DB) repository.KnmpRepository {
	return &knmpRepo{db: db}
}

func (r *knmpRepo) GetByID(ctx context.Context, id int64) (*domain.Knmp, error) {
	var k domain.Knmp
	query := `
		SELECT k.id, k.regional_id, k.province_id, k.regency_id, k.district_id, k.sub_district_id,
		       k.name, k.jenis_knmp, k.lat, k.long, k.status, k.created_at, k.updated_at,
		       r.name as regional_name, p.name as province_name, rg.name as regency_name,
		       d.name as district_name, sd.name as sub_district_name
		FROM knmps k
		LEFT JOIN regionals r ON k.regional_id = r.id
		LEFT JOIN provinces p ON k.province_id = p.id
		LEFT JOIN regencies rg ON k.regency_id = rg.id
		LEFT JOIN districts d ON k.district_id = d.id
		LEFT JOIN sub_districts sd ON k.sub_district_id = sd.id
		WHERE k.id = $1
	`
	err := r.db.GetContext(ctx, &k, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get knmp by id: %w", err)
	}
	return &k, nil
}

func (r *knmpRepo) List(ctx context.Context, filter repository.KnmpFilter) ([]*domain.Knmp, error) {
	var results []*domain.Knmp
	query := `
		SELECT k.id, k.regional_id, k.province_id, k.regency_id, k.district_id, k.sub_district_id,
		       k.name, k.jenis_knmp, k.lat, k.long, k.status, k.created_at, k.updated_at,
		       r.name as regional_name, p.name as province_name, rg.name as regency_name,
		       d.name as district_name, sd.name as sub_district_name
		FROM knmps k
		LEFT JOIN regionals r ON k.regional_id = r.id
		LEFT JOIN provinces p ON k.province_id = p.id
		LEFT JOIN regencies rg ON k.regency_id = rg.id
		LEFT JOIN districts d ON k.district_id = d.id
		LEFT JOIN sub_districts sd ON k.sub_district_id = sd.id
		WHERE 1=1
	`
	var args []any
	argIdx := 1

	if filter.Search != "" {
		query += fmt.Sprintf(" AND k.name ILIKE $%d", argIdx)
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}
	if filter.RegionalID != nil {
		query += fmt.Sprintf(" AND k.regional_id = $%d", argIdx)
		args = append(args, *filter.RegionalID)
		argIdx++
	}
	if filter.ProvinceID != nil {
		query += fmt.Sprintf(" AND k.province_id = $%d", argIdx)
		args = append(args, *filter.ProvinceID)
		argIdx++
	}
	if filter.RegencyID != nil {
		query += fmt.Sprintf(" AND k.regency_id = $%d", argIdx)
		args = append(args, *filter.RegencyID)
		argIdx++
	}
	if filter.DistrictID != nil {
		query += fmt.Sprintf(" AND k.district_id = $%d", argIdx)
		args = append(args, *filter.DistrictID)
		argIdx++
	}
	if filter.SubDistrictID != nil {
		query += fmt.Sprintf(" AND k.sub_district_id = $%d", argIdx)
		args = append(args, *filter.SubDistrictID)
		argIdx++
	}
	if filter.JenisKnmp != "" {
		query += fmt.Sprintf(" AND k.jenis_knmp = $%d", argIdx)
		args = append(args, filter.JenisKnmp)
		argIdx++
	}
	if filter.Status != "" {
		query += fmt.Sprintf(" AND k.status = $%d", argIdx)
		args = append(args, filter.Status)
		argIdx++
	}
	if len(filter.UserKnmpIDs) > 0 {
		q, inArgs, err := sqlx.In(" AND k.id IN (?)", filter.UserKnmpIDs)
		if err == nil {
			query += r.db.Rebind(q)
			args = append(args, inArgs...)
		}
	}

	query += " ORDER BY k.id ASC"

	if filter.Limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", filter.Limit)
		if filter.Offset > 0 {
			query += fmt.Sprintf(" OFFSET %d", filter.Offset)
		}
	}

	err := r.db.SelectContext(ctx, &results, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list knmps: %w", err)
	}
	return results, nil
}

func (r *knmpRepo) Create(ctx context.Context, knmp *domain.Knmp) error {
	query := `
		INSERT INTO knmps (regional_id, province_id, regency_id, district_id, sub_district_id, name, jenis_knmp, lat, long, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(ctx, query,
		knmp.RegionalID, knmp.ProvinceID, knmp.RegencyID, knmp.DistrictID, knmp.SubDistrictID,
		knmp.Name, knmp.JenisKnmp, knmp.Lat, knmp.Long, knmp.Status,
	).Scan(&knmp.ID, &knmp.CreatedAt, &knmp.UpdatedAt)
}

func (r *knmpRepo) Update(ctx context.Context, knmp *domain.Knmp) error {
	query := `
		UPDATE knmps
		SET regional_id = $1, province_id = $2, regency_id = $3, district_id = $4, sub_district_id = $5,
		    name = $6, jenis_knmp = $7, lat = $8, long = $9, status = $10, updated_at = NOW()
		WHERE id = $11
	`
	_, err := r.db.ExecContext(ctx, query,
		knmp.RegionalID, knmp.ProvinceID, knmp.RegencyID, knmp.DistrictID, knmp.SubDistrictID,
		knmp.Name, knmp.JenisKnmp, knmp.Lat, knmp.Long, knmp.Status, knmp.ID,
	)
	return err
}

func (r *knmpRepo) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM knmps WHERE id = $1`, id)
	return err
}

func (r *knmpRepo) GetWidgetStats(ctx context.Context) (map[string]any, error) {
	stats := make(map[string]any)

	// 1. Total Lokasi & Status Counts
	var totalKnmps int
	_ = r.db.GetContext(ctx, &totalKnmps, `SELECT COUNT(*) FROM knmps`)
	stats["total_knmps"] = totalKnmps

	var onTrack int
	_ = r.db.GetContext(ctx, &onTrack, `SELECT COUNT(*) FROM knmps WHERE status = 'aktif' OR status = 'on_track'`)
	stats["on_track"] = onTrack

	var perluPerhatian int
	_ = r.db.GetContext(ctx, &perluPerhatian, `SELECT COUNT(*) FROM knmps WHERE status = 'perlu_perhatian'`)
	stats["perlu_perhatian"] = perluPerhatian

	var kritis int
	_ = r.db.GetContext(ctx, &kritis, `SELECT COUNT(*) FROM knmps WHERE status = 'kritis'`)
	stats["kritis"] = kritis

	var pemeliharaan int
	_ = r.db.GetContext(ctx, &pemeliharaan, `SELECT COUNT(*) FROM knmps WHERE status = 'pemeliharaan'`)
	stats["pemeliharaan"] = pemeliharaan

	var belumMulai int
	_ = r.db.GetContext(ctx, &belumMulai, `SELECT COUNT(*) FROM knmps WHERE status = 'nonaktif' OR status = 'belum_mulai'`)
	stats["belum_mulai"] = belumMulai

	// 2. Pelaksanaan, Workers & Issues
	var totalPelaksanaan int
	_ = r.db.GetContext(ctx, &totalPelaksanaan, `SELECT COUNT(*) FROM pelaksanaans`)
	stats["total_pelaksanaan"] = totalPelaksanaan

	var totalWorkers int
	_ = r.db.GetContext(ctx, &totalWorkers, `SELECT COALESCE(SUM(jumlah_pekerja), 0) FROM absensis`)
	stats["total_workers"] = totalWorkers

	var todayWorkers int
	_ = r.db.GetContext(ctx, &todayWorkers, `SELECT COALESCE(SUM(jumlah_pekerja), 0) FROM absensis WHERE DATE(tanggal) = CURRENT_DATE`)
	stats["today_workers"] = todayWorkers

	var totalIssues int
	_ = r.db.GetContext(ctx, &totalIssues, `SELECT COUNT(*) FROM issues WHERE status != 'selesai'`)
	stats["total_issues"] = totalIssues

	// 3. Serapan Keuangan
	var pagu float64
	_ = r.db.GetContext(ctx, &pagu, `SELECT COALESCE(SUM(realisasi_anggaran), 0) FROM pembayarans WHERE termin ILIKE '%Anggaran%' OR termin ILIKE '%Pagu%'`)
	if pagu == 0 {
		_ = r.db.GetContext(ctx, &pagu, `SELECT COALESCE(SUM(realisasi_anggaran), 0) FROM pembayarans`)
	}

	var realisasi float64
	_ = r.db.GetContext(ctx, &realisasi, `SELECT COALESCE(SUM(realisasi_anggaran), 0) FROM pembayarans WHERE termin NOT ILIKE '%Anggaran%' AND termin NOT ILIKE '%Pagu%'`)

	percentage := 0.0
	if pagu > 0 {
		percentage = (realisasi / pagu) * 100
		if percentage > 100 {
			percentage = 100
		}
	}
	remainingPercentage := 100.0 - percentage
	if remainingPercentage < 0 {
		remainingPercentage = 0
	}

	stats["finance"] = map[string]any{
		"pagu":                 pagu,
		"realisasi":            realisasi,
		"percentage":           percentage,
		"remaining_percentage": remainingPercentage,
	}

	// 4. Deviasi Proyek
	var deviasi10 int
	_ = r.db.GetContext(ctx, &deviasi10, `SELECT COUNT(*) FROM laporans WHERE ABS(COALESCE(realisasi_bobot, 0) - COALESCE(rencana_bobot, 0)) > 10`)
	var deviasi20 int
	_ = r.db.GetContext(ctx, &deviasi20, `SELECT COUNT(*) FROM laporans WHERE ABS(COALESCE(realisasi_bobot, 0) - COALESCE(rencana_bobot, 0)) > 20`)
	stats["deviation_10"] = deviasi10
	stats["deviation_20"] = deviasi20

	// 5. Verifikasi Approval
	var pengawasApproved int
	_ = r.db.GetContext(ctx, &pengawasApproved, `SELECT COUNT(*) FROM verifikasis WHERE verified_by_pengawas_at IS NOT NULL`)
	var timValidasiApproved int
	_ = r.db.GetContext(ctx, &timValidasiApproved, `SELECT COUNT(*) FROM verifikasis WHERE verified_by_wakil_ppk_at IS NOT NULL`)
	var ppkApproved int
	_ = r.db.GetContext(ctx, &ppkApproved, `SELECT COUNT(*) FROM verifikasis WHERE status = 'terverifikasi'`)
	var totalDocs int
	_ = r.db.GetContext(ctx, &totalDocs, `SELECT COUNT(*) FROM documents`)

	stats["approval"] = map[string]any{
		"pengawas":     pengawasApproved,
		"tim_validasi": timValidasiApproved,
		"ppk":          ppkApproved,
		"total_docs":   totalDocs,
	}

	// 6. Tahapan Proyeksi
	var totalKontrak int
	_ = r.db.GetContext(ctx, &totalKontrak, `SELECT COUNT(*) FROM persiapans WHERE jenis = 'kontrak'`)
	var totalPcm int
	_ = r.db.GetContext(ctx, &totalPcm, `SELECT COUNT(*) FROM pcms`)
	var totalLapangan int
	_ = r.db.GetContext(ctx, &totalLapangan, `SELECT COUNT(*) FROM persiapans WHERE jenis = 'lapangan'`)
	var totalLaporan int
	_ = r.db.GetContext(ctx, &totalLaporan, `SELECT COUNT(*) FROM laporans`)

	stats["stages"] = map[string]int{
		"perencanaan": totalKnmps,
		"kontrak":     totalKontrak,
		"pcm":         totalPcm,
		"lapangan":    totalLapangan,
		"pelaksanaan": totalPelaksanaan,
		"laporan":     totalLaporan,
		"pho":         0,
		"fho":         0,
	}

	return stats, nil
}

func (r *knmpRepo) ListMap(ctx context.Context) ([]*domain.Knmp, error) {
	return r.List(ctx, repository.KnmpFilter{})
}

func (r *knmpRepo) ListPeriodes(ctx context.Context) ([]*domain.Periode, error) {
	results := make([]*domain.Periode, 0)
	err := r.db.SelectContext(ctx, &results, `SELECT id, year, tanggal_mulai, tanggal_akhir, created_at, updated_at FROM periodes ORDER BY year DESC`)
	return results, err
}

func (r *knmpRepo) CreatePeriode(ctx context.Context, p *domain.Periode) error {
	query := `INSERT INTO periodes (year, tanggal_mulai, tanggal_akhir, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, created_at, updated_at`
	return r.db.QueryRowContext(ctx, query, p.Year, p.TanggalMulai, p.TanggalAkhir).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *knmpRepo) UpdatePeriode(ctx context.Context, p *domain.Periode) error {
	query := `UPDATE periodes SET year = $1, tanggal_mulai = $2, tanggal_akhir = $3, updated_at = NOW() WHERE id = $4`
	_, err := r.db.ExecContext(ctx, query, p.Year, p.TanggalMulai, p.TanggalAkhir, p.ID)
	return err
}

func (r *knmpRepo) DeletePeriode(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM periodes WHERE id = $1`, id)
	return err
}

func (r *knmpRepo) ListJenisBangunans(ctx context.Context, activeOnly bool) ([]*domain.JenisBangunan, error) {
	results := make([]*domain.JenisBangunan, 0)
	query := `SELECT id, nama, deskripsi, is_active, created_at, updated_at FROM jenis_bangunans`
	if activeOnly {
		query += ` WHERE is_active = true`
	}
	query += ` ORDER BY nama ASC`
	err := r.db.SelectContext(ctx, &results, query)
	return results, err
}

func (r *knmpRepo) CreateJenisBangunan(ctx context.Context, jb *domain.JenisBangunan) error {
	query := `INSERT INTO jenis_bangunans (nama, deskripsi, is_active, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, created_at, updated_at`
	return r.db.QueryRowContext(ctx, query, jb.Nama, jb.Deskripsi, jb.IsActive).Scan(&jb.ID, &jb.CreatedAt, &jb.UpdatedAt)
}

func (r *knmpRepo) UpdateJenisBangunan(ctx context.Context, jb *domain.JenisBangunan) error {
	query := `UPDATE jenis_bangunans SET nama = $1, deskripsi = $2, is_active = $3, updated_at = NOW() WHERE id = $4`
	_, err := r.db.ExecContext(ctx, query, jb.Nama, jb.Deskripsi, jb.IsActive, jb.ID)
	return err
}

func (r *knmpRepo) DeleteJenisBangunan(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM jenis_bangunans WHERE id = $1`, id)
	return err
}
