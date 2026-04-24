import { Request, Response, NextFunction } from 'express';
import pool from '../database/db';
import { AuthRequest } from './auth';

export const auditLog = (action: string, entity: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      const userId = req.user?.id || null;
      const details = JSON.stringify({
        method: req.method,
        path: req.originalUrl,
        body: req.method !== 'GET' ? req.body : undefined,
      });

      pool.query(
        'INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [userId, action, entity, req.params.id || null, details]
      ).catch(() => {});

      return originalJson(body);
    };
    next();
  };
};
