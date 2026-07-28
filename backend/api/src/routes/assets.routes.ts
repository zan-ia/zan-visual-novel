import { Router } from 'express';
import multer from 'multer';
import { eq, and } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
import { getDb, schema } from '../db/index.js';
import { getStorage } from '../lib/storage.js';

// ── Multer (memory storage — file stays in buffer for S3 upload) ──

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'video/mp4',
      'video/webm',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
    }
  },
});

export const assetsRouter = Router();

function getAssetType(mimeType: string): 'image' | 'audio' | 'video' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'video';
}

// POST /api/v1/assets — Upload a new asset
assetsRouter.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { statusCode: 400, message: 'Nenhum arquivo enviado', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    const assetType = getAssetType(req.file.mimetype);

    // Upload to configured storage (local or S3-compatible)
    const storage = getStorage();
    const { url: storageUrl } = await storage.upload(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );

    const [asset] = await getDb()
      .insert(schema.assets)
      .values({
        ownerId: (req as any).user.userId,
        filename: req.file.originalname,
        originalName: req.file.originalname,
        type: assetType,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        storageUrl,
      })
      .returning();

    res.status(201).json({ success: true, data: asset });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    // Multer errors (file too large, wrong field name, etc.)
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: {
          statusCode: 400,
          message: 'Arquivo muito grande. Limite: 50MB.',
          code: 'FILE_TOO_LARGE',
        },
      });
      return;
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        error: {
          statusCode: 400,
          message: 'Campo de arquivo inesperado.',
          code: 'VALIDATION_ERROR',
        },
      });
      return;
    }
    if (error.message?.startsWith('Tipo de arquivo')) {
      res.status(400).json({
        success: false,
        error: {
          statusCode: 400,
          message: error.message ?? 'Validation error',
          code: 'VALIDATION_ERROR',
        },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
    });
  }
});

// GET /api/v1/assets — List user's assets
assetsRouter.get('/', authenticate, async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const db = getDb();
    const userId = (req as any).user.userId;

    const conditions = [eq(schema.assets.ownerId, userId)];
    if (type && ['image', 'audio', 'video'].includes(type)) {
      conditions.push(eq(schema.assets.type, type as 'image' | 'audio' | 'video'));
    }

    const assets = await db
      .select()
      .from(schema.assets)
      .where(and(...conditions))
      .orderBy(schema.assets.createdAt);

    res.json({ success: true, data: assets });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro ao listar assets', code: 'INTERNAL_ERROR' },
    });
  }
});

// DELETE /api/v1/assets/:id — Delete an asset
assetsRouter.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const [asset] = await db
      .select()
      .from(schema.assets)
      .where(eq(schema.assets.id, id as any));

    if (!asset) {
      res.status(404).json({
        success: false,
        error: { statusCode: 404, message: 'Asset não encontrado', code: 'NOT_FOUND' },
      });
      return;
    }

    const userId = (req as any).user.userId;
    if (asset.ownerId !== userId) {
      res.status(403).json({
        success: false,
        error: { statusCode: 403, message: 'Não autorizado', code: 'FORBIDDEN' },
      });
      return;
    }

    // Delete from storage
    try {
      const storage = getStorage();
      await storage.delete(asset.storageUrl);
    } catch {
      // Storage deletion is best-effort; DB deletion is the source of truth
    }

    await db.delete(schema.assets).where(eq(schema.assets.id, id as any));

    res.json({ success: true, data: { deleted: true } });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro ao deletar asset', code: 'INTERNAL_ERROR' },
    });
  }
});
