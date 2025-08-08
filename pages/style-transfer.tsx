/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Layout } from '@/components/layout';
import { ProviderSelector } from '@/src/components/form';
import { ModelCredits } from '@/src/components/ui';
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import { StyleImageSelector } from '@/src/components/form';
import { saveImageRecord } from '@/utils/saveImageRecord';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import styles from "./StyleTransfer.module.css"; // Import the module

export default function StyleTransferPage() {
    const [provider, setProvider] = useState('stability');
    const [prompt, setPrompt] = useState('');
    const [styleImageUrl, setStyleImageUrl] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saveFileName, setSaveFileName] = useState('style-transfer-image.jpg');
    const [error, setError] = useState<string | null>(null);
    const client = generateClient<Schema>();

    const handleSelectImage = (url: string) => {
        setStyleImageUrl(url);
    };

    const handleStyleTransfer = async () => {
        if (!styleImageUrl) {
            setError('Please select a style image first!');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const output = await client.mutations.styleTransfer({
                prompt,
                styleImageUrl,
                provider,
                operation: 'styleTransfer',
            });
            if (output.errors && output.errors.length > 0) {
                setError('Error: ' + output.errors[0].message);
            } else {
                setResult(output.data);

                const session = await fetchAuthSession();
                const attributes = await fetchUserAttributes();
                const identityId = session.identityId!;
                const providerInstance = createProvider(provider);
                const providerInfo = providerInstance.getProviderInfo();
                const modelInfo = providerInstance.getModelInfo('styleTransfer');
                await client.models.LogEntry.create({
                    identityId,
                    userSub: attributes.sub,
                    userEmail: attributes.email,
                    level: "INFO",
                    provider: providerInfo.serviceProvider,
                    details: JSON.stringify({
                        prompt,
                        styleImageUrl,
                        model: modelInfo.modelName,
                        output: output.data,
                    }),
                });
            }
        } catch (err: any) {
            setError('An error occurred while transferring style: ' + err.message);

            const session = await fetchAuthSession();
            const attributes = await fetchUserAttributes();
            const identityId = session.identityId!;
            const providerInstance = createProvider(provider);
            const providerInfo = providerInstance.getProviderInfo();
            const modelInfo = providerInstance.getModelInfo('styleTransfer');
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
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        const providerInstance = createProvider(provider);
        const modelInfo = providerInstance.getModelInfo('styleTransfer');
        const providerInfo = providerInstance.getProviderInfo();
        try {
            setError(null);
            await saveImageRecord({
                imageUrl: result,
                fileName: saveFileName,
                source: 'edited',
                action: 'styleTransfer',
                modelName: modelInfo.modelName,
                providerService: providerInfo.serviceProvider,
            });
        } catch (err: any) {
            setError('Error saving file: ' + err.message);
        }
    };

    const providerInstance = createProvider(provider);
    const modelInfo = providerInstance.getModelInfo('styleTransfer');

    return (
        <Layout>
            <h1>Style Transfer</h1>
            <ProviderSelector value={provider} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProvider(e.target.value)} />

            {/* Instead of inline margin, use the container class */}
            <div className={styles.container}>
                <input
                    type="text"
                    placeholder="Enter your prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className={styles.promptInput}
                />
            </div>

            <h3>Select a Style Image:</h3>
            <StyleImageSelector onSelect={handleSelectImage} />

            <div className={styles.buttonContainer}>
                <button
                    onClick={handleStyleTransfer}
                    className="button"
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? <span className="spinner" /> : "Transfer Style"}
                </button>
            </div>

            {error && (
                <div style={{ margin: "1rem", padding: "1rem", backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: "4px" }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && (
                <>
                    <div className={styles.resultContainer}>
                        <h2>Result</h2>
                        <img src={result} alt="Style Transfer Result" className={styles.resultImage} />
                    </div>

                    <div className={styles.container}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>
                                File name:{" "}
                                <input
                                    type="text"
                                    value={saveFileName}
                                    onChange={(e) => setSaveFileName(e.target.value)}
                                    className={styles.promptInput}
                                    style={{ height: 'auto' }}
                                /* optional if you want a single-line input */
                                />
                            </label>
                        </div>
                        <button onClick={handleSave} className="button">
                            Save Image
                        </button>
                    </div>
                </>
            )}

            <ModelCredits
                modelName={modelInfo.displayName || modelInfo.modelName}
                modelUrl={modelInfo.modelUrl || ''}
            />
        </Layout>
    );
}
