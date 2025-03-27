import { AIOperation, IAIProvider, ModelMetadata, ProviderMetadata, HistoryItem } from "./IAIProvider";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";

// Define a type for the parts that includes both text and inlineData
type GeminiPart =
    | { text: string }
    | { inlineData: { data: string; mimeType: string } };

export class GeminiProvider implements IAIProvider {
    private genAI: GoogleGenerativeAI;
    private MODEL_ID = "gemini-2.0-flash-exp";

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GCP_API_TOKEN || "");
    }

    getProviderInfo(): ProviderMetadata {
        return {
            serviceProvider: "gemini",
            apiEndpoint: "https://generativelanguage.googleapis.com"
        };
    }

    getModelInfo(operation: AIOperation): ModelMetadata {
        switch (operation) {
            case "generateImage":
                return {
                    modelName: this.MODEL_ID,
                    serviceProvider: "gemini",
                    displayName: "Google Gemini 2.0 Flash",
                    modelUrl: "https://ai.google.dev/gemini-api"
                };
            case "chatWithImage":
                return {
                    modelName: this.MODEL_ID,
                    serviceProvider: "gemini",
                    displayName: "Google Gemini 2.0 Flash",
                    modelUrl: "https://ai.google.dev/gemini-api"
                };
            default:
                throw new Error(`Operation ${operation} not supported by Gemini provider`);
        }
    }

    async generateImage(prompt: string, promptUpsampling = false): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({
                model: this.MODEL_ID,
                generationConfig: {
                    temperature: 1,
                    topP: 0.95,
                    topK: 40,
                },
            });

            const result = await model.generateContent(prompt);
            const response = result.response;

            if (!response.candidates?.length) throw new Error("No candidates in response");

            const parts = response.candidates[0].content.parts;
            const imagePart = parts.find(part => "inlineData" in part && part.inlineData) as { inlineData: { data: string; mimeType: string } } | undefined;
            if (!imagePart?.inlineData) throw new Error("No image generated in response");

            const { data, mimeType = "image/png" } = imagePart.inlineData;
            return `data:${mimeType};base64,${data}`;
        } catch (error: any) {
            console.error("Gemini image generation error:", error.message);
            throw new Error(`Gemini image generation failed: ${error.message}`);
        }
    }

    async chatWithImage(prompt: string, imageUrl: string, history: HistoryItem[] = []): Promise<{ text: string | null, image: string | null }> {
        try {
            const model = this.genAI.getGenerativeModel({
                model: this.MODEL_ID,
                generationConfig: {
                    temperature: 1,
                    topP: 0.95,
                    topK: 40,
                },
            });

            // Format history with explicit typing
            const formattedHistory: Content[] = history.map(item => ({
                role: item.role,
                parts: item.parts.map(part => {
                    if (part.text) return { text: part.text } as GeminiPart;
                    if (part.image) {
                        if (!part.image.startsWith("data:image/")) throw new Error("History image must be a base64 data URL");
                        const imgParts = part.image.split(",");
                        if (imgParts.length < 2) throw new Error("Invalid history image format");
                        return {
                            inlineData: {
                                data: imgParts[1],
                                mimeType: part.image.includes("image/png") ? "image/png" : "image/jpeg",
                            },
                        } as GeminiPart;
                    }
                    return { text: "" } as GeminiPart;
                }).filter(part => Object.keys(part).length > 0),
            }));

            const chat = model.startChat({ history: formattedHistory });
            const messageParts: GeminiPart[] = [{ text: prompt }];

            if (imageUrl) {
                if (!imageUrl.startsWith("data:image/")) throw new Error("Image URL must be a base64 data URL");
                const imageParts = imageUrl.split(",");
                if (imageParts.length < 2) throw new Error("Invalid image URL format");
                messageParts.push({
                    inlineData: {
                        data: imageParts[1],
                        mimeType: imageUrl.includes("image/png") ? "image/png" : "image/jpeg",
                    },
                });
            }

            const result = await chat.sendMessage(messageParts);
            const response = result.response;

            if (!response.candidates?.length) throw new Error("No candidates in response");

            const parts = response.candidates[0].content.parts;
            const textResponse = parts.find(part => "text" in part)?.text || null;
            const imagePart = parts.find(part => "inlineData" in part && part.inlineData) as { inlineData: { data: string; mimeType: string } } | undefined;
            const image = imagePart ? `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}` : null;

            return { text: textResponse, image };
        } catch (error: any) {
            console.error("Gemini chat error:", error.message);
            throw new Error(`Gemini chat failed: ${error.message}`);
        }
    }

    async upscaleImage(imageUrl: string): Promise<string> {
        throw new Error("Upscaling is not supported by the Gemini provider.");
    }

    async styleTransfer(prompt: string, styleImageUrl: string): Promise<string> {
        throw new Error("Style transfer is not supported by the Gemini provider.");
    }

    async outPaint(imageUrl: string): Promise<string> {
        throw new Error("Outpainting is not supported by the Gemini provider.");
    }
}