// pages/dashboard.tsx
import React from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useUserPhotos } from "@/src/hooks/useUserPhotos";
import { Navigation } from "@/src/components/layout/Navigation";
import { PhotoGrid } from "@/src/components/ui/PhotoGrid";
import { ErrorBoundary } from "@/src/components/ui/ErrorBoundary";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { visiblePhotos, loading, error, hasMore, loadMore, deletePhoto } = useUserPhotos();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            // Error is already logged in the service
            alert("Logout failed. Please try again.");
        }
    };

    const handleDeletePhoto = async (path: string) => {
        try {
            await deletePhoto(path);
        } catch (error) {
            alert("Failed to delete photo. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className="error">Error: {error}</div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Navigation />
                    <div className={styles.userInfo}>
                        {user?.email && <div>Hi, {user.email}</div>}
                        <button onClick={handleLogout} className={`button ${styles.logoutButton}`}>
                            🚪 Logout
                        </button>
                    </div>
                </header>

                <section>
                    <h2>My Photos</h2>
                    <PhotoGrid
                        photos={visiblePhotos}
                        onDelete={handleDeletePhoto}
                    />
                </section>

                {hasMore && (
                    <button className="button" onClick={loadMore}>
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
        </ErrorBoundary>
    );
}
