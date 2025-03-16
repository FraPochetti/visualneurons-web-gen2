// pages/generate-image.tsx
import Layout from "@/components/Layout";
import ImageGenerator from "@/components/ImageOperations/ImageGenerator";
import ProviderSelector from "@/components/ProviderSelector";
import { useState } from "react";
import { uploadData } from "aws-amplify/storage";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { ModelMetadata, ProviderMetadata } from '@/amplify/functions/providers/IAIProvider';
import ModelCredits from "@/components/ModelCredits";
import { createProvider } from '@/amplify/functions/providers/providerFactory';
interface GeneratedResult {
    imageUrl: string;
    modelInfo: ModelMetadata;
    providerInfo: ProviderMetadata;
}

export default function GenerateImagePage() {
    const [saveFileName, setSaveFileName] = useState("generated-image.jpg");
    // Expose the provider state at the page level
    const [provider, setProvider] = useState("replicate");
    const client = generateClient<Schema>();
    const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null);

    const handleImageGenerated = (result: GeneratedResult) => {
        setGeneratedResult(result);
    };

    const handleSave = async () => {
        if (!generatedResult) return;
        const { imageUrl, modelInfo, providerInfo } = generatedResult;
        const session = await fetchAuthSession();
        const identityId = session.identityId!;
        const attributes = await fetchUserAttributes();

        try {
            const path = `photos/${identityId}/${saveFileName}`;
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            await uploadData({
                path,
                data: blob,
                options: {
                    metadata: { isAiGenerated: "true" },
                },
            });

            alert("File saved successfully.");

            await client.models.ImageRecord.create({
                identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                originalImagePath: path,
                model: modelInfo.modelName,
                source: "generated",
                provider: providerInfo.serviceProvider,
            });
        } catch (err: any) {
            console.error("Error saving file:", err);
            alert("Error saving file: " + err.message);
        }
    };

    return (
        <Layout>
            <div style={{ padding: 20 }}>
                <h1>Generate Image with AI</h1>
                <ProviderSelector value={provider} onChange={(e) => setProvider(e.target.value)} />
                <ImageGenerator provider={provider} onSuccess={handleImageGenerated} />

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
