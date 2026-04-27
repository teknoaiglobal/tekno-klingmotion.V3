import { db } from '../db.js';

export default function handler(req, res) {
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
    return res.status(200).json({ success: true, voucher: newVoucher });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
