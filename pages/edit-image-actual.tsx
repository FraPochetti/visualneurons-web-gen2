// Updated pages/edit-image-actual.tsx
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { getProperties, getUrl } from "aws-amplify/storage";
import ModelCredits from "@/components/ModelCredits";
import CustomCompareSlider from "@/components/CustomCompareSlider";
import ProviderSelector from "@/components/ProviderSelector";
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import { saveImageRecord } from "@/utils/saveImageRecord";
import OperationSelector from "@/components/OperationSelector";
import ImageOperationManager from "@/components/ImageOperations/ImageOperationManager";
import { AIOperation } from "@/amplify/functions/providers/IAIProvider";

const client = generateClient<Schema>();

export default function EditImagePage() {
    const router = useRouter();
    const [operation, setOperation] = useState<AIOperation>("upscaleImage");
    const [provider, setProvider] = useState("replicate");
    const [processedUrl, setProcessedUrl] = useState<string | null>(null);
    const [saveFileName, setSaveFileName] = useState(`${operation}-image.jpg`);
    const [isProcessedRecord, setIsProcessedRecord] = useState(false);
    const [compareOriginalUrl, setCompareOriginalUrl] = useState<string | null>(null);
    const { url, originalPath } = router.query;
    const urlString = Array.isArray(url) ? url[0] : url;
    const originalPathString = Array.isArray(originalPath) ? originalPath[0] : originalPath;
    const isReady = Boolean(urlString && originalPathString);

    // Update filename when operation changes
    useEffect(() => {
        setSaveFileName(`${operation}-image.jpg`);
    }, [operation]);

    const { execute, loading, error } = isReady ?
        ImageOperationManager({
            operation,
            provider,
            imageUrl: urlString!,
            originalPath: originalPathString!,
            onSuccess: setProcessedUrl
        }) : { execute: () => { }, loading: false, error: "" };

    useEffect(() => {
        if (!isReady) return;

        console.log(`Checking for ${operation} record:`, urlString);
        const checkProcessed = async () => {
            try {
                const res = await client.models.ImageRecord.list({
                    filter: {
                        editedImagePath: { eq: originalPathString! },
                        action: { eq: operation },
                    },
                });
                console.log("Results:", res);
                if (res.data && res.data.length > 0) {
                    setIsProcessedRecord(true);
                }
            } catch (err) {
                console.error(`Error checking ${operation} record:`, err);
            }
        };
        checkProcessed();
    }, [urlString, originalPathString, isReady, operation]);

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

    const handleCompareOriginal = async () => {
        if (!isReady) return;

        try {
            const res = await client.models.ImageRecord.list({
                filter: {
                    editedImagePath: { eq: originalPathString },
                    action: { eq: operation },
                },
            });
            if (!res.data || res.data.length === 0) {
                console.log(`No ${operation} records found.`);
                return;
            }
            const sortedRecords = res.data.sort((a, b) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            const mostRecentRecord = sortedRecords[0];
            console.log(`Most recent ${operation} record:`, mostRecentRecord);
            const originalImagePathFromRecord = mostRecentRecord.originalImagePath;
            console.log("Original image path from record:", originalImagePathFromRecord);
            try {
                const properties = await getProperties({ path: originalImagePathFromRecord });
                console.log("File properties:", properties);
                const { url: originalUrlObj } = await getUrl({ path: originalImagePathFromRecord });
                const originalUrl = originalUrlObj.toString();
                setCompareOriginalUrl(originalUrl);
            } catch (err) {
                console.error("Original image file does not exist:", err);
            }
        } catch (err) {
            console.error(`Error fetching ${operation} records:`, err);
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
                ) : compareOriginalUrl ? (
                    <CustomCompareSlider before={compareOriginalUrl} after={urlString!} />
                ) : (
                    <img src={urlString!} alt="Selected" style={{ maxWidth: "100%", borderRadius: "8px" }} />
                )}
            </div>

            <div style={{ textAlign: "center" }}>
                {!processedUrl && !compareOriginalUrl && (
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
                            <button
                                onClick={execute}
                                className="button"
                                disabled={loading}
                            >
                                {loading ? <span className="spinner" /> : `Process Image`}
                            </button>

                            {isProcessedRecord && (
                                <button onClick={handleCompareOriginal} className="button">
                                    Compare with original
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {processedUrl && (
                    <div>
                        <div style={{ marginBottom: "1rem" }}>
                            <label>
                                File name:{" "}
                                <input type="text" value={saveFileName} onChange={(e) => setSaveFileName(e.target.value)} />
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