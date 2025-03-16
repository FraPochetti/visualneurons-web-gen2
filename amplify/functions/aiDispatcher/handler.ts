// amplify/functions/aiDispatcher/handler.ts
import { Logger } from "@aws-lambda-powertools/logger";
import { createProvider } from '../providers/providerFactory';

// Initialize the logger
const logger = new Logger({
    serviceName: 'aiDispatcher',
    logLevel: 'INFO', // Can be DEBUG, INFO, WARN, ERROR
});

export const handler = async (event: any) => {
    // Log the incoming event (sanitize sensitive data if needed)
    logger.info('Function invoked', {
        operation: event.arguments.operation,
        provider: event.arguments.provider || 'replicate',
        eventType: event.info?.fieldName
    });

    const operation = event.arguments.operation;
    const providerName = event.arguments.provider || "replicate";

    try {
        logger.debug('Creating provider instance', { provider: providerName });
        const { createProvider } = await import('../providers/providerFactory');
        const providerInstance = createProvider(providerName);

        logger.info(`Executing operation: ${operation}`);

        let result;
        switch (operation) {
            case "generateImage":
                logger.debug('Generate image operation', {
                    prompt: event.arguments.prompt?.substring(0, 50) + '...',
                    promptUpsampling: event.arguments.prompt_upsampling || false
                });

                result = await providerInstance.generateImage(
                    event.arguments.prompt,
                    event.arguments.prompt_upsampling || false
                );
                break;

            case "upscaleImage":
                logger.debug('Upscale image operation', {
                    imageUrl: event.arguments.imageUrl?.substring(0, 50) + '...'
                });

                result = await providerInstance.upscaleImage(
                    event.arguments.imageUrl
                );
                break;

            default:
                logger.error(`Unsupported operation: ${operation}`);
                throw new Error(`Unsupported operation: ${operation}`);
        }

        logger.info('Operation completed successfully');
        return result;
    } catch (error: any) {
        // Log the error in a structured way
        logger.error('Error in aiDispatcher', {
            error: error.message,
            errorStack: error.stack,
            operation,
            provider: providerName
        });

        // Re-throw the error to maintain function behavior
        throw error;
    }
};