import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { AlexaVoiceBar } from './components/AlexaVoiceBar';
import { NextBestActionHero } from './components/NextBestActionHero';
import { ConsequenceSimulator } from './components/ConsequenceSimulator';
import { CalendarTimeline } from './components/CalendarTimeline';
import { WorkloadRadar } from './components/WorkloadRadar';
import { TaskMatrix } from './components/TaskMatrix';
import { McpStreamableInspector } from './components/McpStreamableInspector';
import { NewTaskModal } from './components/NewTaskModal';
import { PreferencesModal } from './components/PreferencesModal';

import {
  fetchTasks,
  fetchCalendar,
  fetchWorkload,
  fetchNextBestAction,
  simulateConsequences,
  sendAlexaQuery,
  createTask,
  completeTask,
  resetDemoData,
  fetchMcpTools,
  fetchUserContext,
  saveUserPreference
} from './api';

import {
  Task,
  CalendarEvent,
  WorkloadReport,
  NextBestAction,
  ConsequenceAnalysis,
  AlexaAgentResponse,
  UserContext,
  MCPEventLog,
  EnergyLevel
} from './types';

export const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [workload, setWorkload] = useState<WorkloadReport | null>(null);
  const [nextAction, setNextAction] = useState<NextBestAction | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [mcpTools, setMcpTools] = useState<any[]>([]);

  // Simulation & Alexa state
  const [latestAlexaResponse, setLatestAlexaResponse] = useState<AlexaAgentResponse | null>(null);
  const [latestConsequence, setLatestConsequence] = useState<ConsequenceAnalysis | null>(null);
  const [mcpLogs, setMcpLogs] = useState<MCPEventLog[]>([]);

  // Loading & modal states
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Load all dashboard state
  const refreshAllData = useCallback(async () => {
    try {
      const [fetchedTasks, fetchedEvents, fetchedWorkload, fetchedAction, fetchedContext, fetchedTools] =
        await Promise.all([
          fetchTasks(),
          fetchCalendar(),
          fetchWorkload(),
          fetchNextBestAction(),
          fetchUserContext(),
          fetchMcpTools()
        ]);

      setTasks(fetchedTasks);
      setEvents(fetchedEvents);
      setWorkload(fetchedWorkload);
      setNextAction(fetchedAction);
      setUserContext(fetchedContext);
      setMcpTools(fetchedTools);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    refreshAllData();

    // Connect to SSE stream for live MCP monitoring
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/sse');
      eventSource.addEventListener('mcp_tool_executed', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          setMcpLogs((prev) => [
            {
              id: `log-${Date.now()}-${Math.random()}`,
              type: 'tool_result',
              toolName: parsed.tool,
              timestamp: parsed.timestamp,
              payload: parsed.args
            },
            ...prev.slice(0, 19)
          ]);
        } catch {
          // ignore
        }
      });
    } catch (err) {
      console.warn('SSE connection error:', err);
    }

    return () => {
      eventSource?.close();
    };
  }, [refreshAllData]);

  // Handle conversational query from Alexa bar
  const handleAlexaQuery = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await sendAlexaQuery(query);
      setLatestAlexaResponse(response);

      // If consequence was computed, surface it to simulator
      if (response.consequenceAnalysis) {
        setLatestConsequence(response.consequenceAnalysis);
      }
      // If action was updated, surface it
      if (response.nextBestAction) {
        setNextAction(response.nextBestAction);
      }

      // Add to inspector log
      if (response.toolsExecuted) {
        for (const t of response.toolsExecuted) {
          setMcpLogs((prev) => [
            {
              id: `log-${Date.now()}-${Math.random()}`,
              type: 'tool_call',
              toolName: t.tool,
              timestamp: new Date().toISOString(),
              payload: t.input
            },
            ...prev.slice(0, 19)
          ]);
        }
      }

      await refreshAllData();
      return response;
    } catch (err) {
      console.error('Alexa query error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle consequence simulation in sandbox
  const handleSimulateConsequences = async (taskId: string, proposedDateOrTime: string) => {
    setIsLoading(true);
    try {
      const analysis = await simulateConsequences(taskId, proposedDateOrTime);
      setLatestConsequence(analysis);
      setMcpLogs((prev) => [
        {
          id: `log-${Date.now()}-${Math.random()}`,
          type: 'tool_call',
          toolName: 'analyze_consequences',
          timestamp: new Date().toISOString(),
          payload: { taskId, proposedDateOrTime }
        },
        ...prev.slice(0, 19)
      ]);
      return analysis;
    } catch (err) {
      console.error('Consequence simulation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle booking of focus slot
  const handleBookSlot = async (taskId: string, title: string, start: string, end: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'create_focus_block',
            arguments: { taskId, title, start, end }
          }
        })
      });
      await res.json();
      await refreshAllData();
    } catch (err) {
      console.error('Failed to book slot:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply safe cascade mitigation
  const handleApplyMitigation = async (taskId: string, targetSlot: { start: string; end: string }) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    await handleBookSlot(taskId, `Focus: ${task.title}`, targetSlot.start, targetSlot.end);
    setLatestConsequence(null);
  };

  // Handle completing a task
  const handleCompleteTask = async (id: string) => {
    setIsLoading(true);
    try {
      await completeTask(id);
      await refreshAllData();
    } catch (err) {
      console.error('Failed to complete task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new task
  const handleCreateTask = async (newTaskData: {
    title: string;
    description: string;
    deadline: string;
    priority: number;
    estimatedDuration: number;
    energyLevel: EnergyLevel;
    tags: string[];
  }) => {
    try {
      await createTask(newTaskData);
      await refreshAllData();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // Save preference
  const handleSavePreference = async (key: string, value: any) => {
    try {
      const updated = await saveUserPreference(key, value);
      setUserContext(updated);
      await refreshAllData();
    } catch (err) {
      console.error('Failed to save preference:', err);
    }
  };

  // Reset to demo baseline
  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await resetDemoData();
      setLatestAlexaResponse(null);
      setLatestConsequence(null);
      setMcpLogs([]);
      await refreshAllData();
    } catch (err) {
      console.error('Failed to reset demo data:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col font-sans">
      <Header
        onReset={handleResetDemo}
        onOpenNewTask={() => setIsNewTaskOpen(true)}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        isResetting={isResetting}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {/* Alexa Conversational Voice Simulation Bar */}
        <AlexaVoiceBar
          onSendQuery={handleAlexaQuery}
          isLoading={isLoading}
          latestResponse={latestAlexaResponse}
        />

        {/* Next Best Action Flagship Hero */}
        <NextBestActionHero
          action={nextAction}
          onBookSlot={handleBookSlot}
          isBooking={isLoading}
        />

        {/* Consequence Simulator Sandbox */}
        <ConsequenceSimulator
          tasks={tasks}
          onSimulate={handleSimulateConsequences}
          onApplyMitigation={handleApplyMitigation}
          isLoading={isLoading}
          latestAnalysis={latestConsequence}
        />

        {/* Schedule & Workload Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          <div className="lg:col-span-7">
            <CalendarTimeline events={events} />
          </div>
          <div className="lg:col-span-5">
            <WorkloadRadar report={workload} />
          </div>
        </div>

        {/* Task Matrix */}
        <TaskMatrix
          tasks={tasks}
          onCompleteTask={handleCompleteTask}
          onSelectForSimulation={(taskId) => {
            const task = tasks.find((t) => t.id === taskId);
            if (task) {
              handleSimulateConsequences(taskId, 'tomorrow');
            }
          }}
          isProcessing={isLoading}
        />

        {/* Live MCP Streamable HTTP Protocol Inspector */}
        <McpStreamableInspector logs={mcpLogs} registeredTools={mcpTools} />
      </main>

      {/* Modals */}
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onCreateTask={handleCreateTask}
      />

      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        context={userContext}
        onSavePreference={handleSavePreference}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-6 px-4 lg:px-8 text-center text-xs font-mono text-slate-500 bg-obsidian-950/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            ActionPilot • The Next-Best-Action Engine for Alexa+ • Amazon Developer Hackathon 2026
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Remote MCP 2025-11-25</span>
            <span>•</span>
            <span>Amazon Bedrock</span>
            <span>•</span>
            <span>Streamable HTTP</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
