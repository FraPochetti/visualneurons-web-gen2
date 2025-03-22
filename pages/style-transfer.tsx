import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import Layout from '@/components/Layout';
import ProviderSelector from '@/components/ProviderSelector';
import ModelCredits from '@/components/ModelCredits';
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import StyleImageSelector from '@/components/StyleImageSelector';


export default function StyleTransferPage() {
    const [provider, setProvider] = useState('stability');
    const [prompt, setPrompt] = useState('');
    const [styleImageUrl, setStyleImageUrl] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const client = generateClient<Schema>();

    const handleSelectImage = (url: string) => {
        setStyleImageUrl(url);
    };

    const handleStyleTransfer = async () => {
        if (!styleImageUrl) {
            alert('Please select a style image first!');
            return;
        }

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
            {/* The new carousel-like selector */}
            <StyleImageSelector onSelect={handleSelectImage} />

            <button onClick={handleStyleTransfer} className="button" style={{ marginTop: '1rem' }}>
                Transfer Style
            </button>

            {result && (
                <div style={{ marginTop: '1rem' }}>
                    <h2>Result</h2>
                    <img src={result} alt="Style Transfer Result" style={{ maxWidth: '100%' }} />
                </div>
            )}
            <ModelCredits
                modelName={modelInfo.displayName || modelInfo.modelName}
                modelUrl={modelInfo.modelUrl || ''}
            />
        </Layout>
    );
}
