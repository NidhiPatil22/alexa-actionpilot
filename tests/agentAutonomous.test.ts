import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrandsAgent } from '../agent/src/index.js';

describe('StrandsAgent Autonomous Goal Orchestration', () => {
  let agent: StrandsAgent;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    agent = new StrandsAgent({
      mcpServerUrl: 'http://localhost:3001',
      apiKey: 'test-api-key-123'
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('correctly constructs JSON-RPC 2.0 request and authorization headers in callMcpTool', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      capturedUrl = url;
      capturedHeaders = init.headers;
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: capturedBody.id,
          result: {
            content: [{ type: 'text', text: JSON.stringify({ success: true, count: 5 }) }]
          }
        })
      };
    }) as any;

    const result = await agent.callMcpTool('get_tasks', { status: 'todo' });

    expect(capturedUrl).toBe('http://localhost:3001/mcp');
    expect(capturedHeaders['Authorization']).toBe('Bearer test-api-key-123');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
    expect(capturedHeaders['mcp-session-id']).toContain('strands-agent-');
    expect(capturedBody.jsonrpc).toBe('2.0');
    expect(capturedBody.method).toBe('tools/call');
    expect(capturedBody.params.name).toBe('get_tasks');
    expect(capturedBody.params.arguments).toEqual({ status: 'todo' });
    expect(result).toEqual({ success: true, count: 5 });
  });

  it('retrieves tool definitions via listMcpTools', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 'test-list',
          result: {
            tools: [
              { name: 'get_next_action', description: 'Flagship decision engine' },
              { name: 'analyze_consequences', description: 'Simulate rescheduling' }
            ]
          }
        })
      };
    }) as any;

    const tools = await agent.listMcpTools();
    expect(tools.length).toBe(2);
    expect(tools[0].name).toBe('get_next_action');
    expect(tools[1].name).toBe('analyze_consequences');
  });

  it('orchestrates an autonomous goal loop across multiple MCP tools', async () => {
    // Mock sequential tool calls in the orchestrateAutonomousGoal pipeline:
    // 1: get_user_context
    // 2: get_tasks
    // 2b: analyze_workload
    // 3: find_free_slots
    // 4: get_next_action
    // 5: create_focus_block
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
      const body = JSON.parse(init.body);
      const toolName = body.params.name;

      let payload: any = {};
      if (toolName === 'get_user_context') {
        payload = { userId: 'user_alexa_dev_01', workingHours: { start: '09:00', end: '18:00' } };
      } else if (toolName === 'get_tasks') {
        payload = { count: 3, tasks: [] };
      } else if (toolName === 'analyze_workload') {
        payload = { stressLevel: 'Balanced', capacityRatio: 0.65 };
      } else if (toolName === 'find_free_slots') {
        payload = { freeSlotCount: 2, slots: [{ start: '2026-10-21T14:30:00Z', end: '2026-10-21T16:00:00Z' }] };
      } else if (toolName === 'get_next_action') {
        payload = {
          recommendedTask: { id: 'task-bedrock-01', title: 'Complete AWS Bedrock Agent Integration' },
          confidenceScore: 96,
          recommendedSlot: {
            start: '2026-10-21T14:30:00Z',
            end: '2026-10-21T16:00:00Z',
            formattedTime: '2:30 PM - 4:00 PM'
          },
          explanationForAlexa: 'I recommend Complete AWS Bedrock Agent Integration.',
          reasoning: 'Critical deadline due today.'
        };
      } else if (toolName === 'create_focus_block') {
        payload = {
          id: 'block-123',
          title: 'Focus: Complete AWS Bedrock Agent Integration',
          start: '2026-10-21T14:30:00Z',
          end: '2026-10-21T16:00:00Z'
        };
      }

      return {
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(payload) }]
          }
        })
      };
    }) as any;

    const result = await agent.orchestrateAutonomousGoal('Optimize my afternoon for deep work');

    expect(result.status).toBe('COMPLETED');
    expect(result.goal).toBe('Optimize my afternoon for deep work');
    expect(result.plan.length).toBe(6);
    expect(result.executionTrace.length).toBe(5);
    expect(result.speechResponse).toContain('Complete AWS Bedrock Agent Integration');
    expect(result.speechResponse).toContain('2:30 PM - 4:00 PM');
    expect(result.resultingState.bookedBlock).toBeDefined();
    expect(result.resultingState.recommendedTask.id).toBe('task-bedrock-01');
  });

  it('handles MCP tool errors gracefully without crashing the agent', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        status: 500
      };
    }) as any;

    const result = await agent.orchestrateAutonomousGoal('Attempt goal with failed server');

    expect(result.status).toBe('FAILED');
    expect(result.speechResponse).toContain('I ran into an issue while orchestrating your goal');
    expect(result.resultingState.error).toBeTruthy();
  });
});
