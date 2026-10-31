import React from 'react';
import {
  Code2,
  FileText,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  HardDrive,
  Cpu,
  Layers,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../services/translations';

interface WelcomeScreenProps {
  onSelectPrompt: (promptText: string) => void;
  lang: Language;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectPrompt, lang }) => {
  const t = translations[lang];

  const promptSuggestions = [
    {
      category: t.categoryCoding,
      icon: <Code2 className="h-3.5 w-3.5 shrink-0" />,
      title: 'Komponen UI Interaktif',
      prompt: 'Buatkan komponen data table analitik responsif dengan filter pencarian dan pagination menggunakan React dan Tailwind CSS.',
    },
    {
      category: t.categoryCoding,
      icon: <Code2 className="h-3.5 w-3.5 shrink-0" />,
      title: 'Refaktorisasi & Optimasi',
      prompt: 'Jelaskan teknik optimasi performa React untuk mereduksi re-render yang tidak perlu pada daftar panjang data.',
    },
    {
      category: t.categoryAnalysis,
      icon: <Layers className="h-3.5 w-3.5 shrink-0" />,
      title: 'Analisis Arsitektur',
      prompt: 'Bandingkan arsitektur Microservices vs Modular Monolith dari skalabilitas tim dan kemudahan deployment.',
    },
    {
      category: t.categoryCreative,
      icon: <FileText className="h-3.5 w-3.5 shrink-0" />,
      title: 'Draf Proposal Proyek',
      prompt: 'Bantu susun kerangka proposal implementasi kecerdasan buatan untuk otomatisasi efisiensi operasional.',
    },
    {
      category: t.categoryStudy,
      icon: <GraduationCap className="h-3.5 w-3.5 shrink-0" />,
      title: 'Penjelasan Konsep Kompleks',
      prompt: 'Jelaskan cara kerja mekanisme self-attention pada Transformer secara intuitif dengan analogi visual.',
    },
    {
      category: t.categoryStudy,
      icon: <GraduationCap className="h-3.5 w-3.5 shrink-0" />,
      title: 'Roadmap Belajar Terstruktur',
      prompt: 'Susun rencana belajar 4 minggu untuk mendalami TypeScript advanced, state management, dan arsitektur web modern.',
    },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-3 sm:px-6 py-3 sm:py-6 max-w-4xl mx-auto w-full">
      {/* Editorial Header */}
      <div className="text-center mb-3 sm:mb-5 max-w-2xl">
        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 theme-text-muted">
          LEOVANDYZ AI · WORKSPACE
        </div>

        <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight theme-text mb-1.5 text-balance">
          {t.welcomeTitle}
        </h1>

        <p className="text-xs sm:text-sm theme-text-secondary leading-relaxed mb-2.5 max-w-lg mx-auto text-balance">
          {t.welcomeSubtitle}
        </p>

        {/* Clean unboxed metadata separator */}
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] theme-text-muted">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            <span>Tanpa Login</span>
          </span>
          <span aria-hidden="true" className="opacity-40">·</span>
          <span className="inline-flex items-center gap-1">
            <HardDrive className="h-3 w-3 text-sky-500" />
            <span>Riwayat Lokal</span>
          </span>
          <span aria-hidden="true" className="opacity-40">·</span>
          <span className="inline-flex items-center gap-1">
            <Cpu className="h-3 w-3 text-indigo-500" />
            <span>Gemini AI</span>
          </span>
        </div>
      </div>

      {/* Suggested Prompt Cards - compact 2-col on sm, 3-col on lg, compact 1-col with 4 items on xs */}
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
        {promptSuggestions.slice(0, 6).map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className={`theme-card-interactive flex flex-col justify-between p-2.5 sm:p-3 text-left group cursor-pointer ${
              idx >= 4 ? 'hidden sm:flex' : 'flex'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold theme-text-muted mb-1">
                {item.icon}
                <span>{item.category}</span>
              </div>
              <h2 className="text-xs font-bold theme-text mb-0.5 group-hover:underline">
                {item.title}
              </h2>
              <p className="text-[11px] theme-text-secondary line-clamp-2 leading-snug">
                {item.prompt}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold theme-text pt-1.5 theme-border-t">
              <span>Gunakan Prompt</span>
              <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
