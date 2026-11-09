import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

function createTransport() {
    return new StdioClientTransport({
        command: process.execPath,
        args: ['build/main.js'],
        env: {
            ...process.env,
            ALEGRA_USER: 'test@example.com',
            ALEGRA_TOKEN: 'test-token',
        },
    });
}

test('serves modern MCP clients over stdio', async () => {
    const client = new Client(
        { name: 'Alegra MCP modern smoke test', version: '1.0.0' },
        { versionNegotiation: { mode: { pin: '2026-07-28' } } },
    );

    try {
        await client.connect(createTransport());
        assert.equal(client.getProtocolEra(), 'modern');

        const { tools } = await client.listTools();
        assert.deepEqual(
            tools.map((tool) => tool.name).sort(),
            ['AlegraAPI', 'alegra_delete', 'alegra_read', 'alegra_write'].sort(),
        );
        assert.equal(tools.find((tool) => tool.name === 'alegra_read').annotations.readOnlyHint, true);
        assert.equal(tools.find((tool) => tool.name === 'alegra_delete').annotations.destructiveHint, true);

        const { prompts } = await client.listPrompts();
        assert.equal(prompts.length, 5);
    } finally {
        await client.close();
    }
});

test('rejects legacy MCP clients over stdio', async () => {
    const client = new Client({ name: 'Alegra MCP legacy smoke test', version: '1.0.0' });

    try {
        await assert.rejects(client.connect(createTransport()));
    } finally {
        await client.close();
    }
});
