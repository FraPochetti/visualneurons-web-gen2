// pages/edit-image.tsx
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import ModelCredits from "@/components/ModelCredits";
import CustomCompareSlider from "@/components/CustomCompareSlider";
import ProviderSelector from "@/components/ProviderSelector";
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import { saveImageRecord } from "@/utils/saveImageRecord";
import OperationSelector from "@/components/OperationSelector";
import { AIOperation } from "@/amplify/functions/providers/IAIProvider";
import { useImageOperation } from '@/components/ImageOperations/useImageOperation';

const client = generateClient<Schema>();

export default function EditImagePage() {
    const router = useRouter();
    const [operation, setOperation] = useState<AIOperation>("upscaleImage");
    const [provider, setProvider] = useState("replicate");
    const [processedUrl, setProcessedUrl] = useState<string | null>(null);
    const [saveFileName, setSaveFileName] = useState(`${operation}-image.jpg`);
    const { url, originalPath } = router.query;
    const urlString = Array.isArray(url) ? url[0] : url;
    const originalPathString = Array.isArray(originalPath) ? originalPath[0] : originalPath;
    const isReady = Boolean(urlString && originalPathString);

    useEffect(() => {
        setSaveFileName(`${operation}-image.jpg`);
    }, [operation]);

    const { execute, loading, error } = useImageOperation({
        operation,
        provider,
        imageUrl: urlString ?? "",
        originalPath: originalPathString ?? "",
        onSuccess: setProcessedUrl,
    });

    const handleSave = async () => {
        if (!processedUrl || typeof processedUrl !== "string" || !isReady) return;
        const providerInstance = createProvider(provider);
        const modelInfo = providerInstance.getModelInfo(operation);
        const providerInfo = providerInstance.getProviderInfo();

        try {
            await saveImageRecord({
                imageUrl: processedUrl,
                fileName: saveFileName,
                source: "edited",
                action: operation,
                originalImagePathOverride: originalPathString!,
                checkOverwrite: true,
                modelName: modelInfo.modelName,
                providerService: providerInfo.serviceProvider,
            });
        } catch (err: any) {
            console.error("Error saving file:", err);
            alert("Error saving file: " + err.message);
        }
    };

    if (!isReady) {
        return (
            <Layout>
                <p>Loading image information...</p>
            </Layout>
        );
    }

    return (
        <Layout>
            <h1>Image Editor</h1>
            <div style={{ maxWidth: "600px", margin: "20px auto" }}>
                {processedUrl ? (
                    <CustomCompareSlider before={urlString!} after={processedUrl} />
                ) : (
                    <img src={urlString!} alt="Selected" style={{ maxWidth: "100%", borderRadius: "8px" }} />
                )}
            </div>

            <div style={{ textAlign: "center" }}>
                {!processedUrl && (
                    <div>
                        <div style={{ marginBottom: "15px" }}>
                            <ProviderSelector value={provider} onChange={(e) => setProvider(e.target.value)} />
                        </div>
                        <div style={{ marginBottom: "15px" }}>
                            <OperationSelector
                                value={operation}
                                onChange={(e) => setOperation(e.target.value as AIOperation)}
                                provider={provider}
                            />
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                            <button onClick={execute} className="button" disabled={loading}>
                                {loading ? <span className="spinner" /> : `Process Image`}
                            </button>
                        </div>
                    </div>
                )}

                {processedUrl && (
                    <div>
                        <div style={{ marginBottom: "1rem" }}>
                            <label>
                                File name:{" "}
                                <input
                                    type="text"
                                    value={saveFileName}
                                    onChange={(e) => setSaveFileName(e.target.value)}
                                />
                            </label>
                        </div>
                        <button onClick={handleSave} className="button">
                            Save image
                        </button>
                    </div>
                )}

                {!processedUrl && (
                    <>
                        {(() => {
                            const providerInstance = createProvider(provider);
                            const modelInfo = providerInstance.getModelInfo(operation);
                            return (
                                <ModelCredits
                                    modelName={modelInfo.displayName || modelInfo.modelName}
                                    modelUrl={modelInfo.modelUrl}
                                />
                            );
                        })()}
                    </>
                )}

                {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
            </div>
        </Layout>
    );
}
