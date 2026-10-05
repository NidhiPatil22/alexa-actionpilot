import { describe, it, expect } from 'vitest';
import { findFreeSlots } from '../freeSlots.js';
import { calculateTaskPriority, rankTasks } from '../priorityScorer.js';
import { analyzeConsequences } from '../consequenceEngine.js';
import { analyzeWorkload } from '../workloadAnalyzer.js';
import { determineNextBestAction } from '../nextBestAction.js';
import { Task, CalendarEvent, UserContext } from '../../types.js';

const mockContext: UserContext = {
  userId: 'test-user',
  name: 'Test Pilot',
  peakFocusHours: { start: '09:00', end: '12:00' },
  secondaryFocusHours: { start: '14:00', end: '16:00' },
  preferredFocusDurationMin: 60,
  breakDurationMin: 15,
  workHours: { start: '09:00', end: '17:00' },
  workDays: [1, 2, 3, 4, 5],
  learnedPreferences: {
    preferMorningDeepWork: true,
    avoidConsecutiveMeetings: true,
    cushionBeforeDeadlinesHours: 2,
    preferredTaskChunkMinutes: 45
  }
};

const baseDateStr = '2026-10-06';
const mockNow = new Date(`${baseDateStr}T08:00:00.000Z`);

const mockEvents: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Morning Standup',
    start: `${baseDateStr}T09:30:00.000Z`,
    end: `${baseDateStr}T10:00:00.000Z`,
    isFixed: true,
    type: 'meeting'
  },
  {
    id: 'e2',
    title: 'Lunch Sync',
    start: `${baseDateStr}T12:00:00.000Z`,
    end: `${baseDateStr}T13:00:00.000Z`,
    isFixed: true,
    type: 'meeting'
  }
];

const mockTasks: Task[] = [
  {
    id: 't1',
    title: 'Urgent Client Deliverable',
    deadline: `${baseDateStr}T15:00:00.000Z`,
    priority: 5,
    estimatedDuration: 60,
    energyLevel: 'deep_work',
    status: 'todo',
    tags: ['client'],
    dependencies: [],
    createdAt: mockNow.toISOString(),
    updatedAt: mockNow.toISOString()
  },
  {
    id: 't2',
    title: 'Code Refactoring',
    deadline: '2026-10-10T17:00:00.000Z',
    priority: 2,
    estimatedDuration: 90,
    energyLevel: 'shallow_work',
    status: 'todo',
    tags: ['dev'],
    dependencies: [],
    createdAt: mockNow.toISOString(),
    updatedAt: mockNow.toISOString()
  },
  {
    id: 't3',
    title: 'Dependent QA Verification',
    deadline: `${baseDateStr}T18:00:00.000Z`,
    priority: 4,
    estimatedDuration: 30,
    energyLevel: 'quick_win',
    status: 'todo',
    tags: ['qa'],
    dependencies: ['t1'],
    createdAt: mockNow.toISOString(),
    updatedAt: mockNow.toISOString()
  }
];

describe('ActionPilot Deterministic Scheduling Engine', () => {
  it('1. findFreeSlots finds gaps within working hours and respects buffer padding', () => {
    const slots = findFreeSlots(mockEvents, baseDateStr, mockContext, 30, 10);
    expect(slots.length).toBeGreaterThan(0);
    // There should be a slot between standup end (+ buffer) and lunch start (- buffer)
    const midSlot = slots.find(s => s.start.includes('T10:10') || new Date(s.start).getUTCHours() === 10);
    expect(midSlot).toBeDefined();
    expect(midSlot!.durationMinutes).toBeGreaterThanOrEqual(30);
  });

  it('2. priorityScorer ranks urgent high-importance tasks first', () => {
    const slots = findFreeSlots(mockEvents, baseDateStr, mockContext);
    const ranked = rankTasks(mockTasks, mockNow, slots, mockContext);
    expect(ranked[0].taskId).toBe('t1');
    expect(ranked[0].totalScore).toBeGreaterThan(ranked[1].totalScore);
    expect(ranked[0].urgencyLabel).toBe('critical');
  });

  it('3. priorityScorer penalizes tasks with uncompleted dependencies', () => {
    const slots = findFreeSlots(mockEvents, baseDateStr, mockContext);
    const score = calculateTaskPriority(mockTasks[2], mockTasks, mockNow, slots, mockContext);
    expect(score.components.dependencyPenalty).toBeGreaterThan(0);
  });

  it('4. consequenceEngine detects deadline breach when task is postponed', () => {
    const consequence = analyzeConsequences('t1', '2026-10-07T10:00:00.000Z', mockTasks, mockEvents, mockContext, mockNow);
    expect(consequence.isFeasible).toBe(false);
    expect(consequence.impactSeverity).toBe('critical');
    expect(consequence.deadlineBreaches.length).toBeGreaterThan(0);
    expect(consequence.deadlineBreaches[0].taskId).toBe('t1');
  });

  it('5. consequenceEngine detects cascading ripple effects on dependent tasks', () => {
    // When t1 is moved to 17:00 (ends at 18:00), t3 (deadline 18:00, requires 30m) cannot finish in time
    const consequence = analyzeConsequences('t1', `${baseDateStr}T17:00:00.000Z`, mockTasks, mockEvents, mockContext, mockNow);
    expect(consequence.rippleEffects.length).toBeGreaterThan(0);
    expect(consequence.rippleEffects.some(r => r.affectedTaskId === 't3')).toBe(true);
  });

  it('6. workloadAnalyzer calculates stress level and capacity ratio', () => {
    const workload = analyzeWorkload(mockTasks, mockEvents, baseDateStr, mockContext, mockNow);
    expect(workload.totalScheduledMinutes).toBe(90); // 30m standup + 60m lunch
    expect(workload.totalFreeMinutes).toBeGreaterThan(0);
    expect(workload.deadlineDistribution).toBeDefined();
    expect(['low', 'moderate', 'high', 'critical']).toContain(workload.stressLevel);
  });

  it('7. determineNextBestAction selects best action with slot recommendation and explainability', () => {
    const nba = determineNextBestAction(mockTasks, mockEvents, mockContext, mockNow);
    expect(nba.recommendedTask.id).toBe('t1');
    expect(nba.confidenceScore).toBeGreaterThanOrEqual(70);
    expect(nba.reasoning).toContain('Urgent Client Deliverable');
    expect(nba.explanationForAlexa).toBeDefined();
    expect(nba.recommendedSlot.start).toBeDefined();
  });
});
