export const CV_BUCKET = 'portfolio-cvs';
export const PROJECT_IMAGE_BUCKET = 'portfolio-project-images';
export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const PROJECT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const imageExtensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

async function upload(supabase, file, bucket, extensions, maxBytes) {
    const extension = file && Object.hasOwn(extensions, file.type) ? extensions[file.type] : null;
    if (!extension) {
        throw new Error('Unsupported file type.');
    }
    if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > maxBytes) {
        throw new Error(`File size must be between 1 and ${maxBytes} bytes.`);
    }

    const path = `${globalThis.crypto.randomUUID()}.${extension}`;
    const storage = supabase.storage.from(bucket);
    const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
        throw error;
    }
    const { data } = storage.getPublicUrl(path);
    if (!data?.publicUrl) {
        throw new Error('Supabase did not return a public URL.');
    }
    return data.publicUrl;
}

export function uploadCv(supabase, file) {
    return upload(supabase, file, CV_BUCKET, { 'application/pdf': 'pdf' }, CV_MAX_BYTES);
}

export function uploadProjectImage(supabase, file) {
    return upload(supabase, file, PROJECT_IMAGE_BUCKET, imageExtensions, PROJECT_IMAGE_MAX_BYTES);
}