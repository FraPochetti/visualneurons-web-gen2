// amplify/functions/aiDispatcher/handler.ts
import type { Schema } from "../../data/resource";
import { ReplicateProvider } from "../providers/replicateProvider";
import { StabilityProvider } from "../providers/stabilityProvider";
import { ClipDropProvider } from "../providers/clipdropProvider";

// Map provider names to their implementations.
const providersMap: Record<string, any> = {
    replicate: new ReplicateProvider(),
    stability: new StabilityProvider(),
    clipdrop: new ClipDropProvider(),
};

async function generateImage(args: any) {
    const { prompt, prompt_upsampling, provider } = args;
    const providerKey = provider || "replicate";
    const providerInstance = providersMap[providerKey];
    if (!providerInstance) {
        throw new Error(`Provider ${providerKey} is not supported.`);
    }
    return await providerInstance.generateImage(prompt, prompt_upsampling);
}

async function upscaleImage(args: any) {
    const { imageUrl, provider } = args;
    const providerKey = provider || "replicate";
    const providerInstance = providersMap[providerKey];
    if (!providerInstance) {
        throw new Error(`Provider ${providerKey} is not supported.`);
    }
    return await providerInstance.upscaleImage(imageUrl);
}

export const handler: Schema["generateImage"]["functionHandler"] = async (event) => {
    // Expect the client to supply an "operation" field to indicate which operation to perform.
    const operation = event.arguments.operation;
    if (operation === "generateImage") {
        return await generateImage(event.arguments);
    } else if (operation === "upscaleImage") {
        return await upscaleImage(event.arguments);
    } else {
        throw new Error(`Unsupported operation: ${operation}`);
    }
};
