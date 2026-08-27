package main

import (
	"context"
	"log"

	"knmp-v2-backend/internal/config"
	"knmp-v2-backend/internal/handler"
	"knmp-v2-backend/internal/repository/postgres"
	"knmp-v2-backend/internal/router"
	"knmp-v2-backend/internal/service"
	"knmp-v2-backend/internal/telemetry"
	"knmp-v2-backend/pkg/storage"
)

func main() {
	cfg := config.Load()

	// 0. Initialize OpenTelemetry & Jaeger Tracer
	ctx := context.Background()
	shutdownTracer, err := telemetry.InitTracer(ctx, cfg.OtelServiceName, cfg.OtelEndpoint)
	if err != nil {
		log.Printf("[Jaeger/OTel] Warning: %v", err)
	} else {
		defer func() {
			if err := shutdownTracer(context.Background()); err != nil {
				log.Printf("[Jaeger/OTel] Error shutting down tracer: %v", err)
			}
		}()
	}

	// 1. Connect Database
	db, err := postgres.NewDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Fatal database error: %v", err)
	}
	defer db.Close()
	log.Printf("Successfully connected to PostgreSQL at %s", cfg.DatabaseURL)

	// Run Migrations and Seeders automatically
	migrationPaths := []string{"migrations", "./migrations", "/app/migrations", "backend/migrations"}
	for _, p := range migrationPaths {
		if err := postgres.RunMigrationsAndSeed(db, p); err == nil {
			break
		}
	}

	// 2. Initialize Storage
	storageEngine, err := storage.NewStorage(cfg)
	if err != nil {
		log.Fatalf("Fatal storage error: %v", err)
	}

	// 3. Initialize Repositories
	userRepo := postgres.NewUserRepo(db)
	geoRepo := postgres.NewGeoRepo(db)
	knmpRepo := postgres.NewKnmpRepo(db)
	persiapanRepo := postgres.NewPersiapanRepo(db)
	pelaksanaanRepo := postgres.NewPelaksanaanRepo(db)
	laporanRepo := postgres.NewLaporanRepo(db)
	absensiRepo := postgres.NewAbsensiRepo(db)
	issueRepo := postgres.NewIssueRepo(db)
	pembayaranRepo := postgres.NewPembayaranRepo(db)
	docRepo := postgres.NewDocumentRepo(db)
	verifRepo := postgres.NewVerificationRepo(db)
	chatRepo := postgres.NewChatRepo(db)

	// 4. Initialize Services & Hubs
	chatHub := service.NewChatHub()

	authSvc := service.NewAuthService(userRepo, cfg.JWTSecret)
	knmpSvc := service.NewKnmpService(knmpRepo, geoRepo)
	persiapanSvc := service.NewPersiapanService(persiapanRepo, docRepo, storageEngine)
	pelaksanaanSvc := service.NewPelaksanaanService(pelaksanaanRepo, docRepo, storageEngine)
	laporanSvc := service.NewLaporanService(laporanRepo, verifRepo, docRepo, storageEngine)
	absensiSvc := service.NewAbsensiService(absensiRepo, verifRepo, docRepo, storageEngine)
	issueSvc := service.NewIssueService(issueRepo, verifRepo, docRepo, storageEngine)
	pembayaranSvc := service.NewPembayaranService(pembayaranRepo, docRepo, storageEngine)
	docSvc := service.NewDocumentService(docRepo, storageEngine)
	chatSvc := service.NewChatService(chatRepo, chatHub)

	// 5. Initialize Handlers
	handlers := &router.Handlers{
		Auth:        handler.NewAuthHandler(authSvc),
		Knmp:        handler.NewKnmpHandler(knmpSvc),
		Persiapan:   handler.NewPersiapanHandler(persiapanSvc),
		Pelaksanaan: handler.NewPelaksanaanHandler(pelaksanaanSvc),
		Laporan:     handler.NewLaporanHandler(laporanSvc),
		Absensi:     handler.NewAbsensiHandler(absensiSvc),
		Issue:       handler.NewIssueHandler(issueSvc),
		Pembayaran:  handler.NewPembayaranHandler(pembayaranSvc),
		Document:    handler.NewDocumentHandler(docSvc),
		Chat:        handler.NewChatHandler(chatSvc, cfg.JWTSecret),
	}

	// 6. Build App & Listen
	app := router.New(cfg, handlers)
	log.Printf("KNMP V2 Backend starting on port %s (%s)...", cfg.Port, cfg.AppEnv)
	log.Fatal(app.Listen(":" + cfg.Port))
}
