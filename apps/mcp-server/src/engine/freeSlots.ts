import { CalendarEvent, TimeSlot, UserContext } from '../types.js';

/**
 * Finds available free slots in a given day within working hours,
 * taking into account existing calendar events, buffer times, and user focus patterns.
 */
export function findFreeSlots(
  events: CalendarEvent[],
  dateStr: string, // YYYY-MM-DD
  userContext: UserContext,
  minDurationMinutes: number = 30,
  bufferMinutes: number = 10
): TimeSlot[] {
  const [workStartHour, workStartMin] = userContext.workHours.start.split(':').map(Number);
  const [workEndHour, workEndMin] = userContext.workHours.end.split(':').map(Number);

  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const workStart = new Date(dayStart);
  workStart.setUTCHours(workStartHour, workStartMin, 0, 0);

  const workEnd = new Date(dayStart);
  workEnd.setUTCHours(workEndHour, workEndMin, 0, 0);

  // Filter events that fall on or overlap with this day
  const dayEvents = events
    .filter(e => {
      const eStart = new Date(e.start);
      const eEnd = new Date(e.end);
      return eStart < workEnd && eEnd > workStart;
    })
    .map(e => ({
      // Add buffer padding around events
      start: Math.max(workStart.getTime(), new Date(e.start).getTime() - (bufferMinutes * 60 * 1000)),
      end: Math.min(workEnd.getTime(), new Date(e.end).getTime() + (bufferMinutes * 60 * 1000))
    }))
    .sort((a, b) => a.start - b.start);

  // Merge overlapping blocked intervals
  const mergedBlocked: Array<{ start: number; end: number }> = [];
  for (const block of dayEvents) {
    if (mergedBlocked.length === 0) {
      mergedBlocked.push({ ...block });
    } else {
      const last = mergedBlocked[mergedBlocked.length - 1];
      if (block.start <= last.end) {
        last.end = Math.max(last.end, block.end);
      } else {
        mergedBlocked.push({ ...block });
      }
    }
  }

  // Find gaps
  const freeSlots: TimeSlot[] = [];
  let currentTime = workStart.getTime();

  for (const blocked of mergedBlocked) {
    if (blocked.start > currentTime) {
      const durationMinutes = Math.floor((blocked.start - currentTime) / (60 * 1000));
      if (durationMinutes >= minDurationMinutes) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(blocked.start);
        freeSlots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          durationMinutes,
          energyFit: calculateEnergyFit(slotStart, userContext)
        });
      }
    }
    currentTime = Math.max(currentTime, blocked.end);
  }

  // Check gap after last event up to workEnd
  if (currentTime < workEnd.getTime()) {
    const durationMinutes = Math.floor((workEnd.getTime() - currentTime) / (60 * 1000));
    if (durationMinutes >= minDurationMinutes) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(workEnd.getTime());
      freeSlots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        durationMinutes,
        energyFit: calculateEnergyFit(slotStart, userContext)
      });
    }
  }

  return freeSlots;
}

function calculateEnergyFit(slotStart: Date, context: UserContext): 'ideal' | 'moderate' | 'low' {
  const hour = slotStart.getUTCHours();
  const [peakStart] = context.peakFocusHours.start.split(':').map(Number);
  const [peakEnd] = context.peakFocusHours.end.split(':').map(Number);

  if (hour >= peakStart && hour < peakEnd) {
    return 'ideal';
  }

  if (context.secondaryFocusHours) {
    const [secStart] = context.secondaryFocusHours.start.split(':').map(Number);
    const [secEnd] = context.secondaryFocusHours.end.split(':').map(Number);
    if (hour >= secStart && hour < secEnd) {
      return 'ideal';
    }
  }

  if (hour >= 13 && hour < 14) {
    return 'low'; // Post-lunch dip
  }

  return 'moderate';
}
