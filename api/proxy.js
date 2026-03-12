export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, x-freepik-api-key');

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

        if (apiKey) {
            fetchOptions.headers['x-freepik-api-key'] = apiKey;
        }

        if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
            // Vercel parses req.body automatically if it's JSON
            fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }

        try {
            const response = await fetch(targetUrl, fetchOptions);
            const data = await response.text(); 
            
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
