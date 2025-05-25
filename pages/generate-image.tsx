// pages/generate-image.tsx
import Layout from "@/components/Layout";
import ImageGenerator from "@/components/ImageOperations/ImageGenerator";
import ProviderSelector from "@/components/ProviderSelector";
import { useState } from "react";
import type { Schema } from "@/amplify/data/resource";
import { ModelMetadata, ProviderMetadata } from '@/amplify/functions/providers/IAIProvider';
import ModelCredits from "@/components/ModelCredits";
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import { saveImageRecord } from "@/utils/saveImageRecord";
interface GeneratedResult {
    imageUrl: string;
    modelInfo: ModelMetadata;
    providerInfo: ProviderMetadata;
}

export default function GenerateImagePage() {
    const [saveFileName, setSaveFileName] = useState("generated-image.jpg");
    // Expose the provider state at the page level
    const [provider, setProvider] = useState("replicate");
    const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImageGenerated = (result: GeneratedResult) => {
        setGeneratedResult(result);
        setError(null);
    };

    const handleSave = async () => {
        if (!generatedResult) return;
        const { imageUrl, modelInfo, providerInfo } = generatedResult;
        try {
            await saveImageRecord({
                imageUrl,
                fileName: saveFileName,
                source: "generated",
                modelName: modelInfo.modelName,
                providerService: providerInfo.serviceProvider,
            });
            setError(null);
        } catch (err: any) {
            const errorMessage = "Error saving file: " + err.message;
            setError(errorMessage);
        }
    };

    return (
        <Layout>
            <div style={{ padding: 20 }}>
                <h1>Generate Image with AI</h1>
                <ProviderSelector value={provider} onChange={(e) => setProvider(e.target.value)} />
                <ImageGenerator provider={provider} onSuccess={handleImageGenerated} />

                {error && (
                    <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: "4px" }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {generatedResult && (
                    <div style={{ marginTop: "1rem" }}>
                        <div>
                            <label>
                                File name:{" "}
                                <input
                                    type="text"
                                    value={saveFileName}
                                    onChange={(e) => setSaveFileName(e.target.value)}
                                />
                            </label>
                            <button onClick={handleSave} className="button" style={{ marginLeft: "1rem" }}>
                                Save Image
                            </button>
                        </div>
                    </div>
                )}
                {(() => {
                    const providerInstance = createProvider(provider);
                    const modelInfo = providerInstance.getModelInfo('generateImage');
                    return (
                        <ModelCredits
                            modelName={modelInfo.displayName || modelInfo.modelName}
                            modelUrl={modelInfo.modelUrl || ''}
                        />
                    );
                })()}
            </div>
        </Layout>
    );
}
