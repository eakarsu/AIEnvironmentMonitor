import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import pool from './database/db';

// Middleware
import { generalLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/logger';
import { cacheMiddleware, invalidateCache } from './middleware/cache';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth';
import weatherRoutes from './routes/weather';
import carbonRoutes from './routes/carbon';
import recyclingRoutes from './routes/recycling';
import energyRoutes from './routes/energy';
import waterRoutes from './routes/water';
import profileRoutes from './routes/profile';
import settingsRoutes from './routes/settings';
import searchRoutes from './routes/search';
import exportRoutes from './routes/export';
import notificationRoutes from './routes/notifications';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';
import feedbackRoutes from './routes/feedback';
import contactRoutes from './routes/contact';
import docsRoutes from './routes/docs';
import alertsRoutes from './routes/alerts';
import aiNewRoutes from './routes/aiNew';
import aiBacklogRoutes from './routes/aiBacklog';
import ingestRoutes from './routes/ingest';
import pdfReportRoutes from './routes/pdfReport';
import mapRoutes from './routes/map';
import goalsRoutes from './routes/goals';
import { startAnomalyWorker } from './services/anomalyWorker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api/', generalLimiter);

// Caching for GET requests
app.use('/api/weather', cacheMiddleware, invalidateCache(['/api/weather']));
app.use('/api/carbon', cacheMiddleware, invalidateCache(['/api/carbon']));
app.use('/api/recycling', cacheMiddleware, invalidateCache(['/api/recycling']));
app.use('/api/energy', cacheMiddleware, invalidateCache(['/api/energy']));
app.use('/api/water', cacheMiddleware, invalidateCache(['/api/water']));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/recycling', recyclingRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/ai', aiNewRoutes);
// Apply pass 5 — backlog: smart-meter, offset marketplace, leaderboards
app.use('/api/ai', aiBacklogRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/pdf-report', pdfReportRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/realtime-carbon', require('./routes/realtimeCarbonTracker').default);
app.use('/api/offset-marketplace', require('./routes/offsetMarketplace').default);
app.use('/api/scope3-supply-chain', require('./routes/scope3SupplyChain').default);
app.use('/api/workplace-gamification', require('./routes/workplaceGamification').default);
app.use('/api/smb-scope-wizard', require('./routes/smbScopeWizard').default);
app.use('/api/behavioural-nudges', require('./routes/behaviouralNudges').default);
app.use('/api/utility-api-ingest', require('./routes/utilityApiIngest').default);

// Enhanced Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      message: 'AI Environment Monitor API is running',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbCheck.rows.length > 0 ? 'connected' : 'disconnected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Service degraded',
      database: 'disconnected'
    });
  }
});

// === Batch 03 Gaps & Frontend Mounts ===
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const _batch03 = require('./routes/batch03Gaps');
  app.use('/api', _batch03);
} catch (_e) { /* batch03 gap routes optional */ }

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log(`AI Environment Monitor API Ready\n`);
  // Kick off background AI anomaly auto-alerts.
  startAnomalyWorker();
});

export default app;
