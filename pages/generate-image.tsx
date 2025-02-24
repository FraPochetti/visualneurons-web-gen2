// pages/generate-image.tsx
import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

// Create the API client for your schema
const client = generateClient<Schema>();

export default function GenerateImagePage() {
    const [inputValue, setInputValue] = useState<string>("");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setResult(null);
        try {
            // Parse the JSON input provided by the user
            const parsedInput = JSON.parse(inputValue);
            console.log("Parsed input:", parsedInput);
            console.log("About to call generateImage...");
            const response = await client.mutations.generateImage({
                input: parsedInput
            });
            console.log("Mutation response:", response);
            setResult(response.data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred");
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Generate Image via Replicate</h1>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder='Enter JSON input, e.g. {"prompt": "a beautiful sunrise over mountains"}'
                    rows={6}
                    cols={60}
                    style={{ marginBottom: "1rem" }}
                />
                <br />
                <button type="submit">Generate Image</button>
            </form>
            {error && (
                <div style={{ color: "red", marginTop: "1rem" }}>
                    Error: {error}
                </div>
            )}
            {result && (
                <div style={{ marginTop: "1rem" }}>
                    <h2>Response:</h2>
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
