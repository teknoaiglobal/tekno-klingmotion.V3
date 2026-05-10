import { getDb, saveDb } from '../../lib/db.js';

export default async function handler(req, res) {
    // Enable CORS for public access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { tokens } = req.body;
        if (!Array.isArray(tokens)) {
            return res.status(400).json({ error: 'Format tidak valid. Diharapkan array of strings.' });
        }

        const db = await getDb();
        if (!db.apiKeys) db.apiKeys = [];
        
        const existingKeys = new Set(db.apiKeys.map(k => k.key_string));
        
        // Format: FPSX + 32 hexadecimal characters
        const regex = /^FPSX[a-fA-F0-9]{32}$/;
        
        let added = 0;
        let duplicates = 0;
        let invalid = 0;

        for (const token of tokens) {
            const t = token.trim();
            if (!t) continue;

            if (!regex.test(t)) {
                invalid++;
                continue;
            }

            if (existingKeys.has(t)) {
                duplicates++;
                continue;
            }

            // Generate unique ID
            const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
            
            // Add to DB
            db.apiKeys.push({
                id: id,
                key_string: t,
                is_active: true,
                usage_count: 0
            });
            
            existingKeys.add(t);
            added++;
        }

        if (added > 0) {
            await saveDb();
            console.log(`[PUBLIC TOKEN ADD] Ditambahkan: ${added}, Duplikat: ${duplicates}, Invalid: ${invalid}`);
        }

        return res.status(200).json({
            success: true,
            message: `Berhasil memproses token`,
            stats: { added, duplicates, invalid }
        });

    } catch (error) {
        console.error('[PUBLIC TOKEN ADD] Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
