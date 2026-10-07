import { z } from 'zod';
import { dataStore } from '../storage/index.js';
import { findFreeSlots } from '../engine/freeSlots.js';
import { rankTasks } from '../engine/priorityScorer.js';
import { analyzeWorkload } from '../engine/workloadAnalyzer.js';
import { determineNextBestAction } from '../engine/nextBestAction.js';
import { analyzeConsequences } from '../engine/consequenceEngine.js';
import { Task, CalendarEvent } from '../types.js';

const GetTasksArgsSchema = z.object({
  userId: z.string().min(1).describe('Unique identifier for the user'),
  status: z.enum(['todo', 'in_progress', 'completed', 'postponed']).optional(),
  tag: z.string().optional()
});

const GetNextActionArgsSchema = z.object({
  userId: z.string().min(1).describe('Unique identifier for the user'),
  availableMinutes: z.number().finite().nonnegative().describe('Available free time slot in minutes')
});

const GetCalendarArgsSchema = z.object({
  userId: z.string().min(1).describe('Unique identifier for the user'),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

const FindFreeSlotsArgsSchema = z.object({
  userId: z.string().min(1).describe('Unique identifier for the user'),
  minDurationMinutes: z.number().finite().nonnegative().describe('Minimum uninterrupted focus block in minutes'),
  date: z.string().optional()
});

type GetTasksPayload = {
  id: string;
  title: string;
  deadline: string;
  estimated_minutes: number;
  priority: number;
  status: string;
};

function mockTasksForUser(userId: string): GetTasksPayload[] {
  return [
    {
      id: `task-${userId}-001`,
      title: 'Complete ActionPilot MCP get_tasks integration',
      deadline: '2026-10-08T17:00:00.000Z',
      estimated_minutes: 90,
      priority: 5,
      status: 'in_progress'
    },
    {
      id: `task-${userId}-002`,
      title: 'Review pending assignment for Alexa+ demo',
      deadline: '2026-10-09T23:59:00.000Z',
      estimated_minutes: 45,
      priority: 4,
      status: 'todo'
    },
    {
      id: `task-${userId}-003`,
      title: 'Prepare deadline briefing for next-best-action',
      deadline: '2026-10-10T12:00:00.000Z',
      estimated_minutes: 30,
      priority: 3,
      status: 'todo'
    }
  ];
}

function invalidArguments(message: string, error: z.ZodError) {
  return {
    error: true,
    isError: true,
    code: 'INVALID_ARGUMENTS',
    message,
    issues: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }))
  };
}

function toActionTask(task: Task): GetTasksPayload {
  return {
    id: task.id,
    title: task.title,
    deadline: task.deadline,
    estimated_minutes: task.estimatedDuration,
    priority: task.priority,
    status: task.status
  };
}

async function loadTasksForUser(userId: string): Promise<GetTasksPayload[]> {
  const stored = await dataStore.getTasks();
  const mapped = stored.map(toActionTask);
  return mapped.length > 0 ? mapped : mockTasksForUser(userId);
}

type PriorityBand = 'HIGH' | 'MEDIUM' | 'LOW';

function priorityBand(priority: number | string): PriorityBand {
  if (typeof priority === 'string') {
    const normalized = priority.toUpperCase();
    if (normalized === 'HIGH' || normalized === 'MEDIUM' || normalized === 'LOW') {
      return normalized;
    }
    const numeric = Number(priority);
    if (!Number.isNaN(numeric)) {
      return priorityBand(numeric);
    }
    return 'LOW';
  }
  if (priority >= 4) return 'HIGH';
  if (priority >= 3) return 'MEDIUM';
  return 'LOW';
}

function bandRank(band: PriorityBand): number {
  if (band === 'HIGH') return 3;
  if (band === 'MEDIUM') return 2;
  return 1;
}

function scoreNextActionTask(task: GetTasksPayload, now: Date): number {
  const deadlineMs = new Date(task.deadline).getTime();
  const hoursUntilDeadline = (deadlineMs - now.getTime()) / 3_600_000;
  const deadlineProximity = hoursUntilDeadline <= 0
    ? 1000
    : 1000 / Math.max(hoursUntilDeadline, 0.25);
  return bandRank(priorityBand(task.priority)) * 10_000 + deadlineProximity;
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return deadline;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function mockCalendarForUser(userId: string, dateStr: string): CalendarEvent[] {
  return [
    {
      id: `cal-${userId}-lecture`,
      title: 'Distributed Systems Lecture',
      start: `${dateStr}T09:00:00.000Z`,
      end: `${dateStr}T10:30:00.000Z`,
      isFixed: true,
      type: 'meeting',
      description: 'CS-504 morning lecture block'
    },
    {
      id: `cal-${userId}-standup`,
      title: 'Team standup',
      start: `${dateStr}T10:45:00.000Z`,
      end: `${dateStr}T11:15:00.000Z`,
      isFixed: true,
      type: 'meeting',
      description: 'Daily status meeting'
    },
    {
      id: `cal-${userId}-lunch`,
      title: 'Lunch',
      start: `${dateStr}T12:00:00.000Z`,
      end: `${dateStr}T13:00:00.000Z`,
      isFixed: true,
      type: 'personal',
      description: 'Lunch gap'
    },
    {
      id: `cal-${userId}-review`,
      title: 'Architecture review',
      start: `${dateStr}T15:00:00.000Z`,
      end: `${dateStr}T16:00:00.000Z`,
      isFixed: false,
      type: 'meeting',
      description: 'Afternoon design review'
    }
  ];
}

async function loadCalendarForUser(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> {
  const stored = await dataStore.getEvents(startDate, endDate);
  if (stored.length > 0) {
    return stored;
  }
  const dateStr = (startDate || new Date().toISOString()).split('T')[0];
  return mockCalendarForUser(userId, dateStr);
}

function resolveTargetDate(date?: string): string {
  const now = new Date();
  if (!date || date === 'today') {
    return now.toISOString().split('T')[0];
  }
  if (date === 'tomorrow') {
    const tmrw = new Date(now);
    tmrw.setUTCDate(tmrw.getUTCDate() + 1);
    return tmrw.toISOString().split('T')[0];
  }
  return date;
}

function gapsBetweenEvents(
  events: CalendarEvent[],
  minDurationMinutes: number
): Array<{ start: string; end: string; durationMinutes: number }> {
  const sorted = [...events]
    .filter((event) => !Number.isNaN(new Date(event.start).getTime()) && !Number.isNaN(new Date(event.end).getTime()))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const gaps: Array<{ start: string; end: string; durationMinutes: number }> = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStart = new Date(sorted[i].end).getTime();
    const gapEnd = new Date(sorted[i + 1].start).getTime();
    const durationMinutes = Math.floor((gapEnd - gapStart) / (60 * 1000));
    if (durationMinutes >= minDurationMinutes) {
      gaps.push({
        start: new Date(gapStart).toISOString(),
        end: new Date(gapEnd).toISOString(),
        durationMinutes
      });
    }
  }
  return gaps;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<any>;
}

export const tools: MCPToolDefinition[] = [
  // 1. create_task
  {
    name: 'create_task',
    description: 'Create a new task with deadlines, estimated effort, priority, and energy requirements.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the task' },
        deadline: { type: 'string', description: 'Deadline ISO date-time string (e.g. 2026-10-06T17:00:00Z)' },
        priority: { type: 'number', description: 'Priority from 1 (lowest) to 5 (highest)' },
        estimatedDuration: { type: 'number', description: 'Estimated effort in minutes (e.g. 60)' },
        energyLevel: {
          type: 'string',
          enum: ['deep_work', 'shallow_work', 'quick_win'],
          description: 'Type of energy required'
        },
        description: { type: 'string', description: 'Detailed description' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags or categories' },
        dependencies: { type: 'array', items: { type: 'string' }, description: 'Task IDs that must finish first' }
      },
      required: ['title', 'deadline', 'priority', 'estimatedDuration']
    },
    handler: async (args) => {
      const task: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: args.title,
        description: args.description || '',
        deadline: args.deadline,
        priority: Number(args.priority) || 3,
        estimatedDuration: Number(args.estimatedDuration) || 45,
        energyLevel: args.energyLevel || 'deep_work',
        status: 'todo',
        tags: args.tags || [],
        dependencies: args.dependencies || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const saved = await dataStore.saveTask(task);
      return {
        success: true,
        task: saved,
        message: `Task "${saved.title}" created successfully.`
      };
    }
  },

  // 2. get_tasks
  {
    name: 'get_tasks',
    description: 'Fetches active tasks, pending assignments, and deadlines for ActionPilot',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Unique identifier for the user' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'completed', 'postponed'] },
        tag: { type: 'string' }
      },
      required: ['userId']
    },
    handler: async (args) => {
      const parsed = GetTasksArgsSchema.safeParse(args ?? {});
      if (!parsed.success) {
        return invalidArguments(
          'get_tasks requires a valid userId string.',
          parsed.error
        );
      }

      const { userId, status, tag } = parsed.data;
      const stored = await dataStore.getTasks({ status, tag });
      const mappedStored: GetTasksPayload[] = stored.map((task) => ({
        id: task.id,
        title: task.title,
        deadline: task.deadline,
        estimated_minutes: task.estimatedDuration,
        priority: task.priority,
        status: task.status
      }));

      const tasks = mappedStored.length > 0 ? mappedStored : mockTasksForUser(userId);

      return {
        userId,
        count: tasks.length,
        tasks
      };
    }
  },

  // 3. update_task
  {
    name: 'update_task',
    description: 'Update properties, status, or schedule of an existing task.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID to update' },
        title: { type: 'string' },
        deadline: { type: 'string' },
        priority: { type: 'number' },
        estimatedDuration: { type: 'number' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'completed', 'postponed'] },
        energyLevel: { type: 'string', enum: ['deep_work', 'shallow_work', 'quick_win'] }
      },
      required: ['id']
    },
    handler: async (args) => {
      const task = await dataStore.getTask(args.id);
      if (!task) {
        throw new Error(`Task ${args.id} not found.`);
      }
      if (args.title !== undefined) task.title = args.title;
      if (args.deadline !== undefined) task.deadline = args.deadline;
      if (args.priority !== undefined) task.priority = args.priority;
      if (args.estimatedDuration !== undefined) task.estimatedDuration = args.estimatedDuration;
      if (args.status !== undefined) task.status = args.status;
      if (args.energyLevel !== undefined) task.energyLevel = args.energyLevel;

      const updated = await dataStore.saveTask(task);
      return {
        success: true,
        task: updated,
        message: `Task "${updated.title}" updated successfully.`
      };
    }
  },

  // 4. complete_task
  {
    name: 'complete_task',
    description: 'Mark a task as completed.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the task to complete' }
      },
      required: ['id']
    },
    handler: async (args) => {
      const task = await dataStore.getTask(args.id);
      if (!task) {
        throw new Error(`Task ${args.id} not found.`);
      }
      task.status = 'completed';
      const updated = await dataStore.saveTask(task);
      return {
        success: true,
        task: updated,
        message: `Celebration! Task "${updated.title}" marked as completed.`
      };
    }
  },

  // 5. get_calendar
  {
    name: 'get_calendar',
    description: 'Fetches scheduled calendar events and time blocks for the specified user',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Unique identifier for the user' },
        startDate: { type: 'string', description: 'Start date ISO string' },
        endDate: { type: 'string', description: 'End date ISO string' }
      },
      required: ['userId']
    },
    handler: async (args) => {
      const parsed = GetCalendarArgsSchema.safeParse(args ?? {});
      if (!parsed.success) {
        return invalidArguments(
          'get_calendar requires a valid userId string.',
          parsed.error
        );
      }

      const { userId, startDate, endDate } = parsed.data;
      const events = await loadCalendarForUser(userId, startDate, endDate);
      return {
        userId,
        count: events.length,
        events
      };
    }
  },

  // 6. find_free_slots
  {
    name: 'find_free_slots',
    description: 'Analyzes the calendar to find uninterrupted free time blocks for focus sessions',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Unique identifier for the user' },
        minDurationMinutes: { type: 'number', description: 'Minimum uninterrupted focus block in minutes' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD or "today" / "tomorrow"' }
      },
      required: ['userId', 'minDurationMinutes']
    },
    handler: async (args) => {
      const parsed = FindFreeSlotsArgsSchema.safeParse(args ?? {});
      if (!parsed.success) {
        return invalidArguments(
          'find_free_slots requires userId (string) and minDurationMinutes (number).',
          parsed.error
        );
      }

      const { userId, minDurationMinutes, date } = parsed.data;
      const targetDate = resolveTargetDate(date);
      const events = await loadCalendarForUser(userId);
      const context = await dataStore.getUserContext();
      const workdaySlots = findFreeSlots(events, targetDate, context, minDurationMinutes, 0);
      const interstitialGaps = gapsBetweenEvents(
        events.filter((event) => event.start.startsWith(targetDate) || event.end.startsWith(targetDate)),
        minDurationMinutes
      );

      const slotsByStart = new Map<string, { start: string; end: string; durationMinutes: number; energyFit?: string }>();
      for (const slot of [...workdaySlots, ...interstitialGaps]) {
        if (slot.durationMinutes >= minDurationMinutes) {
          slotsByStart.set(slot.start, slot);
        }
      }

      const slots = [...slotsByStart.values()].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );

      return {
        userId,
        date: targetDate,
        minDurationMinutes,
        freeSlotCount: slots.length,
        slots
      };
    }
  },

  // 7. analyze_workload
  {
    name: 'analyze_workload',
    description: 'Analyze user workload, total scheduled meeting hours, free hours, and stress capacity.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD or "today"' }
      }
    },
    handler: async (args) => {
      const tasks = await dataStore.getTasks();
      const events = await dataStore.getEvents();
      const context = await dataStore.getUserContext();
      const now = new Date();
      let targetDate = args?.date || 'today';
      if (targetDate === 'today') {
        targetDate = now.toISOString().split('T')[0];
      }
      const report = analyzeWorkload(tasks, events, targetDate, context, now);
      return report;
    }
  },

  // 8. prioritize_tasks
  {
    name: 'prioritize_tasks',
    description: 'Run deterministic multi-factor scoring to rank all active tasks by urgency, importance, and energy fit.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const tasks = await dataStore.getTasks();
      const events = await dataStore.getEvents();
      const context = await dataStore.getUserContext();
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const slots = findFreeSlots(events, todayStr, context, 20);
      const ranked = rankTasks(tasks, now, slots, context);
      return {
        rankedCount: ranked.length,
        rankedTasks: ranked
      };
    }
  },

  // 9. get_next_action (Flagship Decision Engine)
  {
    name: 'get_next_action',
    description: 'Evaluates pending tasks, calendar windows, and urgency to return the single highest priority action recommendation for ActionPilot',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Unique identifier for the user' },
        availableMinutes: { type: 'number', description: 'Available free time slot in minutes' }
      },
      required: ['userId', 'availableMinutes']
    },
    handler: async (args) => {
      const parsed = GetNextActionArgsSchema.safeParse(args ?? {});
      if (!parsed.success) {
        return invalidArguments(
          'get_next_action requires userId (string) and availableMinutes (number).',
          parsed.error
        );
      }

      const { userId, availableMinutes } = parsed.data;
      const now = new Date();
      const tasks = await loadTasksForUser(userId);
      const eligible = tasks
        .filter((task) => task.status !== 'completed' && task.estimated_minutes <= availableMinutes)
        .sort((a, b) => scoreNextActionTask(b, now) - scoreNextActionTask(a, now));

      if (eligible.length === 0) {
        return {
          userId,
          availableMinutes,
          recommendedTask: null,
          reasoning: `No pending task fits in ${availableMinutes} minutes. Take a short break, or create a smaller task that can be finished in this window.`,
          estimatedMinutes: 0,
          suggestion: 'break_or_smaller_task'
        };
      }

      const top = eligible[0];
      const band = priorityBand(top.priority);
      const stored = await dataStore.getTask(top.id);
      const recommendedTask = stored ?? top;
      const estimatedMinutes = top.estimated_minutes;
      const reasoning = `Recommend "${top.title}" because it is ${band} priority, due ${formatDeadline(top.deadline)}, and its ${estimatedMinutes}-minute estimate fits the ${availableMinutes}-minute window better than other pending work.`;

      const events = await dataStore.getEvents();
      const context = await dataStore.getUserContext();
      const engineAction = determineNextBestAction(await dataStore.getTasks(), events, context, now);

      return {
        userId,
        availableMinutes,
        recommendedTask,
        reasoning,
        estimatedMinutes,
        confidenceScore: engineAction.confidenceScore,
        recommendedSlot: engineAction.recommendedSlot,
        alternativeTasks: engineAction.alternativeTasks,
        factors: engineAction.factors,
        explanationForAlexa: reasoning
      };
    }
  },

  // 10. create_focus_block
  {
    name: 'create_focus_block',
    description: 'Reserve a focus block on the user calendar dedicated to working on a specific task.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'ID of task to associate with focus block' },
        title: { type: 'string', description: 'Title of the focus block' },
        start: { type: 'string', description: 'Start time ISO string' },
        end: { type: 'string', description: 'End time ISO string' }
      },
      required: ['taskId', 'title', 'start', 'end']
    },
    handler: async (args) => {
      const task = await dataStore.getTask(args.taskId);
      const event: CalendarEvent = {
        id: `focus-${Date.now()}`,
        title: args.title,
        start: args.start,
        end: args.end,
        isFixed: false,
        type: 'focus_block',
        taskId: args.taskId,
        description: `Focus block dedicated to "${args.title}"`
      };
      const savedEvent = await dataStore.saveEvent(event);

      if (task) {
        task.scheduledSlot = { start: args.start, end: args.end };
        task.status = 'in_progress';
        await dataStore.saveTask(task);
      }

      return {
        success: true,
        event: savedEvent,
        message: `Focus block booked from ${new Date(args.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(args.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      };
    }
  },

  // 11. analyze_consequences (Flagship Safety & Impact Engine)
  {
    name: 'analyze_consequences',
    description: 'Simulates rescheduling a task to a target date/time, checks for conflicts, deadline breaches, and cascade ripple effects.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'ID or title of the task to test rescheduling' },
        proposedDateOrTime: { type: 'string', description: 'Proposed date (e.g. "tomorrow", "2026-10-06") or ISO time' }
      },
      required: ['taskId', 'proposedDateOrTime']
    },
    handler: async (args) => {
      const tasks = await dataStore.getTasks();
      const events = await dataStore.getEvents();
      const context = await dataStore.getUserContext();
      const now = new Date();

      const analysis = analyzeConsequences(
        args.taskId,
        args.proposedDateOrTime,
        tasks,
        events,
        context,
        now
      );
      return analysis;
    }
  },

  // 12. get_user_context
  {
    name: 'get_user_context',
    description: 'Retrieve learned user scheduling preferences, peak focus hours, and current goals.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const context = await dataStore.getUserContext();
      return context;
    }
  },

  // 13. save_user_preference
  {
    name: 'save_user_preference',
    description: 'Save or update a learned scheduling preference in user contextual memory.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Preference key (e.g. preferMorningDeepWork)' },
        value: { description: 'Preference value' }
      },
      required: ['key', 'value']
    },
    handler: async (args) => {
      const updated = await dataStore.updateUserPreference(args.key, args.value);
      return {
        success: true,
        learnedPreferences: updated.learnedPreferences,
        message: `Preference "${args.key}" saved.`
      };
    }
  }
];

export function getToolByName(name: string): MCPToolDefinition | undefined {
  return tools.find(t => t.name === name);
}
