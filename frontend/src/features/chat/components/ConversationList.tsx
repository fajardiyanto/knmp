import React, { useState } from "react";
import {
  Search,
  Plus,
  Users,
  MessageSquarePlus,
  User,
  Users2,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
} from "lucide-react";
import { Conversation } from "../types";

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: number;
  onSelect: (conv: Conversation) => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onDeleteConversation?: (convId: number) => void;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  onOpenNewChat,
  onOpenNewGroup,
  isCollapsed = false,
  onToggleCollapse,
  onDeleteConversation,
  isLoading,
}) => {
  const [search, setSearch] = useState("");

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const filtered = safeConversations.filter((c) => {
    const term = search.toLowerCase();
    const nameMatch = c.display_name.toLowerCase().includes(term);
    const msgMatch = c.last_message?.content?.toLowerCase().includes(term);
    return nameMatch || msgMatch;
  });

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    try {
      const d = new Date(timeStr);
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      if (isToday) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 select-none ${
        isCollapsed ? "w-[76px]" : "w-full md:w-80 lg:w-96"
      }`}
    >
      {/* 1. Header */}
      <div
        className={`border-b border-slate-100 dark:border-slate-800 flex items-center transition-all duration-300 ${
          isCollapsed
            ? "h-16 flex-col justify-center gap-1 p-2"
            : "h-16 px-4 py-3 justify-between"
        }`}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Buka Daftar Percakapan"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="min-w-0 pr-2">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">
                Pesan & Diskusi
              </h2>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 font-normal truncate">
                {conversations.length} Percakapan Aktif
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onOpenNewChat}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700 shadow-2xs cursor-pointer active:scale-95"
                title="Chat Personal Baru"
              >
                <MessageSquarePlus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenNewGroup}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700 shadow-2xs cursor-pointer active:scale-95"
                title="Buat Grup Baru"
              >
                <Users className="w-4 h-4" />
              </button>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700 shadow-2xs cursor-pointer active:scale-95"
                  title="Sembunyikan ke Mode Avatar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* 2. Search Input (Only shown when expanded) */}
      {!isCollapsed && (
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari percakapan atau pesan..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-750 focus:bg-white dark:focus:bg-slate-800 text-[13.5px] text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>
      )}

      {/* 3. Conversations List */}
      <div
        className={`flex-1 overflow-y-auto ${
          isCollapsed ? "py-3 px-2 space-y-2.5" : "divide-y divide-slate-50 dark:divide-slate-800/80"
        }`}
      >
        {isLoading ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            {!isCollapsed && "Memuat percakapan..."}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            {!isCollapsed && (
              <>
                <p className="font-normal text-slate-600 dark:text-slate-300">Belum ada percakapan</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Klik tombol + untuk mulai.
                </p>
              </>
            )}
          </div>
        ) : (
          filtered.map((c) => {
            const isActive = c.id === activeId;
            const isGroup = c.type === "group";

            if (isCollapsed) {
              // Collapsed Mini-Avatar Item
              return (
                <div key={c.id} className="relative group flex items-center justify-center">
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute -left-2 top-2 bottom-2 w-1.5 bg-blue-600 rounded-r-full shadow-xs" />
                  )}

                  <button
                    type="button"
                    onClick={() => onSelect(c)}
                    className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                      isActive
                        ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-md"
                        : "hover:scale-105 hover:shadow-sm opacity-90 hover:opacity-100"
                    } ${
                      isGroup
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                        : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                    }`}
                  >
                    {isGroup ? <Users2 className="w-5 h-5" /> : <User className="w-5 h-5" />}

                    {/* Online Dot */}
                    {!isGroup && c.is_other_online && (
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 absolute -bottom-0.5 -right-0.5 shadow-2xs" />
                    )}

                    {/* Unread Badge Count */}
                    {c.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                        {c.unread_count > 99 ? "99+" : c.unread_count}
                      </span>
                    )}
                  </button>

                  {/* Floating Hover Tooltip */}
                  <div className="absolute left-[70px] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150 ease-out">
                    <div className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-2 rounded-xl shadow-xl border border-slate-700/60 whitespace-nowrap min-w-[140px] max-w-[220px]">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {c.display_name}
                        </span>
                        {isGroup && (
                          <span className="px-1.5 py-0.2 text-[9px] font-medium bg-emerald-500/20 text-emerald-300 rounded">
                            Grup
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {c.last_message?.content || "Belum ada pesan"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            // Expanded Full Row Item
            return (
              <div
                key={c.id}
                onClick={() => onSelect(c)}
                className={`group w-full text-left p-3.5 flex items-center gap-3.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-50/80 dark:bg-blue-950/50 border-l-4 border-blue-600"
                    : "hover:bg-slate-50/80 dark:hover:bg-slate-800/60 border-l-4 border-transparent"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs ${
                      isGroup
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                        : "bg-gradient-to-br from-blue-500 to-indigo-600"
                    }`}
                  >
                    {isGroup ? <Users2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  {!isGroup && c.is_other_online && (
                    <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 absolute -bottom-0.5 -right-0.5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100 truncate">
                      {c.display_name}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 font-normal">
                      {formatTime(c.last_message_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 truncate font-normal">
                      {c.last_message ? (
                        <>
                          {isGroup && c.last_message.sender_name && (
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              {c.last_message.sender_name.split(" ")[0]}:{" "}
                            </span>
                          )}
                          {c.last_message.content}
                        </>
                      ) : (
                        <span className="italic text-slate-400 dark:text-slate-500">
                          Belum ada pesan
                        </span>
                      )}
                    </p>

                    <div className="flex items-center gap-1 shrink-0">
                      {onDeleteConversation && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(c.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Hapus Percakapan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {c.unread_count > 0 && (
                        <span className="px-2 py-0.5 text-[11px] font-bold text-white bg-blue-600 rounded-full shrink-0 animate-pulse">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

