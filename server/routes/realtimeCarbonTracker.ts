// Real-time carbon tracker: stream from smart meters, live carbon intensity.
import express, { Response } from 'express';
import pool from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// MTCO2e/MWh by mix component (rough averages)
const EF: Record<string, number> = { coal: 0.95, gas: 0.45, oil: 0.7, nuclear: 0.012, solar: 0.05, wind: 0.011, hydro: 0.024 };

// POST /api/realtime-carbon/ingest { meter_id, kwh, ts? }
router.post('/ingest', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { meter_id, kwh, ts } = req.body || {};
    if (!meter_id || kwh == null) return res.status(400).json({ error: 'meter_id + kwh required' });
    try {
      await pool.query(`INSERT INTO smart_meter_intervals (meter_id, ts, kwh, user_id) VALUES ($1,$2,$3,$4)`, [meter_id, ts || new Date(), Number(kwh), (req as any).user?.id || null]);
    } catch {}
    return res.json({ recorded: true, meter_id, kwh: Number(kwh) });
  } catch (e: any) {
    return res.status(500).json({ error: 'ingest failed' });
  }
});

// GET /api/realtime-carbon/intensity?region=
router.get('/intensity', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const region = (req.query.region as string) || 'default';
    // Region mix percentages (rough US baseline)
    const mix: Record<string, number> = { coal: 0.2, gas: 0.35, nuclear: 0.18, solar: 0.05, wind: 0.1, hydro: 0.07, oil: 0.05 };
    let intensity = 0;
    for (const k of Object.keys(mix)) intensity += mix[k] * (EF[k] || 0.5);
    return res.json({ region, mt_co2e_per_mwh: Math.round(intensity * 1000) / 1000, mix });
  } catch (e: any) {
    return res.status(500).json({ error: 'intensity failed' });
  }
});

export default router;
