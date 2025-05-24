import RunwayML from '@runwayml/sdk';
import axios from 'axios';
import { IAIProvider, AIOperation, ProviderMetadata, ModelMetadata } from './IAIProvider';
import poll from '../../../utils/poll';

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
        if (!token) throw new Error("Missing RUNWAY_API_TOKEN");
        const client = new RunwayML({ apiKey: token });

        // —— Your Gemini‑style snippet adapted here —— //

        // 1. Prepare a base64 payload
        let imageBase64: string;
        let mimeType = 'image/png';

        if (/^https?:\/\//i.test(promptImage)) {
            // URL case: fetch bytes, derive MIME, base64‑encode
            const resp = await axios.get<ArrayBuffer>(promptImage, { responseType: 'arraybuffer' });
            const ext = (promptImage.split('.').pop() || '').toLowerCase();
            mimeType = resp.headers['content-type']?.startsWith('image/')
                ? resp.headers['content-type']
                : ext === 'jpg' || ext === 'jpeg'
                    ? 'image/jpeg'
                    : 'image/png';
            imageBase64 = Buffer.from(resp.data).toString('base64');
        } else {
            // Data URI or plain base64
            const match = promptImage.match(/^data:(image\/\w+);base64,(.*)$/);
            if (match) {
                mimeType = match[1];
                imageBase64 = match[2];
            } else {
                // Treat as raw base64
                imageBase64 = promptImage;
            }
        }

        const dataUri = `data:${mimeType};base64,${imageBase64}`;

        // —— End of snippet —— //

        // Narrow duration & ratio exactly like before
        const durationParam = duration === 5 ? 5 : duration === 10 ? 10 : undefined;
        const allowedRatios = [
            "1280:720", "720:1280", "1104:832", "832:1104",
            "960:960", "1584:672", "1280:768", "768:1280"
        ] as const;
        const ratioParam = allowedRatios.includes(ratio as any)
            ? (ratio as typeof allowedRatios[number])
            : undefined;

        // Kick off the Runway task
        const videoTask = await client.imageToVideo.create({
            model: "gen4_turbo",
            promptImage: dataUri,
            promptText,
            duration: durationParam,
            ratio: ratioParam,
        });

        // Poll until done
        const task = await poll(
            () => client.tasks.retrieve(videoTask.id),
            10000,
            (t) => ["SUCCEEDED", "FAILED"].includes(t.status)
        );

        if (task.status === "FAILED") {
            throw new Error(`Runway video failed: ${task.failure || 'Unknown error'}`);
        }

        const out = task.output;

        // 1) If it’s a single URL, just return it
        if (typeof out === "string") {
            return out;
        }

        // 2) If it’s an array with at least one URL, return the first
        if (Array.isArray(out) && out.length > 0) {
            return out[0];
        }

        // 3) Otherwise blow up with a clear error
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
