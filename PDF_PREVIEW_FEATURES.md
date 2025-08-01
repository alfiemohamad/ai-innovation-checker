# PDF Preview Features

## Fitur yang Ditambahkan

### 1. PDF Preview dari Link MinIO
- **Masalah**: Link MinIO secara default akan mendownload file, bukan menampilkan preview
- **Solusi**: File PDF di-download sebagai blob dan ditampilkan dalam iframe menggunakan blob URL
- **Lokasi**: Komponen `PDFPreview` di `index.tsx` dan `GetScoreMenu.tsx`

### 2. Automatic File Cleanup
- **Fitur**: File yang didownload untuk preview otomatis dibersihkan saat logout atau aplikasi ditutup
- **Implementasi**: 
  - Tracking blob URLs dalam `downloadedFiles` Set dan `downloadedFileBlobs` Map
  - Function `cleanupDownloadedFiles()` memanggil `URL.revokeObjectURL()` untuk setiap blob
  - Cleanup dipanggil pada logout, window beforeunload, dan component unmount

### 3. Optimasi Performa
- **File Size Limit**: Membatasi download maksimum 50MB untuk preview
- **File Type Check**: Memverifikasi file adalah PDF sebelum membuat preview
- **Caching**: Blob URL disimpan untuk menghindari download ulang file yang sama
- **Error Handling**: Menampilkan pesan error yang informatif jika preview gagal

### 4. UI Improvements
- **Loading State**: Spinner dan pesan loading saat file didownload
- **Error State**: Pesan error yang jelas dengan icon warning
- **Collapsible Previews**: Menggunakan `<details>` element untuk plagiarism check documents
- **Logout Button**: Tombol logout merah di sidebar dengan cleanup otomatis

## Perubahan Komponen

### 1. `index.tsx`
- Tambah fungsi `createPreviewUrl()`, `cleanupDownloadedFiles()`
- Komponen `PDFPreview` untuk preview PDF dengan blob URL
- Update `DetailModal` menggunakan `PDFPreview`
- Tambah `handleLogout()` dengan cleanup
- Tambah event listener untuk `beforeunload`

### 2. `GetScoreMenu.tsx`
- Komponen `PDFPreview` lokal dengan optimasi yang sama
- Update rendering untuk menggunakan collapsible preview
- Tambah file size dan type validation

### 3. `SidebarMenu.tsx`
- Tambah prop `onLogout` dan tombol logout
- Styling khusus untuk tombol logout (warna merah)

### 4. `index.css`
- Styling untuk loading dan error states PDF preview
- Styling untuk `<details>` element (collapsible sections)
- Styling untuk tombol logout di sidebar
- Animation untuk notifikasi (siap digunakan)

## Cara Kerja

1. **Preview PDF**:
   ```typescript
   const blobUrl = await createPreviewUrl(minioUrl);
   // File didownload dan dibuat blob URL
   // Ditampilkan dalam iframe
   ```

2. **Cleanup saat Logout**:
   ```typescript
   const handleLogout = () => {
     cleanupDownloadedFiles(); // Bersihkan semua blob URLs
     setUser(null); // Reset state
   };
   ```

3. **Tracking Files**:
   ```typescript
   const downloadedFiles = new Set<string>(); // Blob URLs
   const downloadedFileBlobs = new Map<string, string>(); // MinIO URL -> Blob URL
   ```

## Testing

1. Login ke aplikasi
2. Buka GetScore menu, pilih innovation dengan PDF
3. Lihat preview PDF muncul tanpa download
4. Klik plagiarism check documents untuk melihat collapsible preview
5. Logout dan check console - should show cleanup message
6. Files di browser memory sudah dibersihkan

## Benefits

- ✅ **UX Lebih Baik**: Preview langsung tanpa download
- ✅ **Memory Management**: Otomatis cleanup mencegah memory leak  
- ✅ **Performance**: Caching mencegah download berulang
- ✅ **Error Handling**: User mendapat feedback jelas jika ada masalah
- ✅ **Security**: File size limit mencegah abuse
