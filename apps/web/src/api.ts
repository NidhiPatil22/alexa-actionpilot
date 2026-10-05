import {
  Task,
  CalendarEvent,
  WorkloadReport,
  NextBestAction,
  ConsequenceAnalysis,
  AlexaAgentResponse,
  UserContext
} from './types';

const API_BASE = ''; // proxied via Vite to http://localhost:3001

export async function fetchTasks(status?: string): Promise<Task[]> {
  const url = status ? `${API_BASE}/api/tasks?status=${status}` : `${API_BASE}/api/tasks`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  const data = await res.json();
  return data.tasks || [];
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  if (!res.ok) throw new Error('Failed to create task');
  const data = await res.json();
  return data.task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update task');
  const data = await res.json();
  return data.task;
}

export async function completeTask(id: string): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/tasks/${id}/complete`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to complete task');
  const data = await res.json();
  return data.task;
}

export async function fetchCalendar(): Promise<CalendarEvent[]> {
  const res = await fetch(`${API_BASE}/api/calendar`);
  if (!res.ok) throw new Error('Failed to fetch calendar');
  const data = await res.json();
  return data.events || [];
}

export async function fetchWorkload(date?: string): Promise<WorkloadReport> {
  const url = date ? `${API_BASE}/api/workload?date=${date}` : `${API_BASE}/api/workload`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch workload');
  const data = await res.json();
  return data.report;
}

export async function fetchNextBestAction(): Promise<NextBestAction> {
  const res = await fetch(`${API_BASE}/api/next-best-action`);
  if (!res.ok) throw new Error('Failed to fetch next best action');
  const data = await res.json();
  return data.action;
}

export async function simulateConsequences(taskId: string, proposedDateOrTime: string): Promise<ConsequenceAnalysis> {
  const res = await fetch(`${API_BASE}/api/analyze-consequences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, proposedDateOrTime })
  });
  if (!res.ok) throw new Error('Failed to analyze consequences');
  const data = await res.json();
  return data.analysis;
}

export async function fetchUserContext(): Promise<UserContext> {
  const res = await fetch(`${API_BASE}/api/context`);
  if (!res.ok) throw new Error('Failed to fetch user context');
  const data = await res.json();
  return data.context;
}

export async function saveUserPreference(key: string, value: any): Promise<UserContext> {
  const res = await fetch(`${API_BASE}/api/context/preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value })
  });
  if (!res.ok) throw new Error('Failed to save preference');
  const data = await res.json();
  return data.context;
}

export async function sendAlexaQuery(query: string): Promise<AlexaAgentResponse> {
  const res = await fetch(`${API_BASE}/api/alexa/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Failed to process Alexa query');
  return await res.json();
}

export async function resetDemoData(): Promise<void> {
  await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
}

export async function fetchMcpTools(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/mcp-tools`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.tools || [];
}
