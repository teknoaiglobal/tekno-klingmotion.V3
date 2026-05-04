# 🧠 Smart API Key System - TEKNO KLING MOTION

## ✅ Sistem Baru yang Lebih Pintar & Akurat

### 🎯 Cara Kerja Baru:

1. **Selalu coba key dari ATAS ke BAWAH** (tidak skip key disabled)
2. **Beri kesempatan 3x error per key** sebelum disable
3. **Track error count per key** dalam satu request
4. **Hanya disable setelah 3x gagal berturut-turut**

---

## 📊 Contoh Skenario

### Daftar API Keys:
```
#1 → FPSXed10... (Disabled) ← Akan tetap dicoba!
#2 → FPSX4f09... (Disabled) ← Akan tetap dicoba!
#3 → FPSX15b7... (Active)
#4 → FPSX78a3... (Active)
```

### Scenario 1: Key #1 Berhasil (Meski Disabled)
```
User generate video
↓
Sistem coba key #1 (disabled)
↓
Request BERHASIL ✅
↓
Video di-generate
↓
Key #1 tetap di posisi atas (tidak dipindah)
```

**Kesimpulan:** Key yang disabled bisa saja masih bagus! Sistem tetap coba.

---

### Scenario 2: Key #1 Error 1x, Key #2 Berhasil
```
User generate video
↓
Attempt #0: Coba key #1
↓
Error 401 ❌ (error count: 1)
↓
Attempt #1: Coba key #2
↓
Request BERHASIL ✅
↓
Video di-generate
↓
Key #1 tetap di posisi atas (belum 3x error)
Key #2 tetap di posisi #2
```

**Kesimpulan:** Key #1 belum di-disable karena baru 1x error.

---

### Scenario 3: Key #1 Error 3x, Baru Disable
```
User generate video
↓
Attempt #0: Coba key #1
↓
Error 401 ❌ (error count: 1)
↓
Attempt #1: Coba key #2
↓
Error 403 ❌ (error count: 1)
↓
Attempt #2: Coba key #3
↓
Error 429 ❌ (error count: 1)
↓
Attempt #3: Coba key #4
↓
Request BERHASIL ✅
↓
Video di-generate
↓
Semua key tetap di posisi (belum ada yang 3x error)
```

**Kesimpulan:** Tidak ada key yang di-disable karena masing-masing baru 1x error.

---

### Scenario 4: Key #1 Error 3x dalam Request Berbeda
```
Request 1:
- Key #1 error → error count: 1

Request 2:
- Key #1 error → error count: 1 (reset per request)

Request 3:
- Key #1 error → error count: 1 (reset per request)
```

**Kesimpulan:** Error count di-reset setiap request baru. Key tidak akan di-disable kecuali 3x error dalam 1 request yang sama.

---

### Scenario 5: Key #1 Error 3x dalam 1 Request
```
User generate video
↓
Attempt #0: Coba key #1
↓
Error 401 ❌ (error count: 1)
↓
Attempt #1: Coba key #1 lagi (wrap around)
↓
Error 401 ❌ (error count: 2)
↓
Attempt #2: Coba key #1 lagi
↓
Error 401 ❌ (error count: 3)
↓
❌ Key #1 DISABLED & dipindah ke bawah
↓
Attempt #3: Coba key #2
↓
Request BERHASIL ✅
↓
Video di-generate

Hasil:
#1 → FPSX4f09... (yang tadinya #2)
#2 → FPSX15b7... (yang tadinya #3)
#3 → FPSX78a3... (yang tadinya #4)
#4 → FPSXed10... (DISABLED, dipindah ke bawah)
```

**Kesimpulan:** Baru setelah 3x error berturut-turut dalam 1 request, key di-disable dan dipindah ke bawah.

---

## 🔄 Alur Lengkap

```
┌─────────────────────────────────────────┐
│ User klik "Generate Motion"             │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Sistem ambil key #1 (paling atas)      │
│ Status: Disabled/Active (tidak peduli) │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Attempt #0: Request dengan key #1      │
└─────────────────────────────────────────┘
                  ↓
         ┌────────┴────────┐
         │                 │
    ✅ Berhasil      ❌ Error
         │                 │
         │                 ↓
         │    ┌─────────────────────────┐
         │    │ Error count key #1 = 1  │
         │    └─────────────────────────┘
         │                 ↓
         │    ┌─────────────────────────┐
         │    │ Attempt #1: Coba key #2 │
         │    └─────────────────────────┘
         │                 ↓
         │         ┌───────┴───────┐
         │         │               │
         │    ✅ Berhasil    ❌ Error
         │         │               │
         │         │               ↓
         │         │    (Lanjut ke key #3, #4, dst)
         │         │               │
         │         │               ↓
         │         │    Jika key #1 error 3x:
         │         │    → Disable & pindah ke bawah
         │         │
         ↓         ↓
┌─────────────────────────────────────────┐
│ Video di-generate                       │
│ User dapat hasil                        │
└─────────────────────────────────────────┘
```

---

## 📝 Perbedaan Sistem Lama vs Baru

| Aspek | Sistem Lama | Sistem Baru |
|-------|-------------|-------------|
| **Skip Disabled Key** | ✅ Ya (skip) | ❌ Tidak (tetap coba) |
| **Error Tolerance** | 0x (langsung disable) | 3x (baru disable) |
| **Error Tracking** | Tidak ada | Ada (per key per request) |
| **Max Retry** | 4x | 10x (coba semua key) |
| **Disable Logic** | 1x error = disable | 3x error = disable |
| **Key Selection** | Hanya active keys | Semua keys (top to bottom) |

---

## 🎮 Cara Menggunakan

### 1. Atur Urutan Key di Admin Panel
```
#1 → Key terbaik (quota terbanyak)
#2 → Key backup pertama
#3 → Key backup kedua
#4 → Key backup ketiga
...
```

**Urutan penting!** Key paling atas akan selalu dicoba pertama.

### 2. Jangan Khawatir dengan Status "Disabled"
- Key disabled **TETAP AKAN DICOBA**
- Sistem tidak skip key disabled
- Key disabled bisa saja masih bagus (quota sudah reset)

### 3. Monitor Log Server
```bash
# Lihat log di terminal server:
[PROXY] Initial attempt using TOP key #1: FPSXed10*** (Status: Disabled)
[PROXY] Retry #1 using key #2: FPSX4f09*** (Status: Active)
[PROXY] ✅ Success with key: FPSX4f09***
```

### 4. Re-enable Key Manual (Opsional)
Jika yakin key sudah bagus lagi:
- Buka admin panel
- Klik tombol **⚡** (power) untuk re-enable
- Key akan aktif kembali

---

## 🔍 Monitoring & Debugging

### Cek Log Server
```
[PROXY] Initial attempt using TOP key #1: FPSXed10*** (Status: Disabled)
[PROXY] Key FPSXed10*** failed (1x). Status: 401
[PROXY] Retry #1 using key #2: FPSX4f09*** (Status: Active)
[PROXY] Key FPSX4f09*** failed (1x). Status: 403
[PROXY] Retry #2 using key #3: FPSX15b7*** (Status: Active)
[PROXY] ✅ Success with key: FPSX15b7***
```

### Cek Key yang Di-disable
```
[PROXY] Key FPSXed10*** failed (3x). Status: 429
[PROXY] ❌ Key DISABLED after 3 failures: FPSXed10*** (moved to bottom)
```

---

## 💡 Tips & Best Practices

### 1. Atur Urutan Berdasarkan Quota
```
#1 → Key unlimited/quota terbanyak
#2 → Key quota 1000/bulan
#3 → Key quota 500/bulan
#4 → Key backup (emergency)
```

### 2. Cek Quota Berkala
- Setiap minggu, cek quota key di Freepik dashboard
- Pindahkan key dengan quota banyak ke atas
- Key dengan quota habis akan otomatis ke bawah

### 3. Re-enable Key yang Sudah Reset
- Jika quota key sudah reset (biasanya bulanan)
- Re-enable key di admin panel
- Pindahkan ke atas dengan tombol ↑

### 4. Jangan Hapus Key Terlalu Cepat
- Key disabled bisa saja masih bagus
- Sistem tetap coba key disabled
- Hapus key hanya jika benar-benar tidak valid

---

## 🛠️ Troubleshooting

### Problem: Semua key disabled
**Solusi:**
1. Sistem tetap akan coba semua key dari atas ke bawah
2. Jika ada key yang masih bagus, akan berhasil
3. Re-enable key yang sudah reset quota

### Problem: Key bagus tapi disabled
**Solusi:**
1. Sistem tetap akan coba key tersebut
2. Jika berhasil, video tetap di-generate
3. Re-enable manual jika ingin status "Active"

### Problem: Ingin reset error count
**Solusi:**
- Error count otomatis reset setiap request baru
- Tidak perlu reset manual

---

## ✅ Kesimpulan

Sistem baru **lebih pintar dan akurat**:

✅ **Tidak skip key disabled** - Semua key dicoba
✅ **Error tolerance 3x** - Tidak langsung vonis mati
✅ **Track error per key** - Tahu key mana yang sering error
✅ **Try all keys** - Maksimal 10 retry (coba semua key)
✅ **Smart disable** - Hanya disable setelah 3x error berturut-turut
✅ **Transparent logging** - Jelas key mana yang digunakan

**Tidak perlu khawatir key disabled!** Sistem tetap coba semua key dari atas ke bawah.

---

**Server running: http://localhost:3000**
