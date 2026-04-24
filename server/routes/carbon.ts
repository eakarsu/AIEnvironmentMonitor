import express from 'express';
import pool from '../database/db';
import { analyzeCarbonFootprint } from '../services/openrouter';
import { carbonValidation } from '../middleware/validation';

const router = express.Router();

// Get all carbon footprints (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 0;

    if (page > 0 && limit > 0) {
      const offset = (page - 1) * limit;
      const countResult = await pool.query('SELECT COUNT(*) FROM carbon_footprints');
      const total = parseInt(countResult.rows[0].count);
      const result = await pool.query('SELECT * FROM carbon_footprints ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
      return res.json({ data: result.rows, total, page, totalPages: Math.ceil(total / limit) });
    }

    const result = await pool.query('SELECT * FROM carbon_footprints ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching carbon footprints:', error);
    res.status(500).json({ error: 'Failed to fetch carbon footprints' });
  }
});

// Get single carbon footprint
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM carbon_footprints WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Carbon footprint not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching carbon footprint:', error);
    res.status(500).json({ error: 'Failed to fetch carbon footprint' });
  }
});

// Create carbon footprint
router.post('/', carbonValidation as any, async (req: express.Request, res: express.Response) => {
  try {
    const { activity_name, category, emission_source, co2_kg, ch4_kg, n2o_kg, total_co2e, date } = req.body;

    const result = await pool.query(
      `INSERT INTO carbon_footprints (activity_name, category, emission_source, co2_kg, ch4_kg, n2o_kg, total_co2e, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [activity_name, category, emission_source, co2_kg, ch4_kg, n2o_kg, total_co2e, date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating carbon footprint:', error);
    res.status(500).json({ error: 'Failed to create carbon footprint' });
  }
});

// Update carbon footprint
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { activity_name, category, emission_source, co2_kg, ch4_kg, n2o_kg, total_co2e, date } = req.body;

    const result = await pool.query(
      `UPDATE carbon_footprints
       SET activity_name = $1, category = $2, emission_source = $3, co2_kg = $4,
           ch4_kg = $5, n2o_kg = $6, total_co2e = $7, date = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [activity_name, category, emission_source, co2_kg, ch4_kg, n2o_kg, total_co2e, date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Carbon footprint not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating carbon footprint:', error);
    res.status(500).json({ error: 'Failed to update carbon footprint' });
  }
});

// Delete carbon footprint
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM carbon_footprints WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Carbon footprint not found' });
    }

    res.json({ message: 'Carbon footprint deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting carbon footprint:', error);
    res.status(500).json({ error: 'Failed to delete carbon footprint' });
  }
});

// AI Analysis endpoint
router.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM carbon_footprints WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Carbon footprint not found' });
    }

    const carbonData = result.rows[0];
    const aiAnalysis = await analyzeCarbonFootprint(carbonData);

    await pool.query(
      `UPDATE carbon_footprints SET ai_analysis = $1, reduction_tips = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [aiAnalysis.analysis, JSON.stringify(aiAnalysis.recommendations), id]
    );

    res.json({
      item: carbonData,
      aiAnalysis
    });
  } catch (error: any) {
    console.error('Error analyzing carbon footprint:', error);
    res.status(500).json({ error: 'Failed to analyze carbon footprint' });
  }
});

export default router;
