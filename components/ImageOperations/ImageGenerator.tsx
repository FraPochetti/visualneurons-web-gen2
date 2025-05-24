// components/ImageOperations/ImageGenerator.tsx
import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import { ModelMetadata, ProviderMetadata } from '@/amplify/functions/providers/IAIProvider';
import { useAiAction } from './useAiAction';
import styles from "./ImageGenerator.module.css";

interface ImageGeneratorProps {
    provider: string;
    onSuccess?: (result: {
        imageUrl: string;
        modelInfo: ModelMetadata;
        providerInfo: ProviderMetadata;
    }) => void;
}

export default function ImageGenerator({ provider, onSuccess }: ImageGeneratorProps) {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);

    const providerInstance = createProvider(provider);
    const modelInfo = providerInstance.getModelInfo('generateImage');
    const providerInfo = providerInstance.getProviderInfo();

    const { execute, loading, error } = useAiAction<string>({
        provider,
        operation: 'generateImage',
        onSuccess: (url) => {
            setResult(url);
            if (onSuccess) {
                onSuccess({ imageUrl: url, modelInfo, providerInfo });
            }
        },
        action: () =>
            generateClient<Schema>().mutations.generateImage({
                prompt,
                prompt_upsampling: true,
                provider,
                operation: 'generateImage',
            }),
    });

    return (
        <div>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a prompt, e.g. cool sunrise"
                rows={4}
                className={styles.textarea}
            />

            <div className={styles.buttonContainer}>
                <button
                    onClick={execute}
                    className="button"
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? <span className="spinner" /> : "Generate Image"}
                </button>
            </div>

            {error && <div className={styles.errorMessage}>Error: {error}</div>}

            {result && (
                <div className={styles.resultContainer}>
                    <h2>Generated Image:</h2>
                    <img
                        src={result}
                        alt="Generated"
                        className={styles.resultImage}
                    />
                </div>
            )}
        </div>
    );
}
