import { AIOperation, IAIProvider, ModelMetadata, ProviderMetadata } from "./IAIProvider";
import axios from "axios";
import FormData from "form-data";
import logger from '../../utils/logger';

// Helper function to call the resize Lambda via its Function URL stored in LAMBDA_RESIZE_URL secret
async function callResizeLambda(base64Image: string): Promise<string> {
    // Retrieve the Lambda URL from environment variables (set via Amplify secrets)
    const lambdaUrl = process.env.LAMBDA_RESIZE_URL;
    if (!lambdaUrl) {
        throw new Error("LAMBDA_RESIZE_URL is not configured.");
    }

    // POST the base64 image to the Lambda
    const response = await axios.post(lambdaUrl, { imageBase64: base64Image });
    if (response.status !== 200) {
        throw new Error(`Resize Lambda error: ${response.statusText}`);
    }
    // Expecting the response to contain { imageBase64: "<resized_base64>" }
    return response.data.imageBase64;
}

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
            logger.error('Stability API error:', error.response?.data || error.message);
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
            // Fetch the original image as a binary array
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const originalBuffer = Buffer.from(imageResponse.data);
            // Convert the original image to base64
            const originalBase64 = originalBuffer.toString('base64');

            // Call your resize Lambda to get a resized base64 image
            const resizedBase64 = await callResizeLambda(originalBase64);

            // Convert the resized base64 back to a Buffer for FormData
            const resizedBuffer = Buffer.from(resizedBase64, 'base64');

            const formData = new FormData();
            formData.append('image', resizedBuffer, 'input.png');
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
            logger.error('Stability Outpaint error:', error.response?.data || error.message);
            throw new Error(`Stability Outpaint failed: ${error.message}`);
        }
    }

    async upscaleImage(imageUrl: string): Promise<string> {
        throw new Error("Stability provider upscaling not implemented yet");
    }

    async inpaint(prompt: string, imageBase64: string): Promise<string> {
        throw new Error("Stability provider inpainting not implemented yet");
    }
    async generateVideo(promptImage: string, promptText: string, duration?: number, ratio?: string): Promise<string> {
        throw new Error("Stability provider video generation not implemented yet");
    }
}