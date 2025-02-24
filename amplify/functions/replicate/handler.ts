// amplify/functions/replicate/handler.ts
import { Schema } from "../../data/resource";
import Replicate from "replicate";

export const handler: Schema["generateImage"]["functionHandler"] = async (event) => {
    const { prompt, prompt_upsampling } = event.arguments;

    if (!prompt) {
        throw new Error("Missing prompt for image generation");
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const model = "black-forest-labs/flux-1.1-pro";

    try {
        const output = await replicate.run(model, {
            input: {
                prompt,
                prompt_upsampling: prompt_upsampling ?? true
            }
        });
        console.log("Replicate raw output:", output);
        return output;
    } catch (error) {
        console.error("Replicate API call failed:", error);
        throw error;
    }
};