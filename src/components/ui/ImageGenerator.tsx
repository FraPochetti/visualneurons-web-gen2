import React, { memo, useCallback, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import { ModelMetadata, ProviderMetadata } from '@/amplify/functions/providers/IAIProvider';
import { logger } from '@/src/lib/logger';
import styles from './ImageGenerator.module.css';

interface ImageGeneratorProps {
    provider: string;
    onSuccess?: (result: {
        imageUrl: string;
        modelInfo: ModelMetadata;
        providerInfo: ProviderMetadata;
    }) => void;
    className?: string;
    placeholder?: string;
    maxLength?: number;
    rows?: number;
}

export const ImageGenerator = memo<ImageGeneratorProps>(({
    provider,
    onSuccess,
    className,
    placeholder = "Enter a prompt, e.g., a serene mountain landscape at sunset",
    maxLength = 1000,
    rows = 4
}) => {
    const [prompt, setPrompt] = useState('');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const client = generateClient<Schema>();

    const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= maxLength) {
            setPrompt(value);
            setError(null); // Clear error when user types
        }
    }, [maxLength]);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setError(null);
        setGeneratedImageUrl(null);
        setLoading(true);

        try {
            const session = await fetchAuthSession();
            const attributes = await fetchUserAttributes();
            const identityId = session.identityId;

            if (!identityId) {
                throw new Error('User not authenticated');
            }

            const providerInstance = createProvider(provider);
            const modelInfo = providerInstance.getModelInfo('generateImage');
            const providerInfo = providerInstance.getProviderInfo();

            logger.info('Generating image', { provider, prompt: prompt.substring(0, 50) });

            const output = await client.mutations.generateImage({
                prompt,
                prompt_upsampling: true,
                provider,
                operation: "generateImage",
            });

            if (output.errors && output.errors.length > 0) {
                const message = output.errors[0].message;
                throw new Error(message);
            }

            if (!output.data || typeof output.data !== 'string') {
                throw new Error('Invalid response from image generation');
            }

            setGeneratedImageUrl(output.data);

            if (onSuccess) {
                onSuccess({
                    imageUrl: output.data,
                    modelInfo,
                    providerInfo
                });
            }

            // Log success
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

            logger.info('Image generated successfully', { provider });
        } catch (err: any) {
            let errorMessage = err.message || "An error occurred while generating the image";

            // Handle rate limit errors specially
            if (errorMessage.includes('RATE_LIMIT_EXCEEDED')) {
                errorMessage = errorMessage.replace('RATE_LIMIT_EXCEEDED: ', '');
                logger.warn('Rate limit exceeded during image generation', {
                    provider,
                    prompt: prompt.substring(0, 50),
                    userId: 'current_user'
                });
            }

            setError(errorMessage);
            logger.error('Image generation failed', { error: err, provider });

            // Log error
            try {
                const session = await fetchAuthSession();
                const attributes = await fetchUserAttributes();
                const identityId = session.identityId;
                const providerInstance = createProvider(provider);
                const modelInfo = providerInstance.getModelInfo('generateImage');

                if (identityId) {
                    await client.models.LogEntry.create({
                        identityId,
                        userSub: attributes.sub,
                        userEmail: attributes.email,
                        level: "ERROR",
                        provider: providerInstance.getProviderInfo().serviceProvider,
                        details: JSON.stringify({
                            error: err.message,
                            stack: err.stack,
                            model: modelInfo.modelName,
                            prompt,
                        }),
                    });
                }
            } catch (logError) {
                logger.error('Failed to log error', { error: logError });
            }
        } finally {
            setLoading(false);
        }
    }, [prompt, provider, client, onSuccess]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Allow Ctrl/Cmd + Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading) {
            e.preventDefault();
            handleGenerate();
        }
    }, [handleGenerate, loading]);

    const characterCount = prompt.length;
    const isOverLimit = characterCount > maxLength;

    return (
        <div className={`${styles.container} ${className || ''}`}>
            <div className={styles.inputWrapper}>
                <label htmlFor="image-prompt" className={styles.label}>
                    Image Prompt
                </label>
                <textarea
                    id="image-prompt"
                    value={prompt}
                    onChange={handlePromptChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={rows}
                    className={`${styles.textarea} ${error ? styles.textareaError : ''}`}
                    disabled={loading}
                    aria-label="Image generation prompt"
                    aria-describedby={error ? "prompt-error" : "prompt-hint"}
                    aria-invalid={!!error}
                    maxLength={maxLength + 100} // Allow typing beyond limit to show error
                />
                <div className={styles.inputFooter}>
                    <span
                        className={`${styles.characterCount} ${isOverLimit ? styles.characterCountError : ''}`}
                        role="status"
                        aria-live="polite"
                    >
                        {characterCount}/{maxLength}
                    </span>
                    <span id="prompt-hint" className={styles.hint}>
                        Press Ctrl+Enter to generate
                    </span>
                </div>
            </div>

            <div className={styles.buttonContainer}>
                <button
                    onClick={handleGenerate}
                    className={`button ${styles.generateButton}`}
                    disabled={loading || !prompt.trim() || isOverLimit}
                    aria-busy={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner" aria-hidden="true" />
                            <span>Generating...</span>
                        </>
                    ) : (
                        "Generate Image"
                    )}
                </button>
            </div>

            {error && (
                <div
                    id="prompt-error"
                    className={styles.errorMessage}
                    role="alert"
                    aria-live="assertive"
                >
                    <strong>Error:</strong> {error}
                </div>
            )}

            {generatedImageUrl && (
                <div className={styles.resultContainer}>
                    <h2 className={styles.resultTitle}>Generated Image</h2>
                    <div className={styles.imageWrapper}>
                        <img
                            src={generatedImageUrl}
                            alt={`AI generated image from prompt: ${prompt.substring(0, 100)}`}
                            className={styles.resultImage}
                            loading="lazy"
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

ImageGenerator.displayName = 'ImageGenerator'; 