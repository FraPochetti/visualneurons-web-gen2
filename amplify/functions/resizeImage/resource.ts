import { defineFunction } from '@aws-amplify/backend';

export const resizeImage = defineFunction({
    name: 'resizeImage',
    entry: './handler.ts',
    timeoutSeconds: 30,
    layers: {
        nodeSharp: "arn:aws:lambda:eu-central-1:257446244580:layer:nodeSharp:1",
    },
    bundling: {
        // Tells Amplify’s bundler to skip packaging "sharp"
        externals: ["sharp"]
    }
});
