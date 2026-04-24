import express from 'express';
import pool from '../database/db';

const router = express.Router();

const tableMap: Record<string, string> = {
  weather: 'weather_impacts',
  carbon: 'carbon_footprints',
  recycling: 'recycling_items',
  energy: 'energy_usages',
  water: 'water_quality',
};

router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const format = (req.query.format as string) || 'json';
    const tableName = tableMap[type];

    if (!tableName) {
      return res.status(400).json({ error: 'Invalid export type. Use: weather, carbon, recycling, energy, water' });
    }

    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);

    if (format === 'csv') {
      if (result.rows.length === 0) {
        return res.status(200).send('No data');
      }
      const headers = Object.keys(result.rows[0]).join(',');
      const rows = result.rows.map(row =>
        Object.values(row).map(v => {
          const str = String(v ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_export.csv`);
      return res.send(csv);
    }

    res.json({ data: result.rows, total: result.rows.length, type });
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
