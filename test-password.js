// Test password hash
import crypto from 'crypto';

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

console.log('\n🔐 Password Hash Verification\n');
console.log('Admin Password: "Tekno@Project03"');
console.log('Hash:', hashPassword('Tekno@Project03'));
console.log('\nMitra Password: "mitra"');
console.log('Hash:', hashPassword('mitra'));
console.log('\n✅ Copy hash di atas ke api/auth.js jika berbeda\n');
