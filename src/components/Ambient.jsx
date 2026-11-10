import { useEffect, useRef, useState } from "react";

const bootLines = [
    "> BOOT SEQUENCE INITIATED",
    "> LOADING INTERFACE MODULES ........ OK",
    "> MOUNTING PORTFOLIO DATA .......... OK",
    "> CALIBRATING DISPLAY .............. OK",
    "> WELCOME, VISITOR.",
];

export function AmbientBackground({ reducedMotion = false }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (reducedMotion) return;
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!context) return;

        let width = 0;
        let height = 0;
        let squares = [];
        let frame = null;
        let lastTime = null;
        let pointerX = 0;
        let pointerY = 0;

        const draw = (time) => {
            frame = null;
            const elapsed = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.05);
            lastTime = time;
            context.clearRect(0, 0, width, height);
            for (const square of squares) {
                if (!reducedMotion) {
                    square.y -= square.speed * elapsed;
                    if (square.y < -square.size) square.y = height + square.size;
                }
                const x = square.x + pointerX * square.depth;
                const y = square.y + pointerY * square.depth;
                context.strokeStyle = `rgba(61, 58, 50, ${square.opacity})`;
                context.fillStyle = context.strokeStyle;
                if (square.filled) context.fillRect(x, y, square.size, square.size);
                else context.strokeRect(x, y, square.size, square.size);
            }
            if (!reducedMotion && !document.hidden) frame = requestAnimationFrame(draw);
        };

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            const count = Math.max(14, Math.min(54, Math.round(width * height / 30000)));
            squares = Array.from({ length: count }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                size: 2 + Math.random() * 6,
                speed: 5 + Math.random() * 12,
                opacity: 0.07 + Math.random() * 0.2,
                filled: Math.random() > 0.5,
                depth: 4 + Math.random() * 12,
            }));
            if (frame !== null) cancelAnimationFrame(frame);
            frame = null;
            lastTime = null;
            if (!document.hidden) draw(0);
        };

        const movePointer = (event) => {
            pointerX = (event.clientX / Math.max(width, 1) - 0.5) * 2;
            pointerY = (event.clientY / Math.max(height, 1) - 0.5) * 2;
        };
        const resetPointer = () => {
            pointerX = 0;
            pointerY = 0;
        };
        const visibilityChange = () => {
            if (document.hidden) {
                if (frame !== null) cancelAnimationFrame(frame);
                frame = null;
                lastTime = null;
            } else if (frame === null) {
                draw(0);
            }
        };

        resize();
        window.addEventListener("resize", resize);
        document.addEventListener("visibilitychange", visibilityChange);
        if (!reducedMotion) {
            window.addEventListener("pointermove", movePointer);
            window.addEventListener("pointerleave", resetPointer);
        }
        return () => {
            if (frame !== null) cancelAnimationFrame(frame);
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", visibilityChange);
            window.removeEventListener("pointermove", movePointer);
            window.removeEventListener("pointerleave", resetPointer);
        };
    }, [reducedMotion]);

    const layerStyle = { position: "absolute", inset: 0, animation: reducedMotion ? "none" : undefined };
    return (
        <div className={`ambient${reducedMotion ? " ambient--reduced-motion" : ""}`} aria-hidden="true"
            style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div className="ambient__grid background-grid" style={layerStyle} />
            {!reducedMotion && <canvas ref={canvasRef} className="ambient__canvas background-canvas" style={{ ...layerStyle, width: "100%", height: "100%" }} />}
            <div className="ambient__vignette background-vignette" style={layerStyle} />
            <div className="ambient__sweep background-sweep" style={layerStyle} />
        </div>
    );
}

export function BootOverlay({ reducedMotion = false, onComplete }) {
    const [characters, setCharacters] = useState(0);
    const [exiting, setExiting] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const completeRef = useRef(onComplete);
    const finishedRef = useRef(false);
    const total = bootLines.join("").length;

    useEffect(() => {
        completeRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        if (dismissed || exiting || reducedMotion) return;
        const onKeyDown = (event) => {
            if (event.key === "Escape") setExiting(true);
        };
        window.addEventListener("keydown", onKeyDown);
        let preceding = 0;
        const line = bootLines.find((item) => {
            if (characters < preceding + item.length) return true;
            preceding += item.length;
            return false;
        });
        const atLineStart = characters > 0 && characters === preceding;
        const timer = window.setTimeout(() => {
            if (!line) setExiting(true);
            else setCharacters(Math.min(characters + 2, preceding + line.length));
        }, !line || atLineStart ? 150 : 12);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [characters, dismissed, exiting, reducedMotion]);

    useEffect(() => {
        if (!reducedMotion && !exiting) return;
        const finish = () => {
            if (finishedRef.current) return;
            finishedRef.current = true;
            setDismissed(true);
            completeRef.current?.();
        };
        if (reducedMotion) {
            finish();
            return;
        }
        const timer = window.setTimeout(finish, 700);
        return () => window.clearTimeout(timer);
    }, [exiting, reducedMotion]);

    if (dismissed || reducedMotion) return null;
    const visibleLines = bootLines.map((line, index) => {
        const preceding = bootLines.slice(0, index).join("").length;
        return line.slice(0, Math.max(0, characters - preceding));
    });
    const progress = Math.round(characters / total * 100);

    return (
        <div className={`boot boot-overlay${exiting ? " is-complete" : ""}`}
            style={{ position: "fixed", inset: 0, zIndex: 1000, transform: exiting ? "translateY(-100%)" : "translateY(0)", transition: "transform .7s ease", pointerEvents: exiting ? "none" : undefined }}>
            <div className="boot-overlay__content">
                <div className="boot-overlay__lines" aria-label="Loading interface" style={{ whiteSpace: "pre-wrap" }}>
                    {visibleLines.map((line, index) => <div className="boot-overlay__line" key={bootLines[index]}>{line}</div>)}
                </div>
                <progress className="boot-overlay__progress" max="100" value={progress} aria-label="Loading progress" />
                <span className="boot-overlay__percentage">{progress}%</span>
                <button className="boot-overlay__skip boot-skip" type="button" onClick={() => setExiting(true)} disabled={exiting}>Skip</button>
            </div>
        </div>
    );
}