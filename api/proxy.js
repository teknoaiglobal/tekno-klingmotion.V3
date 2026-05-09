export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, x-freepik-api-key, x-use-server-quota, x-texa-user-id');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { route, path } = req.query;

    // Route 1: Freepik API Proxy
    if (route === 'api') {
        if (!path) {
            return res.status(400).json({ error: 'Missing "path" parameter' });
        }

        const targetUrl = `https://api.freepik.com${path}`;
        const apiKey = req.headers['x-freepik-api-key'] || '';

        const fetchOptions = {
            method: req.method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Origin': 'https://www.freepik.com',
                'Referer': 'https://www.freepik.com/'
            }
        };

        let apiKeyToUse = apiKey;

        // Auto-detect Server Quota: If no API key is provided and it's a generation POST request
        const useServerQuota = (req.headers['x-use-server-quota'] === 'true') || (!apiKeyToUse && req.method === 'POST' && path.includes('/v1/ai/video'));

        if (useServerQuota && req.method === 'POST') {
            const userId = req.headers['x-texa-user-id'];
            if (!userId) {
                // Return 401 with clear message so frontend can handle it or show it
                return res.status(401).json({ error: 'User ID is required to use server quota. Please login via Voucher.' });
            }
            
            const { getDb, saveDb } = await import('./db.js');
            const db = await getDb();
            const user = db.users.find(u => u.id === userId);
            
            if (!user) return res.status(404).json({ error: 'User not found' });
            if (user.credits <= 0) return res.status(403).json({ error: 'Insufficient credits' });
            if (new Date(user.subscription_end_date) < new Date()) return res.status(403).json({ error: 'Subscription expired' });
            
            if (req.body && req.body.model) {
                const planLower = user.plan.toLowerCase();
                const requestedModel = req.body.model;
                if (planLower === 'free' && requestedModel !== 'kling-v2-6-motion-control-std') {
                    return res.status(403).json({ error: 'Free plan can only use Kling 2.6 Standard. Please upgrade to Pro/VIP.' });
                }
                if (planLower === 'pro' && requestedModel.includes('kling-v3')) {
                    return res.status(403).json({ error: 'Pro plan cannot use Kling 3 models. Please upgrade to VIP.' });
                }
            }
            
            // ALWAYS USE FIRST KEY FROM TOP (regardless of active status)
            const allKeys = db.apiKeys;
            if (allKeys.length === 0) return res.status(500).json({ error: 'No API keys configured' });
            
            // Use first key (index 0) - will try all keys if this fails
            const selectedKey = allKeys[0];
            user.credits -= 1;
            await saveDb();
            
            apiKeyToUse = selectedKey.key_string;
            
            // Set header for client to know which key was used
            res.setHeader('X-Used-Key-Hint', apiKeyToUse.substring(0, 8) + '***');
            console.log(`[PROXY] Initial attempt using TOP key #1: ${apiKeyToUse.substring(0, 8)}*** (Status: ${selectedKey.is_active ? 'Active' : 'Disabled'})`);
            console.log(`[PROXY] Using TOP key: ${apiKeyToUse.substring(0, 8)}*** (ID: ${selectedKey.id})`);
        } else if (useServerQuota && req.method === 'GET') {
             // For polling GET requests, find the key that was used to create this task
             const { getDb } = await import('./db.js');
             const db = await getDb();
             
             const taskId = path.split('/').pop();
             const task = db.tasks && db.tasks.find(t => t.taskId === taskId);
             
             console.log(`[PROXY] Polling task ${taskId}, found in db.tasks: ${!!task}`);
             
             if (task && task.apiKey) {
                 apiKeyToUse = task.apiKey;
                 console.log(`[PROXY] Using specific key for task ${taskId}: ${apiKeyToUse.substring(0,8)}`);
             } else {
                 const activeKeys = db.apiKeys.filter(k => k.is_active);
                 if (activeKeys.length > 0) {
                     // Use first active key
                     const selectedKey = activeKeys[0];
                     apiKeyToUse = selectedKey.key_string;
                     console.log(`[PROXY] Fallback to TOP key for task ${taskId}: ${apiKeyToUse.substring(0,8)}`);
                 }
             }
        }

        if (apiKeyToUse) {
            fetchOptions.headers['x-freepik-api-key'] = apiKeyToUse;
        }

        if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
            // Vercel parses req.body automatically if it's JSON
            fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }

        let response;
        let data;
        let maxRetries = useServerQuota ? 10 : 1; // Increase max retries to try all keys
        let attempt = 0;
        let success = false;
        let keyErrorCount = {}; // Track error count per key

        try {
            while (attempt < maxRetries && !success) {
                try {
                // Pick key from ALL keys (not just active), starting from top
                if (attempt > 0 && useServerQuota) {
                    const { getDb } = await import('./db.js');
                    const db = await getDb();
                    
                    // Get ALL keys (including disabled ones)
                    const allKeys = db.apiKeys;
                    if (allKeys.length === 0) {
                        return res.status(500).json({ error: 'No API keys configured.' });
                    }
                    
                    // Use attempt as index to try keys from top to bottom
                    const keyIndex = attempt % allKeys.length;
                    const selectedKey = allKeys[keyIndex];
                    apiKeyToUse = selectedKey.key_string;
                    fetchOptions.headers['x-freepik-api-key'] = apiKeyToUse;
                    res.setHeader('X-Used-Key-Hint', apiKeyToUse.substring(0, 8) + '***');
                    console.log(`[PROXY] Retry #${attempt} using key #${keyIndex + 1}: ${apiKeyToUse.substring(0, 8)}*** (Status: ${selectedKey.is_active ? 'Active' : 'Disabled'})`);
                }

                response = await fetch(targetUrl, fetchOptions);
                data = await response.text(); 
                
                // Check if key has error
                let hasError = false;
                if (useServerQuota) {
                    if ([401, 403, 429].includes(response.status)) hasError = true;
                    if (!response.ok && data.toLowerCase().includes('insufficient')) hasError = true;
                    if (!response.ok && data.toLowerCase().includes('limit')) hasError = true;
                    if (!response.ok && data.toLowerCase().includes('quota')) hasError = true;
                }

                if (hasError) {
                    // Track error count for this key
                    if (!keyErrorCount[apiKeyToUse]) {
                        keyErrorCount[apiKeyToUse] = 0;
                    }
                    keyErrorCount[apiKeyToUse]++;
                    
                    console.warn(`[PROXY] Key ${apiKeyToUse.substring(0,8)}*** failed (${keyErrorCount[apiKeyToUse]}x). Status: ${response.status}`);
                    
                    // Only disable after 3 consecutive errors
                    if (keyErrorCount[apiKeyToUse] >= 3) {
                        const { getDb, saveDb } = await import('./db.js');
                        const db = await getDb();
                        const badKeyIndex = db.apiKeys.findIndex(k => k.key_string === apiKeyToUse);
                        
                        if (badKeyIndex !== -1) {
                            const badKey = db.apiKeys[badKeyIndex];
                            
                            // Only disable if currently active
                            if (badKey.is_active) {
                                badKey.is_active = false;
                                badKey.inactive_since = new Date().toISOString();
                                
                                // MOVE TO BOTTOM: Remove from current position and push to end
                                db.apiKeys.splice(badKeyIndex, 1);
                                db.apiKeys.push(badKey);
                                
                                await saveDb();
                                console.error(`[PROXY] ❌ Key DISABLED after 3 failures: ${apiKeyToUse.substring(0,8)}*** (moved to bottom)`);
                            }
                        }
                    }
                    
                    attempt++;
                } else {
                    success = true;
                    console.log(`[PROXY] ✅ Success with key: ${apiKeyToUse.substring(0,8)}***`);
                    
                    // Only increment usage on successful POST (Task Creation)
                    if (useServerQuota && response.ok && req.method === 'POST') {
                        const { getDb, saveDb } = await import('./db.js');
                        const db = await getDb();
                        const usedKey = db.apiKeys.find(k => k.key_string === apiKeyToUse);
                        if (usedKey) usedKey.usage_count += 1;
                        await saveDb();
                    }
                }
            } catch(e) {
                console.error(`[PROXY] Exception on attempt ${attempt}:`, e.message);
                if (attempt === maxRetries - 1) throw e;
                attempt++;
            }
        }
            
            // Refund if totally failed to create task
            const userId = req.headers['x-texa-user-id'];
            if (req.method === 'POST' && useServerQuota && userId && (!response || !response.ok)) {
                 const { getDb, saveDb } = await import('./db.js');
                 const db = await getDb();
                 const user = db.users.find(u => u.id === userId);
                 if (user) {
                     user.credits += 1; // Refund
                     await saveDb();
                 }
            }
            if (response.ok && req.method === 'POST' && path.includes('/v1/ai/video') && useServerQuota && userId) {
                try {
                    const jsonData = JSON.parse(data);
                    const taskId = jsonData.data?.task_id || jsonData.task_id;
                    if (taskId) {
                        const { getDb, saveDb } = await import('./db.js');
                        const db = await getDb();
                        db.tasks = db.tasks || [];
                        db.tasks.push({ taskId, userId, status: 'PENDING', apiKey: apiKeyToUse });
                        await saveDb();
                        console.log(`[PROXY] Saved task ${taskId} with key ${apiKeyToUse.substring(0,8)}`);
                    }
                } catch(e) {}
            }
            
            if (req.method === 'GET' && (path.includes('/v1/ai/tasks/') || path.includes('/v1/ai/video/') || path.includes('/v1/ai/image-to-video/'))) {
                try {
                    let shouldRefund = false;
                    const taskId = path.split('/').pop();
                    
                    if (response.ok) {
                        const jsonData = JSON.parse(data);
                        const status = jsonData.data?.status || jsonData.status;
                        if (status === 'FAILED' || status === 'CANCELED') shouldRefund = true;
                    } else {
                        // If Freepik returns 404 or other errors during polling, the task is lost
                        shouldRefund = true;
                    }
                    
                    if (shouldRefund) {
                        const { getDb, saveDb } = await import('./db.js');
                        const db = await getDb();
                        db.tasks = db.tasks || [];
                        const task = db.tasks.find(t => t.taskId === taskId && t.status !== 'REFUNDED');
                        if (task) {
                            const user = db.users.find(u => u.id === task.userId);
                            if (user) {
                                user.credits += 1;
                                task.status = 'REFUNDED';
                                await saveDb();
                                res.setHeader('X-Credit-Refunded', '1');
                            }
                        }
                    }
                } catch(e) {}
            }
            
            // Forward the exact HTTP status code from Freepik
            res.status(response.status).send(data);
        } catch (error) {
            console.error('API Proxy Error:', error);
            res.status(502).json({ error: 'API proxy error', details: error.message });
        }
        return;
    }

    // Route 2: Upload Proxy (Currently handled by Cloudinary directly in JS, 
    // but porting just in case it's used elsewhere for the `upload.iismedika.online` endpoint)
    if (route === 'upload' && req.method === 'POST') {
        return res.status(501).json({ error: 'Upload proxy not implemented in Vercel. Please use direct Cloudinary upload from client.' });
    }

    res.status(404).json({ error: 'Use ?route=api&path=/...' });
}
