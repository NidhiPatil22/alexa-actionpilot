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
    const getRes = await getTool.handler({ userId: 'user_alexa_dev_01' });
    expect(getRes.tasks.some((t: any) => t.title === 'Test New Task')).toBe(true);
    expect(getRes.tasks[0]).toHaveProperty('estimated_minutes');
  });

  it('returns a structured error when get_tasks is missing userId', async () => {
    const getTool = getToolByName('get_tasks')!;
    const getRes = await getTool.handler({});
    expect(getRes.error).toBe(true);
    expect(getRes.code).toBe('INVALID_ARGUMENTS');
    expect(Array.isArray(getRes.issues)).toBe(true);
  });

  it('executes get_next_action and returns explainable decision', async () => {
    const nbaTool = getToolByName('get_next_action')!;
    const action = await nbaTool.handler({
      userId: 'user_alexa_dev_01',
      availableMinutes: 90
    });
    expect(action.recommendedTask).toBeDefined();
    expect(action.recommendedTask.title).toBeTruthy();
    expect(action.reasoning).toBeTruthy();
    expect(action.estimatedMinutes).toBeGreaterThan(0);
    expect(action.estimatedMinutes).toBeLessThanOrEqual(90);
    expect(action.confidenceScore).toBeGreaterThan(0);
    expect(action.explanationForAlexa).toBeTruthy();
    expect(action.recommendedSlot).toBeDefined();
  });

  it('returns a structured error when get_next_action arguments are invalid', async () => {
    const nbaTool = getToolByName('get_next_action')!;
    const action = await nbaTool.handler({});
    expect(action.error).toBe(true);
    expect(action.isError).toBe(true);
    expect(action.code).toBe('INVALID_ARGUMENTS');
    expect(Array.isArray(action.issues)).toBe(true);
  });

  it('suggests a break when no task fits the availableMinutes window', async () => {
    const nbaTool = getToolByName('get_next_action')!;
    const action = await nbaTool.handler({
      userId: 'user_alexa_dev_01',
      availableMinutes: 5
    });
    expect(action.recommendedTask).toBeNull();
    expect(action.estimatedMinutes).toBe(0);
    expect(action.reasoning).toMatch(/break|smaller task/i);
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

  it('executes get_calendar for a user', async () => {
    const calendarTool = getToolByName('get_calendar')!;
    const res = await calendarTool.handler({ userId: 'user_alexa_dev_01' });
    expect(res.error).toBeUndefined();
    expect(res.userId).toBe('user_alexa_dev_01');
    expect(res.count).toBeGreaterThan(0);
    expect(res.events[0]).toHaveProperty('start');
    expect(res.events[0]).toHaveProperty('end');
    expect(res.events[0]).toHaveProperty('title');
  });

  it('returns a structured error when get_calendar is missing userId', async () => {
    const calendarTool = getToolByName('get_calendar')!;
    const res = await calendarTool.handler({});
    expect(res.error).toBe(true);
    expect(res.isError).toBe(true);
    expect(res.code).toBe('INVALID_ARGUMENTS');
    expect(Array.isArray(res.issues)).toBe(true);
  });

  it('executes find_free_slots and filters by minDurationMinutes', async () => {
    const slotsTool = getToolByName('find_free_slots')!;
    const res = await slotsTool.handler({
      userId: 'user_alexa_dev_01',
      minDurationMinutes: 30
    });
    expect(res.error).toBeUndefined();
    expect(res.freeSlotCount).toBe(res.slots.length);
    expect(res.slots.length).toBeGreaterThan(0);
    for (const slot of res.slots) {
      expect(slot.durationMinutes).toBeGreaterThanOrEqual(30);
      expect(new Date(slot.end).getTime()).toBeGreaterThan(new Date(slot.start).getTime());
    }
  });

  it('returns a structured error when find_free_slots arguments are invalid', async () => {
    const slotsTool = getToolByName('find_free_slots')!;
    const res = await slotsTool.handler({ userId: 'user_alexa_dev_01' });
    expect(res.error).toBe(true);
    expect(res.isError).toBe(true);
    expect(res.code).toBe('INVALID_ARGUMENTS');
    expect(Array.isArray(res.issues)).toBe(true);
  });

  it('executes analyze_workload', async () => {
    const workloadTool = getToolByName('analyze_workload')!;
    const report = await workloadTool.handler({ date: 'today' });
    expect(report.totalScheduledMinutes).toBeDefined();
    expect(report.stressLevel).toBeDefined();
    expect(report.deadlineDistribution).toBeDefined();
  });
});
