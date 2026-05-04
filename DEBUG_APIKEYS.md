# 🔍 Debug API Keys Tidak Muncul

## ✅ Server sudah di-restart dengan logging tambahan

---

## 🧪 Langkah Debugging:

### 1. Clear Cache & Reload
```javascript
// Tekan F12, lalu di Console ketik:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Login Ulang
- Buka: http://localhost:3000/admin-login.html
- Password: `Tekno@Project03`
- Login

### 3. Buka Console Browser
- Tekan **F12**
- Tab **Console**
- Lihat log yang muncul

### 4. Cek Log yang Harus Muncul:
```
[ADMIN] Fetching admin data...
[ADMIN] Response status: {users: 200, apikeys: 200, settings: 200}
[ADMIN] Data received: {users: 17, apiKeys: 29, settings: true}
```

**Jika muncul log di atas:**
- ✅ Data berhasil di-fetch
- ✅ Ada 29 API keys
- ❌ Tapi tidak ter-render (bug di renderApiKeys)

**Jika TIDAK muncul log:**
- ❌ fetchAdminData tidak dipanggil
- ❌ page-guard.js belum selesai
- ❌ Token tidak ter-inject

---

## 🔍 Cek Response API Manual

### Test 1: Cek Token
```javascript
// Di Console (F12):
console.log('Token:', localStorage.getItem('texa_auth_token'));
// Harus ada token panjang
```

### Test 2: Fetch Manual
```javascript
// Di Console (F12):
const token = localStorage.getItem('texa_auth_token');
fetch('/api/admin/apikeys', {
    headers: { 'x-auth-token': token }
})
.then(r => r.json())
.then(d => {
    console.log('API Keys:', d);
    console.log('Total keys:', d.apiKeys?.length);
});
```

**Expected output:**
```
API Keys: {apiKeys: Array(29)}
Total keys: 29
```

---

## 🛠️ Jika Masih Tidak Muncul:

### Scenario A: Error 401 Unauthorized
**Solusi:**
1. Logout: `await authClient.logout()`
2. Clear storage: `localStorage.clear()`
3. Login ulang

### Scenario B: Data null/undefined
**Solusi:**
1. Cek Firebase: https://tekno-335f8-default-rtdb.asia-southeast1.firebasedatabase.app/db.json
2. Pastikan ada field `apiKeys`
3. Jika tidak ada, data hilang dari Firebase

### Scenario C: JavaScript Error
**Solusi:**
1. Lihat tab Console untuk error merah
2. Screenshot error
3. Kirim ke saya

---

## 📸 Screenshot yang Perlu:

1. **Console log** (F12 → Console tab)
2. **Network tab** (F12 → Network → klik `/api/admin/apikeys`)
3. **Response** dari API (klik request → Response tab)

---

## 🔧 Quick Fix Sementara:

Jika masih tidak muncul, coba test dengan HTML sederhana:

```javascript
// Di Console (F12):
const token = localStorage.getItem('texa_auth_token');
fetch('/api/admin/apikeys', {
    headers: { 'x-auth-token': token }
})
.then(r => r.json())
.then(d => {
    const tbody = document.getElementById('keysTableBody');
    tbody.innerHTML = d.apiKeys.map((k, i) => `
        <tr>
            <td>#${i+1} ${k.key_string}</td>
            <td>${k.usage_count}</td>
            <td>${k.is_active ? 'Active' : 'Mati'}</td>
            <td>-</td>
        </tr>
    `).join('');
});
```

Jika ini berhasil → Bug di fungsi renderApiKeys
Jika ini gagal → Problem di fetch/authentication

---

**Server running: http://localhost:3000**

**Silakan test dan kirim screenshot console log!**
