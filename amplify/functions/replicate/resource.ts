// amplify/functions/replicate/resource.ts
import { defineFunction, secret } from '@aws-amplify/backend';

export const replicate = defineFunction({
    name: "replicate",
    environment: {
        REPLICATE_API_TOKEN: secret("REPLICATE_API_TOKEN")
    },
    timeoutSeconds: 30,
});
