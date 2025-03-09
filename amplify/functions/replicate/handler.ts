// amplify/functions/replicate/handler.ts
import { Schema } from "../../data/resource";
import Replicate from "replicate";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

export const handler: Schema["generateImage"]["functionHandler"] = async (event) => {
    console.log("=== Starting image generation ===");

    const { prompt, prompt_upsampling } = event.arguments;
    if (!prompt) {
        throw new Error("Missing prompt for image generation");
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const model = "black-forest-labs/flux-1.1-pro";

    try {
        // Create the prediction
        const prediction = await replicate.predictions.create({
            model: model,
            input: {
                prompt,
                prompt_upsampling: prompt_upsampling ?? true,
            }
        });

        console.log("Prediction created:", prediction.id);

        // Poll for the result
        let completed = null;
        for (let i = 0; i < 15; i++) { // Increased timeout attempts to 15
            const latest = await replicate.predictions.get(prediction.id);
            console.log("Polling prediction:", latest.status);

            if (latest.status !== "starting" && latest.status !== "processing") {
                completed = latest;
                break;
            }
            // Wait for 2 seconds before polling again
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (!completed) {
            throw new Error("Prediction timed out");
        }

        if (completed.status === "failed") {
            throw new Error(`Prediction failed: ${completed.error}`);
        }

        console.log("Prediction completed:", completed.status);
        console.log("Output:", completed.output);
        await client.models.LogEntry.create({
            timestamp: new Date().toISOString(),
            level: "INFO",
            message: "Replicate generate image success with model: black-forest-labs/flux-1.1-pro",
            details: { output: completed.output, model: model, prompt: prompt, predictionId: prediction.id },
        });

        // Handle output based on its type
        if (typeof completed.output === 'string') {
            return completed.output;
        } else if (Array.isArray(completed.output) && completed.output.length > 0) {
            return completed.output[0];
        } else {
            throw new Error(`Unexpected output format: ${JSON.stringify(completed.output)}`);
        }
    } catch (err) {
        console.error("Replicate API call failed:", err);
        const error = err instanceof Error ? err : new Error(String(err));
        await client.models.LogEntry.create({
            timestamp: new Date().toISOString(),
            level: "ERROR",
            message: "Replicate generate image error with model: black-forest-labs/flux-1.1-pro",
            details: { error: error.message, stack: error.stack },
        });
        throw error;
    }
};