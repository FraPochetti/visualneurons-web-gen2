import { defineFunction, secret } from '@aws-amplify/backend';

export const replicateUpscale = defineFunction({
    name: "replicateUpscale",
    environment: {
        REPLICATE_API_TOKEN: secret("REPLICATE_API_TOKEN")
    },
    timeoutSeconds: 30,
});
