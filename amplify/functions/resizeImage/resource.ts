import { defineFunction } from '@aws-amplify/backend';

export const resizeImage = defineFunction({
    name: 'resizeImage',
    entry: './handler.ts',
    timeoutSeconds: 30,
});
