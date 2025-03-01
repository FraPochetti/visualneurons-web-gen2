// pages/dashboard.tsx
import Link from "next/link";
import { useState, useEffect } from "react";
import { list, getUrl } from "aws-amplify/storage";
import { fetchAuthSession, fetchUserAttributes, signOut } from "aws-amplify/auth";
import { remove } from "aws-amplify/storage";

export default function Dashboard() {
    const [uploadedPhotos, setUploadedPhotos] = useState<{ path: string; url: string }[]>([]);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    // Fetch user attributes (e.g., email) for display
    useEffect(() => {
        async function fetchUserData() {
            try {
                const attributes = await fetchUserAttributes();
                setUserEmail(attributes.email || "User");
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        }
        fetchUserData();
    }, []);

    // Logout handler
    async function handleLogout() {
        try {
            await signOut();
            window.location.reload();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }

    // Fetch photos for the dashboard
    useEffect(() => {
        async function fetchPhotos() {
            const session = await fetchAuthSession();
            const identityId = session.identityId;
            const userPath = `photos/${identityId}/`;
            const { items } = await list({ path: userPath });
            const photos = await Promise.all(
                items.map(async (item) => {
                    const { url } = await getUrl({ path: item.path });
                    return { path: item.path, url: url.toString() };
                })
            );
            setUploadedPhotos(photos);
        }
        fetchPhotos();
    }, []);

    const handleDelete = async (path: string) => {
        try {
            // Remove from S3
            await remove({ path });
            // Remove from local state
            setUploadedPhotos((prev) => prev.filter((photo) => photo.path !== path));
        } catch (err) {
            console.error("Error deleting photo:", err);
        }
    };

    return (
        <div style={{ padding: "1rem", maxWidth: "900px", margin: "0 auto" }}>
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                }}
            >
                <nav className="nav">
                    <Link href="/upload" className="nav-link">Upload Photo</Link>
                    <Link href="/generate-image" className="nav-link">Generate Image</Link>
                </nav>
                <div>
                    {userEmail && <span>Hi, {userEmail}</span>}
                    <button onClick={handleLogout} className="button" style={{ marginLeft: "10px" }}>
                        🚪 Logout
                    </button>
                </div>
            </header>
            <section>
                <h2>My Photos</h2>
                <div className="grid-container">
                    {uploadedPhotos.slice(0, 6).map((photo) => (
                        <div className="photo-item" key={photo.path}>
                            <img
                                src={photo.url}
                                alt="Uploaded"
                                className="grid-image"
                            />
                            <button
                                className="delete-button"
                                onClick={() => handleDelete(photo.path)}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
