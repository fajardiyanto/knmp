package postgres

import (
	"context"
	"encoding/json"
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

	// 3. Ensure perusahaans table and seeders are guaranteed to exist on all environments
	ensurePerusahaansTableAndSeed(db)

	// 4. Run Seeder automatically if users are empty
	var userCount int
	_ = db.GetContext(ctx, &userCount, `SELECT COUNT(*) FROM users`)
	if userCount == 0 {
		log.Println("Database is empty, running initial seeders...")
		seedInitialData(db)
	} else {
		// Ensure all KNMP locations have their 2 dedicated users
		seedKNMPUsers(db)
		// Ensure contracts and payment milestones are seeded
		seedKontrakSumatera(db)
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

	// 7. Seed 2 Users per KNMP
	seedKNMPUsers(db)

	// 8. Seed Contracts and Payments
	seedKontrakSumatera(db)

	log.Println("Database seeding completed.")
}

func seedKNMPUsers(db *sqlx.DB) {
	ctx := context.Background()
	userRepo := NewUserRepo(db)

	var knmps []struct {
		ID   int64  `db:"id"`
		Name string `db:"name"`
	}
	err := db.SelectContext(ctx, &knmps, `SELECT id, name FROM knmps ORDER BY id ASC`)
	if err != nil || len(knmps) == 0 {
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
	if err != nil {
		return
	}
	defaultPw := string(hashedPassword)

	countCreated := 0
	for _, k := range knmps {
		// Check how many users already assigned to this KNMP
		var existingCount int
		_ = db.GetContext(ctx, &existingCount, `SELECT COUNT(*) FROM user_knmps WHERE knmp_id = $1`, k.ID)
		if existingCount >= 2 {
			continue
		}

		// User 1
		email1 := fmt.Sprintf("user1.knmp%d@pertamina.com", k.ID)
		name1 := fmt.Sprintf("Pelaksana 1 (%s)", k.Name)
		existing1, _ := userRepo.GetByEmail(ctx, email1)
		if existing1 == nil {
			u1 := &domain.User{
				Name:     name1,
				Email:    email1,
				Password: defaultPw,
			}
			if err := userRepo.Create(ctx, u1); err == nil {
				_ = userRepo.AssignRole(ctx, u1.ID, "kontraktor")
				_ = userRepo.AssignKnmps(ctx, u1.ID, []int64{k.ID})
				countCreated++
			}
		} else {
			_ = userRepo.AssignKnmps(ctx, existing1.ID, []int64{k.ID})
		}

		// User 2
		email2 := fmt.Sprintf("user2.knmp%d@pertamina.com", k.ID)
		name2 := fmt.Sprintf("Pelaksana 2 (%s)", k.Name)
		existing2, _ := userRepo.GetByEmail(ctx, email2)
		if existing2 == nil {
			u2 := &domain.User{
				Name:     name2,
				Email:    email2,
				Password: defaultPw,
			}
			if err := userRepo.Create(ctx, u2); err == nil {
				_ = userRepo.AssignRole(ctx, u2.ID, "kontraktor")
				_ = userRepo.AssignKnmps(ctx, u2.ID, []int64{k.ID})
				countCreated++
			}
		} else {
			_ = userRepo.AssignKnmps(ctx, existing2.ID, []int64{k.ID})
		}
	}

	if countCreated > 0 {
		log.Printf("Seeded %d dedicated field users (2 users per KNMP) with password 'password'.", countCreated)
	}
}

func seedKontrakSumatera(db *sqlx.DB) {
	ctx := context.Background()

	// Check if already seeded
	var count int
	_ = db.GetContext(ctx, &count, `SELECT COUNT(*) FROM persiapans WHERE jenis = 'kontrak'`)
	if count > 5 {
		return
	}

	jsonPaths := []string{
		"data/kontrak_sumatera_parsed.json",
		"../data/kontrak_sumatera_parsed.json",
		"../../data/kontrak_sumatera_parsed.json",
		"d:/spacecode/NGS/pertamina/knmp-v2/data/kontrak_sumatera_parsed.json",
	}

	var raw []byte
	var err error
	for _, p := range jsonPaths {
		raw, err = os.ReadFile(p)
		if err == nil {
			break
		}
	}
	if len(raw) == 0 {
		return
	}

	type ContractItem struct {
		No           int     `json:"no"`
		NamaPenyedia string  `json:"nama_penyedia"`
		NamaPaket    string  `json:"nama_paket"`
		StatusAdmin  string  `json:"status_admin"`
		NomorSP      string  `json:"nomor_sp"`
		TglSP        string  `json:"tgl_sp"`
		NilaiKontrak float64 `json:"nilai_kontrak"`
		Alamat       string  `json:"alamat"`
		NPWP         string  `json:"npwp"`
		NamaDirektur string  `json:"nama_direktur"`
		Telp         string  `json:"telp"`
		Email        string  `json:"email"`
		NamaBank     string  `json:"nama_bank"`
		Norek        string  `json:"norek"`
		CabangBank   string  `json:"cabang_bank"`
		JangkaWaktu  string  `json:"jangka_waktu"`
		NomorSPMK    string  `json:"nomor_spmk"`
		TglMulai     string  `json:"tgl_mulai"`
		TglSelesai   string  `json:"tgl_selesai"`
		RuangLingkup string  `json:"ruang_lingkup"`
		JumlahDesa   int     `json:"jumlah_desa"`
		WakilPPK     string  `json:"wakil_ppk"`
	}

	var list []ContractItem
	if err := json.Unmarshal(raw, &list); err != nil {
		return
	}

	insertedCount := 0
	for _, c := range list {
		var exists bool
		_ = db.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM persiapans WHERE nama = $1 AND jenis = 'kontrak')`, c.NamaPenyedia).Scan(&exists)
		if exists {
			continue
		}

		// Find knmp_id by location match if any
		var knmpID *int64
		var foundID int64
		err := db.GetContext(ctx, &foundID, `SELECT id FROM knmps WHERE $1 ILIKE '%' || name || '%' OR name ILIKE '%' || $2 || '%' LIMIT 1`, c.RuangLingkup, c.NamaPaket)
		if err == nil && foundID > 0 {
			knmpID = &foundID
		}

		addJson, _ := json.Marshal(c)
		tgl := c.TglSP
		if tgl == "" {
			tgl = "2026-08-15"
		}
		status := c.StatusAdmin
		if status == "" {
			status = "Sudah ttd Kontrak"
		}
		ket := fmt.Sprintf("%s [No. SP: %s]", c.NamaPaket, c.NomorSP)

		var persiapanID int64
		query := `
			INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
			VALUES ($1, $2, $3, 'kontrak', $4, $5, $6, NOW(), NOW())
			RETURNING id
		`
		err = db.QueryRowContext(ctx, query, knmpID, c.NamaPenyedia, tgl, ket, status, string(addJson)).Scan(&persiapanID)
		if err == nil && persiapanID > 0 {
			insertedCount++
			if c.NilaiKontrak > 0 {
				norekInfo := fmt.Sprintf("%s (%s %s)", c.Norek, c.NamaBank, c.CabangBank)
				// Seed 5 Payment Termins
				_, _ = db.ExecContext(ctx, `
					INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
					VALUES 
					($1, $2, 'Realisasi Konstruksi', 'Termin 1', $3, 25.00, $4, NOW(), NOW()),
					($1, $5, 'Realisasi Konstruksi', 'Termin 2', $6, 50.00, $4, NOW(), NOW()),
					($1, $7, 'Realisasi Konstruksi', 'Termin 3', $8, 75.00, $4, NOW(), NOW()),
					($1, $9, 'Realisasi Konstruksi', 'Termin 4', $10, 100.00, $4, NOW(), NOW()),
					($1, $11, 'Jaminan Pemeliharaan', 'Retensi', $12, 100.00, $4, NOW(), NOW())
				`,
					persiapanID,
					fmt.Sprintf("Uang Muka / Termin 1 - %s", c.NamaPenyedia),
					c.NilaiKontrak*0.25,
					norekInfo,
					fmt.Sprintf("Termin 2 (Progress 50%%) - %s", c.NamaPenyedia),
					c.NilaiKontrak*0.25,
					fmt.Sprintf("Termin 3 (Progress 75%%) - %s", c.NamaPenyedia),
					c.NilaiKontrak*0.25,
					fmt.Sprintf("Termin 4 (Progress 100%%) - %s", c.NamaPenyedia),
					c.NilaiKontrak*0.20,
					fmt.Sprintf("Retensi Pemeliharaan (5%%) - %s", c.NamaPenyedia),
					c.NilaiKontrak*0.05,
				)
			}
		}
	}

	if insertedCount > 0 {
		log.Printf("Seeded %d contracts and payment milestones from Data Kontrak Sumatera.xlsx", insertedCount)
	}
}

func ensurePerusahaansTableAndSeed(db *sqlx.DB) {
	ctx := context.Background()
	_, err := db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS perusahaans (
			id BIGSERIAL PRIMARY KEY,
			nama VARCHAR(255) NOT NULL,
			alamat TEXT NULL,
			npwp VARCHAR(100) NULL,
			nama_direktur VARCHAR(255) NULL,
			jabatan_direktur VARCHAR(100) NULL DEFAULT 'Direktur',
			no_telp VARCHAR(50) NULL,
			email VARCHAR(255) NULL,
			notaris_akta VARCHAR(255) NULL,
			tanggal_akta VARCHAR(50) NULL,
			no_akta VARCHAR(100) NULL,
			nama_bank VARCHAR(100) NULL,
			norek_bank VARCHAR(100) NULL,
			cabang_bank VARCHAR(255) NULL,
			nama_bank_jaminan VARCHAR(100) NULL,
			no_jaminan VARCHAR(100) NULL,
			tgl_jaminan VARCHAR(50) NULL,
			no_kontrak VARCHAR(255) NULL,
			nama_paket TEXT NULL,
			status_administrasi VARCHAR(100) NULL,
			status_karwas VARCHAR(100) NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP NULL
		);
		ALTER TABLE perusahaans ADD COLUMN IF NOT EXISTS status_administrasi VARCHAR(100) NULL;
		ALTER TABLE perusahaans ADD COLUMN IF NOT EXISTS status_karwas VARCHAR(100) NULL;
		CREATE INDEX IF NOT EXISTS idx_perusahaans_nama ON perusahaans(nama);
		CREATE INDEX IF NOT EXISTS idx_perusahaans_kontrak ON perusahaans(no_kontrak);
		CREATE INDEX IF NOT EXISTS idx_perusahaans_status_admin ON perusahaans(status_administrasi);
	`)
	if err != nil {
		log.Printf("Warning: failed to ensure perusahaans table: %v", err)
		return
	}

	var count int
	_ = db.GetContext(ctx, &count, `SELECT COUNT(*) FROM perusahaans`)
	if count == 0 {
		log.Println("Table perusahaans is empty, seeding companies from migration...")
		migrationPaths := []string{
			"migrations/000003_create_perusahaans_table.up.sql",
			"./migrations/000003_create_perusahaans_table.up.sql",
			"/app/migrations/000003_create_perusahaans_table.up.sql",
			"backend/migrations/000003_create_perusahaans_table.up.sql",
		}
		for _, p := range migrationPaths {
			content, err := os.ReadFile(p)
			if err == nil {
				_, err = db.ExecContext(ctx, string(content))
				if err == nil {
					log.Println("Successfully auto-seeded perusahaans table!")
					break
				}
			}
		}
	} else {
		// Update status_administrasi on existing records if NULL
		var nullStatusCount int
		_ = db.GetContext(ctx, &nullStatusCount, `SELECT COUNT(*) FROM perusahaans WHERE status_administrasi IS NULL`)
		if nullStatusCount > 0 {
			migrationPaths := []string{
				"migrations/000003_create_perusahaans_table.up.sql",
				"./migrations/000003_create_perusahaans_table.up.sql",
				"/app/migrations/000003_create_perusahaans_table.up.sql",
				"backend/migrations/000003_create_perusahaans_table.up.sql",
			}
			for _, p := range migrationPaths {
				content, err := os.ReadFile(p)
				if err == nil {
					// re-apply migration to populate statuses
					_, _ = db.ExecContext(ctx, `TRUNCATE TABLE perusahaans RESTART IDENTITY; `+string(content))
					log.Println("Updated perusahaans with status_administrasi and status_karwas!")
					break
				}
			}
		}
	}
}
