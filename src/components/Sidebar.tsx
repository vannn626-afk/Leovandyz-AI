import React, { useState } from 'react';
import {
  MessageSquare,
  Code2,
  Image as ImageIcon,
  FileText,
  GraduationCap,
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Pencil,
  Check,
  X,
  Settings,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { AppMode, Conversation } from '../types';
import { translations } from '../services/translations';

interface SidebarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  lang: 'id' | 'en';
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isApiKeyConfigured: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  onOpenSettings,
  onOpenPrivacy,
  lang,
  isOpenMobile,
  onCloseMobile,
  isApiKeyConfigured,
}) => {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const regularConversations = filteredConversations.filter((c) => !c.isPinned);

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const modeNavItems: Array<{ id: AppMode; label: string; icon: React.ReactNode }> = [
    { id: 'chat', label: t.chatTab, icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'coding', label: t.codingTab, icon: <Code2 className="h-4 w-4" /> },
    { id: 'images', label: t.imagesTab, icon: <ImageIcon className="h-4 w-4" /> },
    { id: 'documents', label: t.documentsTab, icon: <FileText className="h-4 w-4" /> },
    { id: 'study', label: t.studyTab, icon: <GraduationCap className="h-4 w-4" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col theme-sidebar transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 theme-border-b">
          <div className="flex items-center gap-2.5">
            <div className="theme-surface-subtle flex h-8 w-8 items-center justify-center font-mono font-bold text-sm">
              L
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-sm theme-text">
                  LEOVANDYZ AI
                </span>
              </div>
              <p className="text-[11px] theme-text-muted">Gemini Assistant</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="theme-btn-ghost flex h-8 w-8 items-center justify-center lg:hidden"
            aria-label="Tutup Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary Action: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (isOpenMobile) onCloseMobile();
            }}
            className="theme-btn-primary flex w-full items-center justify-center gap-2 py-2.5 px-3 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>{t.newChat}</span>
          </button>
        </div>

        {/* Mode Navigasi Ruang Kerja */}
        <div className="px-3 pb-3">
          <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 theme-text-muted">
            Ruang Kerja
          </div>
          <nav className="space-y-1">
            {modeNavItems.map((item) => {
              const isActive = currentMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectMode(item.id);
                    if (isOpenMobile) onCloseMobile();
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors theme-radius ${
                    isActive
                      ? 'theme-btn-primary'
                      : 'theme-btn-ghost hover:bg-[var(--bg-surface-subtle)]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search Riwayat */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 theme-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchHistory}
              className="theme-input w-full py-1.5 pl-8 pr-3 text-xs"
            />
          </div>
        </div>

        {/* Daftar Percakapan Terkini */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4">
          {/* Pinned Section */}
          {pinnedConversations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider theme-text-muted">
                <Pin className="h-3 w-3" />
                <span>Disematkan</span>
              </div>
              <div className="space-y-1 mt-1">
                {pinnedConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={activeConversationId === conv.id}
                    isEditing={editingId === conv.id}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onSelect={() => {
                      onSelectConversation(conv.id);
                      if (isOpenMobile) onCloseMobile();
                    }}
                    onStartRename={(e) => handleStartRename(conv, e)}
                    onSaveRename={(e) => handleSaveRename(conv.id, e)}
                    onCancelRename={handleCancelRename}
                    onTogglePin={(e) => {
                      e.stopPropagation();
                      onTogglePinConversation(conv.id);
                    }}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular History Section */}
          <div>
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider theme-text-muted">
              Riwayat Percakapan
            </div>
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-xs theme-text-muted">
                {searchQuery ? t.noSearchResults : t.noConversations}
              </div>
            ) : (
              <div className="space-y-1 mt-1">
                {regularConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={activeConversationId === conv.id}
                    isEditing={editingId === conv.id}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onSelect={() => {
                      onSelectConversation(conv.id);
                      if (isOpenMobile) onCloseMobile();
                    }}
                    onStartRename={(e) => handleStartRename(conv, e)}
                    onSaveRename={(e) => handleSaveRename(conv.id, e)}
                    onCancelRename={handleCancelRename}
                    onTogglePin={(e) => {
                      e.stopPropagation();
                      onTogglePinConversation(conv.id);
                    }}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 theme-border-t space-y-1">
          <button
            onClick={() => {
              onOpenSettings();
              if (isOpenMobile) onCloseMobile();
            }}
            className="theme-btn-ghost flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold"
          >
            <Settings className="h-4 w-4" />
            <span>{t.settings}</span>
          </button>
          <button
            onClick={() => {
              onOpenPrivacy();
              if (isOpenMobile) onCloseMobile();
            }}
            className="theme-btn-ghost flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{t.privacy}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

interface ConversationItemProps {
  conv: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (val: string) => void;
  onSelect: () => void;
  onStartRename: (e: React.MouseEvent) => void;
  onSaveRename: (e: React.MouseEvent | React.FormEvent) => void;
  onCancelRename: (e: React.MouseEvent) => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conv,
  isActive,
  isEditing,
  editTitle,
  setEditTitle,
  onSelect,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onTogglePin,
  onDelete,
}) => {
  if (isEditing) {
    return (
      <form onSubmit={onSaveRename} className="flex items-center gap-1 p-1">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          autoFocus
          className="theme-input flex-1 py-1 px-2 text-xs"
        />
        <button
          type="submit"
          className="theme-btn-primary p-1"
          title="Simpan"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onCancelRename}
          className="theme-btn-ghost p-1"
          title="Batal"
        >
          <X className="h-3 w-3" />
        </button>
      </form>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center justify-between px-2.5 py-2 text-xs transition-colors cursor-pointer theme-radius ${
        isActive
          ? 'theme-btn-secondary font-semibold'
          : 'theme-btn-ghost hover:bg-[var(--bg-surface-subtle)]'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
        <span className="truncate">{conv.title}</span>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onTogglePin}
          className="p-1 hover:text-[var(--text-primary)]"
          title={conv.isPinned ? 'Lepas sematan' : 'Sematkan'}
        >
          {conv.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
        </button>
        <button
          onClick={onStartRename}
          className="p-1 hover:text-[var(--text-primary)]"
          title="Ubah judul"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 hover:text-rose-500"
          title="Hapus"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
