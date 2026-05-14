/**
 * PDF Sustainability Report
 * GET /api/pdf-report/:domain
 *
 * Generates a branded PDF for a single domain (or "all") containing the
 * latest counts, recent records, and the most recent AI weekly-digest text
 * so users can hand a regulator-ready summary to stakeholders.
 */
import express, { Response } from 'express';
import PDFDocument from 'pdfkit';
import pool from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const TABLE_BY_DOMAIN: Record<string, { table: string; dateColumn: string }> = {
  weather: { table: 'weather_impacts', dateColumn: 'created_at' },
  carbon: { table: 'carbon_footprints', dateColumn: 'created_at' },
  energy: { table: 'energy_usages', dateColumn: 'created_at' },
  water: { table: 'water_quality', dateColumn: 'sample_date' },
  recycling: { table: 'recycling_items', dateColumn: 'created_at' },
};

router.get('/:domain', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const domain = String(req.params.domain || '').toLowerCase();
    const userId = req.user!.id;
    const domains = domain === 'all' ? Object.keys(TABLE_BY_DOMAIN) : [domain];
    if (!domains.every(d => TABLE_BY_DOMAIN[d])) {
      return res.status(400).json({ error: `Invalid domain. Use one of: ${Object.keys(TABLE_BY_DOMAIN).join(', ')} or "all"` });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="sustainability-${domain}.pdf"`);

    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(22).fillColor('#0f5132').text('Sustainability Report', { align: 'left' });
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#555').text(`Domain: ${domain}    Generated: ${new Date().toISOString()}`);
    doc.moveTo(50, doc.y + 6).lineTo(562, doc.y + 6).strokeColor('#198754').lineWidth(1).stroke();
    doc.moveDown();

    for (const d of domains) {
      const spec = TABLE_BY_DOMAIN[d];
      doc.fontSize(16).fillColor('#0f5132').text(d.toUpperCase());
      doc.moveDown(0.3);

      let recent: any[] = [];
      try {
        const r = await pool.query(
          `SELECT * FROM ${spec.table}
           WHERE (user_id IS NULL OR user_id = $1)
           ORDER BY ${spec.dateColumn} DESC LIMIT 10`,
          [userId]
        );
        recent = r.rows;
      } catch {
        const r = await pool.query(`SELECT * FROM ${spec.table} ORDER BY ${spec.dateColumn} DESC LIMIT 10`);
        recent = r.rows;
      }

      doc.fontSize(11).fillColor('#000').text(`Records (latest 10 of all time): ${recent.length}`);
      doc.moveDown(0.4);
      if (recent.length === 0) {
        doc.fillColor('#666').text('No records found.');
      } else {
        for (const row of recent.slice(0, 5)) {
          const summary = Object.entries(row)
            .filter(([k]) => !['id', 'user_id', 'ai_analysis', 'recommendations'].includes(k))
            .slice(0, 6)
            .map(([k, v]) => `${k}: ${String(v ?? '').slice(0, 40)}`)
            .join('  |  ');
          doc.fontSize(9).fillColor('#222').text(`• ${summary}`);
        }
      }
      doc.moveDown(0.6);
    }

    // Latest AI weekly-digest analysis
    try {
      const ai = await pool.query(
        `SELECT result, created_at FROM ai_results
         WHERE user_id = $1 AND analysis_type = 'weekly-digest'
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      if (ai.rows.length > 0) {
        doc.addPage();
        doc.fontSize(16).fillColor('#0f5132').text('AI Weekly Digest (latest)');
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor('#666').text(`Generated: ${ai.rows[0].created_at}`);
        doc.moveDown();
        const result = ai.rows[0].result;
        const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        doc.fontSize(10).fillColor('#111').text(text.slice(0, 8000), { align: 'left' });
      }
    } catch (err) {
      // Ignore — ai_results may not exist yet.
    }

    doc.end();
  } catch (err: any) {
    console.error('[pdfReport] error:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

export default router;
