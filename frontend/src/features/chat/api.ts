import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api-client";
import {
  AddGroupMemberRequest,
  Conversation,
  CreateGroupChatRequest,
  CreatePersonalChatRequest,
  Message,
  SendMessageRequest,
  UpdateGroupRequest,
  UserSummary,
} from "./types";

export const useConversations = () => {
  return useQuery<Conversation[]>({
    queryKey: ["chat-conversations"],
    queryFn: () => apiFetch<Conversation[]>("/api/v1/chat/conversations"),
    refetchInterval: 10000,
  });
};

export const useConversationDetails = (convId?: number) => {
  return useQuery<Conversation>({
    queryKey: ["chat-conversation", convId],
    queryFn: () => apiFetch<Conversation>(`/api/v1/chat/conversations/${convId}`),
    enabled: !!convId,
  });
};

export const useMessages = (convId?: number) => {
  return useQuery<Message[]>({
    queryKey: ["chat-messages", convId],
    queryFn: () => apiFetch<Message[]>(`/api/v1/chat/conversations/${convId}/messages`),
    enabled: !!convId,
    refetchInterval: 8000,
  });
};

export const useTotalUnreadCount = () => {
  return useQuery<{ unread_count: number }>({
    queryKey: ["chat-total-unread"],
    queryFn: async () => {
      const res = await apiFetch<any>("/api/v1/chat/unread-count");
      if (typeof res === "number") return { unread_count: res };
      if (res && typeof res.unread_count === "number") return { unread_count: res.unread_count };
      return { unread_count: 0 };
    },
    refetchInterval: 12000,
  });
};

export const useSearchUsers = (query: string = "") => {
  return useQuery<UserSummary[]>({
    queryKey: ["chat-search-users", query],
    queryFn: () => apiFetch<UserSummary[]>(`/api/v1/chat/users/search?q=${encodeURIComponent(query)}`),
  });
};

export const useCreatePersonalChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreatePersonalChatRequest) =>
      apiFetch<Conversation>("/api/v1/chat/conversations", {
        method: "POST",
        body: JSON.stringify(req),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });
};

export const useCreateGroupChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateGroupChatRequest) =>
      apiFetch<Conversation>("/api/v1/chat/groups", {
        method: "POST",
        body: JSON.stringify(req),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });
};

export const useSendMessage = (convId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: SendMessageRequest) =>
      apiFetch<Message>(`/api/v1/chat/conversations/${convId}/messages`, {
        method: "POST",
        body: JSON.stringify(req),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", convId] });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });
};

export interface UploadAttachmentResponse {
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  file_url: string;
}

export const uploadChatAttachment = async (file: File): Promise<UploadAttachmentResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetch<UploadAttachmentResponse>("/api/v1/chat/upload", {
    method: "POST",
    body: formData,
  });
  return res;
};

export const useUploadChatAttachment = () => {
  return useMutation({
    mutationFn: (file: File) => uploadChatAttachment(file),
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (convId: number) =>
      apiFetch<{ message: string }>(`/api/v1/chat/conversations/${convId}/read`, {
        method: "POST",
      }),
    onSuccess: (_, convId) => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["chat-total-unread"] });
      queryClient.invalidateQueries({ queryKey: ["chat-messages", convId] });
    },
  });
};

export const useAddGroupMember = (convId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: AddGroupMemberRequest) =>
      apiFetch<{ message: string }>(`/api/v1/chat/groups/${convId}/members`, {
        method: "POST",
        body: JSON.stringify(req),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversation", convId] });
      queryClient.invalidateQueries({ queryKey: ["chat-messages", convId] });
    },
  });
};

export const useRemoveGroupMember = (convId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      apiFetch<{ message: string }>(`/api/v1/chat/groups/${convId}/members/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversation", convId] });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["chat-messages", convId] });
    },
  });
};

export const useUpdateGroup = (convId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: UpdateGroupRequest) =>
      apiFetch<{ message: string }>(`/api/v1/chat/conversations/${convId}`, {
        method: "PATCH",
        body: JSON.stringify(req),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversation", convId] });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });
};

export const useDeleteMessage = (convId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: number) =>
      apiFetch<{ message: string }>(`/api/v1/chat/messages/${messageId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      if (convId) {
        queryClient.invalidateQueries({ queryKey: ["chat-messages", convId] });
      }
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (convId: number) =>
      apiFetch<{ message: string }>(`/api/v1/chat/conversations/${convId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["chat-total-unread"] });
    },
  });
};

