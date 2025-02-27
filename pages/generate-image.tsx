// pages/generate-image.tsx
import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import Link from "next/link";
import Layout from "@/components/Layout";

// Create the API client for your schema
const client = generateClient<Schema>();

export default function GenerateImagePage() {
    const [inputValue, setInputValue] = useState<string>("");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setResult(null);
        setLoading(true);
        try {
            const parsedInput = JSON.parse(inputValue);
            console.log("Parsed input:", parsedInput);
            const output = await client.mutations.generateImage({
                prompt: parsedInput.prompt,
                prompt_upsampling: parsedInput.prompt_upsampling,
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

    return (
        <Layout>
            <nav style={{ marginBottom: "20px" }}>
                <Link href="/dashboard">
                    ← Back to Dashboard
                </Link>
            </nav>
            <h1>Generate Image via Replicate</h1>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder='Enter JSON input, e.g. {"prompt": "a beautiful sunrise over mountains"}'
                    rows={6}
                    style={{
                        width: "100%",
                        maxWidth: "600px",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid #ccc"
                    }}
                />
                <br />
                <button type="submit" className="button" disabled={loading}>
                    {loading ? <span className="spinner" /> : "Generate Image"}
                </button>
            </form>
            {error && (
                <div style={{ color: "red", marginTop: "1rem" }}>
                    Error: {error}
                </div>
            )}
            {result && (
                <div style={{ marginTop: "1rem" }}>
                    <h2>Generated Image:</h2>
                    {typeof result.data === 'string' && result.data.startsWith('http') ? (
                        <img
                            src={result.data}
                            alt="Generated"
                            style={{ maxWidth: '100%', maxHeight: '500px' }}
                        />
                    ) : (
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                    )}
                </div>
            )}
        </Layout>
    );
}
