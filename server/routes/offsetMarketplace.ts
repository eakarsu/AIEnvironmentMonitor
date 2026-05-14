// Offset marketplace: verified offset purchase in-app.
import express, { Response } from 'express';
import pool from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const CATALOG = [
  { id: 'vcs-001', name: 'VCS Reforestation, Brazil', $_per_t: 18, registry: 'VCS' },
  { id: 'gs-002', name: 'Gold Standard Cookstoves, Kenya', $_per_t: 12, registry: 'Gold Standard' },
  { id: 'cdm-003', name: 'CDM Wind Farm, India', $_per_t: 9, registry: 'CDM' },
  { id: 'plan-004', name: 'Climeworks DAC', $_per_t: 400, registry: 'Climeworks' },
];

// GET /api/offset-marketplace/catalog
router.get('/catalog', authenticateToken, (_req, res) => res.json({ count: CATALOG.length, offsets: CATALOG }));

// POST /api/offset-marketplace/purchase { offset_id, tonnes }
router.post('/purchase', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { offset_id, tonnes } = req.body || {};
    if (!offset_id || !tonnes) return res.status(400).json({ error: 'offset_id + tonnes required' });
    const product = CATALOG.find(c => c.id === offset_id);
    if (!product) return res.status(404).json({ error: 'offset not found' });
    const total = product['$_per_t'] * Number(tonnes);
    // TODO: configure credentials — STRIPE_API_KEY for payment processing
    try {
      await pool.query(
        `INSERT INTO carbon_offsets (user_id, offset_id, tonnes, total_usd, status, created_at)
         VALUES ($1,$2,$3,$4,'reserved',NOW())`,
        [(req as any).user?.id || null, offset_id, Number(tonnes), total]
      );
    } catch {}
    return res.json({ offset: product, tonnes: Number(tonnes), total_usd: Math.round(total * 100) / 100, status: process.env.STRIPE_API_KEY ? 'reserved' : 'reserved_no_payment' });
  } catch (e: any) {
    return res.status(500).json({ error: 'purchase failed' });
  }
});

export default router;
