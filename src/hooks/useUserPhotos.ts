import { useState, useEffect, useCallback } from "react";
import { photoService } from "@/src/services/photoService";
import type { Photo } from "@/src/types";
import { APP_CONFIG } from "@/src/constants";
import { logger } from "@/src/lib/logger";

interface UseUserPhotosReturn {
    photos: Photo[];
    visiblePhotos: Photo[];
    loading: boolean;
    error: string | null;
    visibleCount: number;
    hasMore: boolean;
    loadMore: () => void;
    deletePhoto: (path: string) => Promise<void>;
    refreshPhotos: () => Promise<void>;
}

export function useUserPhotos(): UseUserPhotosReturn {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState<number>(APP_CONFIG.PHOTOS_PER_PAGE);

    const fetchPhotos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedPhotos = await photoService.fetchUserPhotos();
            setPhotos(fetchedPhotos);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch photos";
            setError(errorMessage);
            logger.error("Error in useUserPhotos", { error: err });
        } finally {
            setLoading(false);
        }
    }, []);

    const deletePhoto = useCallback(async (path: string) => {
        try {
            await photoService.deletePhoto(path);
            setPhotos(prev => prev.filter(photo => photo.path !== path));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to delete photo";
            setError(errorMessage);
            throw err;
        }
    }, []);

    const loadMore = useCallback(() => {
        setVisibleCount(prev => prev + APP_CONFIG.PHOTOS_PER_PAGE);
    }, []);

    const refreshPhotos = useCallback(async () => {
        await fetchPhotos();
    }, [fetchPhotos]);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    const visiblePhotos = photos.slice(0, visibleCount);
    const hasMore = visibleCount < photos.length;

    return {
        photos,
        visiblePhotos,
        loading,
        error,
        visibleCount,
        hasMore,
        loadMore,
        deletePhoto,
        refreshPhotos,
    };
} 