# 🚀 Quick Reference - TEKNO KLING MOTION

## 📍 URL Akses

| Halaman | URL | Password |
|---------|-----|----------|
| **Main App** | http://localhost:3000/index.html | Voucher code |
| **Admin Login** | http://localhost:3000/admin-login.html | `Tekno@Project03` |
| **Mitra Login** | http://localhost:3000/mitra-login.html | `mitra` |

---

## 🔐 Keamanan

### ✅ Yang Sudah Aman:
- ✅ Password di-hash SHA-256 di server
- ✅ Token-based authentication
- ✅ API endpoints protected
- ✅ Tidak bisa lihat password dari inspect element
- ✅ Auto-redirect jika belum login

### ⚠️ Masih Perlu (Production):
- ⚠️ Ganti password default
- ⚠️ Tambah rate limiting
- ⚠️ Gunakan HTTPS
- ⚠️ Redis untuk session storage
- ⚠️ Firebase security rules

---

## 🔑 Ganti Password

```bash
# 1. Generate hash baru
node scripts/generate-password-hash.js

# 2. Copy hash yang dihasilkan

# 3. Edit api/auth.js
# Ganti ADMIN_PASSWORD_HASH atau MITRA_PASSWORD_HASH

# 4. Restart server
npm start
```

---

## 🛠️ Command Penting

```bash
# Start server
npm start

# Generate password hash
node scripts/generate-password-hash.js

# Install dependencies
npm install

# Check port
netstat -ano | findstr :3000
```

---

## 📂 File Penting

| File | Fungsi |
|------|--------|
| `api/auth.js` | Password hash & authentication logic |
| `api/db.js` | Firebase database connection |
| `api/proxy.js` | Freepik API proxy + credit system |
| `server.js` | Express server configuration |
| `js/auth-client.js` | Client-side auth handler |
| `js/page-guard.js` | Protect admin/mitra pages |

---

## 🔍 Troubleshooting

### Problem: "Authentication required"
**Solusi:** Login dulu di admin-login.html atau mitra-login.html

### Problem: Password salah terus
**Solusi:** 
1. Cek hash di `api/auth.js`
2. Generate hash baru dengan `node scripts/generate-password-hash.js`
3. Pastikan password yang diinput sama persis

### Problem: Auto-redirect loop
**Solusi:**
1. Clear localStorage: `localStorage.clear()`
2. Clear cookies
3. Refresh browser

### Problem: API 401 Unauthorized
**Solusi:**
1. Logout dan login ulang
2. Token mungkin expired (>24 jam)
3. Cek header `x-auth-token` ada atau tidak

---

## 📝 Checklist Deploy Production

- [ ] Ganti password admin & mitra
- [ ] Update Firebase URL (atau tambah security rules)
- [ ] Tambah HTTPS (Let's Encrypt)
- [ ] Ganti session storage ke Redis
- [ ] Tambah rate limiting
- [ ] Setup environment variables di Vercel
- [ ] Test semua fitur
- [ ] Backup database
- [ ] Monitor logs

---

## 🆘 Emergency

### Lupa Password Admin:
```javascript
// Edit api/auth.js
const ADMIN_PASSWORD_HASH = '28341e1d7cba1c79408761fac087fd1ba00983f7b95d6018109b681d2d751e85';
// Password: Tekno@Project03
```

### Reset Session:
```javascript
// Browser console
localStorage.clear();
location.reload();
```

### Force Logout All Users:
```bash
# Restart server (session di-clear)
npm start
```

---

## 📞 Support Files

- **KEAMANAN.md** - Dokumentasi lengkap keamanan
- **PERUBAHAN_KEAMANAN.md** - Ringkasan perubahan
- **PANDUAN_PENGGUNAAN.md** - Panduan lengkap aplikasi
- **.env.example** - Template environment variables

---

**🎉 Server Running: http://localhost:3000**
