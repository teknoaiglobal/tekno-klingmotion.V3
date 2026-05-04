import { getDb, saveDb } from '../../db.js';

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
  const { ids, is_active } = req.body || {};

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active must be a boolean' });
  }

  let updatedCount = 0;

  // Update all keys with matching IDs
  for (const id of ids) {
    const key = db.apiKeys.find(k => k.id === id);
    if (key) {
      key.is_active = is_active;
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    await saveDb();
  }

  return res.status(200).json({ 
    success: true, 
    message: `${updatedCount} API key(s) updated`,
    updatedCount 
  });
}
