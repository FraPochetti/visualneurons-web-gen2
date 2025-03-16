// Updated pages/edit-image-actual.tsx
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import { uploadData, getProperties, getUrl } from "aws-amplify/storage";
import ModelCredits from "@/components/ModelCredits";
import Upscaler from "@/components/ImageOperations/Upscaler";
import CustomCompareSlider from "@/components/CustomCompareSlider";
import ProviderSelector from "@/components/ProviderSelector";
import { createProvider } from '@/amplify/functions/providers/providerFactory';
import { saveImageRecord } from "@/utils/saveImageRecord";

const client = generateClient<Schema>();

export default function EditImagePage() {
    const router = useRouter();
    const [provider, setProvider] = useState("replicate");
    const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
    const [saveFileName, setSaveFileName] = useState("upscaled-image.jpg");
    const [isUpscaledRecord, setIsUpscaledRecord] = useState(false);
    const [compareOriginalUrl, setCompareOriginalUrl] = useState<string | null>(null);
    const { url, originalPath } = router.query;
    const urlString = Array.isArray(url) ? url[0] : url;
    const originalPathString = Array.isArray(originalPath) ? originalPath[0] : originalPath;
    const isReady = Boolean(urlString && originalPathString);

    // Get the upscaler component's functions and state
    const { upscale, loading, error } = isReady ?
        Upscaler({
            imageUrl: urlString!,
            originalPath: originalPathString!,
            onSuccess: setUpscaledUrl,
            provider
        }) : { upscale: () => { }, loading: false, error: "" };

    useEffect(() => {
        if (!isReady) return;

        console.log("Checking for upscale record:", urlString);
        const checkUpscale = async () => {
            try {
                const res = await client.models.ImageRecord.list({
                    filter: {
                        editedImagePath: { eq: originalPathString! },
                        action: { eq: "upscale" },
                    },
                });
                console.log("Results:", res);
                if (res.data && res.data.length > 0) {
                    setIsUpscaledRecord(true);
                }
            } catch (err) {
                console.error("Error checking upscale record:", err);
            }
        };
        checkUpscale();
    }, [urlString, originalPathString, isReady]);

    // Handler for when upscaling is successful
    const handleUpscaleSuccess = (imageUrl: string) => {
        setUpscaledUrl(imageUrl);
    };

    const handleSave = async () => {
        if (!upscaledUrl || typeof upscaledUrl !== "string" || !isReady) return;
        const providerInstance = createProvider(provider);
        const modelInfo = providerInstance.getModelInfo('upscaleImage');
        const providerInfo = providerInstance.getProviderInfo();

        try {
            await saveImageRecord({
                imageUrl: upscaledUrl,
                fileName: saveFileName,
                source: "edited",
                action: "upscale",
                // Pass the original image path so that it remains unchanged
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
                    action: { eq: "upscale" },
                },
            });
            if (!res.data || res.data.length === 0) {
                console.log("No upscale records found.");
                return;
            }
            const sortedRecords = res.data.sort((a, b) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            const mostRecentRecord = sortedRecords[0];
            console.log("Most recent upscale record:", mostRecentRecord);
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
            console.error("Error fetching upscale records:", err);
        }
    };

    // If not ready, show a loading message.
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
                {upscaledUrl ? (
                    <CustomCompareSlider before={urlString!} after={upscaledUrl} />
                ) : compareOriginalUrl ? (
                    <CustomCompareSlider before={compareOriginalUrl} after={urlString!} />
                ) : (
                    <img src={urlString!} alt="Selected" style={{ maxWidth: "100%", borderRadius: "8px" }} />
                )}
            </div>

            <div style={{ textAlign: "center" }}>
                {!upscaledUrl && !compareOriginalUrl && (
                    <div>
                        {/* Provider selector on its own line */}
                        <div style={{ marginBottom: "15px" }}>
                            <ProviderSelector value={provider} onChange={(e) => setProvider(e.target.value)} />
                        </div>

                        {/* Buttons in a row */}
                        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                            <button
                                onClick={upscale}
                                className="button"
                                disabled={loading}
                            >
                                {loading ? <span className="spinner" /> : "Upscale Image"}
                            </button>

                            {isUpscaledRecord && (
                                <button onClick={handleCompareOriginal} className="button">
                                    Compare with original
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {upscaledUrl && (
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

                {!upscaledUrl && (
                    <>
                        {(() => {
                            const providerInstance = createProvider(provider);
                            const modelInfo = providerInstance.getModelInfo('upscaleImage');
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