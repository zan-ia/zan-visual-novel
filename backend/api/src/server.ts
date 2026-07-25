import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes.js';
import { vnRouter } from './routes/vn.routes.js';
import { savesRouter } from './routes/saves.routes.js';
import { creditsRouter } from './routes/credits.routes.js';
import { llmRouter } from './routes/llm.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { rateLimiter } from './middleware/rate-limiter.js';

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

// ── Routes ──────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/vns', vnRouter);
app.use('/api/v1/saves', savesRouter);
app.use('/api/v1/credits', creditsRouter);
app.use('/api/v1/llm', llmRouter);

// ── Error Handling ──────────────────────────────────────

app.use(errorHandler);

// ── Start ───────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 API running at http://localhost:${PORT}`);
});

export default app;
