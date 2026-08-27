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

type userRepo struct {
	db *sqlx.DB
}

func NewUserRepo(db *sqlx.DB) repository.UserRepository {
	return &userRepo{db: db}
}

func (r *userRepo) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	var user domain.User
	query := `SELECT id, name, email, email_verified_at, password, remember_token, created_at, updated_at, deleted_at FROM users WHERE id = $1 AND deleted_at IS NULL`
	err := r.db.GetContext(ctx, &user, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return &user, nil
}

func (r *userRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	query := `SELECT id, name, email, email_verified_at, password, remember_token, created_at, updated_at, deleted_at FROM users WHERE email = $1 AND deleted_at IS NULL`
	err := r.db.GetContext(ctx, &user, query, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return &user, nil
}

func (r *userRepo) List(ctx context.Context, search string) ([]*domain.User, error) {
	var users []*domain.User
	query := `
		SELECT u.id, u.name, u.email, u.email_verified_at, u.created_at, u.updated_at, u.deleted_at,
		       COALESCE(r.name, 'Admin') as role_name,
		       COALESCE(k.name, '-') as knmp_name
		FROM users u
		LEFT JOIN model_has_roles mhr ON u.id = mhr.model_id
		LEFT JOIN roles r ON mhr.role_id = r.id
		LEFT JOIN user_knmps uk ON u.id = uk.user_id
		LEFT JOIN knmps k ON uk.knmp_id = k.id
		WHERE u.deleted_at IS NULL
	`
	var args []any

	if search != "" {
		query += ` AND (u.name ILIKE $1 OR u.email ILIKE $1)`
		args = append(args, "%"+search+"%")
	}
	query += ` ORDER BY u.id ASC`

	err := r.db.SelectContext(ctx, &users, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	return users, nil
}

func (r *userRepo) Create(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (name, email, password, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(ctx, query, user.Name, user.Email, user.Password).
		Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

func (r *userRepo) Update(ctx context.Context, user *domain.User) error {
	var query string
	var err error
	if user.Password != "" {
		query = `UPDATE users SET name = $1, email = $2, password = $3, updated_at = NOW() WHERE id = $4 AND deleted_at IS NULL`
		_, err = r.db.ExecContext(ctx, query, user.Name, user.Email, user.Password, user.ID)
	} else {
		query = `UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 AND deleted_at IS NULL`
		_, err = r.db.ExecContext(ctx, query, user.Name, user.Email, user.ID)
	}
	if err != nil {
		return fmt.Errorf("update user: %w", err)
	}
	return nil
}

func (r *userRepo) Delete(ctx context.Context, id int64) error {
	query := `UPDATE users SET deleted_at = NOW() WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *userRepo) GetUserRoles(ctx context.Context, userID int64) ([]string, error) {
	var roles []string
	query := `
		SELECT r.name FROM roles r
		JOIN model_has_roles mhr ON r.id = mhr.role_id
		WHERE mhr.model_id = $1
	`
	err := r.db.SelectContext(ctx, &roles, query, userID)
	if err != nil {
		return nil, err
	}
	return roles, nil
}

func (r *userRepo) GetUserPermissions(ctx context.Context, userID int64) ([]string, error) {
	var permissions []string
	query := `
		SELECT DISTINCT p.name FROM permissions p
		JOIN role_has_permissions rhp ON p.id = rhp.permission_id
		JOIN model_has_roles mhr ON rhp.role_id = mhr.role_id
		WHERE mhr.model_id = $1
	`
	err := r.db.SelectContext(ctx, &permissions, query, userID)
	if err != nil {
		return nil, err
	}
	return permissions, nil
}

func (r *userRepo) GetUserKnmpIDs(ctx context.Context, userID int64) ([]int64, error) {
	var ids []int64
	query := `SELECT knmp_id FROM user_knmps WHERE user_id = $1`
	err := r.db.SelectContext(ctx, &ids, query, userID)
	if err != nil {
		return nil, err
	}
	return ids, nil
}

func (r *userRepo) AssignRole(ctx context.Context, userID int64, roleName string) error {
	var roleID int64
	err := r.db.GetContext(ctx, &roleID, `SELECT id FROM roles WHERE name = $1`, roleName)
	if err != nil {
		return fmt.Errorf("role %s not found: %w", roleName, err)
	}

	// Remove old roles and assign new
	_, _ = r.db.ExecContext(ctx, `DELETE FROM model_has_roles WHERE model_id = $1`, userID)
	_, err = r.db.ExecContext(ctx, `INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES ($1, 'App\\Models\\User', $2)`, roleID, userID)
	return err
}

func (r *userRepo) AssignKnmps(ctx context.Context, userID int64, knmpIDs []int64) error {
	_, _ = r.db.ExecContext(ctx, `DELETE FROM user_knmps WHERE user_id = $1`, userID)
	if len(knmpIDs) == 0 {
		return nil
	}

	for _, knmpID := range knmpIDs {
		_, err := r.db.ExecContext(ctx, `INSERT INTO user_knmps (user_id, knmp_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, userID, knmpID)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *userRepo) ListRoles(ctx context.Context) ([]*domain.Role, error) {
	var roles []*domain.Role
	err := r.db.SelectContext(ctx, &roles, `SELECT id, name, guard_name, created_at, updated_at FROM roles ORDER BY id ASC`)
	return roles, err
}
