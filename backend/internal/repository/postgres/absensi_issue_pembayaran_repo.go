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

// --- ABSENSI REPOSITORY ---

type absensiRepo struct {
	db *sqlx.DB
}

func NewAbsensiRepo(db *sqlx.DB) repository.AbsensiRepository {
	return &absensiRepo{db: db}
}

func (r *absensiRepo) GetByID(ctx context.Context, id int64) (*domain.Absensi, error) {
	var a domain.Absensi
	query := `
		SELECT a.id, a.pelaksanaan_id, a.user_id, a.tipe_absensi, a.recorded_at,
		       a.lat, a.long, a.status, a.created_by, a.updated_by, a.created_at, a.updated_at,
		       p.nama as pelaksanaan_name
		FROM absensis a
		JOIN pelaksanaans p ON a.pelaksanaan_id = p.id
		WHERE a.id = $1
	`
	err := r.db.GetContext(ctx, &a, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get absensi by id: %w", err)
	}
	return &a, nil
}

func (r *absensiRepo) List(ctx context.Context, filter repository.AbsensiFilter) ([]*domain.Absensi, error) {
	results := make([]*domain.Absensi, 0)
	query := `
		SELECT a.id, a.pelaksanaan_id, a.user_id, a.tipe_absensi, a.recorded_at,
		       a.lat, a.long, a.status, a.created_by, a.updated_by, a.created_at, a.updated_at,
		       p.nama as pelaksanaan_name
		FROM absensis a
		JOIN pelaksanaans p ON a.pelaksanaan_id = p.id
		WHERE 1=1
	`
	var args []any
	argIdx := 1

	if filter.PelaksanaanID != nil {
		query += fmt.Sprintf(" AND a.pelaksanaan_id = $%d", argIdx)
		args = append(args, *filter.PelaksanaanID)
		argIdx++
	}
	if filter.TipeAbsensi != "" {
		query += fmt.Sprintf(" AND a.tipe_absensi = $%d", argIdx)
		args = append(args, filter.TipeAbsensi)
		argIdx++
	}
	if filter.Status != "" {
		query += fmt.Sprintf(" AND a.status = $%d", argIdx)
		args = append(args, filter.Status)
		argIdx++
	}

	query += " ORDER BY a.recorded_at DESC"

	err := r.db.SelectContext(ctx, &results, query, args...)
	return results, err
}

func (r *absensiRepo) Create(ctx context.Context, a *domain.Absensi) error {
	query := `
		INSERT INTO absensis (pelaksanaan_id, user_id, tipe_absensi, recorded_at, lat, long, status, created_by, updated_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(ctx, query,
		a.PelaksanaanID, a.UserID, a.TipeAbsensi, a.RecordedAt, a.Lat, a.Long,
		a.Status, a.CreatedBy, a.UpdatedBy,
	).Scan(&a.ID, &a.CreatedAt, &a.UpdatedAt)
}

func (r *absensiRepo) Update(ctx context.Context, a *domain.Absensi) error {
	query := `
		UPDATE absensis
		SET pelaksanaan_id = $1, user_id = $2, tipe_absensi = $3, recorded_at = $4,
		    lat = $5, long = $6, status = $7, updated_by = $8, updated_at = NOW()
		WHERE id = $9
	`
	_, err := r.db.ExecContext(ctx, query,
		a.PelaksanaanID, a.UserID, a.TipeAbsensi, a.RecordedAt,
		a.Lat, a.Long, a.Status, a.UpdatedBy, a.ID,
	)
	return err
}

func (r *absensiRepo) UpdateStatus(ctx context.Context, id int64, status string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE absensis SET status = $1, updated_at = NOW() WHERE id = $2`, status, id)
	return err
}

func (r *absensiRepo) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM absensis WHERE id = $1`, id)
	return err
}

// --- ISSUE REPOSITORY ---

type issueRepo struct {
	db *sqlx.DB
}

func NewIssueRepo(db *sqlx.DB) repository.IssueRepository {
	return &issueRepo{db: db}
}

func (r *issueRepo) GetByID(ctx context.Context, id int64) (*domain.Issue, error) {
	var i domain.Issue
	query := `
		SELECT i.id, i.knmp_id, i.kategori_issue, i.tingkat, i.status, i.uraian_masalah,
		       i.created_by, i.created_at, i.updated_at,
		       COALESCE(k.name, '-') as knmp_name,
		       COALESCE(u.name, 'Kontraktor') as created_by_name
		FROM issues i
		LEFT JOIN knmps k ON i.knmp_id = k.id
		LEFT JOIN users u ON i.created_by = u.id
		WHERE i.id = $1
	`
	err := r.db.GetContext(ctx, &i, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get issue by id: %w", err)
	}
	return &i, nil
}

func (r *issueRepo) List(ctx context.Context, filter repository.IssueFilter) ([]*domain.Issue, error) {
	results := make([]*domain.Issue, 0)
	query := `
		SELECT i.id, i.knmp_id, i.kategori_issue, i.tingkat, i.status, i.uraian_masalah,
		       i.created_by, i.created_at, i.updated_at,
		       COALESCE(k.name, '-') as knmp_name,
		       COALESCE(u.name, 'Kontraktor') as created_by_name
		FROM issues i
		LEFT JOIN knmps k ON i.knmp_id = k.id
		LEFT JOIN users u ON i.created_by = u.id
		WHERE 1=1
	`
	var args []any
	argIdx := 1

	if filter.KnmpID != nil {
		query += fmt.Sprintf(" AND i.knmp_id = $%d", argIdx)
		args = append(args, *filter.KnmpID)
		argIdx++
	}
	if filter.KategoriIssue != "" {
		query += fmt.Sprintf(" AND i.kategori_issue ILIKE $%d", argIdx)
		args = append(args, "%"+filter.KategoriIssue+"%")
		argIdx++
	}
	if filter.Tingkat != "" {
		query += fmt.Sprintf(" AND i.tingkat = $%d", argIdx)
		args = append(args, filter.Tingkat)
		argIdx++
	}
	if filter.Status != "" {
		query += fmt.Sprintf(" AND i.status = $%d", argIdx)
		args = append(args, filter.Status)
		argIdx++
	}

	query += " ORDER BY i.id ASC"

	err := r.db.SelectContext(ctx, &results, query, args...)
	return results, err
}

func (r *issueRepo) Create(ctx context.Context, issue *domain.Issue) error {
	query := `
		INSERT INTO issues (knmp_id, kategori_issue, tingkat, status, uraian_masalah, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(ctx, query,
		issue.KnmpID, issue.KategoriIssue, issue.Tingkat, issue.Status, issue.UraianMasalah, issue.CreatedBy,
	).Scan(&issue.ID, &issue.CreatedAt, &issue.UpdatedAt)
}

func (r *issueRepo) Update(ctx context.Context, issue *domain.Issue) error {
	query := `
		UPDATE issues
		SET knmp_id = $1, kategori_issue = $2, tingkat = $3, status = $4, uraian_masalah = $5, updated_at = NOW()
		WHERE id = $6
	`
	_, err := r.db.ExecContext(ctx, query,
		issue.KnmpID, issue.KategoriIssue, issue.Tingkat, issue.Status, issue.UraianMasalah, issue.ID,
	)
	return err
}

func (r *issueRepo) UpdateStatus(ctx context.Context, id int64, status string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE issues SET status = $1, updated_at = NOW() WHERE id = $2`, status, id)
	return err
}

func (r *issueRepo) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM issues WHERE id = $1`, id)
	return err
}

// --- PEMBAYARAN REPOSITORY ---

type pembayaranRepo struct {
	db *sqlx.DB
}

func NewPembayaranRepo(db *sqlx.DB) repository.PembayaranRepository {
	return &pembayaranRepo{db: db}
}

func (r *pembayaranRepo) GetByID(ctx context.Context, id int64) (*domain.Pembayaran, error) {
	var p domain.Pembayaran
	query := `
		SELECT p.id, p.persiapan_kontrak_id, p.kategori, p.name, p.termin,
		       p.realisasi_anggaran, p.realisasi_fisik, p.norek_pekerja,
		       p.created_at, p.updated_at, pk.nama as persiapan_name
		FROM pembayarans p
		JOIN persiapans pk ON p.persiapan_kontrak_id = pk.id
		WHERE p.id = $1
	`
	err := r.db.GetContext(ctx, &p, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *pembayaranRepo) List(ctx context.Context, persiapanKontrakID *int64) ([]*domain.Pembayaran, error) {
	results := make([]*domain.Pembayaran, 0)
	query := `
		SELECT p.id, p.persiapan_kontrak_id, p.kategori, p.name, p.termin,
		       p.realisasi_anggaran, p.realisasi_fisik, p.norek_pekerja,
		       p.created_at, p.updated_at, pk.nama as persiapan_name
		FROM pembayarans p
		JOIN persiapans pk ON p.persiapan_kontrak_id = pk.id
		WHERE 1=1
	`
	var args []any
	if persiapanKontrakID != nil {
		query += " AND p.persiapan_kontrak_id = $1"
		args = append(args, *persiapanKontrakID)
	}
	query += " ORDER BY p.id ASC"

	err := r.db.SelectContext(ctx, &results, query, args...)
	return results, err
}

func (r *pembayaranRepo) Create(ctx context.Context, p *domain.Pembayaran) error {
	query := `
		INSERT INTO pembayarans (persiapan_kontrak_id, kategori, name, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(ctx, query,
		p.PersiapanKontrakID, p.Kategori, p.Name, p.Termin, p.RealisasiAnggaran, p.RealisasiFisik, p.NorekPekerja,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *pembayaranRepo) Update(ctx context.Context, p *domain.Pembayaran) error {
	query := `
		UPDATE pembayarans
		SET persiapan_kontrak_id = $1, kategori = $2, name = $3, termin = $4,
		    realisasi_anggaran = $5, realisasi_fisik = $6, norek_pekerja = $7, updated_at = NOW()
		WHERE id = $8
	`
	_, err := r.db.ExecContext(ctx, query,
		p.PersiapanKontrakID, p.Kategori, p.Name, p.Termin, p.RealisasiAnggaran, p.RealisasiFisik, p.NorekPekerja, p.ID,
	)
	return err
}

func (r *pembayaranRepo) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM pembayarans WHERE id = $1`, id)
	return err
}

func (r *pembayaranRepo) GetSummary(ctx context.Context) (map[string]any, error) {
	summary := make(map[string]any)

	var totalRealisasiAnggaran float64
	_ = r.db.GetContext(ctx, &totalRealisasiAnggaran, `SELECT COALESCE(SUM(realisasi_anggaran), 0) FROM pembayarans`)
	summary["total_realisasi_anggaran"] = totalRealisasiAnggaran

	var totalPayments int
	_ = r.db.GetContext(ctx, &totalPayments, `SELECT COUNT(*) FROM pembayarans`)
	summary["total_payments"] = totalPayments

	return summary, nil
}

func (r *pembayaranRepo) GetTerminStats(ctx context.Context) ([]map[string]any, error) {
	rows, err := r.db.QueryxContext(ctx, `
		SELECT termin, COUNT(*) as count, COALESCE(SUM(realisasi_anggaran), 0) as total_anggaran, COALESCE(AVG(realisasi_fisik), 0) as avg_fisik
		FROM pembayarans
		GROUP BY termin
		ORDER BY termin ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]any
	for rows.Next() {
		item := make(map[string]any)
		if err := rows.MapScan(item); err == nil {
			results = append(results, item)
		}
	}
	return results, nil
}
