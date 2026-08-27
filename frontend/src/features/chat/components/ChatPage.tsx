import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  useConversationDetails,
  useConversations,
  useCreateGroupChat,
  useCreatePersonalChat,
  useDeleteConversation,
  useMarkAsRead,
  useMessages,
  useSendMessage,
} from "../api";
import { useAlert } from "../../../context/AlertContext";
import { useChatSocket } from "../hooks/useChatSocket";
import { Conversation } from "../types";
import { ConversationList } from "./ConversationList";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import { NewChatModal } from "./NewChatModal";
import { NewGroupModal } from "./NewGroupModal";
import { GroupDetailsDrawer } from "./GroupDetailsDrawer";
import { MessageSquare } from "lucide-react";

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { showConfirm } = useAlert();
  const currentUserId = user?.id ? Number(user.id) : 0;

  const [activeConvId, setActiveConvId] = useState<number | undefined>(undefined);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isListCollapsed, setIsListCollapsed] = useState(false);

  // Queries & Mutations
  const { data: convsData, isLoading: isLoadingConvs } = useConversations();
  const conversations = convsData || [];

  const { data: activeConvData } = useConversationDetails(activeConvId);
  const activeConversation = activeConvData;

  const { data: messagesData, isLoading: isLoadingMessages } =
    useMessages(activeConvId);
  const messages = messagesData || [];

  const markAsRead = useMarkAsRead();
  const sendMessage = useSendMessage(activeConvId || 0);
  const createPersonalChat = useCreatePersonalChat();
  const createGroupChat = useCreateGroupChat();
  const deleteConversation = useDeleteConversation();

  const handleDeleteConversation = (convId: number) => {
    showConfirm({
      title: "Hapus Percakapan",
      message: "Apakah Anda yakin ingin menghapus percakapan ini? Riwayat pesan akan dibersihkan.",
      confirmText: "Hapus",
      isDestructive: true,
      onConfirm: () => {
        deleteConversation.mutate(convId, {
          onSuccess: () => {
            if (activeConvId === convId) {
              setActiveConvId(undefined);
              setIsDetailsOpen(false);
            }
          },
        });
      },
    });
  };

  // Real-time WebSocket hook
  const { sendTyping } = useChatSocket(activeConvId);

  // Auto select first conversation if none selected on desktop
  useEffect(() => {
    if (!activeConvId && conversations.length > 0 && window.innerWidth >= 768) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  // Mark as read on active conversation open
  useEffect(() => {
    if (activeConvId) {
      markAsRead.mutate(activeConvId);
    }
  }, [activeConvId]);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConvId(conv.id);
    markAsRead.mutate(conv.id);
  };

  const handleSendMessage = (
    content: string,
    attachment?: { url: string; name: string; size?: number; type?: string }
  ) => {
    if (!activeConvId) return;
    sendMessage.mutate({
      content: content || (attachment?.type === "image" ? "Mengirim foto" : "Mengirim lampiran"),
      message_type: attachment?.type || "text",
      attachment_url: attachment?.url,
      attachment_name: attachment?.name,
      attachment_size: attachment?.size,
    });
  };

  const handleStartPersonalChat = (targetUserId: number) => {
    createPersonalChat.mutate(
      { user_id: targetUserId },
      {
        onSuccess: (res) => {
          setIsNewChatOpen(false);
          if (res?.id) {
            setActiveConvId(res.id);
          }
        },
      }
    );
  };

  const handleCreateGroup = (
    name: string,
    description: string,
    memberIds: number[]
  ) => {
    createGroupChat.mutate(
      { name, description, member_ids: memberIds },
      {
        onSuccess: (res) => {
          setIsNewGroupOpen(false);
          if (res?.id) {
            setActiveConvId(res.id);
          }
        },
      }
    );
  };

  return (
    <div className="h-full flex flex-col w-full font-sans transition-colors duration-200">
      {/* Main Chat Workspace Card */}
      <div className="flex-1 flex overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl">
        {/* 1. Left Panel: Conversations List (Collapsible Mini Avatar Rail) */}
        <div
          className={`${
            activeConvId ? "hidden md:flex" : "flex"
          } h-full transition-all duration-300 ease-in-out shrink-0`}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeConvId}
            onSelect={handleSelectConversation}
            onOpenNewChat={() => setIsNewChatOpen(true)}
            onOpenNewGroup={() => setIsNewGroupOpen(true)}
            isCollapsed={isListCollapsed}
            onToggleCollapse={() => setIsListCollapsed(!isListCollapsed)}
            onDeleteConversation={handleDeleteConversation}
            isLoading={isLoadingConvs}
          />
        </div>

        {/* 2. Middle Panel: Active Message Area */}
        <div
          className={`${
            !activeConvId ? "hidden md:flex" : "flex"
          } flex-1 flex-col h-full bg-slate-50/50 dark:bg-slate-950/40 min-w-0`}
        >
          {activeConversation ? (
            <>
              {/* Active Conversation Header */}
              <ChatHeader
                conversation={activeConversation}
                onToggleDetails={() => setIsDetailsOpen(!isDetailsOpen)}
                onBackMobile={() => setActiveConvId(undefined)}
                onToggleList={() => setIsListCollapsed(!isListCollapsed)}
                onDeleteConversation={() => handleDeleteConversation(activeConversation.id)}
                isListCollapsed={isListCollapsed}
                isDetailsOpen={isDetailsOpen}
              />

              {/* Message Stream */}
              <MessageList
                messages={messages}
                currentUserId={currentUserId}
                convId={activeConvId}
                isGroup={activeConversation.type === "group"}
                isLoading={isLoadingMessages}
              />

              {/* Composer */}
              <MessageComposer
                onSend={handleSendMessage}
                onTyping={sendTyping}
                isSending={sendMessage.isPending}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/60 transition-colors duration-200">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                Pilih atau Mulai Percakapan
              </h3>
              <p className="text-[13.5px] text-slate-400 dark:text-slate-400 max-w-sm font-normal mb-4">
                Pilih percakapan dari daftar di sebelah kiri atau buat pesan baru
                untuk berkoordinasi langsung dengan rekan kerja Anda.
              </p>
              {isListCollapsed && (
                <button
                  type="button"
                  onClick={() => setIsListCollapsed(false)}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Buka Daftar Percakapan
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. Right Panel: Group / Contact Details Drawer */}
        {activeConversation && isDetailsOpen && (
          <GroupDetailsDrawer
            conversation={activeConversation}
            currentUserId={currentUserId}
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            onDeleteConversation={() => handleDeleteConversation(activeConversation.id)}
          />
        )}
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectUser={handleStartPersonalChat}
        isCreating={createPersonalChat.isPending}
      />

      <NewGroupModal
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
        isCreating={createGroupChat.isPending}
      />
    </div>
  );
};
