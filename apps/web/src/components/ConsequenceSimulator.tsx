import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  GitBranch,
  ShieldAlert,
  Play,
  Sparkles
} from 'lucide-react';
import { Task, ConsequenceAnalysis } from '../types';

interface ConsequenceSimulatorProps {
  tasks: Task[];
  onSimulate: (taskId: string, proposedDateOrTime: string) => Promise<ConsequenceAnalysis | void>;
  onApplyMitigation: (taskId: string, targetSlot: { start: string; end: string }) => Promise<void>;
  isLoading: boolean;
  latestAnalysis: ConsequenceAnalysis | null;
}

export const ConsequenceSimulator: React.FC<ConsequenceSimulatorProps> = ({
  tasks,
  onSimulate,
  onApplyMitigation,
  isLoading,
  latestAnalysis
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[1]?.id || tasks[0]?.id || '');
  const [proposedTime, setProposedTime] = useState<string>('tomorrow');

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !proposedTime) return;
    onSimulate(selectedTaskId, proposedTime);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 border border-rose-500/40 text-rose-400">
            <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL CONFLICT
          </span>
        );
      case 'high':
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" /> REQUIRING RESHUFFLE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" /> SAFE TO MOVE
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 lg:p-6 border border-slate-800 shadow-glass mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-alexa-purple" />
            Consequence-Aware Rescheduling Sandbox
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-alexa-violet/15 text-alexa-purple border border-alexa-violet/30">
              What-If Simulator
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Simulate rescheduling actions to detect calendar collisions, deadline breaches, and domino effects.
          </p>
        </div>
      </div>

      {/* Simulation Controls Form */}
      <form onSubmit={handleRunSimulation} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
        <div className="sm:col-span-5">
          <label className="block text-xs font-mono text-slate-400 mb-1">Select Task to Reschedule</label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-obsidian-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-alexa-purple"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.estimatedDuration}m, due {new Date(t.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-4">
          <label className="block text-xs font-mono text-slate-400 mb-1">Proposed Target Time</label>
          <select
            value={proposedTime}
            onChange={(e) => setProposedTime(e.target.value)}
            className="w-full bg-obsidian-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-alexa-purple"
          >
            <option value="tomorrow">Tomorrow (Auto-fit peak window)</option>
            <option value="today">Today (Later slot)</option>
            <option value="2026-10-07T14:00:00Z">Wednesday 2:00 PM</option>
            <option value="2026-10-08T10:00:00Z">Thursday 10:00 AM</option>
          </select>
        </div>

        <div className="sm:col-span-3 flex items-end">
          <button
            type="submit"
            disabled={isLoading || !selectedTaskId}
            id="btn-simulate-consequences"
            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-obsidian-800 hover:bg-alexa-indigo border border-slate-700 hover:border-alexa-purple text-white transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Impact</span>
          </button>
        </div>
      </form>

      {/* Simulation Result Presentation */}
      {latestAnalysis ? (
        <div className="p-4 rounded-xl bg-obsidian-950/80 border border-slate-800 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">
                Simulation for: <strong className="text-white">"{latestAnalysis.proposedChange.taskTitle}"</strong> → {latestAnalysis.proposedChange.proposedDateOrTime}
              </span>
            </div>
            <div>{getSeverityBadge(latestAnalysis.impactSeverity)}</div>
          </div>

          {/* Natural language summary */}
          <div className="p-3 rounded-lg bg-obsidian-900 border border-slate-800 text-xs">
            <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-alexa-cyan" />
              Impact Summary:
            </div>
            <p className="text-slate-200 leading-relaxed font-sans">
              {latestAnalysis.summary}
            </p>
          </div>

          {/* Conflicts list */}
          {latestAnalysis.conflicts.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Detected Calendar Conflicts ({latestAnalysis.conflicts.length}):
              </div>
              {latestAnalysis.conflicts.map((conf, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/50 text-xs text-rose-200 flex items-center justify-between"
                >
                  <div>
                    <strong>{conf.title}</strong>: {conf.message}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/40 text-rose-300">
                    {conf.isFixed ? 'Fixed Event' : 'Movable'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Ripple effects */}
          {latestAnalysis.rippleEffects.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-amber-400 flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5" />
                Downstream Ripple Effects ({latestAnalysis.rippleEffects.length}):
              </div>
              {latestAnalysis.rippleEffects.map((rip, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/50 text-xs text-amber-200"
                >
                  <div className="font-semibold mb-0.5">Impact on: {rip.affectedTitle}</div>
                  <div className="text-[11px] text-slate-300">{rip.cascadeReason}</div>
                  <div className="text-[11px] text-emerald-400 mt-1">
                    ↳ Suggested Remedy: {rip.suggestedRemedy}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mitigation Plan & 1-Click Action */}
          {latestAnalysis.alternativeSlots.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                <span className="text-emerald-400 font-semibold block">Recommended Alternative Window:</span>
                <span className="font-mono text-[11px] text-slate-400">
                  {latestAnalysis.alternativeSlots[0].label}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  onApplyMitigation(latestAnalysis.proposedChange.taskId, {
                    start: latestAnalysis.alternativeSlots[0].start,
                    end: latestAnalysis.alternativeSlots[0].end
                  })
                }
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>Apply Safe Mitigation</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-obsidian-950/40 border border-slate-800/60 text-center text-xs text-slate-500 font-mono">
          Click "Simulate Impact" or speak to Alexa to test schedule movements and preview cascading effects.
        </div>
      )}
    </div>
  );
};
