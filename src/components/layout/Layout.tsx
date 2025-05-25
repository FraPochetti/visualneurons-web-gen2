import { Navigation } from './Navigation';
import styles from './Layout.module.css';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="container">
            <header className="header">
                <Navigation />
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