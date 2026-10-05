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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-slate-700 shadow-2xl relative font-mono text-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-alexa-cyan" />
            Contextual Memory & Learned Habits
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-slate-300 mb-1">Active North-Star Goal</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-alexa-purple"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-obsidian-950 border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[11px]">Peak Focus Hours:</span>
              <span className="text-slate-200 font-bold">
                {context.peakFocusHours.start} - {context.peakFocusHours.end}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Workday Window:</span>
              <span className="text-slate-200 font-bold">
                {context.workHours.start} - {context.workHours.end}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={preferMorningDeepWork}
                onChange={(e) => setPreferMorningDeepWork(e.target.checked)}
                className="rounded bg-obsidian-950 border-slate-700 text-alexa-purple focus:ring-0"
              />
              <span>Prioritize Deep Work during morning peak energy</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={avoidConsecutiveMeetings}
                onChange={(e) => setAvoidConsecutiveMeetings(e.target.checked)}
                className="rounded bg-obsidian-950 border-slate-700 text-alexa-purple focus:ring-0"
              />
              <span>Enforce 15-minute buffers between calendar blocks</span>
            </label>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">
              Minimum cushion before major deadlines (hours):
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={cushionHours}
              onChange={(e) => setCushionHours(Number(e.target.value))}
              className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-alexa-purple"
            />
          </div>

          {savedNotice && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Context preferences updated in memory store & AgentCore!</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-obsidian-900 border border-slate-700"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-alexa-indigo hover:bg-alexa-purple text-white font-bold transition-all"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
