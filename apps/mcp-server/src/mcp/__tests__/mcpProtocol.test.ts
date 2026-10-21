import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { createMCPRouter } from '../streamableHttp.js';
import { Server } from 'http';

describe('MCP 2025-11-25 Streamable HTTP Protocol Conformance', () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(createMCPRouter());
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('1. handles initialize method conforming to MCP 2025-11-25', async () => {
    const res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'init-1',
        method: 'initialize',
        params: {}
      })
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.jsonrpc).toBe('2.0');
    expect(data.id).toBe('init-1');
    expect(data.result.protocolVersion).toBe('2025-11-25');
    expect(data.result.serverInfo.name).toBe('actionpilot-mcp-server');
  });

  it('2. handles tools/list and returns all 13 registered tools', async () => {
    const res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'tools-1',
        method: 'tools/list'
      })
    });
    const data = (await res.json()) as any;
    expect(data.result.tools.length).toBe(13);
    const toolNames = data.result.tools.map((t: any) => t.name);
    expect(toolNames).toContain('get_next_action');
    expect(toolNames).toContain('analyze_consequences');
    expect(toolNames).toContain('find_free_slots');
  });

  it('3. handles tools/call for get_tasks over JSON-RPC 2.0', async () => {
    const res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'call-1',
        method: 'tools/call',
        params: {
          name: 'get_tasks',
          arguments: { userId: 'user_alexa_dev_01' }
        }
      })
    });
    const data = (await res.json()) as any;
    expect(data.result.isError).toBe(false);
    expect(data.result.content[0].type).toBe('text');
    const parsed = JSON.parse(data.result.content[0].text);
    expect(parsed.tasks).toBeDefined();
    expect(parsed.count).toBeGreaterThan(0);
  });

  it('4. rejects invalid JSON-RPC 2.0 payloads with code -32600', async () => {
    const res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: true })
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as any;
    expect(data.error.code).toBe(-32600);
  });

  it('5. returns unknown tool error with code -32601', async () => {
    const res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'call-unknown',
        method: 'tools/call',
        params: {
          name: 'non_existent_tool',
          arguments: {}
        }
      })
    });
    const data = (await res.json()) as any;
    expect(data.error.code).toBe(-32601);
  });
});
