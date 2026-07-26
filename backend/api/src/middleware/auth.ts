import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'player' | 'creator' | 'admin';
}

declare module 'express' {
  interface Request {
    user?: AuthPayload;
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { statusCode: 401, message: 'Token não fornecido', code: 'UNAUTHORIZED' },
    });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { statusCode: 401, message: 'Token inválido ou expirado', code: 'UNAUTHORIZED' },
    });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      req.user = jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
      // Ignore — user stays undefined
    }
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { statusCode: 401, message: 'Não autenticado', code: 'UNAUTHORIZED' },
      });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' },
      });
      return;
    }
    next();
  };
}
