import React, { useState } from 'react';
import { X, Sliders, Brain, Check } from 'lucide-react';
import { UserContext } from '../types';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: UserContext | null;
  onSavePreference: (key: string, value: any) => Promise<void>;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  context,
  onSavePreference
}) => {
  const [goal, setGoal] = useState(context?.activeGoal || 'Win Amazon Developer Hackathon 2026');
  const [preferMorningDeepWork, setPreferMorningDeepWork] = useState(
    context?.learnedPreferences?.preferMorningDeepWork ?? true
  );
  const [avoidConsecutiveMeetings, setAvoidConsecutiveMeetings] = useState(
    context?.learnedPreferences?.avoidConsecutiveMeetings ?? true
  );
  const [cushionHours, setCushionHours] = useState(
    context?.learnedPreferences?.cushionBeforeDeadlinesHours ?? 4
  );
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen || !context) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSavePreference('preferMorningDeepWork', preferMorningDeepWork);
    await onSavePreference('avoidConsecutiveMeetings', avoidConsecutiveMeetings);
    await onSavePreference('cushionBeforeDeadlinesHours', cushionHours);
    await onSavePreference('activeGoal', goal);

    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-purple-500/30 bg-gradient-to-b from-obsidian-850/95 via-obsidian-900/95 to-obsidian-950/98 shadow-glass relative backdrop-blur-2xl font-mono text-xs">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white">
              <Brain className="w-4 h-4" />
            </div>
            <span>Contextual Memory & Learned Habits</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-obsidian-850 border border-purple-500/20 text-purple-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-purple-200/90 mb-1.5 font-sans font-medium">Active North-Star Goal</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-obsidian-950/90 border border-purple-500/25 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-obsidian-950/90 border border-purple-500/20">
            <div>
              <span className="text-purple-300/70 block text-[11px]">Peak Focus Hours:</span>
              <span className="text-white font-bold text-xs">
                {context.peakFocusHours.start} - {context.peakFocusHours.end}
              </span>
            </div>
            <div>
              <span className="text-purple-300/70 block text-[11px]">Workday Window:</span>
              <span className="text-white font-bold text-xs">
                {context.workHours.start} - {context.workHours.end}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center gap-2.5 text-purple-200 cursor-pointer">
              <input
                type="checkbox"
                checked={preferMorningDeepWork}
                onChange={(e) => setPreferMorningDeepWork(e.target.checked)}
                className="w-4 h-4 rounded bg-obsidian-950 border-purple-500/40 text-fuchsia-500 focus:ring-0"
              />
              <span className="font-sans text-xs">Prioritize Deep Work during morning peak energy</span>
            </label>

            <label className="flex items-center gap-2.5 text-purple-200 cursor-pointer">
              <input
                type="checkbox"
                checked={avoidConsecutiveMeetings}
                onChange={(e) => setAvoidConsecutiveMeetings(e.target.checked)}
                className="w-4 h-4 rounded bg-obsidian-950 border-purple-500/40 text-fuchsia-500 focus:ring-0"
              />
              <span className="font-sans text-xs">Enforce 15-minute buffers between calendar blocks</span>
            </label>
          </div>

          <div>
            <label className="block text-purple-200/90 mb-1.5 font-sans font-medium">
              Minimum cushion before major deadlines (hours):
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={cushionHours}
              onChange={(e) => setCushionHours(Number(e.target.value))}
              className="w-full bg-obsidian-950/90 border border-purple-500/25 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-400"
            />
          </div>

          {savedNotice && (
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Context preferences updated in memory store & AgentCore!</span>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-purple-300 hover:text-white bg-obsidian-850 border border-purple-500/20 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold transition-all shadow-glow-purple border border-fuchsia-400/30"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
