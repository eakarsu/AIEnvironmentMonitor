import express from 'express';
import pool from '../database/db';
import { analyzeRecyclingItem } from '../services/openrouter';
import { recyclingValidation } from '../middleware/validation';

const router = express.Router();

// Get all recycling items (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 0;

    if (page > 0 && limit > 0) {
      const offset = (page - 1) * limit;
      const countResult = await pool.query('SELECT COUNT(*) FROM recycling_items');
      const total = parseInt(countResult.rows[0].count);
      const result = await pool.query('SELECT * FROM recycling_items ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
      return res.json({ data: result.rows, total, page, totalPages: Math.ceil(total / limit) });
    }

    const result = await pool.query('SELECT * FROM recycling_items ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching recycling items:', error);
    res.status(500).json({ error: 'Failed to fetch recycling items' });
  }
});

// Get single recycling item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM recycling_items WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recycling item not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching recycling item:', error);
    res.status(500).json({ error: 'Failed to fetch recycling item' });
  }
});

// Create recycling item
router.post('/', recyclingValidation as any, async (req: express.Request, res: express.Response) => {
  try {
    const { item_name, material_type, category, recyclable, special_instructions, environmental_impact } = req.body;

    const result = await pool.query(
      `INSERT INTO recycling_items (item_name, material_type, category, recyclable, special_instructions, environmental_impact)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [item_name, material_type, category, recyclable, special_instructions, environmental_impact]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating recycling item:', error);
    res.status(500).json({ error: 'Failed to create recycling item' });
  }
});

// Update recycling item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, material_type, category, recyclable, special_instructions, environmental_impact } = req.body;

    const result = await pool.query(
      `UPDATE recycling_items
       SET item_name = $1, material_type = $2, category = $3, recyclable = $4,
           special_instructions = $5, environmental_impact = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [item_name, material_type, category, recyclable, special_instructions, environmental_impact, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recycling item not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating recycling item:', error);
    res.status(500).json({ error: 'Failed to update recycling item' });
  }
});

// Delete recycling item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM recycling_items WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recycling item not found' });
    }

    res.json({ message: 'Recycling item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting recycling item:', error);
    res.status(500).json({ error: 'Failed to delete recycling item' });
  }
});

// AI Analysis endpoint
router.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM recycling_items WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recycling item not found' });
    }

    const recyclingData = result.rows[0];
    const aiAnalysis = await analyzeRecyclingItem(recyclingData);

    await pool.query(
      `UPDATE recycling_items SET ai_analysis = $1, disposal_method = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [aiAnalysis.analysis, JSON.stringify(aiAnalysis.recommendations), id]
    );

    res.json({
      item: recyclingData,
      aiAnalysis
    });
  } catch (error: any) {
    console.error('Error analyzing recycling item:', error);
    res.status(500).json({ error: 'Failed to analyze recycling item' });
  }
});

export default router;
