// Updated components/ImageOperations/Upscaler.tsx
import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import CustomCompareSlider from '../CustomCompareSlider';

interface UpscalerProps {
    imageUrl: string;
    originalPath: string;
    onSuccess: (upscaledUrl: string) => void;
    // Don't include UI controls in the component
    provider: string; // Take provider as a prop instead
}

export default function Upscaler({ imageUrl, originalPath, onSuccess, provider }: UpscalerProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
    const client = generateClient<Schema>();

    const handleUpscale = async () => {
        setLoading(true);
        setError('');
        const identityId = (await fetchAuthSession()).identityId!;
        const attributes = await fetchUserAttributes();

        try {
            console.log("Upscaling image:", imageUrl);
            const result = await client.mutations.upscaleImage({
                imageUrl: imageUrl,
                provider: provider,
                operation: "upscaleImage"
            });

            if (result.data && typeof result.data === 'string') {
                setUpscaledUrl(result.data);
                onSuccess(result.data);
            } else {
                throw new Error("Invalid response from upscale operation");
            }

            await client.models.LogEntry.create({
                identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                level: "INFO",
                provider: provider as "replicate" | "stability" | "clipdrop" | "user",
                details: JSON.stringify({
                    output: result.data,
                    model: "philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e",
                    originalImagePath: originalPath,
                }),
            });
        } catch (err: any) {
            await client.models.LogEntry.create({
                identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                level: "ERROR",
                provider: provider as "replicate" | "stability" | "clipdrop" | "user",
                details: JSON.stringify({
                    error: err.message,
                    stack: err.stack,
                    model: "philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e",
                }),
            });
            console.error("Upscale error:", err);
            setError(err.message || "An error occurred during upscaling.");
        } finally {
            setLoading(false);
        }
    };

    // Only expose the upscale function and state variables
    return {
        upscale: handleUpscale,
        upscaledUrl,
        loading,
        error
    };
}