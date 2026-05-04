#!/usr/bin/env node
// Script untuk generate SHA-256 hash dari password
// Usage: node scripts/generate-password-hash.js

import crypto from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

console.log('\n🔐 Password Hash Generator\n');
console.log('Generate SHA-256 hash untuk password admin/mitra\n');

rl.question('Masukkan password baru: ', (password) => {
    if (!password) {
        console.log('❌ Password tidak boleh kosong!');
        rl.close();
        return;
    }

    const hash = hashPassword(password);
    
    console.log('\n✅ Hash berhasil dibuat!\n');
    console.log('Password:', password);
    console.log('SHA-256 Hash:', hash);
    console.log('\n📝 Copy hash di atas dan paste ke file api/auth.js:');
    console.log('   - Untuk Admin: ganti ADMIN_PASSWORD_HASH');
    console.log('   - Untuk Mitra: ganti MITRA_PASSWORD_HASH\n');
    
    rl.close();
});
