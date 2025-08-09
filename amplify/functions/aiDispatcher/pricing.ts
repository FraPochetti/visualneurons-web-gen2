export type ProviderName = 'replicate' | 'stability' | 'gemini';
export type OperationName = 'generateImage' | 'upscaleImage' | 'styleTransfer' | 'outpaint' | 'inpaint';

// Central registry for per-call pricing (USD). Fill with accurate values per provider/model/operation.
// You can override via environment variables if desired later.
const PRICES_USD: Record<ProviderName, Record<OperationName, Record<string, number>>> = {
    replicate: {
        generateImage: {
            'black-forest-labs/flux-1.1-pro-ultra': 0.0052,
        },
        upscaleImage: {
            'philz1337x/clarity-upscaler': 0.0104,
        },
        styleTransfer: {},
        outpaint: {},
        inpaint: {},
    },
    stability: {
        generateImage: {
            'stable-diffusion-ultra': 0.0020,
        },
        upscaleImage: {},
        styleTransfer: {
            'stable-image/control/style': 0.0080,
        },
        outpaint: {
            'stable-image/edit/outpaint': 0.0100,
        },
        inpaint: {},
    },
    gemini: {
        generateImage: {
            'gemini-2.0-flash-exp-image-generation': 0.0025,
        },
        upscaleImage: {},
        styleTransfer: {},
        outpaint: {},
        inpaint: {},
    },
};

export function getOperationPriceUsd(
    provider: string,
    operation: string,
    model: string
): number {
    const p = (provider || '').toLowerCase() as ProviderName;
    const o = operation as OperationName;
    const byOp = PRICES_USD[p]?.[o];
    if (byOp && model && typeof byOp[model] === 'number') return byOp[model];
    // Fallback per provider/operation if model key missing
    const values = byOp ? Object.values(byOp) : [];
    if (values.length > 0) return values[0];
    return 0.01; // default minimal placeholder
}


