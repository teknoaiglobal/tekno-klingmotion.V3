import { db } from '../db.js';

export default function handler(req, res) {
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
    
    return res.status(200).json({ success: true, apiKey: db.apiKeys[keyIndex] });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    const keyIndex = db.apiKeys.findIndex(k => k.id === id);
    
    if (keyIndex === -1) {
      return res.status(404).json({ error: 'API Key not found' });
    }
    
    db.apiKeys.splice(keyIndex, 1);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
