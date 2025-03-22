import { list, getUrl } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useState, useEffect } from 'react';

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
            } catch (error) {
                console.error("Error listing photos:", error);
            }
        };

        fetchPhotos();
    }, []);

    const handleSelect = (url: string) => {
        setSelected(url);
        onSelect(url);
    };

    return (
        <div
            style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                marginTop: '1rem',
                paddingBottom: '0.5rem',
            }}
        >
            {photos.map((photo) => (
                <div
                    key={photo.path}
                    onClick={() => handleSelect(photo.url)}
                    style={{
                        position: 'relative',
                        cursor: 'pointer',
                        flexShrink: 0,
                        border: selected === photo.url ? '3px solid #00f' : '3px solid transparent',
                        borderRadius: '8px'
                    }}
                >
                    <img
                        src={photo.url}
                        alt="Style"
                        style={{
                            width: '120px',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '5px'
                        }}
                    />
                </div>
            ))}
        </div>
    );
}
