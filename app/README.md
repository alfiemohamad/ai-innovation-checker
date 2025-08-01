# AI Innovation Checker Frontend (React)

Ini adalah frontend modern untuk platform AI Innovation Checker. Dibangun dengan React (Vite), aplikasi ini menyediakan dashboard interaktif, upload PDF inovasi, penilaian otomatis, chat AI, analitik, dan chatbot mengambang (floating chatbot).

---

![Coverage Badge](https://img.shields.io/badge/coverage-%3E75%25-brightgreen)

## Fitur Utama
- **Login User (Inovator)**
- **Upload PDF Inovasi**
- **List & Detail Inovasi** (dengan preview PDF, skor, similarity, summary, chat, analytics)
- **Get Score** (tanpa upload ulang, pilih inovasi dari dropdown)
- **Chat Search & Analytics** (berbasis inovasi)
- **Floating Chatbot** (bisa maximize/minimize, pilih inovasi, chat dengan AI)
- **Notifikasi Toast** untuk feedback
- **Sidebar Menu** (dengan ikon, collapse, highlight)
- **Responsive & Modern CSS**

---

## Cara Menjalankan

1. Pastikan sudah berada di folder `app/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan frontend:
   ```bash
   npm run dev
   ```
4. Buka browser ke [http://localhost:5173](http://localhost:5173)

> Pastikan backend FastAPI sudah berjalan di `http://localhost:8000` (lihat README utama).

---

## Menjalankan Tes & Coverage

Jalankan semua test dan lihat coverage:
```bash
npm run test -- --coverage
```

Target coverage minimal: **75%**

Tips agar coverage tinggi:
- Pastikan semua komponen utama (Login, Register, Sidebar, Upload, List, Get Score, Chatbot) punya test render dan interaksi.
- Uji error handling (misal: login gagal, upload gagal, API error).
- Uji state perubahan (misal: sidebar collapse, modal buka/tutup, form submit, loading state).
- Uji tampilan hasil (misal: hasil skor, plagiarism, chat, analytics, dsb).

---

## Struktur File

- `index.tsx`   : Entry point React, semua komponen utama (dashboard, sidebar, modal, chatbot)
- `index.css`   : Styling modern dashboard, sidebar, modal, chatbot, responsive
- `index.html`  : HTML utama
- `package.json`: Dependensi frontend
- `tsconfig.json`: Konfigurasi TypeScript
- `vite.config.ts`: Konfigurasi Vite
- `App.test.tsx`: Test utama frontend (wajib coverage > 75%)

---

## Fitur UI
- **Sidebar Menu**: Navigasi utama (Upload, My Innovations, Get Score, Chat Search, Analytics)
- **Upload**: Form upload PDF inovasi
- **My Innovations**: List inovasi user, detail modal (tab: score, similarity, summary, chat, analytics, chat summary)
- **Get Score**: Pilih inovasi, dapatkan skor otomatis
- **Chat Search**: Cari chat berdasarkan inovasi
- **Analytics**: Statistik chat per inovasi
- **Floating Chatbot**: Tombol mengambang, bisa maximize/minimize, chat dengan AI terkait inovasi
- **Toast Notification**: Feedback sukses/gagal
- **Responsive**: Tampilan tetap nyaman di desktop & mobile

---

## Konfigurasi
- Endpoint backend diatur di `API_BASE_URL` pada `index.tsx` (default: `http://localhost:8000`)
- Tidak perlu mengatur .env khusus di frontend

---

## Catatan
- Semua fitur utama backend sudah terintegrasi di frontend
- Jika ingin menambah fitur, cukup tambahkan komponen baru di `index.tsx` dan styling di `index.css`
- Untuk pengembangan, gunakan mode dev (`npm run dev`)
- Untuk coverage maksimal, tambahkan test pada semua komponen dan skenario error/sukses.

---

## Kontributor
- Mohamad Alfie

---

Lisensi: MIT
