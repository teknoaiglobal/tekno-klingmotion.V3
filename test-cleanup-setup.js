import { getDb, saveDb } from './lib/db.js';

async function test() {
  const db = await getDb();
  
  // Inject some dummy dead keys
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
  console.log('Dummy keys injected. Run cleanup endpoint to test.');
}

test();
