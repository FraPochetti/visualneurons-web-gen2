import type { AIOperation } from './IAIProvider';

/**
 * Map of provider names to the operations they support.
 */
export const OPERATION_MAP: Record<string, AIOperation[]> = {
    replicate: ['generateImage', 'upscaleImage'],
    stability: ['generateImage', 'upscaleImage', 'outpaint', 'styleTransfer'],
    gemini: ['generateImage', 'inpaint'],
    runway: ['generateVideo'],
};

export type ProviderName = keyof typeof OPERATION_MAP;
