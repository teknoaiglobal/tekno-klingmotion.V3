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
        // Find the matching JS file
        const apiPath = req.path;
        let filePath = path.join(__dirname, 'api', `${apiPath}.js`);
        
        if (fs.existsSync(filePath)) {
            // Found exact match
            const handler = await import(`file://${filePath}?t=${Date.now()}`);
            await handler.default(req, res);
        } else {
            res.status(404).json({ error: 'Not Found' });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Local dev server running at http://localhost:${PORT}`);
});
