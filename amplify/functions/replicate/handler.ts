// amplify/functions/replicate/handler.ts
import { Schema } from "../../data/resource";
import Replicate from "replicate";

export const handler: Schema["generateImage"]["functionHandler"] = async (event) => {
    // Just log whether the token exists (but not its value)
    console.log("REPLICATE_API_TOKEN exists:", !!process.env.REPLICATE_API_TOKEN);
    console.log("REPLICATE_API_TOKEN length:", process.env.REPLICATE_API_TOKEN?.length);

    const { prompt, prompt_upsampling } = event.arguments;

    if (!prompt) {
        throw new Error("Missing prompt for image generation");
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const model = "black-forest-labs/flux-1.1-pro";

    try {
        // Try to fetch user info from Replicate - this will fail if token is invalid
        const page = await replicate.predictions.list();
        console.log("Successfully authenticated with Replicate");
        console.log(page.results)
    } catch (error) {
        console.error("Failed to authenticate with Replicate:", error);
        throw new Error("Authentication failed - check your API token");
    }

    try {
        console.log("Calling Replicate with:", { prompt, prompt_upsampling });
        const output = await replicate.run(model, {
            input: {
                prompt,
                prompt_upsampling: prompt_upsampling ?? true,
            },
        });

        // Log the raw output to understand its structure
        console.log("Raw output type:", typeof output);
        console.log("Raw output value:", JSON.stringify(output, null, 2));

        // Handle different possible output formats
        if (typeof output === 'string') {
            return output;
        } else if (Array.isArray(output) && output.length > 0) {
            return output[0];
        } else {
            // If we can't determine a proper format, return a detailed error
            throw new Error(`Unexpected output format: ${JSON.stringify(output)}`);
        }
    } catch (error) {
        console.error("Replicate API call failed:", error);
        throw error;
    }
};