import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import { logger } from '@/src/lib/logger';

interface UseUpscalerParams {
    imageUrl: string;
    originalPath: string;
    provider: string;
    onSuccess: (result: string) => void;
    onError?: (error: Error) => void;
}

interface UseUpscalerReturn {
    upscale: () => Promise<void>;
    loading: boolean;
    error: string | null;
    reset: () => void;
}

export function useUpscaler({
    imageUrl,
    originalPath,
    provider,
    onSuccess,
    onError,
}: UseUpscalerParams): UseUpscalerReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const client = generateClient<Schema>();

    const reset = useCallback(() => {
        setError(null);
        setLoading(false);
    }, []);

    const upscale = useCallback(async () => {
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
            const modelInfo = providerInstance.getModelInfo('upscaleImage');
            const providerInfo = providerInstance.getProviderInfo();

            logger.info('Starting image upscale', {
                provider,
                model: modelInfo.modelName,
                originalPath
            });

            const result = await client.mutations.upscaleImage({
                imageUrl,
                provider,
                operation: "upscaleImage",
            });

            if (result.errors && result.errors.length > 0) {
                throw new Error(result.errors[0].message);
            }

            if (!result.data || typeof result.data !== 'string') {
                throw new Error("Invalid response from upscale operation");
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
                    version: modelInfo.modelVersion,
                    originalImagePath: originalPath,
                }),
            });

            logger.info('Image upscaled successfully', { provider });
            onSuccess(result.data);
        } catch (err: any) {
            const errorMessage = err.message || "An error occurred during upscaling";
            setError(errorMessage);
            logger.error('Upscale failed', { error: err, provider });

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
                    const modelInfo = providerInstance.getModelInfo('upscaleImage');
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
                            version: modelInfo.modelVersion,
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

    return { upscale, loading, error, reset };
} 