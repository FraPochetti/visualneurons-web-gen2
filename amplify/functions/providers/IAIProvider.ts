// amplify/functions/providers/IAIProvider.ts
export type AIOperation = 'generateImage' | 'upscaleImage' | 'inpaint' | 'outpaint' | 'recolor';

// For provider-level metadata (no model required)
export interface ProviderMetadata {
    serviceProvider: "replicate" | "stability" | "clipdrop" | "user";
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
    // Updated return types
    getProviderInfo(): ProviderMetadata;
    getModelInfo(operation: AIOperation): ModelMetadata;

    // Existing methods
    generateImage(prompt: string, promptUpsampling?: boolean): Promise<string>;
    upscaleImage(imageUrl: string): Promise<string>;
}