import React from "react";
import { User, Users2, Info, ArrowLeft, Shield } from "lucide-react";
import { Conversation } from "../types";

interface ChatHeaderProps {
  conversation: Conversation;
  onToggleDetails?: () => void;
  onBackMobile?: () => void;
  isDetailsOpen?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onToggleDetails,
  onBackMobile,
  isDetailsOpen,
}) => {
  const isGroup = conversation.type === "group";

  return (
    <div className="h-16 px-5 border-b border-slate-200/90 bg-white flex items-center justify-between shrink-0 shadow-2xs">
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Mobile Back Button */}
        {onBackMobile && (
          <button
            type="button"
            onClick={onBackMobile}
            className="md:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
              isGroup
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xs"
                : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xs"
            }`}
          >
            {isGroup ? (
              <Users2 className="w-5 h-5" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          {!isGroup && conversation.is_other_online && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5" />
          )}
        </div>

        {/* Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[14.5px] font-medium text-slate-800 truncate">
              {conversation.display_name}
            </h3>
            {isGroup && (
              <span className="px-2 py-0.5 text-[10.5px] font-normal bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200/60">
                Grup
              </span>
            )}
          </div>
          <p className="text-[12px] text-slate-500 truncate font-normal">
            {isGroup ? (
              `${conversation.members?.length || 0} Anggota Peserta`
            ) : conversation.is_other_online ? (
              <span className="text-emerald-600">Online sekarang</span>
            ) : (
              conversation.other_user?.role_name || conversation.other_user?.email || "Offline"
            )}
          </p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleDetails}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            isDetailsOpen
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-slate-200/80"
          }`}
          title="Info & Anggota Percakapan"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
