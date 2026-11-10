// React hooks let us access the dialog element and manage its lifecycle.
import { useEffect, useRef } from "react";

// The parent supplies the selected project, a close callback, and a URL validator.
export default function PopupModal({ project, onClose, getSafeProjectUrl }) {
    // Keep a reference to the browser's dialog element.
    const dialogRef = useRef(null);

    // Open the dialog when this component mounts and close it when it unmounts.
    // The empty dependency array means this effect does not rerun on updates.
    useEffect(() => {
        const dialog = dialogRef.current;
        dialog.showModal();
        return () => dialog.close();
    }, []);

    // Accept only safe HTTP(S) URLs; invalid or missing URLs become null.
    const demoUrl = getSafeProjectUrl(project.demo_url);
    const repoUrl = getSafeProjectUrl(project.repo_url);
    const imageUrl = getSafeProjectUrl(project.image_url);

    // Render a native dialog labelled for screen readers. Escape calls the parent
    // close callback so its selected-project state is cleared.
    return (
        <dialog
            ref={dialogRef}
            className="project-modal"
            aria-labelledby="project-modal-title"
            onCancel={(event) => { event.preventDefault(); onClose(); }}
            onClick={(event) => {
                // Close only when the dialog backdrop is clicked, not its content.
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="project-modal-content">
                {/* Focus the accessible close button when the modal opens. */}
                <button className="project-modal-close" type="button" onClick={onClose} aria-label="Close project details" autoFocus>×</button>
                <p className="eyebrow">Project details</p>
                {/* Show a fallback title and description when project data is missing. */}
                <h2 id="project-modal-title">{project.name || "Untitled project"}</h2>
                {/* Only show a validated image; empty alt text marks it as decorative. */}
                {imageUrl && <img className="project-modal-image" src={imageUrl} alt="" />}
                <p className="project-modal-description">{project.description || "No description provided."}</p>
                {/* Language and documentation are optional project details. */}
                {project.language && <div className="tag-list"><span>{project.language}</span></div>}
                {project.documentations && (
                    <div className="project-modal-documentation">
                        <h3>Documentation</h3>
                        <p>{project.documentations}</p>
                    </div>
                )}
                {/* Show available validated links in new tabs without sending referrer information. */}
                {(demoUrl || repoUrl) && (
                    <div className="project-modal-links">
                        {demoUrl && <a href={demoUrl} target="_blank" rel="noreferrer">View live project ↗</a>}
                        {repoUrl && <a href={repoUrl} target="_blank" rel="noreferrer">View repository ↗</a>}
                    </div>
                )}
            </div>
        </dialog>
    );
}