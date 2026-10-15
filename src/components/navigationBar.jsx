import {useState} from "react";
import "./navigationBar.css"

export default function navigationBar() {
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <div className="navBar">
            <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label='Open menu' aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
                <a href="#work" onClick={() => setMenuOpen(false)}>Work</a>
                <a href="#experience" onClick={() => setMenuOpen(false)}>Experience</a>
                <a href="#skills" onClick={() => setMenuOpen(false)}>Skills</a>
                <a href="credentials" onClick={() => setMenuOpen(false)}>Credentials</a>
                <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
            </nav>
        </div>
    )
}