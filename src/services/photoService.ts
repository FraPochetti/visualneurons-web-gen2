import { list, getUrl, getProperties, remove } from "aws-amplify/storage";
import { fetchAuthSession } from "aws-amplify/auth";
import type { Photo } from "@/src/types";
import { logger } from "@/src/lib/logger";

export class PhotoService {
    private async getUserPath(): Promise<string> {
        try {
            const session = await fetchAuthSession();
            const identityId = session.identityId;
            if (!identityId) {
                throw new Error("No identity ID found");
            }
            return `photos/${identityId}/`;
        } catch (error) {
            logger.error("Failed to get user path", { error });
            throw error;
        }
    }

    async fetchUserPhotos(): Promise<Photo[]> {
        try {
            const userPath = await this.getUserPath();
            const { items } = await list({ path: userPath });

            const photos = await Promise.all(
                items.map(async (item) => {
                    try {
                        const { url } = await getUrl({ path: item.path });
                        const properties = await getProperties({ path: item.path });

                        return {
                            path: item.path,
                            url: url.toString(),
                            lastModified: item.lastModified ? new Date(item.lastModified) : new Date(),
                            isAiGenerated: properties.metadata?.isaigenerated === "true",
                        };
                    } catch (error) {
                        logger.error("Failed to process photo item", {
                            path: item.path,
                            error
                        });
                        throw error;
                    }
                })
            );

            // Sort by most recent first
            photos.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

            logger.info("Successfully fetched user photos", { count: photos.length });
            return photos;
        } catch (error) {
            logger.error("Failed to fetch user photos", { error });
            throw error;
        }
    }

    async deletePhoto(path: string): Promise<void> {
        try {
            await remove({ path });
            logger.info("Successfully deleted photo", { path });
        } catch (error) {
            logger.error("Failed to delete photo", { path, error });
            throw error;
        }
    }
}

export const photoService = new PhotoService(); 