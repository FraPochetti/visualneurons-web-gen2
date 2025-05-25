// amplify/functions/providers/IAIProvider.ts
export type AIOperation =
    | 'generateImage'
    | 'upscaleImage'
    | 'inpaint'
    | 'outpaint'
    | 'recolor'
    | 'styleTransfer';

// For provider-level metadata (no model required)
export interface ProviderMetadata {
    serviceProvider: "replicate" | "stability" | "gemini" | "user";
    apiEndpoint?: string;
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
    inpaint(prompt: string, imageBase64: string): Promise<string>;
}