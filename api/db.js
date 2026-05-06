const FIREBASE_URL = 'https://tekno-335f8-default-rtdb.asia-southeast1.firebasedatabase.app/db.json';

const initialDb = {
  users: [
    {
      id: 'admin',
      name: 'Admin User',
      role: 'admin',
      plan: 'vip',
      credits: 9999,
      subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ],
  vouchers: [],
  apiKeys: [
    { id: '1', key_string: 'FPSX14489435804c999da3c0411e2d0eb929', usage_count: 0, is_active: true },
    { id: '2', key_string: 'FPSX15b7532ef8a19adb491e7770e6a5df24', usage_count: 0, is_active: true },
    { id: '3', key_string: 'FPSX78a3ce4528de71ff66edc69fb5f3130c', usage_count: 0, is_active: true }
  ],
  tasks: [],
  settings: {
    popupText: 'Kredit Anda tidak mencukupi (0). Silakan melakukan Top Up Kredit atau perpanjang VIP Plan untuk terus menikmati layanan AI Motion tanpa batas.',
    whatsappLink: 'https://wa.me/6281234567890'
  }
};

// We use global to persist state across hot reloads in dev mode,
// but for serverless we want to fetch from Firebase every time.
let dbCache = null;

export async function getDb() {
  try {
    const res = await fetch(FIREBASE_URL);
    const data = await res.json();
    if (data) {
      dbCache = {
        users: data.users || [],
        vouchers: data.vouchers || [],
        apiKeys: data.apiKeys || [],
        tasks: data.tasks || [],
        settings: data.settings || initialDb.settings
      };
      return dbCache;
    }
  } catch (e) {
    console.error('Failed to fetch DB from Firebase:', e);
  }
  
  if (!dbCache) {
    dbCache = initialDb;
    await saveDb();
  }
  return dbCache;
}

export async function saveDb() {
  if (!dbCache) return;

  // Auto-sort API keys: Active first, then by usage_count ascending (least used first)
  if (dbCache.apiKeys && Array.isArray(dbCache.apiKeys)) {
    dbCache.apiKeys.sort((a, b) => {
      // Prioritize active keys over disabled ones
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1; 
      }
      // Then sort by lowest usage count
      return (a.usage_count || 0) - (b.usage_count || 0);
    });
  }

  try {
    await fetch(FIREBASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbCache)
    });
  } catch (e) {
    console.error('Failed to save DB to Firebase:', e);
  }
}
