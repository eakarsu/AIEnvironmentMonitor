// Behavioural nudges: triggered notifications on high usage.
import express, { Response } from 'express';
import pool from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// POST /api/behavioural-nudges/check { user_id?, period_days?:7, usage_threshold_pct?:1.2 }
router.post('/check', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const periodDays = Math.min(Number(req.body?.period_days) || 7, 30);
    const threshold = Number(req.body?.usage_threshold_pct) || 1.2;
    const r = await pool.query(
      `SELECT SUM(kwh) as recent FROM smart_meter_intervals WHERE user_id = $1 AND ts > NOW() - INTERVAL '1 day' * $2`,
      [userId, periodDays]
    ).catch(() => ({ rows: [{ recent: 0 }] }));
    const r2 = await pool.query(
      `SELECT SUM(kwh) as prior FROM smart_meter_intervals WHERE user_id = $1 AND ts BETWEEN NOW() - INTERVAL '1 day' * ($2 * 2) AND NOW() - INTERVAL '1 day' * $2`,
      [userId, periodDays]
    ).catch(() => ({ rows: [{ prior: 0 }] }));

    const recent = Number(r.rows[0].recent || 0);
    const prior = Number(r2.rows[0].prior || 0);
    const ratio = prior > 0 ? recent / prior : 0;
    const nudge = ratio > threshold ? {
      severity: ratio > 1.5 ? 'high' : 'medium',
      message: `Your usage rose ${Math.round((ratio - 1) * 100)}% vs. prior ${periodDays}d window. Try shifting laundry to off-peak hours.`,
    } : null;
    if (nudge) {
      try {
        await pool.query(`INSERT INTO notifications (user_id, type, payload, created_at) VALUES ($1,'behavioural_nudge',$2,NOW())`, [userId, JSON.stringify(nudge)]);
      } catch {}
    }
    return res.json({ recent_kwh: recent, prior_kwh: prior, ratio: Math.round(ratio * 100) / 100, nudge });
  } catch (e: any) {
    return res.status(500).json({ error: 'check failed' });
  }
});

export default router;
