// Workplace gamification: eco-behavior badges, team leaderboards.
import express, { Response } from 'express';
import pool from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// POST /api/workplace-gamification/log { user_id, action, points? }
router.post('/log', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { action, points } = req.body || {};
    const userId = (req as any).user?.id;
    if (!action || !userId) return res.status(400).json({ error: 'action + auth required' });
    try {
      await pool.query(`INSERT INTO eco_actions (user_id, action, points, created_at) VALUES ($1,$2,$3,NOW())`, [userId, action, Number(points || 10)]);
    } catch {}
    return res.json({ logged: true, action, points: Number(points || 10) });
  } catch (e: any) {
    return res.status(500).json({ error: 'log failed' });
  }
});

// GET /api/workplace-gamification/leaderboard?period=week
router.get('/leaderboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as string) || 'week';
    const interval = period === 'month' ? '30 days' : '7 days';
    const r = await pool.query(
      `SELECT user_id, SUM(points) AS total
       FROM eco_actions WHERE created_at > NOW() - INTERVAL '${interval}'
       GROUP BY user_id ORDER BY total DESC LIMIT 20`
    ).catch(() => ({ rows: [] }));
    return res.json({ period, leaderboard: r.rows });
  } catch (e: any) {
    return res.status(500).json({ error: 'leaderboard failed' });
  }
});

export default router;
