import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Wand2,
  Download,
  Trash2,
  Layers,
  Upload,
  AlertCircle,
  ArrowRight,
  Maximize2,
  X,
  Sliders,
} from 'lucide-react';
import { ImageGenerationRecord, Language } from '../types';
import { translations } from '../services/translations';
import { generateImage, editImage } from '../services/api';
import { localDB } from '../services/db';

interface ImageStudioProps {
  gallery: ImageGenerationRecord[];
  onRefreshGallery: () => void;
  lang: Language;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({
  gallery,
  onRefreshGallery,
  lang,
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'gallery'>('generate');

  // Text to Image state
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<ImageGenerationRecord | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Edit Image state
  const [editPrompt, setEditPrompt] = useState('');
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [baseImageMime, setBaseImageMime] = useState('image/png');
  const [isEditing, setIsEditing] = useState(false);
  const [editResult, setEditResult] = useState<ImageGenerationRecord | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Lightbox / Zoom view
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const samplePrompts = [
    'Pemandangan metropolitan futuristik bergaya neon di tengah hujan gerimis malam, sudut lebar 8k sinematik.',
    'Kamar kerja minimalis dengan meja kayu oak, tanaman monstera hijau, laptop modern, dan sinar matahari sore.',
    'Ilustrasi 3D render karakter robot imut yang sedang membaca buku di taman kristal bioluminescent.',
    'Desain logo geometris abstrak burung phoenix dengan kontras tinggi, elegan dan terukur.',
  ];

  const aspectRatios = [
    { id: '1:1', label: '1:1 (Persegi)' },
    { id: '16:9', label: '16:9 (Lanskap Luas)' },
    { id: '9:16', label: '9:16 (Potret / Story)' },
    { id: '4:3', label: '4:3 (Standar TV)' },
    { id: '3:4', label: '3:4 (Potret Standar)' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerateError(null);

    const result = await generateImage({
      prompt: prompt.trim(),
      aspectRatio,
    });

    if (result.success && result.imageUrl) {
      const record: ImageGenerationRecord = {
        id: `img_${Date.now()}`,
        prompt: prompt.trim(),
        resultUrl: result.imageUrl,
        aspectRatio,
        model: 'gemini-3.1-flash-lite-image',
        timestamp: Date.now(),
      };

      await localDB.saveImage(record);
      setCurrentResult(record);
      onRefreshGallery();
    } else {
      setGenerateError(result.error || 'Gagal membuat gambar dengan model Gemini.');
    }

    setIsGenerating(false);
  };

  const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBaseImage(reader.result as string);
      setBaseImageMime(file.type || 'image/png');
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || !baseImage || isEditing) return;

    setIsEditing(true);
    setEditError(null);

    const result = await editImage({
      prompt: editPrompt.trim(),
      imageBase64: baseImage,
      mimeType: baseImageMime,
    });

    if (result.success && result.imageUrl) {
      const record: ImageGenerationRecord = {
        id: `img_edit_${Date.now()}`,
        prompt: editPrompt.trim(),
        originalUrl: baseImage,
        resultUrl: result.imageUrl,
        aspectRatio: '1:1',
        model: 'gemini-3.1-flash-lite-image',
        timestamp: Date.now(),
        isEdit: true,
      };

      await localDB.saveImage(record);
      setEditResult(record);
      onRefreshGallery();
    } else {
      setEditError(result.error || 'Gagal menerapkan instruksi edit gambar.');
    }

    setIsEditing(false);
  };

  const handleDeleteImage = async (id: string) => {
    if (confirm('Hapus gambar ini dari galeri lokal browser Anda?')) {
      await localDB.deleteImage(id);
      if (currentResult?.id === id) setCurrentResult(null);
      if (editResult?.id === id) setEditResult(null);
      onRefreshGallery();
    }
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    const finalName = dataUrl.startsWith('data:image/svg+xml')
      ? filename.replace(/\.png$/i, '.svg')
      : filename;
    a.download = finalName;
    a.click();
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto max-w-5xl mx-auto w-full px-4 py-6">
      {/* Studio Header & Tab Switcher */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 theme-border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="theme-surface-subtle flex h-8 w-8 items-center justify-center">
              <ImageIcon className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-bold theme-text">Studio Gambar Gemini</h2>
          </div>
          <p className="mt-1 text-xs theme-text-secondary">{t.imageGenNote}</p>
        </div>

        {/* Tab Buttons */}
        <div className="theme-surface-subtle flex p-1 text-xs">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 theme-radius font-semibold transition-colors ${
              activeTab === 'generate' ? 'theme-btn-primary' : 'theme-btn-ghost'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>{t.generateTab}</span>
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 theme-radius font-semibold transition-colors ${
              activeTab === 'edit' ? 'theme-btn-primary' : 'theme-btn-ghost'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{t.editTab}</span>
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 theme-radius font-semibold transition-colors ${
              activeTab === 'gallery' ? 'theme-btn-primary' : 'theme-btn-ghost'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{t.galleryTab} ({gallery.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TEXT TO IMAGE */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="theme-surface p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider theme-text mb-1.5">
                  Deskripsi Prompt Gambar
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.imagePromptPlaceholder}
                  rows={4}
                  className="theme-input w-full p-3 text-xs sm:text-sm"
                />
              </div>

              {/* Aspect Ratio Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider theme-text mb-1.5">
                  {t.aspectRatio}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {aspectRatios.map((ar) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setAspectRatio(ar.id)}
                      className={`px-2.5 py-1.5 text-xs text-center transition-all ${
                        aspectRatio === ar.id ? 'theme-btn-primary' : 'theme-btn-secondary'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Action Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`theme-btn-primary w-full flex items-center justify-center gap-2 py-3 text-xs font-bold ${
                  isGenerating || !prompt.trim() ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {isGenerating ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>{t.generatingImage}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>{t.generateButton}</span>
                  </>
                )}
              </button>

              {generateError && (
                <div className="flex flex-col gap-1.5 border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 theme-radius">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>Informasi Kuota Gemini Image API</span>
                  </div>
                  <p className="leading-relaxed opacity-95">{generateError}</p>
                  <p className="text-[11px] theme-text-muted mt-1 leading-snug">
                    Tips: Model gambar <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">gemini-3.1-flash-lite-image</code> membutuhkan API key dengan billing aktif pada Google AI Studio. Anda dapat mengonfigurasi API key baru melalui menu <strong>Settings &gt; Secrets</strong> di AI Studio.
                  </p>
                </div>
              )}
            </div>

            {/* Prompt Inspiration Presets */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider theme-text-muted">
                Inspirasi Prompt:
              </div>
              <div className="space-y-1.5">
                {samplePrompts.map((sp, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(sp)}
                    className="theme-card-interactive flex w-full items-center justify-between p-2.5 text-left text-xs theme-text cursor-pointer"
                  >
                    <span className="line-clamp-1">{sp}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 ml-2 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Column */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="theme-surface p-4 flex-1 flex flex-col justify-center items-center min-h-[360px] relative overflow-hidden">
              {currentResult ? (
                <div className="w-full space-y-3">
                  <div className="relative group overflow-hidden theme-border bg-black/10">
                    <img
                      src={currentResult.resultUrl}
                      alt={currentResult.prompt}
                      className="w-full max-h-[420px] object-contain mx-auto"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => setViewingImage(currentResult.resultUrl)}
                        className="p-2 rounded bg-black/60 text-white hover:bg-black/80"
                        title="Perbesar Gambar"
                        aria-label="Perbesar Gambar"
                      >
                        <Maximize2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => downloadDataUrl(currentResult.resultUrl, `leovandyz_${Date.now()}.png`)}
                        className="p-2 rounded bg-black/60 text-white hover:bg-black/80"
                        title={t.downloadImage}
                        aria-label={t.downloadImage}
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="line-clamp-1 flex-1 pr-2 theme-text-secondary">"{currentResult.prompt}"</span>
                    <button
                      onClick={() => downloadDataUrl(currentResult.resultUrl, `leovandyz_${Date.now()}.png`)}
                      className="theme-btn-primary flex items-center gap-1 px-2.5 py-1 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{t.downloadImage}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-2">
                  <div className="theme-surface-subtle flex h-12 w-12 items-center justify-center mx-auto">
                    <ImageIcon className="h-6 w-6 opacity-60" />
                  </div>
                  <p className="text-sm font-bold theme-text">Pratinjau Gambar</p>
                  <p className="text-xs theme-text-muted max-w-xs">
                    Tuliskan instruksi prompt di samping dan klik tombol Generate untuk membuat karya visual.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROMPT-BASED IMAGE EDIT */}
      {activeTab === 'edit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="theme-surface p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider theme-text mb-1.5">
                  1. {t.uploadBaseImage}
                </label>
                <div className="border-2 border-dashed theme-border p-4 text-center transition-colors">
                  {baseImage ? (
                    <div className="relative inline-block">
                      <img
                        src={baseImage}
                        alt="Acuan dasar"
                        className="h-36 theme-radius object-cover mx-auto"
                      />
                      <button
                        onClick={() => setBaseImage(null)}
                        className="absolute -top-2 -right-2 rounded-full bg-rose-600 p-1 text-white shadow-md hover:bg-rose-700"
                        title="Ganti gambar"
                        aria-label="Ganti gambar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto mb-2 opacity-60" />
                      <label className="cursor-pointer inline-flex items-center gap-1.5 theme-btn-secondary px-3 py-1.5 text-xs font-semibold">
                        <span>Pilih Gambar dari Perangkat</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBaseImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="mt-1.5 text-[11px] theme-text-muted">Mendukung PNG, JPEG, WEBP hingga 8MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider theme-text mb-1.5">
                  2. Instruksi Perubahan / Modifikasi
                </label>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder={t.imageEditPromptPlaceholder}
                  rows={3}
                  className="theme-input w-full p-3 text-xs sm:text-sm"
                />
              </div>

              <button
                onClick={handleEdit}
                disabled={isEditing || !baseImage || !editPrompt.trim()}
                className={`theme-btn-primary w-full flex items-center justify-center gap-2 py-3 text-xs font-bold ${
                  isEditing || !baseImage || !editPrompt.trim()
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                {isEditing ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>Menerapkan Modifikasi...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>{t.editingButton}</span>
                  </>
                )}
              </button>

              {editError && (
                <div className="flex flex-col gap-1.5 border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 theme-radius">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>Informasi Kuota Gemini Image API</span>
                  </div>
                  <p className="leading-relaxed opacity-95">{editError}</p>
                  <p className="text-[11px] theme-text-muted mt-1 leading-snug">
                    Tips: Model gambar <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">gemini-3.1-flash-lite-image</code> membutuhkan API key dengan billing aktif pada Google AI Studio. Anda dapat mengonfigurasi API key baru melalui menu <strong>Settings &gt; Secrets</strong> di AI Studio.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col">
            <div className="theme-surface p-4 flex-1 flex flex-col justify-center items-center min-h-[360px]">
              {editResult ? (
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <span className="text-[11px] theme-text-muted mb-1 block">Gambar Asli</span>
                      <img
                        src={editResult.originalUrl}
                        alt="Asli"
                        className="theme-radius max-h-48 mx-auto object-cover theme-border"
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-[11px] font-bold theme-text mb-1 block">Hasil Modifikasi AI</span>
                      <img
                        src={editResult.resultUrl}
                        alt="Hasil Edit"
                        className="theme-radius max-h-48 mx-auto object-cover theme-border"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 theme-border-t">
                    <span className="truncate pr-2 theme-text-secondary">"{editResult.prompt}"</span>
                    <button
                      onClick={() => downloadDataUrl(editResult.resultUrl, `leovandyz_edit_${Date.now()}.png`)}
                      className="theme-btn-primary flex items-center gap-1 px-2.5 py-1 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{t.downloadImage}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-2">
                  <div className="theme-surface-subtle flex h-12 w-12 items-center justify-center mx-auto">
                    <Sliders className="h-6 w-6 opacity-60" />
                  </div>
                  <p className="text-sm font-bold theme-text">Hasil Modifikasi Gambar</p>
                  <p className="text-xs theme-text-muted max-w-xs">
                    Unggah gambar acuan dan masukkan instruksi perubahan untuk melihat perbandingan hasil.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOCAL GALLERY */}
      {activeTab === 'gallery' && (
        <div>
          {gallery.length === 0 ? (
            <div className="theme-surface p-12 text-center space-y-3">
              <Layers className="h-10 w-10 mx-auto opacity-50" />
              <p className="text-sm font-bold theme-text">{t.noImagesInGallery}</p>
              <p className="text-xs theme-text-muted max-w-sm mx-auto">
                Setiap gambar yang Anda buat atau edit akan tersimpan secara otomatis di IndexedDB browser ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.map((img) => (
                <div
                  key={img.id}
                  className="group relative overflow-hidden theme-surface flex flex-col"
                >
                  <div className="relative aspect-square bg-black/5 overflow-hidden">
                    <img
                      src={img.resultUrl}
                      alt={img.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setViewingImage(img.resultUrl)}
                        className="p-2 rounded bg-white/20 text-white hover:bg-white/30 backdrop-blur-md"
                        title="Lihat Penuh"
                        aria-label="Lihat Penuh"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadDataUrl(img.resultUrl, `gallery_${img.id}.png`)}
                        className="p-2 rounded bg-white/20 text-white hover:bg-white/30 backdrop-blur-md"
                        title={t.downloadImage}
                        aria-label={t.downloadImage}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="p-2 rounded bg-rose-600 text-white hover:bg-rose-700"
                        title={t.deleteImage}
                        aria-label={t.deleteImage}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 text-xs theme-text flex-1 flex flex-col justify-between">
                    <p className="line-clamp-2">{img.prompt}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] theme-text-muted">
                      <span>{img.aspectRatio || '1:1'}</span>
                      <span>{new Date(img.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={viewingImage}
              alt="Preview"
              className="max-h-[85vh] max-w-full theme-radius object-contain mx-auto shadow-2xl"
            />
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-3 -right-3 rounded-full bg-black/80 text-white p-2 hover:bg-black"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
