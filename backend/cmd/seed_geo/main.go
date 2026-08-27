package main

import (
	"bufio"
	"database/sql"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func getRegionalID(provinceID int) int {
	switch {
	case (provinceID >= 11 && provinceID <= 21):
		return 1 // Sumatera
	case (provinceID >= 31 && provinceID <= 36):
		return 2 // Jawa
	case (provinceID >= 51 && provinceID <= 53):
		return 3 // Bali & Nusa Tenggara
	case (provinceID >= 61 && provinceID <= 65):
		return 4 // Kalimantan
	case (provinceID >= 71 && provinceID <= 76):
		return 5 // Sulawesi
	default:
		return 6 // Maluku & Papua
	}
}

func main() {
	start := time.Now()
	log.Println("Starting Geo Data Seeder...")

	dsn := "postgres://postgres:z04jP13DcE4z@72.61.140.136:5432/knmp_db?sslmode=disable"
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("Open DB: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Ping DB: %v", err)
	}
	log.Println("Connected to remote DB!")

	// 1. Seed Regionals
	_, err = db.Exec(`
		INSERT INTO regionals (id, name, created_at, updated_at)
		VALUES 
		(1, 'Sumatera', NOW(), NOW()),
		(2, 'Jawa', NOW(), NOW()),
		(3, 'Bali & Nusa Tenggara', NOW(), NOW()),
		(4, 'Kalimantan', NOW(), NOW()),
		(5, 'Sulawesi', NOW(), NOW()),
		(6, 'Maluku & Papua', NOW(), NOW())
		ON CONFLICT (id) DO NOTHING;
	`)
	if err != nil {
		log.Fatalf("Seed Regionals: %v", err)
	}
	log.Println("Regionals seeded.")

	// 2. Seed Provinces
	provFile, err := os.Open("db/data/provinsi.csv")
	if err != nil {
		log.Fatalf("Open provinsi.csv: %v", err)
	}
	defer provFile.Close()

	r := csv.NewReader(provFile)
	_, _ = r.Read() // header
	provCount := 0
	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil || len(rec) < 2 {
			continue
		}
		id, _ := strconv.Atoi(strings.TrimSpace(rec[0]))
		name := strings.TrimSpace(rec[1])
		regID := getRegionalID(id)

		_, err = db.Exec(`
			INSERT INTO provinces (id, regional_id, name, created_at, updated_at)
			VALUES ($1, $2, $3, NOW(), NOW())
			ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, regional_id = EXCLUDED.regional_id;
		`, id, regID, name)
		if err != nil {
			log.Printf("Insert province %d %s: %v", id, name, err)
		} else {
			provCount++
		}
	}
	log.Printf("Seeded %d Provinces.", provCount)

	// 3. Seed Regencies (Kabupaten)
	kabFile, err := os.Open("db/data/kabupaten.csv")
	if err != nil {
		log.Fatalf("Open kabupaten.csv: %v", err)
	}
	defer kabFile.Close()

	r = csv.NewReader(kabFile)
	_, _ = r.Read() // header
	kabCount := 0
	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil || len(rec) < 3 {
			continue
		}
		id, _ := strconv.Atoi(strings.TrimSpace(rec[0]))
		provID, _ := strconv.Atoi(strings.TrimSpace(rec[1]))
		name := strings.TrimSpace(rec[2])
		regType := "KABUPATEN"
		if strings.HasPrefix(strings.ToUpper(name), "KOTA") {
			regType = "KOTA"
		}

		_, err = db.Exec(`
			INSERT INTO regencies (id, province_id, name, type, created_at, updated_at)
			VALUES ($1, $2, $3, $4, NOW(), NOW())
			ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, province_id = EXCLUDED.province_id, type = EXCLUDED.type;
		`, id, provID, name, regType)
		if err != nil {
			log.Printf("Insert regency %d %s: %v", id, name, err)
		} else {
			kabCount++
		}
	}
	log.Printf("Seeded %d Regencies (Kabupaten/Kota).", kabCount)

	// 4. Seed Districts (Kecamatan) in batches
	kecFile, err := os.Open("db/data/kecamatan.csv")
	if err != nil {
		log.Fatalf("Open kecamatan.csv: %v", err)
	}
	defer kecFile.Close()

	r = csv.NewReader(kecFile)
	_, _ = r.Read() // header
	kecCount := 0

	var batchValues []string
	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil || len(rec) < 3 {
			continue
		}
		id, _ := strconv.Atoi(strings.TrimSpace(rec[0]))
		regID, _ := strconv.Atoi(strings.TrimSpace(rec[1]))
		name := strings.ReplaceAll(strings.TrimSpace(rec[2]), "'", "''")

		batchValues = append(batchValues, fmt.Sprintf("(%d, %d, '%s', NOW(), NOW())", id, regID, name))
		kecCount++

		if len(batchValues) >= 1000 {
			q := fmt.Sprintf(`INSERT INTO districts (id, regency_id, name, created_at, updated_at) VALUES %s ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, regency_id = EXCLUDED.regency_id;`, strings.Join(batchValues, ","))
			if _, err := db.Exec(q); err != nil {
				log.Fatalf("Batch insert districts: %v", err)
			}
			batchValues = nil
		}
	}
	if len(batchValues) > 0 {
		q := fmt.Sprintf(`INSERT INTO districts (id, regency_id, name, created_at, updated_at) VALUES %s ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, regency_id = EXCLUDED.regency_id;`, strings.Join(batchValues, ","))
		if _, err := db.Exec(q); err != nil {
			log.Fatalf("Final batch insert districts: %v", err)
		}
		batchValues = nil
	}
	log.Printf("Seeded %d Districts (Kecamatan).", kecCount)

	// 5. Seed Sub-Districts (Kelurahan / Desa) in batches
	kelFile, err := os.Open("db/data/kelurahan.csv")
	if err != nil {
		log.Fatalf("Open kelurahan.csv: %v", err)
	}
	defer kelFile.Close()

	scanner := bufio.NewScanner(kelFile)
	scanner.Scan() // skip header line
	subCount := 0

	batchValues = nil
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Split(line, ",")
		if len(parts) < 3 {
			continue
		}
		idStr := strings.TrimSpace(parts[0])
		distIDStr := strings.TrimSpace(parts[1])
		name := strings.ReplaceAll(strings.TrimSpace(strings.Join(parts[2:], ",")), "'", "''")

		id, err1 := strconv.ParseInt(idStr, 10, 64)
		distID, err2 := strconv.ParseInt(distIDStr, 10, 64)
		if err1 != nil || err2 != nil {
			continue
		}

		batchValues = append(batchValues, fmt.Sprintf("(%d, %d, '%s', NOW(), NOW())", id, distID, name))
		subCount++

		if len(batchValues) >= 2000 {
			q := fmt.Sprintf(`INSERT INTO sub_districts (id, district_id, name, created_at, updated_at) VALUES %s ON CONFLICT (id) DO NOTHING;`, strings.Join(batchValues, ","))
			if _, err := db.Exec(q); err != nil {
				log.Fatalf("Batch insert sub_districts: %v", err)
			}
			batchValues = nil
		}
	}
	if len(batchValues) > 0 {
		q := fmt.Sprintf(`INSERT INTO sub_districts (id, district_id, name, created_at, updated_at) VALUES %s ON CONFLICT (id) DO NOTHING;`, strings.Join(batchValues, ","))
		if _, err := db.Exec(q); err != nil {
			log.Fatalf("Final batch insert sub_districts: %v", err)
		}
		batchValues = nil
	}
	log.Printf("Seeded %d Sub-Districts (Kelurahan / Desa).", subCount)

	// Adjust sequences
	_, _ = db.Exec(`SELECT setval('regionals_id_seq', (SELECT COALESCE(MAX(id), 1) FROM regionals));`)
	_, _ = db.Exec(`SELECT setval('provinces_id_seq', (SELECT COALESCE(MAX(id), 1) FROM provinces));`)
	_, _ = db.Exec(`SELECT setval('regencies_id_seq', (SELECT COALESCE(MAX(id), 1) FROM regencies));`)
	_, _ = db.Exec(`SELECT setval('districts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM districts));`)
	_, _ = db.Exec(`SELECT setval('sub_districts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sub_districts));`)

	log.Printf("🎉 All Geo Data successfully seeded in %v!", time.Since(start))
}
