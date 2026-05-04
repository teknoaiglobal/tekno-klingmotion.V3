# 🔄 Sistem Rotasi API Key - TEKNO KLING MOTION

## ✅ Sistem Baru yang Sudah Diimplementasikan

### 🎯 Cara Kerja:

1. **Selalu gunakan API key paling atas (#1)** yang aktif
2. **Jika key error/limit** → Auto-disable & pindah ke bawah
3. **Retry otomatis** dengan key berikutnya (#2, #3, dst)
4. **Manual reorder** dengan tombol ↑ ↓ di admin panel

---

## 📊 Prioritas API Key

```
┌─────────────────────────────────────┐
│ #1 → PRIORITY TERTINGGI (digunakan) │ ← Selalu digunakan pertama kali
├─────────────────────────────────────┤
│ #2 → Backup pertama                 │ ← Digunakan jika #1 error
├─────────────────────────────────────┤
│ #3 → Backup kedua                   │ ← Digunakan jika #1 & #2 error
├─────────────────────────────────────┤
│ #4 → Backup ketiga                  │
└─────────────────────────────────────┘
```

**Urutan penting!** Key paling atas = prioritas tertinggi.

---

## 🔄 Alur Rotasi Otomatis

### Scenario 1: Key #1 Berhasil
```
1. User generate video
2. Sistem pakai key #1 (paling atas)
3. Request berhasil ✅
4. Video di-generate
5. Key #1 tetap di posisi atas
```

### Scenario 2: Key #1 Error/Limit
```
1. User generate video
2. Sistem pakai key #1 (paling atas)
3. Request error (401/403/429) ❌
4. Sistem auto-disable key #1
5. Key #1 dipindah ke bawah list
6. Retry dengan key #2 (yang sekarang jadi #1)
7. Request berhasil ✅
8. Video di-generate

Hasil:
┌─────────────────────────────────────┐
│ #1 → Key yang tadinya #2 (AKTIF)   │ ← Sekarang jadi prioritas tertinggi
├─────────────────────────────────────┤
│ #2 → Key yang tadinya #3            │
├─────────────────────────────────────┤
│ #3 → Key yang tadinya #1 (MATI)    │ ← Dipindah ke bawah & disabled
└─────────────────────────────────────┘
```

### Scenario 3: Semua Key Error
```
1. User generate video
2. Sistem pakai key #1 → Error ❌
3. Auto-disable & pindah ke bawah
4. Retry dengan key #2 → Error ❌
5. Auto-disable & pindah ke bawah
6. Retry dengan key #3 → Error ❌
7. Auto-disable & pindah ke bawah
8. Retry dengan key #4 → Error ❌
9. Return error: "All server tokens exhausted"
10. User dapat refund kredit otomatis
```

---

## 🎮 Cara Mengatur Urutan di Admin Panel

### 1. Lihat Urutan Saat Ini
- Buka: http://localhost:3000/admin.html
- Scroll ke "Daftar Token Server Admin (Rotasi)"
- Lihat nomor urut: **#1, #2, #3, #4**
- **#1 = Prioritas tertinggi** (selalu digunakan pertama)

### 2. Pindah Key ke Atas (Prioritas Lebih Tinggi)
- Klik tombol **↑** (arrow up)
- Key akan swap dengan key di atasnya
- Contoh: Key #3 → Klik ↑ → Jadi #2

### 3. Pindah Key ke Bawah (Prioritas Lebih Rendah)
- Klik tombol **↓** (arrow down)
- Key akan swap dengan key di bawahnya
- Contoh: Key #2 → Klik ↓ → Jadi #3

### 4. Strategi Pengaturan
```
Rekomendasi urutan:
#1 → Key dengan quota terbanyak
#2 → Key dengan quota menengah
#3 → Key dengan quota sedikit
#4 → Key backup (emergency)
```

---

## 🔍 Monitoring & Debugging

### Cek Log Server
```bash
# Di terminal server, lihat log:
[PROXY] Using TOP key: FPSX1448*** (ID: 1777777290974)
[PROXY] Auto-disabled & moved to bottom: FPSX1448*** (was at index 0)
[PROXY] Retry #1 using key index 1: FPSX15b7***
```

### Cek Status Key di Admin Panel
- **Hijau "Active"** = Key masih bisa digunakan
- **Merah "Mati / Limit"** = Key sudah disabled
- **Usage Count** = Berapa kali key sudah digunakan

### Cek Key Mana yang Digunakan
- Setiap request, server return header: `X-Used-Key-Hint`
- Buka DevTools (F12) → Network tab
- Lihat response header
- Contoh: `X-Used-Key-Hint: FPSX1448***`

---

## 🛠️ Troubleshooting

### Problem: Semua key mati
**Solusi:**
1. Buka admin panel
2. Klik tombol **⚡** (power) untuk re-enable key
3. Key akan aktif kembali
4. Atau tambah key baru dengan tombol "Add Key"

### Problem: Key bagus ada di bawah
**Solusi:**
1. Klik tombol **↑** berkali-kali
2. Pindahkan key bagus ke posisi #1
3. Key akan digunakan pertama kali

### Problem: Key terus di-disable otomatis
**Solusi:**
1. Cek quota key di Freepik dashboard
2. Key mungkin memang sudah limit
3. Ganti dengan key baru
4. Atau tunggu reset quota (biasanya bulanan)

### Problem: Ingin test key manual
**Solusi:**
```bash
# Test key manual dengan curl:
curl -X POST https://api.freepik.com/v1/ai/video \
  -H "x-freepik-api-key: YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","model":"kling-v2-6-motion-control-std"}'
```

---

## 📝 Best Practices

### 1. Atur Urutan Berdasarkan Quota
```
#1 → Key dengan quota unlimited/terbanyak
#2 → Key dengan quota 1000/bulan
#3 → Key dengan quota 500/bulan
#4 → Key backup (emergency only)
```

### 2. Monitor Usage Count
- Cek kolom "Usage" di admin panel
- Jika usage tinggi → key sering digunakan
- Jika usage 0 → key belum pernah digunakan atau selalu error

### 3. Rotasi Manual Berkala
- Setiap minggu, cek status semua key
- Pindahkan key yang masih bagus ke atas
- Disable key yang sudah limit
- Tambah key baru jika perlu

### 4. Backup Key
- Selalu punya minimal 3-4 key aktif
- Jangan hanya pakai 1 key
- Jika 1 key limit, masih ada backup

---

## 🔧 Konfigurasi Lanjutan

### Ubah Max Retry
Edit `api/proxy.js` line ~115:
```javascript
let maxRetries = useServerQuota ? 4 : 1;
// Ganti 4 menjadi jumlah retry yang diinginkan
```

### Ubah Deteksi Error
Edit `api/proxy.js` line ~140:
```javascript
if ([401, 403, 429].includes(response.status)) isDeadKey = true;
// Tambah status code lain jika perlu
```

### Disable Auto-Move ke Bawah
Edit `api/proxy.js` line ~150:
```javascript
// Comment out bagian ini jika tidak ingin auto-move:
// db.apiKeys.splice(badKeyIndex, 1);
// db.apiKeys.push(badKey);
```

---

## 📊 Statistik & Analytics

### Lihat Key Paling Sering Digunakan
- Buka admin panel
- Lihat kolom "Usage"
- Key dengan usage tertinggi = paling sering digunakan

### Lihat Key yang Sering Error
- Cek log server
- Cari: `Auto-disabled & moved to bottom`
- Key yang sering muncul = sering error

### Estimasi Quota Remaining
```
Jika usage_count = 50
Dan quota = 1000/bulan
Maka remaining = 1000 - 50 = 950
```

---

## ✅ Checklist

- [x] Sistem selalu gunakan key paling atas
- [x] Auto-disable key jika error/limit
- [x] Auto-move key ke bawah jika disabled
- [x] Retry otomatis dengan key berikutnya
- [x] Manual reorder dengan tombol ↑ ↓
- [x] Logging untuk debugging
- [x] Refund kredit jika semua key gagal

---

## 🎉 Kesimpulan

Sistem rotasi API key sekarang **lebih pintar dan otomatis**:

✅ **Prioritas jelas** - Key paling atas selalu digunakan pertama
✅ **Auto-failover** - Jika key error, otomatis pakai key berikutnya
✅ **Auto-disable** - Key yang error otomatis di-disable
✅ **Auto-reorder** - Key yang error dipindah ke bawah
✅ **Manual control** - Admin bisa atur urutan dengan tombol ↑ ↓
✅ **Transparent** - Log jelas, bisa track key mana yang digunakan

**Tidak perlu lagi manual switch key!** Sistem handle semuanya otomatis.

---

**Server running: http://localhost:3000**
