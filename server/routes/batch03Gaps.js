// ============================================================
// === Batch 03 Gaps & Frontend Mounts ===
// Auto-generated Gap-feature endpoints (lean v0).
// TODO: configure credentials (set OPENROUTER_API_KEY).
// ============================================================
const express = require('express');
const router = express.Router();

let _gfReady = false;
async function ensureGapTable(pool) {
  if (_gfReady || !pool) return;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS gap_features (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(120) NOT NULL,
      user_id INT,
      input JSONB,
      output JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    _gfReady = true;
  } catch (_) { /* tolerant of missing DB */ }
}

async function callAI(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, status: 503, error: 'AI service unavailable. Set OPENROUTER_API_KEY (TODO: configure credentials).' };
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
    });
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return { ok: r.ok, status: r.status, text, raw: data };
  } catch (e) {
    return { ok: false, status: 500, error: String(e.message || e) };
  }
}

function buildHandler(slug, label, hint) {
  return async (req, res) => {
    const body = req.body || {};
    const userId = req.user?.id || null;
    const prompt = `Feature: ${label}\nContext hint: ${hint}\nUser input:\n${JSON.stringify(body, null, 2)}\n\nProduce a concise, actionable response.`;
    const ai = await callAI(prompt);
    try {
      const pool = req.app.locals.pool || req.app.get('pool') || null;
      if (pool) {
        await ensureGapTable(pool);
        await pool.query('INSERT INTO gap_features(slug, user_id, input, output) VALUES ($1,$2,$3,$4)',
          [slug, userId, body, { text: ai.text || ai.error || null }]);
      }
    } catch (_) { /* tolerant */ }
    if (!ai.ok) return res.status(ai.status || 500).json({ error: ai.error || ai.text || `Upstream error (${ai.status})`, slug });
    res.json({ slug, label, result: ai.text });
  };
}

router.post('/gap-no-carbon-offset-marketplace-agent', buildHandler('gap-ai-no-carbon-offset-marketplace-agent', 'No carbon-offset marketplace agent', 'No carbon-offset marketplace agent'));
router.post('/gap-no-scope-3-supply-chain-auto-aggregation', buildHandler('gap-ai-no-scope-3-supply-chain-auto-aggregation', 'No Scope-3 supply-chain auto-aggregation', 'No Scope-3 supply-chain auto-aggregation'));
router.post('/gap-no-team-gamification-logic', buildHandler('gap-ai-no-team-gamification-logic', 'No team gamification logic', 'No team gamification logic'));
router.post('/gap-no-team-management-endpoint-observed-single-tenant-feel', buildHandler('gap-non-no-team-management-endpoint-observed-single-tenant-feel', 'No team-management endpoint observed (single-tenant feel)', 'No team-management endpoint observed (single-tenant feel)'));
router.post('/gap-no-leaderboards-gamification-module', buildHandler('gap-non-no-leaderboards-gamification-module', 'No leaderboards / gamification module', 'No leaderboards / gamification module'));
router.post('/gap-limited-utility-api-integration-no-opower-style-connector', buildHandler('gap-non-limited-utility-api-integration-no-opower-style-connector', 'Limited utility-API integration (no Opower-style connector)', 'Limited utility-API integration (no Opower-style connector)'));
router.post('/gap-no-payment-marketplace-processing', buildHandler('gap-non-no-payment-marketplace-processing', 'No payment/marketplace processing', 'No payment/marketplace processing'));

module.exports = router;
