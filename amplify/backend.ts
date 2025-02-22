import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { replicate } from './functions/replicate/resource';

defineBackend({
  auth,
  data,
  storage,
  replicate,
});
