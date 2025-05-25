import { list, getUrl } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useState, useEffect } from 'react';
import styles from "./StyleImageSelector.module.css";

interface StyleImageSelectorProps {
    onSelect: (imageUrl: string) => void;
}

interface PhotoItem {
    path: string;
    url: string;
    lastModified: Date;
}

export default function StyleImageSelector({ onSelect }: StyleImageSelectorProps) {
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const session = await fetchAuthSession();
                const identityId = session.identityId!;
                const { items } = await list({ path: `photos/${identityId}/` });

                const fetchedPhotos = await Promise.all(
                    items.map(async (item) => {
                        const { url } = await getUrl({ path: item.path });
                        return {
                            path: item.path,
                            url: url.toString(),
                            lastModified: item.lastModified ? new Date(item.lastModified) : new Date()
                        };
                    })
                );

                fetchedPhotos.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
                setPhotos(fetchedPhotos);
                setError(null);
            } catch (err: any) {
                setError("Error loading photos: " + err.message);
            }
        };

        fetchPhotos();
    }, []);

    const handleSelect = (url: string) => {
        setSelected(url);
        onSelect(url);
    };

    return (
        <div className={styles.container}>
            {error && (
                <div style={{ padding: "1rem", backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: "4px", marginBottom: "1rem" }}>
                    <strong>Error:</strong> {error}
                </div>
            )}
            {photos.map((photo) => (
                <div
                    key={photo.path}
                    onClick={() => handleSelect(photo.url)}
                    className={`${styles.photoItem} ${selected === photo.url ? styles.selected : ""}`}
                >
                    <img
                        src={photo.url}
                        alt="Style"
                        className={styles.photoImage}
                    />
                </div>
            ))}
        </div>
    );
}
