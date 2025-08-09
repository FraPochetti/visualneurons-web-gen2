import { useState, useCallback, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { getModelInfo, getProviderInfo } from '@/src/modelCatalog';
import type { AIOperation } from '@/amplify/functions/providers/IAIProvider';
import { useUpscaler } from './useUpscaler';
import { useOutpainter } from './useOutpainter';
import { logger } from '@/src/lib/logger';
import { toFriendlyError } from '@/src/lib/errorAdapter';

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
    const client = generateClient<Schema>();

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

                case 'generateImage': {
                    const result = await client.mutations.generateImage({
                        prompt: 'Default prompt',
                        prompt_upsampling: false,
                        provider,
                        operation: 'generateImage',
                    });

                    if (result.errors && result.errors.length > 0) {
                        throw new Error(result.errors[0].message);
                    }

                    const payload = result.data as unknown as { success: boolean; data?: string; error?: { message: string } };
                    if (!payload || typeof payload !== 'object') {
                        throw new Error('Invalid response from image generation');
                    }
                    if (!payload.success) {
                        const fe = toFriendlyError(payload.error || { message: 'Image generation failed' });
                        throw new Error(fe.userMessage);
                    }
                    if (!payload.data || typeof payload.data !== 'string') {
                        throw new Error('Invalid response from image generation');
                    }
                    onSuccess(payload.data);
                    break;
                }

                default:
                    const err = new Error(`Unsupported operation: ${operation}`);
                    setError(err.message);
                    onError?.(err);
                    logger.error('Unsupported operation', { operation });
            }
        } catch (err: any) {
            const errorMessage = err.message || 'An error occurred during the operation';

            // Rate limit errors now returned as structured GraphQL payloads

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