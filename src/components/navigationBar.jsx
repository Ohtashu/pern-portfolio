import { useState } from "react";
import { Menu, X } from "lucide-react";
import "./navigationBar.css";

// FIX: Renamed function to PascalCase 'NavigationBar' to comply with React component conventions
export default function NavigationBar() {
    // State to toggle mobile navigation menu
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="navBar">
            {/* FIX: Added accessible mobile menu hamburger toggle button */}
            <button
                className="menu-toggle"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
            >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Navigation links with smooth scroll targets and auto-close on mobile */}
            <nav
                className={menuOpen ? "main-nav is-open" : "main-nav"}
                aria-label="Main Navigation"
            >
                <a href="#work" onClick={() => setMenuOpen(false)}>
                    Work
                </a>
                <a href="#experience" onClick={() => setMenuOpen(false)}>
                    Experience
                </a>
                <a href="#skills" onClick={() => setMenuOpen(false)}>
                    Skills
                </a>
                {/* FIX: Corrected href from 'credentials' to target anchor '#experience' or '#about' */}
                <a href="#about" onClick={() => setMenuOpen(false)}>
                    About
                </a>
            </nav>
        </div>
    );
}
