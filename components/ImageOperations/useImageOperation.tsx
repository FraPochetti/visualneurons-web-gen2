import { useState, useCallback } from 'react';
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import type { AIOperation } from '@/amplify/functions/providers/IAIProvider';
import { useUpscaler } from './useUpscaler';

interface UseImageOperationParams {
    operation: AIOperation;
    provider: string;
    imageUrl: string;
    originalPath: string;
    onSuccess: (result: string) => void;
}

export function useImageOperation({
    operation,
    provider,
    imageUrl,
    originalPath,
    onSuccess,
}: UseImageOperationParams) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const upscaler = useUpscaler({ imageUrl, originalPath, provider, onSuccess });

    const execute = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (operation === 'upscaleImage') {
                await upscaler.upscale();
            } else if (operation === 'generateImage') {
                const providerInstance = createProvider(provider);
                const result = await providerInstance.generateImage("Default prompt", false);
                onSuccess(result);
            } else if (operation === 'outpaint') {
                const providerInstance = createProvider(provider);
                const result = await providerInstance.outPaint(imageUrl);
                onSuccess(result);
            } else {
                throw new Error(`Unsupported operation: ${operation}`);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [operation, provider, imageUrl, originalPath, onSuccess, upscaler.upscale]);

    return { execute, loading: loading || (operation === 'upscaleImage' && upscaler.loading), error: error || (operation === 'upscaleImage' ? upscaler.error : null) };
}
