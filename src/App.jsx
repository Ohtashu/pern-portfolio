import { useEffect, useState } from "react";
import Navbar from "./components/navigationBar.jsx";
import { ArrowUpRight } from "lucide-react";
import { isSupabaseConfigured, supabase } from "/utils/supabase.js";
import "./App.css";

// Static profile asset
import logoImg from "./assets/logo/logo.jpg";

// Static data lists for skills and work experience
const currentYear = new Date().getFullYear();

const skillList = [
    { number: "01", title: "Frontend", details: "React, CSS, HTML, shadcn/ui", level: "01" },
    { number: "02", title: "Backend", details: "Node.js, Express.js, JavaScript, PostgreSQL", level: "01" },
];

const defaultExperienceList = [
    {
        number: "01",
        title: "Web Development",
        role: "Frontend & Backend",
        description: "Building across frontend and backend with React, JavaScript, Node.js, Express, and PostgreSQL.",
    },
];

function getSafeProjectUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
    } catch {
        return null;
    }
}

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [projects, setProjects] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [theme, setTheme] = useState(() => {
        try {
            const savedTheme = window.localStorage.getItem("portfolio-theme");
            if (savedTheme === "light" || savedTheme === "dark") {
                return savedTheme;
            }
        } catch {
            // Continue with the system preference when storage is unavailable.
        }

        return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    });

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");

        try {
            window.localStorage.setItem("portfolio-theme", theme);
        } catch {
            // The selected theme remains active for the current page view.
        }
    }, [theme]);

    useEffect(() => {
        let isActive = true;

        async function loadPortfolioData() {
            try {
                if (!isSupabaseConfigured || !supabase) {
                    throw new Error("Supabase environment variables are missing.");
                }

                const [projectsRes, experienceRes] = await Promise.all([
                    supabase.from("projects").select(),
                    supabase.from("experience").select().order("experienceid", { ascending: true }),
                ]);

                if (projectsRes.error) {
                    throw projectsRes.error;
                }

                if (isActive) {
                    setProjects(projectsRes.data ?? []);
                    if (!experienceRes.error && experienceRes.data && experienceRes.data.length > 0) {
                        setExperiences(experienceRes.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch portfolio data", error);
                if (isActive) {
                    setFetchError(isSupabaseConfigured
                        ? "Unable to load projects. Check the Supabase public.projects table and access policies."
                        : "Projects are unavailable. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        }

        loadPortfolioData();
        return () => {
            isActive = false;
        };
    }, []);

    const displayedExperiences = experiences.length > 0
        ? experiences.map((exp, index) => ({
            number: String(index + 1).padStart(2, "0"),
            title: exp.title || "Untitled Experience",
            role: exp.job_title || exp.role || "",
            description: exp.details || exp.description || "",
        }))
        : defaultExperienceList;

    return (
        <main>
            {/* Site Header with profile info and navigation */}
            <header>
                <div className="card profile-dark">
                    <img src={logoImg} alt="Juan Carlos A. Flores logo" />
                    <h2>Juan Carlos A. Flores</h2>
                </div>
                <Navbar
                    isDarkMode={theme === "dark"}
                    onThemeToggle={() => setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark")}
                />
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
                        <a href="#about" className="btn-secondary">
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
                <div className="work-header">
                    <div>
                        <p className="eyebrow">Selected projects / 2026</p>
                        <h2 id="work-title">Things I&apos;ve made</h2>
                    </div>
                    <p className="section-note">
                        A collection of experiments, tools, <br />
                        and things I&apos;m proud to keep learning from.
                    </p>
                </div>

                <div className="project-scroll-container">
                    {isLoading && <div className="loading-indicator">Loading featured projects...</div>}
                    {fetchError && (
                        <div className="error-indicator">
                            {fetchError}
                        </div>
                    )}
                    {!isLoading && !fetchError && projects.length === 0 && (
                        <div className="loading-indicator">No featured projects found.</div>
                    )}

                    {!isLoading && !fetchError && projects.map((project, index) => {
                        const projectUrl = getSafeProjectUrl(project.demo_url) || getSafeProjectUrl(project.repo_url);
                        const projectTitle = project.name || "Untitled project";
                        const projectNumber = String(index + 1).padStart(2, "0");

                        return (
                            <article className="project-card" key={project.id ?? projectTitle}>
                                <span className="card-number">{projectNumber}</span>
                                <h3>{projectTitle}</h3>
                                <p>{project.description || "No description provided."}</p>

                                <div className="project-footer">
                                    <div className="tag-list">
                                        <span>{project.language || "Code"}</span>
                                    </div>

                                    {projectUrl && (
                                        <a
                                            href={projectUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="project-link-btn"
                                            aria-label={`View ${projectTitle}`}
                                        >
                                            <ArrowUpRight size={18} />
                                        </a>
                                    )}
                                </div>
                            </article>
                        );
                    })}
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
                    {displayedExperiences.map((work) => (
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

            <section className="section about-section" id="about" aria-labelledby="about-title">
                <div className="about-heading">
                    <p className="eyebrow">A little about me</p>
                    <h2 id="about-title">Ideas made clear, useful, and human.</h2>
                </div>
                <div className="about-content">
                    <p>
                        I&apos;m Juan Carlos A. Flores, a web developer who enjoys turning ideas into
                        meaningful digital experiences. I work across frontend and backend, building
                        with React, JavaScript, Node.js, Express, and PostgreSQL.
                    </p>
                    <p>
                        I care about user-centered design, clear communication, and continuous
                        learning. With every project, I aim to make the experience thoughtful and
                        leave the codebase kinder than I found it.
                    </p>
                </div>
            </section>

            <footer className="footer-section">
                <p>© {currentYear} Juan Carlos A. Flores. Built with React & Vite.</p>
            </footer>
        </main>
    );
}
