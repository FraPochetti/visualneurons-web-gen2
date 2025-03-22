import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import Layout from '@/components/Layout';
import ProviderSelector from '@/components/ProviderSelector';
import ModelCredits from '@/components/ModelCredits';
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import StyleImageSelector from '@/components/StyleImageSelector';
import { saveImageRecord } from '@/utils/saveImageRecord';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

export default function StyleTransferPage() {
    const [provider, setProvider] = useState('stability');
    const [prompt, setPrompt] = useState('');
    const [styleImageUrl, setStyleImageUrl] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saveFileName, setSaveFileName] = useState('style-transfer-image.jpg');
    const client = generateClient<Schema>();

    const handleSelectImage = (url: string) => {
        setStyleImageUrl(url);
    };

    const handleStyleTransfer = async () => {
        if (!styleImageUrl) {
            alert('Please select a style image first!');
            return;
        }
        setLoading(true);
        try {
            const output = await client.mutations.styleTransfer({
                prompt,
                styleImageUrl,
                provider,
                operation: 'styleTransfer',
            });
            if (output.errors && output.errors.length > 0) {
                alert('Error: ' + output.errors[0].message);
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
            console.error(err);
            alert('An error occurred while transferring style.');

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
            await saveImageRecord({
                imageUrl: result,
                fileName: saveFileName,
                source: 'edited',
                action: 'styleTransfer',
                modelName: modelInfo.modelName,
                providerService: providerInfo.serviceProvider,
            });
        } catch (err: any) {
            console.error('Error saving file:', err);
            alert('Error saving file: ' + err.message);
        }
    };

    const providerInstance = createProvider(provider);
    const modelInfo = providerInstance.getModelInfo('styleTransfer');

    return (
        <Layout>
            <h1>Style Transfer</h1>
            <ProviderSelector value={provider} onChange={(e) => setProvider(e.target.value)} />
            <div style={{ margin: '1rem 0' }}>
                <input
                    type="text"
                    placeholder="Enter your prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    style={{ width: '100%', maxWidth: '600px', padding: '0.5rem', height: '4rem' }}
                />
            </div>
            <h3>Select a Style Image:</h3>
            <StyleImageSelector onSelect={handleSelectImage} />

            <div style={{ marginTop: '1rem' }}>
                <button
                    onClick={handleStyleTransfer}
                    className="button"
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? <span className="spinner" /> : "Transfer Style"}
                </button>
            </div>

            {result && (
                <>
                    <div style={{ marginTop: '1rem' }}>
                        <h2>Result</h2>
                        <img src={result} alt="Style Transfer Result" style={{ maxWidth: '100%' }} />
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>
                                File name:{" "}
                                <input
                                    type="text"
                                    value={saveFileName}
                                    onChange={(e) => setSaveFileName(e.target.value)}
                                    style={{ padding: '0.5rem', maxWidth: '600px' }}
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
