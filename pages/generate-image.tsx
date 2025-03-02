import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { uploadData, getProperties } from "aws-amplify/storage";
import { fetchAuthSession } from "aws-amplify/auth";
import Layout from "@/components/Layout";
import ModelCredits from "@/components/ModelCredits";

const client = generateClient<Schema>();

export default function GenerateImagePage() {
    const [prompt, setPrompt] = useState<string>("");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    // New state for the file name to be used when saving the generated image.
    const [saveFileName, setSaveFileName] = useState<string>("generated-image.jpg");

    // Existing handler to generate the image using your replicate function
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setResult(null);
        setLoading(true);
        try {
            const output = await client.mutations.generateImage({
                prompt: prompt,
                prompt_upsampling: true,
            });
            console.log("API response:", output);
            setResult(output);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    // New handler to save the generated image
    async function handleSave() {
        if (!result || typeof result.data !== "string") return;
        try {
            // Get the current user's identity so we can organize files per user.
            const session = await fetchAuthSession();
            const identityId = session.identityId;
            const path = `photos/${identityId}/${saveFileName}`;

            // Check if the file already exists
            let fileExists = false;
            try {
                await getProperties({ path });
                // If we get here, fileExists = true
                fileExists = true;
            } catch (error: any) {
                // If the error is 404 => doesn't exist => fileExists = false
                // Otherwise, log it but STILL continue
                if (error?.$metadata?.httpStatusCode === 404) {
                    fileExists = false;
                } else {
                    console.warn("Non-404 error checking existence, continuing anyway:", error);
                    fileExists = false;
                    // or maybe fileExists = true; depending on your preference
                }
            }


            // If file exists, ask user for confirmation to overwrite
            if (fileExists) {
                const confirmOverwrite = window.confirm(
                    `A file named "${saveFileName}" already exists. Overwrite it?`
                );
                if (!confirmOverwrite) {
                    return;
                }
            }

            // Fetch the generated image (using the URL returned by your replicate function)
            const response = await fetch(result.data);
            const blob = await response.blob();

            // Upload the image Blob. Note that we attach metadata to mark it as AI-generated.
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
        } catch (err) {
            console.error("Error saving file:", err);
            alert("Error saving file: " + err);
        }
    }

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
                    modelName="Flux 1.1 Pro"
                    modelUrl="https://replicate.com/black-forest-labs/flux-1.1-pro"
                />
            </div>
        </Layout>
    );
}
