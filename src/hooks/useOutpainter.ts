import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { getModelInfo, getProviderInfo } from '@/src/modelCatalog';
import { logger } from '@/src/lib/logger';
import { toFriendlyError } from '@/src/lib/errorAdapter';

interface UseOutpainterParams {
    imageUrl: string;
    originalPath: string;
    provider: string;
    onSuccess: (result: string) => void;
    onError?: (error: Error) => void;
}

interface UseOutpainterReturn {
    outpaint: () => Promise<void>;
    loading: boolean;
    error: string | null;
    reset: () => void;
}

export function useOutpainter({
    imageUrl,
    originalPath,
    provider,
    onSuccess,
    onError,
}: UseOutpainterParams): UseOutpainterReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const client = generateClient<Schema>();

    const reset = useCallback(() => {
        setError(null);
        setLoading(false);
    }, []);

    const outpaint = useCallback(async () => {
        if (!imageUrl) {
            const err = new Error('No image URL provided');
            setError(err.message);
            onError?.(err);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const session = await fetchAuthSession();
            const attributes = await fetchUserAttributes();
            const identityId = session.identityId;

            if (!identityId) {
                throw new Error('User not authenticated');
            }

            const modelInfo = getModelInfo(provider as any, 'outpaint');
            const providerInfo = getProviderInfo(provider as any);

            logger.info('Starting image outpaint', {
                provider,
                model: modelInfo.modelName,
                originalPath
            });

            const result = await client.mutations.outpaintImage({
                imageUrl,
                provider,
                operation: "outpaint",
            });

            if (result.errors && result.errors.length > 0) {
                throw new Error(result.errors[0].message);
            }

            const payload = result.data as unknown as { success: boolean; data?: string; error?: { code: string; message: string; retryAfter?: number; requestId?: string } };
            if (!payload || typeof payload !== 'object') {
                throw new Error('Invalid response from outpaint operation');
            }

            if (!payload.success) {
                const fe = toFriendlyError(payload.error || { message: 'Outpaint failed' });
                setErrorDetails(payload.error?.message || null);
                throw new Error(fe.userMessage);
            }

            if (!payload.data || typeof payload.data !== 'string') {
                throw new Error('Invalid response from outpaint operation');
            }

            // Log successful operation
            await client.models.LogEntry.create({
                identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                level: "INFO",
                provider: providerInfo.serviceProvider,
                details: JSON.stringify({
                    output: payload.data,
                    model: modelInfo.modelName,
                    originalImagePath: originalPath,
                }),
            });

            logger.info('Image outpainted successfully', { provider });
            onSuccess(payload.data);
        } catch (err: any) {
            const errorMessage = err.message || "An error occurred during outpainting";

            setError(errorMessage);
            setErrorDetails((prev) => prev);
            logger.error('Outpaint failed', { error: err, provider });

            if (onError) {
                onError(err);
            }

            // Try to log error
            try {
                const session = await fetchAuthSession();
                const attributes = await fetchUserAttributes();
                const identityId = session.identityId;

                if (identityId) {
                    const modelInfo = getModelInfo(provider as any, 'outpaint');
                    const providerInfo = getProviderInfo(provider as any);

                    await client.models.LogEntry.create({
                        identityId,
                        userSub: attributes.sub,
                        userEmail: attributes.email,
                        level: "ERROR",
                        provider: providerInfo.serviceProvider,
                        details: JSON.stringify({
                            error: err.message,
                            stack: err.stack,
                            model: modelInfo.modelName,
                            originalImagePath: originalPath,
                        }),
                    });
                }
            } catch (logError) {
                logger.error('Failed to log error', { error: logError });
            }
        } finally {
            setLoading(false);
        }
    }, [imageUrl, originalPath, provider, onSuccess, onError, client]);

    return { outpaint, loading, error, reset };
} 