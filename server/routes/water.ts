import express from 'express';
import pool from '../database/db';
import { analyzeWaterQuality } from '../services/openrouter';
import { waterValidation } from '../middleware/validation';

const router = express.Router();

// Get all water quality records (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 0;

    if (page > 0 && limit > 0) {
      const offset = (page - 1) * limit;
      const countResult = await pool.query('SELECT COUNT(*) FROM water_quality');
      const total = parseInt(countResult.rows[0].count);
      const result = await pool.query('SELECT * FROM water_quality ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
      return res.json({ data: result.rows, total, page, totalPages: Math.ceil(total / limit) });
    }

    const result = await pool.query('SELECT * FROM water_quality ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching water quality records:', error);
    res.status(500).json({ error: 'Failed to fetch water quality records' });
  }
});

// Get single water quality record
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM water_quality WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Water quality record not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching water quality record:', error);
    res.status(500).json({ error: 'Failed to fetch water quality record' });
  }
});

// Create water quality record
router.post('/', waterValidation as any, async (req: express.Request, res: express.Response) => {
  try {
    const { source_name, location, sample_date, ph_level, turbidity, dissolved_oxygen, nitrate_level, lead_level, bacteria_count, quality_index } = req.body;

    const result = await pool.query(
      `INSERT INTO water_quality (source_name, location, sample_date, ph_level, turbidity, dissolved_oxygen, nitrate_level, lead_level, bacteria_count, quality_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [source_name, location, sample_date, ph_level, turbidity, dissolved_oxygen, nitrate_level, lead_level, bacteria_count, quality_index]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating water quality record:', error);
    res.status(500).json({ error: 'Failed to create water quality record' });
  }
});

// Update water quality record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { source_name, location, sample_date, ph_level, turbidity, dissolved_oxygen, nitrate_level, lead_level, bacteria_count, quality_index } = req.body;

    const result = await pool.query(
      `UPDATE water_quality
       SET source_name = $1, location = $2, sample_date = $3, ph_level = $4, turbidity = $5,
           dissolved_oxygen = $6, nitrate_level = $7, lead_level = $8, bacteria_count = $9,
           quality_index = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 RETURNING *`,
      [source_name, location, sample_date, ph_level, turbidity, dissolved_oxygen, nitrate_level, lead_level, bacteria_count, quality_index, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Water quality record not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating water quality record:', error);
    res.status(500).json({ error: 'Failed to update water quality record' });
  }
});

// Delete water quality record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM water_quality WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Water quality record not found' });
    }

    res.json({ message: 'Water quality record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting water quality record:', error);
    res.status(500).json({ error: 'Failed to delete water quality record' });
  }
});

// AI Analysis endpoint
router.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM water_quality WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Water quality record not found' });
    }

    const waterData = result.rows[0];
    const aiAnalysis = await analyzeWaterQuality(waterData);

    await pool.query(
      `UPDATE water_quality SET ai_analysis = $1, treatment_recommendations = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [aiAnalysis.analysis, JSON.stringify(aiAnalysis.recommendations), id]
    );

    res.json({
      item: waterData,
      aiAnalysis
    });
  } catch (error: any) {
    console.error('Error analyzing water quality:', error);
    res.status(500).json({ error: 'Failed to analyze water quality' });
  }
});

export default router;
