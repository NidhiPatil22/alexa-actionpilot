import { Task, TaskPriorityScore, UserContext, TimeSlot } from '../types.js';

export function calculateTaskPriority(
  task: Task,
  allTasks: Task[],
  now: Date,
  availableSlots: TimeSlot[] = [],
  context?: UserContext
): TaskPriorityScore {
  const deadlineDate = new Date(task.deadline);
  const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // 1. Urgency score (0 - 100)
  let urgencyScore = 0;
  let urgencyLabel: 'critical' | 'high' | 'medium' | 'low' = 'low';

  if (diffHours <= 0) {
    urgencyScore = 100; // Overdue
    urgencyLabel = 'critical';
  } else if (diffHours <= 12) {
    urgencyScore = 95;
    urgencyLabel = 'critical';
  } else if (diffHours <= 24) {
    urgencyScore = 85;
    urgencyLabel = 'high';
  } else if (diffHours <= 48) {
    urgencyScore = 65;
    urgencyLabel = 'high';
  } else if (diffHours <= 72) {
    urgencyScore = 45;
    urgencyLabel = 'medium';
  } else if (diffHours <= 168) {
    urgencyScore = 30;
    urgencyLabel = 'medium';
  } else {
    urgencyScore = 15;
    urgencyLabel = 'low';
  }

  // 2. Importance score (0 - 100)
  // Priority 1-5 -> 20, 40, 60, 80, 100
  const importanceScore = Math.min(100, Math.max(20, task.priority * 20));

  // 3. Energy fit score (0 - 100)
  let energyFitScore = 70;
  const currentHour = now.getUTCHours();
  const isPeakHours = context
    ? currentHour >= parseInt(context.peakFocusHours.start) &&
      currentHour < parseInt(context.peakFocusHours.end)
    : currentHour >= 9 && currentHour < 12;

  if (task.energyLevel === 'deep_work') {
    energyFitScore = isPeakHours ? 100 : 60;
  } else if (task.energyLevel === 'quick_win') {
    energyFitScore = 90; // Quick wins can fit anywhere
  } else {
    // shallow_work
    energyFitScore = !isPeakHours ? 90 : 60;
  }

  // 4. Duration fit score (0 - 100)
  let durationFitScore = 70;
  if (availableSlots.length > 0) {
    // Find closest slot
    const suitableSlot = availableSlots.find(s => s.durationMinutes >= task.estimatedDuration);
    if (suitableSlot) {
      durationFitScore = 100;
      if (suitableSlot.energyFit === 'ideal' && task.energyLevel === 'deep_work') {
        durationFitScore = 105;
      }
    } else {
      // Must be split up
      durationFitScore = 50;
    }
  }

  // 5. Dependency penalty
  let dependencyPenalty = 0;
  if (task.dependencies && task.dependencies.length > 0) {
    const uncompletedDeps = allTasks.filter(
      t => task.dependencies.includes(t.id) && t.status !== 'completed'
    );
    if (uncompletedDeps.length > 0) {
      dependencyPenalty = 60 * uncompletedDeps.length;
    }
  }

  // Weighted total: Urgency (40%) + Importance (30%) + EnergyFit (15%) + DurationFit (15%) - Penalty
  const rawScore =
    urgencyScore * 0.40 +
    importanceScore * 0.30 +
    energyFitScore * 0.15 +
    durationFitScore * 0.15 -
    dependencyPenalty;

  const totalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    taskId: task.id,
    taskTitle: task.title,
    totalScore,
    components: {
      urgencyScore: Math.round(urgencyScore),
      importanceScore: Math.round(importanceScore),
      energyFitScore: Math.round(energyFitScore),
      durationFitScore: Math.round(durationFitScore),
      dependencyPenalty: Math.round(dependencyPenalty)
    },
    rank: 0, // Assigned after sorting
    urgencyLabel
  };
}

export function rankTasks(
  tasks: Task[],
  now: Date,
  availableSlots: TimeSlot[] = [],
  context?: UserContext
): TaskPriorityScore[] {
  // Only score active tasks
  const activeTasks = tasks.filter(t => t.status !== 'completed');

  const scores = activeTasks.map(t =>
    calculateTaskPriority(t, tasks, now, availableSlots, context)
  );

  scores.sort((a, b) => b.totalScore - a.totalScore);

  return scores.map((s, idx) => ({
    ...s,
    rank: idx + 1
  }));
}
