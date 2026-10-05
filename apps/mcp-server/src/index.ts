import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createMCPRouter } from './mcp/streamableHttp.js';
import { dataStore, memoryStore } from './storage/index.js';
import { determineNextBestAction } from './engine/nextBestAction.js';
import { analyzeConsequences } from './engine/consequenceEngine.js';
import { analyzeWorkload } from './engine/workloadAnalyzer.js';
import { alexaOrchestrator } from './agent/alexaOrchestrator.js';
import { tools } from './tools/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check for AWS ALB / ECS Fargate
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'actionpilot-mcp-server',
    spec: 'MCP 2025-11-25',
    transport: 'streamable-http',
    timestamp: new Date().toISOString()
  });
});

// Mount MCP 2025-11-25 Streamable HTTP & SSE router
app.use(createMCPRouter());

// REST API for Web Dashboard & Demonstrations
app.get('/api/tasks', async (req: Request, res: Response) => {
  try {
    const tasks = await dataStore.getTasks({
      status: req.query.status as string,
      tag: req.query.tag as string
    });
    res.json({ tasks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    const { title, deadline, priority, estimatedDuration, energyLevel, tags, dependencies, description } = req.body;
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title || 'Untitled Task',
      description: description || '',
      deadline: deadline || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      priority: Number(priority) || 3,
      estimatedDuration: Number(estimatedDuration) || 45,
      energyLevel: energyLevel || 'deep_work',
      status: 'todo' as const,
      tags: tags || [],
      dependencies: dependencies || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const saved = await dataStore.saveTask(task);
    res.status(201).json({ task: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tasks/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const task = await dataStore.getTask(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    Object.assign(task, req.body);
    const updated = await dataStore.saveTask(task);
    res.json({ task: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/complete', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const task = await dataStore.getTask(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.status = 'completed';
    const updated = await dataStore.saveTask(task);
    res.json({ success: true, task: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/calendar', async (req: Request, res: Response) => {
  try {
    const events = await dataStore.getEvents(req.query.startDate as string, req.query.endDate as string);
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/calendar', async (req: Request, res: Response) => {
  try {
    const { title, start, end, isFixed, type, taskId, description } = req.body;
    const event = {
      id: `event-${Date.now()}`,
      title,
      start,
      end,
      isFixed: !!isFixed,
      type: type || 'meeting',
      taskId,
      description
    };
    const saved = await dataStore.saveEvent(event);
    res.status(201).json({ event: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workload', async (req: Request, res: Response) => {
  try {
    const tasks = await dataStore.getTasks();
    const events = await dataStore.getEvents();
    const context = await dataStore.getUserContext();
    const now = new Date();
    const dateStr = (req.query.date as string) || now.toISOString().split('T')[0];
    const report = analyzeWorkload(tasks, events, dateStr, context, now);
    res.json({ report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/next-best-action', async (req: Request, res: Response) => {
  try {
    const tasks = await dataStore.getTasks();
    const events = await dataStore.getEvents();
    const context = await dataStore.getUserContext();
    const now = new Date();
    const action = determineNextBestAction(tasks, events, context, now);
    res.json({ action });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analyze-consequences', async (req: Request, res: Response) => {
  try {
    const { taskId, proposedDateOrTime } = req.body;
    const tasks = await dataStore.getTasks();
    const events = await dataStore.getEvents();
    const context = await dataStore.getUserContext();
    const now = new Date();
    const analysis = analyzeConsequences(taskId, proposedDateOrTime, tasks, events, context, now);
    res.json({ analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/context', async (req: Request, res: Response) => {
  try {
    const context = await dataStore.getUserContext();
    res.json({ context });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/context/preference', async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    const updated = await dataStore.updateUserPreference(key, value);
    res.json({ context: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alexa/query', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }
    const response = await alexaOrchestrator.handleAlexaQuery(query);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/mcp-tools', (req: Request, res: Response) => {
  const toolList = tools.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema
  }));
  res.json({ tools: toolList });
});

app.post('/api/reset', (req: Request, res: Response) => {
  memoryStore.resetToDefault();
  res.json({ success: true, message: 'Demo data store reset to default.' });
});

app.listen(PORT, () => {
  console.log(`🚀 [ActionPilot MCP Server] Running on http://localhost:${PORT}`);
  console.log(`📡 [MCP Protocol] Streamable HTTP endpoint at http://localhost:${PORT}/mcp`);
  console.log(`📡 [MCP Protocol] SSE stream endpoint at http://localhost:${PORT}/sse`);
  console.log(`⚡ [Health Check] http://localhost:${PORT}/health`);
});
