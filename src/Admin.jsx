import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '/utils/supabase.js';
import {
    assertAdminUser,
    createProject,
    deleteProject,
    loadAdminProjects,
    updateProject,
} from '/utils/admin-projects.js';
import {
    createExperience,
    deleteExperience,
    loadAdminExperiences,
    updateExperience,
} from '/utils/admin-experiences.js';
import {
    AlertCircle,
    ArrowLeft,
    Briefcase,
    Building2,
    CheckCircle2,
    Code2,
    Edit3,
    FolderGit2,
    GitBranch,
    Globe,
    Image as ImageIcon,
    Layers,
    Loader2,
    Lock,
    LogIn,
    LogOut,
    Mail,
    Moon,
    Plus,
    RotateCcw,
    Search,
    Shield,
    ShieldAlert,
    Sparkles,
    Sun,
    Tag,
    Trash2,
} from 'lucide-react';
import './Admin.css';

const emptyProject = {
    github_id: '',
    name: '',
    description: '',
    repo_url: '',
    demo_url: '',
    image_url: '',
    language: '',
    is_freelance: false,
    documentations: '',
};

const emptyExperience = {
    experienceid: '',
    title: '',
    job_title: '',
    details: '',
};

function getErrorMessage(error) {
    return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function Admin() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
    const [accessLoading, setAccessLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState('projects');

    // Projects state
    const [projects, setProjects] = useState([]);
    const [projectForm, setProjectForm] = useState(emptyProject);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [searchProjectQuery, setSearchProjectQuery] = useState('');
    const [imagePreviewError, setImagePreviewError] = useState(false);

    // Experiences state
    const [experiences, setExperiences] = useState([]);
    const [experienceForm, setExperienceForm] = useState(emptyExperience);
    const [editingExperienceId, setEditingExperienceId] = useState(null);
    const [searchExperienceQuery, setSearchExperienceQuery] = useState('');

    // Shared UI state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState(isSupabaseConfigured
        ? ''
        : 'Supabase is not configured. Add the project URL and publishable key to .env.local.');

    const [theme, setTheme] = useState(() => {
        try {
            const savedTheme = window.localStorage.getItem('portfolio-theme');
            if (savedTheme === 'light' || savedTheme === 'dark') {
                return savedTheme;
            }
        } catch {
            // System preference fallback
        }
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        try {
            window.localStorage.setItem('portfolio-theme', theme);
        } catch {
            // Ignore storage errors
        }
    }, [theme]);

    useEffect(() => {
        if (!isSupabaseConfigured || !supabase) {
            return undefined;
        }

        let isActive = true;
        let authEventReceived = false;
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (isActive) {
                authEventReceived = true;
                setUser(session?.user ?? null);
                setAuthLoading(false);
                setMessage('');
                setErrorMessage('');
            }
        });

        supabase.auth.getSession()
            .then(({ data, error }) => {
                if (error) {
                    throw error;
                }
                if (isActive && !authEventReceived) {
                    setUser(data.session?.user ?? null);
                    setAuthLoading(false);
                }
            })
            .catch((error) => {
                if (isActive && !authEventReceived) {
                    setErrorMessage(getErrorMessage(error));
                    setAuthLoading(false);
                }
            });

        return () => {
            isActive = false;
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        let isActive = true;

        async function verifyAdmin() {
            setProjects([]);
            setExperiences([]);
            setIsAdmin(false);
            if (!user || !supabase) {
                setAccessLoading(false);
                return;
            }

            setAccessLoading(true);
            setErrorMessage('');
            try {
                await assertAdminUser(supabase, user.id);
                if (!isActive) {
                    return;
                }
                setIsAdmin(true);

                const [loadedProjects, loadedExperiences] = await Promise.all([
                    loadAdminProjects(supabase).catch(() => []),
                    loadAdminExperiences(supabase).catch(() => []),
                ]);

                if (isActive) {
                    setProjects(loadedProjects);
                    setExperiences(loadedExperiences);
                }
            } catch (error) {
                if (isActive) {
                    setErrorMessage(getErrorMessage(error));
                }
            } finally {
                if (isActive) {
                    setAccessLoading(false);
                }
            }
        }

        verifyAdmin();
        return () => {
            isActive = false;
        };
    }, [user]);

    async function handleSignIn(event) {
        event.preventDefault();
        if (!supabase) {
            return;
        }

        setErrorMessage('');
        setMessage('');
        setIsSaving(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setErrorMessage(getErrorMessage(error));
            }
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSignOut() {
        if (!supabase) {
            return;
        }
        const { error } = await supabase.auth.signOut();
        if (error) {
            setErrorMessage(getErrorMessage(error));
        }
    }

    // Project Form Handlers
    function handleProjectFormChange(event) {
        const { name, value, checked, type } = event.target;
        if (name === 'image_url') {
            setImagePreviewError(false);
        }
        setProjectForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    }

    function startEditingProject(project) {
        setEditingProjectId(project.id);
        setImagePreviewError(false);
        setProjectForm({ ...emptyProject, ...project, github_id: project.github_id?.toString() ?? '' });
        setMessage('');
        setErrorMessage('');
        document.getElementById('project-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function resetProjectForm() {
        setEditingProjectId(null);
        setImagePreviewError(false);
        setProjectForm(emptyProject);
    }

    async function handleSaveProject(event) {
        event.preventDefault();
        if (!supabase || !isAdmin) {
            return;
        }

        setIsSaving(true);
        setErrorMessage('');
        setMessage('');
        try {
            if (editingProjectId) {
                await updateProject(supabase, editingProjectId, projectForm);
                setMessage('Project updated successfully.');
            } else {
                await createProject(supabase, projectForm);
                setMessage('Project created successfully.');
            }
            setProjects(await loadAdminProjects(supabase));
            resetProjectForm();
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteProject(project) {
        if (!supabase || !isAdmin || !window.confirm(`Delete “${project.name}”? This action cannot be undone.`)) {
            return;
        }

        setErrorMessage('');
        setMessage('');
        try {
            await deleteProject(supabase, project.id);
            setProjects(await loadAdminProjects(supabase));
            if (editingProjectId === project.id) {
                resetProjectForm();
            }
            setMessage('Project deleted.');
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        }
    }

    // Experience Form Handlers
    function handleExperienceFormChange(event) {
        const { name, value } = event.target;
        setExperienceForm((current) => ({ ...current, [name]: value }));
    }

    function startEditingExperience(exp) {
        const targetId = exp.experienceid ?? exp.id;
        setEditingExperienceId(targetId);
        setExperienceForm({
            experienceid: targetId !== undefined && targetId !== null ? String(targetId) : '',
            title: exp.title ?? '',
            job_title: exp.job_title ?? exp.role ?? '',
            details: exp.details ?? exp.description ?? '',
        });
        setMessage('');
        setErrorMessage('');
        document.getElementById('experience-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function resetExperienceForm() {
        setEditingExperienceId(null);
        setExperienceForm(emptyExperience);
    }

    async function handleSaveExperience(event) {
        event.preventDefault();
        if (!supabase || !isAdmin) {
            return;
        }

        setIsSaving(true);
        setErrorMessage('');
        setMessage('');
        try {
            if (editingExperienceId) {
                await updateExperience(supabase, editingExperienceId, experienceForm);
                setMessage('Experience updated successfully.');
            } else {
                await createExperience(supabase, experienceForm);
                setMessage('Experience created successfully.');
            }
            setExperiences(await loadAdminExperiences(supabase));
            resetExperienceForm();
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteExperience(exp) {
        const targetId = exp.experienceid ?? exp.id;
        if (!supabase || !isAdmin || !window.confirm(`Delete experience “${exp.title}”? This action cannot be undone.`)) {
            return;
        }

        setErrorMessage('');
        setMessage('');
        try {
            await deleteExperience(supabase, targetId);
            setExperiences(await loadAdminExperiences(supabase));
            if (editingExperienceId === targetId) {
                resetExperienceForm();
            }
            setMessage('Experience deleted.');
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        }
    }

    // Filtered data memoizations
    const filteredProjects = useMemo(() => {
        if (!searchProjectQuery.trim()) {
            return projects;
        }
        const query = searchProjectQuery.toLowerCase();
        return projects.filter((project) =>
            project.name?.toLowerCase().includes(query) ||
            project.language?.toLowerCase().includes(query) ||
            project.description?.toLowerCase().includes(query)
        );
    }, [projects, searchProjectQuery]);

    const filteredExperiences = useMemo(() => {
        if (!searchExperienceQuery.trim()) {
            return experiences;
        }
        const query = searchExperienceQuery.toLowerCase();
        return experiences.filter((exp) =>
            exp.title?.toLowerCase().includes(query) ||
            exp.job_title?.toLowerCase().includes(query) ||
            exp.details?.toLowerCase().includes(query)
        );
    }, [experiences, searchExperienceQuery]);

    const projectStats = useMemo(() => {
        const total = projects.length;
        const freelanceCount = projects.filter((p) => p.is_freelance).length;
        const openSourceCount = total - freelanceCount;
        const languages = new Set(projects.map((p) => p.language).filter(Boolean)).size;
        return { total, freelanceCount, openSourceCount, languages };
    }, [projects]);

    const experienceStats = useMemo(() => {
        const total = experiences.length;
        const uniqueTitles = new Set(experiences.map((e) => e.title).filter(Boolean)).size;
        const uniqueRoles = new Set(experiences.map((e) => e.job_title).filter(Boolean)).size;
        return { total, uniqueTitles, uniqueRoles };
    }, [experiences]);

    return (
        <main className="admin-page">
            <header className="admin-header">
                <div className="admin-header-brand">
                    <a className="admin-back-btn" href="#/" title="Return to portfolio">
                        <ArrowLeft size={18} aria-hidden="true" />
                        <span>Portfolio</span>
                    </a>
                    <div className="admin-badge">
                        <Shield size={14} aria-hidden="true" />
                        <span>Admin Portal</span>
                    </div>
                </div>

                <div className="admin-header-actions">
                    <button
                        type="button"
                        className="admin-theme-btn"
                        onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
                    </button>
                    {user && (
                        <button
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            type="button"
                            onClick={handleSignOut}
                        >
                            <LogOut size={16} aria-hidden="true" />
                            <span>Sign out</span>
                        </button>
                    )}
                </div>
            </header>

            <section className="admin-content" aria-labelledby="admin-title">
                {errorMessage && (
                    <div className="admin-notice admin-error" role="alert">
                        <AlertCircle size={20} className="admin-notice-icon" aria-hidden="true" />
                        <span>{errorMessage}</span>
                    </div>
                )}
                {message && (
                    <div className="admin-notice admin-success" role="status">
                        <CheckCircle2 size={20} className="admin-notice-icon" aria-hidden="true" />
                        <span>{message}</span>
                    </div>
                )}

                {authLoading && (
                    <div className="admin-loading-card" role="status">
                        <Loader2 size={32} className="admin-spin" aria-hidden="true" />
                        <p>Verifying authentication session…</p>
                    </div>
                )}

                {!authLoading && !user && isSupabaseConfigured && (
                    <div className="admin-login-wrapper">
                        <form className="admin-panel admin-login-card" onSubmit={handleSignIn}>
                            <div className="admin-login-header">
                                <div className="admin-icon-shield">
                                    <Lock size={26} aria-hidden="true" />
                                </div>
                                <h1 id="admin-title">Admin Sign In</h1>
                                <p>Authenticate with your administrator credentials to manage portfolio contents.</p>
                            </div>

                            <div className="admin-login-fields">
                                <label className="admin-field">
                                    <span>Email Address</span>
                                    <div className="admin-input-wrapper">
                                        <Mail size={18} className="admin-input-icon" aria-hidden="true" />
                                        <input
                                            autoComplete="email"
                                            type="email"
                                            placeholder="admin@example.com"
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            required
                                        />
                                    </div>
                                </label>

                                <label className="admin-field">
                                    <span>Password</span>
                                    <div className="admin-input-wrapper">
                                        <Lock size={18} className="admin-input-icon" aria-hidden="true" />
                                        <input
                                            autoComplete="current-password"
                                            type="password"
                                            placeholder="••••••••••••"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            required
                                        />
                                    </div>
                                </label>
                            </div>

                            <button className="admin-btn admin-btn-primary admin-btn-block" type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 size={18} className="admin-spin" aria-hidden="true" />
                                        <span>Signing in…</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={18} aria-hidden="true" />
                                        <span>Sign in to Dashboard</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {!authLoading && user && accessLoading && (
                    <div className="admin-loading-card" role="status">
                        <Loader2 size={32} className="admin-spin" aria-hidden="true" />
                        <p>Checking administrator permissions…</p>
                    </div>
                )}

                {!authLoading && user && !accessLoading && !isAdmin && (
                    <div className="admin-restricted-wrapper">
                        <section className="admin-panel admin-restricted-card">
                            <div className="admin-restricted-icon">
                                <ShieldAlert size={40} aria-hidden="true" />
                            </div>
                            <h2>Access Restricted</h2>
                            <p>
                                The account <strong>{user.email}</strong> does not have administrator privileges in the database.
                            </p>
                            <div className="admin-restricted-actions">
                                <button className="admin-btn admin-btn-secondary" type="button" onClick={handleSignOut}>
                                    <LogOut size={16} aria-hidden="true" />
                                    <span>Sign Out</span>
                                </button>
                                <a className="admin-btn admin-btn-ghost" href="#/">
                                    <span>Back to Portfolio</span>
                                </a>
                            </div>
                        </section>
                    </div>
                )}

                {!authLoading && user && isAdmin && (
                    <div className="admin-dashboard">
                        <div className="admin-dashboard-header">
                            <div>
                                <p className="admin-eyebrow">Portfolio Control Center</p>
                                <h1 id="admin-title">Content Dashboard</h1>
                            </div>
                            <div className="admin-user-pill">
                                <div className="admin-user-dot" aria-hidden="true" />
                                <span className="admin-user-email">{user.email}</span>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="admin-tabs" role="tablist" aria-label="Dashboard management sections">
                            <button
                                type="button"
                                role="tab"
                                id="tab-projects"
                                aria-controls="panel-projects"
                                aria-selected={activeTab === 'projects'}
                                className={`admin-tab-btn ${activeTab === 'projects' ? 'admin-tab-active' : ''}`}
                                onClick={() => {
                                    setActiveTab('projects');
                                    setMessage('');
                                    setErrorMessage('');
                                }}
                            >
                                <FolderGit2 size={16} aria-hidden="true" />
                                <span>Projects</span>
                                <span className="admin-tab-badge">{projects.length}</span>
                            </button>
                            <button
                                type="button"
                                role="tab"
                                id="tab-experience"
                                aria-controls="panel-experience"
                                aria-selected={activeTab === 'experience'}
                                className={`admin-tab-btn ${activeTab === 'experience' ? 'admin-tab-active' : ''}`}
                                onClick={() => {
                                    setActiveTab('experience');
                                    setMessage('');
                                    setErrorMessage('');
                                }}
                            >
                                <Briefcase size={16} aria-hidden="true" />
                                <span>Experience</span>
                                <span className="admin-tab-badge">{experiences.length}</span>
                            </button>
                        </div>

                        {/* ========================================================
                            PROJECTS MANAGEMENT TAB
                            ======================================================== */}
                        {activeTab === 'projects' && (
                            <div id="panel-projects" role="tabpanel" aria-labelledby="tab-projects">
                                {/* Metric Overview Cards */}
                                <div className="admin-metrics-grid">
                                    <div className="admin-metric-card">
                                        <div className="admin-metric-icon">
                                            <FolderGit2 size={20} aria-hidden="true" />
                                        </div>
                                        <div className="admin-metric-info">
                                            <span className="admin-metric-value">{projectStats.total}</span>
                                            <span className="admin-metric-label">Total Projects</span>
                                        </div>
                                    </div>
                                    <div className="admin-metric-card">
                                        <div className="admin-metric-icon admin-icon-accent">
                                            <Sparkles size={20} aria-hidden="true" />
                                        </div>
                                        <div className="admin-metric-info">
                                            <span className="admin-metric-value">{projectStats.freelanceCount}</span>
                                            <span className="admin-metric-label">Freelance Works</span>
                                        </div>
                                    </div>
                                    <div className="admin-metric-card">
                                        <div className="admin-metric-icon">
                                            <Code2 size={20} aria-hidden="true" />
                                        </div>
                                        <div className="admin-metric-info">
                                            <span className="admin-metric-value">{projectStats.languages}</span>
                                            <span className="admin-metric-label">Tech Stacks</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Project Editor Form */}
                                <form id="project-editor" className="admin-panel project-editor-panel" onSubmit={handleSaveProject}>
                                    <div className="admin-panel-heading">
                                        <div>
                                            <div className="admin-editor-status">
                                                <span className={`admin-status-dot ${editingProjectId ? 'admin-status-edit' : 'admin-status-new'}`} />
                                                <span className="admin-eyebrow">{editingProjectId ? 'Edit Mode' : 'New Entry'}</span>
                                            </div>
                                            <h2>{editingProjectId ? 'Update Project' : 'Add New Project'}</h2>
                                        </div>
                                        <div className="admin-editor-actions">
                                            {editingProjectId && (
                                                <button className="admin-btn admin-btn-secondary admin-btn-sm" type="button" onClick={resetProjectForm}>
                                                    <RotateCcw size={15} aria-hidden="true" />
                                                    <span>Cancel Edit</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="admin-form-sections">
                                        <div className="admin-form-grid">
                                            <label className="admin-field">
                                                <span>Project Name <span className="admin-required" aria-hidden="true">*</span></span>
                                                <div className="admin-input-wrapper">
                                                    <FolderGit2 size={16} className="admin-input-icon" aria-hidden="true" />
                                                    <input
                                                        name="name"
                                                        placeholder="e.g. PERN Portfolio Platform"
                                                        value={projectForm.name}
                                                        onChange={handleProjectFormChange}
                                                        required
                                                        maxLength={200}
                                                    />
                                                </div>
                                            </label>

                                            <label className="admin-field">
                                                <span>Primary Tech / Language</span>
                                                <div className="admin-input-wrapper">
                                                    <Tag size={16} className="admin-input-icon" aria-hidden="true" />
                                                    <input
                                                        name="language"
                                                        placeholder="e.g. React, PostgreSQL, Tailwind"
                                                        value={projectForm.language ?? ''}
                                                        onChange={handleProjectFormChange}
                                                    />
                                                </div>
                                            </label>

                                            <label className="admin-field">
                                                <span>Repository URL</span>
                                                <div className="admin-input-wrapper">
                                                    <GitBranch size={16} className="admin-input-icon" aria-hidden="true" />
                                                    <input
                                                        name="repo_url"
                                                        type="url"
                                                        placeholder="https://github.com/..."
                                                        value={projectForm.repo_url ?? ''}
                                                        onChange={handleProjectFormChange}
                                                    />
                                                </div>
                                            </label>

                                            <label className="admin-field">
                                                <span>Live Demo URL</span>
                                                <div className="admin-input-wrapper">
                                                    <Globe size={16} className="admin-input-icon" aria-hidden="true" />
                                                    <input
                                                        name="demo_url"
                                                        type="url"
                                                        placeholder="https://example.com"
                                                        value={projectForm.demo_url ?? ''}
                                                        onChange={handleProjectFormChange}
                                                    />
                                                </div>
                                            </label>

                                            <label className="admin-field">
                                                <span>GitHub Repo ID (Numeric)</span>
                                                <div className="admin-input-wrapper">
                                                    <Code2 size={16} className="admin-input-icon" aria-hidden="true" />
                                                    <input
                                                        name="github_id"
                                                        inputMode="numeric"
                                                        placeholder="e.g. 123456789"
                                                        value={projectForm.github_id ?? ''}
                                                        onChange={handleProjectFormChange}
                                                    />
                                                </div>
                                            </label>

                                            <label className="admin-field">
                                                <span>Screenshot / Image URL</span>
                                                <div className="admin-input-wrapper">
                                                    <ImageIcon size={16} className="admin-input-icon" aria-hidden="true" />
                                                    <input
                                                        name="image_url"
                                                        type="url"
                                                        placeholder="https://images.unsplash.com/..."
                                                        value={projectForm.image_url ?? ''}
                                                        onChange={handleProjectFormChange}
                                                    />
                                                </div>
                                            </label>

                                            <label className="admin-field admin-field-wide">
                                                <span>Description</span>
                                                <textarea
                                                    name="description"
                                                    rows="3"
                                                    placeholder="Brief overview of features, architecture, and purpose..."
                                                    value={projectForm.description ?? ''}
                                                    onChange={handleProjectFormChange}
                                                />
                                            </label>

                                            <label className="admin-field admin-field-wide">
                                                <span>Documentation / Additional Links</span>
                                                <textarea
                                                    name="documentations"
                                                    rows="2"
                                                    placeholder="Links to design specs, API documentation, or deployment notes..."
                                                    value={projectForm.documentations ?? ''}
                                                    onChange={handleProjectFormChange}
                                                />
                                            </label>
                                        </div>

                                        {projectForm.image_url && !imagePreviewError && (
                                            <div className="admin-image-preview-box">
                                                <span className="admin-preview-label">Image Preview:</span>
                                                <div className="admin-preview-frame">
                                                    <img
                                                        src={projectForm.image_url}
                                                        alt="Project preview thumbnail"
                                                        onError={() => setImagePreviewError(true)}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="admin-form-footer">
                                            <label className="admin-toggle-switch">
                                                <input
                                                    name="is_freelance"
                                                    type="checkbox"
                                                    checked={Boolean(projectForm.is_freelance)}
                                                    onChange={handleProjectFormChange}
                                                />
                                                <span className="admin-toggle-slider" />
                                                <span className="admin-toggle-text">Freelance / Client Project</span>
                                            </label>

                                            <div className="admin-form-submit-actions">
                                                <button className="admin-btn admin-btn-primary" type="submit" disabled={isSaving}>
                                                    {isSaving ? (
                                                        <>
                                                            <Loader2 size={16} className="admin-spin" aria-hidden="true" />
                                                            <span>Saving…</span>
                                                        </>
                                                    ) : editingProjectId ? (
                                                        <>
                                                            <CheckCircle2 size={16} aria-hidden="true" />
                                                            <span>Save Changes</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus size={16} aria-hidden="true" />
                                                            <span>Create Project</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>

                                {/* Projects Repository Section */}
                                <section className="admin-projects-section" aria-labelledby="project-list-title">
                                    <div className="admin-section-header">
                                        <div>
                                            <p className="admin-eyebrow">{projects.length} Total Projects</p>
                                            <h2 id="project-list-title">Managed Projects</h2>
                                        </div>

                                        {projects.length > 0 && (
                                            <div className="admin-search-wrapper">
                                                <Search size={16} className="admin-search-icon" aria-hidden="true" />
                                                <input
                                                    type="text"
                                                    placeholder="Search projects by name, tag, or description…"
                                                    value={searchProjectQuery}
                                                    onChange={(e) => setSearchProjectQuery(e.target.value)}
                                                    className="admin-search-input"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {projects.length === 0 ? (
                                        <div className="admin-panel admin-empty-state">
                                            <FolderGit2 size={48} className="admin-empty-icon" aria-hidden="true" />
                                            <h3>No projects in database</h3>
                                            <p>Your Supabase project list is empty. Add your first project using the form above.</p>
                                        </div>
                                    ) : filteredProjects.length === 0 ? (
                                        <div className="admin-panel admin-empty-state">
                                            <Search size={36} className="admin-empty-icon" aria-hidden="true" />
                                            <h3>No matching projects</h3>
                                            <p>No project records matched “{searchProjectQuery}”. Try clearing your search.</p>
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-secondary admin-btn-sm"
                                                onClick={() => setSearchProjectQuery('')}
                                            >
                                                Clear Search
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="admin-project-grid">
                                            {filteredProjects.map((project) => (
                                                <article className="admin-project-card" key={project.id}>
                                                    <div className="admin-card-header">
                                                        <div className="admin-card-badges">
                                                            {project.language && (
                                                                <span className="admin-tag-badge">
                                                                    <Tag size={12} aria-hidden="true" />
                                                                    {project.language}
                                                                </span>
                                                            )}
                                                            {project.is_freelance && (
                                                                <span className="admin-freelance-badge">
                                                                    <Sparkles size={12} aria-hidden="true" />
                                                                    Freelance
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="admin-card-controls">
                                                            <button
                                                                className="admin-btn-icon"
                                                                type="button"
                                                                onClick={() => startEditingProject(project)}
                                                                title="Edit project"
                                                                aria-label={`Edit ${project.name}`}
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button
                                                                className="admin-btn-icon admin-btn-danger-icon"
                                                                type="button"
                                                                onClick={() => handleDeleteProject(project)}
                                                                title="Delete project"
                                                                aria-label={`Delete ${project.name}`}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="admin-card-body">
                                                        <h3 className="admin-card-title">{project.name}</h3>
                                                        <p className="admin-card-desc">
                                                            {project.description || 'No description provided.'}
                                                        </p>
                                                    </div>

                                                    <div className="admin-card-footer">
                                                        <div className="admin-card-links">
                                                            {project.repo_url && (
                                                                <a
                                                                    href={project.repo_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="admin-link-pill"
                                                                    title="View Repository"
                                                                >
                                                                    <GitBranch size={14} aria-hidden="true" />
                                                                    <span>Code</span>
                                                                </a>
                                                            )}
                                                            {project.demo_url && (
                                                                <a
                                                                    href={project.demo_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="admin-link-pill"
                                                                    title="Open Live Preview"
                                                                >
                                                                    <Globe size={14} aria-hidden="true" />
                                                                    <span>Demo</span>
                                                                </a>
                                                            )}
                                                        </div>

                                                        {project.github_id && (
                                                            <span className="admin-id-tag">ID: {project.github_id}</span>
                                                        )}
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}

                        {/* ========================================================
                            EXPERIENCE MANAGEMENT TAB
                            ======================================================== */}
                        {activeTab === 'experience' && (
                            <div id="panel-experience" role="tabpanel" aria-labelledby="tab-experience">
                                {/* Metric Overview Cards */}
                                <div className="admin-metrics-grid">
                                    <div className="admin-metric-card">
                                        <div className="admin-metric-icon">
                                            <Briefcase size={20} aria-hidden="true" />
                                        </div>
                                        <div className="admin-metric-info">
                                            <span className="admin-metric-value">{experienceStats.total}</span>
                                            <span className="admin-metric-label">Total Positions</span>
                                        </div>
                                    </div>
                                    <div className="admin-metric-card">
                                        <div className="admin-metric-icon admin-icon-accent">
                                            <Building2 size={20} aria-hidden="true" />
                                        </div>
                                        <div className="admin-metric-info">
                                            <span className="admin-metric-value">{experienceStats.uniqueTitles}</span>
                                            <span className="admin-metric-label">Domains & Tracks</span>
                                        </div>
                                    </div>
                                    <div className="admin-metric-card">
                                        <div className="admin-metric-icon">
                                            <Layers size={20} aria-hidden="true" />
                                        </div>
                                        <div className="admin-metric-info">
                                            <span className="admin-metric-value">{experienceStats.uniqueRoles}</span>
                                            <span className="admin-metric-label">Specializations</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Experience Editor Form */}
                                <form id="experience-editor" className="admin-panel project-editor-panel" onSubmit={handleSaveExperience}>
                                    <div className="admin-panel-heading">
                                        <div>
                                            <div className="admin-editor-status">
                                                <span className={`admin-status-dot ${editingExperienceId ? 'admin-status-edit' : 'admin-status-new'}`} />
                                                <span className="admin-eyebrow">{editingExperienceId ? 'Edit Mode' : 'New Entry'}</span>
                                            </div>
                                            <h2>{editingExperienceId ? 'Update Experience' : 'Add New Experience'}</h2>
                                        </div>
                                        <div className="admin-editor-actions">
                                            {editingExperienceId && (
                                                <button className="admin-btn admin-btn-secondary admin-btn-sm" type="button" onClick={resetExperienceForm}>
                                                    <RotateCcw size={15} aria-hidden="true" />
                                                    <span>Cancel Edit</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="admin-form-sections">
                                        <div className="admin-form-grid">
                                            <label className="admin-field">
                                                <span>Title / Domain <span className="admin-required" aria-hidden="true">*</span></span>
                                                <div className="admin-input-wrapper">
                                                    <Building2 size={16} className="admin-input-icon" aria-hidden="true" />
                                                    <input
                                                        name="title"
                                                        placeholder="e.g. Web Development or Tech Corp"
                                                        value={experienceForm.title}
                                                        onChange={handleExperienceFormChange}
                                                        required
                                                        maxLength={200}
                                                    />
                                                </div>
                                            </label>

                                            <label className="admin-field">
                                                <span>Job Title / Role <span className="admin-required" aria-hidden="true">*</span></span>
                                                <div className="admin-input-wrapper">
                                                    <Briefcase size={16} className="admin-input-icon" aria-hidden="true" />
                                                    <input
                                                        name="job_title"
                                                        placeholder="e.g. Frontend & Backend Developer"
                                                        value={experienceForm.job_title}
                                                        onChange={handleExperienceFormChange}
                                                        required
                                                        maxLength={200}
                                                    />
                                                </div>
                                            </label>

                                            <label className="admin-field">
                                                <span>Display Order / ID (Optional)</span>
                                                <div className="admin-input-wrapper">
                                                    <Code2 size={16} className="admin-input-icon" aria-hidden="true" />
                                                    <input
                                                        name="experienceid"
                                                        inputMode="numeric"
                                                        placeholder="e.g. 1 (auto-assigned if left blank)"
                                                        value={experienceForm.experienceid}
                                                        onChange={handleExperienceFormChange}
                                                    />
                                                </div>
                                            </label>

                                            <label className="admin-field admin-field-wide">
                                                <span>Details & Description <span className="admin-required" aria-hidden="true">*</span></span>
                                                <textarea
                                                    name="details"
                                                    rows="4"
                                                    placeholder="Detailed breakdown of responsibilities, technologies utilized, systems engineered, and accomplishments..."
                                                    value={experienceForm.details}
                                                    onChange={handleExperienceFormChange}
                                                    required
                                                />
                                            </label>
                                        </div>

                                        <div className="admin-form-footer">
                                            <div className="admin-form-hint">
                                                <span>Entries automatically appear in the portfolio Experience section.</span>
                                            </div>

                                            <div className="admin-form-submit-actions">
                                                <button className="admin-btn admin-btn-primary" type="submit" disabled={isSaving}>
                                                    {isSaving ? (
                                                        <>
                                                            <Loader2 size={16} className="admin-spin" aria-hidden="true" />
                                                            <span>Saving…</span>
                                                        </>
                                                    ) : editingExperienceId ? (
                                                        <>
                                                            <CheckCircle2 size={16} aria-hidden="true" />
                                                            <span>Save Changes</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus size={16} aria-hidden="true" />
                                                            <span>Create Experience</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>

                                {/* Experience List Section */}
                                <section className="admin-projects-section" aria-labelledby="experience-list-title">
                                    <div className="admin-section-header">
                                        <div>
                                            <p className="admin-eyebrow">{experiences.length} Total Entries</p>
                                            <h2 id="experience-list-title">Managed Experience</h2>
                                        </div>

                                        {experiences.length > 0 && (
                                            <div className="admin-search-wrapper">
                                                <Search size={16} className="admin-search-icon" aria-hidden="true" />
                                                <input
                                                    type="text"
                                                    placeholder="Search experience by title, role, or description…"
                                                    value={searchExperienceQuery}
                                                    onChange={(e) => setSearchExperienceQuery(e.target.value)}
                                                    className="admin-search-input"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {experiences.length === 0 ? (
                                        <div className="admin-panel admin-empty-state">
                                            <Briefcase size={48} className="admin-empty-icon" aria-hidden="true" />
                                            <h3>No experience entries in database</h3>
                                            <p>Your Supabase experience table is empty. Create your first work experience entry above.</p>
                                        </div>
                                    ) : filteredExperiences.length === 0 ? (
                                        <div className="admin-panel admin-empty-state">
                                            <Search size={36} className="admin-empty-icon" aria-hidden="true" />
                                            <h3>No matching experience entries</h3>
                                            <p>No records matched “{searchExperienceQuery}”. Try clearing your search.</p>
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-secondary admin-btn-sm"
                                                onClick={() => setSearchExperienceQuery('')}
                                            >
                                                Clear Search
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="admin-experience-grid">
                                            {filteredExperiences.map((exp, index) => {
                                                const id = exp.experienceid ?? exp.id;
                                                const expNumber = String(index + 1).padStart(2, '0');

                                                return (
                                                    <article className="admin-project-card admin-experience-card" key={id ?? index}>
                                                        <div className="admin-card-header">
                                                            <div className="admin-card-badges">
                                                                <span className="admin-tag-badge">
                                                                    <Tag size={12} aria-hidden="true" />
                                                                    #{expNumber}
                                                                </span>
                                                                {id !== undefined && id !== null && (
                                                                    <span className="admin-id-tag">ID: {id}</span>
                                                                )}
                                                            </div>
                                                            <div className="admin-card-controls">
                                                                <button
                                                                    className="admin-btn-icon"
                                                                    type="button"
                                                                    onClick={() => startEditingExperience(exp)}
                                                                    title="Edit experience"
                                                                    aria-label={`Edit ${exp.title}`}
                                                                >
                                                                    <Edit3 size={16} />
                                                                </button>
                                                                <button
                                                                    className="admin-btn-icon admin-btn-danger-icon"
                                                                    type="button"
                                                                    onClick={() => handleDeleteExperience(exp)}
                                                                    title="Delete experience"
                                                                    aria-label={`Delete ${exp.title}`}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="admin-card-body">
                                                            <h3 className="admin-card-title">{exp.title}</h3>
                                                            <div className="admin-experience-role">
                                                                <Briefcase size={14} aria-hidden="true" />
                                                                <span>{exp.job_title}</span>
                                                            </div>
                                                            <p className="admin-card-desc" style={{ whiteSpace: 'pre-line' }}>
                                                                {exp.details || 'No details provided.'}
                                                            </p>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}
