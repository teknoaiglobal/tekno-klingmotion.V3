import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// Auth routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const handler = await import('./api/auth.js');
        await handler.default(req, res);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/auth/verify', async (req, res) => {
    try {
        const handler = await import('./api/auth.js');
        await handler.default(req, res);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    try {
        const handler = await import('./api/auth.js');
        await handler.default(req, res);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Map /proxy.php to api/proxy.js based on vercel.json rewrite
app.all('/proxy.php', async (req, res) => {
    try {
        const handler = await import('./api/proxy.js');
        await handler.default(req, res);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Dynamic API routes handler
app.use('/api', async (req, res) => {
    try {
        // Remove trailing slash from path
        let apiPath = req.path.replace(/\/$/, '');
        
        // Find the matching JS file
        let filePath = path.join(__dirname, 'api', `${apiPath}.js`);
        
        console.log(`[SERVER] API request: ${req.method} ${req.path} -> ${apiPath}.js`);
        
        if (fs.existsSync(filePath)) {
            // Found exact match
            const handler = await import(`file://${filePath}?t=${Date.now()}`);
            await handler.default(req, res);
        } else {
            console.log(`[SERVER] File not found: ${filePath}`);
            res.status(404).json({ error: 'Not Found', path: apiPath });
        }
    } catch (e) {
        console.error('[SERVER] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Local dev server running at http://localhost:${PORT}`);
    
    // Simulate Cron Job Locally (runs every 1 hour)
    setInterval(async () => {
        try {
            console.log('[LOCAL CRON] Triggering API Key Cleanup...');
            // Since it's local, we bypass network fetch and import handler directly
            const handler = await import('./api/admin/apikeys/cleanup.js');
            // Mock req and res
            const req = { 
                method: 'GET', 
                headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } 
            };
            const res = {
                status: (code) => ({
                    json: (data) => console.log(`[LOCAL CRON] Cleanup Result (${code}):`, data)
                }),
                headersSent: false
            };
            await handler.default(req, res);
        } catch (e) {
            console.error('[LOCAL CRON] Error:', e);
        }
    }, 60 * 60 * 1000); // 1 hour
});
