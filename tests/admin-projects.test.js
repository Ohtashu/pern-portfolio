import assert from 'node:assert/strict';
import test from 'node:test';
import {
    assertAdminUser,
    createProject,
    deleteProject,
    loadAdminProjects,
    normalizeProjectInput,
    updateProject,
} from '../utils/admin-projects.js';

const validInput = {
    github_id: '1234567890123456789',
    name: '  Portfolio app  ',
    description: '  A project description  ',
    repo_url: 'https://github.com/example/project',
    demo_url: '',
    image_url: 'https://example.com/image.png',
    language: '  React  ',
    is_freelance: true,
    documentations: '  https://example.com/docs  ',
};

function makeSupabaseStub(result) {
    const calls = [];
    const query = {
        from(table) {
            calls.push(['from', table]);
            return this;
        },
        select(columns) {
            calls.push(['select', columns]);
            return this;
        },
        insert(payload) {
            calls.push(['insert', payload]);
            return this;
        },
        update(payload) {
            calls.push(['update', payload]);
            return this;
        },
        delete() {
            calls.push(['delete']);
            return this;
        },
        eq(column, value) {
            calls.push(['eq', column, value]);
            return this;
        },
        order(column, options) {
            calls.push(['order', column, options]);
            return this;
        },
        single() {
            return Promise.resolve(result);
        },
        maybeSingle() {
            return Promise.resolve(result);
        },
        then(resolve, reject) {
            return Promise.resolve(result).then(resolve, reject);
        },
    };
    return { client: query, calls };
}

test('normalizes editable project fields and preserves bigint IDs as strings', () => {
    assert.deepEqual(normalizeProjectInput(validInput), {
        github_id: '1234567890123456789',
        name: 'Portfolio app',
        description: 'A project description',
        repo_url: 'https://github.com/example/project',
        demo_url: null,
        image_url: 'https://example.com/image.png',
        language: 'React',
        is_freelance: true,
        documentations: 'https://example.com/docs',
    });
});

test('rejects empty names, invalid URLs, and invalid GitHub IDs', () => {
    assert.throws(() => normalizeProjectInput({ ...validInput, name: '  ' }), /name is required/);
    assert.throws(() => normalizeProjectInput({ ...validInput, repo_url: 'javascript:alert(1)' }), /HTTP or HTTPS/);
    assert.throws(() => normalizeProjectInput({ ...validInput, github_id: '1.5' }), /positive whole number/);
    assert.throws(() => normalizeProjectInput({ ...validInput, github_id: '9223372036854775808' }), /positive whole number/);
});

test('creates projects with only editable columns and surfaces Supabase failures', async () => {
    const savedProject = { id: 'new-id', name: 'Portfolio app' };
    const { client, calls } = makeSupabaseStub({ data: savedProject, error: null });
    assert.equal(await createProject(client, validInput), savedProject);
    const payload = calls.find(([method]) => method === 'insert')[1];
    assert.equal(payload.name, 'Portfolio app');
    assert.equal('id' in payload, false);
    assert.equal('updated_at' in payload, false);

    const failed = makeSupabaseStub({ data: null, error: new Error('insert denied') });
    await assert.rejects(createProject(failed.client, validInput), /insert denied/);
});

test('updates by ID without changing the row ID or database timestamp', async () => {
    const savedProject = { id: 'existing-id', name: 'Portfolio app' };
    const { client, calls } = makeSupabaseStub({ data: savedProject, error: null });
    assert.equal(await updateProject(client, 'existing-id', validInput), savedProject);
    assert.deepEqual(calls.find(([method]) => method === 'eq'), ['eq', 'id', 'existing-id']);
    const payload = calls.find(([method]) => method === 'update')[1];
    assert.equal('id' in payload, false);
    assert.equal('updated_at' in payload, false);

    const missing = makeSupabaseStub({ data: null, error: null });
    await assert.rejects(updateProject(missing.client, 'missing-id', validInput), /not updated/);
});

test('deletes only when Supabase confirms a row was removed', async () => {
    const { client, calls } = makeSupabaseStub({ data: { id: 'project-id' }, error: null });
    await deleteProject(client, 'project-id');
    assert.deepEqual(calls.find(([method]) => method === 'eq'), ['eq', 'id', 'project-id']);

    const missing = makeSupabaseStub({ data: null, error: null });
    await assert.rejects(deleteProject(missing.client, 'missing-id'), /not deleted/);
});

test('checks allowlist membership and denies unlisted users or query errors', async () => {
    const allowed = makeSupabaseStub({ data: { user_id: 'admin-id' }, error: null });
    assert.equal(await assertAdminUser(allowed.client, 'admin-id'), true);

    const denied = makeSupabaseStub({ data: null, error: null });
    await assert.rejects(assertAdminUser(denied.client, 'user-id'), /not enabled/);

    const failed = makeSupabaseStub({ data: null, error: new Error('policy denied') });
    await assert.rejects(assertAdminUser(failed.client, 'user-id'), /policy denied/);
});

test('loads projects and reports table access failures', async () => {
    const rows = [{ id: 'project-id', name: 'Portfolio app' }];
    const { client } = makeSupabaseStub({ data: rows, error: null });
    assert.equal(await loadAdminProjects(client), rows);

    const failed = makeSupabaseStub({ data: null, error: new Error('read denied') });
    await assert.rejects(loadAdminProjects(failed.client), /read denied/);
});