import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

// Find .env by walking up from current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let dir = __dirname;
while (dir !== path.parse(dir).root) {
  const envPath = path.join(dir, '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
  dir = path.dirname(dir);
}

import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes.js';
import { vnRouter } from './routes/vn.routes.js';
import { savesRouter } from './routes/saves.routes.js';
import { creditsRouter } from './routes/credits.routes.js';
import { llmRouter } from './routes/llm.routes.js';
import { assetsRouter } from './routes/assets.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { createStorageProvider, S3StorageProvider } from './lib/storage.js';

// ── Storage Provider (configured singleton) ─────────────

export const storageProvider = createStorageProvider();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ── Middleware ──────────────────────────────────────────

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL ?? 'http://localhost:5173',
      process.env.DASHBOARD_URL ?? 'http://localhost:5174',
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(rateLimiter);

// Serve local uploads only when using the local storage provider
if (!(storageProvider instanceof S3StorageProvider)) {
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
}

// ── Routes ──────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/vns', vnRouter);
app.use('/api/v1/saves', savesRouter);
app.use('/api/v1/credits', creditsRouter);
app.use('/api/v1/llm', llmRouter);
app.use('/api/v1/assets', assetsRouter);

// ── Error Handling ──────────────────────────────────────

app.use(errorHandler);

// ── Start ───────────────────────────────────────────────

async function start(): Promise<void> {
  // Initialize S3 bucket when using S3-compatible storage
  if (storageProvider instanceof S3StorageProvider) {
    try {
      await storageProvider.ensureBucket();
    } catch (err) {
      console.warn(
        '⚠️ Could not verify/create S3 bucket:',
        (err as Error).message,
      );
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 API running at http://localhost:${PORT}`);
  });
}

start();

export default app;
