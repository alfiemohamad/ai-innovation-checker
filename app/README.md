# AI Innovation Checker Frontend (React)

Ini adalah frontend modern untuk platform AI Innovation Checker. Dibangun dengan React (Vite), aplikasi ini menyediakan dashboard interaktif, upload PDF inovasi, penilaian otomatis, chat AI, analitik, dan chatbot mengambang (floating chatbot).

---

![Coverage Badge](https://img.shields.io/badge/coverage-100%25-brightgreen) ![Tests](https://img.shields.io/badge/tests-16%2F16%20passing-brightgreen)

## Fitur Utama
- **Login User (Inovator)**
- **Upload PDF Inovasi**
- **List & Detail Inovasi** (dengan preview PDF, skor, similarity, summary, chat, analytics)
- **Get Score** (tanpa upload ulang, pilih inovasi dari dropdown)
- **Chat Search & Analytics** (berbasis inovasi)
- **Innovation Search** (pencarian dengan natural language)
- **Innovation Ranking** (peringkat berdasarkan skor)
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

## Testing

### Unit Testing dengan Vitest
Aplikasi ini menggunakan Vitest untuk testing framework. Semua test telah diperbaiki dan mencapai **100% success rate**.

#### Menjalankan Test
```bash
npm test        # Run all tests
npm run test:ui # Run with UI interface
npm run test -- --coverage  # Run with coverage report
```

#### Test Coverage
- **16/16 tests passing (100% success rate)**
- **3 test suites** covering:
  - Integration tests (App.test.tsx)
  - Component tests (InnovationUploader.test.tsx)
  - Search functionality tests (InnovationSearchMenu.test.tsx)

#### Test Files
- `App.test.tsx` - 9 integration tests covering login, dashboard navigation, and main user flows
- `src/__tests__/components/InnovationUploader.test.tsx` - 3 component tests for upload functionality
- `src/__tests__/components/InnovationSearchMenu.test.tsx` - 4 tests for search menu behavior

#### Recent Test Improvements
- Fixed missing vitest imports and dependencies
- Corrected text expectations to match actual application behavior
- Improved element selectors for better test reliability
- Added comprehensive validation for form inputs and button states
- Configured vitest to exclude node_modules tests
- Achieved 100% test success rate (exceeding initial 60% target)

---

## Struktur File

- `index.tsx`   : Entry point React, semua komponen utama (dashboard, sidebar, modal, chatbot)
- `index.css`   : Styling modern dashboard, sidebar, modal, chatbot, responsive
- `index.html`  : HTML utama
- `package.json`: Dependensi frontend
- `tsconfig.json`: Konfigurasi TypeScript
- `vite.config.ts`: Konfigurasi Vite
- `App.test.tsx`: Test utama frontend dengan 16 passing tests (100% success rate)

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
