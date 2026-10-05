import {
  Task,
  CalendarEvent,
  UserContext,
  NextBestAction,
  TimeSlot
} from '../types.js';
import { findFreeSlots } from './freeSlots.js';
import { rankTasks } from './priorityScorer.js';
import { analyzeWorkload } from './workloadAnalyzer.js';

export function determineNextBestAction(
  tasks: Task[],
  events: CalendarEvent[],
  userContext: UserContext,
  now: Date = new Date()
): NextBestAction {
  const todayStr = now.toISOString().split('T')[0];
  const tmrw = new Date(now);
  tmrw.setUTCDate(tmrw.getUTCDate() + 1);
  const tmrwStr = tmrw.toISOString().split('T')[0];

  // 1. Find free slots today and tomorrow
  const freeSlotsToday = findFreeSlots(events, todayStr, userContext, 20);
  const freeSlotsTmrw = findFreeSlots(events, tmrwStr, userContext, 30);
  const allFreeSlots = [...freeSlotsToday, ...freeSlotsTmrw];

  // 2. Rank tasks deterministically
  const rankedScores = rankTasks(tasks, now, allFreeSlots, userContext);
  const activeTasks = tasks.filter(t => t.status !== 'completed');

  if (activeTasks.length === 0 || rankedScores.length === 0) {
    return {
      recommendedTask: {
        id: 'no-tasks',
        title: 'All caught up!',
        deadline: new Date().toISOString(),
        priority: 1,
        estimatedDuration: 0,
        energyLevel: 'quick_win',
        status: 'completed',
        tags: [],
        dependencies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      confidenceScore: 100,
      recommendedSlot: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        formattedTime: 'Anytime'
      },
      reasoning: 'You have completed all pending tasks. Take a well-deserved break or brainstorm new project ideas.',
      alternativeTasks: [],
      factors: {
        urgency: 0,
        importance: 0,
        energyFit: 100,
        slotFit: 100,
        workloadPressure: 0
      },
      explanationForAlexa: 'You have no pending tasks right now. Great job!'
    };
  }

  // 3. Select top eligible task
  const topScore = rankedScores[0];
  const topTask = activeTasks.find(t => t.id === topScore.taskId)!;

  // 4. Find best slot for this task
  let chosenSlot: TimeSlot | undefined;
  // Look for a slot today that fits the task duration
  chosenSlot = freeSlotsToday.find(s => s.durationMinutes >= topTask.estimatedDuration);

  // If no single slot fits today, look for any slot >= 45m today
  if (!chosenSlot && freeSlotsToday.length > 0) {
    chosenSlot = freeSlotsToday[0];
  }

  // If still no slot today, take tomorrow's peak slot
  if (!chosenSlot && freeSlotsTmrw.length > 0) {
    chosenSlot = freeSlotsTmrw.find(s => s.energyFit === 'ideal') || freeSlotsTmrw[0];
  }

  // Fallback to 1 hour from now if calendar is completely packed
  const defaultSlotStart = new Date(now.getTime() + 15 * 60 * 1000);
  const defaultSlotEnd = new Date(defaultSlotStart.getTime() + topTask.estimatedDuration * 60 * 1000);

  const slotStartStr = chosenSlot ? chosenSlot.start : defaultSlotStart.toISOString();
  const slotEndStr = chosenSlot
    ? new Date(new Date(chosenSlot.start).getTime() + topTask.estimatedDuration * 60 * 1000).toISOString()
    : defaultSlotEnd.toISOString();

  const formattedTime = `${formatDate(slotStartStr)} from ${formatTime(slotStartStr)} to ${formatTime(slotEndStr)}`;

  // 5. Workload analysis context
  const workload = analyzeWorkload(tasks, events, todayStr, userContext, now);

  // 6. Transparent reasoning formulation
  const deadlineHours = Math.round((new Date(topTask.deadline).getTime() - now.getTime()) / (1000 * 60 * 60));
  const deadlineNotice =
    deadlineHours <= 24
      ? `due in ${deadlineHours} hours`
      : `due on ${formatDate(topTask.deadline)}`;

  const reasoning = `Prioritized "${topTask.title}" (Priority ${topTask.priority}/5) because it is ${deadlineNotice}, requires ${topTask.estimatedDuration}m of ${topTask.energyLevel.replace('_', ' ')}, and matches an open focus window from ${formatTime(slotStartStr)} to ${formatTime(slotEndStr)}.`;

  const explanationForAlexa = `I recommend working on ${topTask.title}. It is ${deadlineNotice}, and you have an open ${topTask.estimatedDuration}-minute focus block starting at ${formatTime(slotStartStr)}. Would you like me to book it?`;

  // 7. Alternatives
  const alternativeTasks = rankedScores.slice(1, 4).map(score => {
    const altTask = activeTasks.find(t => t.id === score.taskId)!;
    let reasonSkipped = '';
    if (score.components.dependencyPenalty > 0) {
      reasonSkipped = 'Waiting on prerequisite tasks';
    } else if (score.components.urgencyScore < topScore.components.urgencyScore) {
      reasonSkipped = 'Deadline is further out';
    } else {
      reasonSkipped = 'Lower priority weighting';
    }
    return {
      id: altTask.id,
      title: altTask.title,
      priority: altTask.priority,
      reasonSkipped
    };
  });

  return {
    recommendedTask: topTask,
    confidenceScore: Math.min(98, Math.max(75, topScore.totalScore)),
    recommendedSlot: {
      start: slotStartStr,
      end: slotEndStr,
      formattedTime
    },
    reasoning,
    alternativeTasks,
    factors: {
      urgency: topScore.components.urgencyScore,
      importance: topScore.components.importanceScore,
      energyFit: topScore.components.energyFitScore,
      slotFit: topScore.components.durationFitScore,
      workloadPressure: Math.round(workload.capacityRatio * 50)
    },
    explanationForAlexa
  };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
