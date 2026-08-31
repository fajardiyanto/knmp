package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type notulenRepo struct {
	db *sqlx.DB
}

func NewNotulenRepo(db *sqlx.DB) repository.NotulenRepository {
	return &notulenRepo{db: db}
}

func (r *notulenRepo) GetByID(ctx context.Context, id int64) (*domain.Notulen, error) {
	var n domain.Notulen
	query := `
		SELECT n.id, n.knmp_id, n.judul, n.tanggal::text as tanggal, n.waktu_mulai, n.waktu_selesai,
		       n.lokasi, n.pimpinan_rapat, COALESCE(n.notulis, 'Super Admin') as notulis,
		       n.agenda, n.hasil_pembahasan, n.tindak_lanjut, n.status,
		       n.created_by, n.created_at, n.updated_at, n.deleted_at,
		       k.name as knmp_name, COALESCE(u.name, 'Super Admin') as created_by_name
		FROM notulens n
		LEFT JOIN knmps k ON n.knmp_id = k.id
		LEFT JOIN users u ON n.created_by = u.id
		WHERE n.id = $1 AND n.deleted_at IS NULL
	`
	err := r.db.GetContext(ctx, &n, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get notulen by id: %w", err)
	}

	// Fetch shared user IDs and users
	sharedUsers, _ := r.GetSharedUsers(ctx, n.ID)
	n.SharedUsers = sharedUsers
	for _, u := range sharedUsers {
		n.SharedUserIDs = append(n.SharedUserIDs, u.ID)
	}

	return &n, nil
}

func (r *notulenRepo) List(ctx context.Context, filter domain.NotulenFilter) ([]*domain.Notulen, error) {
	var results []*domain.Notulen
	query := `
		SELECT n.id, n.knmp_id, n.judul, n.tanggal::text as tanggal, n.waktu_mulai, n.waktu_selesai,
		       n.lokasi, n.pimpinan_rapat, COALESCE(n.notulis, 'Super Admin') as notulis,
		       n.agenda, n.hasil_pembahasan, n.tindak_lanjut, n.status,
		       n.created_by, n.created_at, n.updated_at, n.deleted_at,
		       k.name as knmp_name, COALESCE(u.name, 'Super Admin') as created_by_name
		FROM notulens n
		LEFT JOIN knmps k ON n.knmp_id = k.id
		LEFT JOIN users u ON n.created_by = u.id
		WHERE n.deleted_at IS NULL
	`
	var args []any
	argIdx := 1

	// Scoping Rule:
	// If NOT superadmin or admin_ppk or admin, only show notulens shared with the user OR created by the user
	isGlobalAdmin := domain.IsAdminRole(filter.UserRole)
	if !isGlobalAdmin && filter.UserID > 0 {
		query += fmt.Sprintf(" AND (n.id IN (SELECT notulen_id FROM notulen_shares WHERE user_id = $%d) OR n.created_by = $%d)", argIdx, argIdx)
		args = append(args, filter.UserID)
		argIdx++
	}

	if filter.KnmpID != nil {
		query += fmt.Sprintf(" AND n.knmp_id = $%d", argIdx)
		args = append(args, *filter.KnmpID)
		argIdx++
	}

	if filter.Search != "" {
		s := "%" + strings.ToLower(filter.Search) + "%"
		query += fmt.Sprintf(" AND (LOWER(n.judul) LIKE $%d OR LOWER(COALESCE(n.pimpinan_rapat, '')) LIKE $%d OR LOWER(COALESCE(n.lokasi, '')) LIKE $%d OR LOWER(COALESCE(n.agenda, '')) LIKE $%d OR LOWER(COALESCE(k.name, '')) LIKE $%d)", argIdx, argIdx, argIdx, argIdx, argIdx)
		args = append(args, s)
		argIdx++
	}

	if filter.TanggalAwal != "" {
		query += fmt.Sprintf(" AND n.tanggal >= $%d", argIdx)
		args = append(args, filter.TanggalAwal)
		argIdx++
	}

	if filter.TanggalAkhir != "" {
		query += fmt.Sprintf(" AND n.tanggal <= $%d", argIdx)
		args = append(args, filter.TanggalAkhir)
		argIdx++
	}

	query += " ORDER BY n.tanggal DESC, n.id DESC"

	if filter.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
		args = append(args, filter.Limit, filter.Offset)
	}

	err := r.db.SelectContext(ctx, &results, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list notulens: %w", err)
	}

	// Populate shared users for each notulen
	for _, n := range results {
		users, _ := r.GetSharedUsers(ctx, n.ID)
		n.SharedUsers = users
		for _, u := range users {
			n.SharedUserIDs = append(n.SharedUserIDs, u.ID)
		}
	}

	return results, nil
}

func (r *notulenRepo) Create(ctx context.Context, n *domain.Notulen, sharedUserIDs []int64) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	if n.Notulis == "" {
		n.Notulis = "Super Admin"
	}
	if n.Status == "" {
		n.Status = "published"
	}

	query := `
		INSERT INTO notulens (
			knmp_id, judul, tanggal, waktu_mulai, waktu_selesai, lokasi,
			pimpinan_rapat, notulis, agenda, hasil_pembahasan, tindak_lanjut,
			status, created_by, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
		) RETURNING id, created_at, updated_at
	`
	var notulenID int64
	var createdAt, updatedAt time.Time
	err = tx.QueryRowxContext(
		ctx, query,
		n.KnmpID, n.Judul, n.Tanggal, n.WaktuMulai, n.WaktuSelesai, n.Lokasi,
		n.PimpinanRapat, n.Notulis, n.Agenda, n.HasilPembahasan, n.TindakLanjut,
		n.Status, n.CreatedBy,
	).Scan(&notulenID, &createdAt, &updatedAt)
	if err != nil {
		return fmt.Errorf("insert notulen: %w", err)
	}

	n.ID = notulenID
	n.CreatedAt = createdAt
	n.UpdatedAt = updatedAt

	// Insert shared users
	if len(sharedUserIDs) > 0 {
		shareQuery := `
			INSERT INTO notulen_shares (notulen_id, user_id, shared_at)
			VALUES ($1, $2, NOW())
			ON CONFLICT (notulen_id, user_id) DO NOTHING
		`
		for _, uid := range sharedUserIDs {
			if uid > 0 {
				if _, err := tx.ExecContext(ctx, shareQuery, n.ID, uid); err != nil {
					return fmt.Errorf("insert notulen share: %w", err)
				}
			}
		}
	}

	return tx.Commit()
}

func (r *notulenRepo) Update(ctx context.Context, n *domain.Notulen, sharedUserIDs []int64) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	query := `
		UPDATE notulens SET
			knmp_id = $1, judul = $2, tanggal = $3, waktu_mulai = $4,
			waktu_selesai = $5, lokasi = $6, pimpinan_rapat = $7,
			notulis = $8, agenda = $9, hasil_pembahasan = $10,
			tindak_lanjut = $11, status = $12, updated_at = NOW()
		WHERE id = $13 AND deleted_at IS NULL
	`
	_, err = tx.ExecContext(
		ctx, query,
		n.KnmpID, n.Judul, n.Tanggal, n.WaktuMulai, n.WaktuSelesai, n.Lokasi,
		n.PimpinanRapat, n.Notulis, n.Agenda, n.HasilPembahasan, n.TindakLanjut,
		n.Status, n.ID,
	)
	if err != nil {
		return fmt.Errorf("update notulen: %w", err)
	}

	// Update shared users if provided
	if sharedUserIDs != nil {
		_, _ = tx.ExecContext(ctx, `DELETE FROM notulen_shares WHERE notulen_id = $1`, n.ID)
		if len(sharedUserIDs) > 0 {
			shareQuery := `
				INSERT INTO notulen_shares (notulen_id, user_id, shared_at)
				VALUES ($1, $2, NOW())
				ON CONFLICT (notulen_id, user_id) DO NOTHING
			`
			for _, uid := range sharedUserIDs {
				if uid > 0 {
					if _, err := tx.ExecContext(ctx, shareQuery, n.ID, uid); err != nil {
						return fmt.Errorf("insert notulen share on update: %w", err)
					}
				}
			}
		}
	}

	return tx.Commit()
}

func (r *notulenRepo) Delete(ctx context.Context, id int64) error {
	query := `UPDATE notulens SET deleted_at = NOW() WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *notulenRepo) ShareToUsers(ctx context.Context, notulenID int64, userIDs []int64) error {
	if len(userIDs) == 0 {
		return nil
	}
	query := `
		INSERT INTO notulen_shares (notulen_id, user_id, shared_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (notulen_id, user_id) DO NOTHING
	`
	for _, uid := range userIDs {
		if uid > 0 {
			if _, err := r.db.ExecContext(ctx, query, notulenID, uid); err != nil {
				return fmt.Errorf("share notulen to user %d: %w", uid, err)
			}
		}
	}
	return nil
}

func (r *notulenRepo) GetSharedUsers(ctx context.Context, notulenID int64) ([]*domain.User, error) {
	var users []*domain.User
	query := `
		SELECT u.id, u.name, u.email, u.created_at, u.updated_at,
		       COALESCE((SELECT r.name FROM model_has_roles mhr JOIN roles r ON mhr.role_id = r.id WHERE mhr.model_id = u.id LIMIT 1), 'User') as role_name
		FROM users u
		JOIN notulen_shares ns ON u.id = ns.user_id
		WHERE ns.notulen_id = $1 AND u.deleted_at IS NULL
		ORDER BY u.name ASC
	`
	err := r.db.SelectContext(ctx, &users, query, notulenID)
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (r *notulenRepo) GetSharedUserIDs(ctx context.Context, notulenID int64) ([]int64, error) {
	var ids []int64
	query := `SELECT user_id FROM notulen_shares WHERE notulen_id = $1`
	err := r.db.SelectContext(ctx, &ids, query, notulenID)
	if err != nil {
		return nil, err
	}
	return ids, nil
}
