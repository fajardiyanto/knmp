import React, { useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Table as TableIcon,
  Minus,
  Info,
  AlertTriangle,
  CheckCircle2,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Tuliskan hasil meeting, keputusan, atau catatan di sini...",
  minHeight = "280px",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const insertCallout = (type: "info" | "warning" | "success") => {
    let calloutHtml = "";
    if (type === "info") {
      calloutHtml = `
        <div class="confluence-callout confluence-info my-3 p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600 rounded-r-xl text-xs text-blue-900 dark:text-blue-200">
          <strong>💡 Catatan Penting:</strong> Tuliskan poin informasi atau keputusan kunci di sini...
        </div><p><br></p>
      `;
    } else if (type === "warning") {
      calloutHtml = `
        <div class="confluence-callout confluence-warning my-3 p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-900 dark:text-amber-200">
          <strong>⚠️ Perhatian / Risiko:</strong> Tuliskan potensi kendala atau mitigasi yang disepakati...
        </div><p><br></p>
      `;
    } else {
      calloutHtml = `
        <div class="confluence-callout confluence-success my-3 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-emerald-600 rounded-r-xl text-xs text-emerald-900 dark:text-emerald-200">
          <strong>✅ Kesepakatan Final:</strong> Tuliskan keputusan yang telah disetujui bersama...
        </div><p><br></p>
      `;
    }
    exec("insertHTML", calloutHtml);
  };

  const insertTable = () => {
    const tableHtml = `
      <table class="confluence-table my-3 w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">
        <thead>
          <tr class="bg-slate-100 dark:bg-slate-800">
            <th class="border border-slate-300 dark:border-slate-700 p-2 text-left font-bold w-12">No</th>
            <th class="border border-slate-300 dark:border-slate-700 p-2 text-left font-bold">Topik Pembahasan</th>
            <th class="border border-slate-300 dark:border-slate-700 p-2 text-left font-bold">Keputusan & Tindak Lanjut</th>
            <th class="border border-slate-300 dark:border-slate-700 p-2 text-left font-bold w-28">PIC / Batas</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-slate-300 dark:border-slate-700 p-2">1</td>
            <td class="border border-slate-300 dark:border-slate-700 p-2">Progres Pekerjaan Lapangan</td>
            <td class="border border-slate-300 dark:border-slate-700 p-2">Selesai pengecoran tiang dermaga</td>
            <td class="border border-slate-300 dark:border-slate-700 p-2">Site Manager</td>
          </tr>
          <tr>
            <td class="border border-slate-300 dark:border-slate-700 p-2">2</td>
            <td class="border border-slate-300 dark:border-slate-700 p-2">Pengiriman Material Semen</td>
            <td class="border border-slate-300 dark:border-slate-700 p-2">Jadwal kedatangan kapal tanggal 5</td>
            <td class="border border-slate-300 dark:border-slate-700 p-2">Logistik</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    exec("insertHTML", tableHtml);
  };

  const insertTaskList = () => {
    const taskHtml = `
      <div class="confluence-task-list my-2 space-y-1.5 text-xs">
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
          <span>Action Item 1: Siapkan laporan harian & dokumentasi foto</span>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
          <span>Action Item 2: Verifikasi volume fisik bersama Pengawas Lapangan</span>
        </div>
      </div>
      <p><br></p>
    `;
    exec("insertHTML", taskHtml);
  };

  return (
    <div className="confluence-editor rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col transition-all focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500">
      {/* Confluence-style Floating/Sticky Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 select-none text-slate-700 dark:text-slate-300">
        {/* History */}
        <button
          type="button"
          onClick={() => exec("undo")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Urungkan (Undo)"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec("redo")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Ulangi (Redo)"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => exec("formatBlock", "<h1>")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-bold text-xs flex items-center gap-0.5"
          title="Heading 1 (Judul Utama)"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<h2>")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-bold text-xs flex items-center gap-0.5"
          title="Heading 2 (Sub-Judul)"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<h3>")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-bold text-xs flex items-center gap-0.5"
          title="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<p>")}
          className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-[11px] font-medium"
          title="Paragraf Biasa"
        >
          Normal
        </button>

        <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Formats */}
        <button
          type="button"
          onClick={() => exec("bold")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-bold"
          title="Tebal (Bold)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors italic"
          title="Miring (Italic)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec("underline")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors underline"
          title="Garis Bawah (Underline)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec("strikeThrough")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors line-through"
          title="Coret (Strikethrough)"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Lists & Tasks */}
        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Daftar Poin (Bullet List)"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Daftar Nomor (Numbered List)"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={insertTaskList}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
          title="Sisipkan Task List / Checklist"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => exec("justifyLeft")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Rata Kiri"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec("justifyCenter")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Rata Tengah"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec("justifyRight")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Rata Kanan"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Confluence Callouts / Panels */}
        <button
          type="button"
          onClick={() => insertCallout("info")}
          className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
          title="Panel Info / Catatan"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Info</span>
        </button>
        <button
          type="button"
          onClick={() => insertCallout("warning")}
          className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
          title="Panel Peringatan / Risiko"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Perhatian</span>
        </button>
        <button
          type="button"
          onClick={() => insertCallout("success")}
          className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
          title="Panel Kesepakatan / Selesai"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Keputusan</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Insert Table & Quote */}
        <button
          type="button"
          onClick={insertTable}
          className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
          title="Sisipkan Tabel Matriks Rapat"
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Tabel</span>
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<blockquote>")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Kutipan / Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec("insertHorizontalRule")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Garis Pemisah (Horizontal Line)"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{ minHeight }}
        data-placeholder={placeholder}
        className="prose prose-sm dark:prose-invert max-w-none p-5 outline-none text-slate-800 dark:text-slate-200 text-[13.5px] leading-relaxed overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
      />
    </div>
  );
};
