import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, Code2 } from 'lucide-react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  onOpenInCodingStudio?: (code: string, language: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(
  ({ content, onOpenInCodingStudio }) => {
    const renderedElements = useMemo(() => {
      // Regex to split code blocks
      const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = codeBlockRegex.exec(content)) !== null) {
        const matchIndex = match.index;
        // Text before code block
        if (matchIndex > lastIndex) {
          const textBefore = content.substring(lastIndex, matchIndex);
          const parsedHtml = marked.parse(textBefore, { async: false, breaks: true }) as string;
          parts.push(
            <div
              key={`text-${lastIndex}`}
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: parsedHtml }}
            />
          );
        }

        const language = match[1] || 'text';
        const code = match[2];
        parts.push(
          <CodeBlockWidget
            key={`code-${matchIndex}`}
            language={language}
            code={code}
            onOpenInStudio={onOpenInCodingStudio}
          />
        );

        lastIndex = matchIndex + match[0].length;
      }

      // Remaining text after last code block
      if (lastIndex < content.length) {
        const remainingText = content.substring(lastIndex);
        const parsedHtml = marked.parse(remainingText, { async: false, breaks: true }) as string;
        parts.push(
          <div
            key={`text-${lastIndex}`}
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: parsedHtml }}
          />
        );
      }

      return parts;
    }, [content, onOpenInCodingStudio]);

    return <div className="space-y-2.5 leading-relaxed">{renderedElements}</div>;
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content
);

interface CodeBlockWidgetProps {
  language: string;
  code: string;
  onOpenInStudio?: (code: string, language: string) => void;
}

const CodeBlockWidget: React.FC<CodeBlockWidgetProps> = ({ language, code, onOpenInStudio }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      javascript: 'js',
      js: 'js',
      typescript: 'ts',
      ts: 'ts',
      jsx: 'jsx',
      tsx: 'tsx',
      html: 'html',
      css: 'css',
      python: 'py',
      py: 'py',
      sql: 'sql',
      json: 'json',
      bash: 'sh',
      sh: 'sh',
    };
    const ext = extMap[language.toLowerCase()] || 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-3 overflow-hidden theme-surface">
      <div
        className="flex items-center justify-between px-4 py-2 text-xs font-semibold theme-border-b"
        style={{
          backgroundColor: 'var(--code-header-bg)',
          color: 'var(--code-header-text)',
        }}
      >
        <span className="font-mono uppercase tracking-wider">
          {language || 'code'}
        </span>
        <div className="flex items-center gap-1.5">
          {onOpenInStudio && ['html', 'js', 'jsx', 'ts', 'tsx', 'css'].includes(language.toLowerCase()) && (
            <button
              onClick={() => onOpenInStudio(code, language)}
              className="theme-btn-ghost flex items-center gap-1 px-2 py-1 text-xs"
              title="Buka di Studio Koding"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Buka Studio</span>
            </button>
          )}
          <button
            onClick={handleDownload}
            className="theme-btn-ghost flex items-center gap-1 px-2 py-1 text-xs"
            title="Unduh file kode"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh</span>
          </button>
          <button
            onClick={handleCopy}
            className="theme-btn-ghost flex items-center gap-1 px-2 py-1 text-xs"
            title="Salin kode"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div
        className="overflow-x-auto p-4 text-xs sm:text-sm font-mono leading-relaxed"
        style={{
          backgroundColor: 'var(--code-body-bg)',
          color: 'var(--code-body-text)',
        }}
      >
        <pre className="!bg-transparent !p-0 !m-0">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
