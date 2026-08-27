import React, { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, Image as ImageIcon, X, Loader2, FileText } from "lucide-react";
import { uploadChatAttachment } from "../api";
import { useAlert } from "../../../context/AlertContext";

interface MessageComposerProps {
  onSend: (content: string, attachment?: { url: string; name: string; size?: number; type?: string }) => void;
  onTyping?: () => void;
  isSending?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  onTyping,
  isSending: isParentSending,
}) => {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { showAlert } = useAlert();

  const isBusy = isParentSending || isUploading;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 20MB
    if (file.size > 20 * 1024 * 1024) {
      showAlert({
        title: "Ukuran File Terlalu Besar",
        message: "Maksimal ukuran file atau gambar adalah 20MB.",
        type: "warning",
      });
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if ((!trimmed && !selectedFile) || isBusy) return;

    try {
      let attachmentInfo: { url: string; name: string; size?: number; type?: string } | undefined = undefined;

      if (selectedFile) {
        setIsUploading(true);
        const uploaded = await uploadChatAttachment(selectedFile);
        const isImage = selectedFile.type.startsWith("image/");
        attachmentInfo = {
          url: uploaded.file_url,
          name: uploaded.file_name,
          size: uploaded.file_size,
          type: isImage ? "image" : "file",
        };
      }

      onSend(trimmed, attachmentInfo);
      setContent("");
      handleRemoveFile();

      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    } catch (err: any) {
      showAlert({
        title: "Gagal Mengunggah Berkas",
        message: err?.message || "Terjadi kesalahan saat mengunggah lampiran gambar.",
        type: "error",
      });
    } finally {
      setIsUploading(false);
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

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 shrink-0">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Attachment Preview Box */}
      {selectedFile && (
        <div className="mb-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3 min-w-0">
            {filePreview ? (
              <img
                src={filePreview}
                alt="Preview"
                className="w-12 h-12 object-cover rounded-lg border border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Hapus Lampiran"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-2xs">
        {/* Attachment button */}
        <button
          type="button"
          disabled={isBusy}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          title="Lampirkan Gambar atau Berkas"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* Text Area */}
        <textarea
          ref={inputRef}
          rows={1}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isBusy}
          placeholder="Tulis pesan... (Enter untuk kirim, Shift+Enter untuk baris baru)"
          className="flex-1 max-h-32 bg-transparent text-[14px] text-slate-800 focus:outline-none resize-none py-1.5 px-1 font-normal placeholder:text-slate-400 leading-relaxed disabled:opacity-50"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!content.trim() && !selectedFile) || isBusy}
          className={`p-2 rounded-xl text-white transition-all shrink-0 cursor-pointer flex items-center justify-center ${
            (content.trim() || selectedFile) && !isBusy
              ? "bg-blue-600 hover:bg-blue-700 shadow-xs active:scale-95"
              : "bg-slate-300 text-slate-100 cursor-not-allowed"
          }`}
          title="Kirim Pesan"
        >
          {isBusy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
