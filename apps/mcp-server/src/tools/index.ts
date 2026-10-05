import { dataStore } from '../storage/index.js';
import { findFreeSlots } from '../engine/freeSlots.js';
import { rankTasks } from '../engine/priorityScorer.js';
import { analyzeWorkload } from '../engine/workloadAnalyzer.js';
import { determineNextBestAction } from '../engine/nextBestAction.js';
import { analyzeConsequences } from '../engine/consequenceEngine.js';
import { Task, CalendarEvent } from '../types.js';

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
    description: 'Retrieve user tasks, optionally filtered by status (todo, completed, in_progress) or tag.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['todo', 'in_progress', 'completed', 'postponed'] },
        tag: { type: 'string' }
      }
    },
    handler: async (args) => {
      const tasks = await dataStore.getTasks({ status: args?.status, tag: args?.tag });
      return {
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
    description: 'Retrieve calendar events and focus blocks for a specific time range.',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'Start date ISO string' },
        endDate: { type: 'string', description: 'End date ISO string' }
      }
    },
    handler: async (args) => {
      const events = await dataStore.getEvents(args?.startDate, args?.endDate);
      return {
        count: events.length,
        events
      };
    }
  },

  // 6. find_free_slots
  {
    name: 'find_free_slots',
    description: 'Deterministically calculate free, uninterrupted time slots for a given day.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD or "today" / "tomorrow"' },
        minDurationMinutes: { type: 'number', description: 'Minimum duration in minutes (default 30)' }
      }
    },
    handler: async (args) => {
      const context = await dataStore.getUserContext();
      const events = await dataStore.getEvents();
      let targetDate = args?.date || 'today';
      const now = new Date();

      if (targetDate === 'today') {
        targetDate = now.toISOString().split('T')[0];
      } else if (targetDate === 'tomorrow') {
        const tmrw = new Date(now);
        tmrw.setUTCDate(tmrw.getUTCDate() + 1);
        targetDate = tmrw.toISOString().split('T')[0];
      }

      const slots = findFreeSlots(events, targetDate, context, args?.minDurationMinutes || 30);
      return {
        date: targetDate,
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
    description: 'Evaluates user goals, tasks, deadlines, and schedule to recommend the single Next Best Action with full explainability.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const tasks = await dataStore.getTasks();
      const events = await dataStore.getEvents();
      const context = await dataStore.getUserContext();
      const now = new Date();
      const nextAction = determineNextBestAction(tasks, events, context, now);
      return nextAction;
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
