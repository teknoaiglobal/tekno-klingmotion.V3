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
                'Content-Type': 'application/json'
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
            
            const activeKeys = db.apiKeys.filter(k => k.is_active);
            if (activeKeys.length === 0) return res.status(500).json({ error: 'No server keys available' });
            
            const selectedKey = activeKeys.reduce((prev, curr) => prev.usage_count < curr.usage_count ? prev : curr);
            user.credits -= 1;
            await saveDb();
            
            apiKeyToUse = selectedKey.key_string;
            
            // Set header for client to know which key was used
            res.setHeader('X-Used-Key-Hint', apiKeyToUse.substring(0, 8) + '***');
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
                     const selectedKey = activeKeys.reduce((prev, curr) => prev.usage_count < curr.usage_count ? prev : curr);
                     apiKeyToUse = selectedKey.key_string;
                     console.log(`[PROXY] Fallback random key for task ${taskId}: ${apiKeyToUse.substring(0,8)}`);
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
        let maxRetries = useServerQuota ? 4 : 1;
        let attempt = 0;
        let success = false;

        try {
            while (attempt < maxRetries && !success) {
                try {
                // If it's a retry, we must pick a new active key
                if (attempt > 0 && useServerQuota) {
                    const { getDb } = await import('./db.js');
                    const db = await getDb();
                    const activeKeys = db.apiKeys.filter(k => k.is_active);
                    if (activeKeys.length === 0) {
                        return res.status(500).json({ error: 'All server tokens have been exhausted or disabled.' });
                    }
                    const selectedKey = activeKeys.reduce((prev, curr) => prev.usage_count < curr.usage_count ? prev : curr);
                    apiKeyToUse = selectedKey.key_string;
                    fetchOptions.headers['x-freepik-api-key'] = apiKeyToUse;
                    res.setHeader('X-Used-Key-Hint', apiKeyToUse.substring(0, 8) + '***');
                }

                response = await fetch(targetUrl, fetchOptions);
                data = await response.text(); 
                
                // Check if key is dead/limited
                let isDeadKey = false;
                if (useServerQuota) {
                    if ([401, 403, 429].includes(response.status)) isDeadKey = true;
                    if (!response.ok && data.toLowerCase().includes('insufficient')) isDeadKey = true;
                    if (!response.ok && data.toLowerCase().includes('limit')) isDeadKey = true;
                }

                if (isDeadKey) {
                    const { getDb, saveDb } = await import('./db.js');
                    const db = await getDb();
                    const badKey = db.apiKeys.find(k => k.key_string === apiKeyToUse);
                    if (badKey) badKey.is_active = false;
                    await saveDb();
                    console.warn(`Auto-disabled token ${apiKeyToUse.substring(0,8)}*** due to error response`);
                    attempt++;
                } else {
                    success = true;
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
            
            if (response.ok && req.method === 'GET' && (path.includes('/v1/ai/tasks/') || path.includes('/v1/ai/video/') || path.includes('/v1/ai/image-to-video/'))) {
                try {
                    const jsonData = JSON.parse(data);
                    const status = jsonData.data?.status || jsonData.status;
                    const taskId = jsonData.data?.task_id || jsonData.task_id || path.split('/').pop();
                    
                    if (status === 'FAILED' || status === 'CANCELED') {
                        const { db } = await import('./db.js');
                        db.tasks = db.tasks || [];
                        const task = db.tasks.find(t => t.taskId === taskId && t.status !== 'REFUNDED');
                        if (task) {
                            const user = db.users.find(u => u.id === task.userId);
                            if (user) {
                                user.credits += 1;
                                task.status = 'REFUNDED';
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
