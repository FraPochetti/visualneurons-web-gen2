// pages/dashboard.tsx
import Link from "next/link";
import { useState, useEffect } from "react";
import { list, getUrl } from "aws-amplify/storage";
import { fetchAuthSession, getCurrentUser, fetchUserAttributes, signOut } from "aws-amplify/auth";

export default function Dashboard() {
    const [uploadedPhotos, setUploadedPhotos] = useState<{ path: string; url: string }[]>([]);
    const [generatedPhotos, setGeneratedPhotos] = useState<{ path: string; url: string }[]>([]);
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
                <nav>
                    <Link href="/upload">Upload Photo</Link> |{" "}
                    <Link href="/generate-image">Generate Image</Link>
                </nav>
                <div>
                    {userEmail && <span>Hi, {userEmail}</span>}
                    <button onClick={handleLogout} className="button" style={{ marginLeft: "10px" }}>
                        🚪 Logout
                    </button>
                </div>
            </header>
            <section>
                <h2>Uploaded Photos</h2>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "10px",
                    }}
                >
                    {uploadedPhotos.slice(0, 6).map((photo) => (
                        <img
                            key={photo.path}
                            src={photo.url}
                            alt="Uploaded"
                            style={{ width: "100%", objectFit: "cover", borderRadius: "8px" }}
                        />
                    ))}
                </div>
            </section>
            <section>
                <h2>Generated Photos</h2>
                {generatedPhotos.length > 0 ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                            gap: "10px",
                        }}
                    >
                        {generatedPhotos.map((photo) => (
                            <img
                                key={photo.path}
                                src={photo.url}
                                alt="Generated"
                                style={{ width: "100%", objectFit: "cover", borderRadius: "8px" }}
                            />
                        ))}
                    </div>
                ) : (
                    <p>No generated photos yet.</p>
                )}
            </section>
        </div>
    );
}
