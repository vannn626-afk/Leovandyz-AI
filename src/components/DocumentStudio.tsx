import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  ArrowRight,
  ListFilter,
  FileSearch,
  X,
} from 'lucide-react';
import { FileAttachment, Language } from '../types';
import { translations } from '../services/translations';

interface DocumentStudioProps {
  onStartAnalysisWithFile: (files: FileAttachment[], prompt: string) => void;
  lang: Language;
}

export const DocumentStudio: React.FC<DocumentStudioProps> = ({
  onStartAnalysisWithFile,
  lang,
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const attachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" melebihi batas 10MB.`);
        continue;
      }

      const reader = new FileReader();
      const readPromise = new Promise<FileAttachment>((resolve) => {
        reader.onload = () => {
          const res = reader.result as string;
          const idx = res.indexOf(';base64,');
          const clean = idx !== -1 ? res.substring(idx + 8) : '';
          resolve({
            id: `doc_${Date.now()}_${i}`,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            dataUrl: res,
            base64Data: clean,
          });
        };
        reader.readAsDataURL(file);
      });

      const att = await readPromise;
      attachments.push(att);
    }

    if (attachments.length > 0) {
      setSelectedFiles((prev) => [...prev, ...attachments]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExecuteOperation = (promptTemplate: string) => {
    if (selectedFiles.length === 0) {
      setErrorMsg('Silakan unggah setidaknya satu dokumen terlebih dahulu.');
      return;
    }
    onStartAnalysisWithFile(selectedFiles, promptTemplate);
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const quickOperations = [
    {
      title: t.actionSummarize,
      desc: 'Hasilkan ringkasan komprehensif, tujuan utama, dan kesimpulan dari dokumen.',
      icon: <FileSearch className="h-4 w-4 shrink-0" />,
      prompt: 'Buatkan ringkasan eksekutif komprehensif dari dokumen terlampir. Sertakan poin-poin utama, tujuan penting, dan kesimpulan akhir secara terstruktur.',
    },
    {
      title: t.actionExtractKeyPoints,
      desc: 'Ekstrak butir-butir penting, daftar tindakan nyata (action items), dan tenggat waktu.',
      icon: <ListFilter className="h-4 w-4 shrink-0" />,
      prompt: 'Ekstraksi poin-poin kunci terpenting dari file ini dalam format bullet points. Cantumkan juga action items, rekomendasi, dan hal penting yang perlu ditindaklanjuti.',
    },
    {
      title: t.actionAnalyzeData,
      desc: 'Analisis tabel atau data numerik, pola tren, anomali, dan insight statistik.',
      icon: <FileSpreadsheet className="h-4 w-4 shrink-0" />,
      prompt: 'Analisis data numerik atau tabel dalam dokumen terlampir. Identifikasi tren utama, pola signifikansi, korelasi penting, dan berikan evaluasi analitis.',
    },
    {
      title: t.actionQa,
      desc: 'Persiapkan dokumen untuk sesi tanya jawab interaktif mendalam.',
      icon: <FileText className="h-4 w-4 shrink-0" />,
      prompt: 'Saya telah melampirkan dokumen ini. Berikan gambaran singkat mengenai cakupan dokumen dan beri tahu saya topik atau aspek apa saja yang dapat saya tanyakan.',
    },
  ];

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
      {/* Header */}
      <div className="theme-border-b pb-4">
        <div className="flex items-center gap-2">
          <div className="theme-surface-subtle flex h-8 w-8 items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <h2 className="text-xl font-bold theme-text">{t.uploadDocTitle}</h2>
        </div>
        <p className="mt-1 text-xs theme-text-secondary">{t.uploadDocDesc}</p>
      </div>

      {/* Upload Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="theme-surface border-2 border-dashed p-8 text-center cursor-pointer transition-all hover:bg-[var(--bg-surface-subtle)]"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.csv,.json,.js,.ts,.tsx,.py,.html,.css,image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="theme-surface-subtle flex h-12 w-12 items-center justify-center mx-auto mb-3">
          <Upload className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold theme-text mb-1">
          Klik atau Tarik File Dokumen ke Sini
        </h3>
        <p className="text-xs theme-text-muted max-w-md mx-auto">
          Mendukung PDF, CSV, TXT, Markdown, JSON, source code, dan diagram gambar hingga 10MB per file.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-300 theme-radius">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Uploaded Files Chips */}
      {selectedFiles.length > 0 && (
        <div className="theme-surface p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold theme-text">
              Dokumen Terlampir ({selectedFiles.length})
            </span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs theme-text-muted hover:text-rose-500 transition-colors"
            >
              Hapus Semua
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((f) => (
              <div
                key={f.id}
                className="theme-surface-subtle flex items-center gap-2 px-3 py-1.5 text-xs theme-text"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[200px] truncate">{f.name}</span>
                <button
                  onClick={() => removeFile(f.id)}
                  className="p-0.5 hover:text-rose-500"
                  aria-label="Hapus file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Operation Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider theme-text-muted">
          {t.quickAnalysisActions}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickOperations.map((op, idx) => (
            <button
              key={idx}
              onClick={() => handleExecuteOperation(op.prompt)}
              className="theme-card-interactive flex flex-col justify-between p-4 text-left cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-bold theme-text mb-1 group-hover:underline">
                  {op.icon}
                  <span>{op.title}</span>
                </div>
                <p className="text-xs theme-text-secondary leading-relaxed">{op.desc}</p>
              </div>
              <div className="mt-4 flex items-center justify-end text-xs font-semibold theme-text pt-2 theme-border-t">
                <span>Jalankan Analisis</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Query Area */}
      <div className="theme-surface p-4 space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider theme-text">
          Atau Ajukan Pertanyaan Spesifik Terkait Dokumen:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Contoh: Ringkas temuan utama bab 2 dan implikasinya..."
            className="theme-input flex-1 px-3.5 py-2 text-xs sm:text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customPrompt.trim()) {
                handleExecuteOperation(customPrompt.trim());
              }
            }}
          />
          <button
            onClick={() => {
              if (customPrompt.trim()) {
                handleExecuteOperation(customPrompt.trim());
              }
            }}
            disabled={!customPrompt.trim()}
            className="theme-btn-primary px-4 py-2 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Tanyakan
          </button>
        </div>
      </div>
    </div>
  );
};
