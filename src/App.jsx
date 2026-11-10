import {useCallback, useEffect, useState} from "react";
import {isSupabaseConfigured, supabase} from "/utils/supabase.js";
import {defaultPortfolioSettings, readPortfolioSettings} from "/utils/portfolio-settings.js";
import {Typed, Scrambled, RotatingRole} from "./components/Typing.jsx";
import {useInView, useReducedMotion} from "./components/portfolioHooks.js";
import {AmbientBackground as Ambient, BootOverlay as Boot} from "./components/Ambient.jsx";
import Terminal from "./components/Terminal.jsx";
import "./Portfolio.css";

function SectionHeading({number, title, reducedMotion}) {
    const [ref, visible] = useInView();
    return <div ref={ref} className={`section-heading ${visible ? "is-visible" : ""}`}><span
        className="section-number">{number}</span><h2><Typed text={title} active={visible}
                                                             reducedMotion={reducedMotion}/></h2><span
        className="heading-line" aria-hidden="true"/><span className="heading-squares" aria-hidden="true">▪ ▪ ▪ ▪</span>
    </div>;
}

function Panel({title, children, className = ""}) {
    const [ref, visible] = useInView();
    return <div ref={ref} className={`panel reveal ${visible ? "is-visible" : ""} ${className}`}>
        <div className="panel-title"><span><span aria-hidden="true">■ </span>{title}</span><span
            aria-hidden="true">■</span></div>
        <div className="panel-body">{typeof children === "function" ? children(visible) : children}</div>
    </div>;
}

function Reveal({as: Element = "div", className = "", children, ...props}) {
    const [ref, visible] = useInView();
    return <Element ref={ref} className={`${className} reveal ${visible ? "is-visible" : ""}`} {...props}>{children}</Element>;
}

function Count({value, active, reducedMotion}) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!active || reducedMotion) return;
        let frame;
        const start = performance.now();
        const tick = (now) => {
            const progress = Math.min((now - start) / 800, 1);
            setCount(Math.round(value * progress));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [value, active, reducedMotion]);
    return <span aria-label={String(value)}><span aria-hidden="true">{reducedMotion ? value : active ? count : 0}</span></span>;
}

function Header({clock, name}) {
    const [active, setActive] = useState("");
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const update = () => {
            const height = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(height > 0 ? window.scrollY / height * 100 : 0);
            let current = "";
            for (const id of ["about", "work", "log", "contact"]) {
                const node = document.getElementById(id);
                if (node && node.getBoundingClientRect().top <= 160) current = id;
            }
            setActive(current);
        };
        window.addEventListener("scroll", update, {passive: true});
        update();
        return () => window.removeEventListener("scroll", update);
    }, []);
    return <header className="site-header">
        <div className="dotted-strip" aria-hidden="true"/>
        <div className="header-inner"><a className="brand" href="#top"
                                         aria-label={`${name}, back to top`}>◈ {name}<span> / PORTFOLIO</span></a>
            <nav className="site-nav" aria-label="Main navigation">{["about", "work", "log", "contact"].map((id, i) =>
                <a className={`menu-item ${active === id ? "selected" : ""}`} href={`#${id}`} key={id}
                   aria-current={active === id ? "location" : undefined}><span>0{i + 1} {id}</span></a>)}</nav>
            <time className="header-clock">{clock}</time>
        </div>
        <div className="scroll-progress" aria-hidden="true" style={{width: `${progress}%`}}/>
    </header>;
}

function Hero({clock, elapsed, reducedMotion, profile, location, focus, bootComplete, nameComplete, onNameComplete}) {
    return <section className="hero" id="top">
        <div className="hero-copy"><p className={`eyebrow hero-reveal ${nameComplete || reducedMotion ? "is-visible" : ""}`} style={{"--reveal-delay": "0ms"}}><span className="status-dot"/> SYSTEM ONLINE / PORTFOLIO</p>
            <h1><Typed text={profile.name} active={bootComplete} speed={85} onComplete={onNameComplete} reducedMotion={reducedMotion}/></h1><p className={`role-line hero-reveal ${nameComplete || reducedMotion ? "is-visible" : ""}`} style={{"--reveal-delay": "140ms"}}>{profile.roles.length > 0 && (nameComplete || reducedMotion) ? <>// <RotatingRole
                roles={profile.roles} reducedMotion={reducedMotion}/></> : null}</p><p className={`hero-intro hero-reveal ${nameComplete || reducedMotion ? "is-visible" : ""}`} style={{"--reveal-delay": "280ms"}}>{profile.intro}</p>
            <div className={`hero-actions hero-reveal ${nameComplete || reducedMotion ? "is-visible" : ""}`} style={{"--reveal-delay": "420ms"}}><a className="menu-item" href="#work"><span>View selected work ↗</span></a><a
                className="menu-item" href="#contact"><span>Open channel ↗</span></a></div>
        </div>
        <div className={`hero-visual hero-reveal ${nameComplete || reducedMotion ? "is-visible" : ""}`} style={{"--reveal-delay": "560ms"}}>
            <div className="rings" aria-hidden="true"><i/><i/><i/><b>◆</b></div>
            <Panel title="UNIT STATUS" className="status-panel">
                <dl>
                    <div>
                        <dt>STATUS</dt>
                        <dd>ONLINE</dd>
                    </div>
                    {location && <div>
                        <dt>BASE</dt>
                        <dd>{location}</dd>
                    </div>}{focus && <div>
                    <dt>FOCUS</dt>
                    <dd>{focus}</dd>
                </div>}
                    <div>
                        <dt>YOUR TIME</dt>
                        <dd>{clock}</dd>
                    </div>
                    <div>
                        <dt>SESSION</dt>
                        <dd>{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</dd>
                    </div>
                </dl>
            </Panel></div>
    </section>;
}

function About({reducedMotion, profile, skills, toolbox, focus, projects, experiences, loading, experienceUnavailable}) {
    const [ref, visible] = useInView();
    return <section className="section" id="about"><SectionHeading number="01" title="About"
                                                                   reducedMotion={reducedMotion}/>
        <div className="bento" ref={ref}><Panel title="PROFILE.TXT" className="profile-panel"><p><Typed
            text={profile.bio[0] || ""} active={visible} speed={9} reducedMotion={reducedMotion}/></p><p>{profile.bio[1]}</p>
        </Panel><Panel title="RECORDS" className="records-panel">
            {(recordsVisible) => <div className="records-list">
                <div><strong>{loading ? "—" : <Count value={projects.length} active={recordsVisible} reducedMotion={reducedMotion}/>}</strong><span>PROJECTS</span></div>
                <div><strong>{experienceUnavailable ? "—" : <Count value={experiences.length} active={recordsVisible} reducedMotion={reducedMotion}/>}</strong><span>EXPERIENCE</span></div>
            </div>}
        </Panel><Panel title="CURRENTLY" className="currently-panel">
            <ul>{focus && <li>{focus}</li>}</ul>
        </Panel><Panel title="SKILLS" className="skills-panel">
            <div className="chips">{skills.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
        </Panel><Panel title="TOOLBOX" className="toolbox-panel">
            <div className="chips">{toolbox.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
        </Panel></div>
    </section>;
}

function safeUrl(value) {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
}

function Work({projects, loading, error, reducedMotion}) {
    const [selected, setSelected] = useState(0);
    const project = projects[selected];

    function onKeyDown(event) {
        let next = selected;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (selected + 1) % projects.length;
        else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (selected + projects.length - 1) % projects.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = projects.length - 1;
        else return;
        event.preventDefault();
        setSelected(next);
        document.getElementById(`project-tab-${next}`)?.focus();
    }

    return <section className="section" id="work"><SectionHeading number="02" title="Selected work"
                                                                  reducedMotion={reducedMotion}/>{loading ?
        <p>Loading projects…</p> : error ? <p role="status">{error}</p> : !projects.length ?
            <p>No projects available.</p> : <div className="work-layout">
                <div className="project-tabs" role="tablist" aria-label="Projects" aria-orientation="vertical"
                     onKeyDown={onKeyDown}>{projects.map((item, index) => <Reveal as="button" key={item.id ?? index} type="button"
                                                                                  className={`menu-item ${selected === index ? "selected" : ""}`}
                                                                                  id={`project-tab-${index}`} role="tab"
                                                                                  aria-selected={selected === index}
                                                                                  aria-controls="project-detail"
                                                                                  tabIndex={selected === index ? 0 : -1}
                                                                                  onClick={() => setSelected(index)}>
                    <span>PRJ-{String(index + 1).padStart(3, "0")} / {item.name}</span>
                </Reveal>)}</div>
                <div id="project-detail" role="tabpanel" aria-labelledby={`project-tab-${selected}`}><Panel
                    title="PROJECT DATA / ▮ ▮ ▮" className="project-detail"><p
                    className="eyebrow">PRJ-{String(selected + 1).padStart(3, "0")}</p>
                    <h3><Scrambled key={`title-${selected}`} text={project.name || ""}
                               reducedMotion={reducedMotion}/></h3>{safeUrl(project.image_url) &&
                        <img className="project-image" src={safeUrl(project.image_url)}
                             alt={`${project.name || "Project"} screenshot`} loading="lazy"/>}{project.description && <p><Typed
                        key={`desc-${selected}`} text={project.description}
                        reducedMotion={reducedMotion}/></p>}
                    <dl>
                        {project.language && <div>
                            <dt>STACK</dt>
                            <dd>{project.language}</dd>
                        </div>}
                    </dl>
                    <div className="project-links">{safeUrl(project.demo_url) &&
                        <a className="menu-item" href={safeUrl(project.demo_url)} target="_blank"
                           rel="noreferrer"><span>Live project ↗</span></a>}{safeUrl(project.repo_url) &&
                        <a className="menu-item" href={safeUrl(project.repo_url)} target="_blank"
                           rel="noreferrer"><span>Repository ↗</span></a>}</div>
                </Panel></div>
            </div>}</section>;
}

function Log({experiences, reducedMotion, education, error}) {
    return <section className="section" id="log"><SectionHeading number="03" title="Activity log"
                                                                 reducedMotion={reducedMotion}/>
        {error && <p role="status">{error}</p>}<div className="timeline">{experiences.map((item, i) => <Reveal as="article" className="timeline-entry"
                                                                         key={item.experienceid ?? i}><span
            className="timeline-marker" aria-hidden="true"/><p className="eyebrow">LOG
            / {String(i + 1).padStart(2, "0")}</p>
            <h3>{item.title}</h3>
            <strong>{item.job_title}</strong>
            <p>{item.details}</p></Reveal>)}{education &&
            <Reveal as="p" className="timeline-entry">{education}</Reveal>}</div>
    </section>;
}

export default function App() {
    const reducedMotion = useReducedMotion();
    const [clock, setClock] = useState(() => new Date().toLocaleTimeString());
    const [elapsed, setElapsed] = useState(0);
    const [projects, setProjects] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [settings, setSettings] = useState(defaultPortfolioSettings);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [experienceError, setExperienceError] = useState("");
    const [bootComplete, setBootComplete] = useState(false);
    const [nameComplete, setNameComplete] = useState(false);
    const finishBoot = useCallback(() => setBootComplete(true), []);
    const finishName = useCallback(() => setNameComplete(true), []);
    useEffect(() => {
        const timer = window.setInterval(() => {
            setClock(new Date().toLocaleTimeString());
            setElapsed((value) => value + 1);
        }, 1000);
        return () => window.clearInterval(timer);
    }, []);
    useEffect(() => {
        let active = true;
        readPortfolioSettings(supabase).then((value) => {
            if (active) setSettings(value);
        }).catch(() => {
        });

        async function load() {
            try {
                if (!isSupabaseConfigured || !supabase) throw new Error("Projects are unavailable. Configure Supabase to load them.");
                const [projectResult, experienceResult] = await Promise.all([supabase.from("projects").select(), supabase.from("experience").select().order("experienceid", {ascending: true})]);
                if (active) {
                    if (projectResult.error) setError("Unable to load projects. Check Supabase access policies.");
                    else setProjects(projectResult.data ?? []);
                    if (experienceResult.error) setExperienceError("Unable to load experience. Check Supabase access policies.");
                    else setExperiences(experienceResult.data ?? []);
                }
            } catch (err) {
                if (active) {
                    setError(isSupabaseConfigured ? "Unable to load projects. Check Supabase access policies." : err.message);
                    setExperienceError("Unable to load experience. Check Supabase configuration and access policies.");
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        load();
        return () => {
            active = false;
        };
    }, []);
    const profile = {name: settings.name, intro: settings.intro, bio: settings.bio, roles: settings.roles};
    const links = (settings.social_links || []).filter((link) => link.label && safeUrl(link.url));
    const contacts = Object.fromEntries(links.map((link) => [link.label, safeUrl(link.url)]));
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email) ? settings.email : "";
    if (email) contacts.Email = email;
    const cvUrl = safeUrl(settings.cv_url);
    return <div className="portfolio"><a className="skip-link" href="#main">Skip to content</a><Ambient
        reducedMotion={reducedMotion}/><Boot reducedMotion={reducedMotion} onComplete={finishBoot}/><Header clock={clock} name={profile.name}/>
        <main id="main"><Hero clock={clock} elapsed={elapsed} bootComplete={bootComplete} nameComplete={nameComplete} onNameComplete={finishName}
                              reducedMotion={reducedMotion} profile={profile} location={settings.location}
                              focus={settings.focus}/>
            {settings.skills.length > 0 && <div className="ticker" aria-hidden="true">
                <div className="ticker-track">{[...settings.skills, ...settings.skills].map((item, i) => <span
                    key={i}>■ {item} / </span>)}</div>
            </div>}
            <About reducedMotion={reducedMotion} profile={profile} skills={settings.skills} toolbox={settings.toolbox}
                   focus={settings.focus} projects={projects} experiences={experiences}
                   loading={loading || !!error} experienceUnavailable={loading || !!experienceError}/><Work projects={projects} loading={loading} error={error}
                                                       reducedMotion={reducedMotion}/><Log experiences={experiences}
                                                                                           reducedMotion={reducedMotion}
                                                                                           education={settings.education} error={experienceError}/>
            <section className="section" id="contact"><SectionHeading number="04" title="Open channel"
                                                                      reducedMotion={reducedMotion}/>
                <div className="contact-layout"><Terminal profile={profile} skills={settings.skills} projects={projects}
                                                          contacts={contacts} reducedMotion={reducedMotion}/><Panel
                    title="CONTACT LINKS">
                    <div className="contact-links">{email && <Reveal as="a" className="contact-link"
                                                                href={`mailto:${encodeURIComponent(email)}`}><span>Email ↗</span></Reveal>}{links.map((link, index) =>
                        <Reveal as="a" className="contact-link" key={`${link.url}-${index}`} href={safeUrl(link.url)}
                           target="_blank" rel="noopener noreferrer"><span>{link.label} ↗</span></Reveal>)}{cvUrl &&
                        <Reveal as="a" className="contact-link" href={cvUrl} target="_blank" rel="noopener noreferrer"
                           download><span>Download CV ↓</span></Reveal>}{!email && !links.length && !cvUrl &&
                        <p>Contact links are not available yet.</p>}</div>
                </Panel></div>
            </section>
        </main>
        <footer className="site-footer">
            <div className="dotted-strip" aria-hidden="true"/>
            <div className="footer-inner"><span>© {new Date().getFullYear()} {profile.name}</span><span>END OF TRANSMISSION</span><a
                href="#top">BACK TO TOP ↑</a></div>
        </footer>
    </div>;
}
