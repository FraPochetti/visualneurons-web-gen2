// components/ImageOperations/ImageGenerator.tsx
import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import { ModelMetadata, ProviderMetadata } from '@/amplify/functions/providers/IAIProvider';

interface ImageGeneratorProps {
    provider: string; // now provided from the parent
    onSuccess?: (result: {
        imageUrl: string;
        modelInfo: ModelMetadata;
        providerInfo: ProviderMetadata;
    }) => void;
}

export default function ImageGenerator({ provider, onSuccess }: ImageGeneratorProps) {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const client = generateClient<Schema>();

    const handleGenerate = async () => {
        setError('');
        setResult(null);
        setLoading(true);
        const identityId = (await fetchAuthSession()).identityId!;
        const attributes = await fetchUserAttributes();

        // Use the passed-in provider prop here
        const providerInstance = createProvider(provider);
        const modelInfo = providerInstance.getModelInfo('generateImage');
        const providerInfo = providerInstance.getProviderInfo();

        try {
            const output = await client.mutations.generateImage({
                prompt,
                prompt_upsampling: true,
                provider,
                operation: "generateImage",
            });

            if (output.errors && output.errors.length > 0) {
                const message = output.errors[0].message;
                setError(message);
                alert("Error: " + message);
            } else {
                setResult(output.data);
                if (onSuccess && typeof output.data === 'string') {
                    onSuccess({ imageUrl: output.data, modelInfo, providerInfo });
                }
            }

            await client.models.LogEntry.create({
                identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                level: "INFO",
                provider: providerInfo.serviceProvider,
                details: JSON.stringify({
                    prompt,
                    model: modelInfo.modelName,
                    output: output.data,
                }),
            });
        } catch (err: any) {
            await client.models.LogEntry.create({
                identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                level: "ERROR",
                details: JSON.stringify({
                    error: err.message,
                    stack: err.stack,
                    model: modelInfo.modelName,
                }),
            });
            console.error(err);
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a prompt, e.g. cool sunrise"
                rows={4}
                style={{
                    width: "100%",
                    maxWidth: "600px",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                }}
            />

            <div style={{ marginTop: "1rem" }}>
                <button
                    onClick={handleGenerate}
                    className="button"
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? <span className="spinner" /> : "Generate Image"}
                </button>
            </div>

            {error && <div style={{ color: "red", marginTop: "1rem" }}>Error: {error}</div>}

            {result && (
                <div style={{ marginTop: "1rem" }}>
                    <h2>Generated Image:</h2>
                    <img
                        src={result}
                        alt="Generated"
                        style={{ maxWidth: "100%", maxHeight: "500px" }}
                    />
                </div>
            )}
        </div>
    );
}
