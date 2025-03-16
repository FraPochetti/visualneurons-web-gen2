import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { uploadData, getProperties } from "aws-amplify/storage";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import Layout from "@/components/Layout";
import ModelCredits from "@/components/ModelCredits";
import ProviderSelector from "@/components/ProviderSelector";

const client = generateClient<Schema>();

export default function GenerateImagePage() {
    const [prompt, setPrompt] = useState("");
    const [provider, setProvider] = useState("replicate");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [saveFileName, setSaveFileName] = useState("generated-image.jpg");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setResult(null);
        setLoading(true);
        const identityId = (await fetchAuthSession()).identityId!;
        const attributes = await fetchUserAttributes();
        try {
            const output = await client.mutations.generateImage({
                prompt,
                prompt_upsampling: true,
                provider,
                operation: "generateImage",
            });
            console.log("API response:", output);
            await client.models.LogEntry.create({
                identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                level: "INFO",
                provider: provider as "replicate" | "stability" | "clipdrop" | "user",
                details: JSON.stringify({
                    prompt,
                    model: "black-forest-labs/flux-1.1-pro-ultra",
                    output: output.data,
                }),
            });
            setResult(output);
        } catch (err: any) {
            console.error(err);
            await client.models.LogEntry.create({
                identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                level: "ERROR",
                details: JSON.stringify({
                    error: err.message,
                    stack: err.stack,
                    model: "black-forest-labs/flux-1.1-pro-ultra",
                }),
            });
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result || typeof result.data !== "string") return;
        const session = await fetchAuthSession();
        const identityId = session.identityId!;
        const attributes = await fetchUserAttributes();
        try {
            const path = `photos/${identityId}/${saveFileName}`;

            let fileExists = false;
            try {
                await getProperties({ path });
                fileExists = true;
            } catch (error: any) {
                if (error?.$metadata?.httpStatusCode === 404) {
                    fileExists = false;
                } else {
                    console.warn("Non-404 error checking existence, continuing anyway:", error);
                    fileExists = false;
                }
            }

            if (fileExists) {
                const confirmOverwrite = window.confirm(
                    `A file named "${saveFileName}" already exists. Overwrite it?`
                );
                if (!confirmOverwrite) {
                    return;
                }
            }

            const response = await fetch(result.data);
            const blob = await response.blob();
            await uploadData({
                path,
                data: blob,
                options: {
                    metadata: {
                        isAiGenerated: "true",
                    },
                },
            });
            alert("File saved successfully.");
            await client.models.ImageRecord.create({
                identityId,
                userSub: attributes.sub,
                userEmail: attributes.email,
                originalImagePath: path,
                model: "black-forest-labs/flux-1.1-pro-ultra",
                source: "generated",
                provider: "user",
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
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter a prompt, e.g. cool sunrise"
                        rows={4}
                        style={{
                            width: "100%",
                            maxWidth: "600px",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                        }}
                    />
                    <br />
                    <ProviderSelector value={provider} onChange={(e) => setProvider(e.target.value)} />
                    <button type="submit" className="button" disabled={loading}>
                        {loading ? <span className="spinner" /> : "Generate Image"}
                    </button>
                </form>
                {result && typeof result.data === "string" && result.data.startsWith("http") && (
                    <div style={{ marginTop: "1rem" }}>
                        <h2>Generated Image:</h2>
                        <img
                            src={result.data}
                            alt="Generated"
                            style={{ maxWidth: "100%", maxHeight: "500px" }}
                        />
                        <div style={{ marginTop: "1rem" }}>
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
                {error && <div style={{ color: "red", marginTop: "1rem" }}>Error: {error}</div>}
                <ModelCredits
                    modelName="Flux 1.1 Pro Ultra"
                    modelUrl="https://replicate.com/black-forest-labs/flux-1.1-pro-ultra"
                />
            </div>
        </Layout>
    );
}
