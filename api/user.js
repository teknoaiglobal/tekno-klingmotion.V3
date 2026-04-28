import { getDb } from './db.js';

export default async function handler(req, res) {
  const db = await getDb();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'User ID diperlukan.' });
  }

  const user = db.users.find(u => u.id === id);
  if (user) {
    return res.status(200).json({ success: true, user });
  }

  return res.status(404).json({ error: 'User tidak ditemukan.' });
}
