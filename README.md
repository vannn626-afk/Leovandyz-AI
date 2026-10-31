# LEOVANDYZ AI — Asisten AI Publik Multifungsi & Cerdas

LEOVANDYZ AI adalah aplikasi web asisten kecerdasan buatan multifungsi yang berorientasi pada privasi pengguna, kemudahan akses instan tanpa login, penyimpanan lokal berbasis IndexedDB, dan integrasi resmi dengan Google Gemini API melalui backend server yang aman.

---

## Fitur Utama

1. **Akses Publik Tanpa Login & Registrasi**:
   - Pengguna dapat langsung membuka website dan menggunakan seluruh fitur AI seketika tanpa formulir akun, email, atau password.
2. **Local-First Storage (IndexedDB)**:
   - Riwayat percakapan, lampiran file, dan galeri gambar disimpan langsung di peramban perangkat pengguna.
   - Mendukung pencarian riwayat, penyematan (pin), ubah judul, hapus satuan, pembersihan total, serta **Ekspor/Impor Cadangan JSON**.
3. **Desain Glassmorphism Premium**:
   - Palet warna dark navy, charcoal, dan aksen neon (Cyan, Indigo, Emerald, Rose).
   - Efek frosted glass halus (`backdrop-blur`), border elegan, typography modern (*Plus Jakarta Sans* & *JetBrains Mono*).
   - Ikon antarmuka strictly menggunakan SVG dari `lucide-react` (bebas dari dekorasi emoji).
   - Sepenuhnya responsif untuk layar smartphone, tablet, laptop, hingga monitor desktop.
4. **5 Mode / Workspace AI Khusus**:
   - **Percakapan AI (AI Chat)**: Streaming teks waktu nyata (SSE), rendering Markdown, syntax-highlighted code blocks, copy, regenerate, stop generation, dan Google Web Search Grounding.
   - **Studio Koding**: Dual panel (editor dan preview live sandboxed HTML/CSS/JS dalam iframe terisolasi), audit bug, refactoring, dan unduh file kode.
   - **Studio Gambar**: Teks-ke-gambar dengan pilihan rasio aspek (1:1, 16:9, 9:16, 4:3, 3:4), pengeditan gambar berbasis instruksi prompt, dan galeri lokal IndexedDB.
   - **Analisis Dokumen**: Unggah berkas PDF, TXT, MD, CSV, JSON, atau kode hingga 10MB dengan aksi cepat: Ringkasan Eksekutif, Poin Kunci, Analisis Data, dan Tanya Jawab.
   - **Studi & Produktivitas**: Koleksi templat pemecah soal bertahap (STEM), rangkuman kuliah, jadwal belajar, dan draf komunikasi bisnis.
5. **Backend & Keamanan**:
   - Server Express proxy terpusat dengan SDK `@google/genai` resmi.
   - Rahasia `GEMINI_API_KEY` tersimpan aman di server-side, tidak pernah bocor ke bundel frontend.
   - Sistem *rate limiting* in-memory per IP untuk mencegah penyalahgunaan publik.
   - Pengalihan otomatis (*fallback*) jika server model mengalami lonjakan antrean.

---

## Persyaratan Lingkungan (Environment Variables)

Salin `.env.example` menjadi `.env`:

```env
# GEMINI_API_KEY: Kunci API Google Gemini (dikonfigurasi via panel Secrets di AI Studio)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# PORT: Port server (default: 3000)
PORT=3000
```

---

## Menjalankan Aplikasi Secara Lokal

1. **Pasang Dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan Mode Pengembangan (Full-Stack Express + Vite)**:
   ```bash
   npm run dev
   ```
   Akses aplikasi di browser melalui `http://localhost:3000`.

3. **Kompilasi & Build Produksi**:
   ```bash
   npm run build
   ```

4. **Jalankan Server Produksi**:
   ```bash
   npm start
   ```

---

## Kebijakan Privasi & Transparansi Data

- **Penyimpanan Lokal**: Semua riwayat chat, draft kode, dan gambar tersimpan di IndexedDB browser lokal Anda. Jika cache browser dihapus, data akan terhapus kecuali Anda mengekspor file cadangan JSON terlebih dahulu.
- **Transmisi API**: Pesan, instruksi, dan berkas yang dikirim diproses melalui server backend ke Google Gemini API secara aman sesuai ketentuan penggunaan Google AI.
