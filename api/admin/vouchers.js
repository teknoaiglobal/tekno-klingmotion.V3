import { getDb, saveDb } from '../db.js';

// Verify authentication
function verifyAuth(req) {
  const token = req.headers['x-auth-token'];
  if (!token) {
    return { valid: false, error: 'Authentication required' };
  }
  return { valid: true };
}

export default async function handler(req, res) {
  // Check authentication
  const auth = verifyAuth(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.error });
  }

  const db = await getDb();

  if (req.method === 'GET') {
    return res.status(200).json({ vouchers: db.vouchers });
  }

  if (req.method === 'POST') {
    const { plan_type, duration_days, credits_included } = req.body || {};
    
    const newVoucher = {
      id: Date.now().toString(),
      code: 'TEKNO-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      plan_type: plan_type || 'free',
      duration_days: duration_days || 3,
      credits_included: credits_included || 10,
      is_used: false
    };
    
    db.vouchers.push(newVoucher);
    await saveDb();
    return res.status(200).json({ success: true, voucher: newVoucher });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
