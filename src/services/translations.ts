import { Language } from '../types';

export const translations = {
  id: {
    appName: 'LEOVANDYZ AI',
    appSubtitle: 'Asisten AI Publik Multifungsi & Cerdas',
    tagline: 'Tanpa Login • Riwayat Lokal • Bertenaga Gemini API',
    
    // Navigation & Tabs
    chatTab: 'Percakapan AI',
    codingTab: 'Studio Koding',
    imagesTab: 'Studio Gambar',
    documentsTab: 'Analisis Dokumen',
    studyTab: 'Studi & Produktivitas',
    
    // Actions
    newChat: 'Percakapan Baru',
    searchHistory: 'Cari riwayat percakapan...',
    noConversations: 'Belum ada riwayat percakapan',
    noSearchResults: 'Tidak ditemukan riwayat yang cocok',
    deleteChat: 'Hapus percakapan',
    renameChat: 'Ubah judul',
    pinChat: 'Sematkan percakapan',
    unpinChat: 'Lepas sematan',
    save: 'Simpan',
    cancel: 'Batal',
    confirm: 'Konfirmasi',
    clearAll: 'Hapus Semua Data',
    clearAllConfirmTitle: 'Hapus Seluruh Riwayat Lokal?',
    clearAllConfirmDesc: 'Tindakan ini akan menghapus semua riwayat percakapan, file, dan gambar dari IndexedDB browser Anda. Tindakan ini tidak dapat dibatalkan.',
    exportBackup: 'Ekspor Cadangan (JSON)',
    importBackup: 'Impor Cadangan',
    backupSuccess: 'Cadangan berhasil dipulihkan!',
    settings: 'Pengaturan',
    privacy: 'Privasi & Transparansi',
    status: 'Status Layanan',
    
    // Welcome Screen
    welcomeTitle: 'Bagaimana LEOVANDYZ AI dapat membantu Anda hari ini?',
    welcomeSubtitle: 'Pilih salah satu mode kerja atau ketik pertanyaan langsung di bawah. Seluruh riwayat tersimpan aman di browser Anda tanpa perlu mendaftar akun.',
    categoryCoding: 'Pemrograman & Solusi Teknis',
    categoryCreative: 'Penulisan & Kreativitas',
    categoryAnalysis: 'Riset & Pemikiran Kritis',
    categoryStudy: 'Belajar & Produktivitas',
    
    // Composer
    composerPlaceholder: 'Tanya apa saja, instruksi kode, atau analisis...',
    composerPlaceholderCoding: 'Jelaskan logika aplikasi, perbaikan bug, atau buat komponen...',
    composerPlaceholderDocs: 'Tanyakan sesuatu tentang dokumen yang dilampirkan...',
    attachFile: 'Lampirkan file atau dokumen (PDF, TXT, CSV, gambar, kode)',
    webSearch: 'Pencarian Web Google',
    webSearchActive: 'Pencarian Web Aktif',
    send: 'Kirim Pesan',
    stop: 'Hentikan Respon',
    clearAttachments: 'Hapus lampiran',
    fileSizeLimitNotice: 'Maksimal ukuran file 10MB per lampiran.',
    
    // Chat Message
    copy: 'Salin',
    copied: 'Tersalin!',
    regenerate: 'Hasilkan Ulang',
    editMessage: 'Sunting Pesan',
    sources: 'Sumber Informasi Web:',
    thinking: 'Sedang menganalisis & merumuskan solusi...',
    errorOccurred: 'Terjadi kendala saat memproses permintaan.',
    retry: 'Coba Lagi',
    
    // Coding Studio
    codeEditor: 'Editor Kode',
    codePreview: 'Pratinjau Langsung (Sandbox)',
    openPreview: 'Buka Pratinjau',
    downloadCode: 'Unduh Kode',
    copyCode: 'Salin Kode',
    resetCode: 'Bersihkan Editor',
    livePreviewSandboxDesc: 'Pratinjau HTML/CSS/JS dieksekusi di dalam iframe terisolasi yang aman.',
    templates: 'Templat Cepat:',
    templateReact: 'Komponen React Modern',
    templateHtml: 'Landing Page Responsif',
    templateAlgo: 'Algoritma Pemrosesan Data',
    
    // Image Studio
    generateTab: 'Teks ke Gambar',
    editTab: 'Edit Gambar Berbasis Prompt',
    galleryTab: 'Galeri Lokal',
    imagePromptPlaceholder: 'Deskripsikan gambar yang ingin dibuat secara detail (contoh: "Pemandangan kota futuristik bernuansa neon cyberpunk di malam hari, sudut sinematik 8k")...',
    imageEditPromptPlaceholder: 'Tulis instruksi perubahan (contoh: "Ganti latar belakang dengan langit berbintang aurora dan perbaiki pencahayaan")...',
    uploadBaseImage: 'Pilih atau unggah gambar acuan untuk diedit',
    aspectRatio: 'Rasio Aspek:',
    generateButton: 'Generate Gambar',
    editingButton: 'Terapkan Modifikasi AI',
    generatingImage: 'AI sedang menggambar karya Anda...',
    noImagesInGallery: 'Belum ada gambar yang digenerate di browser ini.',
    downloadImage: 'Unduh Gambar',
    deleteImage: 'Hapus Gambar',
    imageGenNote: 'Menggunakan model Gemini Image Studio. Gambar disimpan langsung di IndexedDB lokal perangkat Anda.',
    
    // Document Analysis
    uploadDocTitle: 'Unggah Dokumen atau File',
    uploadDocDesc: 'Mendukung PDF, teks biasa (.txt), Markdown (.md), CSV, JSON, file kode sumber, dan gambar diagram.',
    quickAnalysisActions: 'Operasi Cepat:',
    actionSummarize: 'Ringkas Intisari Dokumen',
    actionExtractKeyPoints: 'Ekstrak Poin Kunci & Tindakan',
    actionAnalyzeData: 'Analisis Pola Data & Tren',
    actionQa: 'Tanya Jawab Berbasis Dokumen',
    
    // Study & Productivity
    studyTitle: 'Koleksi Alat Belajar & Produktivitas',
    studyDesc: 'Gunakan rancangan instruksi cerdas untuk memecahkan masalah pelajaran, menulis laporan, atau mengatur jadwal.',
    toolStepByStep: 'Penyelesai Soal Bertahap',
    toolStepByStepDesc: 'Membedah soal matematika, sains, atau logika langkah demi langkah dengan penjelasan intuitif.',
    toolSummary: 'Rangkuman Materi Kuliah/Buku',
    toolSummaryDesc: 'Mengubah teks panjang menjadi catatan berstruktur rapi dengan glosarium istilah.',
    toolSchedule: 'Perencana Jadwal Efektif',
    toolScheduleDesc: 'Menyusun alur kerja atau jadwal belajar harian yang realistis berdasarkan target Anda.',
    toolEmail: 'Penyusun Email & Surat Formal',
    toolEmailDesc: 'Membuat draf komunikasi bisnis, lamaran, atau pesan profesional dengan nada yang tepat.',
    useTemplate: 'Gunakan Templat',
    
    // Settings Modal
    settingsTitle: 'Pengaturan LEOVANDYZ AI',
    themeLabel: 'Tema Desain (8 Pilihan Karakter)',
    themeDesc: 'Pilih identitas visual sistem. Setiap tema memiliki tipografi, kontras, dan batas arsitektur unik.',
    languageLabel: 'Bahasa Antarmuka',
    accentColorLabel: 'Aksen Warna Tema Glassmorphism',
    defaultModelLabel: 'Model AI Default',
    streamResponseLabel: 'Streaming Teks Waktu Nyata',
    streamResponseDesc: 'Menampilkan respons AI secara bertahap saat dibuat untuk latensi yang lebih rendah.',
    storageStats: 'Penyimpanan Lokal Perangkat',
    totalConversations: 'Percakapan:',
    totalMessages: 'Pesan:',
    totalImages: 'Gambar:',
    
    // Privacy Modal
    privacyTitle: 'Privasi & Arsitektur Lokal',
    privacySection1Title: '1. Tanpa Login & Tanpa Pelacakan Pengguna',
    privacySection1Desc: 'LEOVANDYZ AI dirancang dengan prinsip local-first. Anda tidak perlu memasukkan email, kata sandi, atau nomor telepon. Kami tidak membuat profil akun di cloud server.',
    privacySection2Title: '2. Penyimpanan di IndexedDB Perangkat Anda',
    privacySection2Desc: 'Seluruh percakapan, lampiran dokumen, dan gambar hasil kreasi disimpan secara lokal pada IndexedDB browser Anda. Jika Anda menghapus data situs atau cache browser, riwayat tersebut akan terhapus kecuali Anda mengekspor cadangan JSON terlebih dahulu.',
    privacySection3Title: '3. Pemrosesan Melalui Google Gemini API',
    privacySection3Desc: 'Permintaan chat, gambar, dan dokumen diteruskan ke backend aman kami untuk diproses oleh Google Gemini API. API Key server dilindungi dan tidak pernah terekspos ke sisi peramban. Pemrosesan mengikuti kebijakan penggunaan Google Gemini.',
    privacySection4Title: '4. Kontrol Penuh Pengguna',
    privacySection4Desc: 'Anda dapat menghapus riwayat kapan saja menggunakan tombol hapus atau membersihkan seluruh basis data lokal melalui Pengaturan.',
    close: 'Tutup',
  },
  en: {
    appName: 'LEOVANDYZ AI',
    appSubtitle: 'Multifunctional & Smart Public AI Assistant',
    tagline: 'No Login Required • Local-First • Powered by Gemini API',
    
    // Navigation & Tabs
    chatTab: 'AI Chat',
    codingTab: 'Coding Studio',
    imagesTab: 'Image Studio',
    documentsTab: 'Doc Analysis',
    studyTab: 'Study & Productivity',
    
    // Actions
    newChat: 'New Chat',
    searchHistory: 'Search conversation history...',
    noConversations: 'No conversation history yet',
    noSearchResults: 'No matching history found',
    deleteChat: 'Delete conversation',
    renameChat: 'Rename title',
    pinChat: 'Pin conversation',
    unpinChat: 'Unpin conversation',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    clearAll: 'Clear All Data',
    clearAllConfirmTitle: 'Clear Entire Local Storage?',
    clearAllConfirmDesc: 'This action will delete all conversations, files, and images from your browser IndexedDB. This action cannot be undone.',
    exportBackup: 'Export Backup (JSON)',
    importBackup: 'Import Backup',
    backupSuccess: 'Backup restored successfully!',
    settings: 'Settings',
    privacy: 'Privacy & Transparency',
    status: 'Service Status',
    
    // Welcome Screen
    welcomeTitle: 'How can LEOVANDYZ AI help you today?',
    welcomeSubtitle: 'Choose a dedicated workspace or ask any question below. All history is stored securely on your device with no login required.',
    categoryCoding: 'Coding & Technical Solutions',
    categoryCreative: 'Writing & Creative Output',
    categoryAnalysis: 'Research & Critical Thinking',
    categoryStudy: 'Learning & Productivity',
    
    // Composer
    composerPlaceholder: 'Ask anything, code instruction, or analysis...',
    composerPlaceholderCoding: 'Explain app architecture, fix bugs, or build components...',
    composerPlaceholderDocs: 'Ask questions about the attached document...',
    attachFile: 'Attach files or documents (PDF, TXT, CSV, image, code)',
    webSearch: 'Google Web Search',
    webSearchActive: 'Web Search Active',
    send: 'Send Message',
    stop: 'Stop Response',
    clearAttachments: 'Clear attachments',
    fileSizeLimitNotice: 'Maximum file size is 10MB per attachment.',
    
    // Chat Message
    copy: 'Copy',
    copied: 'Copied!',
    regenerate: 'Regenerate',
    editMessage: 'Edit Message',
    sources: 'Web Information Sources:',
    thinking: 'Analyzing and formulating response...',
    errorOccurred: 'An error occurred while processing the request.',
    retry: 'Retry',
    
    // Coding Studio
    codeEditor: 'Code Editor',
    codePreview: 'Live Sandbox Preview',
    openPreview: 'Open Preview',
    downloadCode: 'Download Code',
    copyCode: 'Copy Code',
    resetCode: 'Clear Editor',
    livePreviewSandboxDesc: 'HTML/CSS/JS preview runs inside an isolated, safe iframe sandbox.',
    templates: 'Quick Templates:',
    templateReact: 'Modern React Component',
    templateHtml: 'Responsive Landing Page',
    templateAlgo: 'Data Processing Algorithm',
    
    // Image Studio
    generateTab: 'Text to Image',
    editTab: 'Prompt-Based Image Edit',
    galleryTab: 'Local Gallery',
    imagePromptPlaceholder: 'Describe the image in detail (e.g. "Futuristic cityscape with neon cyberpunk lighting at night, 8k cinematic shot")...',
    imageEditPromptPlaceholder: 'Enter modification instructions (e.g. "Change the background to starry aurora night and adjust lighting")...',
    uploadBaseImage: 'Select or upload a reference image to edit',
    aspectRatio: 'Aspect Ratio:',
    generateButton: 'Generate Image',
    editingButton: 'Apply AI Edit',
    generatingImage: 'AI is crafting your visual artwork...',
    noImagesInGallery: 'No generated images saved on this browser yet.',
    downloadImage: 'Download Image',
    deleteImage: 'Delete Image',
    imageGenNote: 'Powered by Gemini Image Studio. Images are saved directly to your local device IndexedDB.',
    
    // Document Analysis
    uploadDocTitle: 'Upload Document or File',
    uploadDocDesc: 'Supports PDF, plain text (.txt), Markdown (.md), CSV, JSON, source code files, and diagram images.',
    quickAnalysisActions: 'Quick Operations:',
    actionSummarize: 'Executive Summary',
    actionExtractKeyPoints: 'Extract Key Points & Action Items',
    actionAnalyzeData: 'Analyze Data Patterns & Trends',
    actionQa: 'Document Q&A',
    
    // Study & Productivity
    studyTitle: 'Study & Productivity Toolkit',
    studyDesc: 'Leverage engineered prompts to solve academic problems, draft papers, or structure schedules.',
    toolStepByStep: 'Step-by-Step Problem Solver',
    toolStepByStepDesc: 'Breaks down math, science, or logic problems step by step with clear explanations.',
    toolSummary: 'Lecture & Text Summarizer',
    toolSummaryDesc: 'Transforms lengthy content into well-structured notes with key concept glossaries.',
    toolSchedule: 'Smart Study Planner',
    toolScheduleDesc: 'Designs realistic daily study routines or workflows tailored to your milestones.',
    toolEmail: 'Professional Email & Letter Drafter',
    toolEmailDesc: 'Drafts high-impact business emails, applications, or correspondence with the right tone.',
    useTemplate: 'Use Template',
    
    // Settings Modal
    settingsTitle: 'LEOVANDYZ AI Settings',
    themeLabel: 'Design Theme (8 Distinct Identities)',
    themeDesc: 'Choose your visual identity. Each theme provides bespoke typography, contrast, and spatial architecture.',
    languageLabel: 'Interface Language',
    accentColorLabel: 'Glassmorphism Accent Color',
    defaultModelLabel: 'Default AI Model',
    streamResponseLabel: 'Real-time Streaming',
    streamResponseDesc: 'Stream AI output progressively for lower perceived latency.',
    storageStats: 'Local Device Storage',
    totalConversations: 'Conversations:',
    totalMessages: 'Messages:',
    totalImages: 'Images:',
    
    // Privacy Modal
    privacyTitle: 'Privacy & Local Architecture',
    privacySection1Title: '1. No Login & No User Tracking',
    privacySection1Desc: 'LEOVANDYZ AI is built on local-first principles. You never have to provide an email, password, or phone number. We do not maintain user profiles on our servers.',
    privacySection2Title: '2. Local Device IndexedDB Storage',
    privacySection2Desc: 'All conversations, attachments, and generated images remain in your browser IndexedDB. Clearing browser site data will remove this history unless you export a JSON backup beforehand.',
    privacySection3Title: '3. Secure Google Gemini API Integration',
    privacySection3Desc: 'Chat, image, and document requests are routed through our secure backend to the Google Gemini API. Server secrets are never exposed to browser bundles. Processing adheres to Google Gemini terms.',
    privacySection4Title: '4. Complete User Control',
    privacySection4Desc: 'You can delete any single conversation or wipe the entire local database at any time from Settings.',
    close: 'Close',
  },
};

export interface ThemeDefinition {
  id: import('../types').AppTheme;
  name: string;
  nameEn: string;
  tagline: string;
  taglineEn: string;
  badge?: string;
  badgeEn?: string;
  isDark: boolean;
  palette: {
    bg: string;
    surface: string;
    border: string;
    text: string;
    accent: string;
  };
}

export const THEME_DEFINITIONS: ThemeDefinition[] = [
  {
    id: 'monokrom-neobrutalism',
    name: '1. Monokrom Neobrutalism',
    nameEn: '1. Monochrome Neobrutalism',
    tagline: 'Desain editorial kontras tinggi hitam-putih, garis tegas 2px, bayangan offset tajam, dan sudut geometris.',
    taglineEn: 'High-contrast monochrome editorial layout, 2px crisp outlines, sharp offset shadows, and geometric corners.',
    badge: 'DEFAULT',
    badgeEn: 'DEFAULT',
    isDark: false,
    palette: {
      bg: '#f4f4f5',
      surface: '#ffffff',
      border: '#09090b',
      text: '#09090b',
      accent: '#09090b',
    },
  },
  {
    id: 'pinky-neobrutalism',
    name: '2. Pinky Neobrutalism',
    nameEn: '2. Pinky Neobrutalism',
    tagline: 'Soft pink dengan aksen hot pink berani, outline gelap arsitektural, dan bayangan offset tegas.',
    taglineEn: 'Soft blush pink with hot pink accents, dark charcoal outlines, and architectural offset shadows.',
    badge: 'Bold & Playful',
    badgeEn: 'Bold & Playful',
    isDark: false,
    palette: {
      bg: '#fdf2f8',
      surface: '#ffffff',
      border: '#18181b',
      text: '#18181b',
      accent: '#db2777',
    },
  },
  {
    id: 'glassmorphism-white-blue',
    name: '3. Glassmorphism White & Blue',
    nameEn: '3. Glassmorphism White & Blue',
    tagline: 'Putih es translusen dengan blur lembut, border tipis halus, dan aksen biru laut sejuk.',
    taglineEn: 'Translucent ice-white surfaces with controlled blur, refined hairline borders, and calm azure accents.',
    badge: 'Modern Glass',
    badgeEn: 'Modern Glass',
    isDark: false,
    palette: {
      bg: '#f0f7ff',
      surface: '#ffffff',
      border: '#bae6fd',
      text: '#0f172a',
      accent: '#0284c7',
    },
  },
  {
    id: 'blue-sea',
    name: '4. Blue Sea',
    nameEn: '4. Blue Sea',
    tagline: 'Samudra biru laut dalam yang tenang, permukaan marine terstruktur, dan aksen seafoam presisi.',
    taglineEn: 'Deep oceanic navy, structured marine surfaces, and precise seafoam accents for deep focus.',
    badge: 'Oceanic',
    badgeEn: 'Oceanic',
    isDark: true,
    palette: {
      bg: '#0b1528',
      surface: '#112239',
      border: '#1e3a5f',
      text: '#f0f9ff',
      accent: '#0ea5e9',
    },
  },
  {
    id: 'green-forest',
    name: '5. Green Forest',
    nameEn: '5. Green Forest',
    tagline: 'Palet hutan pinus dan sage alami dengan kontras organik yang sangat nyaman untuk mata.',
    taglineEn: 'Natural evergreen and sage palette offering restful organic contrast for focused workflows.',
    badge: 'Evergreen',
    badgeEn: 'Evergreen',
    isDark: true,
    palette: {
      bg: '#081c15',
      surface: '#0f2d22',
      border: '#1b4332',
      text: '#f2fbf5',
      accent: '#10b981',
    },
  },
  {
    id: 'pinky-cute',
    name: '6. Pinky Cute',
    nameEn: '6. Pinky Cute',
    tagline: 'Warna pastel stroberi lembut dengan sudut membulat nyaman dan tipografi ramah tanpa kekacauan visual.',
    taglineEn: 'Soft strawberry cream pastel with gentle rounded corners and friendly, readable typography.',
    badge: 'Warm Pastel',
    badgeEn: 'Warm Pastel',
    isDark: false,
    palette: {
      bg: '#fff5f7',
      surface: '#ffffff',
      border: '#fecdd3',
      text: '#4c0519',
      accent: '#f43f5e',
    },
  },
  {
    id: 'white-casual',
    name: '7. White Casual',
    nameEn: '7. White Casual',
    tagline: 'Kanvas putih esensial berpadu border abu-abu netral ala aplikasi produktivitas profesional modern.',
    taglineEn: 'Clean essential white canvas with neutral gray borders for distraction-free clarity.',
    badge: 'Minimal',
    badgeEn: 'Minimal',
    isDark: false,
    palette: {
      bg: '#f8fafc',
      surface: '#ffffff',
      border: '#e2e8f0',
      text: '#0f172a',
      accent: '#2563eb',
    },
  },
  {
    id: 'dark-casual',
    name: '8. Dark Casual',
    nameEn: '8. Dark Casual',
    tagline: 'Slate arang gelap dengan batas input jelas dan kontras lembut untuk sesi koding dan penulisan malam.',
    taglineEn: 'Subdued charcoal slate surfaces with crisp inputs optimized for long coding and writing sessions.',
    badge: 'Comfort Dark',
    badgeEn: 'Comfort Dark',
    isDark: true,
    palette: {
      bg: '#0f172a',
      surface: '#1e293b',
      border: '#334155',
      text: '#f8fafc',
      accent: '#38bdf8',
    },
  },
];

export const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    description: 'Model paling stabil, latensi super rendah, dan bebas batas kuota untuk percakapan, analisis, dan koding cepat.',
    badge: 'Stabil & Cepat',
    capabilities: {
      text: true,
      coding: true,
      vision: true,
      tools: true,
    },
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    description: 'Model cerdas dengan kemampuan reasoning andal untuk pemecahan masalah rumit.',
    badge: 'Penalaran Lanjut',
    capabilities: {
      text: true,
      coding: true,
      vision: true,
      tools: true,
      thinking: true,
    },
  },
];
