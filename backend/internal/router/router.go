package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/websocket/v2"

	"knmp-v2-backend/internal/config"
	"knmp-v2-backend/internal/handler"
	"knmp-v2-backend/internal/middleware"
)

type Handlers struct {
	Auth         *handler.AuthHandler
	Knmp         *handler.KnmpHandler
	Persiapan    *handler.PersiapanHandler
	Pelaksanaan  *handler.PelaksanaanHandler
	Laporan      *handler.LaporanHandler
	Absensi      *handler.AbsensiHandler
	Issue        *handler.IssueHandler
	Pembayaran   *handler.PembayaranHandler
	Document     *handler.DocumentHandler
	Chat         *handler.ChatHandler
	Notification *handler.NotificationHandler
	Perusahaan   *handler.PerusahaanHandler
}

func New(cfg *config.Config, h *Handlers) *fiber.App {
	app := fiber.New(fiber.Config{
		ErrorHandler: customErrorHandler,
		BodyLimit:    25 * 1024 * 1024, // 25 MB max
	})

	app.Use(recover.New())
	app.Use(middleware.OTelMiddleware(cfg.OtelServiceName))
	app.Use(logger.New())
	// CORS Configuration (C-03)
	allowOrigins := "http://localhost:5173, http://localhost:3000, http://localhost:8080, http://127.0.0.1:5173, http://127.0.0.1:3000"
	if cfg.AppEnv == "production" {
		allowOrigins = "http://localhost:5173, http://localhost:8080"
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins: allowOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Extensions, Sec-WebSocket-Protocol",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "env": cfg.AppEnv})
	})

	// Static uploads directory
	app.Static("/uploads", "./uploads")

	// WebSocket Chat Route (C-04)
	if h.Chat != nil {
		app.Use("/ws/chat", middleware.WSAuthMiddleware(cfg.JWTSecret))
		app.Use("/ws/chat", func(c *fiber.Ctx) error {
			if websocket.IsWebSocketUpgrade(c) {
				c.Locals("allowed", true)
				return c.Next()
			}
			return fiber.ErrUpgradeRequired
		})
		app.Get("/ws/chat", websocket.New(h.Chat.HandleWebSocket))
	}

	api := app.Group("/api/v1")

	// Public routes
	api.Post("/auth/login", h.Auth.Login)
	api.Get("/documents/stream", h.Document.Stream)

	// Protected routes
	jwtAuth := middleware.JWTProtected(cfg.JWTSecret)
	protected := api.Group("", jwtAuth)

	// User & Auth
	protected.Get("/user", h.Auth.Me)
	protected.Delete("/auth/logout", h.Auth.Logout)
	protected.Get("/roles", h.Auth.ListRoles)
	protected.Get("/permissions", h.Auth.ListPermissions)
	protected.Get("/users", middleware.RequirePermission("user_read"), h.Auth.ListUsers)
	protected.Post("/users", middleware.RequirePermission("user_create"), h.Auth.CreateUser)
	protected.Put("/users/:id", middleware.RequirePermission("user_update"), h.Auth.UpdateUser)
	protected.Delete("/users/:id", middleware.RequirePermission("user_delete"), h.Auth.DeleteUser)

	// Geo lookups
	geo := protected.Group("/geo")
	geo.Get("/regionals", h.Knmp.ListRegionals)
	geo.Get("/regionals/:regionalId/provinces", h.Knmp.ListProvinces)
	geo.Get("/provinces/:provinceId/regencies", h.Knmp.ListRegencies)
	geo.Get("/regencies/:regencyId/districts", h.Knmp.ListDistricts)
	geo.Get("/districts/:districtId/sub-districts", h.Knmp.ListSubDistricts)

	// Master KNMP, Periode, Jenis Bangunan
	protected.Get("/knmp/widget", middleware.RequireRole("superadmin", "super admin", "admin_ppk", "admin", "pengawas", "ppk", "wakil_ppk", "wakil ppk"), h.Knmp.Widget)
	protected.Get("/knmp/map", middleware.RequireRole("superadmin", "super admin", "admin_ppk", "admin", "pengawas", "ppk", "wakil_ppk", "wakil ppk"), h.Knmp.Map)
	protected.Get("/knmp", middleware.RequirePermission("knmp_read"), h.Knmp.List)
	protected.Get("/knmp/:id", middleware.RequirePermission("knmp_read"), h.Knmp.GetByID)
	protected.Post("/knmp", middleware.RequirePermission("knmp_create"), h.Knmp.Create)
	protected.Put("/knmp/:id", middleware.RequirePermission("knmp_update"), h.Knmp.Update)
	protected.Delete("/knmp/:id", middleware.RequirePermission("knmp_delete"), h.Knmp.Delete)

	protected.Get("/periodes", h.Knmp.ListPeriodes)
	protected.Post("/periodes", middleware.RequirePermission("periode_create"), h.Knmp.CreatePeriode)
	protected.Put("/periodes/:id", middleware.RequirePermission("periode_update"), h.Knmp.UpdatePeriode)
	protected.Delete("/periodes/:id", middleware.RequirePermission("periode_delete"), h.Knmp.DeletePeriode)

	protected.Get("/jenis-bangunan", h.Knmp.ListJenisBangunan)
	protected.Post("/jenis-bangunan", middleware.RequirePermission("jenis_bangunan_create"), h.Knmp.CreateJenisBangunan)
	protected.Put("/jenis-bangunan/:id", middleware.RequirePermission("jenis_bangunan_update"), h.Knmp.UpdateJenisBangunan)
	protected.Delete("/jenis-bangunan/:id", middleware.RequirePermission("jenis_bangunan_delete"), h.Knmp.DeleteJenisBangunan)

	// Persiapan
	protected.Get("/persiapan", middleware.RequirePermission("kontrak_read", "lapangan_read"), h.Persiapan.List)
	protected.Get("/persiapan/:id", middleware.RequirePermission("kontrak_read", "lapangan_read"), h.Persiapan.GetByID)
	protected.Post("/persiapan", middleware.RequirePermission("kontrak_create", "lapangan_create"), h.Persiapan.Create)
	protected.Put("/persiapan/:id", middleware.RequirePermission("kontrak_update", "lapangan_update"), h.Persiapan.Update)
	protected.Delete("/persiapan/:id", middleware.RequirePermission("kontrak_delete", "lapangan_delete"), h.Persiapan.Delete)
	protected.Get("/persiapan/:id/pcm", h.Persiapan.GetPCM)
	protected.Get("/pcm", h.Persiapan.ListPCM)
	protected.Get("/pcm/:id", h.Persiapan.GetPCMByID)
	protected.Post("/pcm", h.Persiapan.SavePCM)
	protected.Delete("/pcm/:id", h.Persiapan.DeletePCM)

	// Pelaksanaan
	protected.Get("/pelaksanaan", middleware.RequirePermission("pelaksanaan_read"), h.Pelaksanaan.List)
	protected.Get("/pelaksanaan/:id", middleware.RequirePermission("pelaksanaan_read"), h.Pelaksanaan.GetByID)
	protected.Post("/pelaksanaan", middleware.RequirePermission("pelaksanaan_create"), h.Pelaksanaan.Create)
	protected.Put("/pelaksanaan/:id", middleware.RequirePermission("pelaksanaan_update"), h.Pelaksanaan.Update)
	protected.Delete("/pelaksanaan/:id", middleware.RequirePermission("pelaksanaan_delete"), h.Pelaksanaan.Delete)

	// Laporan Progres
	protected.Get("/laporan", middleware.RequirePermission("laporan_read"), h.Laporan.List)
	protected.Get("/laporan/monthly-project-report", middleware.RequirePermission("laporan_read"), h.Laporan.GetMonthlyProjectReportData)
	protected.Get("/laporan/:id", middleware.RequirePermission("laporan_read"), h.Laporan.GetByID)
	protected.Post("/laporan", middleware.RequirePermission("laporan_create"), h.Laporan.Create)
	protected.Patch("/laporan/:id/verify", middleware.RequirePermission("laporan_verify_pengawas", "laporan_verify_wakil_ppk"), h.Laporan.Verify)
	protected.Patch("/laporan/:id/unverify", middleware.RequirePermission("laporan_unverify_pengawas", "laporan_unverify_wakil_ppk"), h.Laporan.Unverify)
	protected.Delete("/laporan/:id", middleware.RequirePermission("laporan_delete"), h.Laporan.Delete)

	// Absensi
	protected.Get("/absensi", middleware.RequirePermission("absensi_read"), h.Absensi.List)
	protected.Get("/absensi/:id", middleware.RequirePermission("absensi_read"), h.Absensi.GetByID)
	protected.Patch("/absensi/:id/verify", middleware.RequirePermission("absensi_verify_pengawas", "absensi_verify_wakil_ppk"), h.Absensi.Verify)
	protected.Patch("/absensi/:id/unverify", middleware.RequirePermission("absensi_unverify_pengawas", "absensi_unverify_wakil_ppk"), h.Absensi.Unverify)

	// Issues
	protected.Get("/issue", middleware.RequirePermission("issue_read"), h.Issue.List)
	protected.Get("/issue/:id", middleware.RequirePermission("issue_read"), h.Issue.GetByID)
	protected.Post("/issue", middleware.RequirePermission("issue_create"), h.Issue.Create)
	protected.Put("/issue/:id", middleware.RequirePermission("issue_update"), h.Issue.Update)
	protected.Delete("/issue/:id", middleware.RequirePermission("issue_delete"), h.Issue.Delete)
	protected.Patch("/issue/:id/verify", middleware.RequirePermission("issue_verify_pengawas", "issue_verify_wakil_ppk"), h.Issue.Verify)
	protected.Patch("/issue/:id/unverify", middleware.RequirePermission("issue_unverify_pengawas", "issue_unverify_wakil_ppk"), h.Issue.Unverify)

	// Pembayaran
	protected.Get("/pembayaran/summary", h.Pembayaran.Summary)
	protected.Get("/pembayaran/termin", h.Pembayaran.Termin)
	protected.Get("/pembayaran", h.Pembayaran.List)
	protected.Get("/pembayaran/:id", h.Pembayaran.GetByID)
	protected.Post("/pembayaran", h.Pembayaran.Create)

	// Mobile Endpoints
	mobile := protected.Group("/mobile")
	mobile.Post("/absensi", middleware.RequirePermission("absensi_create"), h.Absensi.StoreMobile)
	mobile.Post("/laporan", middleware.RequirePermission("laporan_create"), h.Laporan.StoreMobile)
	mobile.Post("/issue", middleware.RequirePermission("issue_create"), h.Issue.StoreMobile)

	// Documents
	protected.Get("/documents/:id", h.Document.GetByID)
	protected.Get("/documents/:id/download", h.Document.Download)
	protected.Post("/documents", h.Document.Upload)
	protected.Patch("/documents/:id/verify", h.Document.Verify)
	protected.Delete("/documents/:id", h.Document.Delete)

	// Perusahaan / Kontraktor Detail & Master
	if h.Perusahaan != nil {
		protected.Get("/perusahaan", h.Perusahaan.List)
		protected.Get("/perusahaan/by-nama", h.Perusahaan.GetByNama)
		protected.Get("/perusahaan/:id", h.Perusahaan.GetByID)
		protected.Post("/perusahaan", h.Perusahaan.Create)
		protected.Put("/perusahaan/:id", h.Perusahaan.Update)
		protected.Delete("/perusahaan/:id", h.Perusahaan.Delete)
	}

	// Chat & Messaging
	if h.Chat != nil {
		chat := protected.Group("/chat")
		chat.Get("/conversations", h.Chat.ListConversations)
		chat.Post("/conversations", h.Chat.CreatePersonalChat)
		chat.Post("/groups", h.Chat.CreateGroupChat)
		chat.Get("/conversations/:id", h.Chat.GetConversation)
		chat.Patch("/conversations/:id", h.Chat.UpdateGroup)
		chat.Delete("/conversations/:id", h.Chat.DeleteConversation)
		chat.Get("/conversations/:id/messages", h.Chat.ListMessages)
		chat.Post("/conversations/:id/messages", h.Chat.SendMessage)
		chat.Delete("/messages/:messageId", h.Chat.DeleteMessage)
		chat.Post("/conversations/:id/read", h.Chat.MarkAsRead)
		chat.Post("/upload", h.Chat.UploadAttachment)
		chat.Get("/unread-count", h.Chat.GetUnreadCount)
		chat.Post("/groups/:id/members", h.Chat.AddMember)
		chat.Delete("/groups/:id/members/:userId", h.Chat.RemoveMember)
		chat.Get("/users/search", h.Chat.SearchUsers)
	}

	// Notifications
	if h.Notification != nil {
		notif := protected.Group("/notifications")
		notif.Get("", h.Notification.GetNotifications)
		notif.Put("/read-all", h.Notification.MarkAllAsRead)
		notif.Put("/:id/read", h.Notification.MarkAsRead)
		notif.Delete("/:id", h.Notification.DeleteNotification)
	}

	return app
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{
		"error": err.Error(),
	})
}
