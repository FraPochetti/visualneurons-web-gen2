// amplify/functions/providers/runwayProvider.ts
import RunwayML from '@runwayml/sdk';
import { IAIProvider, AIOperation, ProviderMetadata, ModelMetadata } from './IAIProvider';

export class RunwayProvider implements IAIProvider {
    getProviderInfo(): ProviderMetadata {
        return {
            serviceProvider: "runway",
            apiEndpoint: "https://api.runwayml.com"
        };
    }

    getModelInfo(operation: AIOperation): ModelMetadata {
        if (operation === "generateVideo") {
            return {
                modelName: "gen4_turbo",
                serviceProvider: "runway",
                displayName: "Runway Video Generator",
                modelUrl: "https://docs.runwayml.com/"
            };
        }
        throw new Error(`Operation ${operation} not supported by RunwayProvider`);
    }

    async generateVideo(
        promptImage: string,
        promptText: string,
        duration?: number,
        ratio?: string
    ): Promise<string> {
        const token = process.env.RUNWAY_API_TOKEN;
        if (!token) {
            throw new Error("Missing RUNWAY_API_TOKEN environment variable");
        }

        // Instantiate the Runway client with your API token
        const client = new RunwayML({ apiKey: token });

        const durationParam =
            duration === 5 ? 5 :
                duration === 10 ? 10 :
                    undefined;

        const allowedRatios = [
            "1280:720", "720:1280", "1104:832", "832:1104",
            "960:960", "1584:672", "1280:768", "768:1280"
        ] as const;

        const ratioParam = allowedRatios.includes(ratio as any)
            ? (ratio as typeof allowedRatios[number])
            : undefined;
        // Kick off the video generation task. You can supply duration and ratio if provided.
        const videoTask = await client.imageToVideo.create({
            model: "gen4_turbo",
            promptImage,
            promptText,
            duration: durationParam,
            ratio: ratioParam,
        });

        // Poll for the task status every 10 seconds until it's either succeeded or failed.
        let task: any;
        do {
            await new Promise(resolve => setTimeout(resolve, 10000));
            task = await client.tasks.retrieve(videoTask.id);
        } while (!["SUCCEEDED", "FAILED"].includes(task.status));

        if (task.status === "FAILED") {
            throw new Error(`Runway video generation failed: ${task.failure || "Unknown error"}`);
        }

        // Return the generated video URL.
        if (typeof task.output === "string") {
            return task.output;
        } else if (Array.isArray(task.output) && task.output.length > 0) {
            return task.output[0];
        }

        throw new Error("Unexpected output format from Runway video generation");
    }

    // The following methods are not supported by the Runway provider
    async generateImage(prompt: string, promptUpsampling = false): Promise<string> {
        throw new Error("generateImage is not supported by RunwayProvider");
    }
    async upscaleImage(imageUrl: string): Promise<string> {
        throw new Error("upscaleImage is not supported by RunwayProvider");
    }
    async styleTransfer(prompt: string, styleImageUrl: string): Promise<string> {
        throw new Error("styleTransfer is not supported by RunwayProvider");
    }
    async outPaint(imageUrl: string): Promise<string> {
        throw new Error("outPaint is not supported by RunwayProvider");
    }
    async inpaint(prompt: string, imageBase64: string): Promise<string> {
        throw new Error("inpaint is not supported by RunwayProvider");
    }
}
