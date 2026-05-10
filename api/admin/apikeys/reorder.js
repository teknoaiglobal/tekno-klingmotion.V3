import { getDb, saveDb } from '../../../lib/db.js';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = await getDb();
  const { id, direction } = req.body || {};

  if (!id || !direction) {
    return res.status(400).json({ error: 'id and direction are required' });
  }

  if (!['up', 'down'].includes(direction)) {
    return res.status(400).json({ error: 'direction must be "up" or "down"' });
  }

  const keyIndex = db.apiKeys.findIndex(k => k.id === id);
  
  if (keyIndex === -1) {
    return res.status(404).json({ error: 'API Key not found' });
  }

  // Move up (swap with previous)
  if (direction === 'up' && keyIndex > 0) {
    const temp = db.apiKeys[keyIndex];
    db.apiKeys[keyIndex] = db.apiKeys[keyIndex - 1];
    db.apiKeys[keyIndex - 1] = temp;
    await saveDb();
    return res.status(200).json({ success: true, message: 'Moved up' });
  }

  // Move down (swap with next)
  if (direction === 'down' && keyIndex < db.apiKeys.length - 1) {
    const temp = db.apiKeys[keyIndex];
    db.apiKeys[keyIndex] = db.apiKeys[keyIndex + 1];
    db.apiKeys[keyIndex + 1] = temp;
    await saveDb();
    return res.status(200).json({ success: true, message: 'Moved down' });
  }

  return res.status(400).json({ error: 'Cannot move in that direction' });
}
