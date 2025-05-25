// amplify/functions/providers/geminiProvider.ts
import { GoogleGenAI } from '@google/genai';
import { IAIProvider, AIOperation, ProviderMetadata, ModelMetadata } from './IAIProvider';
import axios from 'axios';

export class GeminiProvider implements IAIProvider {
    getProviderInfo(): ProviderMetadata {
        return {
            serviceProvider: "gemini",
            apiEndpoint: "https://api.google.com/genai" // placeholder endpoint
        };
    }

    getModelInfo(operation: AIOperation): ModelMetadata {
        if (operation === 'generateImage') {
            return {
                modelName: 'gemini-2.0-flash-exp-image-generation',
                modelVersion: 'experimental',
                serviceProvider: "gemini",
                displayName: "Gemini 2.0 Flash Experimental",
                modelUrl: "https://developers.google.com/genai/gemini"
            };
        } else if (operation === 'inpaint') {
            return {
                modelName: 'gemini-2.0-flash-exp-image-generation',
                modelVersion: 'experimental',
                serviceProvider: "gemini",
                displayName: "Gemini 2.0 Editor",
                modelUrl: "https://developers.google.com/genai/gemini"
            };
        }
        throw new Error(`Operation ${operation} not supported by GeminiProvider`);
    }

    async generateImage(prompt: string, promptUpsampling = false): Promise<string> {
        const ai = new GoogleGenAI({ apiKey: process.env.GCP_API_TOKEN });
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-exp-image-generation',
                contents: prompt,
                config: {
                    responseModalities: ['Text', 'Image']
                },
            });
            if (!response.candidates || response.candidates.length === 0) {
                // Log the raw response for debugging purposes
                console.error("No candidates returned from Gemini. Full response:", JSON.stringify(response));
                throw new Error("No candidates returned from Gemini");
            }
            const candidate = response.candidates[0];
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                console.error("No content parts in candidate. Full candidate:", JSON.stringify(candidate));
                throw new Error("No content parts found in Gemini candidate");
            }
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
            throw new Error("No image data received from Gemini");
        } catch (error: any) {
            console.error("Gemini generation failed. Error details:", error);
            throw new Error(`Gemini generation failed: ${error.message}`);
        }
    }

    async inpaint(prompt: string, imageInput: string): Promise<string> {
        const ai = new GoogleGenAI({ apiKey: process.env.GCP_API_TOKEN });
        try {
            let imageBase64 = '';
            let mimeType = 'image/png';

            // If the input is a URL, fetch and convert to base64
            if (imageInput.startsWith('http')) {
                console.log("INSIDE HTTP: Image inpu starts with first 100 chars:", imageInput.substring(0, 100));
                const response = await axios.get(imageInput, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data);
                imageBase64 = buffer.toString('base64');
            } else {
                // Check for and strip Data URI prefix
                console.log("INSIDE BASE64: Image input starts with first 100 chars:", imageInput.substring(0, 100));
                const match = imageInput.match(/^data:(image\/\w+);base64,(.*)$/);
                if (match && match[1] && match[2]) {
                    mimeType = match[1]; // Get actual mime type
                    imageBase64 = match[2]; // Get raw Base64 data
                } else {
                    // Assume it might be raw base64 already or handle error
                    console.log("Image input does not match Data URI format. Using as is with first 100 chars:", imageInput.substring(0, 100));
                    imageBase64 = imageInput;
                    // Consider logging a warning here if format is unexpected
                }
            }

            const contents = [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: imageBase64,
                    }
                }
            ];

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-exp-image-generation',
                contents,
                config: {
                    responseModalities: ['Text', 'Image']
                },
            });

            if (!response.candidates || response.candidates.length === 0) {
                console.error("No candidates returned from Gemini in inpaint. Full response:", JSON.stringify(response));
                throw new Error("No candidates returned from Gemini");
            }
            const candidate = response.candidates[0];
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                console.error("No content parts found in Gemini candidate for inpainting. Full candidate:", JSON.stringify(candidate));
                throw new Error("No content parts found in Gemini candidate for inpainting");
            }
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
            throw new Error("No image data received from Gemini during inpainting");
        } catch (error: any) {
            console.error("Gemini inpainting failed. Error details:", error);
            throw new Error(`Gemini inpainting failed: ${error.message}`);
        }
    }

    // For now, we do not implement other methods (upscaleImage, styleTransfer, outPaint)
    async upscaleImage(imageUrl: string): Promise<string> {
        throw new Error("Operation not supported by GeminiProvider");
    }
    async styleTransfer(prompt: string, styleImageUrl: string): Promise<string> {
        throw new Error("Operation not supported by GeminiProvider");
    }
    async outPaint(imageUrl: string): Promise<string> {
        throw new Error("Operation not supported by GeminiProvider");
    }
}
