import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '@zan-vn/shared';
import { db, schema } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';

export const authRouter = Router();

// POST /api/v1/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, data.email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ success: false, error: { statusCode: 409, message: 'Email já cadastrado', code: 'EMAIL_EXISTS' } });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const [user] = await db.insert(schema.users).values({
      email: data.email,
      passwordHash,
      displayName: data.displayName,
      role: data.role,
    }).returning();

    const accessToken = jwt.sign({ userId: user!.id, email: user!.email, role: user!.role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user!.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    await db.insert(schema.userSessions).values({
      userId: user!.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 900,
        user: { id: user!.id, email: user!.email, displayName: user!.displayName, role: user!.role, creditsBalance: 0 },
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: { statusCode: 400, message: err.errors[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ success: false, error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' } });
  }
});

// POST /api/v1/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, data.email)).limit(1);
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      res.status(401).json({ success: false, error: { statusCode: 401, message: 'Email ou senha inválidos', code: 'INVALID_CREDENTIALS' } });
      return;
    }

    const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    await db.insert(schema.userSessions).values({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 900,
        user: { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl, role: user.role, creditsBalance: user.creditsBalance, bio: user.bio, socialLinks: user.socialLinks, createdAt: user.createdAt, updatedAt: user.updatedAt },
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: { statusCode: 400, message: err.errors[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ success: false, error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' } });
  }
});

// POST /api/v1/auth/refresh
authRouter.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: { statusCode: 400, message: 'Refresh token não fornecido', code: 'VALIDATION_ERROR' } });
      return;
    }

    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
    const [session] = await db.select().from(schema.userSessions).where(eq(schema.userSessions.refreshToken, refreshToken)).limit(1);
    if (!session || new Date() > session.expiresAt) {
      res.status(401).json({ success: false, error: { statusCode: 401, message: 'Refresh token inválido ou expirado', code: 'UNAUTHORIZED' } });
      return;
    }

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId)).limit(1);
    if (!user) {
      res.status(401).json({ success: false, error: { statusCode: 401, message: 'Usuário não encontrado', code: 'UNAUTHORIZED' } });
      return;
    }

    // Rotate refresh token
    await db.delete(schema.userSessions).where(eq(schema.userSessions.id, session.id));
    const newRefreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    await db.insert(schema.userSessions).values({
      userId: user.id,
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '15m' });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
        user: { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl, role: user.role, creditsBalance: user.creditsBalance, bio: user.bio, socialLinks: user.socialLinks, createdAt: user.createdAt, updatedAt: user.updatedAt },
      },
    });
  } catch {
    res.status(401).json({ success: false, error: { statusCode: 401, message: 'Refresh token inválido', code: 'UNAUTHORIZED' } });
  }
});

// GET /api/v1/auth/me
authRouter.get('/me', authenticate, async (req, res) => {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, req.user!.userId)).limit(1);
  if (!user) {
    res.status(404).json({ success: false, error: { statusCode: 404, message: 'Usuário não encontrado', code: 'NOT_FOUND' } });
    return;
  }
  res.json({ success: true, data: user });
});
