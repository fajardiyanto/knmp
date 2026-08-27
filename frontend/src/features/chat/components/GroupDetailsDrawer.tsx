import React, { useState } from "react";
import {
  X,
  UserPlus,
  Shield,
  User,
  LogOut,
  Trash2,
  Edit2,
  Check,
  Search,
} from "lucide-react";
import { Conversation, ConversationMember, UserSummary } from "../types";
import {
  useAddGroupMember,
  useRemoveGroupMember,
  useSearchUsers,
  useUpdateGroup,
} from "../api";
import { useAlert } from "../../../context/AlertContext";

interface GroupDetailsDrawerProps {
  conversation: Conversation;
  currentUserId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const GroupDetailsDrawer: React.FC<GroupDetailsDrawerProps> = ({
  conversation,
  currentUserId,
  isOpen,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(conversation.name || "");
  const [description, setDescription] = useState(conversation.description || "");

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const updateGroup = useUpdateGroup(conversation.id);
  const addMember = useAddGroupMember(conversation.id);
  const removeMember = useRemoveGroupMember(conversation.id);

  const { data: searchData, isLoading: isSearching } = useSearchUsers(memberSearchQuery);
  const availableUsers = searchData || [];

  if (!isOpen) return null;

  const currentMember = conversation.members?.find((m) => m.user_id === currentUserId);
  const isAdmin = currentMember?.role === "admin";
  const isGroup = conversation.type === "group";

  const handleSaveGroup = () => {
    if (!name.trim()) return;
    updateGroup.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const handleAddUser = (userId: number) => {
    addMember.mutate(
      { user_id: userId, role: "member" },
      {
        onSuccess: () => {
          setIsAddingMember(false);
          setMemberSearchQuery("");
        },
      }
    );
  };

  const { showConfirm } = useAlert();

  const handleRemoveUser = (userId: number) => {
    showConfirm({
      title: "Keluarkan Anggota",
      message: "Apakah Anda yakin ingin mengeluarkan anggota ini dari grup?",
      confirmText: "Keluarkan",
      isDestructive: true,
      onConfirm: () => removeMember.mutate(userId),
    });
  };

  const handleLeaveGroup = () => {
    showConfirm({
      title: "Keluar dari Grup",
      message: "Apakah Anda yakin ingin keluar dari grup ini?",
      confirmText: "Keluar",
      isDestructive: true,
      onConfirm: () =>
        removeMember.mutate(currentUserId, {
          onSuccess: () => onClose(),
        }),
    });
  };

  return (
    <>
      {/* Backdrop on mobile/tablet */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 xl:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 z-50 xl:static xl:z-auto w-80 sm:w-96 bg-white border-l border-slate-200/90 h-full flex flex-col shrink-0 overflow-y-auto shadow-2xl xl:shadow-none animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-medium text-slate-800">
            {isGroup ? "Detail Grup" : "Info Kontak"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      <div className="p-5 space-y-6 flex-1 overflow-y-auto">
        {/* Profile Card */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-md text-2xl font-medium">
            {isGroup ? (
              conversation.display_name.charAt(0).toUpperCase()
            ) : (
              <User className="w-8 h-8" />
            )}
          </div>

          {!isEditing ? (
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h4 className="text-[15px] font-medium text-slate-800">
                  {conversation.display_name}
                </h4>
                {isAdmin && isGroup && (
                  <button
                    type="button"
                    onClick={() => {
                      setName(conversation.name || "");
                      setDescription(conversation.description || "");
                      setIsEditing(true);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                    title="Ubah info grup"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {conversation.description && (
                <p className="text-[12.5px] text-slate-500 font-normal mt-1 leading-relaxed">
                  {conversation.description}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2 text-left pt-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Grup"
                className="w-full px-3 py-1.5 text-[13.5px] border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi Grup"
                className="w-full px-3 py-1.5 text-[13px] border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveGroup}
                  disabled={updateGroup.isPending}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Simpan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Group Members Section */}
        {isGroup && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[13.5px] font-medium text-slate-700">
                Anggota ({conversation.members?.length || 0})
              </h4>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsAddingMember(!isAddingMember)}
                  className="flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              )}
            </div>

            {/* Add Member Panel */}
            {isAddingMember && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Cari user untuk ditambahkan..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100">
                  {isSearching ? (
                    <div className="p-2 text-center text-xs text-slate-400">
                      Mencari...
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div className="p-2 text-center text-xs text-slate-400">
                      Ketik nama user...
                    </div>
                  ) : (
                    availableUsers.map((u: UserSummary) => {
                      const alreadyMember = conversation.members?.some(
                        (m) => m.user_id === u.id
                      );
                      if (alreadyMember) return null;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleAddUser(u.id)}
                          className="w-full p-2 flex items-center justify-between text-left hover:bg-white rounded-md text-xs cursor-pointer"
                        >
                          <span className="font-medium text-slate-700">
                            {u.name}
                          </span>
                          <span className="text-blue-600 font-medium">+ Tambah</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {conversation.members?.map((m: ConversationMember) => {
                const isThisAdmin = m.role === "admin";
                const isMe = m.user_id === currentUserId;

                return (
                  <div
                    key={m.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-medium text-xs">
                          {m.user_name ? m.user_name.charAt(0).toUpperCase() : "U"}
                        </div>
                        {m.is_online && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white absolute -bottom-0.5 -right-0.5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium text-slate-800 truncate">
                            {m.user_name} {isMe && "(Anda)"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate font-normal">
                          {m.role_name || m.user_email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isThisAdmin && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-md border border-emerald-200/60 flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" /> Admin
                        </span>
                      )}

                      {isAdmin && !isMe && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(m.user_id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-1"
                          title="Keluarkan dari grup"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Leave Group Action */}
        {isGroup && (
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLeaveGroup}
              className="w-full py-2.5 px-4 rounded-xl text-[13px] font-medium text-red-600 hover:bg-red-50 border border-red-200/60 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Grup</span>
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
