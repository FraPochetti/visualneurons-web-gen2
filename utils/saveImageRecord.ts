import { uploadData, getProperties } from "aws-amplify/storage";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export interface SaveImageRecordParams {
    imageUrl: string;
    fileName: string;
    /** "generated" for newly generated images or "edited" for upscaled/edited ones */
    source: "generated" | "edited";
    /** Optional: if editing, pass the original image path so it remains unchanged */
    originalImagePathOverride?: string;
    /** For actions like "upscale", pass the action string (or leave undefined for generated images) */
    action?: string;
    /** Whether to check for an existing file before overwriting (typically true for edits) */
    checkOverwrite?: boolean;
    /** Model name from the provider metadata */
    modelName: string;
    /** Provider literal (e.g. "replicate") */
    providerService: "replicate" | "stability" | "clipdrop" | "user";
}

/**
 * Saves an image (either generated or edited) and creates a record in the database.
 */
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
    // Retrieve user session and attributes
    const session = await fetchAuthSession();
    const identityId = session.identityId!;
    const attributes = await fetchUserAttributes();

    // Build the S3 path:
    // - For generated images, we construct a new path.
    // - For edits, we use the original path as the "originalImagePath" and use the new file path as the edited version.
    const path =
        originalImagePathOverride === undefined
            ? `photos/${identityId}/${fileName}`
            : `photos/${identityId}/${fileName}`;

    // Optionally check if file exists (useful for edits)
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

    // Fetch the image and create a blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Upload the file
    await uploadData({
        path,
        data: blob,
        options: {
            metadata: { isAiGenerated: "true" },
        },
    });
    alert("File saved successfully.");

    // Create the record.
    // For generated images, there is no "editedImagePath".
    // For edited/upscaled images, we set:
    //    originalImagePath from the passed override and editedImagePath as the new upload path.
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
