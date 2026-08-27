package domain

import "time"

type Notification struct {
	ID         int64      `db:"id" json:"id"`
	UserID     *int64     `db:"user_id" json:"user_id,omitempty"`
	RoleTarget *string    `db:"role_target" json:"role_target,omitempty"`
	Title      string     `db:"title" json:"title"`
	Message    string     `db:"message" json:"message"`
	Category   string     `db:"category" json:"category"` // 'chat', 'laporan', 'verifikasi', 'issue', 'system'
	Type       string     `db:"type" json:"type"`         // 'info', 'success', 'warning', 'primary'
	Link       *string    `db:"link" json:"link,omitempty"`
	IsRead     bool       `db:"is_read" json:"is_read"`
	ReadAt     *time.Time `db:"read_at" json:"read_at,omitempty"`
	CreatedAt  time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt  *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`
}

type NotificationListResponse struct {
	Notifications []Notification `json:"notifications"`
	UnreadCount   int            `json:"unread_count"`
}
