import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    name: 'AI Environment Monitor API',
    version: '1.0.0',
    endpoints: [
      { method: 'POST', path: '/api/auth/login', description: 'User login' },
      { method: 'POST', path: '/api/auth/register', description: 'User registration' },
      { method: 'GET', path: '/api/auth/demo', description: 'Get demo credentials' },
      { method: 'POST', path: '/api/auth/forgot-password', description: 'Request password reset' },
      { method: 'POST', path: '/api/auth/reset-password', description: 'Reset password with token' },
      { method: 'POST', path: '/api/auth/refresh', description: 'Refresh JWT token' },

      { method: 'GET', path: '/api/profile', description: 'Get user profile' },
      { method: 'PUT', path: '/api/profile', description: 'Update user profile' },
      { method: 'PUT', path: '/api/profile/password', description: 'Change password' },

      { method: 'GET', path: '/api/settings', description: 'Get user settings' },
      { method: 'PUT', path: '/api/settings', description: 'Update user settings' },

      { method: 'GET/POST/PUT/DELETE', path: '/api/weather', description: 'Weather impacts CRUD' },
      { method: 'GET/POST/PUT/DELETE', path: '/api/carbon', description: 'Carbon footprints CRUD' },
      { method: 'GET/POST/PUT/DELETE', path: '/api/recycling', description: 'Recycling items CRUD' },
      { method: 'GET/POST/PUT/DELETE', path: '/api/energy', description: 'Energy usages CRUD' },
      { method: 'GET/POST/PUT/DELETE', path: '/api/water', description: 'Water quality CRUD' },

      { method: 'POST', path: '/api/:feature/:id/analyze', description: 'AI analysis for any feature' },

      { method: 'GET', path: '/api/search?q=term', description: 'Search across all data' },
      { method: 'GET', path: '/api/export/:type?format=csv|json', description: 'Export data' },

      { method: 'GET', path: '/api/notifications', description: 'Get user notifications' },
      { method: 'GET', path: '/api/notifications/unread-count', description: 'Get unread count' },
      { method: 'PUT', path: '/api/notifications/:id/read', description: 'Mark notification as read' },
      { method: 'PUT', path: '/api/notifications/read-all', description: 'Mark all as read' },

      { method: 'POST', path: '/api/upload', description: 'Upload a file' },

      { method: 'GET', path: '/api/admin/users', description: 'List all users (admin only)' },
      { method: 'GET', path: '/api/admin/stats', description: 'System statistics (admin only)' },
      { method: 'GET', path: '/api/admin/audit-logs', description: 'Audit logs (admin only)' },

      { method: 'GET/POST/DELETE', path: '/api/feedback', description: 'User feedback' },
      { method: 'GET/POST/PUT', path: '/api/contact', description: 'Support tickets' },

      { method: 'GET', path: '/api/health', description: 'Health check' },
      { method: 'GET', path: '/api/docs', description: 'API documentation' },
    ],
    pagination: 'All list endpoints support ?page=1&limit=20',
    authentication: 'Bearer token in Authorization header',
  });
});

export default router;
