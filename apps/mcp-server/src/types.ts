export type EnergyLevel = 'deep_work' | 'shallow_work' | 'quick_win';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'postponed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline: string; // ISO 8601 string
  priority: number; // 1 (lowest) to 5 (highest)
  estimatedDuration: number; // duration in minutes
  energyLevel: EnergyLevel;
  status: TaskStatus;
  tags: string[];
  scheduledSlot?: {
    start: string; // ISO 8601
    end: string;   // ISO 8601
  };
  dependencies: string[]; // task IDs that must be completed first
  consequenceRisk?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export type CalendarEventType = 'meeting' | 'focus_block' | 'personal' | 'deadline';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601
  end: string;   // ISO 8601
  isFixed: boolean; // cannot be rescheduled if true
  type: CalendarEventType;
  taskId?: string; // linked task if it's a focus block
  description?: string;
}

export interface UserContext {
  userId: string;
  name: string;
  peakFocusHours: {
    start: string; // e.g. "09:00"
    end: string;   // e.g. "12:00"
  };
  secondaryFocusHours?: {
    start: string; // e.g. "14:00"
    end: string;   // e.g. "16:30"
  };
  preferredFocusDurationMin: number; // e.g. 90
  breakDurationMin: number;          // e.g. 15
  workHours: {
    start: string; // e.g. "08:30"
    end: string;   // e.g. "18:00"
  };
  workDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  activeGoal?: string;
  learnedPreferences: {
    preferMorningDeepWork: boolean;
    avoidConsecutiveMeetings: boolean;
    cushionBeforeDeadlinesHours: number;
    preferredTaskChunkMinutes: number;
    [key: string]: any;
  };
}

export interface TimeSlot {
  start: string; // ISO 8601
  end: string;   // ISO 8601
  durationMinutes: number;
  energyFit: 'ideal' | 'moderate' | 'low';
}

export interface TaskPriorityScore {
  taskId: string;
  taskTitle: string;
  totalScore: number;
  components: {
    urgencyScore: number;       // Based on deadline proximity
    importanceScore: number;    // Based on user priority 1-5
    energyFitScore: number;     // Matches user peak focus time
    durationFitScore: number;   // Fits available slot
    dependencyPenalty: number;  // Blocked by dependencies
  };
  rank: number;
  urgencyLabel: 'critical' | 'high' | 'medium' | 'low';
}

export interface WorkloadReport {
  date: string;
  totalScheduledMinutes: number;
  totalFreeMinutes: number;
  taskDemandMinutes: number;
  capacityRatio: number; // demand / available free time (1.0 = 100% capacity)
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

export interface NextBestAction {
  recommendedTask: Task;
  confidenceScore: number; // 0 to 100
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

export interface ConflictDetail {
  eventId: string;
  title: string;
  start: string;
  end: string;
  isFixed: boolean;
  severity: 'warning' | 'critical';
  message: string;
}

export interface DeadlineBreach {
  taskId: string;
  title: string;
  deadline: string;
  newCompletionTime: string;
  delayMinutes: number;
}

export interface RippleEffect {
  affectedTaskId: string;
  affectedTitle: string;
  cascadeReason: string;
  suggestedRemedy: string;
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
  conflicts: ConflictDetail[];
  deadlineBreaches: DeadlineBreach[];
  rippleEffects: RippleEffect[];
  mitigationPlan?: string;
  explanationForAlexa: string;
  alternativeSlots: Array<{
    start: string;
    end: string;
    conflictFree: boolean;
    label: string;
  }>;
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
