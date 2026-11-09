export const experienceFields = [
    'experienceid',
    'title',
    'job_title',
    'details',
];

export const experienceSelect = `experienceid,title,job_title,details`;

export function normalizeExperienceInput(input) {
    const title = input.title?.trim() ?? '';
    if (!title) {
        throw new Error('Experience title / company is required.');
    }

    const jobTitle = (input.job_title ?? input.role)?.trim() ?? '';
    if (!jobTitle) {
        throw new Error('Job title / role is required.');
    }

    const details = (input.details ?? input.description)?.trim() ?? '';
    if (!details) {
        throw new Error('Experience details / description is required.');
    }

    let experienceId = null;
    const rawId = input.experienceid ?? input.id;
    if (rawId !== undefined && rawId !== null && rawId !== '') {
        const idStr = String(rawId).trim();
        if (!/^\d+$/.test(idStr) || Number(idStr) <= 0) {
            throw new Error('Experience ID must be a positive integer.');
        }
        experienceId = parseInt(idStr, 10);
    }

    const normalized = {
        title,
        job_title: jobTitle,
        details,
    };

    if (experienceId !== null) {
        normalized.experienceid = experienceId;
    }

    return normalized;
}

export async function loadAdminExperiences(supabase) {
    const { data, error } = await supabase
        .from('experience')
        .select('*')
        .order('experienceid', { ascending: true });

    if (error) {
        throw error;
    }

    return (data ?? []).map((item) => ({
        experienceid: item.experienceid ?? item.id,
        id: item.experienceid ?? item.id,
        title: item.title ?? '',
        job_title: item.job_title ?? item.role ?? '',
        details: item.details ?? item.description ?? '',
    }));
}

export async function createExperience(supabase, input) {
    const payload = normalizeExperienceInput(input);

    // If experienceid is not specified, determine the next available positive integer ID
    if (payload.experienceid === undefined) {
        const { data: existing, error: selectError } = await supabase
            .from('experience')
            .select('experienceid')
            .order('experienceid', { ascending: false })
            .limit(1);

        if (!selectError && existing && existing.length > 0 && typeof existing[0].experienceid === 'number') {
            payload.experienceid = existing[0].experienceid + 1;
        } else {
            payload.experienceid = 1;
        }
    }

    const { data, error } = await supabase
        .from('experience')
        .insert(payload)
        .select('*')
        .single();

    if (error) {
        throw error;
    }
    if (!data) {
        throw new Error('Supabase did not return the created experience.');
    }

    return {
        experienceid: data.experienceid ?? data.id,
        id: data.experienceid ?? data.id,
        title: data.title ?? '',
        job_title: data.job_title ?? data.role ?? '',
        details: data.details ?? data.description ?? '',
    };
}

export async function updateExperience(supabase, experienceId, input) {
    const payload = normalizeExperienceInput(input);
    const targetId = parseInt(String(experienceId), 10);

    const { data, error } = await supabase
        .from('experience')
        .update(payload)
        .eq('experienceid', targetId)
        .select('*')
        .maybeSingle();

    if (error) {
        throw error;
    }
    if (!data) {
        throw new Error('Experience was not updated. Check access policies or confirm it still exists.');
    }

    return {
        experienceid: data.experienceid ?? data.id,
        id: data.experienceid ?? data.id,
        title: data.title ?? '',
        job_title: data.job_title ?? data.role ?? '',
        details: data.details ?? data.description ?? '',
    };
}

export async function deleteExperience(supabase, experienceId) {
    const targetId = parseInt(String(experienceId), 10);

    const { data, error } = await supabase
        .from('experience')
        .delete()
        .eq('experienceid', targetId)
        .select('*')
        .maybeSingle();

    if (error) {
        throw error;
    }
    if (!data) {
        throw new Error('Experience was not deleted. Check access policies or confirm it still exists.');
    }
}
