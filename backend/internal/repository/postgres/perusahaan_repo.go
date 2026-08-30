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

type perusahaanRepo struct {
	db *sqlx.DB
}

func NewPerusahaanRepo(db *sqlx.DB) repository.PerusahaanRepository {
	return &perusahaanRepo{db: db}
}

func (r *perusahaanRepo) GetByID(ctx context.Context, id int64) (*domain.Perusahaan, error) {
	var p domain.Perusahaan
	query := `
		SELECT id, nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email,
		       notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank,
		       nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket,
		       status_administrasi, status_karwas, created_at, updated_at, deleted_at
		FROM perusahaans
		WHERE id = $1 AND deleted_at IS NULL
	`
	err := r.db.GetContext(ctx, &p, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get perusahaan by id: %w", err)
	}
	return &p, nil
}

func (r *perusahaanRepo) GetByNama(ctx context.Context, nama string) (*domain.Perusahaan, error) {
	var p domain.Perusahaan
	query := `
		SELECT id, nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email,
		       notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank,
		       nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket,
		       status_administrasi, status_karwas, created_at, updated_at, deleted_at
		FROM perusahaans
		WHERE (nama ILIKE $1 OR nama ILIKE '%' || $1 || '%' OR $1 ILIKE '%' || nama || '%') AND deleted_at IS NULL
		ORDER BY CASE WHEN nama ILIKE $1 THEN 1 ELSE 2 END, id ASC
		LIMIT 1
	`
	err := r.db.GetContext(ctx, &p, query, nama)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get perusahaan by nama: %w", err)
	}
	return &p, nil
}

func (r *perusahaanRepo) GetByKontrak(ctx context.Context, noKontrak string) (*domain.Perusahaan, error) {
	var p domain.Perusahaan
	query := `
		SELECT id, nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email,
		       notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank,
		       nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket,
		       status_administrasi, status_karwas, created_at, updated_at, deleted_at
		FROM perusahaans
		WHERE no_kontrak = $1 AND deleted_at IS NULL
		LIMIT 1
	`
	err := r.db.GetContext(ctx, &p, query, noKontrak)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get perusahaan by kontrak: %w", err)
	}
	return &p, nil
}

func (r *perusahaanRepo) List(ctx context.Context, search string, limit, offset int) ([]*domain.Perusahaan, int, error) {
	results := make([]*domain.Perusahaan, 0)
	query := `
		SELECT id, nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email,
		       notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank,
		       nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket,
		       status_administrasi, status_karwas, created_at, updated_at, deleted_at
		FROM perusahaans
		WHERE deleted_at IS NULL
	`
	countQuery := `SELECT COUNT(*) FROM perusahaans WHERE deleted_at IS NULL`

	var args []any
	if search != "" {
		filter := " AND (nama ILIKE $1 OR nama_direktur ILIKE $1 OR npwp ILIKE $1 OR no_kontrak ILIKE $1 OR alamat ILIKE $1 OR status_administrasi ILIKE $1)"
		query += filter
		countQuery += filter
		args = append(args, "%"+search+"%")
	}

	var total int
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("count perusahaans: %w", err)
	}

	query += " ORDER BY id ASC"
	if limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", limit)
		if offset > 0 {
			query += fmt.Sprintf(" OFFSET %d", offset)
		}
	}

	if err := r.db.SelectContext(ctx, &results, query, args...); err != nil {
		return nil, 0, fmt.Errorf("list perusahaans: %w", err)
	}
	if results == nil {
		results = make([]*domain.Perusahaan, 0)
	}
	return results, total, nil
}

func (r *perusahaanRepo) Create(ctx context.Context, p *domain.Perusahaan) error {
	query := `
		INSERT INTO perusahaans (
			nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email,
			notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank,
			nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket,
			status_administrasi, status_karwas, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12, $13,
			$14, $15, $16, $17, $18,
			$19, $20,
			NOW(), NOW()
		) RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(
		ctx, query,
		p.Nama, p.Alamat, p.NPWP, p.NamaDirektur, p.JabatanDirektur, p.NoTelp, p.Email,
		p.NotarisAkta, p.TanggalAkta, p.NoAkta, p.NamaBank, p.NorekBank, p.CabangBank,
		p.NamaBankJaminan, p.NoJaminan, p.TglJaminan, p.NoKontrak, p.NamaPaket,
		p.StatusAdministrasi, p.StatusKarwas,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *perusahaanRepo) Update(ctx context.Context, p *domain.Perusahaan) error {
	query := `
		UPDATE perusahaans SET
			nama = $1, alamat = $2, npwp = $3, nama_direktur = $4, jabatan_direktur = $5,
			no_telp = $6, email = $7, notaris_akta = $8, tanggal_akta = $9, no_akta = $10,
			nama_bank = $11, norek_bank = $12, cabang_bank = $13, nama_bank_jaminan = $14,
			no_jaminan = $15, tgl_jaminan = $16, no_kontrak = $17, nama_paket = $18,
			status_administrasi = $19, status_karwas = $20, updated_at = NOW()
		WHERE id = $21 AND deleted_at IS NULL
	`
	_, err := r.db.ExecContext(
		ctx, query,
		p.Nama, p.Alamat, p.NPWP, p.NamaDirektur, p.JabatanDirektur,
		p.NoTelp, p.Email, p.NotarisAkta, p.TanggalAkta, p.NoAkta,
		p.NamaBank, p.NorekBank, p.CabangBank, p.NamaBankJaminan,
		p.NoJaminan, p.TglJaminan, p.NoKontrak, p.NamaPaket,
		p.StatusAdministrasi, p.StatusKarwas,
		p.ID,
	)
	return err
}

func (r *perusahaanRepo) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `UPDATE perusahaans SET deleted_at = NOW() WHERE id = $1`, id)
	return err
}
