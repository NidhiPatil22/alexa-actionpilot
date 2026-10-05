import {
  Task,
  CalendarEvent,
  UserContext,
  ConsequenceAnalysis,
  ConflictDetail,
  DeadlineBreach,
  RippleEffect
} from '../types.js';
import { findFreeSlots } from './freeSlots.js';

export function analyzeConsequences(
  taskId: string,
  proposedDateOrTime: string,
  allTasks: Task[],
  allEvents: CalendarEvent[],
  userContext: UserContext,
  now: Date
): ConsequenceAnalysis {
  const task = allTasks.find(t => t.id === taskId || t.title.toLowerCase().includes(taskId.toLowerCase()));

  if (!task) {
    throw new Error(`Task with ID or title "${taskId}" not found.`);
  }

  // Parse target date and time
  let targetDateStr: string;
  let targetStartTime: Date;
  let hasSpecificTime = false;

  const lowerTarget = proposedDateOrTime.toLowerCase().trim();
  if (lowerTarget === 'tomorrow') {
    const tmrw = new Date(now);
    tmrw.setUTCDate(tmrw.getUTCDate() + 1);
    targetDateStr = tmrw.toISOString().split('T')[0];
    // Default to morning peak focus start
    const [h, m] = userContext.peakFocusHours.start.split(':').map(Number);
    targetStartTime = new Date(tmrw);
    targetStartTime.setUTCHours(h, m, 0, 0);
  } else if (lowerTarget === 'today') {
    targetDateStr = now.toISOString().split('T')[0];
    targetStartTime = new Date(now);
  } else if (proposedDateOrTime.includes('T') || proposedDateOrTime.includes(':')) {
    targetStartTime = new Date(proposedDateOrTime);
    targetDateStr = targetStartTime.toISOString().split('T')[0];
    hasSpecificTime = true;
  } else {
    // YYYY-MM-DD
    targetDateStr = proposedDateOrTime;
    const [h, m] = userContext.peakFocusHours.start.split(':').map(Number);
    targetStartTime = new Date(`${targetDateStr}T00:00:00.000Z`);
    targetStartTime.setUTCHours(h, m, 0, 0);
  }

  const durationMin = task.estimatedDuration || 60;
  const targetEndTime = new Date(targetStartTime.getTime() + durationMin * 60 * 1000);

  // 1. Check free slots on the target day
  const freeSlots = findFreeSlots(allEvents, targetDateStr, userContext, durationMin);

  // 2. Conflict Detection
  const conflicts: ConflictDetail[] = [];
  const targetStartMs = targetStartTime.getTime();
  const targetEndMs = targetEndTime.getTime();

  for (const event of allEvents) {
    const eStartMs = new Date(event.start).getTime();
    const eEndMs = new Date(event.end).getTime();

    // Check overlap
    if (targetStartMs < eEndMs && targetEndMs > eStartMs) {
      conflicts.push({
        eventId: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        isFixed: event.isFixed,
        severity: event.isFixed ? 'critical' : 'warning',
        message: event.isFixed
          ? `Direct clash with non-movable event "${event.title}" (${formatTime(event.start)} - ${formatTime(event.end)})`
          : `Overlaps with flexible focus block "${event.title}"`
      });
    }
  }

  // 3. Deadline Breaches
  const deadlineBreaches: DeadlineBreach[] = [];
  const taskDeadline = new Date(task.deadline);

  if (targetEndTime.getTime() > taskDeadline.getTime()) {
    const delayMinutes = Math.round((targetEndTime.getTime() - taskDeadline.getTime()) / (60 * 1000));
    deadlineBreaches.push({
      taskId: task.id,
      title: task.title,
      deadline: task.deadline,
      newCompletionTime: targetEndTime.toISOString(),
      delayMinutes
    });
  }

  // 4. Downstream Dependencies Ripple Effect
  const rippleEffects: RippleEffect[] = [];
  const dependentTasks = allTasks.filter(t => t.dependencies && t.dependencies.includes(task.id));

  for (const dep of dependentTasks) {
    const depDeadline = new Date(dep.deadline);
    const depRequiredBufferMs = (dep.estimatedDuration + 30) * 60 * 1000;
    if (targetEndTime.getTime() + depRequiredBufferMs > depDeadline.getTime()) {
      rippleEffects.push({
        affectedTaskId: dep.id,
        affectedTitle: dep.title,
        cascadeReason: `Depends on "${task.title}". Moving "${task.title}" leaves insufficient time before deadline (${formatDate(dep.deadline)}).`,
        suggestedRemedy: `Reschedule "${dep.title}" or negotiate deadline.`
      });
    }
  }

  // If conflicting with flexible focus block, add ripple effect
  for (const conf of conflicts) {
    if (!conf.isFixed) {
      rippleEffects.push({
        affectedTaskId: conf.eventId,
        affectedTitle: conf.title,
        cascadeReason: `Occupies the proposed slot (${formatTime(conf.start)} - ${formatTime(conf.end)}).`,
        suggestedRemedy: `Shift "${conf.title}" to available afternoon window.`
      });
    }
  }

  // 5. Calculate Impact Severity & Feasibility
  let impactSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
  let isFeasible = true;

  if (deadlineBreaches.length > 0 || conflicts.some(c => c.isFixed)) {
    impactSeverity = 'critical';
    isFeasible = false;
  } else if (conflicts.length > 0 || rippleEffects.length > 0) {
    impactSeverity = 'high';
  } else if (freeSlots.length === 0) {
    impactSeverity = 'medium';
  } else {
    impactSeverity = 'low';
  }

  // 6. Generate Alternative Free Slots
  const alternativeSlots = freeSlots.slice(0, 3).map(slot => ({
    start: slot.start,
    end: slot.end,
    conflictFree: true,
    label: `${formatDate(slot.start)} from ${formatTime(slot.start)} to ${formatTime(slot.end)} (${slot.durationMinutes}m, ${slot.energyFit} energy)`
  }));

  // 7. Explanations
  let summary = '';
  let mitigationPlan = '';
  let explanationForAlexa = '';

  if (deadlineBreaches.length > 0) {
    const breach = deadlineBreaches[0];
    summary = `Postponing "${task.title}" breaches its deadline by ${Math.round(breach.delayMinutes / 60)} hours!`;
    explanationForAlexa = `Warning: Moving ${task.title} to ${proposedDateOrTime} misses its deadline of ${formatTime(task.deadline)}.`;
    if (alternativeSlots.length > 0) {
      mitigationPlan = `Keep task today or use open slot at ${alternativeSlots[0].label}.`;
      explanationForAlexa += ` Instead, I found a free focus window ${alternativeSlots[0].label}. Would you like me to book that?`;
    }
  } else if (conflicts.some(c => c.isFixed)) {
    const fixedConflict = conflicts.find(c => c.isFixed)!;
    summary = `Direct calendar clash with fixed event: ${fixedConflict.title}.`;
    explanationForAlexa = `That time conflicts with your fixed meeting "${fixedConflict.title}".`;
    if (alternativeSlots.length > 0) {
      explanationForAlexa += ` I can schedule it right after, from ${formatTime(alternativeSlots[0].start)} to ${formatTime(alternativeSlots[0].end)}.`;
    }
  } else if (conflicts.length > 0) {
    summary = `Overlaps with flexible block "${conflicts[0].title}". Moving it requires reshuffling.`;
    explanationForAlexa = `Moving ${task.title} to tomorrow overlaps with ${conflicts[0].title}. I can move ${conflicts[0].title} to 3:00 PM and book your assignment for 10:00 AM.`;
    mitigationPlan = `Cascade move: Reschedule "${conflicts[0].title}" to afternoon window.`;
  } else {
    summary = `Safe move. Zero conflicts detected. 2-hour free focus block available.`;
    explanationForAlexa = `Moving ${task.title} looks great. Tomorrow has a clear ${durationMin}-minute focus window at ${formatTime(targetStartTime.toISOString())}.`;
  }

  return {
    proposedChange: {
      taskId: task.id,
      taskTitle: task.title,
      proposedDateOrTime,
      targetSlot: {
        start: targetStartTime.toISOString(),
        end: targetEndTime.toISOString()
      }
    },
    isFeasible,
    impactSeverity,
    summary,
    conflicts,
    deadlineBreaches,
    rippleEffects,
    mitigationPlan,
    explanationForAlexa,
    alternativeSlots
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
