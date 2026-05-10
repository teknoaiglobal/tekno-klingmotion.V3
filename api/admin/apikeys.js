import { getDb, saveDb } from '../../lib/db.js';

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
  const action = req.query?.action;

  // Reorder key priority: /api/admin/apikeys?action=reorder
  if (action === 'reorder' && req.method === 'POST') {
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

    if (direction === 'up' && keyIndex > 0) {
      const temp = db.apiKeys[keyIndex];
      db.apiKeys[keyIndex] = db.apiKeys[keyIndex - 1];
      db.apiKeys[keyIndex - 1] = temp;
      await saveDb();
      return res.status(200).json({ success: true, message: 'Moved up' });
    }

    if (direction === 'down' && keyIndex < db.apiKeys.length - 1) {
      const temp = db.apiKeys[keyIndex];
      db.apiKeys[keyIndex] = db.apiKeys[keyIndex + 1];
      db.apiKeys[keyIndex + 1] = temp;
      await saveDb();
      return res.status(200).json({ success: true, message: 'Moved down' });
    }

    return res.status(400).json({ error: 'Cannot move in that direction' });
  }

  // Bulk update/delete: /api/admin/apikeys?action=bulk
  if (action === 'bulk') {
    if (req.method === 'DELETE') {
      const { ids } = req.body || {};
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'ids array is required' });
      }

      const initialCount = db.apiKeys.length;
      db.apiKeys = db.apiKeys.filter(k => !ids.includes(k.id));
      const deletedCount = initialCount - db.apiKeys.length;

      if (deletedCount > 0) {
        await saveDb();
      }

      return res.status(200).json({
        success: true,
        message: `${deletedCount} API key(s) deleted`,
        deletedCount
      });
    }

    if (req.method === 'POST') {
      const { ids, is_active } = req.body || {};
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'ids array is required' });
      }
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'is_active must be a boolean' });
      }

      let updatedCount = 0;
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

    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ apiKeys: db.apiKeys });
  }

  if (req.method === 'POST') {
    const { key_string } = req.body || {};
    if (!key_string) {
      return res.status(400).json({ error: 'key_string is required' });
    }
    
    const newKey = {
      id: Date.now().toString(),
      key_string,
      usage_count: 0,
      is_active: true
    };
    
    db.apiKeys.push(newKey);
    await saveDb();
    return res.status(200).json({ success: true, apiKey: newKey });
  }

  if (req.method === 'PUT') {
    const { id, is_active, key_string } = req.body || {};
    const keyIndex = db.apiKeys.findIndex(k => k.id === id);
    
    if (keyIndex === -1) {
      return res.status(404).json({ error: 'API Key not found' });
    }
    
    if (is_active !== undefined) {
      db.apiKeys[keyIndex].is_active = is_active;
    }
    if (key_string !== undefined) {
      db.apiKeys[keyIndex].key_string = key_string;
    }
    
    await saveDb();
    return res.status(200).json({ success: true, apiKey: db.apiKeys[keyIndex] });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    const keyIndex = db.apiKeys.findIndex(k => k.id === id);
    
    if (keyIndex === -1) {
      return res.status(404).json({ error: 'API Key not found' });
    }
    
    db.apiKeys.splice(keyIndex, 1);
    await saveDb();
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
