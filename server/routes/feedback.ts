import express from 'express';
import pool from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { feedbackValidation } from '../middleware/validation';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM feedback');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT f.*, u.name as user_name FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       ORDER BY f.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ data: result.rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

router.post('/', authenticateToken, feedbackValidation as any, async (req: AuthRequest, res: express.Response) => {
  try {
    const { rating, comment, category } = req.body;
    const result = await pool.query(
      'INSERT INTO feedback (user_id, rating, comment, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user!.id, rating, comment, category || 'general']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM feedback WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

export default router;
