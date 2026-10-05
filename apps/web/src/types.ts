export type EnergyLevel = 'deep_work' | 'shallow_work' | 'quick_win';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'postponed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  priority: number;
  estimatedDuration: number;
  energyLevel: EnergyLevel;
  status: TaskStatus;
  tags: string[];
  scheduledSlot?: {
    start: string;
    end: string;
  };
  dependencies: string[];
  consequenceRisk?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isFixed: boolean;
  type: 'meeting' | 'focus_block' | 'personal' | 'deadline';
  taskId?: string;
  description?: string;
}

export interface UserContext {
  userId: string;
  name: string;
  peakFocusHours: {
    start: string;
    end: string;
  };
  secondaryFocusHours?: {
    start: string;
    end: string;
  };
  preferredFocusDurationMin: number;
  breakDurationMin: number;
  workHours: {
    start: string;
    end: string;
  };
  workDays: number[];
  activeGoal?: string;
  learnedPreferences: {
    preferMorningDeepWork: boolean;
    avoidConsecutiveMeetings: boolean;
    cushionBeforeDeadlinesHours: number;
    preferredTaskChunkMinutes: number;
    [key: string]: any;
  };
}

export interface NextBestAction {
  recommendedTask: Task;
  confidenceScore: number;
  recommendedSlot: {
    start: string;
    end: string;
    formattedTime: string;
  };
  reasoning: string;
  alternativeTasks: Array<{
    id: string;
    title: string;
    priority: number;
    reasonSkipped: string;
  }>;
  factors: {
    urgency: number;
    importance: number;
    energyFit: number;
    slotFit: number;
    workloadPressure: number;
  };
  explanationForAlexa: string;
}

export interface ConsequenceAnalysis {
  proposedChange: {
    taskId: string;
    taskTitle: string;
    proposedDateOrTime: string;
    targetSlot?: {
      start: string;
      end: string;
    };
  };
  isFeasible: boolean;
  impactSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  conflicts: Array<{
    eventId: string;
    title: string;
    start: string;
    end: string;
    isFixed: boolean;
    severity: 'warning' | 'critical';
    message: string;
  }>;
  deadlineBreaches: Array<{
    taskId: string;
    title: string;
    deadline: string;
    newCompletionTime: string;
    delayMinutes: number;
  }>;
  rippleEffects: Array<{
    affectedTaskId: string;
    affectedTitle: string;
    cascadeReason: string;
    suggestedRemedy: string;
  }>;
  mitigationPlan?: string;
  explanationForAlexa: string;
  alternativeSlots: Array<{
    start: string;
    end: string;
    conflictFree: boolean;
    label: string;
  }>;
}

export interface WorkloadReport {
  date: string;
  totalScheduledMinutes: number;
  totalFreeMinutes: number;
  taskDemandMinutes: number;
  capacityRatio: number;
  stressLevel: 'low' | 'moderate' | 'high' | 'critical';
  deadlineDistribution: {
    today: number;
    tomorrow: number;
    within3Days: number;
    withinWeek: number;
    later: number;
  };
  recommendations: string[];
}

export interface AlexaAgentResponse {
  query: string;
  intent: string;
  speechResponse: string;
  reasoningChain: string[];
  toolsExecuted: Array<{
    tool: string;
    input: any;
    output: any;
  }>;
  actionTaken?: {
    type: 'recommendation' | 'scheduled_block' | 'rescheduled' | 'consequence_analysis' | 'status';
    data: any;
  };
  nextBestAction?: NextBestAction;
  consequenceAnalysis?: ConsequenceAnalysis;
}

export interface MCPEventLog {
  id: string;
  type: 'request' | 'tool_call' | 'tool_result' | 'error';
  toolName?: string;
  timestamp: string;
  payload: any;
}
