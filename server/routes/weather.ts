import express from 'express';
import pool from '../database/db';
import { analyzeWeatherImpact } from '../services/openrouter';
import { weatherValidation } from '../middleware/validation';

const router = express.Router();

// Get all weather impacts (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 0;

    if (page > 0 && limit > 0) {
      const offset = (page - 1) * limit;
      const countResult = await pool.query('SELECT COUNT(*) FROM weather_impacts');
      const total = parseInt(countResult.rows[0].count);
      const result = await pool.query('SELECT * FROM weather_impacts ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
      return res.json({ data: result.rows, total, page, totalPages: Math.ceil(total / limit) });
    }

    const result = await pool.query('SELECT * FROM weather_impacts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching weather impacts:', error);
    res.status(500).json({ error: 'Failed to fetch weather impacts' });
  }
});

// Get single weather impact
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM weather_impacts WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Weather impact not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching weather impact:', error);
    res.status(500).json({ error: 'Failed to fetch weather impact' });
  }
});

// Create weather impact
router.post('/', weatherValidation as any, async (req: express.Request, res: express.Response) => {
  try {
    const { crop_name, location, weather_condition, temperature, humidity, rainfall, impact_level } = req.body;

    const result = await pool.query(
      `INSERT INTO weather_impacts (crop_name, location, weather_condition, temperature, humidity, rainfall, impact_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [crop_name, location, weather_condition, temperature, humidity, rainfall, impact_level]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating weather impact:', error);
    res.status(500).json({ error: 'Failed to create weather impact' });
  }
});

// Update weather impact
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { crop_name, location, weather_condition, temperature, humidity, rainfall, impact_level } = req.body;

    const result = await pool.query(
      `UPDATE weather_impacts
       SET crop_name = $1, location = $2, weather_condition = $3, temperature = $4,
           humidity = $5, rainfall = $6, impact_level = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [crop_name, location, weather_condition, temperature, humidity, rainfall, impact_level, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Weather impact not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating weather impact:', error);
    res.status(500).json({ error: 'Failed to update weather impact' });
  }
});

// Delete weather impact
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM weather_impacts WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Weather impact not found' });
    }

    res.json({ message: 'Weather impact deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting weather impact:', error);
    res.status(500).json({ error: 'Failed to delete weather impact' });
  }
});

// AI Analysis endpoint
router.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM weather_impacts WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Weather impact not found' });
    }

    const weatherData = result.rows[0];
    const aiAnalysis = await analyzeWeatherImpact(weatherData);

    // Save analysis to database
    await pool.query(
      `UPDATE weather_impacts SET ai_analysis = $1, recommendations = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [aiAnalysis.analysis, JSON.stringify(aiAnalysis.recommendations), id]
    );

    res.json({
      item: weatherData,
      aiAnalysis
    });
  } catch (error: any) {
    console.error('Error analyzing weather impact:', error);
    res.status(500).json({ error: 'Failed to analyze weather impact' });
  }
});

export default router;
