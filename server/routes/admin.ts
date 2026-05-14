import express from 'express';
import pool from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const requireAdmin = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    // Fast path: trust JWT-embedded role.
    if (req.user?.role === 'admin') return next();
    // Fallback: verify against DB for legacy tokens missing the role claim.
    const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.user!.id]);
    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT id, email, name, role, email_verified, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({ data: result.rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users, weather, carbon, recycling, energy, water, auditLogs] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM weather_impacts'),
      pool.query('SELECT COUNT(*) FROM carbon_footprints'),
      pool.query('SELECT COUNT(*) FROM recycling_items'),
      pool.query('SELECT COUNT(*) FROM energy_usages'),
      pool.query('SELECT COUNT(*) FROM water_quality'),
      pool.query('SELECT COUNT(*) FROM audit_logs'),
    ]);

    res.json({
      users: parseInt(users.rows[0].count),
      weather_impacts: parseInt(weather.rows[0].count),
      carbon_footprints: parseInt(carbon.rows[0].count),
      recycling_items: parseInt(recycling.rows[0].count),
      energy_usages: parseInt(energy.rows[0].count),
      water_quality: parseInt(water.rows[0].count),
      audit_logs: parseInt(auditLogs.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM audit_logs');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT al.*, u.email as user_email, u.name as user_name
       FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ data: result.rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
