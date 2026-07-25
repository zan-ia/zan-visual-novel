import { z } from 'zod';
export declare const userRoleSchema: z.ZodEnum<["player", "creator", "admin"]>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    displayName: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["player", "creator", "admin"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    displayName: string;
    role: "player" | "creator" | "admin";
}, {
    email: string;
    password: string;
    displayName: string;
    role?: "player" | "creator" | "admin" | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    socialLinks: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    displayName?: string | undefined;
    bio?: string | undefined;
    avatarUrl?: string | undefined;
    socialLinks?: Record<string, string> | undefined;
}, {
    displayName?: string | undefined;
    bio?: string | undefined;
    avatarUrl?: string | undefined;
    socialLinks?: Record<string, string> | undefined;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export declare const vnStatusSchema: z.ZodEnum<["draft", "published", "archived", "under_review"]>;
export declare const ageRatingSchema: z.ZodEnum<["general", "teen", "mature"]>;
export declare const createVNSchema: z.ZodObject<{
    title: z.ZodString;
    synopsis: z.ZodString;
    ageRating: z.ZodDefault<z.ZodEnum<["general", "teen", "mature"]>>;
    priceCredits: z.ZodDefault<z.ZodNumber>;
    iaEnabled: z.ZodDefault<z.ZodBoolean>;
    iaSystemPrompt: z.ZodOptional<z.ZodString>;
    iaPersona: z.ZodOptional<z.ZodString>;
    iaMaxTokens: z.ZodDefault<z.ZodNumber>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    synopsis: string;
    ageRating: "general" | "teen" | "mature";
    priceCredits: number;
    iaEnabled: boolean;
    iaMaxTokens: number;
    tags: string[];
    iaSystemPrompt?: string | undefined;
    iaPersona?: string | undefined;
}, {
    title: string;
    synopsis: string;
    ageRating?: "general" | "teen" | "mature" | undefined;
    priceCredits?: number | undefined;
    iaEnabled?: boolean | undefined;
    iaSystemPrompt?: string | undefined;
    iaPersona?: string | undefined;
    iaMaxTokens?: number | undefined;
    tags?: string[] | undefined;
}>;
export declare const updateVNSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    synopsis: z.ZodOptional<z.ZodString>;
    ageRating: z.ZodOptional<z.ZodDefault<z.ZodEnum<["general", "teen", "mature"]>>>;
    priceCredits: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    iaEnabled: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    iaSystemPrompt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    iaPersona: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    iaMaxTokens: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["draft", "published", "archived", "under_review"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "published" | "archived" | "under_review" | undefined;
    title?: string | undefined;
    synopsis?: string | undefined;
    ageRating?: "general" | "teen" | "mature" | undefined;
    priceCredits?: number | undefined;
    iaEnabled?: boolean | undefined;
    iaSystemPrompt?: string | undefined;
    iaPersona?: string | undefined;
    iaMaxTokens?: number | undefined;
    tags?: string[] | undefined;
}, {
    status?: "draft" | "published" | "archived" | "under_review" | undefined;
    title?: string | undefined;
    synopsis?: string | undefined;
    ageRating?: "general" | "teen" | "mature" | undefined;
    priceCredits?: number | undefined;
    iaEnabled?: boolean | undefined;
    iaSystemPrompt?: string | undefined;
    iaPersona?: string | undefined;
    iaMaxTokens?: number | undefined;
    tags?: string[] | undefined;
}>;
export type CreateVNInput = z.infer<typeof createVNSchema>;
export type UpdateVNInput = z.infer<typeof updateVNSchema>;
export declare const chapterStatusSchema: z.ZodEnum<["draft", "published"]>;
export declare const createChapterSchema: z.ZodObject<{
    title: z.ZodString;
    priceCredits: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    priceCredits: number;
}, {
    title: string;
    priceCredits?: number | undefined;
}>;
export declare const textBlockSchema: z.ZodObject<{
    type: z.ZodEnum<["narration", "dialogue", "thought"]>;
    speaker: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    style: z.ZodDefault<z.ZodEnum<["normal", "italic", "bold"]>>;
}, "strip", z.ZodTypeAny, {
    type: "narration" | "dialogue" | "thought";
    text: string;
    style: "normal" | "italic" | "bold";
    speaker?: string | undefined;
}, {
    type: "narration" | "dialogue" | "thought";
    text: string;
    speaker?: string | undefined;
    style?: "normal" | "italic" | "bold" | undefined;
}>;
export declare const sceneTypeSchema: z.ZodEnum<["narration", "dialogue", "choice", "ending"]>;
export declare const createSceneSchema: z.ZodObject<{
    title: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["narration", "dialogue", "choice", "ending"]>>;
    content: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["narration", "dialogue", "thought"]>;
        speaker: z.ZodOptional<z.ZodString>;
        text: z.ZodString;
        style: z.ZodDefault<z.ZodEnum<["normal", "italic", "bold"]>>;
    }, "strip", z.ZodTypeAny, {
        type: "narration" | "dialogue" | "thought";
        text: string;
        style: "normal" | "italic" | "bold";
        speaker?: string | undefined;
    }, {
        type: "narration" | "dialogue" | "thought";
        text: string;
        speaker?: string | undefined;
        style?: "normal" | "italic" | "bold" | undefined;
    }>, "many">;
    nextSceneId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "narration" | "dialogue" | "choice" | "ending";
    title: string;
    content: {
        type: "narration" | "dialogue" | "thought";
        text: string;
        style: "normal" | "italic" | "bold";
        speaker?: string | undefined;
    }[];
    nextSceneId?: string | undefined;
}, {
    title: string;
    content: {
        type: "narration" | "dialogue" | "thought";
        text: string;
        speaker?: string | undefined;
        style?: "normal" | "italic" | "bold" | undefined;
    }[];
    type?: "narration" | "dialogue" | "choice" | "ending" | undefined;
    nextSceneId?: string | undefined;
}>;
export declare const createChoiceSchema: z.ZodObject<{
    text: z.ZodString;
    targetSceneId: z.ZodString;
    orderIndex: z.ZodDefault<z.ZodNumber>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    text: string;
    targetSceneId: string;
    orderIndex: number;
    isDefault: boolean;
}, {
    text: string;
    targetSceneId: string;
    orderIndex?: number | undefined;
    isDefault?: boolean | undefined;
}>;
export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type CreateSceneInput = z.infer<typeof createSceneSchema>;
export type CreateChoiceInput = z.infer<typeof createChoiceSchema>;
export declare const createSaveSchema: z.ZodObject<{
    vnId: z.ZodString;
    slotNumber: z.ZodNumber;
    label: z.ZodDefault<z.ZodString>;
    currentSceneId: z.ZodString;
    flags: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    choiceHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
        sceneId: z.ZodString;
        choiceId: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sceneId: string;
        choiceId: string;
        timestamp: string;
    }, {
        sceneId: string;
        choiceId: string;
        timestamp: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    vnId: string;
    slotNumber: number;
    label: string;
    currentSceneId: string;
    flags: Record<string, unknown>;
    choiceHistory: {
        sceneId: string;
        choiceId: string;
        timestamp: string;
    }[];
}, {
    vnId: string;
    slotNumber: number;
    currentSceneId: string;
    label?: string | undefined;
    flags?: Record<string, unknown> | undefined;
    choiceHistory?: {
        sceneId: string;
        choiceId: string;
        timestamp: string;
    }[] | undefined;
}>;
export type CreateSaveInput = z.infer<typeof createSaveSchema>;
export declare const creditPackageSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    credits: z.ZodNumber;
    priceCents: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    credits: number;
    priceCents: number;
}, {
    id: string;
    name: string;
    credits: number;
    priceCents: number;
}>;
export declare const checkoutSchema: z.ZodObject<{
    packageId: z.ZodString;
    successUrl: z.ZodOptional<z.ZodString>;
    cancelUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    packageId: string;
    successUrl?: string | undefined;
    cancelUrl?: string | undefined;
}, {
    packageId: string;
    successUrl?: string | undefined;
    cancelUrl?: string | undefined;
}>;
export declare const spendCreditsSchema: z.ZodObject<{
    vnId: z.ZodString;
    chapterId: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    vnId: string;
    amount: number;
    chapterId?: string | undefined;
}, {
    vnId: string;
    amount: number;
    chapterId?: string | undefined;
}>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type SpendCreditsInput = z.infer<typeof spendCreditsSchema>;
export declare const llmModelTypeSchema: z.ZodEnum<["lfm-230m", "lfm-350m", "lfm-1.2b-thinking", "lfm-vl-450m"]>;
export declare const llmGenerateSchema: z.ZodObject<{
    prompt: z.ZodString;
    context: z.ZodObject<{
        storyTitle: z.ZodString;
        currentScene: z.ZodString;
        characterNames: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        recentHistory: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        flags: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        flags: Record<string, unknown>;
        storyTitle: string;
        currentScene: string;
        characterNames: string[];
        recentHistory: string[];
    }, {
        storyTitle: string;
        currentScene: string;
        flags?: Record<string, unknown> | undefined;
        characterNames?: string[] | undefined;
        recentHistory?: string[] | undefined;
    }>;
    config: z.ZodObject<{
        modelType: z.ZodDefault<z.ZodEnum<["lfm-230m", "lfm-350m", "lfm-1.2b-thinking", "lfm-vl-450m"]>>;
        temperature: z.ZodDefault<z.ZodNumber>;
        maxTokens: z.ZodDefault<z.ZodNumber>;
        topP: z.ZodDefault<z.ZodNumber>;
        systemPrompt: z.ZodDefault<z.ZodString>;
        persona: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        modelType: "lfm-230m" | "lfm-350m" | "lfm-1.2b-thinking" | "lfm-vl-450m";
        temperature: number;
        maxTokens: number;
        topP: number;
        systemPrompt: string;
        persona: string;
    }, {
        modelType?: "lfm-230m" | "lfm-350m" | "lfm-1.2b-thinking" | "lfm-vl-450m" | undefined;
        temperature?: number | undefined;
        maxTokens?: number | undefined;
        topP?: number | undefined;
        systemPrompt?: string | undefined;
        persona?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    prompt: string;
    context: {
        flags: Record<string, unknown>;
        storyTitle: string;
        currentScene: string;
        characterNames: string[];
        recentHistory: string[];
    };
    config: {
        modelType: "lfm-230m" | "lfm-350m" | "lfm-1.2b-thinking" | "lfm-vl-450m";
        temperature: number;
        maxTokens: number;
        topP: number;
        systemPrompt: string;
        persona: string;
    };
}, {
    prompt: string;
    context: {
        storyTitle: string;
        currentScene: string;
        flags?: Record<string, unknown> | undefined;
        characterNames?: string[] | undefined;
        recentHistory?: string[] | undefined;
    };
    config: {
        modelType?: "lfm-230m" | "lfm-350m" | "lfm-1.2b-thinking" | "lfm-vl-450m" | undefined;
        temperature?: number | undefined;
        maxTokens?: number | undefined;
        topP?: number | undefined;
        systemPrompt?: string | undefined;
        persona?: string | undefined;
    };
}>;
export type LLMGenerateInput = z.infer<typeof llmGenerateSchema>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    pageSize?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type PaginationInput = z.infer<typeof paginationSchema>;
//# sourceMappingURL=index.d.ts.map