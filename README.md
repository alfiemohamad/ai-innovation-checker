# AI Innovation Checker

AI Innovation Checker adalah platform web modern untuk mengelola, menilai, dan melakukan pengecekan kemiripan (plagiarisme) dokumen inovasi berbasis PDF menggunakan teknologi AI (Google Vertex AI Gemini, LangChain, vektor database, MinIO, dan FastAPI). Sistem ini menyediakan dashboard interaktif, upload PDF, penilaian otomatis, chat AI, analitik, dan fitur chatbot mengambang.

---

## Fitur Utama
- **Upload PDF Inovasi**: User dapat mengunggah dokumen inovasi (PDF) yang akan diekstrak dan dianalisis otomatis.
- **Ekstraksi Otomatis**: Sistem mengekstrak bagian penting (latar belakang, tujuan, deskripsi) dari PDF menggunakan model multimodal.
- **Penyimpanan Aman**: File PDF disimpan di MinIO, metadata di PostgreSQL.
- **Cek Kemiripan (Plagiarisme)**: Menggunakan vektor embedding dan LSA similarity untuk mendeteksi kemiripan antar dokumen.
- **Penilaian Otomatis**: Skoring inovasi berdasarkan komponen yang dapat dikonfigurasi.
- **Chatbot AI**: Chat interaktif dengan AI terkait inovasi, baik per dokumen maupun chatbot mengambang (floating chatbot) di dashboard.
- **Analitik & Ringkasan**: Statistik chat, summary inovasi, dan insight lain.
- **Dashboard Modern**: Frontend React (Vite) dengan sidebar menu, modal detail, PDF preview, toast notifikasi, dan responsif.

---

## Arsitektur
- **Backend**: FastAPI, async, endpoint modular, CORS, logging, MinIO, PostgreSQL, AI (Gemini, LangChain)
- **Frontend**: React (Vite), modular, sidebar menu, floating chatbot, PDF preview, toast, dropdown, responsive CSS
- **Storage**: MinIO (file), PostgreSQL (metadata)

---

## Cara Menjalankan (Local)

### Backend (FastAPI)
1. Pastikan Python 3.10+ terinstall
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Atur file `.env` sesuai kebutuhan (lihat contoh di repo)
4. Jalankan backend:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend (React)
1. Masuk ke folder `app/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan frontend:
   ```bash
   npm run dev
   ```
4. Buka browser ke [http://localhost:5173](http://localhost:5173)

---

## Struktur Folder

- `main.py`            : Entry point FastAPI, hanya untuk inisialisasi dan register router
- `routes/`            : Modular endpoint FastAPI (`innovation.py`, `chat.py`, `user.py`)
- `config/`            : Konfigurasi MinIO, Gemini, PostgreSQL
- `module/`            : Modul AI, vektor, ekstraksi PDF
- `app/`               : Frontend React (Vite)
    - `index.tsx`      : Entry point React
    - `index.css`      : Styling modern dashboard & chatbot
    - `index.html`     : HTML utama
    - `package.json`   : Dependensi frontend
    - `README.md`      : Dokumentasi frontend
- `uploads/`           : Folder upload file (otomatis dibuat)
- `.env`               : Konfigurasi environment

---

## API Endpoint Utama

Endpoint sudah dipisah modular:
- `routes/innovation.py` : Upload, scoring, summary, LSA, daftar inovasi
- `routes/chat.py`       : Chat inovasi, riwayat chat, analitik, pencarian chat
- `routes/user.py`       : Register & login user

Referensi endpoint tetap sama seperti sebelumnya, hanya struktur backend lebih modular dan maintainable.

---

## Konfigurasi Lingkungan (`.env`)
Lihat file `.env` untuk contoh variabel yang diperlukan (MinIO, Gemini, PostgreSQL, skor, dsb).

---

## Catatan
- Semua endpoint backend sudah mendukung CORS dan debug logging.
- Frontend sudah mendukung upload, list, detail, scoring, chat, analytics, floating chatbot, dan notifikasi.
- Untuk pengembangan/production, pastikan variabel `.env` sudah diatur dan MinIO/PostgreSQL sudah berjalan.

---

## Kontributor
- Mohamad Alfie

---

