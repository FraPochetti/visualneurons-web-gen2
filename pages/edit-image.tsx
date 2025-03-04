import { useRouter } from "next/router"
import Layout from "@/components/Layout"
import { useState } from "react"
import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/amplify/data/resource"
import CustomCompareSlider from "@/components/CustomCompareSlider"
import { fetchAuthSession } from "aws-amplify/auth"
import { uploadData, getProperties } from "aws-amplify/storage"
import ModelCredits from "@/components/ModelCredits";

const client = generateClient<Schema>()

export default function EditImagePage() {
    const router = useRouter()
    const { url } = router.query
    const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [saveFileName, setSaveFileName] = useState("upscaled-image.jpg")

    if (!url || typeof url !== "string") {
        return (
            <Layout>
                <p>No image URL provided.</p>
            </Layout>
        )
    }

    const handleUpscale = async () => {
        setLoading(true)
        setError("")
        try {
            console.log("Upscaling image:", url)
            const result = await client.mutations.upscaleImage({ imageUrl: url })
            console.log("Upscale mutation result:", result.data)
            setUpscaledUrl(result.data)
        } catch (err: any) {
            console.error("Upscale error:", err)
            setError(err.message || "An error occurred during upscaling.")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!upscaledUrl || typeof upscaledUrl !== "string") return

        try {
            const session = await fetchAuthSession()
            const identityId = session.identityId
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
        } catch (err: any) {
            console.error("Error saving file:", err)
            alert("Error saving file: " + err.message)
        }
    }

    const handleRegenerate = async () => {
        setUpscaledUrl(null)
        await handleUpscale()
    }

    console.log("Rendering with:", { url, upscaledUrl })

    return (
        <Layout>
            <h1>Image Editor</h1>
            <div style={{ maxWidth: "600px", margin: "20px auto" }}>
                {upscaledUrl ? (
                    <CustomCompareSlider before={url} after={upscaledUrl} />
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
                <ModelCredits
                    modelName="Clarity Upscaler"
                    modelUrl="https://replicate.com/philz1337x/clarity-upscaler"
                />
            </div>
        </Layout>
    )
}