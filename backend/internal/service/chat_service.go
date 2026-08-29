package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type ChatService interface {
	GetUserConversations(ctx context.Context, userID int64) ([]domain.Conversation, error)
	GetOrCreatePersonalChat(ctx context.Context, currentUserID, targetUserID int64) (*domain.Conversation, error)
	CreateGroupChat(ctx context.Context, creatorID int64, req domain.CreateGroupChatRequest) (*domain.Conversation, error)
	GetConversationDetails(ctx context.Context, convID, currentUserID int64) (*domain.Conversation, error)
	GetMessages(ctx context.Context, convID, currentUserID int64, limit int, beforeID int64) ([]domain.Message, error)
	SendMessage(ctx context.Context, convID, currentUserID int64, req domain.SendMessageRequest) (*domain.Message, error)
	MarkAsRead(ctx context.Context, convID, currentUserID int64) error
	GetUnreadCount(ctx context.Context, userID int64) (int, error)
	AddGroupMember(ctx context.Context, convID, currentUserID int64, req domain.AddGroupMemberRequest) error
	RemoveGroupMember(ctx context.Context, convID, currentUserID, targetUserID int64) error
	UpdateGroup(ctx context.Context, convID, currentUserID int64, req domain.UpdateGroupRequest) error
	DeleteMessage(ctx context.Context, msgID, currentUserID int64) error
	DeleteConversation(ctx context.Context, convID, currentUserID int64) error
	SearchUsers(ctx context.Context, query string, excludeUserID int64) ([]domain.User, error)
	GetHub() ChatHub
}

type chatService struct {
	repo     repository.ChatRepository
	hub      ChatHub
	notifSvc NotificationService
}

func NewChatService(repo repository.ChatRepository, hub ChatHub, notifSvc NotificationService) ChatService {
	return &chatService{
		repo:     repo,
		hub:      hub,
		notifSvc: notifSvc,
	}
}

func (s *chatService) GetHub() ChatHub {
	return s.hub
}

func (s *chatService) GetUserConversations(ctx context.Context, userID int64) ([]domain.Conversation, error) {
	convs, err := s.repo.GetUserConversations(ctx, userID)
	if err != nil {
		return nil, err
	}

	for i := range convs {
		if convs[i].Type == domain.ConversationTypePersonal && convs[i].OtherUser != nil {
			convs[i].IsOtherOnline = s.hub.IsUserOnline(convs[i].OtherUser.ID)
		}
	}

	return convs, nil
}

func (s *chatService) GetOrCreatePersonalChat(ctx context.Context, currentUserID, targetUserID int64) (*domain.Conversation, error) {
	if currentUserID == targetUserID {
		return nil, errors.New("tidak dapat membuat percakapan dengan diri sendiri")
	}

	// 1. Check if user exists
	targetUser, err := s.repo.GetUserByID(ctx, targetUserID)
	if err != nil {
		return nil, errors.New("pengguna tujuan tidak ditemukan")
	}

	// 2. Check if conversation already exists
	existing, err := s.repo.FindPersonalConversation(ctx, currentUserID, targetUserID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return s.GetConversationDetails(ctx, existing.ID, currentUserID)
	}

	// 3. Create new personal conversation
	conv := &domain.Conversation{
		Type:      domain.ConversationTypePersonal,
		CreatedBy: &currentUserID,
	}
	memberIDs := []int64{currentUserID, targetUserID}

	created, err := s.repo.CreateConversation(ctx, conv, memberIDs, currentUserID)
	if err != nil {
		return nil, err
	}

	// Populate display name
	created.DisplayName = targetUser.Name
	created.OtherUser = targetUser
	created.IsOtherOnline = s.hub.IsUserOnline(targetUserID)

	// Broadcast member_joined event to target user
	s.hub.BroadcastToUser(targetUserID, domain.WSEvent{
		Type:           domain.WSEventMemberJoined,
		ConversationID: created.ID,
		Data:           created,
		Timestamp:      time.Now(),
	})

	return created, nil
}

func (s *chatService) CreateGroupChat(ctx context.Context, creatorID int64, req domain.CreateGroupChatRequest) (*domain.Conversation, error) {
	if req.Name == "" {
		return nil, errors.New("nama grup wajib diisi")
	}

	// Include creator in members if not present
	memberMap := make(map[int64]bool)
	memberMap[creatorID] = true
	for _, id := range req.MemberIDs {
		memberMap[id] = true
	}

	allMemberIDs := make([]int64, 0, len(memberMap))
	for id := range memberMap {
		allMemberIDs = append(allMemberIDs, id)
	}

	conv := &domain.Conversation{
		Type:        domain.ConversationTypeGroup,
		Name:        &req.Name,
		Description: req.Description,
		CreatedBy:   &creatorID,
	}

	created, err := s.repo.CreateConversation(ctx, conv, allMemberIDs, creatorID)
	if err != nil {
		return nil, err
	}

	// Send initial system message
	creatorUser, _ := s.repo.GetUserByID(ctx, creatorID)
	creatorName := "Admin"
	if creatorUser != nil {
		creatorName = creatorUser.Name
	}

	sysMsg := &domain.Message{
		ConversationID: created.ID,
		SenderID:       creatorID,
		MessageType:    "system",
		Content:        fmt.Sprintf("%s membuat grup \"%s\"", creatorName, req.Name),
	}
	_, _ = s.repo.CreateMessage(ctx, sysMsg)

	// Broadcast group creation to all members
	s.hub.BroadcastToUsers(allMemberIDs, domain.WSEvent{
		Type:           domain.WSEventMemberJoined,
		ConversationID: created.ID,
		Data:           created,
		Timestamp:      time.Now(),
	})

	return s.GetConversationDetails(ctx, created.ID, creatorID)
}

func (s *chatService) GetConversationDetails(ctx context.Context, convID, currentUserID int64) (*domain.Conversation, error) {
	// Verify membership
	isMember, _, err := s.repo.IsUserMember(ctx, convID, currentUserID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("akses ditolak: Anda bukan anggota percakapan ini")
	}

	conv, err := s.repo.GetConversationByID(ctx, convID)
	if err != nil {
		return nil, err
	}

	// Get members
	members, err := s.repo.GetConversationMembers(ctx, convID)
	if err != nil {
		return nil, err
	}

	for i := range members {
		members[i].IsOnline = s.hub.IsUserOnline(members[i].UserID)
	}
	conv.Members = members

	if conv.Type == domain.ConversationTypePersonal {
		for _, m := range members {
			if m.UserID != currentUserID {
				conv.DisplayName = m.UserName
				conv.IsOtherOnline = m.IsOnline
				u, _ := s.repo.GetUserByID(ctx, m.UserID)
				conv.OtherUser = u
				break
			}
		}
	} else {
		if conv.Name != nil {
			conv.DisplayName = *conv.Name
		} else {
			conv.DisplayName = "Group Chat"
		}
	}

	return conv, nil
}

func (s *chatService) GetMessages(ctx context.Context, convID, currentUserID int64, limit int, beforeID int64) ([]domain.Message, error) {
	// Verify membership
	isMember, _, err := s.repo.IsUserMember(ctx, convID, currentUserID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("akses ditolak: Anda bukan anggota percakapan ini")
	}

	return s.repo.GetMessages(ctx, convID, limit, beforeID)
}

func (s *chatService) SendMessage(ctx context.Context, convID, currentUserID int64, req domain.SendMessageRequest) (*domain.Message, error) {
	if req.Content == "" {
		if req.AttachmentURL != nil && *req.AttachmentURL != "" {
			if req.MessageType == "image" {
				req.Content = "Mengirim foto"
			} else {
				req.Content = "Mengirim lampiran"
			}
		} else {
			return nil, errors.New("pesan tidak boleh kosong")
		}
	}

	// Verify membership
	isMember, _, err := s.repo.IsUserMember(ctx, convID, currentUserID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("akses ditolak: Anda tidak memiliki akses untuk mengirim pesan ke percakapan ini")
	}

	msgType := "text"
	if req.MessageType != "" {
		msgType = req.MessageType
	}

	msg := &domain.Message{
		ConversationID: convID,
		SenderID:       currentUserID,
		MessageType:    msgType,
		Content:        req.Content,
		AttachmentURL:  req.AttachmentURL,
		AttachmentName: req.AttachmentName,
		AttachmentSize: req.AttachmentSize,
	}

	createdMsg, err := s.repo.CreateMessage(ctx, msg)
	if err != nil {
		return nil, err
	}

	// Real-time broadcast and notification to all members
	memberUserIDs, err := s.repo.GetConversationMemberUserIDs(ctx, convID)
	if err == nil && len(memberUserIDs) > 0 {
		s.hub.BroadcastToUsers(memberUserIDs, domain.WSEvent{
			Type:           domain.WSEventNewMessage,
			ConversationID: convID,
			Data:           createdMsg,
			Timestamp:      time.Now(),
		})

		if s.notifSvc != nil {
			for _, mid := range memberUserIDs {
				if mid != currentUserID {
					targetID := mid
					s.notifSvc.NotifyNewChat(ctx, currentUserID, createdMsg.SenderName, &targetID, nil, createdMsg.Content)
				}
			}
		}
	}

	return createdMsg, nil
}

func (s *chatService) MarkAsRead(ctx context.Context, convID, currentUserID int64) error {
	// Verify membership
	isMember, _, err := s.repo.IsUserMember(ctx, convID, currentUserID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("akses ditolak: Anda bukan anggota percakapan ini")
	}

	if err := s.repo.MarkConversationAsRead(ctx, convID, currentUserID); err != nil {
		return err
	}

	// Broadcast message_read event to all conversation members
	memberUserIDs, err := s.repo.GetConversationMemberUserIDs(ctx, convID)
	if err == nil && len(memberUserIDs) > 0 {
		s.hub.BroadcastToUsers(memberUserIDs, domain.WSEvent{
			Type:           domain.WSEventMessageRead,
			ConversationID: convID,
			Data: map[string]interface{}{
				"user_id": currentUserID,
			},
			Timestamp: time.Now(),
		})
	}

	return nil
}

func (s *chatService) GetUnreadCount(ctx context.Context, userID int64) (int, error) {
	return s.repo.GetUnreadCountTotal(ctx, userID)
}

func (s *chatService) AddGroupMember(ctx context.Context, convID, currentUserID int64, req domain.AddGroupMemberRequest) error {
	isMember, role, err := s.repo.IsUserMember(ctx, convID, currentUserID)
	if err != nil {
		return err
	}
	if !isMember || role != "admin" {
		return errors.New("hanya admin grup yang dapat menambahkan anggota baru")
	}

	conv, err := s.repo.GetConversationByID(ctx, convID)
	if err != nil {
		return err
	}
	if conv.Type != domain.ConversationTypeGroup {
		return errors.New("tidak dapat menambahkan anggota ke percakapan personal")
	}

	newMember, err := s.repo.GetUserByID(ctx, req.UserID)
	if err != nil {
		return errors.New("pengguna yang akan ditambahkan tidak ditemukan")
	}

	if err := s.repo.AddGroupMember(ctx, convID, req.UserID, req.Role); err != nil {
		return err
	}

	// System message
	adminUser, _ := s.repo.GetUserByID(ctx, currentUserID)
	adminName := "Admin"
	if adminUser != nil {
		adminName = adminUser.Name
	}

	sysMsg := &domain.Message{
		ConversationID: convID,
		SenderID:       currentUserID,
		MessageType:    "system",
		Content:        fmt.Sprintf("%s menambahkan %s ke dalam grup", adminName, newMember.Name),
	}
	_, _ = s.repo.CreateMessage(ctx, sysMsg)

	// Broadcast
	memberUserIDs, _ := s.repo.GetConversationMemberUserIDs(ctx, convID)
	s.hub.BroadcastToUsers(memberUserIDs, domain.WSEvent{
		Type:           domain.WSEventMemberJoined,
		ConversationID: convID,
		Data: map[string]interface{}{
			"user_id": req.UserID,
			"name":    newMember.Name,
		},
		Timestamp: time.Now(),
	})

	return nil
}

func (s *chatService) RemoveGroupMember(ctx context.Context, convID, currentUserID, targetUserID int64) error {
	isMember, role, err := s.repo.IsUserMember(ctx, convID, currentUserID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("akses ditolak")
	}

	// Allowed if admin OR self-leave
	if currentUserID != targetUserID && role != "admin" {
		return errors.New("hanya admin grup yang dapat mengeluarkan anggota")
	}

	targetUser, err := s.repo.GetUserByID(ctx, targetUserID)
	if err != nil {
		return errors.New("pengguna tidak ditemukan")
	}

	if err := s.repo.RemoveGroupMember(ctx, convID, targetUserID); err != nil {
		return err
	}

	// System message
	var sysContent string
	if currentUserID == targetUserID {
		sysContent = fmt.Sprintf("%s keluar dari grup", targetUser.Name)
	} else {
		adminUser, _ := s.repo.GetUserByID(ctx, currentUserID)
		adminName := "Admin"
		if adminUser != nil {
			adminName = adminUser.Name
		}
		sysContent = fmt.Sprintf("%s mengeluarkan %s dari grup", adminName, targetUser.Name)
	}

	sysMsg := &domain.Message{
		ConversationID: convID,
		SenderID:       currentUserID,
		MessageType:    "system",
		Content:        sysContent,
	}
	_, _ = s.repo.CreateMessage(ctx, sysMsg)

	// Broadcast
	memberUserIDs, _ := s.repo.GetConversationMemberUserIDs(ctx, convID)
	s.hub.BroadcastToUsers(append(memberUserIDs, targetUserID), domain.WSEvent{
		Type:           domain.WSEventMemberLeft,
		ConversationID: convID,
		Data: map[string]interface{}{
			"user_id": targetUserID,
			"name":    targetUser.Name,
		},
		Timestamp: time.Now(),
	})

	return nil
}

func (s *chatService) UpdateGroup(ctx context.Context, convID, currentUserID int64, req domain.UpdateGroupRequest) error {
	isMember, role, err := s.repo.IsUserMember(ctx, convID, currentUserID)
	if err != nil {
		return err
	}
	if !isMember || role != "admin" {
		return errors.New("hanya admin grup yang dapat mengubah informasi grup")
	}

	if err := s.repo.UpdateGroup(ctx, convID, req.Name, req.Description); err != nil {
		return err
	}

	memberUserIDs, _ := s.repo.GetConversationMemberUserIDs(ctx, convID)
	s.hub.BroadcastToUsers(memberUserIDs, domain.WSEvent{
		Type:           domain.WSEventGroupUpdated,
		ConversationID: convID,
		Data: map[string]interface{}{
			"name":        req.Name,
			"description": req.Description,
		},
		Timestamp: time.Now(),
	})

	return nil
}

func (s *chatService) DeleteMessage(ctx context.Context, msgID, currentUserID int64) error {
	msg, err := s.repo.GetMessageByID(ctx, msgID)
	if err != nil {
		return errors.New("pesan tidak ditemukan")
	}

	isMember, role, err := s.repo.IsUserMember(ctx, msg.ConversationID, currentUserID)
	if err != nil || !isMember {
		return errors.New("anda bukan anggota percakapan ini")
	}

	if msg.SenderID != currentUserID && role != "admin" {
		return errors.New("hanya pengirim pesan atau admin yang dapat menghapus pesan")
	}

	if err := s.repo.SoftDeleteMessage(ctx, msgID); err != nil {
		return err
	}

	// Broadcast message_deleted to conversation members
	memberUserIDs, _ := s.repo.GetConversationMemberUserIDs(ctx, msg.ConversationID)
	s.hub.BroadcastToUsers(memberUserIDs, domain.WSEvent{
		Type:           domain.WSEventMessageDeleted,
		ConversationID: msg.ConversationID,
		Data: map[string]interface{}{
			"message_id": msgID,
		},
		Timestamp: time.Now(),
	})

	return nil
}

func (s *chatService) DeleteConversation(ctx context.Context, convID, currentUserID int64) error {
	conv, err := s.repo.GetConversationByID(ctx, convID)
	if err != nil {
		return errors.New("percakapan tidak ditemukan")
	}

	isMember, role, err := s.repo.IsUserMember(ctx, convID, currentUserID)
	if err != nil || !isMember {
		return errors.New("anda bukan anggota percakapan ini")
	}

	if conv.Type == domain.ConversationTypeGroup && role != "admin" {
		return errors.New("hanya admin yang dapat menghapus grup percakapan")
	}

	memberUserIDs, _ := s.repo.GetConversationMemberUserIDs(ctx, convID)

	if err := s.repo.SoftDeleteConversation(ctx, convID); err != nil {
		return err
	}

	// Broadcast conversation_deleted to all former members
	s.hub.BroadcastToUsers(memberUserIDs, domain.WSEvent{
		Type:           domain.WSEventConversationDeleted,
		ConversationID: convID,
		Data: map[string]interface{}{
			"conversation_id": convID,
		},
		Timestamp: time.Now(),
	})

	return nil
}

func (s *chatService) SearchUsers(ctx context.Context, query string, excludeUserID int64) ([]domain.User, error) {
	return s.repo.SearchUsers(ctx, query, excludeUserID, 20)
}


