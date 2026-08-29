package service_test

import (
	"context"
	"testing"
	"time"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/service"
)

// MockChatRepo implements repository.ChatRepository for unit testing
type MockChatRepo struct {
	conversations map[int64]*domain.Conversation
	messages      map[int64]*domain.Message
	members       map[int64][]domain.ConversationMember
	users         map[int64]*domain.User
	nextMsgID     int64
	nextConvID    int64
}

func NewMockChatRepo() *MockChatRepo {
	return &MockChatRepo{
		conversations: make(map[int64]*domain.Conversation),
		messages:      make(map[int64]*domain.Message),
		members:       make(map[int64][]domain.ConversationMember),
		users: map[int64]*domain.User{
			1: {ID: 1, Name: "Admin User", Email: "admin@pertamina.com"},
			2: {ID: 2, Name: "Field User", Email: "field@pertamina.com"},
			3: {ID: 3, Name: "Third User", Email: "third@pertamina.com"},
		},
		nextMsgID:  1,
		nextConvID: 1,
	}
}

func (m *MockChatRepo) GetUserConversations(ctx context.Context, userID int64) ([]domain.Conversation, error) {
	var result []domain.Conversation
	for _, conv := range m.conversations {
		if conv.DeletedAt != nil {
			continue
		}
		for _, mem := range m.members[conv.ID] {
			if mem.UserID == userID {
				result = append(result, *conv)
				break
			}
		}
	}
	return result, nil
}

func (m *MockChatRepo) FindPersonalConversation(ctx context.Context, u1, u2 int64) (*domain.Conversation, error) {
	for _, conv := range m.conversations {
		if conv.Type == domain.ConversationTypePersonal && conv.DeletedAt == nil {
			mems := m.members[conv.ID]
			has1, has2 := false, false
			for _, mem := range mems {
				if mem.UserID == u1 {
					has1 = true
				}
				if mem.UserID == u2 {
					has2 = true
				}
			}
			if has1 && has2 {
				return conv, nil
			}
		}
	}
	return nil, nil
}

func (m *MockChatRepo) CreateConversation(ctx context.Context, conv *domain.Conversation, memberUserIDs []int64, adminUserID int64) (*domain.Conversation, error) {
	conv.ID = m.nextConvID
	m.nextConvID++
	conv.CreatedAt = time.Now()
	conv.UpdatedAt = time.Now()
	m.conversations[conv.ID] = conv

	var mems []domain.ConversationMember
	for _, uid := range memberUserIDs {
		role := "member"
		if uid == adminUserID {
			role = "admin"
		}
		mem := domain.ConversationMember{
			ConversationID: conv.ID,
			UserID:         uid,
			Role:           role,
			UserName:       m.users[uid].Name,
			UserEmail:      m.users[uid].Email,
		}
		mems = append(mems, mem)
	}
	m.members[conv.ID] = mems
	return conv, nil
}

func (m *MockChatRepo) GetConversationByID(ctx context.Context, convID int64) (*domain.Conversation, error) {
	conv, exists := m.conversations[convID]
	if !exists || conv.DeletedAt != nil {
		return nil, nil
	}
	return conv, nil
}

func (m *MockChatRepo) GetConversationMembers(ctx context.Context, convID int64) ([]domain.ConversationMember, error) {
	return m.members[convID], nil
}

func (m *MockChatRepo) GetConversationMemberUserIDs(ctx context.Context, convID int64) ([]int64, error) {
	var ids []int64
	for _, mem := range m.members[convID] {
		ids = append(ids, mem.UserID)
	}
	return ids, nil
}

func (m *MockChatRepo) IsUserMember(ctx context.Context, convID, userID int64) (bool, string, error) {
	for _, mem := range m.members[convID] {
		if mem.UserID == userID {
			return true, mem.Role, nil
		}
	}
	return false, "", nil
}

func (m *MockChatRepo) GetMessages(ctx context.Context, convID int64, limit int, beforeID int64) ([]domain.Message, error) {
	var result []domain.Message
	for _, msg := range m.messages {
		if msg.ConversationID == convID && msg.DeletedAt == nil {
			result = append(result, *msg)
		}
	}
	return result, nil
}

func (m *MockChatRepo) GetMessageByID(ctx context.Context, msgID int64) (*domain.Message, error) {
	msg, exists := m.messages[msgID]
	if !exists || msg.DeletedAt != nil {
		return nil, nil
	}
	return msg, nil
}

func (m *MockChatRepo) CreateMessage(ctx context.Context, msg *domain.Message) (*domain.Message, error) {
	msg.ID = m.nextMsgID
	m.nextMsgID++
	msg.CreatedAt = time.Now()
	msg.UpdatedAt = time.Now()
	if user, exists := m.users[msg.SenderID]; exists {
		msg.SenderName = user.Name
		msg.SenderEmail = user.Email
	}
	m.messages[msg.ID] = msg

	if conv, exists := m.conversations[msg.ConversationID]; exists {
		conv.LastMessageID = &msg.ID
		conv.LastMessageAt = msg.CreatedAt
	}
	return msg, nil
}

func (m *MockChatRepo) MarkConversationAsRead(ctx context.Context, convID, userID int64) error {
	return nil
}

func (m *MockChatRepo) GetUnreadCountTotal(ctx context.Context, userID int64) (int, error) {
	return 0, nil
}

func (m *MockChatRepo) AddGroupMember(ctx context.Context, convID, userID int64, role string) error {
	m.members[convID] = append(m.members[convID], domain.ConversationMember{
		ConversationID: convID,
		UserID:         userID,
		Role:           role,
	})
	return nil
}

func (m *MockChatRepo) RemoveGroupMember(ctx context.Context, convID, userID int64) error {
	var remaining []domain.ConversationMember
	for _, mem := range m.members[convID] {
		if mem.UserID != userID {
			remaining = append(remaining, mem)
		}
	}
	m.members[convID] = remaining
	return nil
}

func (m *MockChatRepo) UpdateGroup(ctx context.Context, convID int64, name string, description *string) error {
	if conv, exists := m.conversations[convID]; exists {
		conv.Name = &name
		conv.Description = description
	}
	return nil
}

func (m *MockChatRepo) SoftDeleteMessage(ctx context.Context, msgID int64) error {
	if msg, exists := m.messages[msgID]; exists {
		now := time.Now()
		msg.DeletedAt = &now
	}
	return nil
}

func (m *MockChatRepo) SoftDeleteConversation(ctx context.Context, convID int64) error {
	if conv, exists := m.conversations[convID]; exists {
		now := time.Now()
		conv.DeletedAt = &now
	}
	return nil
}

func (m *MockChatRepo) GetLatestMessageForConversation(ctx context.Context, convID int64) (*domain.Message, error) {
	var latest *domain.Message
	for _, msg := range m.messages {
		if msg.ConversationID == convID && msg.DeletedAt == nil {
			if latest == nil || msg.CreatedAt.After(latest.CreatedAt) {
				latest = msg
			}
		}
	}
	return latest, nil
}

func (m *MockChatRepo) SearchUsers(ctx context.Context, query string, excludeUserID int64, limit int) ([]domain.User, error) {
	var result []domain.User
	for _, u := range m.users {
		if u.ID != excludeUserID {
			result = append(result, *u)
		}
	}
	return result, nil
}

func (m *MockChatRepo) GetUserByID(ctx context.Context, userID int64) (*domain.User, error) {
	if u, exists := m.users[userID]; exists {
		return u, nil
	}
	return nil, nil
}

// TestChatServiceOperations tests core chat business logic
func TestChatServiceOperations(t *testing.T) {
	mockRepo := NewMockChatRepo()
	hub := service.NewChatHub()
	chatSvc := service.NewChatService(mockRepo, hub, nil)
	ctx := context.Background()

	// 1. Create personal chat
	conv, err := chatSvc.GetOrCreatePersonalChat(ctx, 1, 2)
	if err != nil {
		t.Fatalf("failed to create personal chat: %v", err)
	}
	if conv.Type != domain.ConversationTypePersonal {
		t.Errorf("expected personal type, got %s", conv.Type)
	}

	// 2. Self-chat prevention
	_, err = chatSvc.GetOrCreatePersonalChat(ctx, 1, 1)
	if err == nil {
		t.Errorf("expected error when starting chat with self, got nil")
	}

	// 3. Send message
	msg, err := chatSvc.SendMessage(ctx, conv.ID, 1, domain.SendMessageRequest{
		Content: "Halo dari test!",
	})
	if err != nil {
		t.Fatalf("failed to send message: %v", err)
	}
	if msg.Content != "Halo dari test!" {
		t.Errorf("unexpected content: %s", msg.Content)
	}

	// 4. Send message from non-member should fail
	_, err = chatSvc.SendMessage(ctx, conv.ID, 3, domain.SendMessageRequest{
		Content: "Unauthorized message",
	})
	if err == nil {
		t.Errorf("expected error for non-member sender, got nil")
	}

	// 5. Soft delete message by sender
	err = chatSvc.DeleteMessage(ctx, msg.ID, 1)
	if err != nil {
		t.Fatalf("failed to soft delete message: %v", err)
	}

	// 6. Delete conversation
	err = chatSvc.DeleteConversation(ctx, conv.ID, 1)
	if err != nil {
		t.Fatalf("failed to soft delete conversation: %v", err)
	}
}
