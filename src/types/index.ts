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

export interface VideoGenerationParams {
    promptImage: string;
    promptText: string;
    duration: 5 | 10;
    ratio: "1280:720" | "720:1280" | "1104:832" | "832:1104" | "960:960" | "1584:672" | "1280:768" | "768:1280";
}

export interface ApiResponse<T> {
    data?: T;
    errors?: Array<{ message: string }>;
}

export type AIOperation = 'upscaleImage' | 'generateImage' | 'outpaint' | 'inpaint';
export type AIProvider = 'gemini' | 'runway' | 'replicate'; 