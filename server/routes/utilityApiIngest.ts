// Utility-API ingest: Opower-style usage pull (or Utility API service).
import express, { Response } from 'express';
import pool from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// POST /api/utility-api-ingest/pull { authorization_id, provider:'utility-api' }
router.post('/pull', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { authorization_id, provider = 'utility-api' } = req.body || {};
    if (!authorization_id) return res.status(400).json({ error: 'authorization_id required' });
    // TODO: configure credentials — UTILITY_API_TOKEN
    const token = process.env.UTILITY_API_TOKEN;
    if (!token) return res.status(503).json({ error: 'UTILITY_API_TOKEN missing' });

    const r = await fetch(`https://utilityapi.com/api/v2/intervals?authorizations=${authorization_id}&limit=200`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return res.status(502).json({ error: 'upstream failed', status: r.status });
    const data: any = await r.json();
    let inserted = 0;
    for (const interval of (data.intervals || []).slice(0, 1000)) {
      try {
        await pool.query(
          `INSERT INTO smart_meter_intervals (meter_id, ts, kwh, user_id, source) VALUES ($1,$2,$3,$4,$5)`,
          [interval.meter_uid || authorization_id, interval.start, Number(interval.kwh || 0), (req as any).user?.id || null, provider]
        );
        inserted++;
      } catch {}
    }
    return res.json({ provider, authorization_id, pulled: (data.intervals || []).length, inserted });
  } catch (e: any) {
    return res.status(500).json({ error: 'pull failed' });
  }
});

export default router;
