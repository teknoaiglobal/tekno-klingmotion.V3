import { getDb } from './db.js';

// Server-side password storage (GANTI INI!)
const ADMIN_PASSWORD_HASH = '28341e1d7cba1c79408761fac087fd1ba00983f7b95d6018109b681d2d751e85'; // SHA-256 hash of "Tekno@Project03"
const MITRA_PASSWORD_HASH = 'ef7c6cba58cf82997b990feec6b78b1cf73b4a0b3a6b1b0c46fac8a56ca70549'; // SHA-256 hash of "mitra"

// Simple session store (in production, use Redis or database)
const sessions = new Map();

// Generate random session token
function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Hash password using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req, res) {
  // Login endpoint
  if (req.method === 'POST' && req.url === '/api/auth/login') {
    const { password, role } = req.body;
    
    if (!password || !role) {
      return res.status(400).json({ error: 'Password and role required' });
    }

    const passwordHash = await hashPassword(password);
    
    let isValid = false;
    if (role === 'admin' && passwordHash === ADMIN_PASSWORD_HASH) {
      isValid = true;
    } else if (role === 'mitra' && passwordHash === MITRA_PASSWORD_HASH) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const token = generateToken();
    sessions.set(token, { role, createdAt: Date.now() });

    // Clean old sessions (older than 24 hours)
    const now = Date.now();
    for (const [key, value] of sessions.entries()) {
      if (now - value.createdAt > 24 * 60 * 60 * 1000) {
        sessions.delete(key);
      }
    }

    return res.status(200).json({ success: true, token, role });
  }

  // Verify endpoint
  if (req.method === 'POST' && req.url === '/api/auth/verify') {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const session = sessions.get(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    return res.status(200).json({ success: true, role: session.role });
  }

  // Logout endpoint
  if (req.method === 'POST' && req.url === '/api/auth/logout') {
    const { token } = req.body;
    if (token) {
      sessions.delete(token);
    }
    return res.status(200).json({ success: true });
  }

  return res.status(404).json({ error: 'Not found' });
}

// Middleware to verify admin/mitra access
export function requireAuth(allowedRoles = []) {
  return (req, res, next) => {
    const token = req.headers['x-auth-token'];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const session = sessions.get(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.user = { role: session.role };
    next();
  };
}
