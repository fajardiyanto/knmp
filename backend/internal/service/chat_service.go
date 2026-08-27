package service

import (
	"errors"
	"fmt"
	"time"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository/postgres"
)

type ChatService interface {
	GetUserConversations(userID int64) ([]domain.Conversation, error)
	GetOrCreatePersonalChat(currentUserID, targetUserID int64) (*domain.Conversation, error)
	CreateGroupChat(creatorID int64, req domain.CreateGroupChatRequest) (*domain.Conversation, error)
	GetConversationDetails(convID, currentUserID int64) (*domain.Conversation, error)
	GetMessages(convID, currentUserID int64, limit int, beforeID int64) ([]domain.Message, error)
	SendMessage(convID, currentUserID int64, req domain.SendMessageRequest) (*domain.Message, error)
	MarkAsRead(convID, currentUserID int64) error
	GetUnreadCount(userID int64) (int, error)
	AddGroupMember(convID, currentUserID int64, req domain.AddGroupMemberRequest) error
	RemoveGroupMember(convID, currentUserID, targetUserID int64) error
	UpdateGroup(convID, currentUserID int64, req domain.UpdateGroupRequest) error
	SearchUsers(query string, excludeUserID int64) ([]domain.User, error)
	GetHub() ChatHub
}

type chatService struct {
	repo postgres.ChatRepository
	hub  ChatHub
}

func NewChatService(repo postgres.ChatRepository, hub ChatHub) ChatService {
	return &chatService{
		repo: repo,
		hub:  hub,
	}
}

func (s *chatService) GetHub() ChatHub {
	return s.hub
}

func (s *chatService) GetUserConversations(userID int64) ([]domain.Conversation, error) {
	convs, err := s.repo.GetUserConversations(userID)
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

func (s *chatService) GetOrCreatePersonalChat(currentUserID, targetUserID int64) (*domain.Conversation, error) {
	if currentUserID == targetUserID {
		return nil, errors.New("tidak dapat membuat percakapan dengan diri sendiri")
	}

	// 1. Check if user exists
	targetUser, err := s.repo.GetUserByID(targetUserID)
	if err != nil {
		return nil, errors.New("pengguna tujuan tidak ditemukan")
	}

	// 2. Check if conversation already exists
	existing, err := s.repo.FindPersonalConversation(currentUserID, targetUserID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return s.GetConversationDetails(existing.ID, currentUserID)
	}

	// 3. Create new personal conversation
	conv := &domain.Conversation{
		Type:      domain.ConversationTypePersonal,
		CreatedBy: &currentUserID,
	}
	memberIDs := []int64{currentUserID, targetUserID}

	created, err := s.repo.CreateConversation(conv, memberIDs, currentUserID)
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

func (s *chatService) CreateGroupChat(creatorID int64, req domain.CreateGroupChatRequest) (*domain.Conversation, error) {
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

	created, err := s.repo.CreateConversation(conv, allMemberIDs, creatorID)
	if err != nil {
		return nil, err
	}

	// Send initial system message
	creatorUser, _ := s.repo.GetUserByID(creatorID)
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
	_, _ = s.repo.CreateMessage(sysMsg)

	// Broadcast group creation to all members
	s.hub.BroadcastToUsers(allMemberIDs, domain.WSEvent{
		Type:           domain.WSEventMemberJoined,
		ConversationID: created.ID,
		Data:           created,
		Timestamp:      time.Now(),
	})

	return s.GetConversationDetails(created.ID, creatorID)
}

func (s *chatService) GetConversationDetails(convID, currentUserID int64) (*domain.Conversation, error) {
	// Verify membership
	isMember, _, err := s.repo.IsUserMember(convID, currentUserID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("akses ditolak: Anda bukan anggota percakapan ini")
	}

	conv, err := s.repo.GetConversationByID(convID)
	if err != nil {
		return nil, err
	}

	// Get members
	members, err := s.repo.GetConversationMembers(convID)
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
				u, _ := s.repo.GetUserByID(m.UserID)
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

func (s *chatService) GetMessages(convID, currentUserID int64, limit int, beforeID int64) ([]domain.Message, error) {
	// Verify membership
	isMember, _, err := s.repo.IsUserMember(convID, currentUserID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("akses ditolak: Anda bukan anggota percakapan ini")
	}

	return s.repo.GetMessages(convID, limit, beforeID)
}

func (s *chatService) SendMessage(convID, currentUserID int64, req domain.SendMessageRequest) (*domain.Message, error) {
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
	isMember, _, err := s.repo.IsUserMember(convID, currentUserID)
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

	createdMsg, err := s.repo.CreateMessage(msg)
	if err != nil {
		return nil, err
	}

	// Real-time broadcast to all members
	memberUserIDs, err := s.repo.GetConversationMemberUserIDs(convID)
	if err == nil && len(memberUserIDs) > 0 {
		s.hub.BroadcastToUsers(memberUserIDs, domain.WSEvent{
			Type:           domain.WSEventNewMessage,
			ConversationID: convID,
			Data:           createdMsg,
			Timestamp:      time.Now(),
		})
	}

	return createdMsg, nil
}

func (s *chatService) MarkAsRead(convID, currentUserID int64) error {
	// Verify membership
	isMember, _, err := s.repo.IsUserMember(convID, currentUserID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("akses ditolak: Anda bukan anggota percakapan ini")
	}

	if err := s.repo.MarkConversationAsRead(convID, currentUserID); err != nil {
		return err
	}

	// Broadcast message_read event to all conversation members
	memberUserIDs, err := s.repo.GetConversationMemberUserIDs(convID)
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

func (s *chatService) GetUnreadCount(userID int64) (int, error) {
	return s.repo.GetUnreadCountTotal(userID)
}

func (s *chatService) AddGroupMember(convID, currentUserID int64, req domain.AddGroupMemberRequest) error {
	isMember, role, err := s.repo.IsUserMember(convID, currentUserID)
	if err != nil {
		return err
	}
	if !isMember || role != "admin" {
		return errors.New("hanya admin grup yang dapat menambahkan anggota baru")
	}

	conv, err := s.repo.GetConversationByID(convID)
	if err != nil {
		return err
	}
	if conv.Type != domain.ConversationTypeGroup {
		return errors.New("tidak dapat menambahkan anggota ke percakapan personal")
	}

	newMember, err := s.repo.GetUserByID(req.UserID)
	if err != nil {
		return errors.New("pengguna yang akan ditambahkan tidak ditemukan")
	}

	if err := s.repo.AddGroupMember(convID, req.UserID, req.Role); err != nil {
		return err
	}

	// System message
	adminUser, _ := s.repo.GetUserByID(currentUserID)
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
	_, _ = s.repo.CreateMessage(sysMsg)

	// Broadcast
	memberUserIDs, _ := s.repo.GetConversationMemberUserIDs(convID)
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

func (s *chatService) RemoveGroupMember(convID, currentUserID, targetUserID int64) error {
	isMember, role, err := s.repo.IsUserMember(convID, currentUserID)
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

	targetUser, err := s.repo.GetUserByID(targetUserID)
	if err != nil {
		return errors.New("pengguna tidak ditemukan")
	}

	if err := s.repo.RemoveGroupMember(convID, targetUserID); err != nil {
		return err
	}

	// System message
	var sysContent string
	if currentUserID == targetUserID {
		sysContent = fmt.Sprintf("%s keluar dari grup", targetUser.Name)
	} else {
		adminUser, _ := s.repo.GetUserByID(currentUserID)
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
	_, _ = s.repo.CreateMessage(sysMsg)

	// Broadcast
	memberUserIDs, _ := s.repo.GetConversationMemberUserIDs(convID)
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

func (s *chatService) UpdateGroup(convID, currentUserID int64, req domain.UpdateGroupRequest) error {
	isMember, role, err := s.repo.IsUserMember(convID, currentUserID)
	if err != nil {
		return err
	}
	if !isMember || role != "admin" {
		return errors.New("hanya admin grup yang dapat mengubah informasi grup")
	}

	if err := s.repo.UpdateGroup(convID, req.Name, req.Description); err != nil {
		return err
	}

	memberUserIDs, _ := s.repo.GetConversationMemberUserIDs(convID)
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

func (s *chatService) SearchUsers(query string, excludeUserID int64) ([]domain.User, error) {
	return s.repo.SearchUsers(query, excludeUserID, 20)
}
