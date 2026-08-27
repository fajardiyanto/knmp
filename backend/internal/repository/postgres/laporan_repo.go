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
		       l.additional_data, l.created_by, l.updated_by, l.created_at, l.updated_at,
		       p.nama as pelaksanaan_name,
		       COALESCE(u.name, 'Kontraktor') as user_name
		FROM laporans l
		JOIN pelaksanaans p ON l.pelaksanaan_id = p.id
		LEFT JOIN users u ON l.user_id = u.id
		WHERE l.id = $1
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
		       l.additional_data, l.created_by, l.updated_by, l.created_at, l.updated_at,
		       p.nama as pelaksanaan_name,
		       COALESCE(u.name, 'Kontraktor') as user_name
		FROM laporans l
		JOIN pelaksanaans p ON l.pelaksanaan_id = p.id
		LEFT JOIN users u ON l.user_id = u.id
	`
	if filter.JenisBangunanID != nil {
		query += " JOIN laporan_jenis_bangunan ljb ON l.id = ljb.laporan_id"
	}
	query += " WHERE 1=1"

	var args []any
	argIdx := 1

	if filter.PelaksanaanID != nil {
		query += fmt.Sprintf(" AND l.pelaksanaan_id = $%d", argIdx)
		args = append(args, *filter.PelaksanaanID)
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
		INSERT INTO laporans (pelaksanaan_id, user_id, nama, tanggal, jenis_laporan, keberapa, cuaca,
		                      jumlah_tenaga_kerja, rencana_progres_fisik, realisasi_progres_fisik,
		                      status, lat, long, keterangan, additional_data, created_by, updated_by,
		                      created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	err = tx.QueryRowContext(ctx, query,
		l.PelaksanaanID, l.UserID, l.Nama, l.Tanggal, l.JenisLaporan, l.Keberapa, l.Cuaca,
		l.JumlahTenagaKerja, l.RencanaProgresFisik, l.RealisasiProgresFisik,
		l.Status, l.Lat, l.Long, l.Keterangan, l.AdditionalData, l.CreatedBy, l.UpdatedBy,
	).Scan(&l.ID, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		return fmt.Errorf("insert laporan: %w", err)
	}

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
		    realisasi_progres_fisik = $10, status = $11, lat = $12, long = $13, keterangan = $14,
		    additional_data = $15, updated_by = $16, updated_at = NOW()
		WHERE id = $17
	`
	_, err = tx.ExecContext(ctx, query,
		l.PelaksanaanID, l.UserID, l.Nama, l.Tanggal, l.JenisLaporan,
		l.Keberapa, l.Cuaca, l.JumlahTenagaKerja, l.RencanaProgresFisik,
		l.RealisasiProgresFisik, l.Status, l.Lat, l.Long, l.Keterangan,
		l.AdditionalData, l.UpdatedBy, l.ID,
	)
	if err != nil {
		return fmt.Errorf("update laporan: %w", err)
	}

	if len(details) > 0 {
		_, _ = tx.ExecContext(ctx, `DELETE FROM laporan_jenis_bangunan WHERE laporan_id = $1`, l.ID)
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
	query := `UPDATE laporans SET status = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.db.ExecContext(ctx, query, status, id)
	return err
}

func (r *laporanRepo) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM laporans WHERE id = $1`, id)
	return err
}

func (r *laporanRepo) GetDetailsByLaporanID(ctx context.Context, laporanID int64) ([]*domain.LaporanJenisBangunan, error) {
	var details []*domain.LaporanJenisBangunan
	query := `
		SELECT ljb.id, ljb.laporan_id, ljb.jenis_bangunan_id, ljb.rencana_progres_fisik,
		       ljb.realisasi_progres_fisik, ljb.keterangan, ljb.created_at, ljb.updated_at,
		       jb.nama as jenis_bangunan_name
		FROM laporan_jenis_bangunan ljb
		JOIN jenis_bangunans jb ON ljb.jenis_bangunan_id = jb.id
		WHERE ljb.laporan_id = $1
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
