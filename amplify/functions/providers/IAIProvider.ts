// amplify/functions/providers/IAIProvider.ts
export type AIOperation = 'generateImage' | 'upscaleImage' | 'inpaint' | 'outpaint' | 'recolor' | 'styleTransfer' | 'chatWithImage';

// For provider-level metadata (no model required)
export interface ProviderMetadata {
    serviceProvider: "replicate" | "stability" | "gemini" | "user";
    apiEndpoint?: string;
}

export interface HistoryItem {
    role: 'user' | 'model';
    parts: { text?: string; image?: string }[];
}

// For operation-specific model metadata
export interface ModelMetadata {
    modelName: string;
    modelVersion?: string;
    serviceProvider: string;
    displayName?: string;
    modelUrl?: string;
}

export interface IAIProvider {
    getProviderInfo(): ProviderMetadata;
    getModelInfo(operation: AIOperation): ModelMetadata;
    generateImage(prompt: string, promptUpsampling?: boolean): Promise<string>;
    upscaleImage(imageUrl: string): Promise<string>;
    styleTransfer(prompt: string, styleImageUrl: string): Promise<string>;
    outPaint(imageUrl: string): Promise<string>;
    chatWithImage?(prompt: string, imageUrl: string, history?: HistoryItem[]): Promise<{ text: string | null, image: string | null }>;
}