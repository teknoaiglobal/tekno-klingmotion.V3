# Fitur Bulk Status API Keys

## Deskripsi
Fitur untuk mengubah status multiple API keys sekaligus (bulk action) di Admin Panel.

## Fitur yang Ditambahkan

### 1. Checkbox Selection
- ✅ Checkbox di setiap baris API key untuk memilih key yang ingin diubah
- ✅ Checkbox "Select All" di header tabel untuk memilih semua key sekaligus
- ✅ Indeterminate state untuk checkbox "Select All" ketika sebagian key dipilih

### 2. Bulk Actions Bar
Muncul otomatis ketika ada key yang dipilih, berisi:
- **Counter**: Menampilkan jumlah key yang dipilih (contoh: "3 dipilih")
- **Tombol Aktifkan Terpilih**: Mengaktifkan semua key yang dipilih (hijau)
- **Tombol Matikan Terpilih**: Menonaktifkan semua key yang dipilih (merah)
- **Tombol Batal**: Membatalkan seleksi dan menyembunyikan bulk actions bar

### 3. API Endpoint Baru
**Endpoint**: `POST /api/admin/apikeys/bulk`

**Request Body**:
```json
{
  "ids": ["key-id-1", "key-id-2", "key-id-3"],
  "is_active": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "3 API key(s) updated",
  "updatedCount": 3
}
```

## Cara Penggunaan

### Mengaktifkan Multiple Keys:
1. Buka Admin Panel (http://localhost:3000/admin.html)
2. Scroll ke bagian "Daftar Token Server Admin (Rotasi)"
3. Centang checkbox pada key yang ingin diaktifkan
4. Klik tombol **"Aktifkan Terpilih"** (hijau)
5. Semua key yang dipilih akan berubah status menjadi "Active"

### Menonaktifkan Multiple Keys:
1. Centang checkbox pada key yang ingin dimatikan
2. Klik tombol **"Matikan Terpilih"** (merah)
3. Semua key yang dipilih akan berubah status menjadi "Mati / Limit"

### Select All:
1. Klik checkbox di header tabel (kolom paling kiri)
2. Semua key akan terpilih sekaligus
3. Klik lagi untuk unselect all

### Membatalkan Seleksi:
1. Klik tombol **"Batal"** di bulk actions bar
2. Atau uncheck semua checkbox secara manual

## File yang Dimodifikasi

1. **admin.html**
   - Tambah checkbox column di tabel API keys
   - Tambah bulk actions bar dengan tombol-tombol
   - Tambah fungsi JavaScript untuk bulk operations

2. **api/admin/apikeys/bulk.js** (NEW)
   - Endpoint baru untuk bulk update status API keys
   - Menerima array of IDs dan boolean is_active
   - Update multiple keys dalam satu request

## Keuntungan

✅ **Efisien**: Ubah status banyak key sekaligus tanpa klik satu-satu  
✅ **User-Friendly**: Interface yang jelas dengan visual feedback  
✅ **Flexible**: Bisa pilih key tertentu atau semua key sekaligus  
✅ **Safe**: Konfirmasi visual sebelum action dengan counter  

## Screenshot Fitur

```
┌─────────────────────────────────────────────────────────────┐
│ 3 dipilih  [✓ Aktifkan Terpilih] [✗ Matikan Terpilih] [Batal] │
└─────────────────────────────────────────────────────────────┘

┌───┬──────────────────┬───────┬────────────┬─────────┐
│ ☑ │ API Key          │ Usage │ Status     │ Action  │
├───┼──────────────────┼───────┼────────────┼─────────┤
│ ☑ │ #1 FPSX***       │ 15    │ Active     │ [Save]  │
│ ☑ │ #2 FPSX***       │ 8     │ Mati/Limit │ [Save]  │
│ ☐ │ #3 FPSX***       │ 3     │ Active     │ [Save]  │
└───┴──────────────────┴───────┴────────────┴─────────┘
```

## Testing

1. Login ke admin panel
2. Pilih beberapa API keys dengan checkbox
3. Klik "Aktifkan Terpilih" atau "Matikan Terpilih"
4. Verifikasi status berubah sesuai action
5. Cek di Firebase bahwa perubahan tersimpan

## Kompatibilitas

✅ Bekerja dengan sistem smart API key rotation yang sudah ada  
✅ Tidak mengubah logika prioritas (urutan dari atas ke bawah)  
✅ Tetap support fitur reorder manual (tombol ↑↓)  
✅ Tetap support toggle individual per key  
