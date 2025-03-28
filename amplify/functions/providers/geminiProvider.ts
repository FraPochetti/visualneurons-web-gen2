// amplify/functions/providers/geminiProvider.ts
import { AIOperation, IAIProvider, ModelMetadata, ProviderMetadata, HistoryItem } from "./IAIProvider";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import axios from "axios";

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

    private async convertUrlToBase64(url: string): Promise<string> {
        try {
            console.log(`GeminiProvider: Converting URL to base64: ${url.substring(0, 50)}...`);

            // Check if it's already a base64 data URL
            if (url.startsWith('data:image/')) {
                console.log("GeminiProvider: URL is already a valid image data URL");
                return url;
            }

            // Fetch the image using axios
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 15000 // 15 second timeout
            });

            // Force image MIME type based on content or default to jpeg
            let contentType = response.headers['content-type'] || 'image/jpeg';

            // If content is octet-stream or another non-image type, determine from data or default to jpeg
            if (!contentType.startsWith('image/')) {
                // Try to detect image type from header bytes
                const header = Buffer.from(response.data.slice(0, 4)).toString('hex');
                if (header.startsWith('89504e47')) {
                    contentType = 'image/png';
                } else if (header.startsWith('ffd8ff')) {
                    contentType = 'image/jpeg';
                } else {
                    // Default to jpeg if detection fails
                    contentType = 'image/jpeg';
                }
            }

            const base64 = Buffer.from(response.data).toString('base64');
            const dataUrl = `data:${contentType};base64,${base64}`;

            console.log(`GeminiProvider: Successfully converted image to base64. Length: ${dataUrl.length}`);
            console.log(`First 100 characters of base64: ${dataUrl.substring(0, 100)}...`);
            return dataUrl;
        } catch (error: any) {
            console.error("GeminiProvider: Failed to convert URL to base64:", error);
            throw new Error(`Failed to convert image: ${error.message}`);
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

            // Convert the image URL to base64 if it's not already
            let base64Image = imageUrl;
            if (!imageUrl.startsWith('data:')) {
                console.log("GeminiProvider: Image URL is not in base64 format, converting...");
                base64Image = await this.convertUrlToBase64(imageUrl);
            }
            console.log(`First 100 characters of base64: ${base64Image.substring(0, 100)}...`);
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

            if (base64Image) {
                if (!base64Image.startsWith("data:image/")) throw new Error("Image URL must be a base64 data URL");
                const imageParts = base64Image.split(",");
                if (imageParts.length < 2) throw new Error("Invalid image URL format");
                messageParts.push({
                    inlineData: {
                        data: imageParts[1],
                        mimeType: base64Image.includes("image/png") ? "image/png" : "image/jpeg",
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