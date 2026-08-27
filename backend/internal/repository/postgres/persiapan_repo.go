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

type persiapanRepo struct {
	db *sqlx.DB
}

func NewPersiapanRepo(db *sqlx.DB) repository.PersiapanRepository {
	return &persiapanRepo{db: db}
}

func (r *persiapanRepo) GetByID(ctx context.Context, id int64) (*domain.Persiapan, error) {
	var p domain.Persiapan
	query := `
		SELECT p.id, p.knmp_id, p.user_id, p.nama, p.tanggal, p.jenis, p.keterangan,
		       p.status, p.additional_data, p.created_by, p.updated_by, p.created_at,
		       p.updated_at, p.deleted_at, k.name as knmp_name, COALESCE(u.name, 'SuperAdmin') as user_name
		FROM persiapans p
		LEFT JOIN knmps k ON p.knmp_id = k.id
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.id = $1 AND p.deleted_at IS NULL
	`
	err := r.db.GetContext(ctx, &p, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get persiapan by id: %w", err)
	}
	return &p, nil
}

func (r *persiapanRepo) List(ctx context.Context, jenis string, knmpID *int64) ([]*domain.Persiapan, error) {
	var results []*domain.Persiapan
	query := `
		SELECT p.id, p.knmp_id, p.user_id, p.nama, p.tanggal, p.jenis, p.keterangan,
		       p.status, p.additional_data, p.created_by, p.updated_by, p.created_at,
		       p.updated_at, p.deleted_at, k.name as knmp_name, COALESCE(u.name, 'SuperAdmin') as user_name
		FROM persiapans p
		LEFT JOIN knmps k ON p.knmp_id = k.id
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.deleted_at IS NULL
	`
	var args []any
	argIdx := 1

	if jenis != "" {
		query += fmt.Sprintf(" AND p.jenis = $%d", argIdx)
		args = append(args, jenis)
		argIdx++
	}
	if knmpID != nil {
		query += fmt.Sprintf(" AND p.knmp_id = $%d", argIdx)
		args = append(args, *knmpID)
		argIdx++
	}

	query += " ORDER BY p.id ASC"

	err := r.db.SelectContext(ctx, &results, query, args...)
	return results, err
}

func (r *persiapanRepo) Create(ctx context.Context, p *domain.Persiapan) error {
	query := `
		INSERT INTO persiapans (knmp_id, user_id, nama, tanggal, jenis, keterangan, status, additional_data, created_by, updated_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(ctx, query,
		p.KnmpID, p.UserID, p.Nama, p.Tanggal, p.Jenis, p.Keterangan,
		p.Status, p.AdditionalData, p.CreatedBy, p.UpdatedBy,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *persiapanRepo) Update(ctx context.Context, p *domain.Persiapan) error {
	query := `
		UPDATE persiapans
		SET knmp_id = $1, user_id = $2, nama = $3, tanggal = $4, jenis = $5,
		    keterangan = $6, status = $7, additional_data = $8, updated_by = $9, updated_at = NOW()
		WHERE id = $10
	`
	_, err := r.db.ExecContext(ctx, query,
		p.KnmpID, p.UserID, p.Nama, p.Tanggal, p.Jenis,
		p.Keterangan, p.Status, p.AdditionalData, p.UpdatedBy, p.ID,
	)
	return err
}

func (r *persiapanRepo) Delete(ctx context.Context, id int64) error {
	query := `UPDATE persiapans SET deleted_at = NOW() WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *persiapanRepo) GetPCM(ctx context.Context, persiapanKontrakID int64) (*domain.PCM, error) {
	var pcm domain.PCM
	query := `
		SELECT p.id, p.persiapan_kontrak_id, p.nama, p.tanggal, p.keterangan, p.created_at, p.updated_at, p.deleted_at,
		       COALESCE(pk.nama, '') as kontrak_nama
		FROM pcm p
		LEFT JOIN persiapans pk ON p.persiapan_kontrak_id = pk.id
		WHERE p.persiapan_kontrak_id = $1 AND p.deleted_at IS NULL
	`
	err := r.db.GetContext(ctx, &pcm, query, persiapanKontrakID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &pcm, nil
}

func (r *persiapanRepo) GetPCMByID(ctx context.Context, id int64) (*domain.PCM, error) {
	var pcm domain.PCM
	query := `
		SELECT p.id, p.persiapan_kontrak_id, p.nama, p.tanggal, p.keterangan, p.created_at, p.updated_at, p.deleted_at,
		       COALESCE(pk.nama, '') as kontrak_nama
		FROM pcm p
		LEFT JOIN persiapans pk ON p.persiapan_kontrak_id = pk.id
		WHERE p.id = $1 AND p.deleted_at IS NULL
	`
	err := r.db.GetContext(ctx, &pcm, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &pcm, nil
}

func (r *persiapanRepo) ListPCM(ctx context.Context, persiapanKontrakID *int64) ([]*domain.PCM, error) {
	var results []*domain.PCM
	query := `
		SELECT p.id, p.persiapan_kontrak_id, p.nama, p.tanggal, p.keterangan, p.created_at, p.updated_at, p.deleted_at,
		       COALESCE(pk.nama, '') as kontrak_nama
		FROM pcm p
		LEFT JOIN persiapans pk ON p.persiapan_kontrak_id = pk.id
		WHERE p.deleted_at IS NULL
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

func (r *persiapanRepo) CreateOrUpdatePCM(ctx context.Context, pcm *domain.PCM) error {
	if pcm.ID != 0 {
		query := `UPDATE pcm SET persiapan_kontrak_id = $1, nama = $2, tanggal = $3, keterangan = $4, updated_at = NOW() WHERE id = $5 AND deleted_at IS NULL`
		_, err := r.db.ExecContext(ctx, query, pcm.PersiapanKontrakID, pcm.Nama, pcm.Tanggal, pcm.Keterangan, pcm.ID)
		return err
	}

	query := `
		INSERT INTO pcm (persiapan_kontrak_id, nama, tanggal, keterangan, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(ctx, query, pcm.PersiapanKontrakID, pcm.Nama, pcm.Tanggal, pcm.Keterangan).
		Scan(&pcm.ID, &pcm.CreatedAt, &pcm.UpdatedAt)
}

func (r *persiapanRepo) DeletePCM(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `UPDATE pcm SET deleted_at = NOW() WHERE id = $1`, id)
	return err
}
