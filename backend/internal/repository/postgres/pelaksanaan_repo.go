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

type pelaksanaanRepo struct {
	db *sqlx.DB
}

func NewPelaksanaanRepo(db *sqlx.DB) repository.PelaksanaanRepository {
	return &pelaksanaanRepo{db: db}
}

func (r *pelaksanaanRepo) GetByID(ctx context.Context, id int64) (*domain.Pelaksanaan, error) {
	var p domain.Pelaksanaan
	query := `
		SELECT p.id, p.knmp_id, p.user_id, p.nama, p.tanggal, p.jenis_laporan,
		       p.status_k3, p.kendala, p.keterangan, p.additional_data, p.created_by,
		       p.updated_by, p.created_at, p.updated_at,
		       COALESCE(k.name, '') as knmp_name,
		       COALESCE(u.name, 'SuperAdmin') as user_name
		FROM pelaksanaans p
		LEFT JOIN knmps k ON p.knmp_id = k.id
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.id = $1
	`
	err := r.db.GetContext(ctx, &p, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get pelaksanaan by id: %w", err)
	}
	return &p, nil
}

func (r *pelaksanaanRepo) List(ctx context.Context, knmpID *int64) ([]*domain.Pelaksanaan, error) {
	var results []*domain.Pelaksanaan
	query := `
		SELECT p.id, p.knmp_id, p.user_id, p.nama, p.tanggal, p.jenis_laporan,
		       p.status_k3, p.kendala, p.keterangan, p.additional_data, p.created_by,
		       p.updated_by, p.created_at, p.updated_at,
		       COALESCE(k.name, '') as knmp_name,
		       COALESCE(u.name, 'SuperAdmin') as user_name
		FROM pelaksanaans p
		LEFT JOIN knmps k ON p.knmp_id = k.id
		LEFT JOIN users u ON p.user_id = u.id
		WHERE 1=1
	`
	var args []any
	if knmpID != nil {
		query += " AND p.knmp_id = $1"
		args = append(args, *knmpID)
	}
	query += " ORDER BY p.id ASC"

	err := r.db.SelectContext(ctx, &results, query, args...)
	return results, err
}

func (r *pelaksanaanRepo) Create(ctx context.Context, p *domain.Pelaksanaan) error {
	query := `
		INSERT INTO pelaksanaans (knmp_id, user_id, nama, tanggal, jenis_laporan, status_k3, kendala, keterangan, additional_data, created_by, updated_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(ctx, query,
		p.KnmpID, p.UserID, p.Nama, p.Tanggal, p.JenisLaporan, p.StatusK3,
		p.Kendala, p.Keterangan, p.AdditionalData, p.CreatedBy, p.UpdatedBy,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *pelaksanaanRepo) Update(ctx context.Context, p *domain.Pelaksanaan) error {
	query := `
		UPDATE pelaksanaans
		SET knmp_id = $1, user_id = $2, nama = $3, tanggal = $4, jenis_laporan = $5,
		    status_k3 = $6, kendala = $7, keterangan = $8, additional_data = $9, updated_by = $10, updated_at = NOW()
		WHERE id = $11
	`
	_, err := r.db.ExecContext(ctx, query,
		p.KnmpID, p.UserID, p.Nama, p.Tanggal, p.JenisLaporan,
		p.StatusK3, p.Kendala, p.Keterangan, p.AdditionalData, p.UpdatedBy, p.ID,
	)
	return err
}

func (r *pelaksanaanRepo) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM pelaksanaans WHERE id = $1`, id)
	return err
}
