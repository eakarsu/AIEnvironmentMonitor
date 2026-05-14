// Scope-3 supply-chain agent: procurement emissions estimator.
import express, { Response } from 'express';
import { analyzeWithAI } from '../services/openrouter';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// POST /api/scope3-supply-chain/estimate { spend:[{vendor,category,usd}] }
router.post('/estimate', authenticateToken, aiRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { spend = [] } = req.body || {};
    if (!Array.isArray(spend) || !spend.length) return res.status(400).json({ error: 'spend[] required' });

    // EEIO factors (kg CO2e / $ spent) — rough placeholders
    const EEIO: Record<string, number> = {
      logistics: 0.5, electronics: 0.4, services: 0.1, food: 0.6, construction: 0.7, transport: 0.6, default: 0.3,
    };
    const lines = spend.map((s: any) => ({
      vendor: s.vendor,
      category: s.category,
      usd: Number(s.usd),
      mt_co2e: Math.round(Number(s.usd) * (EEIO[s.category] ?? EEIO.default) / 1000 * 100) / 100,
    }));
    const totalCo2e = lines.reduce((a, b) => a + b.mt_co2e, 0);

    let narrative = null;
    try {
      narrative = await analyzeWithAI('Summarise scope-3 emissions and prioritise vendor engagement.', JSON.stringify(lines).slice(0, 4000));
    } catch {}
    return res.json({ line_items: lines, total_mt_co2e: Math.round(totalCo2e * 100) / 100, narrative });
  } catch (e: any) {
    return res.status(500).json({ error: 'estimate failed' });
  }
});

export default router;
