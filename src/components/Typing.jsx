import { useEffect, useRef, useState } from "react";

export function Typed({ text, active = true, reducedMotion = false, className = "", speed = 55, onComplete }) {
    const [count, setCount] = useState(0);
    const complete = useRef(onComplete);
    useEffect(() => { complete.current = onComplete; }, [onComplete]);
    useEffect(() => {
        if (!active) return;
        if (reducedMotion || !text.length) { complete.current?.(); return; }
        let index = 0;
        let timer;
        const next = () => {
            index += 1;
            setCount(index);
            if (index < text.length) timer = window.setTimeout(next, speed + Math.random() * speed * .8 + (/[.,—]/.test(text[index - 1]) ? speed * 4 : 0));
            else timer = window.setTimeout(() => complete.current?.(), 500);
        };
        timer = window.setTimeout(next, speed);
        return () => window.clearTimeout(timer);
    }, [text, active, reducedMotion, speed]);
    const shown = reducedMotion ? text.length : active ? count : 0;
    return <span className={className} aria-label={text}><span aria-hidden="true">{text.slice(0, shown)}{shown < text.length && active && !reducedMotion && <span className="typing-cursor" />}<span className="typed-remainder">{text.slice(shown)}</span></span></span>;
}

export function Scrambled({ text, reducedMotion = false }) {
    const [display, setDisplay] = useState(text);
    useEffect(() => {
        if (reducedMotion) return;
        const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>[]_";
        const start = performance.now();
        let frame;
        const animate = (now) => {
            const progress = Math.min(1, (now - start) / 520);
            const resolved = Math.floor(progress * text.length);
            setDisplay(text.slice(0, resolved) + Array.from(text.slice(resolved), (character) => character === " " ? " " : glyphs[Math.floor(Math.random() * glyphs.length)]).join(""));
            if (progress < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [text, reducedMotion]);
    return <span aria-label={text}><span aria-hidden="true">{reducedMotion ? text : display}</span></span>;
}

export function RotatingRole({ roles, reducedMotion }) {
    const [role, setRole] = useState(0);
    const [count, setCount] = useState(0);
    const [deleting, setDeleting] = useState(false);
    useEffect(() => {
        if (reducedMotion) return;
        const text = roles[role] || "";
        const delay = !deleting && count === text.length ? 1900 : deleting ? 35 : 80;
        const timer = window.setTimeout(() => {
            if (!deleting && count === text.length) setDeleting(true);
            else if (deleting && count === 0) { setDeleting(false); setRole(roles.length ? (role + 1) % roles.length : 0); }
            else setCount(count + (deleting ? -1 : 1));
        }, delay);
        return () => window.clearTimeout(timer);
    }, [roles, role, count, deleting, reducedMotion]);
    const text = (reducedMotion ? roles[0] : roles[role]) || "";
    return <span aria-label={text}><span aria-hidden="true">{reducedMotion ? text : text.slice(0, count)}<span className="typing-cursor" /></span></span>;
}