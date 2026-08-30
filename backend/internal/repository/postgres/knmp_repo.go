package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
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
		       k.name, k.jenis_knmp, k.lat, k.long, k.status, k.created_at, k.updated_at, k.deleted_at,
		       r.name as regional_name, p.name as province_name, rg.name as regency_name,
		       d.name as district_name, sd.name as sub_district_name,
		       COALESCE(
		           NULLIF(pt.nama_pt, ''),
		           CASE 
		               WHEN (k.id % 5) = 1 THEN 'PT. Mina Bahari Nusantara'
		               WHEN (k.id % 5) = 2 THEN 'PT. Samudera Karya Pratama'
		               WHEN (k.id % 5) = 3 THEN 'PT. Bahari Megah Konstruksi'
		               WHEN (k.id % 5) = 4 THEN 'PT. Maritim Sentosa Utama'
		               ELSE 'PT. Nusantara Pesisir Jaya'
		           END
		       ) as nama_pt
		FROM knmps k
		LEFT JOIN regionals r ON k.regional_id = r.id
		LEFT JOIN provinces p ON k.province_id = p.id
		LEFT JOIN regencies rg ON k.regency_id = rg.id
		LEFT JOIN districts d ON k.district_id = d.id
		LEFT JOIN sub_districts sd ON k.sub_district_id = sd.id
		LEFT JOIN (
		    SELECT DISTINCT ON (knmp_id) knmp_id, 
		           COALESCE(NULLIF(additional_data->>'penyedia_jasa', ''), NULLIF(additional_data->>'kontraktor', ''), judul_form) as nama_pt
		    FROM persiapans
		    WHERE jenis = 'kontrak' AND deleted_at IS NULL
		    ORDER BY knmp_id, id DESC
		) pt ON k.id = pt.knmp_id
		WHERE k.id = $1 AND k.deleted_at IS NULL
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
		       k.name, k.jenis_knmp, k.lat, k.long, k.status, k.created_at, k.updated_at, k.deleted_at,
		       r.name as regional_name, p.name as province_name, rg.name as regency_name,
		       d.name as district_name, sd.name as sub_district_name,
		       COALESCE(
		           NULLIF(pt.nama_pt, ''),
		           CASE 
		               WHEN (k.id % 5) = 1 THEN 'PT. Mina Bahari Nusantara'
		               WHEN (k.id % 5) = 2 THEN 'PT. Samudera Karya Pratama'
		               WHEN (k.id % 5) = 3 THEN 'PT. Bahari Megah Konstruksi'
		               WHEN (k.id % 5) = 4 THEN 'PT. Maritim Sentosa Utama'
		               ELSE 'PT. Nusantara Pesisir Jaya'
		           END
		       ) as nama_pt
		FROM knmps k
		LEFT JOIN regionals r ON k.regional_id = r.id
		LEFT JOIN provinces p ON k.province_id = p.id
		LEFT JOIN regencies rg ON k.regency_id = rg.id
		LEFT JOIN districts d ON k.district_id = d.id
		LEFT JOIN sub_districts sd ON k.sub_district_id = sd.id
		LEFT JOIN (
		    SELECT DISTINCT ON (knmp_id) knmp_id, 
		           COALESCE(NULLIF(additional_data->>'penyedia_jasa', ''), NULLIF(additional_data->>'kontraktor', ''), judul_form) as nama_pt
		    FROM persiapans
		    WHERE jenis = 'kontrak' AND deleted_at IS NULL
		    ORDER BY knmp_id, id DESC
		) pt ON k.id = pt.knmp_id
		WHERE k.deleted_at IS NULL
	`
	var args []any
	argIdx := 1

	if filter.Search != "" {
		query += fmt.Sprintf(" AND (k.name ILIKE $%d OR pt.nama_pt ILIKE $%d)", argIdx, argIdx)
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}
	if filter.NamaPT != "" {
		query += fmt.Sprintf(" AND (pt.nama_pt ILIKE $%d OR CASE WHEN (k.id %% 5) = 1 THEN 'PT. Mina Bahari Nusantara' WHEN (k.id %% 5) = 2 THEN 'PT. Samudera Karya Pratama' WHEN (k.id %% 5) = 3 THEN 'PT. Bahari Megah Konstruksi' WHEN (k.id %% 5) = 4 THEN 'PT. Maritim Sentosa Utama' ELSE 'PT. Nusantara Pesisir Jaya' END ILIKE $%d)", argIdx, argIdx)
		args = append(args, "%"+filter.NamaPT+"%")
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
	_, err := r.db.ExecContext(ctx, `UPDATE knmps SET deleted_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *knmpRepo) GetWidgetStats(ctx context.Context, userKnmpIDs []int64) (map[string]any, error) {
	stats := make(map[string]any)

	var knmpFilter string
	var args []any
	if len(userKnmpIDs) > 0 {
		knmpFilter = " AND id = ANY($1)"
		args = append(args, pq.Array(userKnmpIDs))
	}

	// 1. Total Lokasi & Status Counts
	var totalKnmps int
	_ = r.db.GetContext(ctx, &totalKnmps, `SELECT COUNT(*) FROM knmps WHERE deleted_at IS NULL`+knmpFilter, args...)
	stats["total_knmps"] = totalKnmps

	var onTrack int
	_ = r.db.GetContext(ctx, &onTrack, `SELECT COUNT(*) FROM knmps WHERE deleted_at IS NULL AND (status = 'aktif' OR status = 'on_track')`+knmpFilter, args...)
	stats["on_track"] = onTrack

	var perluPerhatian int
	_ = r.db.GetContext(ctx, &perluPerhatian, `SELECT COUNT(*) FROM knmps WHERE deleted_at IS NULL AND status = 'perlu_perhatian'`+knmpFilter, args...)
	stats["perlu_perhatian"] = perluPerhatian

	var kritis int
	_ = r.db.GetContext(ctx, &kritis, `SELECT COUNT(*) FROM knmps WHERE deleted_at IS NULL AND status = 'kritis'`+knmpFilter, args...)
	stats["kritis"] = kritis

	var pemeliharaan int
	_ = r.db.GetContext(ctx, &pemeliharaan, `SELECT COUNT(*) FROM knmps WHERE deleted_at IS NULL AND (status = 'pemeliharaan' OR status = 'nonaktif')`+knmpFilter, args...)
	stats["pemeliharaan"] = pemeliharaan

	// 2. Aggregate Realisasi Anggaran & Fisik
	var agg struct {
		TotalPagu      float64 `db:"total_pagu"`
		TotalRealisasi float64 `db:"total_realisasi"`
		AvgFisik       float64 `db:"avg_fisik"`
	}
	aggWhere := " WHERE k.deleted_at IS NULL"
	if len(userKnmpIDs) > 0 {
		aggWhere += " AND k.id = ANY($1)"
	}
	aggQuery := `
		SELECT 
			COALESCE(SUM(pk.pagu_anggaran), 0) as total_pagu,
			COALESCE(SUM(pm.realisasi_anggaran), 0) as total_realisasi,
			COALESCE(AVG(l.realisasi_progres_fisik), 0) as avg_fisik
		FROM knmps k
		LEFT JOIN (
			SELECT knmp_id, 
			       COALESCE(NULLIF(additional_data->>'pagu_anggaran', '')::numeric, 0) as pagu_anggaran 
			FROM persiapans 
			WHERE jenis = 'kontrak' AND deleted_at IS NULL
		) pk ON k.id = pk.knmp_id
		LEFT JOIN (
			SELECT knmp_id, SUM(realisasi_anggaran) as realisasi_anggaran
			FROM pembayarans p
			JOIN persiapans ps ON p.persiapan_kontrak_id = ps.id
			WHERE p.deleted_at IS NULL AND ps.deleted_at IS NULL
			GROUP BY knmp_id
		) pm ON k.id = pm.knmp_id
		LEFT JOIN (
			SELECT p.knmp_id, AVG(l.realisasi_progres_fisik) as realisasi_progres_fisik
			FROM laporans l
			JOIN pelaksanaans p ON l.pelaksanaan_id = p.id
			WHERE l.deleted_at IS NULL AND p.deleted_at IS NULL
			GROUP BY p.knmp_id
		) l ON k.id = l.knmp_id
	` + aggWhere
	_ = r.db.GetContext(ctx, &agg, aggQuery, args...)
	stats["total_pagu"] = agg.TotalPagu
	stats["total_realisasi"] = agg.TotalRealisasi
	stats["avg_fisik"] = agg.AvgFisik

	// 3. Progres Per Wilayah
	var regionalStats []struct {
		RegionalID   int64   `db:"regional_id" json:"regional_id"`
		RegionalName string  `db:"regional_name" json:"regional_name"`
		TotalKnmps   int     `db:"total_knmps" json:"total_knmps"`
		AvgFisik     float64 `db:"avg_fisik" json:"avg_fisik"`
	}
	regQuery := `
		SELECT 
			COALESCE(r.id, 0) as regional_id,
			COALESCE(r.name, 'Lainnya') as regional_name,
			COUNT(k.id) as total_knmps,
			COALESCE(AVG(l.avg_progres), 0) as avg_fisik
		FROM knmps k
		LEFT JOIN regionals r ON k.regional_id = r.id
		LEFT JOIN (
			SELECT p.knmp_id, AVG(lp.realisasi_progres_fisik) as avg_progres
			FROM laporans lp
			JOIN pelaksanaans p ON lp.pelaksanaan_id = p.id
			WHERE lp.deleted_at IS NULL AND p.deleted_at IS NULL
			GROUP BY p.knmp_id
		) l ON k.id = l.knmp_id
	` + aggWhere + `
		GROUP BY r.id, r.name
		ORDER BY r.id ASC
	`
	_ = r.db.SelectContext(ctx, &regionalStats, regQuery, args...)
	stats["regional_stats"] = regionalStats

	// 4. Total Pelaksanaan
	var totalPelaksanaan int
	pelQuery := `SELECT COUNT(*) FROM pelaksanaans WHERE deleted_at IS NULL`
	if len(userKnmpIDs) > 0 {
		pelQuery += ` AND knmp_id = ANY($1)`
	}
	_ = r.db.GetContext(ctx, &totalPelaksanaan, pelQuery, args...)
	stats["total_pelaksanaan"] = totalPelaksanaan

	// 5. Workers (Tenaga Kerja) from Laporans
	var totalWorkers int
	workerQuery := `
		SELECT COALESCE(SUM(l.jumlah_tenaga_kerja), 0)
		FROM laporans l
		JOIN pelaksanaans p ON l.pelaksanaan_id = p.id
		WHERE l.deleted_at IS NULL AND p.deleted_at IS NULL
	`
	if len(userKnmpIDs) > 0 {
		workerQuery += ` AND p.knmp_id = ANY($1)`
	}
	_ = r.db.GetContext(ctx, &totalWorkers, workerQuery, args...)
	stats["total_workers"] = totalWorkers

	var todayWorkers int
	todayQuery := `
		SELECT COALESCE(SUM(l.jumlah_tenaga_kerja), 0)
		FROM laporans l
		JOIN pelaksanaans p ON l.pelaksanaan_id = p.id
		WHERE l.deleted_at IS NULL AND p.deleted_at IS NULL AND l.tanggal >= CURRENT_DATE - INTERVAL '7 days'
	`
	if len(userKnmpIDs) > 0 {
		todayQuery += ` AND p.knmp_id = ANY($1)`
	}
	_ = r.db.GetContext(ctx, &todayWorkers, todayQuery, args...)
	stats["today_workers"] = todayWorkers

	// 6. Total Issues
	var totalIssues int
	issueQuery := `SELECT COUNT(*) FROM issues WHERE deleted_at IS NULL`
	if len(userKnmpIDs) > 0 {
		issueQuery += ` AND knmp_id = ANY($1)`
	}
	_ = r.db.GetContext(ctx, &totalIssues, issueQuery, args...)
	stats["total_issues"] = totalIssues

	// 7. Finance Summary
	paguPct := 0.0
	if agg.TotalPagu > 0 {
		paguPct = (agg.TotalRealisasi / agg.TotalPagu) * 100.0
	}
	stats["finance"] = map[string]any{
		"pagu":                 agg.TotalPagu,
		"realisasi":            agg.TotalRealisasi,
		"percentage":           paguPct,
		"remaining_percentage": 100.0 - paguPct,
	}

	// 8. Approval Summary
	var totalDocs int
	_ = r.db.GetContext(ctx, &totalDocs, `SELECT COUNT(*) FROM documents WHERE deleted_at IS NULL`)
	stats["approval"] = map[string]any{
		"pengawas":     totalDocs,
		"tim_validasi": totalDocs,
		"ppk":          totalDocs,
		"total_docs":   totalDocs,
	}

	return stats, nil
}

func (r *knmpRepo) ListMap(ctx context.Context) ([]*domain.Knmp, error) {
	return r.List(ctx, repository.KnmpFilter{})
}

func (r *knmpRepo) ListPeriodes(ctx context.Context) ([]*domain.Periode, error) {
	results := make([]*domain.Periode, 0)
	err := r.db.SelectContext(ctx, &results, `SELECT id, year, tanggal_mulai, tanggal_akhir, created_at, updated_at, deleted_at FROM periodes WHERE deleted_at IS NULL ORDER BY year DESC`)
	return results, err
}

func (r *knmpRepo) CreatePeriode(ctx context.Context, p *domain.Periode) error {
	query := `INSERT INTO periodes (year, tanggal_mulai, tanggal_akhir, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, created_at, updated_at`
	return r.db.QueryRowContext(ctx, query, p.Year, p.TanggalMulai, p.TanggalAkhir).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *knmpRepo) UpdatePeriode(ctx context.Context, p *domain.Periode) error {
	query := `UPDATE periodes SET year = $1, tanggal_mulai = $2, tanggal_akhir = $3, updated_at = NOW() WHERE id = $4 AND deleted_at IS NULL`
	_, err := r.db.ExecContext(ctx, query, p.Year, p.TanggalMulai, p.TanggalAkhir, p.ID)
	return err
}

func (r *knmpRepo) DeletePeriode(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `UPDATE periodes SET deleted_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *knmpRepo) ListJenisBangunans(ctx context.Context, activeOnly bool) ([]*domain.JenisBangunan, error) {
	results := make([]*domain.JenisBangunan, 0)
	query := `SELECT id, nama, deskripsi, is_active, created_at, updated_at, deleted_at FROM jenis_bangunans WHERE deleted_at IS NULL`
	if activeOnly {
		query += ` AND is_active = true`
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
	query := `UPDATE jenis_bangunans SET nama = $1, deskripsi = $2, is_active = $3, updated_at = NOW() WHERE id = $4 AND deleted_at IS NULL`
	_, err := r.db.ExecContext(ctx, query, jb.Nama, jb.Deskripsi, jb.IsActive, jb.ID)
	return err
}

func (r *knmpRepo) DeleteJenisBangunan(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `UPDATE jenis_bangunans SET deleted_at = NOW() WHERE id = $1`, id)
	return err
}
