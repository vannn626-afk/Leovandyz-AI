import React, { useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  Pencil,
  Trash2,
  Globe,
  ExternalLink,
  AlertTriangle,
  FileText,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';
import { ChatMessage, FileAttachment, Language } from '../types';
import { translations } from '../services/translations';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatWorkspaceProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onRegenerate: () => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onOpenInCodingStudio?: (code: string, language: string) => void;
  lang: Language;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  messages,
  isStreaming,
  onRegenerate,
  onEditMessage,
  onDeleteMessage,
  onOpenInCodingStudio,
  lang,
}) => {
  const t = translations[lang];
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState('');

  // Instant, zero-lag scroll during streaming
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Auto-scroll if near bottom or when a new message starts
    if (distanceFromBottom < 220 || isStreaming) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditDraft(msg.content);
  };

  const handleSaveEdit = (msgId: string) => {
    if (editDraft.trim()) {
      onEditMessage(msgId, editDraft.trim());
    }
    setEditingMessageId(null);
  };

  const getFileIcon = (mime: string, name: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="h-3 w-3 shrink-0" />;
    if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.py') || name.endsWith('.json'))
      return <FileCode className="h-3 w-3 shrink-0" />;
    return <FileText className="h-3 w-3 shrink-0" />;
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-2.5 sm:px-5 py-3 sm:py-4 space-y-3.5 sm:space-y-4 max-w-3xl mx-auto w-full"
    >
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        const isLastAssistant = !isUser && index === messages.length - 1;

        if (isUser) {
          return (
            <div key={message.id} className="flex justify-end group">
              <div className="max-w-[90%] sm:max-w-[82%]">
                {/* Attachments preview */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
                    {message.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="theme-surface-subtle flex items-center gap-1.5 px-2 py-0.5 text-[11px] theme-text"
                      >
                        {att.mimeType.startsWith('image/') && att.dataUrl ? (
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="h-4 w-4 rounded object-cover"
                          />
                        ) : (
                          getFileIcon(att.mimeType, att.name)
                        )}
                        <span className="max-w-[120px] truncate">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Editable user bubble */}
                {editingMessageId === message.id ? (
                  <div className="theme-surface p-2.5">
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      className="w-full resize-none bg-transparent text-xs sm:text-sm theme-text focus:outline-none"
                      rows={3}
                    />
                    <div className="mt-1.5 flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="theme-btn-ghost px-2 py-1 text-xs cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                      <button
                        onClick={() => handleSaveEdit(message.id)}
                        className="theme-btn-primary px-2.5 py-1 text-xs cursor-pointer"
                      >
                        {t.save}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="theme-user-bubble px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm leading-relaxed">
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                )}

                {/* User quick actions */}
                <div className="mt-1 flex items-center justify-end gap-2 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity text-[11px] theme-text-muted">
                  <button
                    onClick={() => handleStartEdit(message)}
                    className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title={t.editMessage}
                  >
                    <Pencil className="h-3 w-3" />
                    <span>{t.editMessage}</span>
                  </button>
                  <button
                    onClick={() => handleCopy(message.id, message.content)}
                    className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title={t.copy}
                  >
                    {copiedId === message.id ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // Assistant Message
        return (
          <div key={message.id} className="flex gap-2 sm:gap-3 group">
            {/* AI Monogram Avatar */}
            <div className="theme-surface-subtle flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center font-mono font-bold text-[10px] sm:text-xs mt-0.5">
              AI
            </div>

            {/* Bubble Container */}
            <div className="flex-1 max-w-[94%] sm:max-w-[92%] space-y-1.5">
              <div className="theme-assistant-bubble p-3 sm:p-4 text-xs sm:text-sm">
                {/* Error Banner if any */}
                {message.error && (
                  <div className="mb-2.5 flex items-start gap-2 rounded border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-300">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{t.errorOccurred}</p>
                      <p className="mt-0.5 opacity-90 leading-snug">{message.error}</p>
                      <button
                        onClick={onRegenerate}
                        className="mt-1.5 inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold theme-btn-secondary cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>{t.retry}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Content Render */}
                {message.content ? (
                  <MarkdownRenderer
                    content={message.content}
                    onOpenInCodingStudio={onOpenInCodingStudio}
                  />
                ) : message.isStreaming ? (
                  <div className="flex items-center gap-2 text-xs theme-text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    <span>{t.thinking}</span>
                  </div>
                ) : null}

                {/* Blinking streaming cursor */}
                {message.isStreaming && message.content && (
                  <span className="inline-block h-3.5 w-1 ml-0.5 bg-current animate-pulse align-middle" />
                )}

                {/* Grounding web search sources citations */}
                {message.groundingSources && message.groundingSources.length > 0 && (
                  <div className="mt-3 border-t theme-border pt-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold theme-text mb-1.5">
                      <Globe className="h-3 w-3" />
                      <span>{t.sources}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {message.groundingSources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="theme-surface-subtle flex items-center gap-1 px-2 py-0.5 text-[11px] hover:underline transition-colors"
                        >
                          <span className="max-w-[150px] truncate">{source.title}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-60" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom action toolbar */}
              <div className="flex items-center gap-1.5 text-xs theme-text-muted">
                <button
                  onClick={() => handleCopy(message.id, message.content)}
                  className="theme-btn-ghost flex items-center gap-1 px-2 py-0.5 cursor-pointer"
                  title={t.copy}
                >
                  {copiedId === message.id ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500 text-[11px]">{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span className="text-[11px]">{t.copy}</span>
                    </>
                  )}
                </button>

                {isLastAssistant && !isStreaming && (
                  <button
                    onClick={onRegenerate}
                    className="theme-btn-ghost flex items-center gap-1 px-2 py-0.5 cursor-pointer"
                    title={t.regenerate}
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span className="text-[11px]">{t.regenerate}</span>
                  </button>
                )}

                <button
                  onClick={() => onDeleteMessage(message.id)}
                  className="theme-btn-ghost flex items-center gap-1 px-1.5 py-0.5 hover:text-rose-500 cursor-pointer"
                  title="Hapus pesan ini"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
