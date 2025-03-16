// pages/generate-image.tsx
import Layout from "@/components/Layout";
import ImageGenerator from "@/components/ImageOperations/ImageGenerator";
import { useState } from "react";
import { uploadData } from "aws-amplify/storage";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

export default function GenerateImagePage() {
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [saveFileName, setSaveFileName] = useState("generated-image.jpg");
    const client = generateClient<Schema>();

    const handleImageGenerated = (imageUrl: string) => {
        setGeneratedImage(imageUrl);
    };

    const handleSave = async () => {
        if (!generatedImage) return;

        const session = await fetchAuthSession();
        const identityId = session.identityId!;
        const attributes = await fetchUserAttributes();

        try {
            const path = `photos/${identityId}/${saveFileName}`;
            const response = await fetch(generatedImage);
            const blob = await response.blob();

            await uploadData({
                path,
                data: blob,
                options: {
                    metadata: { isAiGenerated: "true" },
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

                <ImageGenerator onSuccess={handleImageGenerated} />

                {generatedImage && (
                    <div style={{ marginTop: "1rem" }}>
                        <div>
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
            </div>
        </Layout>
    );
}