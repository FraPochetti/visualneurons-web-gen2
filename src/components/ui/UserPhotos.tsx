import React, { useState, useEffect, memo } from 'react';
import { list, getUrl } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import { logger } from '@/src/lib/logger';

interface UserPhoto {
    url: string;
    path: string;
}

interface UserPhotosProps {
    onSelect: (url: string) => void;
    className?: string;
}

export const UserPhotos = memo<UserPhotosProps>(({ onSelect, className = "grid-container" }) => {
    const [photos, setPhotos] = useState<UserPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPhotos = async () => {
            try {
                setLoading(true);
                setError(null);

                const session = await fetchAuthSession();
                const identityId = session.identityId!;
                const { items } = await list({ path: `photos/${identityId}/` });

                const photoData = await Promise.all(
                    items.map(async (item) => {
                        const { url } = await getUrl({ path: item.path });
                        return { path: item.path, url: url.toString() };
                    })
                );

                setPhotos(photoData);
                logger.info('UserPhotos loaded successfully', { count: photoData.length });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load photos";
                setError(errorMessage);
                logger.error('Error loading user photos', { error: err });
            } finally {
                setLoading(false);
            }
        };

        loadPhotos();
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <p>Loading photos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: "1rem",
                backgroundColor: "#fee",
                border: "1px solid #fcc",
                borderRadius: "4px",
                marginBottom: "1rem"
            }}>
                <strong>Error:</strong> {error}
            </div>
        );
    }

    if (photos.length === 0) {
        return (
            <div className="empty-state">
                <p>No photos found. Upload one to get started.</p>
            </div>
        );
    }

    return (
        <div className={className}>
            {photos.map((photo, idx) => (
                <UserPhotoItem
                    key={`${photo.path}-${idx}`}
                    photo={photo}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
});

UserPhotos.displayName = "UserPhotos";

interface UserPhotoItemProps {
    photo: UserPhoto;
    onSelect: (url: string) => void;
}

const UserPhotoItem = memo<UserPhotoItemProps>(({ photo, onSelect }) => {
    const handleClick = () => {
        onSelect(photo.url);
    };

    return (
        <div
            className="photo-item"
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
        >
            <img
                src={photo.url}
                alt="User photo"
                className="grid-image"
                loading="lazy"
            />
        </div>
    );
});

UserPhotoItem.displayName = "UserPhotoItem"; 