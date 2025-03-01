import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { replicate } from '../functions/replicate/resource'; // import your replicate function
import { replicateUpscale } from '../functions/replicateUpscale/resource';

const schema = a.schema({
  // New custom mutation to invoke the replicate Lambda
  generateImage: a.mutation()
    .arguments({
      prompt: a.string().required(),
      prompt_upsampling: a.boolean(),
    })
    .returns(a.string()) // expecting a string URI
    .handler(a.handler.function(replicate)),

  upscaleImage: a.mutation()
    .arguments({
      imageUrl: a.string().required(),
    })
    .returns(a.string()) // expecting the upscaled image URL
    .handler(a.handler.function(replicateUpscale)),

  // Existing models (e.g. ImageRecord) remain here
  ImageRecord: a.model({
    owner: a.string().required(),
    originalImagePath: a.string().required(),
    editedImagePaths: a.string().array(),
    transformationHistory: a.json(),
    source: a.enum(["uploaded", "generated"]),
  })
}).authorization(allow => [allow.authenticated()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
