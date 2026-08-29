import React, { useEffect, useRef, useState } from "react";
import {
  CheckCheck,
  FileText,
  Download,
  Eye,
  X,
  Trash2,
  Undo2,
  Copy,
  Check,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";
import { Message } from "../types";
import { useDeleteMessage } from "../api";
import { useAlert } from "../../../context/AlertContext";

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  convId?: number;
  isGroup?: boolean;
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  convId,
  isGroup,
  isLoading,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [unsendTargetMsg, setUnsendTargetMsg] = useState<Message | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const { showAlert } = useAlert();
  const deleteMessage = useDeleteMessage(convId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Click away listener for active dropdown menu
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId !== null) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeMenuId]);

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

  const handleCopyText = (text: string, msgId: number) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
    showAlert({
      title: "Teks Disalin",
      message: "Isi pesan berhasil disalin ke papan klip.",
      type: "success",
    });
  };

  const handleConfirmUnsend = () => {
    if (!unsendTargetMsg) return;
    deleteMessage.mutate(unsendTargetMsg.id, {
      onSuccess: () => {
        setUnsendTargetMsg(null);
        showAlert({
          title: "Pesan Ditarik",
          message: "Pesan berhasil ditarik (unsend) untuk semua orang.",
          type: "success",
        });
      },
      onError: (err: any) => {
        showAlert({
          title: "Gagal Menarik Pesan",
          message: err.message || "Terjadi kesalahan saat menarik pesan.",
          type: "error",
        });
      },
    });
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
          <p className="text-[14px] font-normal text-slate-600 dark:text-slate-300">
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
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/40 transition-colors duration-200">
        {messages.map((msg, idx) => {
          // System message
          if (msg.message_type === "system") {
            return (
              <div key={msg.id || idx} className="flex justify-center my-2">
                <span className="px-3 py-1 bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11.5px] rounded-full font-normal shadow-2xs">
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
              className={`flex flex-col group relative ${isMine ? "items-end" : "items-start"}`}
            >
              {/* Sender header for group messages from others */}
              {!isMine && isGroup && (
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                    {msg.sender_name || "Pengguna"}
                  </span>
                  {msg.sender_role && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                      • {msg.sender_role}
                    </span>
                  )}
                </div>
              )}

              {/* Bubble & Action Container */}
              <div className={`flex items-center gap-1.5 max-w-[88%] sm:max-w-[72%] ${isMine ? "flex-row" : "flex-row-reverse"}`}>
                
                {/* Hover Action Menu Trigger (WhatsApp Style) */}
                <div className="relative shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-all duration-150">
                  {isMine && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUnsendTargetMsg(msg);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Tarik Pesan (Unsend)"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {msg.content && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyText(msg.content, msg.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Salin Teks"
                    >
                      {copiedMsgId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`w-full p-3.5 rounded-2xl text-[14px] shadow-2xs font-normal leading-relaxed break-words relative transition-all ${
                    isMine
                      ? "bg-[#2563eb] text-white rounded-br-xs"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs"
                  }`}
                >
                  {/* Image Attachment Preview */}
                  {isImg && msg.attachment_url && (
                    <div className="mb-2 relative group/img overflow-hidden rounded-xl bg-slate-950/10 dark:bg-slate-950/40 border border-black/5 dark:border-slate-700">
                      <img
                        src={msg.attachment_url}
                        alt={msg.attachment_name || "Foto"}
                        className="max-h-72 w-full object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-105 cursor-pointer"
                        onClick={() =>
                          setLightboxImage({
                            url: msg.attachment_url!,
                            title: msg.attachment_name || "Foto Lampiran",
                          })
                        }
                      />
                      <div
                        className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                        onClick={() =>
                          setLightboxImage({
                            url: msg.attachment_url!,
                            title: msg.attachment_name || "Foto Lampiran",
                          })
                        }
                      >
                        <span className="px-3 py-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-xs font-semibold flex items-center gap-1.5 shadow-md backdrop-blur-xs">
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
                          ? "bg-blue-700/50 border-blue-400/40 text-white"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-2 rounded-lg ${
                            isMine ? "bg-blue-800 text-white" : "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
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
                                isMine ? "text-blue-200" : "text-slate-400 dark:text-slate-500"
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
                            : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
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

                  {/* Time & status indicator */}
                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
                      isMine ? "text-blue-100" : "text-slate-400 dark:text-slate-400"
                    }`}
                  >
                    <span>{formatTime(msg.created_at)}</span>
                    {isMine && (
                      <CheckCheck
                        className={`w-3.5 h-3.5 ${
                          msg.is_read ? "text-emerald-300" : "text-blue-200"
                        }`}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* WhatsApp-Style Unsend Confirmation Modal */}
      {unsendTargetMsg && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800">
                <Undo2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Tarik Pesan (Unsend)?
              </h4>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Pesan yang Anda tarik akan dihapus untuk semua orang dalam percakapan ini seperti di WhatsApp.
            </p>

            {unsendTargetMsg.content && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 italic line-clamp-2">
                "{unsendTargetMsg.content}"
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUnsendTargetMsg(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-2xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteMessage.isPending}
                onClick={handleConfirmUnsend}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                {deleteMessage.isPending ? "Menarik..." : "Tarik untuk Semua Orang"}
              </button>
            </div>
          </div>
        </div>
      )}

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
