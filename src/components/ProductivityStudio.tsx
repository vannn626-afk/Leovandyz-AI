import React from 'react';
import {
  GraduationCap,
  Calendar,
  Mail,
  BookOpen,
  CheckSquare,
  ArrowRight,
  Calculator,
  PenTool,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../services/translations';

interface ProductivityStudioProps {
  onSelectTemplate: (templatePrompt: string) => void;
  lang: Language;
}

export const ProductivityStudio: React.FC<ProductivityStudioProps> = ({
  onSelectTemplate,
  lang,
}) => {
  const t = translations[lang];

  const tools = [
    {
      title: t.toolStepByStep,
      desc: t.toolStepByStepDesc,
      icon: <Calculator className="h-5 w-5" />,
      category: 'STEM & Matematika',
      prompt: `Tolong bantu saya memecahkan soal/masalah berikut ini secara bertahap dan terstruktur:

[Tuliskan soal atau problem matematika/sains Anda di sini]

Sertakan:
1. Konsep atau rumus dasar yang digunakan
2. Langkah perhitungan rinci demi langkah
3. Verifikasi logika hasil akhir
4. Tips intuitif untuk mengingat polanya`,
    },
    {
      title: t.toolSummary,
      desc: t.toolSummaryDesc,
      icon: <BookOpen className="h-5 w-5" />,
      category: 'Studi Akademik',
      prompt: `Tolong buatkan ringkasan materi pelajaran yang komprehensif dari topik/materi berikut:

[Tempelkan teks materi atau sebutkan topik yang ingin dipelajari di sini]

Format output yang diinginkan:
1. Intisari Konsep (Ringkasan 2 paragraf)
2. Poin-poin Kunci & Definisi Istilah Penting
3. Contoh Kasus Nyata / Ilustrasi
4. 3 Pertanyaan Latihan Singkat beserta Jawabannya`,
    },
    {
      title: t.toolSchedule,
      desc: t.toolScheduleDesc,
      icon: <Calendar className="h-5 w-5" />,
      category: 'Manajemen Waktu',
      prompt: `Bantu saya menyusun jadwal belajar/kerja mingguan yang realistis dan produktif:

Target utama: [Contoh: Mempersiapkan ujian sertifikasi dalam 14 hari]
Waktu luang per hari: [Contoh: 3 jam pada malam hari]
Gaya belajar yang disukai: [Contoh: Sesi fokus 45 menit dengan istirahat 10 menit]

Buatkan tabel jadwal harian lengkap dengan milestone mingguan dan evaluasi capaian.`,
    },
    {
      title: t.toolEmail,
      desc: t.toolEmailDesc,
      icon: <Mail className="h-5 w-5" />,
      category: 'Komunikasi Bisnis',
      prompt: `Tuliskan draf email formal dan profesional untuk situasi berikut:

Tujuan email: [Contoh: Permohonan izin revisi proposal proyek / lamaran magang]
Penerima: [Contoh: Manajer Operasional / Dosen Pembimbing]
Poin utama yang harus disampaikan: [Tuliskan 2-3 poin penting]
Nada bahasa: Sopan, lugas, percaya diri, dan beretika profesional.`,
    },
    {
      title: 'Pembuat Kerangka Esai & Laporan',
      desc: 'Membangun outline komprehensif mulai dari latar belakang, rumusan masalah, hingga argumen penutup.',
      icon: <PenTool className="h-5 w-5" />,
      category: 'Penulisan Kritis',
      prompt: `Bantu saya membuat kerangka (outline) esai/makalah mendalam untuk topik:

Topik: [Masukkan judul atau topik esai]
Tesis utama: [Pandangan atau hipotesis yang ingin Anda buktikan]

Sediakan struktur bab demi bab, ide pokok setiap paragraf, dan referensi argumen pendukung yang relevan.`,
    },
    {
      title: 'Penyunting & Polisher Bahasa',
      desc: 'Memperbaiki tata bahasa, pilihan diksi, flow kalimat, dan kejelasan tulisan.',
      icon: <CheckSquare className="h-5 w-5" />,
      category: 'Koreksi Teks',
      prompt: `Tolong periksa, sunting, dan poles tulisan berikut agar lebih tajam, mengalir alami, dan minim kesalahan tata bahasa:

[Tempel teks Anda di sini]

Sertakan:
1. Versi yang telah disunting secara profesional
2. Catatan perbaikan (diksi yang diubah & alasannya)
3. Rekomendasi tambahan untuk meningkatkan kualitas baca`,
    },
  ];

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
      {/* Title */}
      <div className="theme-border-b pb-4">
        <div className="flex items-center gap-2">
          <div className="theme-surface-subtle flex h-8 w-8 items-center justify-center">
            <GraduationCap className="h-4 w-4" />
          </div>
          <h2 className="text-xl font-bold theme-text">{t.studyTitle}</h2>
        </div>
        <p className="mt-1 text-xs theme-text-secondary">{t.studyDesc}</p>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool, idx) => (
          <div
            key={idx}
            className="theme-card-interactive flex flex-col justify-between p-5"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="theme-surface-subtle flex h-9 w-9 items-center justify-center">
                  {tool.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider theme-text-muted">
                  {tool.category}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold theme-text mb-1">{tool.title}</h3>
              <p className="text-xs theme-text-secondary leading-relaxed mb-4">{tool.desc}</p>
            </div>

            <button
              onClick={() => onSelectTemplate(tool.prompt)}
              className="theme-btn-primary flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold cursor-pointer"
            >
              <span>{t.useTemplate}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
