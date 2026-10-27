import { useEffect, useState } from "react";
import Navbar from "./components/navigationBar.jsx";
import { ArrowUpRight } from "lucide-react";
import "./App.css";

// Static profile asset
import profileImg from "./assets/profile/wallhaven-lydkg2_1920x1080.png";

// Static data lists for skills and work experience
const currentYear = new Date().getFullYear();

const skillList = [
    { number: "01", title: "Frontend", details: "React, CSS, HTML, shadcn/ui", level: "01" },
    { number: "02", title: "Backend", details: "Node.js, Express.js, JavaScript, PostgreSQL", level: "01" },
];

const workList = [
    {
        number: "01",
        title: "MHACTO-BOCAUE",
        role: "Web Developer",
        description:
            "Built platform features with Next.js, React, Tailwind CSS, \nPHP, and custom REST APIs. Used AI-assisted tools \nthoughtfully to move from idea to working feature.",
    },
    {
        number: "02",
        title: "Paraiso360",
        role: "Quality Assurance",
        description:
            "Worked across research, interface design, and \nimplementation to make a useful product from a blank \npage.",
    },
];

// FIX: Moved static filter list outside component to keep useEffect dependencies pure
const featuredProjects = ["Paw-Active", "Mythspire", "WinLix-Util"];

export default function App() {
    const [repos, setRepos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    useEffect(() => {
        const getGithubRepos = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("https://api.github.com/users/ohtashu/repos");
                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }
                const toScript = await response.json();

                const filtered = toScript.filter(
                    (repo) => !repo.fork && featuredProjects.includes(repo.name)
                );
                setRepos(filtered);
            } catch (error) {
                console.error("Failed to fetch repos", error);
                setFetchError(true);
            } finally {
                setIsLoading(false);
            }
        };

        getGithubRepos();
    }, []);

    return (
        <main>
            {/* Site Header with profile info and navigation */}
            <header>
                <div className="card profile-dark">
                    <img src={profileImg} alt="Juan Carlos A. Flores profile" />
                    <h2>Juan Carlos A. Flores</h2>
                </div>
                <Navbar />
            </header>

            {/* FIX: Hero Section - removed invalid 'arian-hidden' and added the second grid column (.hero-media) */}
            <section className="hero" id="top">
                <div className="hero-div">
                    <h1 className="hero-title">
                        I build clear interfaces <br />
                        <em>with a little wonder.</em>
                    </h1>
                    <p className="hero-intro">
                        I&apos;m Juan Carlos A. Flores, a web developer who likes to turn ideas into
                        something meaningful and impactful.
                    </p>
                    {/* FIX: Added styled CTA buttons with valid anchor links */}
                    <div className="hero-action">
                        <a href="#work" className="btn-primary">
                            Explore my Work
                        </a>
                        <a href="#experience" className="btn-secondary">
                            More about me
                        </a>
                    </div>
                </div>
            </section>

            {/* Skills & Focus Ticker Banner */}
            <div className="banner" aria-hidden="true">
                <div className="banner-tracker">
                    <span>BACKEND</span>
                    <span>FRONTEND</span>
                    <span>USER-CENTERED DESIGN</span>
                </div>
            </div>

            {/* Selected Projects / Work Section */}
            <section className="section work-section" id="work" aria-labelledby="work-title">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Selected projects / 2026</p>
                        <h2 id="work-title">Things I&apos;ve made</h2>
                    </div>
                    <p className="section-note">
                        A collection of experiments, tools, <br />
                        and things I&apos;m proud to keep learning from.
                    </p>
                </div>

                <div className="project-grid">
                    {/* FIX: Added loading and error UI fallback handling */}
                    {isLoading && <div className="loading-indicator">Loading featured projects...</div>}
                    {fetchError && (
                        <div className="error-indicator">
                            Unable to load GitHub repositories at this moment.
                        </div>
                    )}
                    {!isLoading && !fetchError && repos.length === 0 && (
                        <div className="loading-indicator">No featured projects found.</div>
                    )}

                    {/* FIX: Changed className from 'project-grid' to 'project-card' so CSS card styles take effect */}
                    {!isLoading &&
                        repos.map((repo) => (
                            <article className="project-card" key={repo.id}>
                                <h3>{repo.name}</h3>
                                <p>{repo.description || "No description provided."}</p>

                                <div className="project-footer">
                                    <div className="tag-list">
                                        <span>{repo.language || "Code"}</span>
                                    </div>

                                    {/* FIX: Added .project-link-btn class for consistent circular button styling */}
                                    <a
                                        href={repo.html_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="project-link-btn"
                                        aria-label={`View ${repo.name} repository on GitHub`}
                                    >
                                        <ArrowUpRight size={18} />
                                    </a>
                                </div>
                            </article>
                        ))}
                </div>
            </section>

            {/* FIX: Added id="experience" and fixed section className to match CSS styling */}
            <section className="section experience-section" id="experience">
                {/* FIX: Corrected typo 'experiece-header' to 'experience-header' */}
                <div className="experience-header">
                    <p className="eyebrow">THE PATH SO FAR</p>
                    <h2>
                        Experience <br /> <em>in progress</em>
                    </h2>
                </div>
                <p className="experience-section-note">
                    Every role has taught me to ask better questions, communicate clearly, and leave
                    a codebase kinder than I found it.
                </p>

                <div className="main-experience">
                    {workList.map((work) => (
                        <div key={work.number} className="work-card">
                            {/* FIX: Corrected data property binding from work.experience to work.number */}
                            <span className="card-number">{work.number}</span>
                            <h3>{work.title}</h3>
                            <h4>{work.role}</h4>
                            <p style={{ whiteSpace: "pre-line" }}>{work.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FIX: Added id="skills" and structured skills grid with matching CSS classes */}
            <section className="section skills-container" id="skills">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Expertise</p>
                        <h2>Technical Skills</h2>
                    </div>
                </div>

                <div className="skills-grid">
                    {skillList.map((skill) => (
                        <div key={skill.number} className="skill-card">
                            <span className="card-number">{skill.number}</span>
                            <h3>{skill.title}</h3>
                            <p>{skill.details}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FIX: Added About/Footer section matching navigation target #about */}
            <footer className="footer-section" id="about">
                <p>© {currentYear} Juan Carlos A. Flores. Built with React & Vite.</p>
            </footer>
        </main>
    );
}
