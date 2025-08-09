export type OperationName = 'generateImage' | 'upscaleImage' | 'styleTransfer' | 'outpaint' | 'inpaint';

export interface ProviderInfo {
    serviceProvider: 'replicate' | 'stability' | 'gemini';
    apiEndpoint?: string;
}

export interface ModelInfo {
    modelName: string;
    modelVersion?: string;
    serviceProvider: ProviderInfo['serviceProvider'];
    displayName?: string;
    modelUrl?: string;
}

const providerInfos: Record<ProviderInfo['serviceProvider'], ProviderInfo> = {
    replicate: {
        serviceProvider: 'replicate',
        apiEndpoint: 'https://api.replicate.com/v1/predictions',
    },
    stability: {
        serviceProvider: 'stability',
        apiEndpoint: 'https://api.stability.ai/v2beta',
    },
    gemini: {
        serviceProvider: 'gemini',
        apiEndpoint: 'https://api.google.com/genai',
    },
};

export function getProviderInfo(provider: ProviderInfo['serviceProvider']): ProviderInfo {
    return providerInfos[provider] || { serviceProvider: provider } as ProviderInfo;
}

export function getModelInfo(provider: ProviderInfo['serviceProvider'], operation: OperationName): ModelInfo {
    switch (provider) {
        case 'replicate':
            switch (operation) {
                case 'generateImage':
                    return {
                        modelName: 'black-forest-labs/flux-1.1-pro-ultra',
                        serviceProvider: 'replicate',
                        displayName: 'Flux 1.1 Pro Ultra',
                        modelUrl: 'https://replicate.com/black-forest-labs/flux-1.1-pro-ultra',
                    };
                case 'upscaleImage':
                    return {
                        modelName: 'philz1337x/clarity-upscaler',
                        modelVersion: 'dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e',
                        serviceProvider: 'replicate',
                        displayName: 'Clarity Upscaler',
                        modelUrl: 'https://replicate.com/philz1337x/clarity-upscaler',
                    };
                default:
                    throw new Error(`Operation ${operation} not supported by Replicate`);
            }
        case 'stability':
            switch (operation) {
                case 'generateImage':
                    return {
                        modelName: 'stable-diffusion-ultra',
                        modelVersion: 'v2',
                        serviceProvider: 'stability',
                        displayName: 'Stable Diffusion Ultra',
                        modelUrl: 'https://stability.ai/stable-image',
                    };
                case 'styleTransfer':
                    return {
                        modelName: 'stable-image/control/style',
                        serviceProvider: 'stability',
                        displayName: 'Style Transfer',
                        modelUrl: 'https://stability.ai/stable-image',
                    };
                case 'outpaint':
                    return {
                        modelName: 'stable-image/edit/outpaint',
                        serviceProvider: 'stability',
                        displayName: 'Stable Diffusion Outpaint',
                        modelUrl: 'https://stability.ai/stable-image',
                    };
                default:
                    throw new Error(`Operation ${operation} not supported by Stability`);
            }
        case 'gemini':
            switch (operation) {
                case 'generateImage':
                    return {
                        modelName: 'gemini-2.0-flash-exp-image-generation',
                        modelVersion: 'experimental',
                        serviceProvider: 'gemini',
                        displayName: 'Gemini 2.0 Flash Experimental',
                        modelUrl: 'https://developers.google.com/genai/gemini',
                    };
                case 'inpaint':
                    return {
                        modelName: 'gemini-2.0-flash-exp-image-generation',
                        modelVersion: 'experimental',
                        serviceProvider: 'gemini',
                        displayName: 'Gemini 2.0 Editor',
                        modelUrl: 'https://developers.google.com/genai/gemini',
                    };
                default:
                    throw new Error(`Operation ${operation} not supported by Gemini`);
            }
        default:
            throw new Error(`Provider ${provider} not supported`);
    }
}


