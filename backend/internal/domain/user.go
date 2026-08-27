package domain

import "time"

type User struct {
	ID              int64      `db:"id" json:"id"`
	Name            string     `db:"name" json:"name"`
	Email           string     `db:"email" json:"email"`
	EmailVerifiedAt *time.Time `db:"email_verified_at" json:"email_verified_at,omitempty"`
	Password        string     `db:"password" json:"-"`
	RememberToken   *string    `db:"remember_token" json:"-"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt       *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`

	// Relational / Populated fields
	RoleName    *string  `db:"role_name" json:"role_name,omitempty"`
	KnmpName    *string  `db:"knmp_name" json:"knmp_name,omitempty"`
	Roles       []string `db:"-" json:"roles,omitempty"`
	Permissions []string `db:"-" json:"permissions,omitempty"`
	KnmpIDs     []int64  `db:"-" json:"knmp_ids,omitempty"`
}

type Role struct {
	ID        int64     `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	GuardName string    `db:"guard_name" json:"guard_name"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type Permission struct {
	ID        int64     `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	GuardName string    `db:"guard_name" json:"guard_name"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type UserKnmp struct {
	ID        int64     `db:"id" json:"id"`
	UserID    int64     `db:"user_id" json:"user_id"`
	KnmpID    int64     `db:"knmp_id" json:"knmp_id"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}
