import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { createProvider } from '@/amplify/functions/providers/providerFactory';

interface UseOutpainterParams {
    imageUrl: string;
    originalPath: string;
    provider: string;
    onSuccess: (outpaintedUrl: string) => void;
}

export function useOutpainter({
    imageUrl,
    originalPath,
    provider,
    onSuccess,
}: UseOutpainterParams) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const client = generateClient<Schema>();

    const outpaint = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const identityId = (await fetchAuthSession()).identityId!;
            const attributes = await fetchUserAttributes();
            const providerInstance = createProvider(provider);
            const modelInfo = providerInstance.getModelInfo('outpaint');
            const providerInfo = providerInstance.getProviderInfo();

            console.log("Outpainting image:", imageUrl);
            const result = await client.mutations.outpaintImage({
                imageUrl: imageUrl,
                provider: provider,
                operation: "outpaint",
            });

            if (result.errors && result.errors.length > 0) {
                setError(result.errors[0].message);
                alert("Error: " + result.errors[0].message);
            } else if (result.data) {
                onSuccess(result.data);
            } else {
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
        } catch (err: any) {
            // Log error
            const identityId = (await fetchAuthSession()).identityId!;
            const attributes = await fetchUserAttributes();
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
                }),
            });

            console.error("Outpaint error:", err);
            setError(err.message || "An error occurred during outpainting.");
        } finally {
            setLoading(false);
        }
    }, [imageUrl, originalPath, provider, onSuccess, client]);

    return { outpaint, loading, error };
}