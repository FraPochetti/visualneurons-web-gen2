export const handler = async (event: any) => {
    const operation = event.arguments.operation;
    const providerName = event.arguments.provider || "replicate";

    const { createProvider } = await import('../providers/providerFactory');
    const providerInstance = createProvider(providerName);

    switch (operation) {
        case "generateImage":
            return await providerInstance.generateImage(
                event.arguments.prompt,
                event.arguments.prompt_upsampling || false
            );
        case "upscaleImage":
            return await providerInstance.upscaleImage(
                event.arguments.imageUrl
            );
        default:
            throw new Error(`Unsupported operation: ${operation}`);
    }
};