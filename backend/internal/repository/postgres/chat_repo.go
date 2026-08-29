package postgres

import (
	"context"
	"database/sql"
	"strings"

	"github.com/jmoiron/sqlx"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type chatRepo struct {
	db *sqlx.DB
}

func NewChatRepo(db *sqlx.DB) repository.ChatRepository {
	return &chatRepo{db: db}
}

func (r *chatRepo) GetUserConversations(ctx context.Context, userID int64) ([]domain.Conversation, error) {
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
	if err := r.db.SelectContext(ctx, &convs, query, userID); err != nil {
		return nil, err
	}

	if len(convs) == 0 {
		return convs, nil
	}

	convIDs := make([]int64, len(convs))
	lastMsgIDs := make([]int64, 0, len(convs))
	personalConvIDs := make([]int64, 0, len(convs))

	for i, c := range convs {
		convIDs[i] = c.ID
		if c.LastMessageID != nil && *c.LastMessageID > 0 {
			lastMsgIDs = append(lastMsgIDs, *c.LastMessageID)
		}
		if c.Type == domain.ConversationTypePersonal {
			personalConvIDs = append(personalConvIDs, c.ID)
		}
	}

	// 1. Batch Fetch Latest Messages (1 Query)
	lastMessagesMap := make(map[int64]*domain.Message)
	if len(lastMsgIDs) > 0 {
		msgQuery, args, err := sqlx.In(`
			SELECT m.id, m.conversation_id, m.sender_id, m.message_type, m.content,
			       m.attachment_url, m.attachment_name, m.attachment_size, m.created_at, m.updated_at, m.deleted_at,
			       u.name as sender_name, u.email as sender_email, COALESCE(r.name, '') as sender_role
			FROM messages m
			JOIN users u ON u.id = m.sender_id
			LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
			LEFT JOIN roles r ON r.id = mhr.role_id
			WHERE m.id IN (?) AND m.deleted_at IS NULL
		`, lastMsgIDs)
		if err == nil {
			msgQuery = r.db.Rebind(msgQuery)
			var msgs []domain.Message
			if err := r.db.SelectContext(ctx, &msgs, msgQuery, args...); err == nil {
				for i := range msgs {
					lastMessagesMap[msgs[i].ID] = &msgs[i]
				}
			}
		}
	}

	// 2. Batch Fetch Unread Counts (1 Query)
	unreadMap := make(map[int64]int)
	if len(convIDs) > 0 {
		unreadQuery, args, err := sqlx.In(`
			SELECT m.conversation_id, COUNT(m.id) as count
			FROM messages m
			JOIN conversation_members cm ON cm.conversation_id = m.conversation_id AND cm.user_id = ?
			WHERE m.conversation_id IN (?)
			  AND m.sender_id != ?
			  AND m.deleted_at IS NULL
			  AND (cm.last_read_message_id IS NULL OR m.id > cm.last_read_message_id)
			GROUP BY m.conversation_id
		`, userID, convIDs, userID)
		if err == nil {
			unreadQuery = r.db.Rebind(unreadQuery)
			var unreadRows []struct {
				ConversationID int64 `db:"conversation_id"`
				Count          int   `db:"count"`
			}
			if err := r.db.SelectContext(ctx, &unreadRows, unreadQuery, args...); err == nil {
				for _, row := range unreadRows {
					unreadMap[row.ConversationID] = row.Count
				}
			}
		}
	}

	// 3. Batch Fetch Other Users for Personal Chats (1 Query)
	otherUserMap := make(map[int64]*domain.User)
	if len(personalConvIDs) > 0 {
		otherUserQuery, args, err := sqlx.In(`
			SELECT cm.conversation_id, u.id, u.name, u.email, r.name as role_name
			FROM conversation_members cm
			JOIN users u ON u.id = cm.user_id
			LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
			LEFT JOIN roles r ON r.id = mhr.role_id
			WHERE cm.conversation_id IN (?) AND cm.user_id != ? AND u.deleted_at IS NULL
		`, personalConvIDs, userID)
		if err == nil {
			otherUserQuery = r.db.Rebind(otherUserQuery)
			var otherRows []struct {
				ConversationID int64   `db:"conversation_id"`
				ID             int64   `db:"id"`
				Name           string  `db:"name"`
				Email          string  `db:"email"`
				RoleName       *string `db:"role_name"`
			}
			if err := r.db.SelectContext(ctx, &otherRows, otherUserQuery, args...); err == nil {
				for _, row := range otherRows {
					otherUserMap[row.ConversationID] = &domain.User{
						ID:       row.ID,
						Name:     row.Name,
						Email:    row.Email,
						RoleName: row.RoleName,
					}
				}
			}
		}
	}

	// Assemble populated fields without extra queries
	for i := range convs {
		if convs[i].LastMessageID != nil {
			convs[i].LastMessage = lastMessagesMap[*convs[i].LastMessageID]
		}

		convs[i].UnreadCount = unreadMap[convs[i].ID]

		if convs[i].Type == domain.ConversationTypePersonal {
			if other, exists := otherUserMap[convs[i].ID]; exists {
				convs[i].OtherUser = other
				convs[i].DisplayName = other.Name
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

func (r *chatRepo) FindPersonalConversation(ctx context.Context, user1, user2 int64) (*domain.Conversation, error) {
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
	if err := r.db.GetContext(ctx, &conv, query, user1, user2); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &conv, nil
}

func (r *chatRepo) CreateConversation(ctx context.Context, conv *domain.Conversation, memberUserIDs []int64, adminUserID int64) (*domain.Conversation, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	insertConv := `
		INSERT INTO conversations (type, name, description, avatar_url, created_by, last_message_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
		RETURNING id, type, name, description, avatar_url, created_by, last_message_id, last_message_at, created_at, updated_at
	`
	if err := tx.GetContext(ctx, conv, insertConv, conv.Type, conv.Name, conv.Description, conv.AvatarURL, conv.CreatedBy); err != nil {
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
		if _, err := tx.ExecContext(ctx, insertMember, conv.ID, uid, role); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return conv, nil
}

func (r *chatRepo) GetConversationByID(ctx context.Context, convID int64) (*domain.Conversation, error) {
	query := `
		SELECT id, type, name, description, avatar_url, created_by,
		       last_message_id, last_message_at, created_at, updated_at, deleted_at
		FROM conversations
		WHERE id = $1 AND deleted_at IS NULL
	`
	var conv domain.Conversation
	if err := r.db.GetContext(ctx, &conv, query, convID); err != nil {
		return nil, err
	}
	return &conv, nil
}

func (r *chatRepo) GetConversationMembers(ctx context.Context, convID int64) ([]domain.ConversationMember, error) {
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
	if err := r.db.SelectContext(ctx, &members, query, convID); err != nil {
		return nil, err
	}
	return members, nil
}

func (r *chatRepo) GetConversationMemberUserIDs(ctx context.Context, convID int64) ([]int64, error) {
	query := `SELECT user_id FROM conversation_members WHERE conversation_id = $1`
	var userIDs []int64
	if err := r.db.SelectContext(ctx, &userIDs, query, convID); err != nil {
		return nil, err
	}
	return userIDs, nil
}

func (r *chatRepo) IsUserMember(ctx context.Context, convID, userID int64) (bool, string, error) {
	query := `SELECT role FROM conversation_members WHERE conversation_id = $1 AND user_id = $2 LIMIT 1`
	var role string
	err := r.db.GetContext(ctx, &role, query, convID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, "", nil
		}
		return false, "", err
	}
	return true, role, nil
}

func (r *chatRepo) GetMessages(ctx context.Context, convID int64, limit int, beforeID int64) ([]domain.Message, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var query string
	var args []interface{}

	if beforeID > 0 {
		query = `
			SELECT m.id, m.conversation_id, m.sender_id, m.message_type, m.content,
			       m.attachment_url, m.attachment_name, m.attachment_size, m.created_at, m.updated_at, m.deleted_at,
			       u.name as sender_name, u.email as sender_email, COALESCE(r.name, '') as sender_role
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
			       u.name as sender_name, u.email as sender_email, COALESCE(r.name, '') as sender_role
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
	if err := r.db.SelectContext(ctx, &messages, query, args...); err != nil {
		return nil, err
	}

	// Reverse so messages are chronological (oldest to newest)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

func (r *chatRepo) GetMessageByID(ctx context.Context, msgID int64) (*domain.Message, error) {
	query := `
		SELECT m.id, m.conversation_id, m.sender_id, m.message_type, m.content,
		       m.attachment_url, m.attachment_name, m.attachment_size, m.created_at, m.updated_at, m.deleted_at,
		       u.name as sender_name, u.email as sender_email, COALESCE(r.name, '') as sender_role
		FROM messages m
		JOIN users u ON u.id = m.sender_id
		LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
		LEFT JOIN roles r ON r.id = mhr.role_id
		WHERE m.id = $1 AND m.deleted_at IS NULL
	`
	var msg domain.Message
	if err := r.db.GetContext(ctx, &msg, query, msgID); err != nil {
		return nil, err
	}
	return &msg, nil
}

func (r *chatRepo) CreateMessage(ctx context.Context, msg *domain.Message) (*domain.Message, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `
		INSERT INTO messages (conversation_id, sender_id, message_type, content, attachment_url, attachment_name, attachment_size, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING id, conversation_id, sender_id, message_type, content, attachment_url, attachment_name, attachment_size, created_at, updated_at
	`
	if err := tx.GetContext(ctx, msg, query, msg.ConversationID, msg.SenderID, msg.MessageType, msg.Content, msg.AttachmentURL, msg.AttachmentName, msg.AttachmentSize); err != nil {
		return nil, err
	}

	// Update conversation's last_message_id and last_message_at
	updateConv := `
		UPDATE conversations 
		SET last_message_id = $1, last_message_at = $2, updated_at = NOW()
		WHERE id = $3
	`
	if _, err := tx.ExecContext(ctx, updateConv, msg.ID, msg.CreatedAt, msg.ConversationID); err != nil {
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
	if err := r.db.GetContext(ctx, &senderInfo, senderQuery, msg.SenderID); err == nil {
		msg.SenderName = senderInfo.SenderName
		msg.SenderEmail = senderInfo.SenderEmail
		msg.SenderRole = senderInfo.SenderRole
	}

	return msg, nil
}

func (r *chatRepo) MarkConversationAsRead(ctx context.Context, convID, userID int64) error {
	query := `
		UPDATE conversation_members
		SET last_read_message_id = (
			SELECT COALESCE(MAX(id), 0) FROM messages WHERE conversation_id = $1 AND deleted_at IS NULL
		), updated_at = NOW()
		WHERE conversation_id = $1 AND user_id = $2
	`
	_, err := r.db.ExecContext(ctx, query, convID, userID)
	return err
}

func (r *chatRepo) GetUnreadCountTotal(ctx context.Context, userID int64) (int, error) {
	query := `
		SELECT COUNT(m.id)
		FROM messages m
		JOIN conversation_members cm ON cm.conversation_id = m.conversation_id AND cm.user_id = $1
		WHERE m.sender_id != $1
		  AND m.deleted_at IS NULL
		  AND (cm.last_read_message_id IS NULL OR m.id > cm.last_read_message_id)
	`
	var total int
	if err := r.db.GetContext(ctx, &total, query, userID); err != nil {
		return 0, err
	}
	return total, nil
}

func (r *chatRepo) AddGroupMember(ctx context.Context, convID, userID int64, role string) error {
	if role == "" {
		role = "member"
	}
	query := `
		INSERT INTO conversation_members (conversation_id, user_id, role, joined_at, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW(), NOW())
		ON CONFLICT (conversation_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW()
	`
	_, err := r.db.ExecContext(ctx, query, convID, userID, role)
	return err
}

func (r *chatRepo) RemoveGroupMember(ctx context.Context, convID, userID int64) error {
	query := `DELETE FROM conversation_members WHERE conversation_id = $1 AND user_id = $2`
	_, err := r.db.ExecContext(ctx, query, convID, userID)
	return err
}

func (r *chatRepo) UpdateGroup(ctx context.Context, convID int64, name string, description *string) error {
	query := `UPDATE conversations SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 AND deleted_at IS NULL`
	_, err := r.db.ExecContext(ctx, query, name, description, convID)
	return err
}

func (r *chatRepo) SearchUsers(ctx context.Context, query string, excludeUserID int64, limit int) ([]domain.User, error) {
	if limit <= 0 || limit > 200 {
		limit = 100
	}
	// Escape ILIKE wildcard special characters to prevent wildcard abuse (C-01)
	escaped := strings.NewReplacer("%", "\\%", "_", "\\_").Replace(query)
	searchTerm := "%" + escaped + "%"

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
	if err := r.db.SelectContext(ctx, &users, sqlQuery, excludeUserID, searchTerm, limit); err != nil {
		return nil, err
	}
	return users, nil
}

func (r *chatRepo) GetUserByID(ctx context.Context, userID int64) (*domain.User, error) {
	query := `
		SELECT u.id, u.name, u.email, u.created_at, u.updated_at, r.name as role_name
		FROM users u
		LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
		LEFT JOIN roles r ON r.id = mhr.role_id
		WHERE u.id = $1 AND u.deleted_at IS NULL
	`
	var u domain.User
	if err := r.db.GetContext(ctx, &u, query, userID); err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *chatRepo) SoftDeleteMessage(ctx context.Context, msgID int64) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Get message details
	var msg domain.Message
	getMsgQuery := `SELECT id, conversation_id FROM messages WHERE id = $1 AND deleted_at IS NULL`
	if err := tx.GetContext(ctx, &msg, getMsgQuery, msgID); err != nil {
		return err
	}

	// 2. Soft delete the message
	query := `UPDATE messages SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`
	if _, err := tx.ExecContext(ctx, query, msgID); err != nil {
		return err
	}

	// 3. Check if conversation's last_message_id was this message; if so, update to latest undeleted (I-04)
	var convLastMsgID *int64
	checkConv := `SELECT last_message_id FROM conversations WHERE id = $1`
	if err := tx.GetContext(ctx, &convLastMsgID, checkConv, msg.ConversationID); err == nil && convLastMsgID != nil && *convLastMsgID == msgID {
		// Find latest undeleted message
		var latestMsg domain.Message
		latestQuery := `
			SELECT id, created_at FROM messages 
			WHERE conversation_id = $1 AND deleted_at IS NULL 
			ORDER BY created_at DESC 
			LIMIT 1
		`
		if err := tx.GetContext(ctx, &latestMsg, latestQuery, msg.ConversationID); err == nil {
			updateConv := `UPDATE conversations SET last_message_id = $1, last_message_at = $2, updated_at = NOW() WHERE id = $3`
			_, _ = tx.ExecContext(ctx, updateConv, latestMsg.ID, latestMsg.CreatedAt, msg.ConversationID)
		} else {
			updateConv := `UPDATE conversations SET last_message_id = NULL, updated_at = NOW() WHERE id = $1`
			_, _ = tx.ExecContext(ctx, updateConv, msg.ConversationID)
		}
	}

	return tx.Commit()
}

func (r *chatRepo) SoftDeleteConversation(ctx context.Context, convID int64) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Soft delete conversation
	updateConv := `UPDATE conversations SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`
	if _, err := tx.ExecContext(ctx, updateConv, convID); err != nil {
		return err
	}

	// Soft delete all messages belonging to this conversation
	updateMsgs := `UPDATE messages SET deleted_at = NOW(), updated_at = NOW() WHERE conversation_id = $1 AND deleted_at IS NULL`
	if _, err := tx.ExecContext(ctx, updateMsgs, convID); err != nil {
		return err
	}

	return tx.Commit()
}

func (r *chatRepo) GetLatestMessageForConversation(ctx context.Context, convID int64) (*domain.Message, error) {
	query := `
		SELECT m.id, m.conversation_id, m.sender_id, m.message_type, m.content,
		       m.attachment_url, m.attachment_name, m.attachment_size, m.created_at, m.updated_at, m.deleted_at,
		       u.name as sender_name, u.email as sender_email, COALESCE(r.name, '') as sender_role
		FROM messages m
		JOIN users u ON u.id = m.sender_id
		LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\Models\\User'
		LEFT JOIN roles r ON r.id = mhr.role_id
		WHERE m.conversation_id = $1 AND m.deleted_at IS NULL
		ORDER BY m.created_at DESC
		LIMIT 1
	`
	var msg domain.Message
	if err := r.db.GetContext(ctx, &msg, query, convID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &msg, nil
}


