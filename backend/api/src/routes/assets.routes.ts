import { Router } from 'express';
import multer from 'multer';
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
        ownerId: req.user!.userId,
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
