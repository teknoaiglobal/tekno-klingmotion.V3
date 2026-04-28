import { getDb, saveDb } from './db.js';

export default async function handler(req, res) {
  const db = await getDb();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { voucher_code } = req.body;

  if (!voucher_code) {
    return res.status(400).json({ error: 'Voucher code diperlukan.' });
  }

  // 1. Check if an existing user already claimed this voucher
  const existingUser = db.users.find(u => u.voucher_code === voucher_code);
  if (existingUser) {
    return res.status(200).json({ success: true, user: existingUser, settings: db.settings });
  }

  // 2. Fallback: Unused Voucher Login (Creates a new user)
  const voucherIndex = db.vouchers.findIndex(v => v.code === voucher_code && !v.is_used);
  if (voucherIndex === -1) {
    return res.status(400).json({ error: 'Voucher tidak valid atau sudah digunakan.' });
  }

  const v = db.vouchers[voucherIndex];
  db.vouchers[voucherIndex].is_used = true;

  // Create a new user from voucher
  const newUser = {
    id: 'user_' + Date.now(),
    name: voucher_code,
    voucher_code: voucher_code,
    role: 'member',
    plan: v.plan_type,
    credits: v.credits_included,
    subscription_end_date: new Date(Date.now() + v.duration_days * 24 * 60 * 60 * 1000).toISOString(),
  };
  
  db.users.push(newUser);
  await saveDb();
  return res.status(200).json({ success: true, user: newUser, settings: db.settings });
}
