// pages/dashboard.tsx
import Link from "next/link";
import { useState, useEffect } from "react";
import { list, getUrl, getProperties } from "aws-amplify/storage";
import { fetchAuthSession, fetchUserAttributes, signOut } from "aws-amplify/auth";
import { remove } from "aws-amplify/storage";
import styles from "./Dashboard.module.css"; // Import the module

export default function Dashboard() {
    interface Photo {
        path: string;
        url: string;
        lastModified: Date;
        isAiGenerated: boolean;
    }

    const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(6);

    // Fetch user attributes for display
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
        const fetchPhotos = async () => {
            const session = await fetchAuthSession();
            const identityId = session.identityId;
            const userPath = `photos/${identityId}/`;
            const { items } = await list({ path: userPath });
            const photos = await Promise.all(
                items.map(async (item) => {
                    const { url } = await getUrl({ path: item.path });
                    const properties = await getProperties({ path: item.path });
                    return {
                        path: item.path,
                        url: url.toString(),
                        lastModified: item.lastModified ? new Date(item.lastModified) : new Date(),
                        isAiGenerated: properties.metadata?.isaigenerated === "true",
                    };
                })
            );
            photos.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
            setUploadedPhotos(photos);
        };
        fetchPhotos();
    }, []);

    const handleDelete = async (path: string) => {
        try {
            await remove({ path });
            setUploadedPhotos((prev) => prev.filter((photo) => photo.path !== path));
        } catch (err) {
            console.error("Error deleting photo:", err);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <nav className="nav">
                    <Link href="/upload" className="nav-link">Upload Photo</Link>
                    <Link href="/generate-image" className="nav-link">Generate Image</Link>
                    <Link href="/style-transfer" className="nav-link">Style Transfer</Link>
                    <Link href="/image-chat" className="nav-link">Image Chat</Link>
                </nav>
                <div className={styles.userInfo}>
                    {userEmail && <div>Hi, {userEmail}</div>}
                    <button onClick={handleLogout} className={`button ${styles.logoutButton}`}>
                        🚪 Logout
                    </button>
                </div>
            </header>
            <section>
                <h2>My Photos</h2>
                <div className="grid-container">
                    {uploadedPhotos.slice(0, visibleCount).map((photo) => (
                        <div className="photo-item" key={photo.path}>
                            <Link href={{
                                pathname: "/edit-image",
                                query: { url: photo.url, originalPath: photo.path },
                            }}>
                                <img src={photo.url} alt="Uploaded" className="grid-image" />
                            </Link>
                            {photo.isAiGenerated && (<div className="ai-watermark">AI</div>)}
                            <button className="delete-button" onClick={() => handleDelete(photo.path)}>
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </section>
            {visibleCount < uploadedPhotos.length && (
                <button className="button" onClick={() => setVisibleCount(visibleCount + 6)}>
                    Load More
                </button>
            )}
            <footer className={styles.footer}>
                Made with ❤️ by{" "}
                <a
                    href="https://www.linkedin.com/in/francescopochetti/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "underline", color: "inherit" }}
                >
                    Francesco Pochetti
                </a>
            </footer>
        </div>
    );
}
