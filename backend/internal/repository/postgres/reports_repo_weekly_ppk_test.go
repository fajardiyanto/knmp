package postgres

import (
	"context"
	"database/sql/driver"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"

	"knmp-v2-backend/internal/repository"
)

func TestGetWeeklyPPKReportDataScopedUsesCurrentSchemaAndPeriod(t *testing.T) {
	db, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherRegexp))
	if err != nil {
		t.Fatalf("create sqlmock: %v", err)
	}
	defer db.Close()
	mock.MatchExpectationsInOrder(false)

	repo := &laporanRepo{db: sqlx.NewDb(db, "sqlmock")}

	mock.ExpectQuery(regexp.QuoteMeta("SELECT u.name")).
		WillReturnRows(sqlmock.NewRows([]string{"name"}).AddRow("Admin PPK"))
	mock.ExpectQuery(regexp.QuoteMeta("SELECT u.name")).
		WillReturnRows(sqlmock.NewRows([]string{"name"}).AddRow("Pengawas"))

	mock.ExpectQuery(regexp.QuoteMeta("FROM knmps k")).
		WithArgs(anyArg{}, anyArg{}).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "lat", "long", "progress", "regency_name", "province_name"}).
			AddRow(int64(2), "KNMP Batee Shoek", float64(5.21), float64(96.72), float64(60), "Batee Shoek", "Aceh"))

	mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(DISTINCT knmp_id) FROM issues")).
		WithArgs(anyArg{}).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(DISTINCT LOWER(NULLIF(COALESCE(additional_data->>'nama_penyedia', nama), '')))")).
		WithArgs(anyArg{}).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	mock.ExpectQuery(regexp.QuoteMeta("SELECT COALESCE(SUM(")).
		WithArgs(anyArg{}).
		WillReturnRows(sqlmock.NewRows([]string{"coalesce"}).AddRow(float64(1485000000)))

	mock.ExpectQuery(regexp.QuoteMeta("FROM pembayarans pb")).
		WithArgs(anyArg{}).
		WillReturnRows(sqlmock.NewRows([]string{"coalesce"}).AddRow(float64(371250000)))

	mock.ExpectQuery(regexp.QuoteMeta("WITH latest AS")).
		WithArgs(anyArg{}, anyArg{}).
		WillReturnRows(sqlmock.NewRows([]string{"coalesce"}).AddRow(float64(15)))

	mock.ExpectQuery(regexp.QuoteMeta("FROM laporans l")).
		WithArgs(anyArg{}, "mingguan", anyArg{}, anyArg{}).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "nama", "tanggal", "jenis_laporan", "cuaca", "jumlah_tenaga_kerja",
			"rencana_progres_fisik", "realisasi_progres_fisik", "status", "keterangan", "knmp_name",
		}).AddRow(
			int64(8), "MINGGUAN TEST", "2026-08-24", "mingguan", "berawan", 20,
			float64(40), float64(60), "menunggu_pengawas", "test", "KNMP Batee Shoek",
		))

	mock.ExpectQuery(regexp.QuoteMeta("FROM issues i")).
		WithArgs(anyArg{}, anyArg{}).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "knmp_id", "kategori_issue", "tingkat", "status", "uraian_masalah",
			"created_at", "knmp_name", "created_by_name",
		}))

	mock.ExpectQuery(regexp.QuoteMeta("FROM pelaksanaans")).
		WithArgs(anyArg{}).
		WillReturnRows(sqlmock.NewRows([]string{"id", "nama", "rencana_minggu_depan"}))

	mock.ExpectQuery(regexp.QuoteMeta("FROM documents d")).
		WithArgs(anyArg{}, anyArg{}, anyArg{}).
		WillReturnRows(sqlmock.NewRows([]string{"id", "file_path", "file_name", "category", "knmp_name", "doc_title"}))

	mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(*)")).
		WithArgs(anyArg{}, anyArg{}, anyArg{}).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(*)")).
		WithArgs(anyArg{}, anyArg{}).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(*)")).
		WithArgs(anyArg{}, anyArg{}).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	data, err := repo.GetWeeklyPPKReportData(context.Background(), repository.WeeklyReportFilter{
		Type:        "mingguan",
		StartDate:   "2026-08-17",
		EndDate:     "2026-08-24",
		Month:       8,
		Year:        2026,
		IsGlobal:    false,
		UserKnmpIDs: []int64{2},
		UserID:      7,
	})
	if err != nil {
		t.Fatalf("GetWeeklyPPKReportData returned error: %v", err)
	}

	if data.TotalLokasi != 1 {
		t.Fatalf("expected scoped total_lokasi 1, got %d", data.TotalLokasi)
	}
	if data.CapaianFisikKumulatif != 60 {
		t.Fatalf("expected capaian_fisik_kumulatif 60, got %.2f", data.CapaianFisikKumulatif)
	}
	if data.ProgressTotalLalu != 15 || data.ProgressTotalIni != 45 || data.ProgressTotalKumulatif != 60 {
		t.Fatalf("unexpected progress totals: lalu=%.2f ini=%.2f kum=%.2f", data.ProgressTotalLalu, data.ProgressTotalIni, data.ProgressTotalKumulatif)
	}
	if data.NilaiKontrakKumulatif != 1485000000 || data.RealisasiKeuangan != 371250000 {
		t.Fatalf("unexpected financial values: kontrak=%.0f realisasi=%.0f", data.NilaiKontrakKumulatif, data.RealisasiKeuangan)
	}
	if len(data.LaporanLapangan) != 1 || data.LaporanLapangan[0].JenisLaporan != "Mingguan" {
		t.Fatalf("expected one weekly field report, got %+v", data.LaporanLapangan)
	}
	if data.LokasiOnProgress != 1 || data.LokasiSelesai != 0 {
		t.Fatalf("unexpected location status: on_progress=%d selesai=%d", data.LokasiOnProgress, data.LokasiSelesai)
	}
	if data.K3Pelatihan != 1 || data.K3Kecelakaan != 0 || data.K3NearMiss != 0 || data.K3KepatuhanAPD != 100 {
		t.Fatalf("unexpected K3 values: pelatihan=%d kecelakaan=%d near_miss=%d apd=%.1f", data.K3Pelatihan, data.K3Kecelakaan, data.K3NearMiss, data.K3KepatuhanAPD)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

type anyArg struct{}

func (anyArg) Match(driver.Value) bool {
	return true
}
