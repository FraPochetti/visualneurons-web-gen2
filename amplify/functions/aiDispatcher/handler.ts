// amplify/functions/aiDispatcher/handler.ts
import { Logger } from "@aws-lambda-powertools/logger";
import { AIOperation } from '../providers/IAIProvider';
import https from "https";

// Initialize the logger
const logger = new Logger({
    serviceName: 'aiDispatcher',
    logLevel: 'INFO',
});

export const handler = async (event: any) => {
    console.log("AppSync invoke:", Object.keys(event.arguments), "operation=", event.arguments.operation);
    // Extract user information
    const userIdentity = event.identity || {};
    const requestId = event.request?.headers?.['x-amzn-requestid'] || `req-${Date.now()}`;
    const startTime = Date.now();

    // ─── fire‑and‑forget generateVideo ───
    if (event.arguments.operation === "generateVideo") {
        const { promptImage, promptText, duration, ratio, provider = "runway" } = event.arguments;
        if (provider !== "runway") {
            throw new Error(`generateVideo only supported for runway, got ${provider}`);
        }

        console.log("🎬 generateVideo → kicking off Runway task…");

        const taskId: string = await new Promise((resolve, reject) => {
            const body = JSON.stringify({ model: "gen4_turbo", promptImage, promptText, duration, ratio });
            const req = https.request({
                hostname: "api.runwayml.com",
                path: "/v1/image_to_video",
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.RUNWAY_API_TOKEN}`,
                    "X-Runway-Version": "2024-11-06",
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(body),
                },
            }, (res) => {
                let data = "";
                res.on("data", (c) => (data += c));
                res.on("end", () => {
                    console.log("✨ generateVideo response:", { statusCode: res.statusCode, body: data });

                    // 1) Check HTTP code
                    if (res.statusCode !== 200) {
                        return reject(new Error(`Runway error ${res.statusCode}: ${data}`));
                    }

                    // 2) Parse & validate
                    let json: any;
                    try {
                        json = JSON.parse(data);
                    } catch (err) {
                        return reject(err);
                    }

                    if (!json.id) {
                        return reject(new Error(`No task ID in Runway response: ${data}`));
                    }

                    resolve(json.id);
                });
            });

            req.on("error", reject);
            req.write(body);
            req.end();
        });

        console.log("✅ generateVideo returned taskId:", taskId);
        return taskId;
    }

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