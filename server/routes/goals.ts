/**
 * AI Goal Coach
 * - POST /api/goals       — create a 90-day reduction target
 * - GET  /api/goals       — list user's goals
 * - DELETE /api/goals/:id — remove a goal
 * - POST /api/goals/:id/coach — manually trigger an AI micro-action update
 *
 * The user picks a domain + target value + deadline; the AI suggests micro
 * actions and stores them in `user_goals.actions`. A daily ticker calls the
 * AI again so the coach stays fresh.
 */
import express, { Response } from 'express';
import pool from '../database/db';
import { analyzeWithAI } from '../services/openrouter';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

let schemaReady = false;
async function ensureSchema() {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      domain VARCHAR(50) NOT NULL,
      target_value NUMERIC,
      baseline_value NUMERIC,
      deadline DATE,
      status VARCHAR(20) DEFAULT 'active',
      actions JSONB,
      progress_pct NUMERIC,
      last_coached_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(() => {});
  schemaReady = true;
}
ensureSchema().catch(() => {});

const ALLOWED_DOMAINS = new Set(['weather', 'carbon', 'energy', 'water', 'recycling']);

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await ensureSchema();
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const offset = (page - 1) * limit;
    const cnt = await pool.query('SELECT COUNT(*)::int AS c FROM user_goals WHERE user_id = $1', [req.user!.id]);
    const rows = await pool.query(
      'SELECT * FROM user_goals WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user!.id, limit, offset]
    );
    res.json({ data: rows.rows, pagination: { page, limit, total: cnt.rows[0].c, totalPages: Math.max(1, Math.ceil(cnt.rows[0].c / limit)) } });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list goals' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await ensureSchema();
    const { domain, target_value, baseline_value, deadline } = req.body || {};
    if (!ALLOWED_DOMAINS.has(domain)) return res.status(400).json({ error: 'Invalid domain' });
    if (target_value == null || isNaN(Number(target_value))) return res.status(400).json({ error: 'target_value required' });
    const dl = deadline ? new Date(deadline) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const r = await pool.query(
      `INSERT INTO user_goals (user_id, domain, target_value, baseline_value, deadline)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user!.id, domain, Number(target_value), baseline_value != null ? Number(baseline_value) : null, dl]
    );
    res.status(201).json(r.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const r = await pool.query(
      'DELETE FROM user_goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

router.post('/:id/coach', authenticateToken, aiRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const r = await pool.query('SELECT * FROM user_goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const goal = r.rows[0];

    const prompt = `You are an environmental goal coach. The user has set a reduction target.
Goal:
  domain: ${goal.domain}
  target_value: ${goal.target_value}
  baseline_value: ${goal.baseline_value ?? 'unknown'}
  deadline: ${goal.deadline}

Return STRICT JSON:
{
  "progress_pct": number (0..100, your best estimate of how on-track they are),
  "micro_actions": [{ "title": string, "description": string, "impact": "low"|"medium"|"high" }],
  "encouragement": string
}
Provide 3-5 micro_actions tailored to ${goal.domain}.`;

    const ai: any = await analyzeWithAI(prompt, `goal_id=${goal.id} user=${req.user!.id}`);
    const progress = Number(ai?.progress_pct || 0);
    await pool.query(
      `UPDATE user_goals SET actions = $1::jsonb, progress_pct = $2, last_coached_at = NOW() WHERE id = $3`,
      [JSON.stringify(ai?.micro_actions || []), isFinite(progress) ? progress : null, goal.id]
    );

    // Fan out a notification so the user sees the new coaching card.
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, domain)
       VALUES ($1, $2, $3, 'goal-coach', $4)`,
      [req.user!.id, `New coaching for your ${goal.domain} goal`, String(ai?.encouragement || '').slice(0, 1000), goal.domain]
    ).catch(() => {});

    res.json({ goal_id: goal.id, ...ai });
  } catch (err: any) {
    console.error('[goals/coach] error:', err.message);
    res.status(500).json({ error: 'Coach failed' });
  }
});

export default router;
