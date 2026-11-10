import { useEffect, useRef, useState } from "react";

export function useReducedMotion() {
    const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReduced(media.matches);
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);
    return reduced;
}

export function useInView() {
    const ref = useRef(null);
    const [visible, setVisible] = useState(() => !window.IntersectionObserver);
    useEffect(() => {
        const node = ref.current;
        if (!node || !window.IntersectionObserver) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.1 });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);
    return [ref, visible];
}