import express from 'express';
import pool from '../database/db';
import { analyzeEnergyUsage } from '../services/openrouter';
import { energyValidation } from '../middleware/validation';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Get all energy usages (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 0;

    if (page > 0 && limit > 0) {
      const offset = (page - 1) * limit;
      const countResult = await pool.query('SELECT COUNT(*) FROM energy_usages');
      const total = parseInt(countResult.rows[0].count);
      const result = await pool.query('SELECT * FROM energy_usages ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
      return res.json({ data: result.rows, total, page, totalPages: Math.ceil(total / limit) });
    }

    const result = await pool.query('SELECT * FROM energy_usages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching energy usages:', error);
    res.status(500).json({ error: 'Failed to fetch energy usages' });
  }
});

// Get single energy usage
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM energy_usages WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Energy usage not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching energy usage:', error);
    res.status(500).json({ error: 'Failed to fetch energy usage' });
  }
});

// Create energy usage
router.post('/', energyValidation as any, async (req: express.Request, res: express.Response) => {
  try {
    const { device_name, category, power_watts, usage_hours, daily_kwh, monthly_kwh, monthly_cost, efficiency_rating } = req.body;

    const result = await pool.query(
      `INSERT INTO energy_usages (device_name, category, power_watts, usage_hours, daily_kwh, monthly_kwh, monthly_cost, efficiency_rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [device_name, category, power_watts, usage_hours, daily_kwh, monthly_kwh, monthly_cost, efficiency_rating]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating energy usage:', error);
    res.status(500).json({ error: 'Failed to create energy usage' });
  }
});

// Update energy usage
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { device_name, category, power_watts, usage_hours, daily_kwh, monthly_kwh, monthly_cost, efficiency_rating } = req.body;

    const result = await pool.query(
      `UPDATE energy_usages
       SET device_name = $1, category = $2, power_watts = $3, usage_hours = $4,
           daily_kwh = $5, monthly_kwh = $6, monthly_cost = $7, efficiency_rating = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [device_name, category, power_watts, usage_hours, daily_kwh, monthly_kwh, monthly_cost, efficiency_rating, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Energy usage not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating energy usage:', error);
    res.status(500).json({ error: 'Failed to update energy usage' });
  }
});

// Delete energy usage
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM energy_usages WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Energy usage not found' });
    }

    res.json({ message: 'Energy usage deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting energy usage:', error);
    res.status(500).json({ error: 'Failed to delete energy usage' });
  }
});

// AI Analysis endpoint
router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM energy_usages WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Energy usage not found' });
    }

    const energyData = result.rows[0];
    const aiAnalysis = await analyzeEnergyUsage(energyData);

    await pool.query(
      `UPDATE energy_usages SET ai_analysis = $1, optimization_tips = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [aiAnalysis.analysis, JSON.stringify(aiAnalysis.recommendations), id]
    );

    res.json({
      item: energyData,
      aiAnalysis
    });
  } catch (error: any) {
    console.error('Error analyzing energy usage:', error);
    res.status(500).json({ error: 'Failed to analyze energy usage' });
  }
});

export default router;
