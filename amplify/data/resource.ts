import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { replicate } from '../functions/replicate/resource'; // import your replicate function

const schema = a.schema({
  // New custom mutation to invoke the replicate Lambda
  generateImage: a.mutation()
    .arguments({
      input: a.json(), // input parameters for image generation; adjust type as needed
    })
    .returns(a.json()) // returns the JSON output from Replicate
    .authorization(allow => [allow.publicApiKey()]) // adjust auth as needed
    .handler(a.handler.function(replicate)),

  // Existing models (e.g. ImageRecord) remain here
  ImageRecord: a.model({
    owner: a.string().required(),
    originalImagePath: a.string().required(),
    editedImagePaths: a.string().array(),
    transformationHistory: a.json(),
    source: a.enum(["uploaded", "generated"]),
  })
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
