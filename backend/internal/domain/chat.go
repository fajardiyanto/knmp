package domain

import "time"

type ConversationType string

const (
	ConversationTypePersonal ConversationType = "personal"
	ConversationTypeGroup    ConversationType = "group"
)

type Conversation struct {
	ID            int64            `db:"id" json:"id"`
	Type          ConversationType `db:"type" json:"type"` // "personal" | "group"
	Name          *string          `db:"name" json:"name,omitempty"`
	Description   *string          `db:"description" json:"description,omitempty"`
	AvatarURL     *string          `db:"avatar_url" json:"avatar_url,omitempty"`
	CreatedBy     *int64           `db:"created_by" json:"created_by,omitempty"`
	LastMessageID *int64           `db:"last_message_id" json:"last_message_id,omitempty"`
	LastMessageAt time.Time        `db:"last_message_at" json:"last_message_at"`
	CreatedAt     time.Time        `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time        `db:"updated_at" json:"updated_at"`
	DeletedAt     *time.Time       `db:"deleted_at" json:"deleted_at,omitempty"`

	// Populated fields for UI
	DisplayName    string               `db:"-" json:"display_name"`
	DisplayAvatar  *string              `db:"-" json:"display_avatar,omitempty"`
	LastMessage    *Message             `db:"-" json:"last_message,omitempty"`
	UnreadCount    int                  `db:"-" json:"unread_count"`
	Members        []ConversationMember `db:"-" json:"members,omitempty"`
	OtherUser      *User                `db:"-" json:"other_user,omitempty"`
	IsOtherOnline  bool                 `db:"-" json:"is_other_online"`
}

type ConversationMember struct {
	ID                int64     `db:"id" json:"id"`
	ConversationID    int64     `db:"conversation_id" json:"conversation_id"`
	UserID            int64     `db:"user_id" json:"user_id"`
	Role              string    `db:"role" json:"role"` // "admin" | "member"
	LastReadMessageID *int64    `db:"last_read_message_id" json:"last_read_message_id,omitempty"`
	JoinedAt          time.Time `db:"joined_at" json:"joined_at"`
	CreatedAt         time.Time `db:"created_at" json:"created_at"`
	UpdatedAt         time.Time `db:"updated_at" json:"updated_at"`

	// Populated fields
	UserName  string  `db:"user_name" json:"user_name,omitempty"`
	UserEmail string  `db:"user_email" json:"user_email,omitempty"`
	RoleName  *string `db:"role_name" json:"role_name,omitempty"`
	IsOnline  bool    `db:"-" json:"is_online"`
}

type Message struct {
	ID             int64      `db:"id" json:"id"`
	ConversationID int64      `db:"conversation_id" json:"conversation_id"`
	SenderID       int64      `db:"sender_id" json:"sender_id"`
	MessageType    string     `db:"message_type" json:"message_type"` // "text" | "system" | "file" | "image"
	Content        string     `db:"content" json:"content"`
	AttachmentURL  *string    `db:"attachment_url" json:"attachment_url,omitempty"`
	AttachmentName *string    `db:"attachment_name" json:"attachment_name,omitempty"`
	AttachmentSize *int64     `db:"attachment_size" json:"attachment_size,omitempty"`
	CreatedAt      time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt      *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`

	// Populated fields
	SenderName  string `db:"sender_name" json:"sender_name,omitempty"`
	SenderEmail string `db:"sender_email" json:"sender_email,omitempty"`
	SenderRole  string `db:"sender_role" json:"sender_role,omitempty"`
	IsRead      bool   `db:"-" json:"is_read"`
}

type MessageRead struct {
	ID        int64     `db:"id" json:"id"`
	MessageID int64     `db:"message_id" json:"message_id"`
	UserID    int64     `db:"user_id" json:"user_id"`
	ReadAt    time.Time `db:"read_at" json:"read_at"`
}

// Request / Response DTOs

type CreatePersonalChatRequest struct {
	UserID int64 `json:"user_id" validate:"required"`
}

type CreateGroupChatRequest struct {
	Name        string  `json:"name" validate:"required,min=2,max=100"`
	Description *string `json:"description,omitempty"`
	MemberIDs   []int64 `json:"member_ids" validate:"required,min=1"`
}

type SendMessageRequest struct {
	Content        string  `json:"content" validate:"required,min=1"`
	MessageType    string  `json:"message_type"` // default "text"
	AttachmentURL  *string `json:"attachment_url,omitempty"`
	AttachmentName *string `json:"attachment_name,omitempty"`
	AttachmentSize *int64  `json:"attachment_size,omitempty"`
}

type AddGroupMemberRequest struct {
	UserID int64  `json:"user_id" validate:"required"`
	Role   string `json:"role"` // "member" | "admin"
}

type UpdateGroupRequest struct {
	Name        string  `json:"name" validate:"required,min=2,max=100"`
	Description *string `json:"description,omitempty"`
}

// WebSocket Event Types

type WSEventType string

const (
	WSEventNewMessage   WSEventType = "new_message"
	WSEventMessageRead  WSEventType = "message_read"
	WSEventUserTyping   WSEventType = "user_typing"
	WSEventMemberJoined WSEventType = "member_joined"
	WSEventMemberLeft   WSEventType = "member_left"
	WSEventGroupUpdated WSEventType = "group_updated"
	WSEventUserOnline   WSEventType = "user_online"
	WSEventUserOffline  WSEventType = "user_offline"
)

type WSEvent struct {
	Type           WSEventType `json:"type"`
	ConversationID int64       `json:"conversation_id,omitempty"`
	Data           interface{} `json:"data,omitempty"`
	Timestamp      time.Time   `json:"timestamp"`
}
