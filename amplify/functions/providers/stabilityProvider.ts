// amplify/functions/providers/stabilityProvider.ts
import { AIOperation, IAIProvider, ModelMetadata, ProviderMetadata } from "./IAIProvider";
import axios from "axios";
import FormData from "form-data";

export class StabilityProvider implements IAIProvider {
    getProviderInfo(): ProviderMetadata {
        return {
            serviceProvider: "stability",
            apiEndpoint: "https://api.stability.ai/v2beta"
        };
    }

    getModelInfo(operation: AIOperation): ModelMetadata {
        switch (operation) {
            case "generateImage":
                return {
                    modelName: "stable-diffusion-ultra",
                    modelVersion: "v2",
                    serviceProvider: "stability",
                    displayName: "Stable Diffusion Ultra",
                    modelUrl: "https://stability.ai/stable-image"
                };
            case "upscaleImage":
                return {
                    modelName: "esrgan-v1-x2plus",
                    serviceProvider: "stability"
                };
            default:
                throw new Error(`Operation ${operation} not supported by Stability provider`);
        }
    }

    // amplify/functions/providers/stabilityProvider.ts - Enhance error handling
    async generateImage(prompt: string, promptUpsampling = true): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            formData.append('output_format', 'png');

            const response = await axios.post(
                'https://api.stability.ai/v2beta/stable-image/generate/ultra',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.STABILITY_API_TOKEN}`,
                        Accept: 'application/json',
                        ...formData.getHeaders()
                    },
                    responseType: 'json'
                }
            );

            // Enhanced error handling
            if (response.status !== 200) {
                throw new Error(`API returned status code ${response.status}: ${JSON.stringify(response.data)}`);
            }

            if (response.data && response.data.image) {
                return `data:image/png;base64,${response.data.image}`;
            }

            throw new Error('No image data in response: ' + JSON.stringify(response.data));
        } catch (error: any) {
            console.error('Stability API error:', error.response?.data || error.message);
            throw new Error(`Stability image generation failed: ${error.message}`);
        }
    }

    async upscaleImage(imageUrl: string): Promise<string> {
        throw new Error("Stability provider upscaling not implemented yet");
    }
}