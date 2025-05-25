import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import { logger } from '@/src/lib/logger';

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

            const providerInstance = createProvider(provider);
            const modelInfo = providerInstance.getModelInfo('outpaint');
            const providerInfo = providerInstance.getProviderInfo();

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

            if (!result.data || typeof result.data !== 'string') {
                throw new Error("Invalid response from outpaint operation");
            }

            // Log successful operation
            await client.models.LogEntry.create({
                identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                level: "INFO",
                provider: providerInfo.serviceProvider,
                details: JSON.stringify({
                    output: result.data,
                    model: modelInfo.modelName,
                    originalImagePath: originalPath,
                }),
            });

            logger.info('Image outpainted successfully', { provider });
            onSuccess(result.data);
        } catch (err: any) {
            const errorMessage = err.message || "An error occurred during outpainting";
            setError(errorMessage);
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
                    const providerInstance = createProvider(provider);
                    const modelInfo = providerInstance.getModelInfo('outpaint');
                    const providerInfo = providerInstance.getProviderInfo();

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