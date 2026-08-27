package postgres

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
	"knmp-v2-backend/internal/domain"
)

func RunMigrationsAndSeed(db *sqlx.DB, migrationsDir string) error {
	ctx := context.Background()

	// 1. Create schema_migrations table if not exists
	_, err := db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);
	`)
	if err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	// 2. Read migration files
	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Printf("Warning: migrations directory %s not found: %v", migrationsDir, err)
		return nil
	}

	var upFiles []string
	for _, f := range files {
		if !f.IsDir() && strings.HasSuffix(f.Name(), ".up.sql") {
			upFiles = append(upFiles, f.Name())
		}
	}
	sort.Strings(upFiles)

	for _, filename := range upFiles {
		var exists bool
		_ = db.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)`, filename).Scan(&exists)
		if exists {
			continue
		}

		fullPath := filepath.Join(migrationsDir, filename)
		content, err := os.ReadFile(fullPath)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", filename, err)
		}

		log.Printf("Applying database migration: %s", filename)
		tx, err := db.BeginTxx(ctx, nil)
		if err != nil {
			return fmt.Errorf("failed to begin tx for %s: %w", filename, err)
		}

		if _, err := tx.ExecContext(ctx, string(content)); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("failed to execute migration %s: %w", filename, err)
		}

		if _, err := tx.ExecContext(ctx, `INSERT INTO schema_migrations (version) VALUES ($1)`, filename); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("failed to record migration %s: %w", filename, err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit migration %s: %w", filename, err)
		}
	}

	log.Println("All database migrations applied successfully.")

	// 3. Run Seeder automatically if users are empty
	var userCount int
	_ = db.GetContext(ctx, &userCount, `SELECT COUNT(*) FROM users`)
	if userCount == 0 {
		log.Println("Database is empty, running initial seeders...")
		seedInitialData(db)
	}

	return nil
}

func seedInitialData(db *sqlx.DB) {
	ctx := context.Background()

	// 1. Permissions
	permissions := []string{
		"dashboard",
		"knmp_create", "knmp_read", "knmp_update", "knmp_delete",
		"kontrak_create", "kontrak_read", "kontrak_update", "kontrak_delete",
		"lapangan_create", "lapangan_read", "lapangan_update", "lapangan_delete",
		"pelaksanaan_create", "pelaksanaan_read", "pelaksanaan_update", "pelaksanaan_delete",
		"laporan_create", "laporan_read", "laporan_update", "laporan_delete",
		"laporan_verify_pengawas", "laporan_verify_wakil_ppk",
		"laporan_unverify_pengawas", "laporan_unverify_wakil_ppk",
		"absensi_create", "absensi_read", "absensi_update", "absensi_delete",
		"absensi_verify_pengawas", "absensi_verify_wakil_ppk",
		"absensi_unverify_pengawas", "absensi_unverify_wakil_ppk",
		"issue_create", "issue_read", "issue_update", "issue_delete",
		"issue_verify_pengawas", "issue_verify_wakil_ppk",
		"issue_unverify_pengawas", "issue_unverify_wakil_ppk",
		"user_create", "user_read", "user_update", "user_delete",
		"periode_create", "periode_read", "periode_update", "periode_delete",
		"jenis_bangunan_create", "jenis_bangunan_read", "jenis_bangunan_update", "jenis_bangunan_delete",
	}

	for _, p := range permissions {
		_, _ = db.ExecContext(ctx, `INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES ($1, 'api', NOW(), NOW()) ON CONFLICT (name) DO NOTHING`, p)
	}

	// 2. Roles
	roles := map[string][]string{
		"superadmin": permissions,
		"admin_ppk":  permissions,
		"kontraktor": {
			"knmp_create", "knmp_read", "knmp_update", "knmp_delete",
			"kontrak_create", "kontrak_read", "kontrak_update", "kontrak_delete",
			"lapangan_create", "lapangan_read", "lapangan_update", "lapangan_delete",
			"pelaksanaan_create", "pelaksanaan_read", "pelaksanaan_update", "pelaksanaan_delete",
			"laporan_create", "laporan_read", "laporan_update", "laporan_delete",
			"absensi_create", "absensi_read", "absensi_update", "absensi_delete",
			"issue_create", "issue_read", "issue_update", "issue_delete",
		},
		"pengawas": {
			"knmp_read",
			"laporan_read", "laporan_verify_pengawas", "laporan_unverify_pengawas",
			"absensi_read", "absensi_verify_pengawas", "absensi_unverify_pengawas",
			"issue_read", "issue_verify_pengawas", "issue_unverify_pengawas",
		},
		"wakil_ppk": {
			"dashboard", "knmp_read",
			"laporan_read", "laporan_verify_wakil_ppk", "laporan_unverify_wakil_ppk",
			"absensi_read", "absensi_create", "absensi_verify_wakil_ppk", "absensi_unverify_wakil_ppk",
			"issue_read", "issue_create", "issue_verify_wakil_ppk", "issue_unverify_wakil_ppk",
		},
		"ppk": {
			"dashboard",
		},
	}

	for roleName, perms := range roles {
		var roleID int64
		_ = db.QueryRowContext(ctx, `INSERT INTO roles (name, guard_name, created_at, updated_at) VALUES ($1, 'api', NOW(), NOW()) ON CONFLICT (name) DO UPDATE SET updated_at = NOW() RETURNING id`, roleName).Scan(&roleID)

		for _, permName := range perms {
			var permID int64
			err := db.GetContext(ctx, &permID, `SELECT id FROM permissions WHERE name = $1`, permName)
			if err == nil {
				_, _ = db.ExecContext(ctx, `INSERT INTO role_has_permissions (permission_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, permID, roleID)
			}
		}
	}

	// 3. Default Users
	defaultUsers := []struct {
		Name     string
		Email    string
		Password string
		Role     string
	}{
		{"SuperAdmin", "superadmin@gmail.com", "superadmin", "superadmin"},
		{"Admin PPK", "admin_ppk@gmail.com", "admin_ppk", "admin_ppk"},
		{"Kontraktor", "kontraktor@gmail.com", "kontraktor", "kontraktor"},
		{"Pengawas", "pengawas@gmail.com", "pengawas", "pengawas"},
		{"Wakil PPK", "wakil_ppk@gmail.com", "wakil_ppk", "wakil_ppk"},
		{"PPK", "ppk@gmail.com", "ppk", "ppk"},
	}

	userRepo := NewUserRepo(db)
	for _, u := range defaultUsers {
		existing, _ := userRepo.GetByEmail(ctx, u.Email)
		if existing == nil {
			hashed, _ := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
			user := &domain.User{
				Name:     u.Name,
				Email:    u.Email,
				Password: string(hashed),
			}
			_ = userRepo.Create(ctx, user)
			_ = userRepo.AssignRole(ctx, user.ID, u.Role)
			log.Printf("Seeded user: %s (%s)", u.Name, u.Email)
		}
	}

	// 4. Administrative Geo Regions
	_, _ = db.ExecContext(ctx, `
		INSERT INTO regionals (name) VALUES ('Regional 1 - Sumatera'), ('Regional 2 - Jawa & Bali'), ('Regional 3 - Kalimantan'), ('Regional 4 - Sulawesi & Papua') ON CONFLICT DO NOTHING;
		INSERT INTO provinces (regional_id, name) VALUES (1, 'Aceh'), (1, 'Sumatera Utara'), (2, 'DKI Jakarta'), (2, 'Jawa Barat'), (2, 'Jawa Timur'), (3, 'Kalimantan Timur'), (4, 'Sulawesi Selatan') ON CONFLICT DO NOTHING;
		INSERT INTO regencies (province_id, name, type) VALUES (3, 'Jakarta Utara', 'KOTA'), (4, 'Indramayu', 'KABUPATEN'), (5, 'Banyuwangi', 'KABUPATEN') ON CONFLICT DO NOTHING;
		INSERT INTO districts (regency_id, name) VALUES (1, 'Penjaringan'), (2, 'Balongan'), (3, 'Muncar') ON CONFLICT DO NOTHING;
		INSERT INTO sub_districts (district_id, name) VALUES (1, 'Muara Angke'), (2, 'Majakerta'), (3, 'Kedungrejo') ON CONFLICT DO NOTHING;
	`)

	// 5. Jenis Bangunans
	_, _ = db.ExecContext(ctx, `
		INSERT INTO jenis_bangunans (nama, deskripsi, is_active) VALUES
		('Gedung Kantor & Pos Pantau', 'Kantor operasional pengawas dan pengelola kampung nelayan', true),
		('Dermaga & Tambatan Perahu', 'Fasilitas tambat labuh perahu nelayan', true),
		('Cold Storage & Pabrik Es', 'Fasilitas pendingin dan rantai dingin hasil tangkapan', true),
		('Sentra Kuliner Nelayan', 'Pusat pengolahan dan pemasaran ikan higienis', true),
		('Bengkel Mesin Perahu & SPBU-N', 'Fasilitas perbaikan kapal dan pengisian BBM nelayan', true)
		ON CONFLICT DO NOTHING;
	`)

	// 6. Sample KNMP Locations
	_, _ = db.ExecContext(ctx, `
		INSERT INTO knmps (regional_id, province_id, regency_id, district_id, sub_district_id, name, jenis_knmp, lat, long, status)
		VALUES (2, 4, 2, 2, 2, 'KNMP Balongan Indramayu', 'baru', '-6.356241', '108.384232', 'aktif'),
		       (2, 3, 1, 1, 1, 'KNMP Muara Angke', 'existing', '-6.115421', '106.772541', 'aktif'),
		       (2, 5, 3, 3, 3, 'KNMP Muncar Banyuwangi', 'baru', '-8.432190', '114.331201', 'aktif')
		ON CONFLICT DO NOTHING;
	`)

	log.Println("Database seeding completed.")
}
