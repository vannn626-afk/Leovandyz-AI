import React, { useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Globe,
  X,
  FileText,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';
import { FileAttachment, Language } from '../types';
import { translations } from '../services/translations';

interface ComposerProps {
  input: string;
  onChangeInput: (val: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  attachments: FileAttachment[];
  onAddAttachments: (files: FileAttachment[]) => void;
  onRemoveAttachment: (id: string) => void;
  webSearchActive: boolean;
  onToggleWebSearch: () => void;
  placeholder?: string;
  lang: Language;
}

export const Composer: React.FC<ComposerProps> = ({
  input,
  onChangeInput,
  onSend,
  onStop,
  isStreaming,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  webSearchActive,
  onToggleWebSearch,
  placeholder,
  lang,
}) => {
  const t = translations[lang];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea smoothly with bounded height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      // Min 34px, Max 120px
      const newHeight = Math.min(Math.max(scrollH, 34), 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && (input.trim() || attachments.length > 0)) {
        onSend();
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Limit size: 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} melebihi batas 10MB.`);
        continue;
      }

      const reader = new FileReader();
      const filePromise = new Promise<FileAttachment>((resolve) => {
        reader.onload = () => {
          const resultStr = reader.result as string;
          const base64Index = resultStr.indexOf(';base64,');
          const cleanBase64 = base64Index !== -1 ? resultStr.substring(base64Index + 8) : '';

          resolve({
            id: `att_${Date.now()}_${i}`,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            dataUrl: resultStr,
            base64Data: cleanBase64,
          });
        };
        reader.readAsDataURL(file);
      });

      const att = await filePromise;
      newAttachments.push(att);
    }

    if (newAttachments.length > 0) {
      onAddAttachments(newAttachments);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (mime: string, name: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="h-3 w-3 shrink-0" />;
    if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.py') || name.endsWith('.json'))
      return <FileCode className="h-3 w-3 shrink-0" />;
    return <FileText className="h-3 w-3 shrink-0" />;
  };

  const canSend = !isStreaming && (input.trim().length > 0 || attachments.length > 0);

  return (
    <div className="shrink-0 w-full max-w-3xl mx-auto px-2.5 sm:px-4 pb-2 sm:pb-3.5 pt-1">
      <div className="theme-surface p-1.5 sm:p-2 transition-shadow">
        {/* Attachment preview list */}
        {attachments.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5 px-0.5">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="theme-surface-subtle flex items-center gap-1.5 py-0.5 pl-2 pr-1 text-[11px] theme-text"
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
                <span className="max-w-[120px] truncate font-medium">{att.name}</span>
                <button
                  onClick={() => onRemoveAttachment(att.id)}
                  className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer"
                  title="Hapus lampiran"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onChangeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t.composerPlaceholder}
          rows={1}
          className="w-full resize-none bg-transparent px-1.5 py-1 text-xs sm:text-sm leading-snug theme-text placeholder:text-[var(--text-muted)] focus:outline-none"
        />

        {/* Bottom Toolbar */}
        <div className="mt-1 flex items-center justify-between pt-1 theme-border-t">
          {/* Left tools: Attach file & Web search toggle */}
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.tsx,.py,.html,.css"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="theme-btn-ghost flex h-7 sm:h-8 items-center gap-1 px-2 text-xs font-medium cursor-pointer"
              title={t.attachFile}
              aria-label={t.attachFile}
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.attachFile}</span>
            </button>

            <button
              type="button"
              onClick={onToggleWebSearch}
              className={`flex h-7 sm:h-8 items-center gap-1 px-2 text-xs font-medium cursor-pointer transition-colors ${
                webSearchActive ? 'theme-btn-primary' : 'theme-btn-ghost'
              }`}
              title={webSearchActive ? t.webSearchActive : t.webSearch}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="text-[11px] sm:text-xs">Web</span>
            </button>
          </div>

          {/* Right tool: Send / Stop button */}
          <div className="flex items-center gap-1.5">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="theme-btn-primary flex h-7 sm:h-8 items-center gap-1 px-2.5 text-xs cursor-pointer"
                title={t.stop}
              >
                <Square className="h-3 w-3 fill-current" />
                <span className="text-xs font-semibold">{t.stop}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!canSend}
                className={`theme-btn-primary flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center ${
                  !canSend ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title={t.send}
                aria-label={t.send}
              >
                <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
