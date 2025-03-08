import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { replicate } from '../functions/replicate/resource';
import { replicateUpscale } from '../functions/replicateUpscale/resource';

const schema = a.schema({
  // Existing custom mutations for image generation and upscaling
  generateImage: a.mutation()
    .arguments({
      prompt: a.string().required(),
      prompt_upsampling: a.boolean(),
    })
    .returns(a.string())
    .handler(a.handler.function(replicate)),

  upscaleImage: a.mutation()
    .arguments({
      imageUrl: a.string().required(),
    })
    .returns(a.string())
    .handler(a.handler.function(replicateUpscale)),

  // Your ImageRecord model
  ImageRecord: a.model({
    owner: a.string().required(),
    originalImagePath: a.string().required(),
    editedImagePaths: a.string().array(),
    transformationHistory: a.json(),
    source: a.enum(["uploaded", "generated"]),
  }),

  // NEW: Add a LogEntry model for detailed, queryable logs
  LogEntry: a.model({
    timestamp: a.datetime().required(),
    level: a.enum(["INFO", "WARNING", "ERROR", "DEBUG"]),
    message: a.string().required(),
    // Optional additional details (like stack traces or context)
    details: a.json(),
  }),
}).authorization(allow => [allow.authenticated()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
