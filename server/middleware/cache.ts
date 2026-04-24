import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET') {
    return next();
  }

  const key = req.originalUrl;
  const cached = cache.get(key);

  if (cached) {
    return res.json(cached);
  }

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    cache.set(key, body);
    return originalJson(body);
  };

  next();
};

export const invalidateCache = (patterns: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      const keys = cache.keys();
      keys.forEach(key => {
        if (patterns.some(pattern => key.includes(pattern))) {
          cache.del(key);
        }
      });
    }
    next();
  };
};

export const clearCache = () => cache.flushAll();
