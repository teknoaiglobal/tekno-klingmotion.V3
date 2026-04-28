import { getDb, saveDb } from '../db.js';

export default async function handler(req, res) {
  const db = await getDb();
  if (!db.settings) {
    db.settings = { 
      popupText: 'Kredit Anda tidak mencukupi (0). Silakan melakukan Top Up Kredit atau perpanjang VIP Plan untuk terus menikmati layanan AI Motion tanpa batas.', 
      whatsappLink: 'https://wa.me/6281234567890' 
    };
  }

  if (req.method === 'GET') {
    return res.status(200).json({ settings: db.settings });
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const { popupText, whatsappLink } = req.body || {};
    
    if (popupText !== undefined) db.settings.popupText = popupText;
    if (whatsappLink !== undefined) db.settings.whatsappLink = whatsappLink;
    
    await saveDb();
    return res.status(200).json({ success: true, settings: db.settings });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
