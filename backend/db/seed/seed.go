package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
	"knmp-v2-backend/internal/config"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository/postgres"
)

func main() {
	cfg := config.Load()
	db, err := postgres.NewDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("seed db connect error: %v", err)
	}
	defer db.Close()
	ctx := context.Background()

	log.Println("Starting database seed...")

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
	log.Printf("Seeded %d permissions", len(permissions))

	// 2. Roles & Permissions Matrix
	roles := map[string][]string{
		"superadmin":  permissions,
		"super_admin": permissions,
		"admin_ppk":   permissions,
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
	log.Println("Seeded roles and permission mappings")

	// 3. Default Users
	defaultUsers := []struct {
		Name     string
		Email    string
		Password string
		Role     string
	}{
		{"SuperAdmin", "superadmin@gmail.com", "password", "super_admin"},
		{"Admin PPK", "admin_ppk@gmail.com", "password", "admin_ppk"},
		{"Admin Kontraktor", "kontraktor@gmail.com", "password", "admin_ppk"},
		{"Pengawas", "pengawas@gmail.com", "password", "pengawas"},
		{"Wakil PPK", "wakil_ppk@gmail.com", "password", "wakil_ppk"},
		{"PPK", "ppk@gmail.com", "password", "ppk"},
	}

	userRepo := postgres.NewUserRepo(db)
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
			log.Printf("Created user %s (%s)", u.Name, u.Email)
		}
	}

	// 4. Sample Geographic Regions
	var regCount int
	_ = db.GetContext(ctx, &regCount, `SELECT COUNT(*) FROM regionals`)
	if regCount == 0 {
		_, _ = db.ExecContext(ctx, `
			INSERT INTO regionals (name) VALUES ('Regional 1 - Sumatera'), ('Regional 2 - Jawa & Bali'), ('Regional 3 - Kalimantan'), ('Regional 4 - Sulawesi & Papua')
		`)
		_, _ = db.ExecContext(ctx, `
			INSERT INTO provinces (regional_id, name) VALUES (1, 'Aceh'), (1, 'Sumatera Utara'), (2, 'DKI Jakarta'), (2, 'Jawa Barat'), (2, 'Jawa Timur'), (3, 'Kalimantan Timur'), (4, 'Sulawesi Selatan')
		`)
		_, _ = db.ExecContext(ctx, `
			INSERT INTO regencies (province_id, name, type) VALUES (3, 'Jakarta Utara', 'KOTA'), (4, 'Indramayu', 'KABUPATEN'), (5, 'Banyuwangi', 'KABUPATEN')
		`)
		_, _ = db.ExecContext(ctx, `
			INSERT INTO districts (regency_id, name) VALUES (1, 'Penjaringan'), (2, 'Balongan'), (3, 'Muncar')
		`)
		_, _ = db.ExecContext(ctx, `
			INSERT INTO sub_districts (district_id, name) VALUES (1, 'Muara Angke'), (2, 'Majakerta'), (3, 'Kedungrejo')
		`)
		log.Println("Seeded administrative geographic sample data")
	}

	// 5. Sample Jenis Bangunan
	var jbCount int
	_ = db.GetContext(ctx, &jbCount, `SELECT COUNT(*) FROM jenis_bangunans`)
	if jbCount == 0 {
		_, _ = db.ExecContext(ctx, `
			INSERT INTO jenis_bangunans (nama, deskripsi, is_active) VALUES
			('Gedung Kantor & Pos Pantau', 'Kantor operasional pengawas dan pengelola kampung nelayan', true),
			('Dermaga & Tambatan Perahu', 'Fasilitas tambat labuh perahu nelayan', true),
			('Cold Storage & Pabrik Es', 'Fasilitas pendingin dan rantai dingin hasil tangkapan', true),
			('Sentra Kuliner Nelayan', 'Pusat pengolahan dan pemasaran ikan higienis', true),
			('Bengkel Mesin Perahu & SPBU-N', 'Fasilitas perbaikan kapal dan pengisian BBM nelayan', true)
		`)
		log.Println("Seeded jenis bangunan catalog")
	}

	// 6. Sample KNMP Project
	var knmpCount int
	_ = db.GetContext(ctx, &knmpCount, `SELECT COUNT(*) FROM knmps`)
	if knmpCount == 0 {
		_, _ = db.ExecContext(ctx, `
			INSERT INTO knmps (regional_id, province_id, regency_id, district_id, sub_district_id, name, jenis_knmp, lat, long, status)
			VALUES (2, 4, 2, 2, 2, 'KNMP Balongan Indramayu', 'baru', '-6.356241', '108.384232', 'aktif'),
			       (2, 3, 1, 1, 1, 'KNMP Muara Angke', 'existing', '-6.115421', '106.772541', 'aktif'),
			       (2, 5, 3, 3, 3, 'KNMP Muncar Banyuwangi', 'baru', '-8.432190', '114.331201', 'aktif')
		`)
		log.Println("Seeded sample KNMP project locations")
	}

	// 7. Seed 2 Users per KNMP
	seedKNMPUsers(db)

	fmt.Println("Database seed completed successfully!")
}

func seedKNMPUsers(db *sqlx.DB) {
	ctx := context.Background()
	userRepo := postgres.NewUserRepo(db)

	var knmps []struct {
		ID   int64  `db:"id"`
		Name string `db:"name"`
	}
	err := db.SelectContext(ctx, &knmps, `SELECT id, name FROM knmps ORDER BY id ASC`)
	if err != nil || len(knmps) == 0 {
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
	defaultPw := string(hashedPassword)

	countCreated := 0
	for _, k := range knmps {
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
				_ = userRepo.AssignRole(ctx, u1.ID, "Admin_ppk")
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
				_ = userRepo.AssignRole(ctx, u2.ID, "Admin_ppk")
				_ = userRepo.AssignKnmps(ctx, u2.ID, []int64{k.ID})
				countCreated++
			}
		} else {
			_ = userRepo.AssignKnmps(ctx, existing2.ID, []int64{k.ID})
		}
	}

	if countCreated > 0 {
		log.Printf("Seeded %d dedicated field users (2 users per KNMP).", countCreated)
	}
}
