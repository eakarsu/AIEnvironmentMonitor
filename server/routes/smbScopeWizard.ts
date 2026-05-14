// SMB Scope 1/2/3 wizard: simplified accounting.
import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// POST /api/smb-scope-wizard/calc
// body: { fleet_gallons:0, kwh:0, gas_therms:0, scope3_usd:{logistics:0, electronics:0, services:0} }
router.post('/calc', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body || {};
    // Conversion factors
    const SCOPE1 = (Number(b.fleet_gallons || 0)) * 0.00889; // gallons * kg/gal → t
    const SCOPE1_GAS = (Number(b.gas_therms || 0)) * 0.0053;
    const SCOPE2 = (Number(b.kwh || 0)) * 0.000389; // US grid avg
    const EEIO: Record<string, number> = { logistics: 0.5, electronics: 0.4, services: 0.1, food: 0.6, construction: 0.7, default: 0.3 };
    let SCOPE3 = 0;
    for (const [cat, usd] of Object.entries(b.scope3_usd || {})) {
      SCOPE3 += (Number(usd) * (EEIO[cat] ?? EEIO.default)) / 1000;
    }
    const total = SCOPE1 + SCOPE1_GAS + SCOPE2 + SCOPE3;
    return res.json({
      scope1_fleet: Math.round(SCOPE1 * 100) / 100,
      scope1_natural_gas: Math.round(SCOPE1_GAS * 100) / 100,
      scope2_electricity: Math.round(SCOPE2 * 100) / 100,
      scope3_procurement: Math.round(SCOPE3 * 100) / 100,
      total_mt_co2e: Math.round(total * 100) / 100,
    });
  } catch (e: any) {
    return res.status(500).json({ error: 'calc failed' });
  }
});

export default router;
