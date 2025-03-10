import { useRouter } from "next/router"
import Layout from "@/components/Layout"
import { useState, useEffect } from "react"
import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/amplify/data/resource"
import CustomCompareSlider from "@/components/CustomCompareSlider"
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth"
import { uploadData, getProperties, getUrl } from "aws-amplify/storage"
import ModelCredits from "@/components/ModelCredits";

const client = generateClient<Schema>()

export default function EditImagePage() {
    const router = useRouter()
    const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [saveFileName, setSaveFileName] = useState("upscaled-image.jpg")
    const [isUpscaledRecord, setIsUpscaledRecord] = useState(false);
    const [compareOriginalUrl, setCompareOriginalUrl] = useState<string | null>(null);


    const { url, originalPath } = router.query;
    if (!url || typeof url !== "string" || !originalPath || typeof originalPath !== "string") {
        return (
            <Layout>
                <p>No image URL or original path provided.</p>
            </Layout>
        );
    }

    useEffect(() => {
        const checkUpscale = async () => {
            console.log("Checking for upscale record:", url);
            try {
                const res = await client.models.ImageRecord.list({
                    filter: {
                        editedImagePath: { eq: originalPath },
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
    }, [url]);

    const handleUpscale = async () => {
        setLoading(true)
        setError("")
        const identityId = (await fetchAuthSession()).identityId!;
        const attributes = await fetchUserAttributes();
        try {
            console.log("Upscaling image:", url)
            const result = await client.mutations.upscaleImage({ imageUrl: url })
            console.log("Upscale mutation result:", result.data)
            await client.models.LogEntry.create({
                identityId: identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                level: "INFO",
                details: JSON.stringify({
                    output: result.data,
                    model: "philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e",
                    originalImagePath: originalPath,
                }),
            });
            setUpscaledUrl(result.data)
        } catch (err: any) {
            console.error("Upscale error:", err)
            await client.models.LogEntry.create({
                identityId: identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                level: "ERROR",
                details: JSON.stringify({
                    error: err.message,
                    stack: err.stack,
                    model: "philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e"
                }),
            });
            setError(err.message || "An error occurred during upscaling.")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!upscaledUrl || typeof upscaledUrl !== "string") return
        const session = await fetchAuthSession()
        const identityId = session.identityId!;
        const attributes = await fetchUserAttributes();
        try {
            const path = `photos/${identityId}/${saveFileName}`

            let fileExists = false
            try {
                await getProperties({ path })
                fileExists = true
            } catch (error: any) {
                if (error?.$metadata?.httpStatusCode === 404) {
                    fileExists = false
                } else {
                    console.warn("Non-404 error checking existence, continuing anyway:", error)
                    fileExists = false
                }
            }

            if (fileExists) {
                const confirmOverwrite = window.confirm(
                    `A file named "${saveFileName}" already exists. Overwrite it?`
                )
                if (!confirmOverwrite) {
                    return
                }
            }

            const response = await fetch(upscaledUrl)
            const blob = await response.blob()
            await uploadData({
                path,
                data: blob,
                options: {
                    metadata: { isAiGenerated: "true" },
                },
            })
            alert("File saved successfully.")
            await client.models.ImageRecord.create({
                identityId: identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                originalImagePath: originalPath,
                editedImagePath: path,
                model: "philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e",
                action: "upscale",
                source: "edited",
            });
        } catch (err: any) {
            console.error("Error saving file:", err)
            alert("Error saving file: " + err.message)
        }
    }

    const handleRegenerate = async () => {
        setUpscaledUrl(null)
        await handleUpscale()
    }

    const handleCompareOriginal = async () => {
        try {
            // Re-query the ImageRecord entries with the same filter criteria
            const res = await client.models.ImageRecord.list({
                filter: {
                    editedImagePath: { eq: originalPath },
                    action: { eq: "upscale" },
                },
            });
            if (!res.data || res.data.length === 0) {
                console.log("No upscale records found.");
                return;
            }
            // Sort records by the createdAt field (newest first)
            const sortedRecords = res.data.sort((a, b) => {
                // Assuming each record has a 'createdAt' field (ISO string)
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            const mostRecentRecord = sortedRecords[0];
            console.log("Most recent upscale record:", mostRecentRecord);
            const originalImagePathFromRecord = mostRecentRecord.originalImagePath;
            console.log("Original image path from record:", originalImagePathFromRecord);
            // Check if the original file exists by getting its properties
            try {
                const properties = await getProperties({ path: originalImagePathFromRecord });
                console.log("File properties:", properties);
                // If the file exists, get a presigned URL for it
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

    console.log("Rendering with:", { url, upscaledUrl })

    return (
        <Layout>
            <h1>Image Editor</h1>
            <div style={{ maxWidth: "600px", margin: "20px auto" }}>
                {upscaledUrl ? (
                    // Case 1: Upscale mutation executed – compare original (from query param "url") vs. new upscale (upscaledUrl)
                    < CustomCompareSlider before={url} after={upscaledUrl} />
                ) : compareOriginalUrl ? (
                    // Case 2: Pre-existing upscale record – compare original (compareOriginalUrl) vs. upscaled image (query param "url")
                    <CustomCompareSlider before={compareOriginalUrl} after={url} />
                ) : (
                    <img
                        src={url}
                        alt="Selected"
                        style={{ maxWidth: "100%", borderRadius: "8px" }}
                    />
                )}
            </div>
            <div style={{ textAlign: "center" }}>
                {upscaledUrl ? (
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
                        <button onClick={handleSave} className="button" style={{ marginRight: "10px" }}>
                            Save image
                        </button>
                        <button
                            onClick={handleRegenerate}
                            className="button"
                            title="...but the results will likely be exactly the same as this one"
                        >
                            Upscale again
                        </button>
                    </div>
                ) : (
                    <button onClick={handleUpscale} className="button" disabled={loading}>
                        {loading ? <span className="spinner" /> : "Upscale Image"}
                    </button>
                )}
                {error && <p style={{ color: "red" }}>{error}</p>}
                {isUpscaledRecord && (
                    <button onClick={handleCompareOriginal} className="button" style={{ marginLeft: "1rem" }}>
                        Compare with original
                    </button>
                )}
                <ModelCredits
                    modelName="Clarity Upscaler"
                    modelUrl="https://replicate.com/philz1337x/clarity-upscaler"
                />
            </div>
        </Layout>
    )
}