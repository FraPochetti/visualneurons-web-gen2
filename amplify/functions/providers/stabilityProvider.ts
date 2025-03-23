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
            case "styleTransfer":
                return {
                    modelName: "stable-image/control/style",
                    serviceProvider: "stability",
                    displayName: "Style Transfer",
                    modelUrl: "https://stability.ai/stable-image"
                };
            case "outpaint":
                return {
                    modelName: "stable-image/edit/outpaint",
                    serviceProvider: "stability",
                    displayName: "Stable Diffusion Outpaint",
                    modelUrl: "https://stability.ai/stable-image"
                };
            default:
                throw new Error(`Operation ${operation} not supported by Stability provider`);
        }
    }

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

    async styleTransfer(prompt: string, styleImageUrl: string): Promise<string> {
        const imageResponse = await axios.get(styleImageUrl, { responseType: 'arraybuffer' });

        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('image', imageResponse.data, 'style.png');

        const response = await axios.post(
            'https://api.stability.ai/v2beta/stable-image/control/style',
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

        if (response.status !== 200) {
            throw new Error(`Stability API returned ${response.status}: ${JSON.stringify(response.data)}`);
        }

        if (response.data && response.data.image) {
            return `data:image/png;base64,${response.data.image}`;
        }

        throw new Error('No image data found in the response');
    }

    async outPaint(imageUrl: string): Promise<string> {
        try {
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

            const formData = new FormData();
            formData.append('image', imageResponse.data, 'input.png');
            formData.append('left', 300);
            formData.append('right', 300);
            formData.append('up', 300);
            formData.append('down', 300);
            formData.append('output_format', 'png');

            const response = await axios.post(
                'https://api.stability.ai/v2beta/stable-image/edit/outpaint',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.STABILITY_API_TOKEN}`,
                        Accept: 'application/json',
                        ...formData.getHeaders()
                    },
                    responseType: 'json',
                    timeout: 90000
                }
            );

            if (response.status !== 200) {
                throw new Error(`API returned status code ${response.status}: ${JSON.stringify(response.data)}`);
            }

            if (response.data && response.data.image) {
                return `data:image/png;base64,${response.data.image}`;
            }

            throw new Error('No image data in response');
        } catch (error: any) {
            console.error('Stability Outpaint error:', error.response?.data || error.message);
            throw new Error(`Stability Outpaint failed: ${error.message}`);
        }
    }

    async upscaleImage(imageUrl: string): Promise<string> {
        throw new Error("Stability provider upscaling not implemented yet");
    }
}