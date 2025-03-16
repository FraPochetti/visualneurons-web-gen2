// components/ImageOperations/ImageGenerator.tsx
import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import ProviderSelector from '../ProviderSelector';
import ModelCredits from '../ModelCredits';

interface ImageGeneratorProps {
    onSuccess?: (imageUrl: string) => void;
}

export default function ImageGenerator({ onSuccess }: ImageGeneratorProps) {
    const [prompt, setPrompt] = useState('');
    const [provider, setProvider] = useState('replicate');
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

        try {
            const output = await client.mutations.generateImage({
                prompt,
                prompt_upsampling: true,
                provider,
                operation: "generateImage",
            });

            setResult(output.data);
            if (onSuccess && typeof output.data === 'string') {
                onSuccess(output.data);
            }

            await client.models.LogEntry.create({
                identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                level: "INFO",
                provider: provider as "replicate" | "stability" | "clipdrop" | "user",
                details: JSON.stringify({
                    prompt,
                    model: "black-forest-labs/flux-1.1-pro-ultra",
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
                    model: "black-forest-labs/flux-1.1-pro-ultra",
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
                <ProviderSelector value={provider} onChange={(e) => setProvider(e.target.value)} />

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

            <ModelCredits
                modelName="Flux 1.1 Pro Ultra"
                modelUrl="https://replicate.com/black-forest-labs/flux-1.1-pro-ultra"
            />
        </div>
    );
}