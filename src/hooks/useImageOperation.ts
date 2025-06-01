import { useState, useCallback, useEffect } from 'react';
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import type { AIOperation } from '@/amplify/functions/providers/IAIProvider';
import { useUpscaler } from './useUpscaler';
import { useOutpainter } from './useOutpainter';
import { logger } from '@/src/lib/logger';

interface UseImageOperationParams {
    operation: AIOperation;
    provider: string;
    imageUrl: string;
    originalPath: string;
    onSuccess: (result: string) => void;
    onError?: (error: Error) => void;
}

interface UseImageOperationReturn {
    execute: () => Promise<void>;
    loading: boolean;
    error: string | null;
    reset: () => void;
}

export function useImageOperation({
    operation,
    provider,
    imageUrl,
    originalPath,
    onSuccess,
    onError,
}: UseImageOperationParams): UseImageOperationReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const upscaler = useUpscaler({
        imageUrl,
        originalPath,
        provider,
        onSuccess,
        onError
    });

    const outpainter = useOutpainter({
        imageUrl,
        originalPath,
        provider,
        onSuccess,
        onError
    });

    // Sync loading states
    useEffect(() => {
        if (operation === 'upscaleImage') {
            setLoading(upscaler.loading);
            setError(upscaler.error);
        } else if (operation === 'outpaint') {
            setLoading(outpainter.loading);
            setError(outpainter.error);
        }
    }, [operation, upscaler.loading, upscaler.error, outpainter.loading, outpainter.error]);

    const reset = useCallback(() => {
        setError(null);
        setLoading(false);
        upscaler.reset();
        outpainter.reset();
    }, [upscaler, outpainter]);

    const execute = useCallback(async () => {
        logger.info('Executing image operation', { operation, provider });

        setLoading(true);
        setError(null);

        try {
            switch (operation) {
                case 'upscaleImage':
                    await upscaler.upscale();
                    break;

                case 'outpaint':
                    await outpainter.outpaint();
                    break;

                case 'generateImage':
                    // For generateImage, we use the provider directly
                    const providerInstance = createProvider(provider);
                    const generatedImageUrl = await providerInstance.generateImage("Default prompt", false);
                    onSuccess(generatedImageUrl);
                    break;

                default:
                    const err = new Error(`Unsupported operation: ${operation}`);
                    setError(err.message);
                    onError?.(err);
                    logger.error('Unsupported operation', { operation });
            }
        } catch (err: any) {
            let errorMessage = err.message || 'An error occurred during the operation';

            // Handle rate limit errors specially
            if (errorMessage.includes('RATE_LIMIT_EXCEEDED')) {
                errorMessage = errorMessage.replace('RATE_LIMIT_EXCEEDED: ', '');
                logger.warn('Rate limit exceeded in image operation', {
                    operation,
                    provider,
                    userId: 'current_user'
                });
            }

            setError(errorMessage);
            onError?.(err);
            logger.error('Image operation failed', { error: err, operation, provider });
        } finally {
            setLoading(false);
        }
    }, [operation, provider, upscaler, outpainter, onSuccess, onError]);

    return {
        execute,
        loading,
        error,
        reset
    };
} 