# 🎬 TEKNO KLING MOTION - Panduan Lengkap

## ✅ Server Sudah Berjalan!

**URL Lokal:** http://localhost:3000

---

## 📂 Struktur Project

```
├── api/
│   ├── admin/          # Admin endpoints (users, vouchers, apikeys, settings)
│   ├── db.js           # Firebase database handler
│   ├── login.js        # Voucher login system
│   ├── proxy.js        # Freepik API proxy + credit system
│   └── user.js         # User data endpoint
├── index.html          # Main app (AI video generation)
├── admin.html          # Admin panel (full control)
├── mitra.html          # Mitra dashboard (partner management)
├── server.js           # Express server
└── package.json        # Dependencies
```

---

## 🔑 Akses Panel

### 1. **Aplikasi Utama**
- URL: http://localhost:3000/index.html
- Login: Gunakan kode voucher (default: tidak ada user, buat dulu di admin)

### 2. **Admin Panel**
- URL: http://localhost:3000/admin.html
- Password: `Tekno@Project03`
- Fitur:
  - Kelola semua users & vouchers
  - Manage API keys Freepik (rotasi otomatis)
  - Atur pesan popup & WhatsApp link
  - Cloudinary config (upload media)

### 3. **Mitra Dashboard**
- URL: http://localhost:3000/mitra.html
- Password: `mitra`
- Fitur:
  - Buat member baru
  - Generate voucher code
  - Atur pesan kustom per member

---

## 🎯 Cara Menggunakan

### Step 1: Buat User/Voucher
1. Buka **Admin Panel** (http://localhost:3000/admin.html)
2. Login dengan password `Tekno@Project03`
3. Klik **"Add Member"**
4. Isi data:
   - **Name**: Nama custom
   - **Voucher Code**: Klik tombol ⚡ untuk auto-generate (contoh: `TEKNO-A3B5C7`)
   - **Plan**: Free/Pro/VIP
   - **Hari**: Durasi langganan (misal: 30)
   - **Credits**: Jumlah kredit (misal: 100)
5. Klik **💾 Save**

### Step 2: Login ke Aplikasi
1. Buka **Main App** (http://localhost:3000/index.html)
2. Masukkan **Voucher Code** yang sudah dibuat
3. Klik **Login**

### Step 3: Generate Video AI
1. Upload **Image** (wajib) atau **Video** (opsional)
2. Pilih **AI Model**:
   - **Kling 3 Pro** (VIP only)
   - **Kling 3 Standard** (VIP only)
   - **Kling 2.6 Pro** (Pro/VIP)
   - **Kling 2.6 Standard** (Free/Pro/VIP)
3. Atur **CFG Scale** & **Motion Prompt** (opsional)
4. Klik **⚡ Generate Motion**
5. Tunggu proses (polling otomatis)
6. Download hasil video

---

## 🔧 Konfigurasi Penting

### 1. Firebase Database
File: `api/db.js`
```javascript
const FIREBASE_URL = 'https://tekno-335f8-default-rtdb.asia-southeast1.firebasedatabase.app/db.json';
```
- Data disimpan di Firebase Realtime Database
- Auto-sync setiap kali ada perubahan

### 2. Freepik API Keys
- Dikelola di **Admin Panel** → Bagian "Daftar Token Server Admin"
- Sistem **rotasi otomatis**: jika 1 key limit/mati, auto-switch ke key lain
- Key yang mati otomatis di-disable

### 3. Cloudinary (Upload Media)
- Config di **Admin Panel** → Klik "Settings" → "Cloudinary Admin"
- Atau langsung: http://localhost:3000/admin.html
- Isi: Cloud Name, API Key, API Secret

---

## 💳 Sistem Kredit & Plan

| Plan | Model Akses | Kredit per Generate |
|------|-------------|---------------------|
| **Free** | Kling 2.6 Standard only | 1 kredit |
| **Pro** | Kling 2.6 Pro/Std | 1 kredit |
| **VIP** | Semua model (termasuk Kling 3) | 1 kredit |

**Refund Otomatis:**
- Jika task FAILED/CANCELED → kredit dikembalikan
- Jika API error → kredit dikembalikan

---

## 🛠️ API Endpoints

### Public
- `POST /api/login` - Login dengan voucher
- `GET /api/user?id={userId}` - Get user data
- `ALL /proxy.php` - Proxy ke Freepik API

### Admin (Protected)
- `GET /api/admin/users` - List semua users
- `POST /api/admin/users` - Buat user baru
- `PUT /api/admin/users` - Update user
- `DELETE /api/admin/users` - Hapus user
- `GET /api/admin/apikeys` - List API keys
- `POST /api/admin/apikeys` - Tambah key
- `PUT /api/admin/apikeys` - Update/toggle key
- `DELETE /api/admin/apikeys` - Hapus key
- `GET /api/admin/settings` - Get settings
- `POST /api/admin/settings` - Update settings

---

## 🚨 Troubleshooting

### 1. "User ID is required to use server quota"
**Solusi:** Login dulu dengan voucher code

### 2. "Insufficient credits"
**Solusi:** Top up kredit di Admin Panel

### 3. "Free plan can only use Kling 2.6 Standard"
**Solusi:** Upgrade plan ke Pro/VIP di Admin Panel

### 4. "All server tokens have been exhausted"
**Solusi:** 
- Tambah API key baru di Admin Panel
- Atau aktifkan kembali key yang di-disable

### 5. Video tidak muncul setelah generate
**Solusi:**
- Cek console browser (F12)
- Pastikan API key Freepik valid
- Cek status task di Firebase

---

## 📱 Fitur Mitra (Partner System)

Mitra dapat:
1. Buat member sendiri
2. Generate voucher code unik
3. Atur **pesan popup kustom** per member
4. Atur **WhatsApp link kustom** untuk topup

**Cara Kerja:**
- Jika member kehabisan kredit → muncul popup dengan pesan & link WA dari Mitra
- Jika tidak diset → pakai pesan & link default dari Admin

---

## 🔐 Default Credentials

| Panel | Password |
|-------|----------|
| Admin | `Tekno@Project03` |
| Mitra | `mitra` |

**⚠️ PENTING:** Ganti password di production!

---

## 📊 Monitoring

### Cek Database Firebase
URL: https://console.firebase.google.com/project/tekno-335f8/database

### Cek API Key Usage
Admin Panel → Bagian "Daftar Token Server Admin" → Lihat kolom "Usage"

---

## 🎨 Customization

### Ganti Logo
Edit `index.html` line ~150:
```html
<img src="URL_LOGO_BARU" alt="Logo">
```

### Ganti Warna Theme
Edit CSS variables di `index.html` (line ~10):
```css
:root {
    --accent: #3b82f6; /* Warna utama */
    --success: #10b981;
    --danger: #ef4444;
}
```

---

## 📞 Support

Jika ada masalah, cek:
1. Console browser (F12)
2. Terminal server (lihat error log)
3. Firebase database (pastikan data tersimpan)

---

**🎉 Selamat mencoba! Server sudah siap di http://localhost:3000**
