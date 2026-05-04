# 🔒 Dokumentasi Keamanan - TEKNO KLING MOTION

## ✅ Fitur Keamanan yang Sudah Diimplementasikan

### 1. **Password Hashing (SHA-256)**
- Password **TIDAK** disimpan di HTML/JavaScript client-side
- Password di-hash menggunakan SHA-256 sebelum dikirim ke server
- Hash disimpan di server-side (`api/auth.js`)
- Tidak bisa di-reverse engineer dari inspect element

### 2. **Token-Based Authentication**
- Setelah login, server generate random token (32 bytes)
- Token disimpan di localStorage client
- Setiap request ke API admin/mitra harus include token di header `x-auth-token`
- Token expire otomatis setelah 24 jam

### 3. **Protected API Endpoints**
- Semua endpoint `/api/admin/*` memerlukan authentication
- Endpoint `/api/mitra/*` memerlukan authentication
- Request tanpa token valid akan ditolak (401 Unauthorized)

### 4. **Page Guards**
- `admin.html` dan `mitra.html` dilindungi dengan `page-guard.js`
- Auto-redirect ke login page jika belum authenticated
- Verify token setiap kali halaman dibuka

### 5. **Session Management**
- Session disimpan di server memory (Map)
- Auto-cleanup session yang expired (>24 jam)
- Logout akan menghapus session dari server

---

## 🔐 Cara Mengganti Password

### Method 1: Menggunakan Script Generator

```bash
node scripts/generate-password-hash.js
```

Masukkan password baru, lalu copy hash yang dihasilkan.

### Method 2: Manual (Online Tool)

1. Buka: https://emn178.github.io/online-tools/sha256.html
2. Masukkan password baru
3. Copy hash yang dihasilkan

### Method 3: Node.js Console

```javascript
const crypto = require('crypto');
const password = 'PasswordBaruAnda123';
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log(hash);
```

### Langkah Update Password:

1. Generate hash password baru (pilih salah satu method di atas)
2. Buka file `api/auth.js`
3. Ganti nilai hash:

```javascript
// Untuk Admin
const ADMIN_PASSWORD_HASH = 'HASH_BARU_ANDA';

// Untuk Mitra
const MITRA_PASSWORD_HASH = 'HASH_BARU_ANDA';
```

4. Restart server:
```bash
# Stop server (Ctrl+C)
npm start
```

5. Test login dengan password baru

---

## 🚨 Checklist Keamanan untuk Production

### ✅ Wajib Dilakukan:

- [ ] **Ganti password default** admin dan mitra
- [ ] **Ganti Firebase URL** jika perlu (atau protect dengan Firebase Rules)
- [ ] **Tambahkan HTTPS** (wajib untuk production)
- [ ] **Ganti session storage** dari memory ke Redis/Database
- [ ] **Tambahkan rate limiting** untuk login endpoint
- [ ] **Enable CORS** hanya untuk domain yang diizinkan
- [ ] **Tambahkan logging** untuk track login attempts
- [ ] **Backup database** secara berkala

### 🔒 Firebase Security Rules

Tambahkan rules di Firebase Console:

```json
{
  "rules": {
    "db": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

Atau gunakan Firebase Admin SDK dengan service account.

### 🛡️ Vercel Environment Variables

Jika deploy ke Vercel, tambahkan environment variables:

1. Buka Vercel Dashboard → Project Settings → Environment Variables
2. Tambahkan:
   - `ADMIN_PASSWORD_HASH` = hash password admin
   - `MITRA_PASSWORD_HASH` = hash password mitra
   - `FIREBASE_URL` = URL Firebase database
   - `SESSION_SECRET` = random string panjang

3. Update `api/auth.js` untuk baca dari env:

```javascript
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 'default_hash';
const MITRA_PASSWORD_HASH = process.env.MITRA_PASSWORD_HASH || 'default_hash';
```

---

## 🔍 Cara Cek Keamanan

### 1. Test Authentication

```bash
# Test login tanpa token (harus ditolak)
curl -X GET http://localhost:3000/api/admin/users

# Expected: {"error":"Authentication required"}
```

### 2. Test Password Hash

```bash
# Coba view-source di browser
view-source:http://localhost:3000/admin.html

# Password hash TIDAK boleh terlihat di HTML
```

### 3. Test Session Expiry

1. Login ke admin panel
2. Tunggu 24 jam (atau ubah expire time di `api/auth.js` untuk testing)
3. Refresh halaman → harus auto-redirect ke login

### 4. Test Unauthorized Access

1. Buka browser incognito
2. Akses langsung: http://localhost:3000/admin.html
3. Harus auto-redirect ke login page

---

## 🚫 Apa yang TIDAK Aman (Perlu Improvement)

### 1. Session Storage di Memory
**Masalah:** Session hilang jika server restart
**Solusi:** Gunakan Redis atau database untuk session storage

### 2. Tidak Ada Rate Limiting
**Masalah:** Attacker bisa brute-force password
**Solusi:** Tambahkan rate limiting (max 5 login attempts per 15 menit)

### 3. Tidak Ada 2FA
**Masalah:** Jika password bocor, akun bisa diakses
**Solusi:** Tambahkan Two-Factor Authentication (Google Authenticator)

### 4. Firebase URL Exposed
**Masalah:** Siapa saja bisa akses Firebase jika tidak ada rules
**Solusi:** Tambahkan Firebase Security Rules atau gunakan Firebase Admin SDK

### 5. Tidak Ada Audit Log
**Masalah:** Tidak bisa track siapa yang login/logout
**Solusi:** Tambahkan logging untuk semua aktivitas admin

---

## 📚 Best Practices

### 1. Password Policy
- Minimal 12 karakter
- Kombinasi huruf besar, kecil, angka, simbol
- Jangan gunakan password yang mudah ditebak
- Ganti password secara berkala (3-6 bulan)

### 2. Token Management
- Token harus random dan unpredictable
- Token expire setelah periode tertentu
- Logout harus menghapus token dari server

### 3. HTTPS Only
- Jangan deploy tanpa HTTPS di production
- Password akan terlihat di network jika HTTP
- Gunakan Let's Encrypt untuk SSL gratis

### 4. Environment Variables
- Jangan commit `.env` ke Git
- Gunakan `.env.example` sebagai template
- Simpan credentials di environment variables

### 5. Regular Updates
- Update dependencies secara berkala
- Monitor security vulnerabilities
- Patch security issues segera

---

## 🆘 Jika Password Lupa

### Admin Password:

1. Buka `api/auth.js`
2. Lihat `ADMIN_PASSWORD_HASH`
3. Generate hash baru dengan password yang Anda ingat
4. Ganti hash di file
5. Restart server

### Atau Reset ke Default:

```javascript
// api/auth.js
const ADMIN_PASSWORD_HASH = '28341e1d7cba1c79408761fac087fd1ba00983f7b95d6018109b681d2d751e85'; // "Tekno@Project03"
```

---

## 📞 Kontak Security Issues

Jika menemukan vulnerability atau security issue:
1. **JANGAN** post di public issue tracker
2. Hubungi developer secara private
3. Berikan detail lengkap tentang issue
4. Tunggu patch sebelum disclose

---

## ✅ Kesimpulan

Sistem authentication sudah **jauh lebih aman** dibanding sebelumnya:

| Sebelum | Sesudah |
|---------|---------|
| ❌ Password di HTML | ✅ Password hash di server |
| ❌ Tidak ada authentication | ✅ Token-based auth |
| ❌ API terbuka | ✅ API protected |
| ❌ Mudah di-inspect | ✅ Tidak bisa lihat password |

**Namun masih perlu improvement untuk production:**
- Rate limiting
- Redis session storage
- 2FA
- Audit logging
- Firebase security rules

---

**🔐 Keamanan adalah proses berkelanjutan, bukan one-time setup!**
