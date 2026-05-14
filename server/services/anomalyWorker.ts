/**
 * AI Anomaly Auto-Alerts background worker.
 *
 * Periodically asks the AI to scan recent data for anomalies in each domain.
 * When the model flags a threshold breach with high confidence, a notification
 * is inserted into `notifications` so the existing SSE alerts stream
 * (`routes/alerts.ts`) and NotificationBell pick it up automatically.
 *
 * Implementation notes:
 * - Pure interval timer (no extra deps).
 * - Self-disables if `ANOMALY_WORKER_ENABLED=false`.
 * - Per-user iteration so notifications stay tenant-scoped.
 */
import pool from '../database/db';
import { analyzeWithAI } from './openrouter';

const DOMAINS: Array<{ name: string; table: string; dateColumn: string }> = [
  { name: 'weather', table: 'weather_impacts', dateColumn: 'created_at' },
  { name: 'carbon',  table: 'carbon_footprints', dateColumn: 'created_at' },
  { name: 'energy',  table: 'energy_usages', dateColumn: 'created_at' },
  { name: 'water',   table: 'water_quality', dateColumn: 'sample_date' },
  { name: 'recycling', table: 'recycling_items', dateColumn: 'created_at' },
];

let started = false;
let timer: NodeJS.Timeout | null = null;

async function ensureNotificationsSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      type VARCHAR(50) DEFAULT 'info',
      domain VARCHAR(50),
      severity VARCHAR(20),
      read BOOLEAN DEFAULT false,
      meta JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(() => { /* table may already exist with slightly different shape */ });
}

async function fetchRecentForUser(userId: number, table: string, dateColumn: string) {
  try {
    const r = await pool.query(
      `SELECT * FROM ${table}
       WHERE ${dateColumn} >= NOW() - INTERVAL '24 hours'
         AND (user_id IS NULL OR user_id = $1)
       ORDER BY ${dateColumn} DESC LIMIT 50`,
      [userId]
    );
    return r.rows;
  } catch {
    const r = await pool.query(
      `SELECT * FROM ${table} WHERE ${dateColumn} >= NOW() - INTERVAL '24 hours' ORDER BY ${dateColumn} DESC LIMIT 50`
    );
    return r.rows;
  }
}

async function scanDomain(userId: number, domain: { name: string; table: string; dateColumn: string }) {
  const rows = await fetchRecentForUser(userId, domain.table, domain.dateColumn);
  if (rows.length === 0) return;

  const prompt = `You are an anomaly-detection AI for environmental telemetry. Inspect the last 24 hours of ${domain.name} records and decide whether any value is a critical anomaly that warrants alerting the user.

Return STRICT JSON with this shape:
{
  "anomaly_detected": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "confidence": number (0..1),
  "title": string,
  "message": string,
  "affected_record_ids": number[]
}

Only set anomaly_detected=true when severity is at least "high" AND confidence >= 0.7.
Records: ${JSON.stringify(rows).slice(0, 6000)}`;

  const result: any = await analyzeWithAI(prompt, `Anomaly scan domain=${domain.name} user=${userId}`);
  if (!result || !result.anomaly_detected) return;
  const sev = String(result.severity || '').toLowerCase();
  const conf = Number(result.confidence || 0);
  if (!['high', 'critical'].includes(sev) || conf < 0.7) return;

  // Avoid duplicate alerts within last 6 hours for the same domain+severity.
  const dup = await pool.query(
    `SELECT id FROM notifications
     WHERE user_id = $1 AND domain = $2 AND severity = $3
       AND created_at >= NOW() - INTERVAL '6 hours' LIMIT 1`,
    [userId, domain.name, sev]
  ).catch(() => ({ rows: [] }));
  if (dup.rows.length > 0) return;

  await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, domain, severity, meta)
     VALUES ($1, $2, $3, 'ai-anomaly', $4, $5, $6::jsonb)`,
    [
      userId,
      String(result.title || `${domain.name} anomaly detected`).slice(0, 255),
      String(result.message || ''),
      domain.name,
      sev,
      JSON.stringify({ confidence: conf, affected: result.affected_record_ids || [] }),
    ]
  ).catch(err => console.error('[anomalyWorker] insert failed:', err.message));
}

async function tick() {
  try {
    const users = await pool.query('SELECT id FROM users');
    for (const u of users.rows) {
      for (const d of DOMAINS) {
        await scanDomain(u.id, d).catch(err => console.error('[anomalyWorker] scan err:', err.message));
      }
    }
  } catch (err: any) {
    console.error('[anomalyWorker] tick failed:', err.message);
  }
}

export function startAnomalyWorker() {
  if (started) return;
  if (process.env.ANOMALY_WORKER_ENABLED === 'false') return;
  started = true;
  ensureNotificationsSchema().catch(() => {});
  // Run once after a short warm-up, then hourly.
  const intervalMs = parseInt(process.env.ANOMALY_WORKER_INTERVAL_MS || '3600000', 10);
  timer = setInterval(() => { tick().catch(() => {}); }, intervalMs);
  setTimeout(() => { tick().catch(() => {}); }, 30_000);
  console.log(`[anomalyWorker] started (interval=${intervalMs}ms)`);
}

export function stopAnomalyWorker() {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}
