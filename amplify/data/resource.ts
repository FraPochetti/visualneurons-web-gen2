import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { aiDispatcher } from '../functions/aiDispatcher/resource';

const schema = a.schema({
  // Custom types for rate limiting
  RateLimitError: a.customType({
    message: a.string().required(),
    retryAfter: a.integer().required(),
    type: a.string().required(),
  }),

  generateImage: a.mutation()
    .arguments({
      prompt: a.string().required(),
      prompt_upsampling: a.boolean(),
      provider: a.string(),
      operation: a.string().required()
    })
    .returns(a.string())
    .handler(a.handler.function(aiDispatcher)),

  upscaleImage: a.mutation()
    .arguments({
      imageUrl: a.string().required(),
      provider: a.string(),
      operation: a.string().required()
    })
    .returns(a.string())
    .handler(a.handler.function(aiDispatcher)),

  styleTransfer: a.mutation()
    .arguments({
      prompt: a.string().required(),
      styleImageUrl: a.string().required(),
      provider: a.string(),
      operation: a.string().required()
    })
    .returns(a.string())
    .handler(a.handler.function(aiDispatcher)),

  inpaintImage: a.mutation()
    .arguments({
      prompt: a.string().required(),
      imageUrl: a.string(), // Add this parameter
      imageBase64: a.string(), // Make this optional
      provider: a.string(),
      operation: a.string().required()
    })
    .returns(a.string())
    .handler(a.handler.function(aiDispatcher)),

  outpaintImage: a.mutation()
    .arguments({
      imageUrl: a.string().required(),
      provider: a.string(),
      operation: a.string().required()
    })
    .returns(a.string())
    .handler(a.handler.function(aiDispatcher)),

  ImageRecord: a.model({
    identityId: a.string().required(),
    userSub: a.string(),
    userEmail: a.string(),
    originalImagePath: a.string().required(),
    editedImagePath: a.string(),
    model: a.string(),
    action: a.string(),
    provider: a.enum(["replicate", "stability", "gemini", "user"]),
    source: a.enum(["uploaded", "generated", "edited"]),
  }),

  LogEntry: a.model({
    identityId: a.string().required(),
    userSub: a.string(),
    userEmail: a.string(),
    level: a.enum(["INFO", "WARNING", "ERROR", "DEBUG"]),
    provider: a.enum(["replicate", "stability", "gemini", "user"]),
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
