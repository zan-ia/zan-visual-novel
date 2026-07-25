export declare const API_VERSION = "v1";
export declare const DEFAULT_PAGE_SIZE = 20;
export declare const MAX_PAGE_SIZE = 100;
export declare const ACCESS_TOKEN_EXPIRY = "15m";
export declare const REFRESH_TOKEN_EXPIRY = "7d";
export declare const BCRYPT_ROUNDS = 12;
export declare const MAX_LOGIN_ATTEMPTS = 5;
export declare const LOGIN_LOCKOUT_MINUTES = 30;
export declare const CREATOR_REVENUE_SHARE = 0.7;
export declare const MIN_WITHDRAW_CREDITS = 100;
export declare const REFUND_WINDOW_HOURS = 24;
export declare const REFUND_MAX_SCENE_INDEX = 2;
export declare const CREDIT_PACKAGES: readonly [{
    readonly id: "small";
    readonly name: "Pacote Pequeno";
    readonly credits: 10;
    readonly priceCents: 500;
}, {
    readonly id: "medium";
    readonly name: "Pacote Médio";
    readonly credits: 25;
    readonly priceCents: 1000;
}, {
    readonly id: "large";
    readonly name: "Pacote Grande";
    readonly credits: 60;
    readonly priceCents: 2000;
}, {
    readonly id: "xlarge";
    readonly name: "Pacote Extra";
    readonly credits: 150;
    readonly priceCents: 5000;
}];
export declare const MAX_SAVE_SLOTS = 5;
export declare const DEFAULT_LLM_MODEL: "lfm-230m";
export declare const DEFAULT_LLM_TEMPERATURE = 0.7;
export declare const DEFAULT_LLM_MAX_TOKENS = 500;
export declare const DEFAULT_LLM_TOP_P = 0.9;
export declare const MAX_CONTEXT_HISTORY = 10;
export declare const MAX_ASSET_SIZE_MB = 50;
export declare const ALLOWED_IMAGE_TYPES: string[];
export declare const ALLOWED_AUDIO_TYPES: string[];
export declare const ALLOWED_VIDEO_TYPES: string[];
export declare const MIN_SCENES_TO_PUBLISH = 2;
export declare const MIN_CHAPTERS_TO_PUBLISH = 1;
export declare const MAX_TITLE_LENGTH = 200;
export declare const MAX_SYNOPSIS_LENGTH = 2000;
export declare const MAX_TEXT_BLOCK_LENGTH = 5000;
export declare const MAX_CHOICE_TEXT_LENGTH = 500;
export declare const MAX_TAGS = 10;
//# sourceMappingURL=index.d.ts.map