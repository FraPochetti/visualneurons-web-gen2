import { defineFunction, secret } from '@aws-amplify/backend';

export const aiDispatcher = defineFunction({
    name: "aiDispatcher",
    environment: {
        REPLICATE_API_TOKEN: secret("REPLICATE_API_TOKEN")
    },
    timeoutSeconds: 59,
});