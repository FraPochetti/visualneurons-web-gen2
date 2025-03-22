// components/Layout.tsx
import Link from "next/link";
import styles from "./Layout.module.css";

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
                    <Link href="/style-transfer" className="nav-link">
                        Style Transfer
                    </Link>
                </nav>
            </header>
            <main>{children}</main>
            <footer className={styles.footer}>
                Made with ❤️ by{" "}
                <a
                    href="https://www.linkedin.com/in/francescopochetti/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.footerLink}
                >
                    Francesco Pochetti
                </a>
            </footer>
        </div>
    );
}
