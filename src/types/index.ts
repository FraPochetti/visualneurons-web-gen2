export interface Photo {
    path: string;
    url: string;
    lastModified: Date;
    isAiGenerated: boolean;
}

export interface Message {
    id: string;
    type: 'original' | 'user' | 'ai';
    text: string;
    image?: string;
}

export interface User {
    email: string;
    identityId: string;
}

export interface ImageOperationParams {
    imageUrl: string;
    originalPath: string;
    provider: string;
    operation: string;
}

export interface ApiResponse<T> {
    data?: T;
    errors?: Array<{ message: string }>;
}

export type AIOperation = 'upscaleImage' | 'generateImage' | 'outpaint' | 'inpaint';
export type AIProvider = 'gemini' | 'replicate'; 