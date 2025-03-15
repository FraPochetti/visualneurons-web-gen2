// amplify/functions/providers/replicateProvider.ts
import { IAIProvider } from "./IAIProvider";
import Replicate from "replicate";

export class ReplicateProvider implements IAIProvider {
    async generateImage(prompt: string, promptUpsampling = true): Promise<string> {
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        const model = "black-forest-labs/flux-1.1-pro-ultra";

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
        const version = "dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e";

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
}
