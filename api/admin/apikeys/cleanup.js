import { getDb, saveDb } from '../../../lib/db.js';
import { requireAuth } from '../../../api/auth.js';

export default async function handler(req, res) {
  // Allow POST for manual trigger (via admin panel) or GET for cron (Vercel Cron uses GET)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Security Validation
    // Check if called via Vercel Cron
    const authHeader = req.headers.authorization;
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET;
    
    // If not cron, check if it's an admin (via requireAuth middleware)
    if (!isCron) {
      // Manual verification of admin session
      const token = req.headers['x-auth-token'];
      if (!token) {
        return res.status(401).json({ error: 'Authentication required. Cron secret or Admin token missing.' });
      }
      
      // Need to import sessions from auth.js to verify manually
      // Or we can dynamically use requireAuth since it's a middleware. 
      // But this is an endpoint handler, let's wrap it using a Promise.
      await new Promise((resolve, reject) => {
        requireAuth(['admin'])(req, res, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    // 2. Fetch Database
    const db = await getDb();
    if (!db.apiKeys) {
      db.apiKeys = [];
    }

    // 3. Deletion Logic (3 Days Inactive)
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    const toKeep = [];
    const toDelete = [];

    for (const key of db.apiKeys) {
      if (!key.is_active && key.inactive_since) {
        const inactiveTime = new Date(key.inactive_since).getTime();
        if (now - inactiveTime >= THREE_DAYS_MS) {
          toDelete.push({
            ...key,
            deleted_at: new Date().toISOString(),
            reason: 'inactive_3_days'
          });
          continue;
        }
      }
      toKeep.push(key);
    }

    // 4. Execution & Rollback Mechanism (Soft Delete)
    if (toDelete.length > 0) {
      db.apiKeys = toKeep;
      
      // Ensure deletedApiKeys table exists
      if (!db.deletedApiKeys) {
        db.deletedApiKeys = [];
      }
      
      // Append deleted keys to the backup table
      db.deletedApiKeys.push(...toDelete);
      
      // Keep only the last 30 days of deleted keys to prevent unbounded growth
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      db.deletedApiKeys = db.deletedApiKeys.filter(k => {
        const deletedTime = new Date(k.deleted_at).getTime();
        return now - deletedTime < THIRTY_DAYS_MS;
      });

      await saveDb();
    }

    // 5. Logging & Notification/Response
    const result = {
      success: true,
      message: `Cleanup complete. Deleted ${toDelete.length} keys.`,
      deleted_count: toDelete.length,
      deleted_keys: toDelete.map(k => k.id || k.key_string.substring(0, 8) + '***'),
      remaining_keys: toKeep.length
    };

    console.log(`[CRON/CLEANUP] ${result.message}`);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('[CRON/CLEANUP] Error:', error);
    // Fallback response for unhandled errors
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
}
