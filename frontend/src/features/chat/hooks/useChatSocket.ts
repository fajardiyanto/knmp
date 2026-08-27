import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WSEvent } from "../types";

export const useChatSocket = (activeConversationId?: number) => {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem("knmp_token") || localStorage.getItem("token");
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // If running in development (Vite port 5173), target backend 8080 or window.location.host
    const host = window.location.port === "5173" ? "localhost:8080" : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/chat?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const wsEvent: WSEvent = JSON.parse(event.data);

          switch (wsEvent.type) {
            case "new_message":
            case "message_deleted":
              if (wsEvent.conversation_id) {
                queryClient.invalidateQueries({
                  queryKey: ["chat-messages", wsEvent.conversation_id],
                });
              }
              queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
              queryClient.invalidateQueries({ queryKey: ["chat-total-unread"] });
              break;

            case "conversation_deleted":
              if (wsEvent.conversation_id) {
                queryClient.removeQueries({
                  queryKey: ["chat-conversation", wsEvent.conversation_id],
                });
                queryClient.removeQueries({
                  queryKey: ["chat-messages", wsEvent.conversation_id],
                });
              }
              queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
              queryClient.invalidateQueries({ queryKey: ["chat-total-unread"] });
              break;

            case "message_read":
              if (wsEvent.conversation_id) {
                queryClient.invalidateQueries({
                  queryKey: ["chat-messages", wsEvent.conversation_id],
                });
              }
              queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
              queryClient.invalidateQueries({ queryKey: ["chat-total-unread"] });
              break;

            case "user_typing":
              if (wsEvent.conversation_id && wsEvent.data?.user_id) {
                const userId = wsEvent.data.user_id;
                setTypingUsers((prev) => ({ ...prev, [userId]: true }));
                setTimeout(() => {
                  setTypingUsers((prev) => ({ ...prev, [userId]: false }));
                }, 3000);
              }
              break;

            case "member_joined":
            case "member_left":
            case "group_updated":
              if (wsEvent.conversation_id) {
                queryClient.invalidateQueries({
                  queryKey: ["chat-conversation", wsEvent.conversation_id],
                });
              }
              queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
              break;

            default:
              break;
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Automatic reconnect after 4 seconds
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 4000);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }
  }, [queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendTyping = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && activeConversationId) {
      socketRef.current.send(
        JSON.stringify({
          type: "typing",
          conversation_id: activeConversationId,
        })
      );
    }
  }, [activeConversationId]);

  return {
    isConnected,
    typingUsers,
    sendTyping,
  };
};
