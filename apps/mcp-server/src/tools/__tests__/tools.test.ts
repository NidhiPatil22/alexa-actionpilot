import { describe, it, expect, beforeEach } from 'vitest';
import { tools, getToolByName } from '../index.js';
import { memoryStore } from '../../storage/memoryStore.js';

describe('ActionPilot 13 MCP Tools', () => {
  beforeEach(() => {
    memoryStore.resetToDefault();
  });

  it('verifies all 13 required MCP tools are registered with schemas', () => {
    const requiredTools = [
      'create_task',
      'get_tasks',
      'update_task',
      'complete_task',
      'get_calendar',
      'find_free_slots',
      'analyze_workload',
      'prioritize_tasks',
      'get_next_action',
      'create_focus_block',
      'analyze_consequences',
      'get_user_context',
      'save_user_preference'
    ];

    expect(tools.length).toBe(13);
    for (const name of requiredTools) {
      const tool = getToolByName(name);
      expect(tool).toBeDefined();
      expect(tool!.description).toBeTruthy();
      expect(tool!.inputSchema).toBeDefined();
      expect(typeof tool!.handler).toBe('function');
    }
  });

  it('executes create_task and get_tasks', async () => {
    const createTool = getToolByName('create_task')!;
    const res = await createTool.handler({
      title: 'Test New Task',
      deadline: '2026-10-15T18:00:00Z',
      priority: 5,
      estimatedDuration: 45,
      energyLevel: 'deep_work'
    });
    expect(res.success).toBe(true);
    expect(res.task.title).toBe('Test New Task');

    const getTool = getToolByName('get_tasks')!;
    const getRes = await getTool.handler({});
    expect(getRes.tasks.some((t: any) => t.title === 'Test New Task')).toBe(true);
  });

  it('executes get_next_action and returns explainable decision', async () => {
    const nbaTool = getToolByName('get_next_action')!;
    const action = await nbaTool.handler({});
    expect(action.recommendedTask).toBeDefined();
    expect(action.confidenceScore).toBeGreaterThan(0);
    expect(action.reasoning).toBeTruthy();
    expect(action.explanationForAlexa).toBeTruthy();
    expect(action.recommendedSlot).toBeDefined();
  });

  it('executes analyze_consequences for rescheduling', async () => {
    const consequenceTool = getToolByName('analyze_consequences')!;
    const analysis = await consequenceTool.handler({
      taskId: 'task-bedrock-01',
      proposedDateOrTime: 'tomorrow'
    });
    expect(analysis.proposedChange).toBeDefined();
    expect(analysis.impactSeverity).toBeDefined();
    expect(analysis.explanationForAlexa).toBeDefined();
  });

  it('executes create_focus_block and links task', async () => {
    const focusTool = getToolByName('create_focus_block')!;
    const res = await focusTool.handler({
      taskId: 'task-bedrock-01',
      title: 'Focus: AWS Bedrock',
      start: '2026-10-06T14:00:00Z',
      end: '2026-10-06T15:30:00Z'
    });
    expect(res.success).toBe(true);
    expect(res.event.type).toBe('focus_block');
  });

  it('executes analyze_workload', async () => {
    const workloadTool = getToolByName('analyze_workload')!;
    const report = await workloadTool.handler({ date: 'today' });
    expect(report.totalScheduledMinutes).toBeDefined();
    expect(report.stressLevel).toBeDefined();
    expect(report.deadlineDistribution).toBeDefined();
  });
});
