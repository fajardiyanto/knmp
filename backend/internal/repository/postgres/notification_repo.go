package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"knmp-v2-backend/internal/domain"
)

type NotificationRepo interface {
	Create(ctx context.Context, notif *domain.Notification) error
	GetByUserID(ctx context.Context, userID int64, userRoles []string, limit int) ([]domain.Notification, error)
	CountUnread(ctx context.Context, userID int64, userRoles []string) (int, error)
	MarkAsRead(ctx context.Context, id int64, userID int64) error
	MarkAllAsRead(ctx context.Context, userID int64, userRoles []string) error
	Delete(ctx context.Context, id int64, userID int64) error
}

type notificationRepo struct {
	db *sqlx.DB
}

func NewNotificationRepo(db *sqlx.DB) NotificationRepo {
	return &notificationRepo{db: db}
}

func (r *notificationRepo) Create(ctx context.Context, notif *domain.Notification) error {
	query := `
		INSERT INTO notifications (
			user_id, role_target, title, message, category, type, link, is_read, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
		) RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(
		ctx, query,
		notif.UserID, notif.RoleTarget, notif.Title, notif.Message,
		notif.Category, notif.Type, notif.Link, notif.IsRead,
	).Scan(&notif.ID, &notif.CreatedAt, &notif.UpdatedAt)
}

func (r *notificationRepo) GetByUserID(ctx context.Context, userID int64, userRoles []string, limit int) ([]domain.Notification, error) {
	if limit <= 0 {
		limit = 30
	}

	query := `
		SELECT id, user_id, role_target, title, message, category, type, link, is_read, read_at, created_at, updated_at
		FROM notifications
		WHERE deleted_at IS NULL
		  AND (
		      user_id = $1
		      OR (user_id IS NULL AND (role_target IS NULL OR role_target = '' OR role_target = ANY($2)))
		  )
		ORDER BY created_at DESC
		LIMIT $3
	`

	var notifs []domain.Notification
	err := r.db.SelectContext(ctx, &notifs, query, userID, userRoles, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch notifications: %w", err)
	}
	return notifs, nil
}

func (r *notificationRepo) CountUnread(ctx context.Context, userID int64, userRoles []string) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM notifications
		WHERE deleted_at IS NULL
		  AND is_read = FALSE
		  AND (
		      user_id = $1
		      OR (user_id IS NULL AND (role_target IS NULL OR role_target = '' OR role_target = ANY($2)))
		  )
	`
	var count int
	err := r.db.GetContext(ctx, &count, query, userID, userRoles)
	if err != nil {
		return 0, fmt.Errorf("failed to count unread notifications: %w", err)
	}
	return count, nil
}

func (r *notificationRepo) MarkAsRead(ctx context.Context, id int64, userID int64) error {
	now := time.Now()
	query := `
		UPDATE notifications
		SET is_read = TRUE, read_at = $1, updated_at = $1
		WHERE id = $2 AND deleted_at IS NULL
	`
	_, err := r.db.ExecContext(ctx, query, now, id)
	if err != nil {
		return fmt.Errorf("failed to mark notification as read: %w", err)
	}
	return nil
}

func (r *notificationRepo) MarkAllAsRead(ctx context.Context, userID int64, userRoles []string) error {
	now := time.Now()
	query := `
		UPDATE notifications
		SET is_read = TRUE, read_at = $1, updated_at = $1
		WHERE deleted_at IS NULL
		  AND is_read = FALSE
		  AND (
		      user_id = $2
		      OR (user_id IS NULL AND (role_target IS NULL OR role_target = '' OR role_target = ANY($3)))
		  )
	`
	_, err := r.db.ExecContext(ctx, query, now, userID, userRoles)
	if err != nil {
		return fmt.Errorf("failed to mark all notifications as read: %w", err)
	}
	return nil
}

func (r *notificationRepo) Delete(ctx context.Context, id int64, userID int64) error {
	now := time.Now()
	query := `
		UPDATE notifications
		SET deleted_at = $1, updated_at = $1
		WHERE id = $2 AND deleted_at IS NULL
	`
	_, err := r.db.ExecContext(ctx, query, now, id)
	if err != nil {
		return fmt.Errorf("failed to soft-delete notification: %w", err)
	}
	return nil
}
