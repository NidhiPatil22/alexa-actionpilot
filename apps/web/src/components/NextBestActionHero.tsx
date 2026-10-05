import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Calendar,
  Zap,
  CheckCircle2,
  ChevronRight,
  Info,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { NextBestAction } from '../types';

interface NextBestActionHeroProps {
  action: NextBestAction | null;
  onBookSlot: (taskId: string, title: string, start: string, end: string) => Promise<void>;
  isBooking: boolean;
}

export const NextBestActionHero: React.FC<NextBestActionHeroProps> = ({
  action,
  onBookSlot,
  isBooking
}) => {
  const [showAlternatives, setShowAlternatives] = useState(false);

  if (!action || !action.recommendedTask) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded mb-4"></div>
        <div className="h-20 bg-slate-800/60 rounded"></div>
      </div>
    );
  }

  const { recommendedTask, confidenceScore, recommendedSlot, reasoning, factors, alternativeTasks } = action;

  const handleBook = () => {
    onBookSlot(
      recommendedTask.id,
      `Focus: ${recommendedTask.title}`,
      recommendedSlot.start,
      recommendedSlot.end
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-5 lg:p-7 border border-alexa-purple/30 shadow-glass relative overflow-hidden mb-6">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-alexa-purple/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-alexa-cyan/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        {/* Top header line */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-alexa-indigo/20 border border-alexa-indigo/40 text-alexa-purple shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-alexa-cyan animate-spin-slow" />
              RECOMMENDED NEXT BEST ACTION
            </span>
            <span className="text-xs font-mono text-slate-400">
              Deterministic + Bedrock Synthesized
            </span>
          </div>

          {/* Confidence Score Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-850 border border-slate-700">
            <span className="text-xs text-slate-400 font-mono">Engine Confidence:</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">{confidenceScore}%</span>
            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-alexa-indigo to-emerald-400 rounded-full"
                style={{ width: `${confidenceScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Task Title and High-level info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-3">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-start gap-2.5">
              <span>{recommendedTask.title}</span>
            </h3>

            {recommendedTask.description && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {recommendedTask.description}
              </p>
            )}

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-obsidian-800 border border-slate-700 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-alexa-cyan" />
                {recommendedTask.estimatedDuration} mins
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-alexa-purple/15 border border-alexa-purple/30 text-purple-300">
                <Zap className="w-3.5 h-3.5 text-alexa-purple" />
                {recommendedTask.energyLevel.replace('_', ' ').toUpperCase()}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Priority {recommendedTask.priority}/5
              </span>

              {recommendedTask.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-800/80 text-slate-400 border border-slate-700/50"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Explainable Decision box */}
            <div className="p-3.5 rounded-xl bg-obsidian-950/70 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-1.5 text-alexa-cyan font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span>Explainable Decision Rationale:</span>
              </div>
              <p className="leading-relaxed text-slate-300 italic font-sans">
                "{reasoning}"
              </p>

              {/* Factors weight breakdown */}
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block">Urgency:</span>
                  <span className="font-bold text-slate-200">{factors.urgency}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Importance:</span>
                  <span className="font-bold text-slate-200">{factors.importance}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Energy Match:</span>
                  <span className="font-bold text-emerald-400">{factors.energyFit}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Slot Fit:</span>
                  <span className="font-bold text-alexa-cyan">{factors.slotFit}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action booking card on right */}
          <div className="lg:col-span-4 glass-card rounded-xl p-4 border border-slate-700/80 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-alexa-purple" />
              Optimal Time Slot
            </div>

            <div className="p-3 rounded-lg bg-obsidian-950 border border-slate-800">
              <div className="text-sm font-bold text-white mb-0.5">
                {recommendedSlot.formattedTime}
              </div>
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Conflict-free window
              </div>
            </div>

            <button
              onClick={handleBook}
              disabled={isBooking || recommendedTask.status === 'in_progress'}
              id="btn-book-focus-block"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-alexa-indigo to-alexa-purple hover:from-indigo-500 hover:to-purple-500 text-white shadow-glow-violet transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {recommendedTask.status === 'in_progress' ? 'Focus Block Active' : 'Book Focus Block on Calendar'}
              </span>
            </button>

            <p className="text-[11px] text-slate-500 text-center">
              Synchronizes to remote MCP calendar & triggers Alexa notification.
            </p>
          </div>
        </div>

        {/* Alternative options toggle */}
        {alternativeTasks && alternativeTasks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <span>View other candidates considered ({alternativeTasks.length})</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${showAlternatives ? 'rotate-90' : ''}`}
              />
            </button>

            {showAlternatives && (
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {alternativeTasks.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-2.5 rounded-lg bg-obsidian-950/80 border border-slate-800 text-xs"
                  >
                    <div className="font-semibold text-slate-300 truncate mb-0.5">
                      {alt.title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Deferred: <span className="text-amber-400">{alt.reasonSkipped}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
