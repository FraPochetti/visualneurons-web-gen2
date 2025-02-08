import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: 'userPhotos',
    access: (allow) => ({
        'photos/{entity_id}/*': [
            allow.entity('identity').to(['read', 'write', 'delete'])
        ]
    })
});
