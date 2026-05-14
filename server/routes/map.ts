/**
 * Geofenced Map endpoint.
 * GET /api/map?bbox=minLng,minLat,maxLng,maxLat
 *
 * Returns GeoJSON FeatureCollection for weather + water samples that have
 * latitude/longitude. Latitude/longitude columns are added on first call
 * via idempotent ALTER TABLE.
 */
import express, { Response } from 'express';
import pool from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

let schemaReady = false;
async function ensureSchema() {
  if (schemaReady) return;
  await pool.query(`ALTER TABLE weather_impacts ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION`).catch(() => {});
  await pool.query(`ALTER TABLE weather_impacts ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION`).catch(() => {});
  await pool.query(`ALTER TABLE water_quality ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION`).catch(() => {});
  await pool.query(`ALTER TABLE water_quality ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION`).catch(() => {});
  schemaReady = true;
}

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await ensureSchema();
    const userId = req.user!.id;

    let bbox: number[] | null = null;
    if (req.query.bbox) {
      const parts = String(req.query.bbox).split(',').map(Number);
      if (parts.length === 4 && parts.every(n => Number.isFinite(n))) bbox = parts;
    }

    const where = bbox
      ? `WHERE longitude BETWEEN $2 AND $4 AND latitude BETWEEN $3 AND $5`
      : ``;
    const params: any[] = [userId];
    if (bbox) params.push(...bbox);

    const fetch = async (table: string, kind: string) => {
      try {
        const r = await pool.query(
          `SELECT * FROM ${table}
           WHERE latitude IS NOT NULL AND longitude IS NOT NULL
             AND (user_id IS NULL OR user_id = $1)
             ${bbox ? `AND longitude BETWEEN $2 AND $4 AND latitude BETWEEN $3 AND $5` : ''}
           ORDER BY created_at DESC LIMIT 500`,
          params
        );
        return r.rows.map(row => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [row.longitude, row.latitude] },
          properties: { kind, ...row },
        }));
      } catch {
        return [];
      }
    };

    const [weather, water] = await Promise.all([
      fetch('weather_impacts', 'weather'),
      fetch('water_quality', 'water'),
    ]);

    res.json({
      type: 'FeatureCollection',
      features: [...weather, ...water],
    });
  } catch (err: any) {
    console.error('[map] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch map data' });
  }
});

export default router;
