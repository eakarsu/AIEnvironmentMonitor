import express from 'express';
import pool from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user!.id]);
    if (result.rows.length === 0) {
      const defaults = await pool.query(
        `INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *`,
        [req.user!.id]
      );
      return res.json(defaults.rows[0]);
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { theme, notifications_enabled, email_notifications, language, data_sharing } = req.body;
    const result = await pool.query(
      `INSERT INTO user_settings (user_id, theme, notifications_enabled, email_notifications, language, data_sharing)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id)
       DO UPDATE SET theme = $2, notifications_enabled = $3, email_notifications = $4, language = $5, data_sharing = $6, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user!.id, theme || 'dark', notifications_enabled ?? true, email_notifications ?? true, language || 'en', data_sharing ?? false]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
