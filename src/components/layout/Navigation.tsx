import Link from "next/link";
import { ROUTES } from "@/src/constants";

interface NavigationProps {
    className?: string;
}

export function Navigation({ className = "nav" }: NavigationProps) {
    const navItems = [
        { href: ROUTES.UPLOAD, label: "Upload Photo" },
        { href: ROUTES.GENERATE_IMAGE, label: "Generate Image" },
        { href: ROUTES.STYLE_TRANSFER, label: "Style Transfer" },
        { href: ROUTES.IMAGE_CHAT, label: "Image Chat" },
        { href: ROUTES.GENERATE_VIDEO, label: "Generate Video" },
    ];

    return (
        <nav className={className}>
            {navItems.map(({ href, label }) => (
                <Link key={href} href={href} className="nav-link">
                    {label}
                </Link>
            ))}
        </nav>
    );
} 