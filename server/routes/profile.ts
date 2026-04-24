import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { profileValidation, passwordChangeValidation } from '../middleware/validation';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, email_verified, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/', authenticateToken, profileValidation as any, async (req: AuthRequest, res: express.Response) => {
  try {
    const { name, email } = req.body;
    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING id, email, name, role',
      [name, email, req.user!.id]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.put('/password', authenticateToken, passwordChangeValidation as any, async (req: AuthRequest, res: express.Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await pool.query('SELECT password FROM users WHERE id = $1', [req.user!.id]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user!.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
