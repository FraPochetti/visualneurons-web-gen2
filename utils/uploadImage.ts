// utils/uploadImage.ts
import { uploadData, getUrl } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';

export async function uploadImage(file: File): Promise<string> {
    const session = await fetchAuthSession();
    const identityId = session.identityId!;
    const path = `photos/${identityId}/${file.name}`;
    await uploadData({ path, data: file });
    const { url } = await getUrl({ path });
    return url.toString();
}