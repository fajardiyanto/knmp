import React, { useEffect, useRef } from "react";
import { Check, CheckCheck } from "lucide-react";
import { Message } from "../types";

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  isGroup?: boolean;
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  isGroup,
  isLoading,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-[13.5px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat riwayat pesan...</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-xs text-slate-400">
          <p className="text-[14px] font-normal text-slate-600">
            Belum ada pesan di percakapan ini
          </p>
          <p className="text-[12px] text-slate-400 mt-1">
            Kirim pesan pertama Anda untuk memulai koordinasi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
      {messages.map((msg, idx) => {
        // System message
        if (msg.message_type === "system") {
          return (
            <div key={msg.id || idx} className="flex justify-center my-2">
              <span className="px-3 py-1 bg-slate-200/80 text-slate-600 text-[11.5px] rounded-full font-normal shadow-2xs">
                {msg.content}
              </span>
            </div>
          );
        }

        const isMine = msg.sender_id === currentUserId;

        return (
          <div
            key={msg.id || idx}
            className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
          >
            {/* Sender header for group messages from others */}
            {!isMine && isGroup && (
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[12px] font-medium text-slate-700">
                  {msg.sender_name || "Pengguna"}
                </span>
                {msg.sender_role && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    • {msg.sender_role}
                  </span>
                )}
              </div>
            )}

            {/* Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-[14px] shadow-2xs font-normal leading-relaxed break-words ${
                isMine
                  ? "bg-blue-600 text-white rounded-br-xs"
                  : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Attachment link if present */}
              {msg.attachment_url && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  <a
                    href={msg.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-xs underline ${
                      isMine ? "text-blue-100" : "text-blue-600"
                    }`}
                  >
                    📎 {msg.attachment_name || "Lampiran Dokumen"}
                  </a>
                </div>
              )}

              {/* Timestamp & status ticks */}
              <div
                className={`flex items-center justify-end gap-1 mt-1 text-[10.5px] ${
                  isMine ? "text-blue-100" : "text-slate-400"
                }`}
              >
                <span>{formatTime(msg.created_at)}</span>
                {isMine && (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
