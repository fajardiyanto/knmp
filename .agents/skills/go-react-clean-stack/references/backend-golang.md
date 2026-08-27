# Backend — Golang (Clean Architecture)

Struktur ini dipakai untuk semua backend Go: pisah jelas antara HTTP layer,
business logic, dan akses data — supaya mudah di-test dan di-maintain.

**Framework HTTP**: [`Fiber v2`](https://gofiber.io/) (`github.com/gofiber/fiber/v2`) —
performant (berbasis `fasthttp`), syntax ekspresif mirip Express.js, cocok
untuk clean architecture karena context-nya bersih dan middleware ekosistemnya lengkap.

---

## Struktur folder

```
backend/
├── cmd/
│   └── api/
│       └── main.go                 # entrypoint: load config, wiring dependency, start server
├── internal/
│   ├── config/
│   │   └── config.go                # baca environment variables
│   ├── domain/                      # entity/struct murni, TIDAK boleh import framework apa pun
│   │   ├── lokasi.go
│   │   ├── penyedia.go
│   │   ├── surat_pesanan.go
│   │   └── progres.go
│   ├── handler/                     # HTTP layer — terima request, panggil service, kirim response
│   │   ├── lokasi_handler.go
│   │   ├── progres_handler.go
│   │   └── response.go              # helper format response JSON konsisten
│   ├── service/                     # business logic — validasi, kalkulasi status, dsb
│   │   ├── lokasi_service.go
│   │   └── progres_service.go
│   ├── repository/                  # akses data — interface + implementasi per DB
│   │   ├── repository.go            # definisi interface (kontrak)
│   │   └── postgres/
│   │       ├── db.go                 # koneksi & pool
│   │       ├── lokasi_repo.go
│   │       └── progres_repo.go
│   ├── middleware/
│   │   ├── auth.go                  # JWT verify + RBAC
│   │   ├── logger.go
│   │   └── recover.go
│   └── router/
│       └── router.go                 # daftar route + pasang middleware
├── pkg/                              # helper yang reusable lintas project (opsional)
│   └── validator/
├── migrations/                       # migration SQL (pakai golang-migrate)
│   ├── 000001_create_lokasi_table.up.sql
│   ├── 000001_create_lokasi_table.down.sql
│   ├── 000002_create_penyedia_table.up.sql
│   └── 000002_create_penyedia_table.down.sql
├── db/
│   └── seed/
│       └── seed_lokasi.go            # import 1000 lokasi dari data awal
├── .env.example
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

## Aturan lapisan (layering rules)

```
handler  →  service  →  repository (interface)  →  repository/postgres (implementasi)  →  DB
```

- **`domain/`**: hanya struct data (mis. `Lokasi`, `Progres`). Tidak boleh punya method yang bergantung ke DB/HTTP.
- **`handler/`**: parse request via `fiber.Ctx`, validasi input, panggil `service`, format response. Tidak boleh langsung query DB.
- **`service/`**: logika bisnis (mis. hitung status lokasi otomatis dari data pengiriman + progres). Panggil `repository` lewat interface, bukan implementasi konkret.
- **`repository/`**: interface didefinisikan di `repository/repository.go`; implementasi konkret (Postgres, atau nanti MySQL/mock untuk testing) taruh di sub-folder terpisah.
- Semua dependency di-inject lewat constructor (`NewLokasiService(repo Repository) *LokasiService`), lalu di-wire sekali di `cmd/api/main.go`. Jangan pakai global variable untuk koneksi DB atau service.

## Koneksi database

Gunakan `sqlx` (di atas `database/sql`) dengan driver `pgx` — ringan, eksplisit, tanpa magic ORM:

```go
// internal/repository/postgres/db.go
package postgres

import (
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/jackc/pgx/v5/stdlib"
)

func NewDB(dsn string) (*sqlx.DB, error) {
	db, err := sqlx.Connect("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("connect db: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	return db, nil
}
```

DSN diambil dari environment variable, contoh `.env.example`:

```env
APP_ENV=development
APP_PORT=8080
DATABASE_URL=postgres://user:password@localhost:5432/knmp_monitoring?sslmode=disable
JWT_SECRET=ganti-dengan-secret-yang-kuat
```

## Migration

Pakai [`golang-migrate`](https://github.com/golang-migrate/migrate) CLI, bukan auto-migrate dari ORM — supaya perubahan schema eksplisit dan bisa di-review lewat file SQL.

```bash
migrate create -ext sql -dir migrations -seq create_lokasi_table
migrate -database "$DATABASE_URL" -path migrations up
```

## Contoh minimal tiap layer

```go
// internal/domain/lokasi.go
package domain

type Lokasi struct {
	ID              int64  `db:"id" json:"id"`
	NomorUrut       int    `db:"nomor_urut" json:"nomor_urut"`
	NamaKampung     string `db:"nama_kampung_nelayan" json:"nama_kampung_nelayan"`
	DesaKelurahan   string `db:"desa_kelurahan" json:"desa_kelurahan"`
	Kecamatan       string `db:"kecamatan" json:"kecamatan"`
	KabupatenKota   string `db:"kabupaten_kota" json:"kabupaten_kota"`
	Provinsi        string `db:"provinsi" json:"provinsi"`
	Status          string `db:"status" json:"status"`
}
```

```go
// internal/repository/repository.go
package repository

import (
	"context"
	"yourmodule/internal/domain"
)

type LokasiRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.Lokasi, error)
	List(ctx context.Context, filter LokasiFilter) ([]domain.Lokasi, error)
}
```

```go
// internal/service/lokasi_service.go
package service

import (
	"context"
	"yourmodule/internal/domain"
	"yourmodule/internal/repository"
)

type LokasiService struct {
	repo repository.LokasiRepository
}

func NewLokasiService(repo repository.LokasiRepository) *LokasiService {
	return &LokasiService{repo: repo}
}

func (s *LokasiService) GetLokasi(ctx context.Context, id int64) (*domain.Lokasi, error) {
	return s.repo.GetByID(ctx, id)
}
```

```go
// internal/handler/lokasi_handler.go
package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"yourmodule/internal/service"
)

type LokasiHandler struct {
	svc *service.LokasiService
}

func NewLokasiHandler(svc *service.LokasiService) *LokasiHandler {
	return &LokasiHandler{svc: svc}
}

func (h *LokasiHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("id tidak valid"))
	}

	lokasi, err := h.svc.GetLokasi(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse("lokasi tidak ditemukan"))
	}

	return c.JSON(OKResponse(lokasi))
}
```

## Router & setup Fiber

```go
// internal/router/router.go
package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"yourmodule/internal/handler"
)

func New(lokasiH *handler.LokasiHandler) *fiber.App {
	app := fiber.New(fiber.Config{
		ErrorHandler: customErrorHandler,
	})

	// Built-in middleware Fiber
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Authorization",
	}))

	// Routes
	api := app.Group("/api/v1")
	api.Get("/lokasi/:id", lokasiH.GetByID)
	api.Get("/lokasi", lokasiH.List)

	return app
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{"error": err.Error()})
}
```

```go
// cmd/api/main.go
package main

import (
	"log"

	"yourmodule/internal/config"
	"yourmodule/internal/handler"
	"yourmodule/internal/repository/postgres"
	"yourmodule/internal/router"
	"yourmodule/internal/service"
)

func main() {
	cfg := config.Load()

	db, err := postgres.NewDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer db.Close()

	// Wire dependencies
	lokasiRepo := postgres.NewLokasiRepo(db)
	lokasiSvc  := service.NewLokasiService(lokasiRepo)
	lokasiH    := handler.NewLokasiHandler(lokasiSvc)

	app := router.New(lokasiH)
	log.Fatal(app.Listen(":" + cfg.Port))
}
```

## Format response konsisten

```go
// internal/handler/response.go
package handler

type envelope struct {
	Data  any    `json:"data,omitempty"`
	Error string `json:"error,omitempty"`
}

func OKResponse(data any) envelope {
	return envelope{Data: data}
}

func ErrorResponse(msg string) envelope {
	return envelope{Error: msg}
}
```

Semua endpoint API mengembalikan `{ "data": ... }` atau `{ "error": "..." }` — frontend bisa handle secara seragam.

## Middleware JWT (Fiber)

```go
// internal/middleware/auth.go
package middleware

import (
	"github.com/gofiber/fiber/v2"
	jwtware "github.com/gofiber/contrib/jwt"
)

func JWTProtected(secret string) fiber.Handler {
	return jwtware.New(jwtware.Config{
		SigningKey: jwtware.SigningKey{Key: []byte(secret)},
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "token tidak valid atau sudah expired",
			})
		},
	})
}
```

Pasang di router:
```go
// route yang perlu auth
protected := api.Group("/admin", middleware.JWTProtected(cfg.JWTSecret))
protected.Get("/users", adminH.ListUsers)
```

## Validasi input (dengan go-playground/validator)

```go
// pkg/validator/validator.go
package validator

import "github.com/go-playground/validator/v10"

var validate = validator.New()

func Validate(s any) error {
	return validate.Struct(s)
}
```

```go
// Contoh di handler
type CreateLokasiRequest struct {
	NamaKampung   string `json:"nama_kampung_nelayan" validate:"required,min=3"`
	KabupatenKota string `json:"kabupaten_kota"       validate:"required"`
}

func (h *LokasiHandler) Create(c *fiber.Ctx) error {
	var req CreateLokasiRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("body tidak valid"))
	}
	if err := validator.Validate(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(ErrorResponse(err.Error()))
	}
	// ... panggil service
}
```

## Dependencies utama (go.mod)

```
github.com/gofiber/fiber/v2          # HTTP framework
github.com/gofiber/contrib/jwt       # JWT middleware untuk Fiber
github.com/jmoiron/sqlx              # SQL wrapper yang ergonomis
github.com/jackc/pgx/v5              # Postgres driver
github.com/golang-migrate/migrate/v4 # Database migration
github.com/go-playground/validator/v10 # Input validation
github.com/joho/godotenv             # Load .env file
```

## Testing

- `service/` di-test dengan mock `repository` (interface memudahkan ini — buat struct mock yang implement interface yang sama).
- `repository/postgres/` di-test dengan test database terpisah (atau `testcontainers-go` untuk spin up Postgres sungguhan saat CI).
- `handler/` di-test dengan `app.Test()` bawaan Fiber — tidak perlu `httptest` dari `net/http`, dan tidak hit database asli (mock service-nya).

```go
// Contoh test handler dengan Fiber
func TestGetLokasiByID(t *testing.T) {
	svc := &mockLokasiService{} // implementasi mock
	h   := handler.NewLokasiHandler(svc)
	app := fiber.New()
	app.Get("/lokasi/:id", h.GetByID)

	req := httptest.NewRequest("GET", "/lokasi/1", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}
```