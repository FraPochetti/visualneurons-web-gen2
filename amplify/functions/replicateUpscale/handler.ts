import { Schema } from "../../data/resource";
import Replicate from "replicate";

export const handler: Schema["upscaleImage"]["functionHandler"] = async (event) => {
    console.log("REPLICATE_API_TOKEN exists:", !!process.env.REPLICATE_API_TOKEN);
    const { imageUrl } = event.arguments;
    if (!imageUrl) {
        throw new Error("Missing imageUrl for upscaling");
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    // Use the upscaling model identifier (replace with your chosen model)
    const model = "philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e";

    try {
        console.log("Fetching image data from URL:", imageUrl);
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image, status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        console.log("Creating prediction with image Buffer");
        const prediction = await replicate.predictions.create({
            model,
            input: { image: imageBuffer }
        });


        console.log("Prediction created:", prediction.id);

        let completed = null;
        // Poll for the result
        for (let i = 0; i < 15; i++) {
            const latest = await replicate.predictions.get(prediction.id);
            if (latest.status !== "starting" && latest.status !== "processing") {
                completed = latest;
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        if (!completed) {
            throw new Error("Upscale prediction timed out");
        }
        if (completed.status === "failed") {
            throw new Error(`Upscale prediction failed: ${completed.error}`);
        }

        // Handle the output – assuming it's a URL string
        if (typeof completed.output === 'string') {
            return completed.output;
        } else if (Array.isArray(completed.output) && completed.output.length > 0) {
            return completed.output[0];
        } else {
            throw new Error(`Unexpected output format: ${JSON.stringify(completed.output)}`);
        }
    } catch (error) {
        console.error("Replicate upscale API call failed:", error);
        throw error;
    }
};
