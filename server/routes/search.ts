import express from 'express';
import pool from '../database/db';
import { searchValidation } from '../middleware/validation';

const router = express.Router();

router.get('/', searchValidation as any, async (req: express.Request, res: express.Response) => {
  try {
    const { q } = req.query;
    const searchTerm = `%${q}%`;

    const [weather, carbon, recycling, energy, water] = await Promise.all([
      pool.query(
        `SELECT id, crop_name as name, location as description, 'weather' as type FROM weather_impacts
         WHERE crop_name ILIKE $1 OR location ILIKE $1 OR weather_condition ILIKE $1 LIMIT 10`,
        [searchTerm]
      ),
      pool.query(
        `SELECT id, activity_name as name, category as description, 'carbon' as type FROM carbon_footprints
         WHERE activity_name ILIKE $1 OR category ILIKE $1 OR emission_source ILIKE $1 LIMIT 10`,
        [searchTerm]
      ),
      pool.query(
        `SELECT id, item_name as name, material_type as description, 'recycling' as type FROM recycling_items
         WHERE item_name ILIKE $1 OR material_type ILIKE $1 OR category ILIKE $1 LIMIT 10`,
        [searchTerm]
      ),
      pool.query(
        `SELECT id, device_name as name, category as description, 'energy' as type FROM energy_usages
         WHERE device_name ILIKE $1 OR category ILIKE $1 LIMIT 10`,
        [searchTerm]
      ),
      pool.query(
        `SELECT id, source_name as name, location as description, 'water' as type FROM water_quality
         WHERE source_name ILIKE $1 OR location ILIKE $1 LIMIT 10`,
        [searchTerm]
      ),
    ]);

    const results = [
      ...weather.rows,
      ...carbon.rows,
      ...recycling.rows,
      ...energy.rows,
      ...water.rows,
    ];

    res.json({ results, total: results.length, query: q });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
