// pages/edit-image.tsx
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import CustomCompareSlider from "@/components/CustomCompareSlider";

const client = generateClient<Schema>();

export default function EditImagePage() {
    const router = useRouter();
    const { url } = router.query;
    const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!url || typeof url !== "string") {
        return (
            <Layout>
                <p>No image URL provided.</p>
            </Layout>
        );
    }

    const handleUpscale = async () => {
        setLoading(true);
        setError("");
        try {
            console.log("Upscaling image:", url);
            const result = await client.mutations.upscaleImage({ imageUrl: url });
            console.log("Upscale mutation result:", result.data);
            setUpscaledUrl(result.data);
        } catch (err: any) {
            console.error("Upscale error:", err);
            setError(err.message || "An error occurred during upscaling.");
        } finally {
            setLoading(false);
        }
    };
    console.log("Rendering with:", { url, upscaledUrl });
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
                <button onClick={handleUpscale} className="button" disabled={loading}>
                    {loading ? "Upscaling..." : "Upscale Image"}
                </button>
                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
        </Layout>
    );
}
