/**
 * Sensor Webhook Ingestion
 * POST /api/ingest/:domain
 *
 * Allows IoT devices (Particle, ESP32, etc.) to push readings into the 5
 * domain tables without going through manual CRUD. Authenticated via an
 * HMAC-SHA256 signature in the `X-Signature` header computed over the raw
 * JSON body using `INGEST_HMAC_SECRET`.
 */
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../database/db';

const router = express.Router();

interface DomainSpec {
  table: string;
  /** Map incoming JSON keys → SQL columns (whitelist). */
  columns: string[];
}

const SPEC: Record<string, DomainSpec> = {
  weather: {
    table: 'weather_impacts',
    columns: ['location', 'temperature', 'humidity', 'precipitation', 'wind_speed', 'condition', 'user_id'],
  },
  carbon: {
    table: 'carbon_footprints',
    columns: ['source', 'activity_type', 'amount', 'unit', 'total_co2e', 'user_id'],
  },
  energy: {
    table: 'energy_usages',
    columns: ['device_name', 'category', 'power_watts', 'usage_hours', 'daily_kwh', 'monthly_kwh', 'monthly_cost', 'efficiency_rating', 'user_id'],
  },
  water: {
    table: 'water_quality',
    columns: ['location', 'ph_level', 'turbidity', 'dissolved_oxygen', 'quality_index', 'sample_date', 'user_id'],
  },
  recycling: {
    table: 'recycling_items',
    columns: ['item_name', 'material_type', 'category', 'recyclable', 'special_instructions', 'environmental_impact', 'user_id'],
  },
};

function timingSafeEqHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// We need the raw body to verify HMAC — register a JSON parser that captures it.
const captureRawBody = express.json({
  verify: (req: any, _res, buf) => { req.rawBody = buf; },
  limit: '100kb',
});

router.post('/:domain', captureRawBody, async (req: Request, res: Response) => {
  try {
    const secret = process.env.INGEST_HMAC_SECRET;
    if (!secret) {
      return res.status(503).json({ error: 'Ingestion disabled (INGEST_HMAC_SECRET not configured)' });
    }
    const signature = String(req.header('x-signature') || '');
    if (!signature) return res.status(401).json({ error: 'Missing X-Signature header' });

    const raw: Buffer = (req as any).rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (!timingSafeEqHex(expected, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const domain = String(req.params.domain || '').toLowerCase();
    const spec = SPEC[domain];
    if (!spec) {
      return res.status(400).json({ error: `Unknown domain. Use one of: ${Object.keys(SPEC).join(', ')}` });
    }

    // Allow either a single object or `{ readings: [...] }` batch.
    const items: any[] = Array.isArray(req.body?.readings)
      ? req.body.readings
      : [req.body];

    if (!items.length || items.every(x => !x || typeof x !== 'object')) {
      return res.status(400).json({ error: 'No readings supplied' });
    }

    const inserted: any[] = [];
    for (const reading of items) {
      const cols: string[] = [];
      const placeholders: string[] = [];
      const values: any[] = [];
      let idx = 1;
      for (const col of spec.columns) {
        if (reading[col] !== undefined) {
          cols.push(col);
          placeholders.push(`$${idx++}`);
          values.push(reading[col]);
        }
      }
      if (!cols.length) continue;
      const sql = `INSERT INTO ${spec.table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;
      try {
        const r = await pool.query(sql, values);
        inserted.push({ id: r.rows[0]?.id });
      } catch (err: any) {
        inserted.push({ error: err.message });
      }
    }

    res.status(201).json({ domain, count: inserted.length, results: inserted });
  } catch (err: any) {
    console.error('[ingest] error:', err.message);
    res.status(500).json({ error: 'Ingestion failed' });
  }
});

export default router;
