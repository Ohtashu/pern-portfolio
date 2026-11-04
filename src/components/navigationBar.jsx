import { useEffect, useRef, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import "./navigationBar.css";

const navigationLinks = [
    { href: "#work", label: "Work" },
    { href: "#experience", label: "Experience" },
    { href: "#skills", label: "Skills" },
    { href: "#about", label: "About" },
];

export default function NavigationBar({ isDarkMode, onThemeToggle }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const drawerRef = useRef(null);

    useEffect(() => {
        const drawer = drawerRef.current;
        if (!drawer) return;

        if (menuOpen && !drawer.open) {
            drawer.showModal();
        } else if (!menuOpen && drawer.open) {
            drawer.close();
        }
    }, [menuOpen]);

    useEffect(() => {
        const desktopViewport = window.matchMedia("(min-width: 769px)");
        const closeDrawerOnDesktop = () => {
            if (desktopViewport.matches) {
                setMenuOpen(false);
            }
        };

        desktopViewport.addEventListener("change", closeDrawerOnDesktop);
        return () => desktopViewport.removeEventListener("change", closeDrawerOnDesktop);
    }, []);

    return (
        <div className="navBar">
            <nav className="main-nav" aria-label="Main navigation">
                {navigationLinks.map((link) => (
                    <a href={link.href} key={link.href}>
                        {link.label}
                    </a>
                ))}
            </nav>

            <div className="nav-actions">
                <button
                    type="button"
                    className="theme-toggle"
                    onClick={onThemeToggle}
                    aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
                    aria-pressed={isDarkMode}
                >
                    {isDarkMode ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
                </button>
                <button
                    type="button"
                    className="menu-toggle"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open navigation menu"
                    aria-expanded={menuOpen}
                    aria-controls="navigation-drawer"
                >
                    <Menu size={22} aria-hidden="true" />
                </button>
            </div>

            <dialog
                className="navigation-drawer"
                id="navigation-drawer"
                ref={drawerRef}
                aria-labelledby="navigation-drawer-title"
                onClose={() => setMenuOpen(false)}
                onClick={(event) => {
                    if (event.target === event.currentTarget) {
                        setMenuOpen(false);
                    }
                }}
            >
                <div className="drawer-header">
                    <h2 id="navigation-drawer-title">Navigate</h2>
                    <button
                        type="button"
                        className="drawer-close"
                        onClick={() => setMenuOpen(false)}
                        aria-label="Close navigation menu"
                        autoFocus
                    >
                        <X size={22} aria-hidden="true" />
                    </button>
                </div>
                <nav className="drawer-nav" aria-label="Mobile navigation">
                    {navigationLinks.map((link) => (
                        <a href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>
                            {link.label}
                        </a>
                    ))}
                </nav>
            </dialog>
        </div>
    );
}
