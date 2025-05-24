import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useAiAction } from './useAiAction';

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
    const { execute, loading, error } = useAiAction<string>({
        provider,
        operation: 'outpaint',
        originalPath,
        onSuccess,
        action: () =>
            generateClient<Schema>().mutations.outpaintImage({
                imageUrl,
                provider,
                operation: 'outpaint',
            }),
    });

    return { outpaint: execute, loading, error };
}
