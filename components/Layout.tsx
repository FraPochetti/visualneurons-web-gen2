// components/Layout.tsx
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="container">
            <header className="header">
                <nav>
                    <Link href="/dashboard">Dashboard</Link> |{" "}
                    <Link href="/upload">Upload Photo</Link> |{" "}
                    <Link href="/generate-image">Generate Image</Link>
                </nav>
            </header>
            <main>{children}</main>
        </div>
    );
}
