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
      <div className="glass-panel rounded-3xl p-8 border border-purple-500/20 animate-pulse mb-8">
        <div className="h-6 w-52 bg-purple-900/40 rounded-full mb-4"></div>
        <div className="h-24 bg-purple-950/40 rounded-2xl"></div>
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

  const factorList = [
    { label: 'Urgency', score: factors.urgency, color: 'from-violet-500 to-rose-400' },
    { label: 'Importance', score: factors.importance, color: 'from-violet-500 to-amber-400' },
    { label: 'Energy Match', score: factors.energyFit, color: 'from-violet-500 to-emerald-400' },
    { label: 'Slot Fit', score: factors.slotFit, color: 'from-violet-500 to-fuchsia-400' },
  ];

  return (
    <div className="relative rounded-3xl p-6 lg:p-8 border border-purple-500/25 bg-gradient-to-b from-obsidian-850/90 via-obsidian-900/95 to-obsidian-950/95 backdrop-blur-2xl shadow-glass mb-8 overflow-hidden">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 border border-purple-500/30 text-fuchsia-300">
              <Sparkles className="w-3 h-3 text-fuchsia-400" />
              Recommendation
            </span>
          </div>

          {/* Engine Confidence Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-obsidian-850/80 border border-purple-500/20">
            <span className="text-xs text-purple-300/70 font-mono">Confidence</span>
            <div className="w-14 h-1.5 bg-purple-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400 rounded-full"
                style={{ width: `${confidenceScore}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-fuchsia-300 font-mono">{confidenceScore}%</span>
          </div>
        </div>

        {/* Task Details and Scheduling Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-3.5">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {recommendedTask.title}
              </h3>
              {recommendedTask.description && (
                <p className="text-xs sm:text-sm text-purple-200/70 leading-relaxed mt-1.5 max-w-2xl font-normal">
                  {recommendedTask.description}
                </p>
              )}
            </div>

            {/* Pill Badges Row */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-500/15 border border-purple-500/30 text-purple-200">
                <Clock className="w-3 h-3 text-purple-300" />
                {recommendedTask.estimatedDuration}m
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300">
                <Zap className="w-3 h-3 text-fuchsia-400" />
                {recommendedTask.energyLevel.replace('_', ' ')}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300">
                <Flame className="w-3 h-3 text-amber-400" />
                P{recommendedTask.priority}
              </span>

              {recommendedTask.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-obsidian-850/80 text-purple-300/70 border border-purple-500/15"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Why Now Rationale */}
            <div className="p-3.5 rounded-2xl bg-obsidian-950/70 border border-purple-500/20 space-y-2.5">
              <p className="text-xs sm:text-sm leading-relaxed text-purple-100/90 font-sans">
                "{reasoning}"
              </p>

              {/* Factors Weight Indicators */}
              <div className="pt-2 border-t border-purple-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {factorList.map((f, idx) => (
                  <div key={idx} className="p-1.5 rounded-xl bg-obsidian-900/60 border border-purple-500/15">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-purple-300/70">{f.label}</span>
                      <span className="font-bold text-white">{f.score}</span>
                    </div>
                    <div className="w-full h-1 bg-obsidian-850 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${f.color} rounded-full`}
                        style={{ width: `${f.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Optimal Time Slot AI Card on Right */}
          <div className="lg:col-span-4 rounded-2xl p-4 sm:p-5 border border-purple-500/20 bg-gradient-to-b from-purple-950/20 to-obsidian-950/80 space-y-3.5">
            <div className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Best Time</span>
            </div>

            <div className="p-3 rounded-xl bg-obsidian-950/90 border border-purple-500/20 space-y-1">
              <div className="text-base font-bold text-white">
                {recommendedSlot.formattedTime}
              </div>
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Conflict-free</span>
              </div>
            </div>

            <button
              onClick={handleBook}
              disabled={isBooking || recommendedTask.status === 'in_progress'}
              id="btn-book-focus-block"
              className="w-full py-2.5 px-4 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-glow-purple transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 border border-fuchsia-400/30"
            >
              <Zap className="w-3.5 h-3.5 text-fuchsia-200" />
              <span>
                {recommendedTask.status === 'in_progress' ? 'Focus Active' : 'Book Focus Block'}
              </span>
            </button>
          </div>
        </div>

        {/* Alternative options toggle */}
        {alternativeTasks && alternativeTasks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-purple-500/20">
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="text-xs text-purple-300/70 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Other candidates ({alternativeTasks.length})</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${showAlternatives ? 'rotate-90' : ''}`}
              />
            </button>

            {showAlternatives && (
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {alternativeTasks.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-2.5 rounded-xl bg-obsidian-950/80 border border-purple-500/20 text-xs"
                  >
                    <div className="font-semibold text-purple-100 truncate mb-0.5">
                      {alt.title}
                    </div>
                    <div className="text-[11px] text-purple-300/60">
                      Deferred: <span className="text-amber-300">{alt.reasonSkipped}</span>
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

