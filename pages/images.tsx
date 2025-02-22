// pages/images.tsx
import { useState, useEffect } from "react";
import { list, getUrl, remove } from "aws-amplify/storage";
import { fetchAuthSession } from "aws-amplify/auth";
import Link from "next/link";

export default function ImageManagementPage() {
    const [photos, setPhotos] = useState<{ path: string; url: string }[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch photos from the user's subfolder based on their identity
    async function fetchPhotos() {
        setLoading(true);
        try {
            const session = await fetchAuthSession();
            const identityId = session.identityId;
            const userSubfolder = `photos/${identityId}/`;
            const { items } = await list({ path: userSubfolder });
            const photoList = await Promise.all(
                items.map(async (item) => {
                    const { url } = await getUrl({ path: item.path });
                    return { path: item.path, url: url.toString() };
                })
            );
            return photoList;
        } catch (err) {
            console.error("Error fetching photos", err);
            return [];
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPhotos().then(setPhotos);
    }, []);

    // Delete a photo with inline update
    const handleDelete = async (path: string) => {
        try {
            // Delete the file from S3
            await remove({ path });
            // Immediately update the local state by filtering out the deleted photo
            setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.path !== path));
            // Optionally, re-sync with S3 after a short delay to ensure consistency
            setTimeout(async () => {
                const updatedPhotos = await fetchPhotos();
                setPhotos(updatedPhotos);
            }, 1500);
        } catch (err) {
            console.error("Error deleting photo", err);
        }
    };

    return (
        <main style={{ padding: "20px" }}>
            {/* Navigation header with a back link */}
            <nav style={{ marginBottom: "20px" }}>
                <Link href="/">
                    ← Back to Home
                </Link>
            </nav>
            <h1>My Photos</h1>
            {loading && <p>Loading...</p>}
            {!loading && photos.length === 0 && <p>No photos yet!</p>}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "20px",
                }}
            >
                {photos.map((photo) => (
                    <div key={photo.path} style={{ textAlign: "center" }}>
                        <img
                            src={photo.url}
                            alt={photo.path}
                            style={{
                                width: "200px",
                                height: "200px",
                                objectFit: "cover",
                                borderRadius: "8px",
                            }}
                        />
                        <div style={{ marginTop: "10px" }}>
                            <button
                                onClick={() => handleDelete(photo.path)}
                                style={{
                                    padding: "5px 10px",
                                    cursor: "pointer",
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
