import assert from 'node:assert/strict';
import test from 'node:test';
import { requestAlegra } from '../build/alegra-api.js';

test('encodes an ID and serializes repeated and structured query parameters', async () => {
    process.env.ALEGRA_USER = 'user@example.com';
    process.env.ALEGRA_TOKEN = 'secret-token';
    let capturedUrl;
    let capturedOptions;

    const result = await requestAlegra(
        {
            endpoint: 'items',
            method: 'get',
            id: 'item/42',
            queryParams: {
                tags: ['one', 'two'],
                filter: { active: true },
            },
        },
        async (input, init) => {
            capturedUrl = new URL(input);
            capturedOptions = init;
            return new Response('{"id":42}', { status: 200 });
        },
    );

    assert.equal(capturedUrl.pathname, '/api/v1/items/item%2F42');
    assert.deepEqual(capturedUrl.searchParams.getAll('tags'), ['one', 'two']);
    assert.equal(capturedUrl.searchParams.get('filter'), '{"active":true}');
    assert.equal(capturedOptions.method, 'GET');
    assert.equal(capturedOptions.headers.get('authorization'), `Basic ${Buffer.from('user@example.com:secret-token').toString('base64')}`);
    assert.equal(result, '{\n  "id": 42\n}');
});

test('sends write data as JSON and returns empty success responses clearly', async () => {
    process.env.ALEGRA_USER = 'user@example.com';
    process.env.ALEGRA_TOKEN = 'secret-token';
    let capturedOptions;

    const result = await requestAlegra(
        {
            endpoint: 'contacts',
            method: 'post',
            queryParams: { name: 'Example' },
        },
        async (_input, init) => {
            capturedOptions = init;
            return new Response(null, { status: 204 });
        },
    );

    assert.equal(capturedOptions.method, 'POST');
    assert.equal(capturedOptions.body, '{"name":"Example"}');
    assert.match(result, /devolvió contenido/);
});

test('reports Alegra HTTP failures with a bounded response body', async () => {
    process.env.ALEGRA_USER = 'user@example.com';
    process.env.ALEGRA_TOKEN = 'secret-token';

    await assert.rejects(
        requestAlegra(
            { endpoint: 'invoices', method: 'get' },
            async () => new Response('problem'.repeat(500), { status: 400, statusText: 'Bad Request' }),
        ),
        (error) => {
            assert.match(error.message, /400 Bad Request/);
            assert.ok(error.message.length < 2_100);
            return true;
        },
    );
});
