package postgres

import (
	"database/sql"

	"github.com/jmoiron/sqlx"
	"knmp-v2-backend/internal/domain"
)

type ChatRepository interface {
	GetUserConversations(userID int64) ([]domain.Conversation, error)
	FindPersonalConversation(user1, user2 int64) (*domain.Conversation, error)
	CreateConversation(conv *domain.Conversation, memberUserIDs []int64, adminUserID int64) (*domain.Conversation, error)
	GetConversationByID(convID int64) (*domain.Conversation, error)
	GetConversationMembers(convID int64) ([]domain.ConversationMember, error)
	GetConversationMemberUserIDs(convID int64) ([]int64, error)
	IsUserMember(convID, userID int64) (bool, string, error)
	GetMessages(convID int64, limit int, beforeID int64) ([]domain.Message, error)
	GetMessageByID(msgID int64) (*domain.Message, error)
	CreateMessage(msg *domain.Message) (*domain.Message, error)
	MarkConversationAsRead(convID, userID int64) error
	GetUnreadCountTotal(userID int64) (int, error)
	AddGroupMember(convID, userID int64, role string) error
	RemoveGroupMember(convID, userID int64) error
	UpdateGroup(convID int64, name string, description *string) error
	SoftDeleteMessage(msgID int64) error
	SoftDeleteConversation(convID int64) error
	GetLatestMessageForConversation(convID int64) (*domain.Message, error)
	SearchUsers(query string, excludeUserID int64, limit int) ([]domain.User, error)
	GetUserByID(userID int64) (*domain.User, error)
}

type chatRepo struct {
	db *sqlx.DB
}

func NewChatRepo(db *sqlx.DB) ChatRepository {
	return &chatRepo{db: db}
}

func (r *chatRepo) GetUserConversations(userID int64) ([]domain.Conversation, error) {
	query := `
		SELECT 
			c.id, c.type, c.name, c.description, c.avatar_url, c.created_by,
			c.last_message_id, c.last_message_at, c.created_at, c.updated_at, c.deleted_at
		FROM conversations c
		INNER JOIN conversation_members cm ON cm.conversation_id = c.id
		WHERE cm.user_id = $1 AND c.deleted_at IS NULL
		ORDER BY c.last_message_at DESC
	`
	var convs []domain.Conversation
	if err := r.db.Select(&convs, query, userID); err != nil {
		return nil, err
	}

	for i := range convs {
		// 1. Get latest message
		if convs[i].LastMessageID != nil {
			var msg domain.Message
			msgQuery := `
				SELECT m.id, m.conversation_id, m.sender_id, m.message_type, m.content,
				       m.attachment_url, m.attachment_name, m.attachment_size, m.created_at, m.updated_at, m.deleted_at,
				       u.name as sender_name, u.email as sender_email
				FROM messages m
				JOIN users u ON u.id = m.sender_id
				WHERE m.id = $1 AND m.deleted_at IS NULL
			`
			if err := r.db.Get(&msg, msgQuery, *convs[i].LastMessageID); err == nil {
				convs[i].LastMessage = &msg
			}
		}

		// 2. Compute unread count for current user
		unreadQuery := `
			SELECT COUNT(m.id)
			FROM messages m
			JOIN conversation_members cm ON cm.conversation_id = m.conversation_id AND cm.user_id = $1
			WHERE m.conversation_id = $2
			  AND m.sender_id != $1
			  AND m.deleted_at IS NULL
			  AND (cm.last_read_message_id IS NULL OR m.id > cm.last_read_message_id)
		`
		var unread int
		_ = r.db.Get(&unread, unreadQuery, userID, convs[i].ID)
		convs[i].UnreadCount = unread

		// 3. For personal chat, populate other user details
		if convs[i].Type == domain.ConversationTypePersonal {
			var otherUser domain.User
			otherUserQuery := `
				SELECT u.id, u.name, u.email, r.name as role_name
				FROM conversation_members cm
				JOIN users u ON u.id = cm.user_id
				LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
				LEFT JOIN roles r ON r.id = mhr.role_id
				WHERE cm.conversation_id = $1 AND cm.user_id != $2 AND u.deleted_at IS NULL
				LIMIT 1
			`
			if err := r.db.Get(&otherUser, otherUserQuery, convs[i].ID, userID); err == nil {
				convs[i].OtherUser = &otherUser
				convs[i].DisplayName = otherUser.Name
			}
		} else {
			if convs[i].Name != nil {
				convs[i].DisplayName = *convs[i].Name
			} else {
				convs[i].DisplayName = "Group Chat"
			}
		}
	}

	return convs, nil
}

func (r *chatRepo) FindPersonalConversation(user1, user2 int64) (*domain.Conversation, error) {
	query := `
		SELECT c.id, c.type, c.name, c.description, c.avatar_url, c.created_by,
		       c.last_message_id, c.last_message_at, c.created_at, c.updated_at, c.deleted_at
		FROM conversations c
		JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
		JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = $2
		WHERE c.type = 'personal' AND c.deleted_at IS NULL
		LIMIT 1
	`
	var conv domain.Conversation
	if err := r.db.Get(&conv, query, user1, user2); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &conv, nil
}

func (r *chatRepo) CreateConversation(conv *domain.Conversation, memberUserIDs []int64, adminUserID int64) (*domain.Conversation, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	insertConv := `
		INSERT INTO conversations (type, name, description, avatar_url, created_by, last_message_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
		RETURNING id, type, name, description, avatar_url, created_by, last_message_id, last_message_at, created_at, updated_at
	`
	if err := tx.Get(conv, insertConv, conv.Type, conv.Name, conv.Description, conv.AvatarURL, conv.CreatedBy); err != nil {
		return nil, err
	}

	// Insert members
	for _, uid := range memberUserIDs {
		role := "member"
		if uid == adminUserID {
			role = "admin"
		}
		insertMember := `
			INSERT INTO conversation_members (conversation_id, user_id, role, joined_at, created_at, updated_at)
			VALUES ($1, $2, $3, NOW(), NOW(), NOW())
			ON CONFLICT (conversation_id, user_id) DO NOTHING
		`
		if _, err := tx.Exec(insertMember, conv.ID, uid, role); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return conv, nil
}

func (r *chatRepo) GetConversationByID(convID int64) (*domain.Conversation, error) {
	query := `
		SELECT id, type, name, description, avatar_url, created_by,
		       last_message_id, last_message_at, created_at, updated_at, deleted_at
		FROM conversations
		WHERE id = $1 AND deleted_at IS NULL
	`
	var conv domain.Conversation
	if err := r.db.Get(&conv, query, convID); err != nil {
		return nil, err
	}
	return &conv, nil
}

func (r *chatRepo) GetConversationMembers(convID int64) ([]domain.ConversationMember, error) {
	query := `
		SELECT cm.id, cm.conversation_id, cm.user_id, cm.role, cm.last_read_message_id,
		       cm.joined_at, cm.created_at, cm.updated_at,
		       u.name as user_name, u.email as user_email, r.name as role_name
		FROM conversation_members cm
		JOIN users u ON u.id = cm.user_id
		LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
		LEFT JOIN roles r ON r.id = mhr.role_id
		WHERE cm.conversation_id = $1 AND u.deleted_at IS NULL
		ORDER BY (cm.role = 'admin') DESC, cm.joined_at ASC
	`
	var members []domain.ConversationMember
	if err := r.db.Select(&members, query, convID); err != nil {
		return nil, err
	}
	return members, nil
}

func (r *chatRepo) GetConversationMemberUserIDs(convID int64) ([]int64, error) {
	query := `SELECT user_id FROM conversation_members WHERE conversation_id = $1`
	var userIDs []int64
	if err := r.db.Select(&userIDs, query, convID); err != nil {
		return nil, err
	}
	return userIDs, nil
}

func (r *chatRepo) IsUserMember(convID, userID int64) (bool, string, error) {
	query := `SELECT role FROM conversation_members WHERE conversation_id = $1 AND user_id = $2 LIMIT 1`
	var role string
	err := r.db.Get(&role, query, convID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, "", nil
		}
		return false, "", err
	}
	return true, role, nil
}

func (r *chatRepo) GetMessages(convID int64, limit int, beforeID int64) ([]domain.Message, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var query string
	var args []interface{}

	if beforeID > 0 {
		query = `
			SELECT m.id, m.conversation_id, m.sender_id, m.message_type, m.content,
			       m.attachment_url, m.attachment_name, m.attachment_size, m.created_at, m.updated_at, m.deleted_at,
			       u.name as sender_name, u.email as sender_email, r.name as sender_role
			FROM messages m
			JOIN users u ON u.id = m.sender_id
			LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
			LEFT JOIN roles r ON r.id = mhr.role_id
			WHERE m.conversation_id = $1 AND m.id < $2 AND m.deleted_at IS NULL
			ORDER BY m.created_at DESC
			LIMIT $3
		`
		args = []interface{}{convID, beforeID, limit}
	} else {
		query = `
			SELECT m.id, m.conversation_id, m.sender_id, m.message_type, m.content,
			       m.attachment_url, m.attachment_name, m.attachment_size, m.created_at, m.updated_at, m.deleted_at,
			       u.name as sender_name, u.email as sender_email, r.name as sender_role
			FROM messages m
			JOIN users u ON u.id = m.sender_id
			LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
			LEFT JOIN roles r ON r.id = mhr.role_id
			WHERE m.conversation_id = $1 AND m.deleted_at IS NULL
			ORDER BY m.created_at DESC
			LIMIT $2
		`
		args = []interface{}{convID, limit}
	}

	var messages []domain.Message
	if err := r.db.Select(&messages, query, args...); err != nil {
		return nil, err
	}

	// Reverse so messages are chronological (oldest to newest)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

func (r *chatRepo) GetMessageByID(msgID int64) (*domain.Message, error) {
	query := `
		SELECT m.id, m.conversation_id, m.sender_id, m.message_type, m.content,
		       m.attachment_url, m.attachment_name, m.attachment_size, m.created_at, m.updated_at, m.deleted_at,
		       u.name as sender_name, u.email as sender_email, r.name as sender_role
		FROM messages m
		JOIN users u ON u.id = m.sender_id
		LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
		LEFT JOIN roles r ON r.id = mhr.role_id
		WHERE m.id = $1 AND m.deleted_at IS NULL
	`
	var msg domain.Message
	if err := r.db.Get(&msg, query, msgID); err != nil {
		return nil, err
	}
	return &msg, nil
}

func (r *chatRepo) CreateMessage(msg *domain.Message) (*domain.Message, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `
		INSERT INTO messages (conversation_id, sender_id, message_type, content, attachment_url, attachment_name, attachment_size, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING id, conversation_id, sender_id, message_type, content, attachment_url, attachment_name, attachment_size, created_at, updated_at
	`
	if err := tx.Get(msg, query, msg.ConversationID, msg.SenderID, msg.MessageType, msg.Content, msg.AttachmentURL, msg.AttachmentName, msg.AttachmentSize); err != nil {
		return nil, err
	}

	// Update conversation's last_message_id and last_message_at
	updateConv := `
		UPDATE conversations 
		SET last_message_id = $1, last_message_at = $2, updated_at = NOW()
		WHERE id = $3
	`
	if _, err := tx.Exec(updateConv, msg.ID, msg.CreatedAt, msg.ConversationID); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	// Fetch sender details
	senderQuery := `
		SELECT u.name as sender_name, u.email as sender_email, COALESCE(r.name, '') as sender_role
		FROM users u
		LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
		LEFT JOIN roles r ON r.id = mhr.role_id
		WHERE u.id = $1
	`
	var senderInfo struct {
		SenderName  string `db:"sender_name"`
		SenderEmail string `db:"sender_email"`
		SenderRole  string `db:"sender_role"`
	}
	if err := r.db.Get(&senderInfo, senderQuery, msg.SenderID); err == nil {
		msg.SenderName = senderInfo.SenderName
		msg.SenderEmail = senderInfo.SenderEmail
		msg.SenderRole = senderInfo.SenderRole
	}

	return msg, nil
}

func (r *chatRepo) MarkConversationAsRead(convID, userID int64) error {
	query := `
		UPDATE conversation_members
		SET last_read_message_id = (
			SELECT COALESCE(MAX(id), 0) FROM messages WHERE conversation_id = $1 AND deleted_at IS NULL
		), updated_at = NOW()
		WHERE conversation_id = $1 AND user_id = $2
	`
	_, err := r.db.Exec(query, convID, userID)
	return err
}

func (r *chatRepo) GetUnreadCountTotal(userID int64) (int, error) {
	query := `
		SELECT COUNT(m.id)
		FROM messages m
		JOIN conversation_members cm ON cm.conversation_id = m.conversation_id AND cm.user_id = $1
		WHERE m.sender_id != $1
		  AND m.deleted_at IS NULL
		  AND (cm.last_read_message_id IS NULL OR m.id > cm.last_read_message_id)
	`
	var total int
	if err := r.db.Get(&total, query, userID); err != nil {
		return 0, err
	}
	return total, nil
}

func (r *chatRepo) AddGroupMember(convID, userID int64, role string) error {
	if role == "" {
		role = "member"
	}
	query := `
		INSERT INTO conversation_members (conversation_id, user_id, role, joined_at, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW(), NOW())
		ON CONFLICT (conversation_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW()
	`
	_, err := r.db.Exec(query, convID, userID, role)
	return err
}

func (r *chatRepo) RemoveGroupMember(convID, userID int64) error {
	query := `DELETE FROM conversation_members WHERE conversation_id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, convID, userID)
	return err
}

func (r *chatRepo) UpdateGroup(convID int64, name string, description *string) error {
	query := `UPDATE conversations SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 AND deleted_at IS NULL`
	_, err := r.db.Exec(query, name, description, convID)
	return err
}

func (r *chatRepo) SearchUsers(query string, excludeUserID int64, limit int) ([]domain.User, error) {
	if limit <= 0 || limit > 200 {
		limit = 100
	}
	searchTerm := "%" + query + "%"
	sqlQuery := `
		SELECT u.id, u.name, u.email, u.created_at, u.updated_at, r.name as role_name
		FROM users u
		LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
		LEFT JOIN roles r ON r.id = mhr.role_id
		WHERE u.id != $1 AND u.deleted_at IS NULL AND (u.name ILIKE $2 OR u.email ILIKE $2)
		ORDER BY u.name ASC
		LIMIT $3
	`
	var users []domain.User
	if err := r.db.Select(&users, sqlQuery, excludeUserID, searchTerm, limit); err != nil {
		return nil, err
	}
	return users, nil
}

func (r *chatRepo) GetUserByID(userID int64) (*domain.User, error) {
	query := `
		SELECT u.id, u.name, u.email, u.created_at, u.updated_at, r.name as role_name
		FROM users u
		LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
		LEFT JOIN roles r ON r.id = mhr.role_id
		WHERE u.id = $1 AND u.deleted_at IS NULL
	`
	var u domain.User
	if err := r.db.Get(&u, query, userID); err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *chatRepo) SoftDeleteMessage(msgID int64) error {
	query := `UPDATE messages SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`
	_, err := r.db.Exec(query, msgID)
	return err
}

func (r *chatRepo) SoftDeleteConversation(convID int64) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Soft delete conversation
	updateConv := `UPDATE conversations SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`
	if _, err := tx.Exec(updateConv, convID); err != nil {
		return err
	}

	// Soft delete all messages belonging to this conversation
	updateMsgs := `UPDATE messages SET deleted_at = NOW(), updated_at = NOW() WHERE conversation_id = $1 AND deleted_at IS NULL`
	if _, err := tx.Exec(updateMsgs, convID); err != nil {
		return err
	}

	return tx.Commit()
}

func (r *chatRepo) GetLatestMessageForConversation(convID int64) (*domain.Message, error) {
	query := `
		SELECT m.id, m.conversation_id, m.sender_id, m.message_type, m.content,
		       m.attachment_url, m.attachment_name, m.attachment_size, m.created_at, m.updated_at, m.deleted_at,
		       u.name as sender_name, u.email as sender_email, r.name as sender_role
		FROM messages m
		JOIN users u ON u.id = m.sender_id
		LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
		LEFT JOIN roles r ON r.id = mhr.role_id
		WHERE m.conversation_id = $1 AND m.deleted_at IS NULL
		ORDER BY m.created_at DESC
		LIMIT 1
	`
	var msg domain.Message
	if err := r.db.Get(&msg, query, convID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &msg, nil
}

