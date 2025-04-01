// components/UserPhotos.tsx
import { useState, useEffect } from 'react';
import { list, getUrl } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';

interface UserPhotosProps {
    onSelect: (url: string) => void;
}

export default function UserPhotos({ onSelect }: UserPhotosProps) {
    const [photos, setPhotos] = useState<{ url: string; path: string }[]>([]);

    useEffect(() => {
        const loadPhotos = async () => {
            try {
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
            } catch (error) {
                console.error("Error loading photos:", error);
            }
        };
        loadPhotos();
    }, []);

    return (
        <div className="grid-container">
            {photos.map((photo, idx) => (
                <div
                    key={idx}
                    className="photo-item"
                    onClick={() => onSelect(photo.url)}
                >
                    <img src={photo.url} alt="User photo" className="grid-image" />
                </div>
            ))}
            {photos.length === 0 && <p>No photos found. Upload one to get started.</p>}
        </div>
    );
}