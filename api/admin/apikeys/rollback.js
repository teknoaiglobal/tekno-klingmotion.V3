import { getDb, saveDb } from '../../../api/db.js';
import { requireAuth } from '../../../api/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Security Validation: Only Admin can rollback
    await new Promise((resolve, reject) => {
      requireAuth(['admin'])(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const { key_ids } = req.body; // Array of IDs or key_strings to rollback

    // 2. Fetch Database
    const db = await getDb();
    if (!db.deletedApiKeys || db.deletedApiKeys.length === 0) {
      return res.status(400).json({ error: 'No deleted keys available for rollback' });
    }

    // 3. Rollback Logic
    const toRestore = [];
    const remainingDeleted = [];

    for (const key of db.deletedApiKeys) {
      // If key_ids is provided, only restore specific ones. Otherwise, restore ALL deleted keys.
      if (!key_ids || key_ids.length === 0 || key_ids.includes(key.id) || key_ids.includes(key.key_string)) {
        // Reset deletion flags
        const restoredKey = { ...key };
        delete restoredKey.deleted_at;
        delete restoredKey.reason;
        
        // Make it active again and remove inactive_since
        restoredKey.is_active = true;
        delete restoredKey.inactive_since;
        
        toRestore.push(restoredKey);
      } else {
        remainingDeleted.push(key);
      }
    }

    if (toRestore.length === 0) {
      return res.status(404).json({ error: 'No matching keys found to rollback' });
    }

    // 4. Update Database
    db.apiKeys = db.apiKeys || [];
    db.apiKeys.push(...toRestore);
    db.deletedApiKeys = remainingDeleted;

    await saveDb();

    // 5. Logging & Response
    const result = {
      success: true,
      message: `Rollback complete. Restored ${toRestore.length} keys.`,
      restored_count: toRestore.length,
      restored_keys: toRestore.map(k => k.id || k.key_string.substring(0, 8) + '***')
    };

    console.log(`[ADMIN/ROLLBACK] ${result.message}`);
    return res.status(200).json(result);

  } catch (error) {
    console.error('[ADMIN/ROLLBACK] Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
}