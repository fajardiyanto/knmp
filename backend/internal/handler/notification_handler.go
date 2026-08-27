package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"knmp-v2-backend/internal/middleware"
	"knmp-v2-backend/internal/service"
)

type NotificationHandler struct {
	notifSvc service.NotificationService
}

func NewNotificationHandler(notifSvc service.NotificationService) *NotificationHandler {
	return &NotificationHandler{notifSvc: notifSvc}
}

func (h *NotificationHandler) GetNotifications(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse("Unauthorized"))
	}
	userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)

	limit := 30
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	res, err := h.notifSvc.ListNotifications(c.Context(), userID, userRoles, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse("Gagal mengambil notifikasi"))
	}

	return c.JSON(OKResponse(res))
}

func (h *NotificationHandler) MarkAsRead(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse("Unauthorized"))
	}

	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID notifikasi tidak valid"))
	}

	if err := h.notifSvc.MarkAsRead(c.Context(), id, userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse("Gagal menandai notifikasi sebagai dibaca"))
	}

	return c.JSON(OKResponse(fiber.Map{"message": "Notifikasi ditandai telah dibaca"}))
}

func (h *NotificationHandler) MarkAllAsRead(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse("Unauthorized"))
	}
	userRoles, _ := c.Locals(middleware.CtxUserRolesKey).([]string)

	if err := h.notifSvc.MarkAllAsRead(c.Context(), userID, userRoles); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse("Gagal menandai semua notifikasi"))
	}

	return c.JSON(OKResponse(fiber.Map{"message": "Semua notifikasi telah ditandai dibaca"}))
}

func (h *NotificationHandler) DeleteNotification(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse("Unauthorized"))
	}

	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID notifikasi tidak valid"))
	}

	if err := h.notifSvc.DeleteNotification(c.Context(), id, userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse("Gagal menghapus notifikasi"))
	}

	return c.JSON(OKResponse(fiber.Map{"message": "Notifikasi berhasil dihapus"}))
}
