# =============================================================================
# Dockerfile — Zan Visual Novel API Server
# =============================================================================
# Multi-stage build optimized for development and production.
#
# Development:
#   docker compose up api
#   (uses tsx watch for hot reload)
#
# Production:
#   docker build -t zan-vn-api:latest ./backend/api
#   docker run -p 3001:3001 zan-vn-api:latest
# =============================================================================

# ── Base Stage ───────────────────────────────────────────
FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare npm@latest --activate

# ── Development Stage ────────────────────────────────────
FROM base AS development
WORKDIR /app

# Install dependencies (leverage layer caching)
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/api/package.json ./backend/api/

RUN --mount=type=cache,target=/root/.npm npm ci

# Copy source
COPY . .

# Generate Prisma-compatible types if needed
# RUN npm run db:generate

EXPOSE 3001
CMD ["npm", "run", "dev", "--workspace=@zan-vn/api"]

# ── Production Stage ─────────────────────────────────────
FROM base AS production
WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/api/package.json ./backend/api/

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# Copy built source (must run `npm run build` first)
COPY packages/shared/dist ./packages/shared/dist
COPY backend/api/dist ./backend/api/dist
COPY backend/api/package.json ./backend/api/

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "backend/api/dist/server.js"]
