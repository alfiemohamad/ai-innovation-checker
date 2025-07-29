# AI Innovation Checker

Sistem ini adalah platform untuk mengelola, menilai, dan melakukan pengecekan kemiripan (plagiarisme) dokumen inovasi berbasis PDF menggunakan teknologi AI (Google Vertex AI Gemini, LangChain, dan vektor database).

## Deskripsi Singkat
- **Upload dokumen inovasi** (PDF) oleh user/inovator.
- **Ekstraksi otomatis** bagian penting (latar belakang, tujuan, deskripsi) dari PDF menggunakan model multimodal.
- **Penyimpanan** dokumen di MinIO dan metadata di PostgreSQL.
- **Indexing vektor** untuk pencarian kemiripan (plagiarisme) berbasis embedding.
- **Penilaian otomatis** inovasi berdasarkan komponen penilaian yang dapat dikonfigurasi.
- **Fitur chat dan analitik** untuk diskusi dan insight inovasi.

## Alur Proses
1. **User login** (menggunakan header `X-Inovator`).
2. **Upload dokumen inovasi** melalui endpoint `/innovations/`.
3. Sistem akan:
   - Menyimpan file PDF ke MinIO.
   - Mengekstrak bagian penting dari PDF.
   - Menyimpan metadata ke database.
   - Membuat embedding vektor dan mengindeksnya.
   - Melakukan similarity search (plagiarisme) terhadap dokumen lain.
4. **Penilaian inovasi** dapat dilakukan melalui endpoint `/get_score` tanpa upload ulang file (file diambil dari MinIO).
5. **Fitur lanjutan**: chat, summary, analytics, dsb.

## API Kontrak

### 1. Upload Inovasi
**POST** `/innovations/`

#### Request
- Form Data:
  - `judul_inovasi`: string (required)
  - `file`: PDF file (required)
  - `table_name`: string (optional, default: "innovations")
- Header:
  - `X-Inovator`: string (required, nama user/inovator)

#### Response
```json
{
  "status": "success",
  "table": "innovations",
  "extracted_sections": {
    "latar_belakang": "✓/✗",
    "tujuan_inovasi": "✓/✗",
    "deskripsi_inovasi": "✓/✗"
  },
  "lsa_similarity_results": [
    {
      "lsa_similarity": 0.85,
      "link_document": "https://..."
    },
    ...
  ],
  "innovation_id": "judul_inovasi_nama_inovator"
}
```

### 2. Penilaian Inovasi
**POST** `/get_score`

#### Request
- Form Data:
  - `id`: string (required, id inovasi hasil upload)
  - `table_name`: string (optional, default: "innovations")
- Header:
  - `X-Inovator`: string (required)

#### Response
```json
{
  "substansi_orisinalitas": 12,
  "substansi_urgensi": 8,
  "substansi_kedalaman": 13,
  "analisis_dampak": 14,
  "analisis_kelayakan": 9,
  "analisis_data": 8,
  "sistematika_struktur": 9,
  "sistematika_bahasa": 8,
  "sistematika_referensi": 4,
  "total": 85
}
```
### 3. LSA Similarity Results
**GET** `/innovations/{innovation_id}/lsa_results`
- Mendapatkan hasil similarity LSA untuk inovasi tertentu.

### 4. Ringkasan AI Inovasi
**GET** `/innovations/{innovation_id}/summary`
- Mendapatkan ringkasan AI untuk inovasi tertentu.

### 5. Chat Tentang Inovasi
**POST** `/innovations/{innovation_id}/chat`
- Form Data: `question` (string, required)
- Header: `X-Inovator`
- Response: `{ "answer": "..." }`

### 6. Riwayat Chat Inovasi
**GET** `/innovations/{innovation_id}/chat_history`
- Query: `limit` (int, default 50)
- Header: `X-Inovator`
- Response: daftar chat

### 7. Ringkasan Chat User
**GET** `/users/{user_name}/chat_summary`
- Header: `X-Inovator`
- Response: ringkasan chat user

### 8. Cari Chat
**POST** `/chat/search`
- Form Data: `search_query` (string, required), `innovation_id` (optional)
- Header: `X-Inovator`
- Response: hasil pencarian chat

### 9. Hapus Riwayat Chat Inovasi
**DELETE** `/innovations/{innovation_id}/chat_history`
- Header: `X-Inovator`
- Response: status

### 10. Analitik Chat Inovasi
**GET** `/innovations/{innovation_id}/chat_analytics`
- Header: `X-Inovator`
- Response: analitik chat

---

## Komponen Penilaian (dari .env)
- Substansi & Gagasan Inovasi (Orisinalitas, Urgensi, Kedalaman)
- Analisis, Potensi, & Kelayakan (Dampak, Kelayakan, Data)
- Sistematika & Kualitas Penulisan (Struktur, Bahasa, Referensi)

## Teknologi
- FastAPI, PostgreSQL, MinIO, LangChain, Google Vertex AI Gemini, pgvector, scikit-learn

---

**Catatan:**
- File PDF tidak perlu diupload ulang untuk penilaian, cukup gunakan id inovasi.
- Penilaian dan similarity search dilakukan otomatis setelah upload.
- Endpoint chat, summary, analytics, dsb. tersedia untuk fitur lanjutan.
