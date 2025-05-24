import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useAiAction } from './useAiAction';

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
    const { execute, loading, error } = useAiAction<string>({
        provider,
        operation: 'upscaleImage',
        originalPath,
        onSuccess,
        action: () =>
            generateClient<Schema>().mutations.upscaleImage({
                imageUrl,
                provider,
                operation: 'upscaleImage',
            }),
    });

    return { upscale: execute, loading, error };
}
