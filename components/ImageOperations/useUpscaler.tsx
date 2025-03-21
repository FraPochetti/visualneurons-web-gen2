import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { createProvider } from '@/amplify/functions/providers/providerFactory';

interface UseUpscalerParams {
    imageUrl: string;
    originalPath: string;
    provider: string;
    onSuccess: (upscaledUrl: string) => void;
}

export function useUpscaler({
    imageUrl,
    originalPath,
    provider,
    onSuccess,
}: UseUpscalerParams) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const client = generateClient<Schema>();

    const upscale = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const identityId = (await fetchAuthSession()).identityId!;
            const attributes = await fetchUserAttributes();
            const providerInstance = createProvider(provider);
            const modelInfo = providerInstance.getModelInfo('upscaleImage');
            const providerInfo = providerInstance.getProviderInfo();

            console.log("Upscaling image:", imageUrl);
            const result = await client.mutations.upscaleImage({
                imageUrl: imageUrl,
                provider: provider,
                operation: "upscaleImage",
            });

            if (result.errors && result.errors.length > 0) {
                const message = result.errors[0].message;
                setError(message);
                alert("Error: " + message);
            } else if (result.data && typeof result.data === 'string') {
                onSuccess(result.data);
            } else {
                throw new Error("Invalid response from upscale operation");
            }

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
        } catch (err: any) {
            const identityId = (await fetchAuthSession()).identityId!;
            const attributes = await fetchUserAttributes();
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
                }),
            });
            console.error("Upscale error:", err);
            setError(err.message || "An error occurred during upscaling.");
        } finally {
            setLoading(false);
        }
    }, [imageUrl, originalPath, provider, onSuccess, client]);

    return { upscale, loading, error };
}
