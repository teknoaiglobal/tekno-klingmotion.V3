import { getDb, saveDb } from '../../lib/db.js';

// Verify authentication
function verifyAuth(req) {
  const token = req.headers['x-auth-token'];
  if (!token) {
    return { valid: false, error: 'Authentication required' };
  }
  return { valid: true };
}

export default async function handler(req, res) {
  // Check authentication
  const auth = verifyAuth(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.error });
  }

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
    const { 
      popupText, whatsappLink, 
      notifSuccessCreate, notifSuccessComplete, 
      notifFailed, notifTokenRotation, notifErrorDetail 
    } = req.body || {};
    
    if (popupText !== undefined) db.settings.popupText = popupText;
    if (whatsappLink !== undefined) db.settings.whatsappLink = whatsappLink;
    
    if (notifSuccessCreate !== undefined) db.settings.notifSuccessCreate = notifSuccessCreate;
    if (notifSuccessComplete !== undefined) db.settings.notifSuccessComplete = notifSuccessComplete;
    if (notifFailed !== undefined) db.settings.notifFailed = notifFailed;
    if (notifTokenRotation !== undefined) db.settings.notifTokenRotation = notifTokenRotation;
    if (notifErrorDetail !== undefined) db.settings.notifErrorDetail = notifErrorDetail;
    
    await saveDb();
    return res.status(200).json({ success: true, settings: db.settings });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
