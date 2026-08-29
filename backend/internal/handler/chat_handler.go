package handler

import (
	"context"
	"log"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/golang-jwt/jwt/v5"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/middleware"
	"knmp-v2-backend/internal/service"
	"knmp-v2-backend/pkg/storage"
)

type ChatHandler struct {
	chatSvc   service.ChatService
	jwtSecret string
	storage   storage.Storage
}

func NewChatHandler(chatSvc service.ChatService, jwtSecret string, storageEngine storage.Storage) *ChatHandler {
	return &ChatHandler{
		chatSvc:   chatSvc,
		jwtSecret: jwtSecret,
		storage:   storageEngine,
	}
}

func (h *ChatHandler) UploadAttachment(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil || file == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "File wajib diunggah"})
	}

	savedPath, fileName, fileType, err := h.storage.SaveUploadedFile(file, "chat")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal menyimpan file: " + err.Error()})
	}

	fileURL := h.storage.GetFileURL(savedPath)
	fileSize := file.Size

	return c.JSON(fiber.Map{
		"message": "File berhasil diunggah",
		"data": fiber.Map{
			"file_name": fileName,
			"file_path": savedPath,
			"file_type": fileType,
			"file_size": fileSize,
			"file_url":  fileURL,
		},
	})
}

func (h *ChatHandler) ListConversations(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	convs, err := h.chatSvc.GetUserConversations(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data": convs,
	})
}

func (h *ChatHandler) CreatePersonalChat(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var req domain.CreatePersonalChatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	conv, err := h.chatSvc.GetOrCreatePersonalChat(c.Context(), userID, req.UserID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Percakapan berhasil dibuat",
		"data":    conv,
	})
}

func (h *ChatHandler) CreateGroupChat(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var req domain.CreateGroupChatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	conv, err := h.chatSvc.CreateGroupChat(c.Context(), userID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Grup berhasil dibuat",
		"data":    conv,
	})
}

func (h *ChatHandler) GetConversation(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	convID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid conversation ID"})
	}

	conv, err := h.chatSvc.GetConversationDetails(c.Context(), convID, userID)
	if err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data": conv,
	})
}

func (h *ChatHandler) ListMessages(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	convID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid conversation ID"})
	}

	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	beforeID, _ := strconv.ParseInt(c.Query("before_id", "0"), 10, 64)

	messages, err := h.chatSvc.GetMessages(c.Context(), convID, userID, limit, beforeID)
	if err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data": messages,
	})
}

func (h *ChatHandler) SendMessage(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	convID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid conversation ID"})
	}

	var req domain.SendMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	msg, err := h.chatSvc.SendMessage(c.Context(), convID, userID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Pesan terkirim",
		"data":    msg,
	})
}

func (h *ChatHandler) MarkAsRead(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	convID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid conversation ID"})
	}

	if err := h.chatSvc.MarkAsRead(c.Context(), convID, userID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Status pesan diperbarui ke dibaca",
	})
}

func (h *ChatHandler) GetUnreadCount(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	total, err := h.chatSvc.GetUnreadCount(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"unread_count": total,
		},
	})
}

func (h *ChatHandler) AddMember(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	convID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid conversation ID"})
	}

	var req domain.AddGroupMemberRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := h.chatSvc.AddGroupMember(c.Context(), convID, userID, req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Anggota berhasil ditambahkan",
	})
}

func (h *ChatHandler) RemoveMember(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	convID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid conversation ID"})
	}

	targetUserID, err := strconv.ParseInt(c.Params("userId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	if err := h.chatSvc.RemoveGroupMember(c.Context(), convID, userID, targetUserID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Anggota berhasil dikeluarkan",
	})
}

func (h *ChatHandler) UpdateGroup(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	convID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid conversation ID"})
	}

	var req domain.UpdateGroupRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := h.chatSvc.UpdateGroup(c.Context(), convID, userID, req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Informasi grup berhasil diperbarui",
	})
}

func (h *ChatHandler) SearchUsers(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	query := c.Query("q", "")
	users, err := h.chatSvc.SearchUsers(c.Context(), query, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data": users,
	})
}

// WebSocket handler
func (h *ChatHandler) HandleWebSocket(c *websocket.Conn) {
	var userID int64

	// 1. Try to get from Locals
	if id, ok := c.Locals(middleware.CtxUserIDKey).(int64); ok && id > 0 {
		userID = id
	}

	// 2. If not found in locals, parse JWT token from query string directly
	if userID == 0 {
		tokenString := c.Query("token")
		if tokenString != "" {
			token, err := jwt.ParseWithClaims(tokenString, &service.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
				return []byte(h.jwtSecret), nil
			})
			if err == nil && token.Valid {
				if claims, ok := token.Claims.(*service.JWTClaims); ok {
					userID = claims.UserID
				}
			}
		}
	}

	if userID == 0 {
		log.Printf("[WebSocket] Unauthorized connection attempt closed")
		_ = c.Close()
		return
	}

	hub := h.chatSvc.GetHub()
	hub.Register(userID, c)
	defer func() {
		hub.Unregister(userID, c)
		_ = c.Close()
	}()

	log.Printf("[WebSocket] Connected successfully for user %d", userID)

	// Send initial ping or online ack
	_ = c.WriteJSON(domain.WSEvent{
		Type:      domain.WSEventUserOnline,
		Data:      map[string]interface{}{"user_id": userID},
		Timestamp: time.Now(),
	})

	for {
		var clientMsg map[string]interface{}
		if err := c.ReadJSON(&clientMsg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WebSocket] Connection error for user %d: %v", userID, err)
			}
			break
		}

		// Handle client-side events like typing notification
		if eventType, ok := clientMsg["type"].(string); ok && eventType == "typing" {
			if convIDFloat, ok := clientMsg["conversation_id"].(float64); ok {
				convID := int64(convIDFloat)
				details, err := h.chatSvc.GetConversationDetails(context.Background(), convID, userID)
				if err == nil {
					memberIDs := make([]int64, 0, len(details.Members))
					for _, m := range details.Members {
						if m.UserID != userID {
							memberIDs = append(memberIDs, m.UserID)
						}
					}
					hub.BroadcastToUsers(memberIDs, domain.WSEvent{
						Type:           domain.WSEventUserTyping,
						ConversationID: convID,
						Data: map[string]interface{}{
							"user_id": userID,
						},
						Timestamp: time.Now(),
					})
				}
			}
		}
	}
}

func (h *ChatHandler) DeleteMessage(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	msgID, err := strconv.ParseInt(c.Params("messageId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid message ID"})
	}

	if err := h.chatSvc.DeleteMessage(c.Context(), msgID, userID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Pesan berhasil dihapus",
	})
}

func (h *ChatHandler) DeleteConversation(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	convID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid conversation ID"})
	}

	if err := h.chatSvc.DeleteConversation(c.Context(), convID, userID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Percakapan berhasil dihapus",
	})
}

