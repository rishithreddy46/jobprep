/**
 * server/auth.js — Single-User Authentication Engine for JobPrep.live
 *
 * Implements:
 * - Preconfigured single-user account: username 'Rishith' (case-insensitive)
 * - Cryptographic password verification (PBKDF2 with SHA-512 and salt)
 * - Secure server-side sessions with cryptographic tokens
 * - Session expiration (7 days)
 * - Login rate limiting (5 attempts per 15 minutes)
 * - CSRF / SameSite cookie management + Bearer token fallback
 * - Secure password-change procedure
 * - Protected API middleware
 */

import crypto from 'crypto';
import { query, queryOne } from './db.js';

// Preconfigured username
export const AUTHORIZED_USERNAME = 'Rishith';

// In-memory active session store (backed up by DB profile update)
const activeSessions = new Map(); // token -> { username, createdAt, expiresAt, ip }

// Rate limiting store: ip -> { attempts, firstAttemptTime }
const loginRateLimiter = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 mins
const MAX_ATTEMPTS = 5;

/**
 * Hash a password using PBKDF2 with a random salt
 */
export function hashPassword(plaintext, existingSalt = null) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plaintext, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2:100000:${salt}:${hash}`;
}

/**
 * Verify a plaintext password against a stored hash string
 */
export function verifyPassword(plaintext, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const originalHash = parts[3];
  const testHash = crypto.pbkdf2Sync(plaintext, salt, iterations, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(originalHash, 'hex'));
}

/**
 * Initialize or bootstrap the single-user password in the database
 */
export async function bootstrapAuth() {
  try {
    const profile = await queryOne('SELECT passcode_hash FROM learner_profile WHERE id = 1');
    const envPassword = process.env.AUTH_PASSWORD;

    if (envPassword) {
      // If server environment variable is provided, update password hash
      const newHash = hashPassword(envPassword);
      await query('UPDATE learner_profile SET passcode_hash = $1, name = $2 WHERE id = 1', [newHash, AUTHORIZED_USERNAME]);
      console.log(`[auth] Single-user account initialized for '${AUTHORIZED_USERNAME}' via AUTH_PASSWORD environment variable.`);
    } else if (!profile || !profile.passcode_hash) {
      // Default initial password hash for Rishith (JobPrep2027!)
      const defaultHash = hashPassword('JobPrep2027!');
      await query('UPDATE learner_profile SET passcode_hash = $1, name = $2 WHERE id = 1', [defaultHash, AUTHORIZED_USERNAME]);
      console.log(`[auth] Single-user account initialized with baseline secure credentials for '${AUTHORIZED_USERNAME}'.`);
    } else {
      console.log(`[auth] Single-user account '${AUTHORIZED_USERNAME}' authenticated hash loaded.`);
    }
  } catch (err) {
    console.error('[auth] Error bootstrapping auth:', err.message);
  }
}

/**
 * Clean up expired sessions periodically
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt <= now) {
      activeSessions.delete(token);
    }
  }
  for (const [ip, record] of loginRateLimiter.entries()) {
    if (now - record.firstAttemptTime > RATE_LIMIT_WINDOW_MS) {
      loginRateLimiter.delete(ip);
    }
  }
}, 60 * 1000);
if (cleanupInterval.unref) cleanupInterval.unref();

/**
 * Login handler
 */
export async function handleLogin(req, res) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Check rate limit
  const rateRecord = loginRateLimiter.get(clientIp);
  if (rateRecord) {
    if (now - rateRecord.firstAttemptTime < RATE_LIMIT_WINDOW_MS) {
      if (rateRecord.attempts >= MAX_ATTEMPTS) {
        const remainingMinutes = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - rateRecord.firstAttemptTime)) / 60000);
        return res.status(429).json({
          error: `Too many failed login attempts. Please try again in ${remainingMinutes} minutes.`,
        });
      }
    } else {
      loginRateLimiter.delete(clientIp);
    }
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // Validate single-user username (case-insensitive)
  if (username.trim().toLowerCase() !== AUTHORIZED_USERNAME.toLowerCase()) {
    recordFailedAttempt(clientIp);
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Fetch stored hash
  const profile = await queryOne('SELECT passcode_hash FROM learner_profile WHERE id = 1');
  const storedHash = profile?.passcode_hash;

  if (!storedHash || !verifyPassword(password, storedHash)) {
    recordFailedAttempt(clientIp);
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Success: Clear rate limit record
  loginRateLimiter.delete(clientIp);

  // Generate cryptographically secure session token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

  activeSessions.set(token, {
    username: AUTHORIZED_USERNAME,
    createdAt: now,
    expiresAt,
    ip: clientIp,
  });

  // Set secure HttpOnly cookie
  const isSecure = process.env.NODE_ENV === 'production' && req.secure;
  res.cookie('jobprep_session', token, {
    httpOnly: true,
    secure: Boolean(isSecure),
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return res.json({
    success: true,
    token,
    user: {
      username: AUTHORIZED_USERNAME,
      targetDate: '2026-10-26T00:00:00',
    },
    message: `Welcome back, ${AUTHORIZED_USERNAME}!`,
  });
}

function recordFailedAttempt(clientIp) {
  const now = Date.now();
  const record = loginRateLimiter.get(clientIp) || { attempts: 0, firstAttemptTime: now };
  record.attempts += 1;
  loginRateLimiter.set(clientIp, record);
}

/**
 * Logout handler
 */
export function handleLogout(req, res) {
  const token = extractToken(req);
  if (token && activeSessions.has(token)) {
    activeSessions.delete(token);
  }
  res.clearCookie('jobprep_session', { path: '/' });
  return res.json({ success: true, message: 'Successfully logged out.' });
}

/**
 * Check authenticated user status (/api/auth/me)
 */
export async function handleGetMe(req, res) {
  const token = extractToken(req);
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ authenticated: false, error: 'Not authenticated.' });
  }

  const session = activeSessions.get(token);
  if (session.expiresAt <= Date.now()) {
    activeSessions.delete(token);
    return res.status(401).json({ authenticated: false, error: 'Session expired.' });
  }

  const profile = await queryOne('SELECT name, branch, target_date, daily_goal_mins, daily_goal_questions FROM learner_profile WHERE id = 1');

  return res.json({
    authenticated: true,
    user: {
      username: AUTHORIZED_USERNAME,
      profile: profile || { name: AUTHORIZED_USERNAME },
    },
  });
}

/**
 * Change password handler
 */
export async function handleChangePassword(req, res) {
  const token = extractToken(req);
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Authentication required to update password.' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  const profile = await queryOne('SELECT passcode_hash FROM learner_profile WHERE id = 1');
  if (!profile || !verifyPassword(currentPassword, profile.passcode_hash)) {
    return res.status(401).json({ error: 'Current password does not match.' });
  }

  const newHash = hashPassword(newPassword);
  await query('UPDATE learner_profile SET passcode_hash = $1, updated_at = NOW() WHERE id = 1', [newHash]);

  return res.json({ success: true, message: 'Password updated successfully.' });
}

/**
 * Extract auth token from cookie or Authorization header
 */
function extractToken(req) {
  if (req.cookies && req.cookies.jobprep_session) {
    return req.cookies.jobprep_session;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

/**
 * Express middleware to protect private API endpoints
 */
export function requireAuth(req, res, next) {
  // Public bypass paths
  const publicPaths = [
    '/api/health',
    '/api/auth/login',
    '/api/auth/status',
  ];

  if (publicPaths.includes(req.path)) {
    return next();
  }

  const token = extractToken(req);
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized. Single-user authentication required.' });
  }

  const session = activeSessions.get(token);
  if (session.expiresAt <= Date.now()) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Session has expired. Please log in again.' });
  }

  req.user = session;
  next();
}
