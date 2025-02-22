import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Define a new model for storing image records
  ImageRecord: a.model({
    // Automatically added identifier can be used, or you can customize it.
    // Owner field to enforce per-user access.
    owner: a.string().required(),
    // S3 key for the original image. This is required.
    originalImagePath: a.string().required(),
    // An array to store S3 keys of the edited versions.
    editedImagePaths: a.string().array(),
    // Optional field to capture transformation details (as JSON).
    transformationHistory: a.json(),
    // Optionally, a field to distinguish between user-uploaded and AI-generated images.
    source: a.enum(['uploaded', 'generated']),
  })
    // Use owner-based authorization so only the record owner can modify it.
    .authorization(allow => [allow.owner()]),
}).authorization(allow => [allow.publicApiKey()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
});
