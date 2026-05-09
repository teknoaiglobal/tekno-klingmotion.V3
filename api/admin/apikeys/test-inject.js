import { getDb, saveDb } from '../../../api/db.js';

export default async function handler(req, res) {
  const db = await getDb();
  
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  
  db.apiKeys.push({
    id: 'test_old_1',
    key_string: 'dead_key_4_days_ago',
    is_active: false,
    inactive_since: fourDaysAgo,
    usage_count: 50
  });

  db.apiKeys.push({
    id: 'test_new_1',
    key_string: 'dead_key_2_days_ago',
    is_active: false,
    inactive_since: twoDaysAgo,
    usage_count: 50
  });
  
  await saveDb();
  res.status(200).json({ message: 'Dummy keys injected' });
}