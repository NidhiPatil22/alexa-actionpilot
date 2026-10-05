import { Task, CalendarEvent, UserContext, WorkloadReport } from '../types.js';
import { findFreeSlots } from './freeSlots.js';

export function analyzeWorkload(
  tasks: Task[],
  events: CalendarEvent[],
  dateStr: string,
  userContext: UserContext,
  now: Date
): WorkloadReport {
  const freeSlots = findFreeSlots(events, dateStr, userContext, 15);
  const totalFreeMinutes = freeSlots.reduce((acc, slot) => acc + slot.durationMinutes, 0);

  // Compute scheduled event minutes for the day
  const targetDayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const targetDayEnd = new Date(`${dateStr}T23:59:59.999Z`);

  const dayEvents = events.filter(e => {
    const s = new Date(e.start);
    const end = new Date(e.end);
    return s < targetDayEnd && end > targetDayStart;
  });

  const totalScheduledMinutes = dayEvents.reduce((acc, e) => {
    const s = Math.max(targetDayStart.getTime(), new Date(e.start).getTime());
    const end = Math.min(targetDayEnd.getTime(), new Date(e.end).getTime());
    return acc + Math.round((end - s) / (60 * 1000));
  }, 0);

  // Active tasks due on or before this day
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const dayEndMs = targetDayEnd.getTime();

  const dueTasksToday = activeTasks.filter(t => new Date(t.deadline).getTime() <= dayEndMs);
  const taskDemandMinutes = dueTasksToday.reduce((acc, t) => acc + (t.estimatedDuration || 30), 0);

  // Capacity ratio = task demand / available free time
  const capacityRatio = totalFreeMinutes > 0 ? Number((taskDemandMinutes / totalFreeMinutes).toFixed(2)) : 2.0;

  let stressLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  if (capacityRatio > 1.2 || (totalFreeMinutes < 60 && taskDemandMinutes > 60)) {
    stressLevel = 'critical';
  } else if (capacityRatio > 0.85) {
    stressLevel = 'high';
  } else if (capacityRatio > 0.5) {
    stressLevel = 'moderate';
  } else {
    stressLevel = 'low';
  }

  // Deadline distribution across all active tasks
  const nowMs = now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const deadlineDistribution = {
    today: 0,
    tomorrow: 0,
    within3Days: 0,
    withinWeek: 0,
    later: 0
  };

  for (const t of activeTasks) {
    const tMs = new Date(t.deadline).getTime();
    const diff = tMs - nowMs;
    if (diff <= dayMs) {
      deadlineDistribution.today++;
    } else if (diff <= 2 * dayMs) {
      deadlineDistribution.tomorrow++;
    } else if (diff <= 3 * dayMs) {
      deadlineDistribution.within3Days++;
    } else if (diff <= 7 * dayMs) {
      deadlineDistribution.withinWeek++;
    } else {
      deadlineDistribution.later++;
    }
  }

  // Recommendations
  const recommendations: string[] = [];
  if (stressLevel === 'critical') {
    recommendations.push('Immediate relief required: Postpone at least one non-critical task or decline optional meetings.');
    recommendations.push('Use ActionPilot consequence simulator before accepting any new commitments.');
  } else if (stressLevel === 'high') {
    recommendations.push('Tight schedule today: Group shallow work into one 30-minute block.');
    recommendations.push('Protect your peak morning focus hours for high-priority deliverables.');
  } else if (stressLevel === 'moderate') {
    recommendations.push('Balanced schedule: You have sufficient free slots for today\'s priority tasks.');
  } else {
    recommendations.push('Healthy capacity: Excellent day for deep work or getting ahead on tomorrow\'s milestones.');
  }

  return {
    date: dateStr,
    totalScheduledMinutes,
    totalFreeMinutes,
    taskDemandMinutes,
    capacityRatio,
    stressLevel,
    deadlineDistribution,
    recommendations
  };
}
