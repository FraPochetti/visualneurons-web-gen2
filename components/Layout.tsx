// components/Layout.tsx
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="container">
            <header className="header">
                <nav className="nav">
                    <Link href="/dashboard" className="nav-link">
                        Dashboard
                    </Link>
                    <Link href="/upload" className="nav-link">
                        Upload Photo
                    </Link>
                    <Link href="/generate-image" className="nav-link">
                        Generate Image
                    </Link>
                </nav>

            </header>
            <main>{children}</main>
        </div>
    );
}
