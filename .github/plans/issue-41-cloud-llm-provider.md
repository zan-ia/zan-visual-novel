# Implementation Plan — Issue #41

**Issue:** [#41](https://github.com/zan-ia/zan-visual-novel/issues/41) — feat: implement cloud LLM fallback provider
**Type:** feature
**Complexity:** medium
**Date:** 2026-07-27
**Branch:** `feat/cloud-llm-provider`

## Summary

Replace the placeholder in `POST /api/v1/llm/generate` with a real cloud LLM call (OpenAI-compatible API). Add rate limiting (10 req/min per user via Redis) and simple prompt cache (Redis). The client-side `CloudLLMProvider` already works correctly — it calls this endpoint.

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `backend/api/src/lib/llm/cloud-llm.ts` | CREATE | Cloud LLM service (OpenAI-compatible) |
| `backend/api/src/routes/llm.routes.ts` | MODIFY | Replace placeholder with real LLM call |
| `backend/api/src/middleware/rate-limiter.ts` | MODIFY | Add per-route rate limit config for LLM |

## Implementation Order

### Step 1: Cloud LLM Service (`backend/api/src/lib/llm/cloud-llm.ts`)

Create a service that:
- Reads `LLM_API_KEY` and `LLM_API_BASE_URL` from env (default: OpenAI)
- Sends requests to OpenAI-compatible chat completions endpoint
- Handles errors gracefully
- Formats narrative prompts for visual novel context

```typescript
// Configuration from environment
const LLM_API_KEY = process.env.LLM_API_KEY ?? '';
const LLM_API_BASE_URL = process.env.LLM_API_BASE_URL ?? 'https://api.openai.com/v1';
const LLM_MODEL = process.env.LLM_MODEL ?? 'gpt-4o-mini';
```

### Step 2: Update LLM Route (`backend/api/src/routes/llm.routes.ts`)

Replace placeholder with:
- Call cloud LLM service
- Add rate limiting (10 req/min per user)
- Add simple Redis prompt cache (TTL 1h)
- Return proper LLMGenerateResponse

### Step 3: Rate Limiter Config

Update the existing rate limiter middleware to support per-route configurations, or apply a specific rate limit to the LLM route.

## Acceptance Criteria

- [ ] POST /api/v1/llm/generate returns real AI-generated text
- [ ] Uses OpenAI-compatible API (works with Liquid AI, OpenAI, etc.)
- [ ] Rate limited to ~10 req/min per user
- [ ] Prompt cache avoids duplicate calls
