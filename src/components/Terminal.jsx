import { useEffect, useId, useRef, useState } from "react";

const commands = ["help", "whoami", "skills", "projects", "contact", "date", "clear", "sudo hire-me"];

function displayValue(value) {
    return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function commandOutput(command, { profile, skills, projects, contacts }) {
    switch (command.toLowerCase()) {
        case "help":
            return `Available commands: ${commands.join(", ")}`;
        case "whoami": {
            const details = [profile?.name, profile?.intro, ...(Array.isArray(profile?.bio) ? profile.bio : [profile?.bio])].map(displayValue).filter(Boolean);
            return details.length ? details.join("\n") : "Profile information is not available.";
        }
        case "skills": {
            const items = Array.isArray(skills) ? skills.map((skill) => displayValue(typeof skill === "object" && skill !== null ? skill.name : skill)).filter(Boolean) : [];
            return items.length ? items.join(", ") : "No skills available.";
        }
        case "projects": {
            const items = Array.isArray(projects) ? projects.map((project) => {
                if (typeof project === "string") return displayValue(project);
                if (!project || typeof project !== "object") return "";
                return [project.name, project.description, project.repo_url, project.demo_url].map(displayValue).filter(Boolean).join(" — ");
            }).filter(Boolean) : [];
            return items.length ? items.join("\n") : "No projects available.";
        }
        case "contact":
        case "sudo hire-me": {
            const items = contacts && typeof contacts === "object" && !Array.isArray(contacts)
                ? Object.entries(contacts).map(([label, value]) => displayValue(value) ? `${label}: ${displayValue(value)}` : "").filter(Boolean)
                : [];
            return items.length ? items.join("\n") : "No contact information available.";
        }
        case "date":
            return new Date().toLocaleString();
        case "sudo":
            return "Permission denied.";
        default:
            return `Command not found: ${command}. Type help for available commands.`;
    }
}

export default function Terminal({ profile, skills, projects, contacts, reducedMotion = false }) {
    const [input, setInput] = useState("");
    const [entries, setEntries] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(null);
    const [draft, setDraft] = useState("");
    const [notice, setNotice] = useState("");
    const [queue, setQueue] = useState([]);
    const [active, setActive] = useState(null);
    const inputId = useId();
    const inputRef = useRef(null);
    const composing = useRef(false);
    const terminalRef = useRef(null);
    const outputRef = useRef(null);
    const introStarted = useRef(false);

    useEffect(() => {
        const startIntro = () => {
            if (introStarted.current) return;
            introStarted.current = true;
            setQueue((previous) => [...previous, { output: "PORTFOLIO SHELL v2.6 — connection established.\nType `help` or tap a command below." }]);
        };
        if (typeof IntersectionObserver === "undefined") {
            startIntro();
            return;
        }
        const observer = new IntersectionObserver((items) => {
            if (items.some((item) => item.isIntersecting)) {
                startIntro();
                observer.disconnect();
            }
        });
        observer.observe(terminalRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (active || !queue.length) return;
        const [next, ...remaining] = queue;
        setQueue(remaining);
        if (next.clear) {
            setEntries([]);
            setNotice("Terminal cleared.");
            return;
        }
        setNotice("");
        setEntries((previous) => [...previous, { ...next, visible: reducedMotion ? next.output : "" }]);
        if (!reducedMotion && next.output) setActive({ output: next.output, position: 0 });
    }, [active, queue, reducedMotion]);

    useEffect(() => {
        if (!active) return;
        if (reducedMotion) {
            setEntries((previous) => previous.map((entry, index) => index === previous.length - 1 ? { ...entry, visible: active.output } : entry));
            setActive(null);
            return;
        }
        const timer = setTimeout(() => {
            const newline = active.output.indexOf("\n", active.position);
            const end = newline === active.position ? active.position + 1 : Math.min(active.position + 3, newline === -1 ? active.output.length : newline);
            setEntries((previous) => previous.map((entry, index) => index === previous.length - 1 ? { ...entry, visible: active.output.slice(0, end) } : entry));
            setActive(end >= active.output.length ? null : { ...active, position: end });
        }, 6);
        return () => clearTimeout(timer);
    }, [active, reducedMotion]);

    useEffect(() => {
        if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }, [entries]);

    function runCommand(value) {
        const command = value.trim();
        if (!command) return;

        setHistory((previous) => [...previous, command]);
        setHistoryIndex(null);
        setDraft("");
        setInput("");
        if (command.toLowerCase() === "clear") {
            setQueue((previous) => [...previous, { clear: true }]);
        } else {
            const output = commandOutput(command, { profile, skills, projects, contacts });
            setQueue((previous) => [...previous, { command, output }]);
        }
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" && (composing.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)) {
            event.preventDefault();
            return;
        }
        if (event.key === "ArrowUp" && history.length) {
            event.preventDefault();
            if (historyIndex === null) setDraft(input);
            const index = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
            setHistoryIndex(index);
            setInput(history[index]);
        } else if (event.key === "ArrowDown" && historyIndex !== null) {
            event.preventDefault();
            const index = historyIndex + 1;
            if (index >= history.length) {
                setHistoryIndex(null);
                setInput(draft);
            } else {
                setHistoryIndex(index);
                setInput(history[index]);
            }
        }
    }

    return (
        <section ref={terminalRef} className="terminal" aria-label="Interactive terminal" data-reduced-motion={reducedMotion}>
            <div ref={outputRef} className="terminal-output" role="log" aria-live="polite" aria-relevant="additions text">
                {entries.map((entry, index) => (
                    <div className="terminal-entry" key={index}>
                        {entry.command && <div className="terminal-command">$ {entry.command}</div>}
                        <div className="terminal-response" style={{ whiteSpace: "pre-wrap" }} aria-label={entry.output}><span aria-hidden="true">{entry.visible}</span></div>
                    </div>
                ))}
            </div>
            <div className="terminal-notice" role="status" aria-live="polite">{notice}</div>
            <form className="terminal-form" onSubmit={(event) => { event.preventDefault(); if (!composing.current) runCommand(input); }}>
                <label className="terminal-label" htmlFor={inputId}>Command</label>
                <input
                    className="terminal-input"
                    id={inputId}
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onCompositionStart={() => { composing.current = true; }}
                    onCompositionEnd={() => { composing.current = false; }}
                    autoComplete="off"
                    spellCheck={false}
                />
                <button className="terminal-submit" type="submit">Run</button>
            </form>
            <div className="terminal-quick-commands" aria-label="Quick commands">
                {commands.map((command) => (
                    <button className="terminal-quick-button" type="button" key={command} onClick={() => { runCommand(command); inputRef.current?.focus(); }}>
                        {command}
                    </button>
                ))}
            </div>
        </section>
    );
}