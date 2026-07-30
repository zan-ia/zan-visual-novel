// ── API ──────────────────────────────────────────────────
export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
// ── Auth ─────────────────────────────────────────────────
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const BCRYPT_ROUNDS = 12;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 30;
// ── Credits ──────────────────────────────────────────────
export const CREATOR_REVENUE_SHARE = 0.7; // 70% creator, 30% platform
export const MIN_WITHDRAW_CREDITS = 100;
export const REFUND_WINDOW_HOURS = 24;
export const REFUND_MAX_SCENE_INDEX = 2;
// ── Credit Packages ──────────────────────────────────────
export const CREDIT_PACKAGES = [
  { id: 'small', name: 'Pacote Pequeno', credits: 10, priceCents: 500 }, // R$ 5,00
  { id: 'medium', name: 'Pacote Médio', credits: 25, priceCents: 1000 }, // R$ 10,00
  { id: 'large', name: 'Pacote Grande', credits: 60, priceCents: 2000 }, // R$ 20,00
  { id: 'xlarge', name: 'Pacote Extra', credits: 150, priceCents: 5000 }, // R$ 50,00
];
// ── Saves ────────────────────────────────────────────────
export const MAX_SAVE_SLOTS = 5;
// ── LLM ──────────────────────────────────────────────────
export const DEFAULT_LLM_MODEL = 'lfm-350m';
export const DEFAULT_LLM_TEMPERATURE = 0.7;
export const DEFAULT_LLM_MAX_TOKENS = 500;
export const DEFAULT_LLM_TOP_P = 0.9;
export const MAX_CONTEXT_HISTORY = 10;
// ── Assets ───────────────────────────────────────────────
export const MAX_ASSET_SIZE_MB = 50;
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
// ── Content ──────────────────────────────────────────────
export const MIN_SCENES_TO_PUBLISH = 2;
export const MIN_CHAPTERS_TO_PUBLISH = 1;
// ── Validation ───────────────────────────────────────────
export const MAX_TITLE_LENGTH = 200;
export const MAX_SYNOPSIS_LENGTH = 2000;
export const MAX_TEXT_BLOCK_LENGTH = 5000;
export const MAX_CHOICE_TEXT_LENGTH = 500;
export const MAX_TAGS = 10;
//# sourceMappingURL=index.js.map
