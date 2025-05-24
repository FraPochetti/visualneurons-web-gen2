import { useCallback, useState } from 'react';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import type { AIOperation } from '@/amplify/functions/providers/IAIProvider';

interface UseAiActionParams<T> {
    provider: string;
    operation: AIOperation;
    action: () => Promise<{ data?: T; errors?: { message: string }[] } | T>;
    onSuccess: (result: T) => void;
    originalPath?: string;
}

export function useAiAction<T>({
    provider,
    operation,
    action,
    onSuccess,
    originalPath,
}: UseAiActionParams<T>) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const client = generateClient<Schema>();

    const execute = useCallback(async () => {
        setLoading(true);
        setError(null);
        const session = await fetchAuthSession();
        const identityId = session.identityId!;
        const attributes = await fetchUserAttributes();
        const providerInstance = createProvider(provider);
        const modelInfo = providerInstance.getModelInfo(operation);
        const providerInfo = providerInstance.getProviderInfo();
        try {
            const result = await action();
            const payload: any = result as any;
            if (payload?.errors && payload.errors.length > 0) {
                const message = payload.errors[0].message;
                setError(message);
                await client.models.LogEntry.create({
                    identityId,
                    userSub: attributes.sub,
                    userEmail: attributes.email,
                    level: 'ERROR',
                    provider: providerInfo.serviceProvider,
                    details: JSON.stringify({
                        error: message,
                        model: modelInfo.modelName,
                        version: modelInfo.modelVersion,
                        ...(originalPath ? { originalImagePath: originalPath } : {}),
                    }),
                });
                return;
            }

            const data = (payload && payload.data !== undefined) ? payload.data as T : (result as T);
            onSuccess(data);
            await client.models.LogEntry.create({
                identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                level: 'INFO',
                provider: providerInfo.serviceProvider,
                details: JSON.stringify({
                    output: data,
                    model: modelInfo.modelName,
                    version: modelInfo.modelVersion,
                    ...(originalPath ? { originalImagePath: originalPath } : {}),
                }),
            });
        } catch (err: any) {
            await client.models.LogEntry.create({
                identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                level: 'ERROR',
                provider: providerInfo.serviceProvider,
                details: JSON.stringify({
                    error: err.message,
                    stack: err.stack,
                    model: modelInfo.modelName,
                    version: modelInfo.modelVersion,
                    ...(originalPath ? { originalImagePath: originalPath } : {}),
                }),
            });
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [provider, operation, action, onSuccess, originalPath, client]);

    return { execute, loading, error };
}
