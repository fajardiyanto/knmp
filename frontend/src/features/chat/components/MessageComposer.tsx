import React, { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip } from "lucide-react";

interface MessageComposerProps {
  onSend: (content: string) => void;
  onTyping?: () => void;
  isSending?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  onTyping,
  isSending,
}) => {
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setContent("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping?.();

    // Auto resize
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 shrink-0">
      <div className="flex items-end gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-2xs">
        {/* Attachment button */}
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors shrink-0"
          title="Lampirkan File"
          onClick={() => {
            alert("Fitur upload dokumen/lampiran akan segera aktif.");
          }}
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Text Area */}
        <textarea
          ref={inputRef}
          rows={1}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Tulis pesan... (Tekan Enter untuk kirim, Shift+Enter untuk baris baru)"
          className="flex-1 max-h-32 bg-transparent text-[14px] text-slate-800 focus:outline-none resize-none py-1.5 px-1 font-normal placeholder:text-slate-400 leading-relaxed"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || isSending}
          className={`p-2 rounded-xl text-white transition-all shrink-0 cursor-pointer ${
            content.trim() && !isSending
              ? "bg-blue-600 hover:bg-blue-700 shadow-xs active:scale-95"
              : "bg-slate-300 text-slate-100 cursor-not-allowed"
          }`}
          title="Kirim Pesan"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
