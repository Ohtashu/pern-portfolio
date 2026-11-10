export const defaultPortfolioSettings = {
    name: '',
    intro: '',
    bio: ['', ''],
    roles: [],
    skills: [],
    toolbox: [],
    location: '',
    focus: '',
    education: '',
    email: '',
    social_links: [],
    cv_url: '',
};

function normalizeSettings(input = {}) {
    const result = {};
    for (const [key, fallback] of Object.entries(defaultPortfolioSettings)) {
        const value = input[key];
        if (Array.isArray(fallback)) {
            const valid = Array.isArray(value) && (key === 'social_links'
                ? value.every((item) => item && typeof item.label === 'string' && typeof item.url === 'string' && isHttpUrl(item.url))
                : value.every((item) => typeof item === 'string') && (key !== 'bio' || value.length === 2));
            result[key] = structuredClone(valid ? value : fallback);
        } else {
            result[key] = typeof value === 'string' && (key !== 'cv_url' || !value || isHttpUrl(value)) ? value : fallback;
        }
    }
    return result;
}

function isHttpUrl(value) {
    try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

function validateSettings(settings) {
    for (const key of ['bio', 'roles', 'skills', 'toolbox']) {
        if (!Array.isArray(settings[key]) || settings[key].some((item) => typeof item !== 'string')) {
            throw new Error(`${key} must be a list of text values.`);
        }
    }
    if (settings.bio.length !== 2) throw new Error('Exactly two bio paragraphs are required.');
    for (const key of ['name', 'intro', 'location', 'focus', 'education', 'email', 'cv_url']) {
        if (typeof settings[key] !== 'string') throw new Error(`${key} must be text.`);
    }
    if (settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) throw new Error('Enter a valid contact email.');
    if (settings.cv_url && !isHttpUrl(settings.cv_url)) throw new Error('CV URL must be an HTTP(S) URL.');
    if (!Array.isArray(settings.social_links) || settings.social_links.some((link) =>
        !link || typeof link.label !== 'string' || !link.label.trim() || typeof link.url !== 'string' || !isHttpUrl(link.url))) {
        throw new Error('Each social link needs a label and an HTTP(S) URL.');
    }
}

export async function readPortfolioSettings(supabase, { throwOnError = false } = {}) {
    try {
        if (!supabase) throw new Error('Supabase is not configured.');
        const { data, error } = await supabase.from('portfolio_settings').select('*').eq('id', 1).maybeSingle();
        if (error) throw error;
        return normalizeSettings(data ?? {});
    } catch (error) {
        if (throwOnError) throw error;
        return normalizeSettings();
    }
}

export async function writePortfolioSettings(supabase, settings) {
    if (!supabase) throw new Error('Supabase is not configured.');
    validateSettings(settings);
    const payload = { ...normalizeSettings(settings), id: 1, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('portfolio_settings').upsert(payload).select('*').single();
    if (error) throw error;
    if (!data) throw new Error('Supabase did not return the saved settings.');
    return normalizeSettings(data);
}