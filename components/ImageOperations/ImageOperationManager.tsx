// components/ImageOperations/ImageOperationManager.tsx
import { AIOperation } from '@/amplify/functions/providers/IAIProvider';
import Upscaler from './Upscaler';

interface ImageOperationManagerProps {
    operation: AIOperation;
    provider: string;
    imageUrl: string;
    originalPath: string;
    onSuccess: (result: string) => void;
}

interface OperationControls {
    execute: () => void;
    loading: boolean;
    error: string;
}

export default function ImageOperationManager({
    operation,
    provider,
    imageUrl,
    originalPath,
    onSuccess
}: ImageOperationManagerProps): OperationControls {
    // Based on operation, return appropriate controls
    switch (operation) {
        case 'upscaleImage':
            // Adapt the Upscaler interface to our expected interface
            const upscaler = Upscaler({
                imageUrl,
                originalPath,
                onSuccess,
                provider
            });

            return {
                execute: upscaler.upscale,
                loading: upscaler.loading,
                error: upscaler.error
            };

        // Add cases for other operations as implemented
        default:
            return {
                execute: () => console.error(`Operation ${operation} not implemented`),
                loading: false,
                error: `Operation ${operation} not implemented`
            };
    }
}