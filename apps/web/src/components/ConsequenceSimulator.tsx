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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> CRITICAL CONFLICT
          </span>
        );
      case 'high':
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> REQUIRING RESHUFFLE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> SAFE TO MOVE
          </span>
        );
    }
  };

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-purple-500/20 shadow-glass mb-8 backdrop-blur-2xl bg-obsidian-900/80">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-fuchsia-400" />
          Schedule Sandbox
        </h2>
      </div>

      {/* Simulation Controls Form */}
      <form onSubmit={handleRunSimulation} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
        <div className="sm:col-span-5">
          <label className="block text-xs font-mono text-purple-300/80 mb-1">Task</label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-obsidian-950/90 border border-purple-500/25 rounded-2xl px-3 py-2 text-xs text-purple-100 focus:outline-none focus:border-fuchsia-400"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id} className="bg-obsidian-950 text-white">
                {t.title} ({t.estimatedDuration}m)
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-4">
          <label className="block text-xs font-mono text-purple-300/80 mb-1">Proposed Time</label>
          <select
            value={proposedTime}
            onChange={(e) => setProposedTime(e.target.value)}
            className="w-full bg-obsidian-950/90 border border-purple-500/25 rounded-2xl px-3 py-2 text-xs text-purple-100 focus:outline-none focus:border-fuchsia-400"
          >
            <option value="tomorrow" className="bg-obsidian-950 text-white">Tomorrow</option>
            <option value="today" className="bg-obsidian-950 text-white">Today (Later slot)</option>
            <option value="2026-10-07T14:00:00Z" className="bg-obsidian-950 text-white">Wednesday 2:00 PM</option>
            <option value="2026-10-08T10:00:00Z" className="bg-obsidian-950 text-white">Thursday 10:00 AM</option>
          </select>
        </div>

        <div className="sm:col-span-3 flex items-end">
          <button
            type="submit"
            disabled={isLoading || !selectedTaskId}
            id="btn-simulate-consequences"
            className="w-full py-2 px-4 rounded-full text-xs font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border border-fuchsia-400/30 text-white transition-all flex items-center justify-center gap-1.5 shadow-glow-purple active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Simulate</span>
          </button>
        </div>
      </form>

      {/* Simulation Result Presentation */}
      {latestAnalysis ? (
        <div className="p-4 rounded-2xl bg-obsidian-950/80 border border-purple-500/25 space-y-3.5 shadow-glass">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-purple-500/20">
            <span className="text-xs font-medium text-purple-200">
              {latestAnalysis.proposedChange.taskTitle} → {latestAnalysis.proposedChange.proposedDateOrTime}
            </span>
            <div>{getSeverityBadge(latestAnalysis.impactSeverity)}</div>
          </div>

          {/* Natural language summary */}
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/25 text-xs">
            <p className="text-purple-100 leading-relaxed font-sans">
              {latestAnalysis.summary}
            </p>
          </div>

          {/* Conflicts list */}
          {latestAnalysis.conflicts.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Conflicts ({latestAnalysis.conflicts.length}):
              </div>
              {latestAnalysis.conflicts.map((conf, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-rose-950/25 border border-rose-800/40 text-xs text-rose-200 flex items-center justify-between gap-2"
                >
                  <div>
                    <strong>{conf.title}</strong>: {conf.message}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-900/50 text-rose-300">
                    {conf.isFixed ? 'Fixed' : 'Movable'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Ripple effects */}
          {latestAnalysis.rippleEffects.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-amber-300 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                Ripple Effects ({latestAnalysis.rippleEffects.length}):
              </div>
              {latestAnalysis.rippleEffects.map((rip, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-amber-950/25 border border-amber-800/40 text-xs text-amber-200"
                >
                  <div className="font-semibold mb-0.5">{rip.affectedTitle}</div>
                  <div className="text-[11px] text-purple-200/80">{rip.cascadeReason}</div>
                  <div className="text-[11px] text-emerald-300 mt-0.5">
                    ↳ Remedy: {rip.suggestedRemedy}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mitigation Plan & 1-Click Action */}
          {latestAnalysis.alternativeSlots.length > 0 && (
            <div className="pt-2.5 border-t border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-xs text-purple-200">
                <span className="text-emerald-400 font-semibold block">Alternative Slot:</span>
                <span className="font-mono text-[11px] text-purple-300/80">
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
                className="px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
              >
                <span>Apply Remedy</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-obsidian-950/50 border border-purple-500/15 text-center text-xs text-purple-300/60 font-mono">
          Select a task to simulate schedule movements and detect conflicts.
        </div>
      )}
    </div>
  );
};

