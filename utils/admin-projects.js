export const projectFields = [
    'github_id',
    'name',
    'description',
    'repo_url',
    'demo_url',
    'image_url',
    'language',
    'is_freelance',
    'documentations',
];

export const projectSelect = `id,${projectFields.join(',')},updated_at`;

function normalizeOptionalUrl(value, fieldName) {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
        return null;
    }

    try {
        const url = new URL(trimmed);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            return url.href;
        }
    } catch {
        // The value is rejected below when it is not an absolute HTTP(S) URL.
    }

    throw new Error(`${fieldName} must be a valid HTTP or HTTPS URL.`);
}

export function normalizeProjectInput(input) {
    const name = input.name?.trim() ?? '';
    if (!name) {
        throw new Error('Project name is required.');
    }

    const githubId = input.github_id?.trim() ?? '';
    if (githubId && (!/^\d+$/.test(githubId) || BigInt(githubId) <= 0n || BigInt(githubId) > 9223372036854775807n)) {
        throw new Error('GitHub ID must be a positive whole number.');
    }

    return {
        github_id: githubId || null,
        name,
        description: input.description?.trim() || null,
        repo_url: normalizeOptionalUrl(input.repo_url, 'Repository URL'),
        demo_url: normalizeOptionalUrl(input.demo_url, 'Demo URL'),
        image_url: normalizeOptionalUrl(input.image_url, 'Image URL'),
        language: input.language?.trim() || null,
        is_freelance: Boolean(input.is_freelance),
        documentations: input.documentations?.trim() || null,
    };
}

export async function assertAdminUser(supabase, userId) {
    const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        throw error;
    }
    if (!data) {
        throw new Error('Admin access is not enabled for this account.');
    }

    return true;
}

export async function loadAdminProjects(supabase) {
    const { data, error } = await supabase
        .from('projects')
        .select(projectSelect)
        .order('updated_at', { ascending: false, nullsFirst: false });

    if (error) {
        throw error;
    }

    return data ?? [];
}

export async function createProject(supabase, input) {
    const { data, error } = await supabase
        .from('projects')
        .insert(normalizeProjectInput(input))
        .select(projectSelect)
        .single();

    if (error) {
        throw error;
    }
    if (!data) {
        throw new Error('Supabase did not return the created project.');
    }

    return data;
}

export async function updateProject(supabase, projectId, input) {
    const { data, error } = await supabase
        .from('projects')
        .update(normalizeProjectInput(input))
        .eq('id', projectId)
        .select(projectSelect)
        .maybeSingle();

    if (error) {
        throw error;
    }
    if (!data) {
        throw new Error('Project was not updated. Check access policies or confirm it still exists.');
    }

    return data;
}

export async function deleteProject(supabase, projectId) {
    const { data, error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .select('id')
        .maybeSingle();

    if (error) {
        throw error;
    }
    if (!data) {
        throw new Error('Project was not deleted. Check access policies or confirm it still exists.');
    }
}