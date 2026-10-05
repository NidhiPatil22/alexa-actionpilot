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
    <div className="glass-panel rounded-2xl p-5 lg:p-6 border border-slate-800 shadow-glass">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-alexa-cyan" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Live Schedule & Focus Blocks
          </h2>
        </div>

        {/* Day switch */}
        <div className="flex items-center p-0.5 rounded-lg bg-obsidian-950 border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedDay('today')}
            className={`px-3 py-1 rounded-md transition-all ${
              selectedDay === 'today'
                ? 'bg-alexa-indigo text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedDay('tomorrow')}
            className={`px-3 py-1 rounded-md transition-all ${
              selectedDay === 'tomorrow'
                ? 'bg-alexa-indigo text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* Events timeline list */}
      <div className="space-y-2.5">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-obsidian-950/50 border border-slate-800/80 text-xs text-slate-500 font-mono">
            No events scheduled for this day. Wide open for deep work!
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isFocus = evt.type === 'focus_block';
            return (
              <div
                key={evt.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isFocus
                    ? 'bg-gradient-to-r from-alexa-violet/20 via-alexa-purple/10 to-obsidian-950/60 border-alexa-purple/40 shadow-glow-violet'
                    : 'bg-obsidian-950/70 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-start sm:items-center gap-2.5">
                  <div
                    className={`w-2 h-10 rounded-full shrink-0 ${
                      isFocus ? 'bg-alexa-purple' : 'bg-slate-600'
                    }`}
                  ></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{evt.title}</span>
                      {evt.isFixed ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                          <Lock className="w-2.5 h-2.5" /> Fixed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-alexa-purple/30 text-purple-200">
                          <Sparkles className="w-2.5 h-2.5" /> Focus Block
                        </span>
                      )}
                    </div>
                    {evt.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{evt.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-alexa-cyan" />
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
