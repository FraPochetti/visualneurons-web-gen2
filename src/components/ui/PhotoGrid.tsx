import React, { memo } from "react";
import Link from "next/link";
import type { Photo } from "@/src/types";
import { ROUTES } from "@/src/constants";

interface PhotoGridProps {
    photos: Photo[];
    onDelete: (path: string) => void;
    className?: string;
}

export const PhotoGrid = memo<PhotoGridProps>(({ photos, onDelete, className = "grid-container" }) => {
    if (photos.length === 0) {
        return (
            <div className="empty-state">
                <p>No photos found. Upload some photos to get started!</p>
            </div>
        );
    }

    return (
        <div className={className}>
            {photos.map((photo) => (
                <PhotoGridItem
                    key={photo.path}
                    photo={photo}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
});

PhotoGrid.displayName = "PhotoGrid";

interface PhotoGridItemProps {
    photo: Photo;
    onDelete: (path: string) => void;
}

const PhotoGridItem = memo<PhotoGridItemProps>(({ photo, onDelete }) => {
    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this photo?")) {
            onDelete(photo.path);
        }
    };

    return (
        <div className="photo-item">
            <Link
                href={{
                    pathname: ROUTES.EDIT_IMAGE,
                    query: { url: photo.url, originalPath: photo.path },
                }}
            >
                <img
                    src={photo.url}
                    alt="User uploaded photo"
                    className="grid-image"
                    loading="lazy"
                />
            </Link>
            {photo.isAiGenerated && (
                <div className="ai-watermark">AI</div>
            )}
            <button
                className="delete-button"
                onClick={handleDelete}
                aria-label="Delete photo"
            >
                Delete
            </button>
        </div>
    );
});

PhotoGridItem.displayName = "PhotoGridItem"; 