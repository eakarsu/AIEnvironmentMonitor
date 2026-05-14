/**
 * Apply pass 5 — backlog endpoints (AIEnvironmentMonitor)
 *
 * ENV vars referenced (gates, return 503 + missing: <ENV> when unset):
 *   GREEN_BUTTON_API_KEY    — utility/Green Button per-utility credential.
 *                              Gate /api/ai/smart-meter/* endpoints.
 *   GREEN_BUTTON_BASE_URL   — utility endpoint base; gate as above.
 *   OPENROUTER_API_KEY      — already used elsewhere; gate AI offset matching.
 *
 * PRODUCT-DECISION items:
 *   - Carbon-offset marketplace: vendor list is curated in-memory (well-known
 *     registries); settlement/KYC EXPLICITLY out-of-scope. Endpoints expose:
 *       GET    /api/ai/offset-marketplace/vendors      — curated catalog
 *       POST   /api/ai/offset-marketplace/match        — AI-rank vendors for a target tonnage (NEEDS-CREDS for AI)
 *       POST   /api/ai/offset-marketplace/intent       — record a *purchase intent* row only;
 *         Settlement/payment/KYC are explicitly NOT IMPLEMENTED.
 *   - Public leaderboards (TOO-RISKY): provide an OPT-IN, anonymized ranking
 *     per metric. User must call /opt-in to appear. Anonymized as
 *     "user-####" (last 4 of sha256). No name/email exposure.
 *
 * NEW TABLES (additive, IF NOT EXISTS):
 *   smart_meter_readings, offset_intents, leaderboard_optins
 */
import express, { Response } from 'express';
import crypto from 'crypto';
import pool from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { analyzeWithAI } from '../services/openrouter';

const router = express.Router();

// ── Idempotent table init ──────────────────────────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS smart_meter_readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    utility VARCHAR(120),
    meter_id VARCHAR(120),
    reading_at TIMESTAMP NOT NULL,
    kwh NUMERIC(10,3),
    therms NUMERIC(10,3),
    raw JSONB,
    source VARCHAR(40) DEFAULT 'mock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch((e: any) => console.error('smart_meter_readings init err:', e.message));

pool.query(`
  CREATE TABLE IF NOT EXISTS offset_intents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    vendor_id VARCHAR(60) NOT NULL,
    tonnes_co2e NUMERIC(10,3) NOT NULL,
    notes TEXT,
    status VARCHAR(40) DEFAULT 'intent_recorded',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch((e: any) => console.error('offset_intents init err:', e.message));

pool.query(`
  CREATE TABLE IF NOT EXISTS leaderboard_optins (
    user_id INTEGER PRIMARY KEY,
    anon_handle VARCHAR(40) NOT NULL,
    opted_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch((e: any) => console.error('leaderboard_optins init err:', e.message));

// ── Helpers ────────────────────────────────────────────────────
function need503ForGreenButton(res: Response): boolean {
  const apiKey = process.env.GREEN_BUTTON_API_KEY;
  const baseUrl = process.env.GREEN_BUTTON_BASE_URL;
  if (!apiKey || apiKey === 'your_green_button_api_key_here') {
    res.status(503).json({ error: 'Smart-meter integration not configured', missing: 'GREEN_BUTTON_API_KEY' });
    return true;
  }
  if (!baseUrl) {
    res.status(503).json({ error: 'Smart-meter integration not configured', missing: 'GREEN_BUTTON_BASE_URL' });
    return true;
  }
  return false;
}

function need503ForAi(res: Response): boolean {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k || k === 'your_openrouter_api_key_here') {
    res.status(503).json({ error: 'AI not configured', missing: 'OPENROUTER_API_KEY' });
    return true;
  }
  return false;
}

function anonHandle(userId: number): string {
  const h = crypto.createHash('sha256').update(`leaderboard:${userId}`).digest('hex');
  return `user-${h.slice(0, 6)}`;
}

// ══════════════════════════════════════════════════════════════
// Smart-meter / Green Button
// ══════════════════════════════════════════════════════════════
// Production-style endpoints. Live fetch is gated behind creds (returns 503).
// We expose a manual `/ingest` POST that does NOT need creds — the user can
// push readings from their own ESPI/Green Button XML export.

router.get('/smart-meter/status', authenticateToken, async (_req: AuthRequest, res: Response) => {
  res.json({
    configured: !!(process.env.GREEN_BUTTON_API_KEY && process.env.GREEN_BUTTON_BASE_URL),
    missing: [
      ...(!process.env.GREEN_BUTTON_API_KEY ? ['GREEN_BUTTON_API_KEY'] : []),
      ...(!process.env.GREEN_BUTTON_BASE_URL ? ['GREEN_BUTTON_BASE_URL'] : []),
    ],
    note: 'Live fetch requires per-utility Green Button credentials. /ingest works without creds.',
  });
});

router.post('/smart-meter/sync', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (need503ForGreenButton(res)) return;
  // PRODUCT-DECISION: actual Green Button OAuth dance is per-utility. We mark
  // this as configured but no-op (clients should call /ingest instead).
  res.json({
    status: 'noop',
    note: 'Green Button credentials present but no-op stub — implement utility-specific OAuth.',
  });
});

router.post('/smart-meter/ingest', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { readings } = req.body || {};
    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ error: 'readings (non-empty array) required' });
    }
    const inserted: number[] = [];
    for (const r of readings.slice(0, 1000)) {
      try {
        const ins = await pool.query(
          `INSERT INTO smart_meter_readings (user_id, utility, meter_id, reading_at, kwh, therms, raw, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8) RETURNING id`,
          [
            req.user?.id || null,
            r.utility || null,
            r.meter_id || null,
            r.reading_at || new Date().toISOString(),
            r.kwh ?? null,
            r.therms ?? null,
            JSON.stringify(r.raw || {}),
            'manual',
          ]
        );
        inserted.push(ins.rows[0].id);
      } catch (e: any) {
        console.error('ingest row err:', e.message);
      }
    }
    res.json({ inserted: inserted.length, ids: inserted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/smart-meter/readings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '100'), 10) || 100, 500);
    const r = await pool.query(
      `SELECT id, utility, meter_id, reading_at, kwh, therms, source, created_at
       FROM smart_meter_readings WHERE user_id = $1 ORDER BY reading_at DESC LIMIT $2`,
      [req.user?.id || null, limit]
    );
    res.json({ readings: r.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// Carbon-offset marketplace
// ══════════════════════════════════════════════════════════════
// PRODUCT-DECISION: curated catalog only. No payment, no KYC, no settlement.
// Vendors are well-known public registries (Verra, Gold Standard, etc).
// Records `intent` rows; a real implementation would integrate Stripe + KYC.

const OFFSET_VENDORS = [
  { id: 'verra-vcs',         name: 'Verra (VCS)',          type: 'registry',  url: 'https://verra.org/programs/verified-carbon-standard/', avg_price_usd_per_t: 14, project_types: ['REDD+', 'renewable energy', 'methane'] },
  { id: 'gold-standard',     name: 'Gold Standard',        type: 'registry',  url: 'https://www.goldstandard.org/',                          avg_price_usd_per_t: 18, project_types: ['cookstoves', 'water', 'reforestation'] },
  { id: 'climate-action-r',  name: 'Climate Action Reserve', type: 'registry', url: 'https://www.climateactionreserve.org/',                 avg_price_usd_per_t: 16, project_types: ['forestry', 'agriculture', 'mine methane'] },
  { id: 'puro-earth',        name: 'Puro.earth',           type: 'registry',  url: 'https://puro.earth/',                                    avg_price_usd_per_t: 130, project_types: ['biochar', 'bio-oil', 'mineralization'] },
  { id: 'cdr-fyi',           name: 'CDR.fyi (curated)',    type: 'index',     url: 'https://www.cdr.fyi/',                                   avg_price_usd_per_t: 200, project_types: ['durable CDR'] },
];

router.get('/offset-marketplace/vendors', authenticateToken, async (_req: AuthRequest, res: Response) => {
  res.json({ vendors: OFFSET_VENDORS, disclaimer: 'Curated catalog only. No payment/KYC integration.' });
});

router.post('/offset-marketplace/match', authenticateToken, aiRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    if (need503ForAi(res)) return;
    const tonnes = Number(req.body?.tonnes_co2e || 1);
    const preferences = req.body?.preferences || {};
    const prompt = `You are a carbon offset advisor. Rank these vendors for a buyer wanting ${tonnes} tCO2e of offsets.

Vendors: ${JSON.stringify(OFFSET_VENDORS)}
Buyer preferences: ${JSON.stringify(preferences)}

Provide:
1. RANKED VENDORS: top 3 with rationale referencing buyer prefs
2. PROJECT TYPE RECOMMENDATIONS: which project types suit this buyer
3. DURABILITY VS COST tradeoff
4. RED FLAGS: what to verify before purchasing
5. ESTIMATED TOTAL COST RANGE

Return JSON.`;
    const result = await analyzeWithAI(prompt, `Offset match for ${tonnes} tCO2e`);
    res.json({ tonnes_co2e: tonnes, result, disclaimer: 'Advisory only — verify directly with vendor.' });
  } catch (err: any) {
    console.error('offset match err:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/offset-marketplace/intent', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { vendor_id, tonnes_co2e, notes } = req.body || {};
    if (!vendor_id || !OFFSET_VENDORS.find((v) => v.id === vendor_id)) {
      return res.status(400).json({ error: 'vendor_id is required and must be a known vendor' });
    }
    const t = Number(tonnes_co2e);
    if (!isFinite(t) || t <= 0) return res.status(400).json({ error: 'tonnes_co2e must be > 0' });
    const ins = await pool.query(
      `INSERT INTO offset_intents (user_id, vendor_id, tonnes_co2e, notes) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user?.id || null, vendor_id, t, notes || null]
    );
    res.json({
      intent: ins.rows[0],
      disclaimer: 'Intent-only record. NO payment processed, NO KYC performed. Settlement is out-of-scope.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/offset-marketplace/intents', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const r = await pool.query(`SELECT * FROM offset_intents WHERE user_id = $1 ORDER BY created_at DESC`, [req.user?.id || null]);
    res.json({ intents: r.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// Public leaderboards (opt-in, anonymized)
// ══════════════════════════════════════════════════════════════
// TOO-RISKY-mitigated: opt-in only; identifier is sha256-derived
// `user-XXXXXX` handle; NO email/name returned.

router.post('/leaderboard/opt-in', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Auth required' });
    const handle = anonHandle(userId);
    await pool.query(
      `INSERT INTO leaderboard_optins (user_id, anon_handle) VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, handle]
    );
    res.json({ opted_in: true, anon_handle: handle, note: 'Opt-out via DELETE /leaderboard/opt-in' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/leaderboard/opt-in', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(`DELETE FROM leaderboard_optins WHERE user_id = $1`, [req.user?.id || null]);
    res.json({ opted_out: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leaderboard/:metric', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const metric = String(req.params.metric || '').toLowerCase();
    const allowed: Record<string, string> = {
      // metric → SQL aggregation. Each must be a join through leaderboard_optins.
      // Lower is better for emissions; higher is better for goals.
      'lowest-carbon': `
        SELECT lo.anon_handle AS handle, COALESCE(SUM(cf.amount), 0)::float AS value
        FROM leaderboard_optins lo
        LEFT JOIN carbon_footprints cf ON cf.user_id = lo.user_id
        GROUP BY lo.anon_handle
        ORDER BY value ASC
        LIMIT 50
      `,
      'most-recycling': `
        SELECT lo.anon_handle AS handle, COUNT(r.id)::int AS value
        FROM leaderboard_optins lo
        LEFT JOIN recycling_logs r ON r.user_id = lo.user_id
        GROUP BY lo.anon_handle
        ORDER BY value DESC
        LIMIT 50
      `,
    };
    const sql = allowed[metric];
    if (!sql) {
      return res.status(400).json({ error: 'metric must be one of: lowest-carbon, most-recycling' });
    }
    let rows: any[] = [];
    try {
      const r = await pool.query(sql);
      rows = r.rows;
    } catch (e: any) {
      // table may not exist — return empty rather than 500
      console.error('leaderboard query err (likely missing source table):', e.message);
      rows = [];
    }
    res.json({
      metric,
      entries: rows,
      note: 'Anonymized opt-in leaderboard. Email/name never exposed.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
