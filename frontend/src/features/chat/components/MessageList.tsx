import React, { useEffect, useRef, useState } from "react";
import { CheckCheck, FileText, Download, Eye, X } from "lucide-react";
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
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

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

  const isImageAttachment = (msg: Message) => {
    if (msg.message_type === "image") return true;
    if (!msg.attachment_url) return false;
    const lower = msg.attachment_url.toLowerCase();
    return (
      lower.endsWith(".png") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".webp") ||
      lower.endsWith(".gif")
    );
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
    <>
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
          const isImg = isImageAttachment(msg);

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
                className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-[14px] shadow-2xs font-normal leading-relaxed break-words ${
                  isMine
                    ? "bg-blue-600 text-white rounded-br-xs"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                }`}
              >
                {/* Image Attachment Preview */}
                {isImg && msg.attachment_url && (
                  <div className="mb-2 relative group overflow-hidden rounded-xl bg-slate-950/10 border border-black/5">
                    <img
                      src={msg.attachment_url}
                      alt={msg.attachment_name || "Foto"}
                      className="max-h-72 w-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                      onClick={() =>
                        setLightboxImage({
                          url: msg.attachment_url!,
                          title: msg.attachment_name || "Foto Lampiran",
                        })
                      }
                    />
                    <div
                      className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                      onClick={() =>
                        setLightboxImage({
                          url: msg.attachment_url!,
                          title: msg.attachment_name || "Foto Lampiran",
                        })
                      }
                    >
                      <span className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-semibold flex items-center gap-1.5 shadow-md backdrop-blur-xs">
                        <Eye className="w-3.5 h-3.5" /> Lihat Ukuran Penuh
                      </span>
                    </div>
                  </div>
                )}

                {/* File Attachment Card (Non-Image) */}
                {!isImg && msg.attachment_url && (
                  <div
                    className={`mb-2 p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                      isMine
                        ? "bg-blue-700/50 border-blue-500/50 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-2 rounded-lg ${
                          isMine ? "bg-blue-800 text-white" : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {msg.attachment_name || "Dokumen Lampiran"}
                        </p>
                        {msg.attachment_size && (
                          <p
                            className={`text-[10px] ${
                              isMine ? "text-blue-200" : "text-slate-400"
                            }`}
                          >
                            {(msg.attachment_size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                    </div>

                    <a
                      href={msg.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      download={msg.attachment_name || true}
                      className={`p-2 rounded-lg transition-colors ${
                        isMine
                          ? "hover:bg-blue-600 text-white"
                          : "hover:bg-slate-200 text-slate-600"
                      }`}
                      title="Unduh Berkas"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* Content text if not just boilerplate caption */}
                {msg.content && (!isImg || (msg.content !== "Mengirim foto" && msg.content !== "Mengirim lampiran")) && (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* Timestamp & status ticks */}
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[10.5px] ${
                    isMine ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  <span>{formatTime(msg.created_at)}</span>
                  {isMine && <CheckCheck className="w-3.5 h-3.5 text-blue-200" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Lightbox Modal for Full-Size Image Viewing */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <a
                href={lightboxImage.url}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-xs transition-colors"
                title="Unduh Gambar"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-xs transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
            <p className="mt-3 text-sm text-white/80 font-medium">
              {lightboxImage.title}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
