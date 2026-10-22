import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Lock, Sparkles } from 'lucide-react';
import { CalendarEvent } from '../types';

interface CalendarTimelineProps {
  events: CalendarEvent[];
}

export const CalendarTimeline: React.FC<CalendarTimelineProps> = ({ events }) => {
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tmrw = new Date(now);
  tmrw.setUTCDate(tmrw.getUTCDate() + 1);
  const tmrwStr = tmrw.toISOString().split('T')[0];

  const targetDateStr = selectedDay === 'today' ? todayStr : tmrwStr;

  // Filter events for selected day
  const filteredEvents = events.filter((e) => {
    return e.start.startsWith(targetDateStr);
  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const formatEventTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-purple-500/20 shadow-glass backdrop-blur-2xl bg-obsidian-900/80 h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-fuchsia-400" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Schedule
          </h2>
        </div>

        {/* Day switch pill */}
        <div className="flex items-center p-1 rounded-full bg-obsidian-950/90 border border-purple-500/25 text-xs">
          <button
            onClick={() => setSelectedDay('today')}
            className={`px-3.5 py-1 rounded-full transition-all duration-200 ${
              selectedDay === 'today'
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold shadow-glow-purple'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedDay('tomorrow')}
            className={`px-3.5 py-1 rounded-full transition-all duration-200 ${
              selectedDay === 'tomorrow'
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold shadow-glow-purple'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* Events timeline list */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-obsidian-950/50 border border-purple-500/15 text-xs text-purple-300/60 font-mono">
            No events scheduled for this day. Wide open for deep work!
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isFocus = evt.type === 'focus_block';
            return (
              <div
                key={evt.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isFocus
                    ? 'bg-gradient-to-r from-violet-950/40 via-purple-900/25 to-fuchsia-950/30 border-fuchsia-500/35 shadow-glow-purple/20'
                    : 'bg-obsidian-950/70 border-purple-500/15 text-purple-200/90 hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-1.5 h-10 rounded-full shrink-0 ${
                      isFocus
                        ? 'bg-gradient-to-b from-fuchsia-400 to-purple-600 shadow-glow-magenta'
                        : 'bg-purple-800'
                    }`}
                  ></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{evt.title}</span>
                      {evt.isFixed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-obsidian-850 text-purple-300/80 border border-purple-500/20">
                          <Lock className="w-2.5 h-2.5" /> Fixed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 shadow-sm">
                          <Sparkles className="w-2.5 h-2.5" /> Focus Block
                        </span>
                      )}
                    </div>
                    {evt.description && (
                      <p className="text-xs text-purple-200/70 mt-1">{evt.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-purple-300/80 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>
                    {formatEventTime(evt.start)} - {formatEventTime(evt.end)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

