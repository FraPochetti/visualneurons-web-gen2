// amplify/functions/aiDispatcher/handler.ts
import { Logger } from "@aws-lambda-powertools/logger";
import { AIOperation } from '../providers/IAIProvider';
import { checkRateLimit, isRateLimitError } from './rateLimit';

// Initialize the logger
const logger = new Logger({
    serviceName: 'aiDispatcher',
    logLevel: 'INFO',
});

export const handler = async (event: any) => {
    console.log("AppSync invoke:", Object.keys(event.arguments), "operation=", event.arguments.operation);
    // Extract user information
    const userIdentity = event.identity || {};
    const userId = userIdentity.claims?.['sub'] || 'anonymous';
    const requestId = event.request?.headers?.['x-amzn-requestid'] || `req-${Date.now()}`;
    const startTime = Date.now();

    // Basic request logging
    logger.info('Function invoked', {
        requestId,
        operation: event.arguments.operation,
        provider: event.arguments.provider || 'replicate',
        eventType: event.info?.fieldName,
        userSub: userId,
    });

    const operation = event.arguments.operation;
    const providerName = event.arguments.provider || "replicate";

    try {
        // Check rate limit first
        logger.debug('Checking rate limit', { userId, operation });
        await checkRateLimit(userId, operation);

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

        // Handle rate limit errors specially
        if (isRateLimitError(error)) {
            logger.warn('Rate limit exceeded for user', {
                requestId,
                userId,
                operation,
                provider: providerName,
                executionTimeMs: executionTime,
                retryAfter: error.retryAfter
            });

            // Return a structured error response for rate limiting
            throw new Error(`RATE_LIMIT_EXCEEDED: ${error.message}`);
        }

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