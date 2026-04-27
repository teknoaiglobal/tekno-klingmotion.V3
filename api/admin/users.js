import { db } from '../db.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ users: db.users });
  }

  if (req.method === 'PUT') {
    const { id, plan, credits, duration_days, name, voucher_code } = req.body;
    const userIndex = db.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (plan !== undefined) db.users[userIndex].plan = plan;
    if (credits !== undefined) db.users[userIndex].credits = parseInt(credits);
    if (name !== undefined) db.users[userIndex].name = name;
    if (voucher_code !== undefined) {
      db.users[userIndex].voucher_code = voucher_code;
      // Mark it as used in the voucher portal so it disappears
      const vIndex = db.vouchers.findIndex(v => v.code === voucher_code && !v.is_used);
      if (vIndex !== -1) {
        db.vouchers[vIndex].is_used = true;
      }
    }
    
    if (duration_days !== undefined) {
      db.users[userIndex].subscription_end_date = new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000).toISOString();
    }
    
    return res.status(200).json({ success: true, user: db.users[userIndex] });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    db.users.splice(userIndex, 1);
    return res.status(200).json({ success: true });
  }

  if (req.method === 'POST') {
    const newUser = {
      id: 'user_' + Date.now(),
      name: 'New Member',
      voucher_code: '',
      role: 'member',
      plan: 'free',
      credits: 0,
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    db.users.push(newUser);
    return res.status(200).json({ success: true, user: newUser });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
