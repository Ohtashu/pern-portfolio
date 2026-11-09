import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeExperienceInput } from '../utils/admin-experiences.js';

test('normalizeExperienceInput trims valid values and parses experienceid', () => {
    const input = {
        title: '  Senior Web Developer  ',
        job_title: '  Full Stack Engineer  ',
        details: '  Built high throughput microservices.  ',
        experienceid: '  5  ',
    };

    assert.deepEqual(normalizeExperienceInput(input), {
        title: 'Senior Web Developer',
        job_title: 'Full Stack Engineer',
        details: 'Built high throughput microservices.',
        experienceid: 5,
    });
});

test('normalizeExperienceInput supports fallback field names role and description', () => {
    const input = {
        title: 'Frontend Lead',
        role: 'React Specialist',
        description: 'Developed modern accessible web components.',
    };

    assert.deepEqual(normalizeExperienceInput(input), {
        title: 'Frontend Lead',
        job_title: 'React Specialist',
        details: 'Developed modern accessible web components.',
    });
});

test('normalizeExperienceInput throws error when required fields are missing', () => {
    assert.throws(
        () => normalizeExperienceInput({ title: '   ', job_title: 'Engineer', details: 'Details' }),
        /Experience title \/ company is required\./
    );

    assert.throws(
        () => normalizeExperienceInput({ title: 'Tech Co', job_title: '   ', details: 'Details' }),
        /Job title \/ role is required\./
    );

    assert.throws(
        () => normalizeExperienceInput({ title: 'Tech Co', job_title: 'Engineer', details: '   ' }),
        /Experience details \/ description is required\./
    );
});

test('normalizeExperienceInput throws error for invalid experience ID', () => {
    assert.throws(
        () => normalizeExperienceInput({
            title: 'Tech Co',
            job_title: 'Engineer',
            details: 'Details',
            experienceid: '-1',
        }),
        /Experience ID must be a positive integer\./
    );

    assert.throws(
        () => normalizeExperienceInput({
            title: 'Tech Co',
            job_title: 'Engineer',
            details: 'Details',
            experienceid: 'abc',
        }),
        /Experience ID must be a positive integer\./
    );
});
