export type ConversationType = "personal" | "group";

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role_name?: string;
}

export interface ConversationMember {
  id: number;
  conversation_id: number;
  user_id: number;
  role: "admin" | "member";
  last_read_message_id?: number;
  joined_at: string;
  user_name: string;
  user_email: string;
  role_name?: string;
  is_online?: boolean;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  message_type: "text" | "system" | "file" | "image";
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  sender_email?: string;
  sender_role?: string;
  is_read?: boolean;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  name?: string;
  description?: string;
  avatar_url?: string;
  created_by?: number;
  last_message_id?: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  display_name: string;
  display_avatar?: string;
  last_message?: Message;
  unread_count: number;
  members?: ConversationMember[];
  other_user?: UserSummary;
  is_other_online?: boolean;
}

export interface CreatePersonalChatRequest {
  user_id: number;
}

export interface CreateGroupChatRequest {
  name: string;
  description?: string;
  member_ids: number[];
}

export interface SendMessageRequest {
  content: string;
  message_type?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
}

export interface AddGroupMemberRequest {
  user_id: number;
  role?: "member" | "admin";
}

export interface UpdateGroupRequest {
  name: string;
  description?: string;
}

export interface WSEvent {
  type:
    | "new_message"
    | "message_read"
    | "user_typing"
    | "member_joined"
    | "member_left"
    | "group_updated"
    | "user_online"
    | "user_offline";
  conversation_id?: number;
  data?: any;
  timestamp: string;
}
