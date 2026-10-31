import React, { useState, useEffect } from 'react';
import {
  Code2,
  Play,
  Copy,
  Check,
  Download,
  RotateCcw,
  Bug,
  BookOpen,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../services/translations';

interface CodingStudioProps {
  initialCode?: string;
  initialLanguage?: string;
  onAskAiToAssist: (instruction: string) => void;
  lang: Language;
}

export const CodingStudio: React.FC<CodingStudioProps> = ({
  initialCode,
  initialLanguage = 'html',
  onAskAiToAssist,
  lang,
}) => {
  const t = translations[lang];

  const defaultStarterCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LEOVANDYZ AI Sandbox</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-6">
  <div class="max-w-md w-full rounded-xl bg-slate-800 border border-slate-700 p-6 text-center shadow-xl">
    <div class="inline-flex p-3 rounded-lg bg-blue-500/10 text-blue-400 mb-3 border border-blue-500/20">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    </div>
    <h1 class="text-xl font-bold mb-1 text-white">LEOVANDYZ Sandbox</h1>
    <p class="text-slate-400 text-xs mb-5">Pratinjau HTML, CSS & JavaScript dieksekusi di dalam lingkungan aman terisolasi.</p>
    
    <div class="space-y-3">
      <button id="counterBtn" class="w-full py-2.5 px-4 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-500 transition-colors">
        Interaksi Demo: <span id="count">0</span>
      </button>
    </div>
  </div>

  <script>
    let count = 0;
    const btn = document.getElementById('counterBtn');
    const display = document.getElementById('count');
    btn.addEventListener('click', () => {
      count++;
      display.textContent = count;
    });
  </script>
</body>
</html>`;

  const [code, setCode] = useState(initialCode || defaultStarterCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [previewContent, setPreviewContent] = useState(code);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'both' | 'editor' | 'preview'>('both');

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setPreviewContent(initialCode);
    }
    if (initialLanguage) {
      setLanguage(initialLanguage);
    }
  }, [initialCode, initialLanguage]);

  const handleRun = () => {
    setPreviewContent(code);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = language === 'html' ? 'html' : language === 'javascript' || language === 'js' ? 'js' : 'ts';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leovandyz_code_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      {/* Studio Top Control Bar */}
      <div className="theme-header flex flex-wrap items-center justify-between px-4 py-2.5 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm theme-text">
            <Code2 className="h-4 w-4" />
            <span>Studio Koding LEOVANDYZ</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 p-0.5 theme-surface-subtle text-xs">
            <button
              onClick={() => setActiveTab('both')}
              className={`px-2.5 py-1 theme-radius transition-colors ${
                activeTab === 'both' ? 'theme-btn-primary' : 'theme-btn-ghost'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-2.5 py-1 theme-radius transition-colors ${
                activeTab === 'editor' ? 'theme-btn-primary' : 'theme-btn-ghost'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 theme-radius transition-colors ${
                activeTab === 'preview' ? 'theme-btn-primary' : 'theme-btn-ghost'
              }`}
            >
              Pratinjau
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRun}
            className="theme-btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
            title="Jalankan kode di sandbox"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Jalankan</span>
          </button>

          <button
            onClick={handleCopy}
            className="theme-btn-secondary flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium"
            title={t.copyCode}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Salin</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="theme-btn-secondary flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium"
            title={t.downloadCode}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh</span>
          </button>
        </div>
      </div>

      {/* Quick AI Assistance Actions */}
      <div className="theme-surface-subtle flex items-center gap-2 px-4 py-1.5 text-xs overflow-x-auto theme-border-b">
        <span className="theme-text-muted shrink-0 font-bold uppercase text-[10px] tracking-wider">
          Asistensi AI:
        </span>
        <button
          onClick={() => onAskAiToAssist(`Tinjau dan perbaiki potensi bug dalam kode ini:\n\`\`\`\n${code}\n\`\`\``)}
          className="theme-btn-secondary flex items-center gap-1 px-2 py-0.5 text-xs shrink-0"
        >
          <Bug className="h-3 w-3" />
          <span>Periksa Bug</span>
        </button>
        <button
          onClick={() => onAskAiToAssist(`Jelaskan alur kerja arsitektur dan algoritma dalam kode ini secara bertahap:\n\`\`\`\n${code}\n\`\`\``)}
          className="theme-btn-secondary flex items-center gap-1 px-2 py-0.5 text-xs shrink-0"
        >
          <BookOpen className="h-3 w-3" />
          <span>Jelaskan Logika</span>
        </button>
        <button
          onClick={() => onAskAiToAssist(`Lakukan refactoring dan optimasi performa pada kode berikut:\n\`\`\`\n${code}\n\`\`\``)}
          className="theme-btn-secondary flex items-center gap-1 px-2 py-0.5 text-xs shrink-0"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Refactor & Optimasi</span>
        </button>
        <button
          onClick={() => {
            setCode(defaultStarterCode);
            setPreviewContent(defaultStarterCode);
          }}
          className="ml-auto theme-btn-ghost px-2 py-0.5 text-xs shrink-0"
        >
          Reset Starter
        </button>
      </div>

      {/* Main Split Grid (Editor + Sandboxed Iframe) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
        {/* Editor Panel */}
        {(activeTab === 'both' || activeTab === 'editor') && (
          <div
            className="flex flex-col h-full overflow-hidden theme-border-r"
            style={{
              backgroundColor: 'var(--code-body-bg)',
              color: 'var(--code-body-text)',
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold theme-border-b"
              style={{
                backgroundColor: 'var(--code-header-bg)',
                color: 'var(--code-header-text)',
              }}
            >
              <span className="font-mono">Editor Kode ({language.toUpperCase()})</span>
              <span className="text-[10px] opacity-80">Edit lalu klik Jalankan</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full resize-none bg-transparent p-4 font-mono text-xs sm:text-sm placeholder-gray-500 focus:outline-none overflow-auto leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}

        {/* Sandboxed Preview Panel */}
        {(activeTab === 'both' || activeTab === 'preview') && (
          <div className="flex flex-col h-full overflow-hidden theme-surface-subtle">
            <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold theme-border-b theme-text">
              <span>Pratinjau Langsung</span>
              <span className="text-[10px] theme-text-muted">Iframe Terisolasi</span>
            </div>
            <div className="flex-1 bg-white relative">
              <iframe
                title="Live Sandbox Output"
                srcDoc={previewContent}
                sandbox="allow-scripts"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
