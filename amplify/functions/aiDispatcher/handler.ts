// amplify/functions/aiDispatcher/handler.ts
import { Logger } from "@aws-lambda-powertools/logger";
import { AIOperation } from '../providers/IAIProvider';

// Initialize the logger
const logger = new Logger({
    serviceName: 'aiDispatcher',
    logLevel: 'INFO',
});

export const handler = async (event: any) => {
    // Extract user information
    const userIdentity = event.identity || {};
    const requestId = event.request?.headers?.['x-amzn-requestid'] || `req-${Date.now()}`;
    const startTime = Date.now();

    // Basic request logging
    logger.info('Function invoked', {
        requestId,
        operation: event.arguments.operation,
        provider: event.arguments.provider || 'replicate',
        eventType: event.info?.fieldName,
        userSub: userIdentity.claims?.['sub'] || 'anonymous',
    });

    const operation = event.arguments.operation;
    const providerName = event.arguments.provider || "replicate";

    try {
        logger.debug('Creating provider instance', { provider: providerName });
        const { createProvider } = await import('../providers/providerFactory');
        const providerInstance = createProvider(providerName);

        // Get provider metadata for logging
        const providerInfo = providerInstance.getProviderInfo();
        logger.info('Using provider', {
            requestId,
            provider: providerInfo.serviceProvider,
            apiEndpoint: providerInfo.apiEndpoint
        });

        // Get model-specific metadata based on operation
        const modelInfo = providerInstance.getModelInfo(operation as AIOperation);

        let result;
        switch (operation) {
            case "generateImage":
                logger.info('Generate image request', {
                    requestId,
                    provider: providerName,
                    modelName: modelInfo.modelName,
                    modelVersion: modelInfo.modelVersion,
                    promptLength: event.arguments.prompt?.length || 0,
                    prompt: event.arguments.prompt,
                });

                result = await providerInstance.generateImage(
                    event.arguments.prompt,
                    event.arguments.prompt_upsampling || false
                );
                break;

            case "upscaleImage":
                logger.info('Upscale image request', {
                    requestId,
                    provider: providerName,
                    modelName: modelInfo.modelName,
                    modelVersion: modelInfo.modelVersion
                });

                result = await providerInstance.upscaleImage(
                    event.arguments.imageUrl
                );
                break;

            case "styleTransfer":
                logger.info('Style transfer request', {
                    requestId,
                    provider: providerName,
                    prompt: event.arguments.prompt,
                    styleImageUrl: event.arguments.styleImageUrl,
                });

                result = await providerInstance.styleTransfer(
                    event.arguments.prompt,
                    event.arguments.styleImageUrl
                );
                break;

            case "outpaint":
                logger.info('Outpaint image request', {
                    requestId,
                    provider: providerName,
                    modelName: modelInfo.modelName,
                    modelVersion: modelInfo.modelVersion
                });

                result = await providerInstance.outPaint(
                    event.arguments.imageUrl
                );
                break;

            case "inpaint":
                logger.info('Inpaint (edit) image request', {
                    requestId,
                    provider: providerName,
                    prompt: event.arguments.prompt,
                });
                result = await providerInstance.inpaint(
                    event.arguments.prompt,
                    event.arguments.imageBase64 || event.arguments.imageUrl
                );
                break;

            case "generateVideo":
                logger.info('Generate video request', {
                    requestId,
                    provider: providerName,
                    promptTextLength: event.arguments.promptText?.length || 0,
                    promptText: event.arguments.promptText,
                });
                // Call the new generateVideo method.
                result = await providerInstance.generateVideo(
                    event.arguments.promptImage,
                    event.arguments.promptText,
                    event.arguments.duration,  // may be undefined, which is fine if the provider sets a default
                    event.arguments.ratio      // may be undefined if not provided
                );
                break;

            default:
                logger.error(`Unsupported operation: ${operation}`, { requestId });
                throw new Error(`Unsupported operation: ${operation}`);
        }

        const executionTime = Date.now() - startTime;
        logger.info('Operation completed successfully', {
            requestId,
            provider: providerName,
            operation,
            modelName: modelInfo.modelName,
            executionTimeMs: executionTime
        });

        return result;
    } catch (error: any) {
        const executionTime = Date.now() - startTime;
        logger.error('Error in aiDispatcher', {
            requestId,
            errorMessage: error.message,
            errorStack: error.stack,
            operation,
            provider: providerName,
            executionTimeMs: executionTime,
        });
        throw error;
    }
};