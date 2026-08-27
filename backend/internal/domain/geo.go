package domain

import "time"

type Regional struct {
	ID        int64     `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type Province struct {
	ID         int64     `db:"id" json:"id"`
	RegionalID int64     `db:"regional_id" json:"regional_id"`
	Name       string    `db:"name" json:"name"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time `db:"updated_at" json:"updated_at"`
}

type Regency struct {
	ID         int64     `db:"id" json:"id"`
	ProvinceID int64     `db:"province_id" json:"province_id"`
	Name       string    `db:"name" json:"name"`
	Type       string    `db:"type" json:"type"` // KABUPATEN | KOTA
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time `db:"updated_at" json:"updated_at"`
}

type District struct {
	ID        int64     `db:"id" json:"id"`
	RegencyID int64     `db:"regency_id" json:"regency_id"`
	Name      string    `db:"name" json:"name"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type SubDistrict struct {
	ID         int64     `db:"id" json:"id"`
	DistrictID int64     `db:"district_id" json:"district_id"`
	Name       string    `db:"name" json:"name"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time `db:"updated_at" json:"updated_at"`
}
