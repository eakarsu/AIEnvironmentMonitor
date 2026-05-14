/**
 * Real-time alerts endpoint using Server-Sent Events (SSE).
 * GET /api/alerts/stream - streams unread notifications to connected clients every 10 seconds.
 */
import express from 'express';
import pool from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// SSE stream endpoint - streams new unread notifications every 10 seconds
router.get('/stream', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering if behind nginx
  res.flushHeaders();

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Alert stream connected', userId })}\n\n`);

  // Track the last notification id seen to avoid re-sending
  let lastSeenId = 0;

  const sendNotifications = async () => {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications
         WHERE user_id = $1 AND read = false AND id > $2
         ORDER BY created_at DESC
         LIMIT 10`,
        [userId, lastSeenId]
      );

      if (result.rows.length > 0) {
        // Update lastSeenId to max id in this batch
        const maxId = Math.max(...result.rows.map((r: any) => r.id));
        if (maxId > lastSeenId) lastSeenId = maxId;

        for (const notification of result.rows) {
          res.write(`data: ${JSON.stringify({ type: 'notification', notification })}\n\n`);
        }
      } else {
        // Send heartbeat to keep connection alive
        res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
      }
    } catch (error: any) {
      console.error('[SSE] Error fetching notifications:', error.message);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to fetch notifications' })}\n\n`);
    }
  };

  // Poll every 10 seconds
  const intervalId = setInterval(sendNotifications, 10000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
    console.log(`[SSE] Client disconnected: user ${userId}`);
  });

  req.on('error', () => {
    clearInterval(intervalId);
  });
});

export default router;
