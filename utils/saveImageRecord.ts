import { uploadData, getProperties } from "aws-amplify/storage";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export interface SaveImageRecordParams {
    imageUrl: string;
    fileName: string;
    source: "generated" | "edited";
    originalImagePathOverride?: string;
    action?: string;
    checkOverwrite?: boolean;
    modelName: string;
    providerService: "replicate" | "stability" | "user";
}
export async function saveImageRecord({
    imageUrl,
    fileName,
    source,
    originalImagePathOverride,
    action,
    checkOverwrite = false,
    modelName,
    providerService,
}: SaveImageRecordParams) {
    const session = await fetchAuthSession();
    const identityId = session.identityId!;
    const attributes = await fetchUserAttributes();

    const path =
        originalImagePathOverride === undefined
            ? `photos/${identityId}/${fileName}`
            : `photos/${identityId}/${fileName}`;

    if (checkOverwrite) {
        let fileExists = false;
        try {
            await getProperties({ path });
            fileExists = true;
        } catch (error: any) {
            if (error?.$metadata?.httpStatusCode === 404) {
                fileExists = false;
            } else {
                console.warn("Non-404 error checking file existence, proceeding:", error);
                fileExists = false;
            }
        }
        if (fileExists) {
            const confirmOverwrite = window.confirm(
                `A file named "${fileName}" already exists. Overwrite it?`
            );
            if (!confirmOverwrite) return;
        }
    }

    const response = await fetch(imageUrl);
    const blob = await response.blob();

    await uploadData({
        path,
        data: blob,
        options: {
            metadata: { isAiGenerated: "true" },
        },
    });
    alert("File saved successfully.");

    await client.models.ImageRecord.create({
        identityId,
        userSub: attributes.sub,
        userEmail: attributes.email,
        originalImagePath:
            originalImagePathOverride === undefined ? path : originalImagePathOverride,
        editedImagePath: originalImagePathOverride === undefined ? undefined : path,
        model: modelName,
        action,
        source,
        provider: providerService,
    });
}
