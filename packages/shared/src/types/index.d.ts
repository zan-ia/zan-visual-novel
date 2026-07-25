export type UserRole = 'player' | 'creator' | 'admin';
export interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: UserRole;
    creditsBalance: number;
    bio: string | null;
    socialLinks: Record<string, string> | null;
    createdAt: string;
    updatedAt: string;
}
export interface UserSession {
    id: string;
    userId: string;
    refreshToken: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: string;
    createdAt: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: User;
}
export type VNStatus = 'draft' | 'published' | 'archived' | 'under_review';
export type AgeRating = 'general' | 'teen' | 'mature';
export interface VisualNovel {
    id: string;
    creatorId: string;
    title: string;
    synopsis: string;
    coverUrl: string | null;
    status: VNStatus;
    ageRating: AgeRating;
    totalChapters: number;
    priceCredits: number;
    iaEnabled: boolean;
    iaSystemPrompt: string | null;
    iaPersona: string | null;
    iaMaxTokens: number;
    metadata: Record<string, unknown> | null;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    creator?: User;
    tags?: string[];
}
export type ChapterStatus = 'draft' | 'published';
export interface Chapter {
    id: string;
    vnId: string;
    title: string;
    orderIndex: number;
    status: ChapterStatus;
    priceCredits: number;
    startSceneId: string | null;
    scenes?: Scene[];
    createdAt: string;
    updatedAt: string;
}
export type SceneType = 'narration' | 'dialogue' | 'choice' | 'ending';
export interface TextBlock {
    type: 'narration' | 'dialogue' | 'thought';
    speaker?: string;
    text: string;
    style?: 'normal' | 'italic' | 'bold';
}
export interface Scene {
    id: string;
    chapterId: string;
    title: string;
    type: SceneType;
    content: TextBlock[];
    nextSceneId: string | null;
    metadata: Record<string, unknown> | null;
    choices?: Choice[];
    assets?: SceneAsset[];
    createdAt: string;
    updatedAt: string;
}
export interface Choice {
    id: string;
    sceneId: string;
    text: string;
    targetSceneId: string;
    orderIndex: number;
    isDefault: boolean;
    conditions?: ChoiceCondition[];
    effects?: ChoiceEffect[];
}
export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'exists';
export interface ChoiceCondition {
    id: string;
    choiceId: string;
    variableName: string;
    operator: ConditionOperator;
    value: unknown;
}
export type EffectAction = 'set' | 'add' | 'toggle' | 'push';
export interface ChoiceEffect {
    id: string;
    choiceId: string;
    variableName: string;
    action: EffectAction;
    value: unknown;
}
export type AssetType = 'image' | 'audio' | 'video';
export type AssetRole = 'background' | 'sprite' | 'music' | 'sfx' | 'video';
export interface Asset {
    id: string;
    ownerId: string;
    filename: string;
    originalName: string;
    type: AssetType;
    mimeType: string;
    sizeBytes: number;
    storageUrl: string;
    thumbnailUrl: string | null;
    width: number | null;
    height: number | null;
    durationSeconds: number | null;
    createdAt: string;
}
export interface SceneAsset {
    id: string;
    sceneId: string;
    assetId: string;
    role: AssetRole;
    orderIndex: number;
    config: AssetConfig | null;
    asset?: Asset;
}
export interface AssetConfig {
    position?: {
        x: number;
        y: number;
    };
    size?: {
        width: number;
        height: number;
    };
    opacity?: number;
    animation?: 'fadeIn' | 'slideIn' | 'none';
    loop?: boolean;
    autoplay?: boolean;
}
export interface SaveData {
    id: string;
    userId: string;
    vnId: string;
    slotNumber: number;
    label: string;
    currentSceneId: string;
    flags: Record<string, unknown>;
    choiceHistory: ChoiceRecord[];
    createdAt: string;
    updatedAt: string;
}
export interface ChoiceRecord {
    sceneId: string;
    choiceId: string;
    timestamp: string;
}
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export interface ChapterProgress {
    id: string;
    userId: string;
    chapterId: string;
    status: ProgressStatus;
    startedAt: string | null;
    completedAt: string | null;
}
export type TransactionType = 'purchase' | 'spend' | 'refund' | 'creator_earning' | 'withdraw';
export interface CreditTransaction {
    id: string;
    userId: string;
    type: TransactionType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    referenceId: string | null;
    stripeSessionId: string | null;
    description: string | null;
    createdAt: string;
}
export interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    priceCents: number;
    isActive: boolean;
}
export type EarningStatus = 'pending' | 'available' | 'withdrawn';
export interface CreatorEarning {
    id: string;
    creatorId: string;
    transactionId: string;
    amount: number;
    status: EarningStatus;
    earnedAt: string;
    withdrawnAt: string | null;
}
export interface VNState {
    currentSceneId: string;
    flags: Map<string, unknown>;
    history: ChoiceRecord[];
    variables: Map<string, unknown>;
}
export type LLMModelType = 'lfm-230m' | 'lfm-350m' | 'lfm-1.2b-thinking' | 'lfm-vl-450m';
export interface LLMConfig {
    modelType: LLMModelType;
    temperature: number;
    maxTokens: number;
    topP: number;
    systemPrompt: string;
    persona: string;
}
export interface LLMGenerateRequest {
    prompt: string;
    context: LLMContext;
    config: LLMConfig;
}
export interface LLMContext {
    storyTitle: string;
    currentScene: string;
    characterNames: string[];
    recentHistory: string[];
    flags: Record<string, unknown>;
}
export interface LLMGenerateResponse {
    text: string;
    modelUsed: LLMModelType;
    isLocal: boolean;
    tokensUsed: number;
    duration: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface ApiError {
    statusCode: number;
    message: string;
    code: string;
    details?: unknown;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
}
//# sourceMappingURL=index.d.ts.map