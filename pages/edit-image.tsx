import { useRouter } from "next/router";
import { Layout } from "@/components/layout";
import { useState, useEffect } from "react";
import { CustomCompareSlider, VerticalCompare, ModelCredits } from "@/src/components/ui";
import { ProviderSelector } from "@/src/components/form";
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import { saveImageRecord } from "@/utils/saveImageRecord";
import { OperationSelector, PROVIDER_OPERATIONS } from '@/src/components/form';
import { AIOperation } from "@/amplify/functions/providers/IAIProvider";
import { useImageOperation } from '@/src/hooks';
import styles from "./EditImage.module.css";

export default function EditImagePage() {
    const router = useRouter();
    const [provider, setProvider] = useState("replicate");
    const [operation, setOperation] = useState<AIOperation>("upscaleImage");
    const [processedUrl, setProcessedUrl] = useState<string | null>(null);
    const [saveFileName, setSaveFileName] = useState(`${operation}-image.jpg`);
    const [saveError, setSaveError] = useState<string | null>(null);
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
            setSaveError(null);
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
            setSaveError("Error saving file: " + err.message);
        }
    };

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value;
        setProvider(newProvider);
        const supportedOps = PROVIDER_OPERATIONS[newProvider] || [];
        if (supportedOps.length > 0 && !supportedOps.includes(operation)) {
            setOperation(supportedOps[0]);
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
            <div className={styles.imageContainer}>
                {processedUrl ? (
                    operation === 'outpaint' ? (
                        <VerticalCompare before={urlString!} after={processedUrl} />
                    ) :
                        (
                            <CustomCompareSlider before={urlString!} after={processedUrl} />
                        )
                ) : (
                    <img src={urlString!} alt="Selected" className={styles.selectedImage} />
                )}
            </div>

            <div style={{ textAlign: "center" }}>
                {!processedUrl && (
                    <div>
                        <div style={{ marginBottom: "15px" }}>
                            <ProviderSelector
                                value={provider}
                                onChange={handleProviderChange}
                                excludeProviders={["gemini"]}
                            />
                        </div>
                        <div style={{ marginBottom: "15px" }}>
                            <OperationSelector
                                value={operation}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOperation(e.target.value as AIOperation)}
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
                    <div className={styles.inputContainer}>
                        <div style={{ marginBottom: "1rem" }}>
                            <label className={styles.inputLabel}>
                                File name:{" "}
                                <input
                                    type="text"
                                    value={saveFileName}
                                    onChange={(e) => setSaveFileName(e.target.value)}
                                    className={styles.textInput}
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

                {saveError && <p style={{ color: "red", marginTop: "10px" }}>{saveError}</p>}
                {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
            </div>
        </Layout>
    );
}
