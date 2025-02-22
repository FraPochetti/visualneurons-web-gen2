// amplify/functions/replicate/handler.ts
import { Handler } from "aws-lambda";
import Replicate from "replicate";

export const handler: Handler = async (event) => {
    // Expect the request body to be JSON with an "input" field.
    const { input } = JSON.parse(event.body || '{}');

    if (!input) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing input for image generation" }),
        };
    }

    // For this example, we use the fixed model "black-forest-labs/flux-1.1-pro".
    const model = "black-forest-labs/flux-1.1-pro";
    // Initialize Replicate with the API token stored in your environment.
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    try {
        const output = await replicate.run(model, { input });
        return {
            statusCode: 200,
            body: JSON.stringify(output),
        };
    } catch (error) {
        console.error("Replicate API call failed:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Replicate API call failed", details: error }),
        };
    }
};
