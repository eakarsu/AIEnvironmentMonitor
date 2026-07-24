import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../database/db';
import { loginValidation, registerValidation } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendMail, buildPasswordResetEmail, buildVerificationEmail } from '../services/mailer';

const router = express.Router();

/**
 * Resolve the JWT secret with strict production handling.
 * - In production: missing JWT_SECRET throws (refuses to issue insecure tokens).
 * - In dev/test: falls back to a stable random per-process secret with a warning,
 *   so existing test suites still function but no insecure literal escapes.
 */
let cachedDevSecret: string | null = null;
function getJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  if (!cachedDevSecret) {
    cachedDevSecret = crypto.randomBytes(48).toString('hex');
    // eslint-disable-next-line no-console
    console.warn('[auth] JWT_SECRET unset — using ephemeral dev secret. Set JWT_SECRET to persist tokens across restarts.');
  }
  return cachedDevSecret;
}

// Login
router.post('/login', authLimiter, loginValidation as any, async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'user' },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user'
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register
router.post('/register', authLimiter, registerValidation as any, async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      'INSERT INTO users (email, password, name, verification_token) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hashedPassword, name, verificationToken]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    // Send verification email (non-blocking)
    sendMail(buildVerificationEmail(verificationToken, email)).catch(err =>
      console.error('[Register] Verification email error:', err.message)
    );

    res.status(201).json({ token, user });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get demo credentials
router.get('/demo', (req, res) => {
  res.json({
    email: 'demo@example.com',
    password: 'password123'
  });
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: result.rows[0] });
  } catch {
    return res.status(500).json({ error: 'Failed to get user' });
  }
});

// Forgot Password
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.rows[0].id, token, expires]
    );

    // Send password reset email (non-blocking)
    const { email: userEmail } = req.body;
    sendMail(buildPasswordResetEmail(token, userEmail)).catch(err =>
      console.error('[ForgotPassword] Email error:', err.message)
    );

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process password reset' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const result = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() AND used = false',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, result.rows[0].user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [result.rows[0].id]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    const result = await pool.query(
      'UPDATE users SET email_verified = true, verification_token = null WHERE verification_token = $1 RETURNING id, email, name',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    res.json({ message: 'Email verified successfully', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend Verification
router.post('/resend-verification', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user!.id]);
    await pool.query(
      'UPDATE users SET verification_token = $1 WHERE id = $2',
      [token, req.user!.id]
    );

    // Send verification email (non-blocking)
    if (userResult.rows.length > 0) {
      sendMail(buildVerificationEmail(token, userResult.rows[0].email)).catch(err =>
        console.error('[ResendVerification] Email error:', err.message)
      );
    }

    res.json({ message: 'Verification email resent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resend verification' });
  }
});

// Refresh Token
router.post('/refresh', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const newToken = jwt.sign(
      { id: req.user!.id, email: req.user!.email },
      getJwtSecret(),
      { expiresIn: '24h' }
    );
    res.json({ token: newToken });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

export default router;
