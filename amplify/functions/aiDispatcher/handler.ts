import { Logger } from "@aws-lambda-powertools/logger";
import { AIOperation } from '../providers/IAIProvider';
import axios from 'axios';

const logger = new Logger({
    serviceName: 'aiDispatcher',
    logLevel: 'INFO',
});

export const handler = async (event: any) => {
    const userIdentity = event.identity || {};
    const requestId = event.request?.headers?.['x-amzn-requestid'] || `req-${Date.now()}`;
    const startTime = Date.now();

    logger.info('Function invoked', {
        requestId,
        operation: event.arguments.operation,
        provider: event.arguments.provider || 'replicate',
        eventType: event.info?.fieldName,
        userSub: userIdentity.claims?.['sub'] || 'anonymous',
    });

    const operation = event.arguments.operation;
    const providerName = event.arguments.provider || "replicate";
    let imageUrl = event.arguments.imageUrl;

    try {
        logger.debug('Creating provider instance', { provider: providerName });
        const { createProvider } = await import('../providers/providerFactory');
        const providerInstance = createProvider(providerName);

        const providerInfo = providerInstance.getProviderInfo();
        logger.info('Using provider', {
            requestId,
            provider: providerInfo.serviceProvider,
            apiEndpoint: providerInfo.apiEndpoint
        });

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

            case "chatWithImage":
                logger.info('Chat with image request', {
                    requestId,
                    provider: providerName,
                    modelName: modelInfo.modelName,
                    prompt: event.arguments.prompt,
                    imageUrl: event.arguments.imageUrl,
                });

                if (!providerInstance.chatWithImage) {
                    logger.error('chatWithImage not supported by provider', { provider: providerName, requestId });
                    throw new Error(`Provider ${providerName} does not support chatWithImage`);
                }
                result = await providerInstance.chatWithImage(
                    event.arguments.prompt,
                    imageUrl,
                    event.arguments.history || []
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