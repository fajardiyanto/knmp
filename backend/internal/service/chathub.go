package service

import (
	"log"
	"sync"
	"time"

	"github.com/gofiber/websocket/v2"
	"knmp-v2-backend/internal/domain"
)

type ChatHub interface {
	Register(userID int64, conn *websocket.Conn)
	Unregister(userID int64, conn *websocket.Conn)
	BroadcastToUsers(userIDs []int64, event domain.WSEvent)
	BroadcastToUser(userID int64, event domain.WSEvent)
	IsUserOnline(userID int64) bool
	GetOnlineUserIDs() []int64
}

type chatHub struct {
	mu      sync.RWMutex
	clients map[int64]map[*websocket.Conn]bool
}

func NewChatHub() ChatHub {
	return &chatHub{
		clients: make(map[int64]map[*websocket.Conn]bool),
	}
}

func (h *chatHub) Register(userID int64, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, exists := h.clients[userID]; !exists {
		h.clients[userID] = make(map[*websocket.Conn]bool)
	}
	h.clients[userID][conn] = true
	log.Printf("[ChatHub] User %d connected via WebSocket (active sessions: %d)", userID, len(h.clients[userID]))
}

func (h *chatHub) Unregister(userID int64, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if conns, exists := h.clients[userID]; exists {
		delete(conns, conn)
		if len(conns) == 0 {
			delete(h.clients, userID)
			log.Printf("[ChatHub] User %d disconnected (now offline)", userID)
		}
	}
}

func (h *chatHub) BroadcastToUsers(userIDs []int64, event domain.WSEvent) {
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	var deadConns []struct {
		uid  int64
		conn *websocket.Conn
	}

	h.mu.RLock()
	for _, uid := range userIDs {
		if conns, exists := h.clients[uid]; exists {
			for conn := range conns {
				if err := conn.WriteJSON(event); err != nil {
					deadConns = append(deadConns, struct {
						uid  int64
						conn *websocket.Conn
					}{uid: uid, conn: conn})
				}
			}
		}
	}
	h.mu.RUnlock()

	// Clean up dead connections outside read lock
	if len(deadConns) > 0 {
		for _, d := range deadConns {
			h.Unregister(d.uid, d.conn)
			_ = d.conn.Close()
		}
	}
}

func (h *chatHub) BroadcastToUser(userID int64, event domain.WSEvent) {
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	var deadConns []*websocket.Conn

	h.mu.RLock()
	if conns, exists := h.clients[userID]; exists {
		for conn := range conns {
			if err := conn.WriteJSON(event); err != nil {
				deadConns = append(deadConns, conn)
			}
		}
	}
	h.mu.RUnlock()

	// Clean up dead connections outside read lock
	if len(deadConns) > 0 {
		for _, conn := range deadConns {
			h.Unregister(userID, conn)
			_ = conn.Close()
		}
	}
}

func (h *chatHub) IsUserOnline(userID int64) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()

	conns, exists := h.clients[userID]
	return exists && len(conns) > 0
}

func (h *chatHub) GetOnlineUserIDs() []int64 {
	h.mu.RLock()
	defer h.mu.RUnlock()

	ids := make([]int64, 0, len(h.clients))
	for uid := range h.clients {
		ids = append(ids, uid)
	}
	return ids
}
