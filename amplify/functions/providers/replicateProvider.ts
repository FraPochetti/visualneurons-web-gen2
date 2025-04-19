// amplify/functions/providers/replicateProvider.ts
import { IAIProvider } from "./IAIProvider";
import Replicate from "replicate";
import { AIOperation, ModelMetadata, ProviderMetadata } from "./IAIProvider";

const GENERATE_IMAGE_MODEL = "black-forest-labs/flux-1.1-pro-ultra";
const UPSCALE_IMAGE_VERSION = "dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e";
export class ReplicateProvider implements IAIProvider {
    getProviderInfo(): ProviderMetadata {
        return {
            serviceProvider: "replicate",
            apiEndpoint: "https://api.replicate.com/v1/predictions"
        };
    }

    getModelInfo(operation: AIOperation): ModelMetadata {
        switch (operation) {
            case "generateImage":
                return {
                    modelName: GENERATE_IMAGE_MODEL,
                    serviceProvider: "replicate",
                    displayName: "Flux 1.1 Pro Ultra",
                    modelUrl: "https://replicate.com/black-forest-labs/flux-1.1-pro-ultra"
                };
            case "upscaleImage":
                return {
                    modelName: "philz1337x/clarity-upscaler",
                    modelVersion: UPSCALE_IMAGE_VERSION,
                    serviceProvider: "replicate",
                    displayName: "Clarity Upscaler",
                    modelUrl: "https://replicate.com/philz1337x/clarity-upscaler"
                };
            default:
                throw new Error(`Operation ${operation} not supported by this provider`);
        }
    }

    async generateImage(prompt: string, promptUpsampling = true): Promise<string> {
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        const model = GENERATE_IMAGE_MODEL;

        // Create prediction
        const prediction = await replicate.predictions.create({
            model,
            input: { prompt, prompt_upsampling: promptUpsampling },
        });

        // Poll for the result
        let completed = null;
        for (let i = 0; i < 15; i++) {
            const latest = await replicate.predictions.get(prediction.id);
            if (latest.status !== "starting" && latest.status !== "processing") {
                completed = latest;
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (!completed) {
            throw new Error("Prediction timed out");
        }
        if (completed.status === "failed") {
            throw new Error(`Prediction failed: ${completed.error}`);
        }

        if (typeof completed.output === "string") {
            return completed.output;
        } else if (Array.isArray(completed.output) && completed.output.length > 0) {
            return completed.output[0];
        }
        throw new Error("Unexpected output format");
    }

    async upscaleImage(imageUrl: string): Promise<string> {
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        const version = UPSCALE_IMAGE_VERSION;

        const prediction = await replicate.predictions.create({
            version,
            input: { image: imageUrl },
        });

        let completed = null;
        for (let i = 0; i < 15; i++) {
            const latest = await replicate.predictions.get(prediction.id);
            if (latest.status !== "starting" && latest.status !== "processing") {
                completed = latest;
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (!completed) {
            throw new Error("Upscale prediction timed out");
        }
        if (completed.status === "failed") {
            throw new Error(`Upscale failed: ${completed.error}`);
        }

        if (typeof completed.output === "string") {
            return completed.output;
        } else if (Array.isArray(completed.output) && completed.output.length > 0) {
            return completed.output[0];
        }
        throw new Error("Unexpected output format");
    }

    async styleTransfer(prompt: string, styleImageUrl: string): Promise<string> {
        throw new Error("Style transfer is not supported by the Replicate provider.");
    }

    async outPaint(imageUrl: string): Promise<string> {
        throw new Error("Outpainting is not supported by the Replicate provider.");
    }

    async inpaint(prompt: string, imageBase64: string): Promise<string> {
        throw new Error("Inpainting is not supported by the Replicate provider.");
    }

    async generateVideo(
        promptImage: string,
        promptText: string,
        duration?: number,
        ratio?: string
    ): Promise<string> {
        throw new Error("generateVideo is not supported by Replicate provider");
    }

}
