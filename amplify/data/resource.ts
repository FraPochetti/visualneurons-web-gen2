import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { replicate } from '../functions/replicate/resource';
import { replicateUpscale } from '../functions/replicateUpscale/resource';

const schema = a.schema({
  generateImage: a.mutation()
    .arguments({
      prompt: a.string().required(),
      prompt_upsampling: a.boolean(),
      provider: a.string(),
      operation: a.string().required()
    })
    .returns(a.string())
    .handler(a.handler.function(require.resolve("../functions/aiDispatcher/handler.ts"))),

  upscaleImage: a.mutation()
    .arguments({
      imageUrl: a.string().required(),
      provider: a.string(),
      operation: a.string().required()
    })
    .returns(a.string())
    .handler(a.handler.function(require.resolve("../functions/aiDispatcher/handler.ts"))),

  ImageRecord: a.model({
    identityId: a.string().required(),
    userSub: a.string(),
    userEmail: a.string(),
    originalImagePath: a.string().required(),
    editedImagePath: a.string(),
    model: a.string(),
    action: a.string(),
    provider: a.enum(["replicate", "stability", "clipdrop", "user"]),
    source: a.enum(["uploaded", "generated", "edited"]),
  }),

  LogEntry: a.model({
    identityId: a.string().required(),
    userSub: a.string(),
    userEmail: a.string(),
    level: a.enum(["INFO", "WARNING", "ERROR", "DEBUG"]),
    provider: a.enum(["replicate", "stability", "clipdrop", "user"]),
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
