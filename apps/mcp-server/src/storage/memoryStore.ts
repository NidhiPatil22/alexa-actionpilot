import { Task, CalendarEvent, UserContext } from '../types.js';

export class MemoryStore {
  private tasks: Map<string, Task> = new Map();
  private events: Map<string, CalendarEvent> = new Map();
  private userContext: UserContext;

  constructor() {
    this.userContext = this.getInitialUserContext();
    this.seedInitialData();
  }

  private getInitialUserContext(): UserContext {
    return {
      userId: 'user_alexa_dev_01',
      name: 'Alex Parker',
      peakFocusHours: {
        start: '09:00',
        end: '12:00'
      },
      secondaryFocusHours: {
        start: '14:30',
        end: '16:30'
      },
      preferredFocusDurationMin: 90,
      breakDurationMin: 15,
      workHours: {
        start: '08:30',
        end: '18:00'
      },
      workDays: [1, 2, 3, 4, 5],
      activeGoal: 'Win Amazon Developer Hackathon with ActionPilot for Alexa+',
      learnedPreferences: {
        preferMorningDeepWork: true,
        avoidConsecutiveMeetings: true,
        cushionBeforeDeadlinesHours: 4,
        preferredTaskChunkMinutes: 45
      }
    };
  }

  private seedInitialData(): void {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const tmrw = new Date(now);
    tmrw.setUTCDate(tmrw.getUTCDate() + 1);
    const tmrwStr = tmrw.toISOString().split('T')[0];

    const dayAfter = new Date(now);
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    const in3Days = new Date(now);
    in3Days.setUTCDate(in3Days.getUTCDate() + 3);
    const in3DaysStr = in3Days.toISOString().split('T')[0];

    // Seed Tasks
    const initialTasks: Task[] = [
      {
        id: 'task-bedrock-01',
        title: 'Complete AWS Bedrock Agent Integration',
        description: 'Connect Bedrock Claude 3.5 Sonnet to ActionPilot remote MCP tools and test streamable HTTP.',
        deadline: `${todayStr}T17:00:00.000Z`,
        priority: 5,
        estimatedDuration: 90,
        energyLevel: 'deep_work',
        status: 'todo',
        tags: ['hackathon', 'aws', 'bedrock', 'mcp'],
        dependencies: [],
        consequenceRisk: 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task-cs-assignment',
        title: 'CS-504 Distributed Systems Assignment',
        description: 'Implement Paxos consensus simulation and write benchmarking report.',
        deadline: `${tmrwStr}T23:59:00.000Z`,
        priority: 4,
        estimatedDuration: 120,
        energyLevel: 'deep_work',
        status: 'todo',
        tags: ['academic', 'distributed-systems', 'assignment'],
        dependencies: [],
        consequenceRisk: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task-demo-slides',
        title: 'Prepare Slide Deck & Architecture Diagram',
        description: 'Build polished presentation slides explaining Alexa+ goal-to-action engine.',
        deadline: `${dayAfterStr}T15:00:00.000Z`,
        priority: 4,
        estimatedDuration: 45,
        energyLevel: 'shallow_work',
        status: 'todo',
        tags: ['hackathon', 'presentation'],
        dependencies: ['task-bedrock-01'],
        consequenceRisk: 'low',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task-mentor-review',
        title: 'Review Architecture Feedback with Mentor',
        description: 'Go over Streamable HTTP remote MCP architecture comments.',
        deadline: `${todayStr}T16:00:00.000Z`,
        priority: 3,
        estimatedDuration: 30,
        energyLevel: 'shallow_work',
        status: 'todo',
        tags: ['mentorship', 'feedback'],
        dependencies: [],
        consequenceRisk: 'low',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task-feedback-doc',
        title: 'Draft Hackathon Product Feedback Report',
        description: 'Summarize developer experience with Alexa+ MCP 2025-11-25 specifications.',
        deadline: `${in3DaysStr}T18:00:00.000Z`,
        priority: 3,
        estimatedDuration: 25,
        energyLevel: 'quick_win',
        status: 'todo',
        tags: ['documentation', 'feedback'],
        dependencies: [],
        consequenceRisk: 'low',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const t of initialTasks) {
      this.tasks.set(t.id, t);
    }

    // Seed Calendar Events
    const initialEvents: CalendarEvent[] = [
      {
        id: 'event-standup-today',
        title: 'Engineering Daily Standup',
        start: `${todayStr}T10:00:00.000Z`,
        end: `${todayStr}T10:30:00.000Z`,
        isFixed: true,
        type: 'meeting',
        description: 'Sync with core platform team.'
      },
      {
        id: 'event-alexa-sync-today',
        title: 'Alexa+ Architecture Sync',
        start: `${todayStr}T13:00:00.000Z`,
        end: `${todayStr}T14:00:00.000Z`,
        isFixed: true,
        type: 'meeting',
        description: 'Discussion on Remote MCP streamable transport.'
      },
      {
        id: 'event-flex-focus-tmrw',
        title: 'Flexible Focus Block: CS Prep',
        start: `${tmrwStr}T10:00:00.000Z`,
        end: `${tmrwStr}T11:30:00.000Z`,
        isFixed: false,
        type: 'focus_block',
        description: 'Movable time reservation.'
      },
      {
        id: 'event-lead-1on1-tmrw',
        title: 'Weekly 1:1 with Lead Architect',
        start: `${tmrwStr}T14:00:00.000Z`,
        end: `${tmrwStr}T15:00:00.000Z`,
        isFixed: true,
        type: 'meeting',
        description: 'Fixed non-movable review.'
      }
    ];

    for (const e of initialEvents) {
      this.events.set(e.id, e);
    }
  }

  // Task operations
  public getTasks(filter?: { status?: string; tag?: string }): Task[] {
    let list = Array.from(this.tasks.values());
    if (filter?.status) {
      list = list.filter(t => t.status === filter.status);
    }
    if (filter?.tag) {
      list = list.filter(t => t.tags.includes(filter.tag!));
    }
    return list;
  }

  public getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  public saveTask(task: Task): Task {
    task.updatedAt = new Date().toISOString();
    this.tasks.set(task.id, task);
    return task;
  }

  public deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  // Calendar operations
  public getEvents(startDate?: string, endDate?: string): CalendarEvent[] {
    let list = Array.from(this.events.values());
    if (startDate) {
      const s = new Date(startDate).getTime();
      list = list.filter(e => new Date(e.end).getTime() >= s);
    }
    if (endDate) {
      const ed = new Date(endDate).getTime();
      list = list.filter(e => new Date(e.start).getTime() <= ed);
    }
    return list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  public getEvent(id: string): CalendarEvent | undefined {
    return this.events.get(id);
  }

  public saveEvent(event: CalendarEvent): CalendarEvent {
    this.events.set(event.id, event);
    return event;
  }

  public deleteEvent(id: string): boolean {
    return this.events.delete(id);
  }

  // User context
  public getUserContext(): UserContext {
    return { ...this.userContext };
  }

  public updateUserPreference(key: string, value: any): UserContext {
    this.userContext.learnedPreferences[key] = value;
    return { ...this.userContext };
  }

  public resetToDefault(): void {
    this.tasks.clear();
    this.events.clear();
    this.userContext = this.getInitialUserContext();
    this.seedInitialData();
  }
}

export const memoryStore = new MemoryStore();
