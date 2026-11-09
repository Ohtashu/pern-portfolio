import assert from 'node:assert/strict';
import test from 'node:test';
import { isSupabasePublicKey } from '../vite.config.js';

const publishableKey = 'sb_publishable_example-public-key';

function legacyAnonKey() {
    const payload = Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url');
    return `header.${payload}.signature`;
}

function serviceRoleKey() {
    const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url');
    return `header.${payload}.signature`;
}

test('accepts a publishable key and a legacy anon key', () => {
    assert.equal(isSupabasePublicKey(publishableKey), true);
    assert.equal(isSupabasePublicKey(legacyAnonKey()), true);
});

test('rejects missing, invalid, secret, and service-role keys', () => {
    assert.equal(isSupabasePublicKey(undefined), false);
    assert.equal(isSupabasePublicKey('not-a-key'), false);
    assert.equal(isSupabasePublicKey('sb_secret-do-not-expose'), false);
    assert.equal(isSupabasePublicKey(serviceRoleKey()), false);
});