// amplify/functions/aiDispatcher/resource.ts
import { defineFunction, secret } from '@aws-amplify/backend';

export const aiDispatcher = defineFunction({
    name: "aiDispatcher",
    environment: {
        REPLICATE_API_TOKEN: secret("REPLICATE_API_TOKEN"),
        STABILITY_API_TOKEN: secret("STABILITY_API_TOKEN"),
        GCP_API_TOKEN: secret("GCP_API_TOKEN"),
        LAMBDA_RESIZE_URL: secret("LAMBDA_RESIZE_URL"),
        LOG_LEVEL: "DEBUG"
    },
    timeoutSeconds: 120,
});