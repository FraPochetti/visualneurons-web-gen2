// amplify/functions/replicate/handler.ts
import { Schema } from "../../data/resource";
import Replicate from "replicate";

export const handler: Schema["generateImage"]["functionHandler"] = async (event) => {
    console.log("=== Starting image generation ===");

    const { prompt, prompt_upsampling } = event.arguments;
    if (!prompt) {
        throw new Error("Missing prompt for image generation");
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const model = "black-forest-labs/flux-1.1-pro-ultra";

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

        // Handle output based on its type
        if (typeof completed.output === 'string') {
            return completed.output;
        } else if (Array.isArray(completed.output) && completed.output.length > 0) {
            return completed.output[0];
        } else {
            throw new Error(`Unexpected output format: ${JSON.stringify(completed.output)}`);
        }
    } catch (error) {
        console.error("Replicate API call failed:", error);
        throw error;
    }
};