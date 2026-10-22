import React, { useState } from 'react';
import { X, Plus, Clock, Flame, Zap } from 'lucide-react';
import { EnergyLevel } from '../types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: {
    title: string;
    description: string;
    deadline: string;
    priority: number;
    estimatedDuration: number;
    energyLevel: EnergyLevel;
    tags: string[];
  }) => Promise<void>;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onCreateTask
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('2026-10-07');
  const [deadlineTime, setDeadlineTime] = useState('17:00');
  const [priority, setPriority] = useState<number>(4);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(60);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('deep_work');
  const [tagsInput, setTagsInput] = useState('hackathon, dev');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const deadline = `${deadlineDate}T${deadlineTime}:00.000Z`;
    const tags = tagsInput.split(',').map((s) => s.trim()).filter(Boolean);

    await onCreateTask({
      title: title.trim(),
      description: description.trim(),
      deadline,
      priority,
      estimatedDuration,
      energyLevel,
      tags
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-purple-500/30 bg-gradient-to-b from-obsidian-850/95 via-obsidian-900/95 to-obsidian-950/98 shadow-glass relative backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white">
              <Plus className="w-4 h-4" />
            </div>
            <span>Add New Goal or Task</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-obsidian-850 border border-purple-500/20 text-purple-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-purple-200/90 mb-1.5">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build AWS Bedrock connector"
              className="w-full bg-obsidian-950/90 border border-purple-500/25 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-purple-300/40 focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/40"
            />
          </div>

          <div>
            <label className="block text-purple-200/90 mb-1.5">Description / Context</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context or criteria for this goal..."
              className="w-full bg-obsidian-950/90 border border-purple-500/25 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-fuchsia-400 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-purple-200/90 mb-1.5">Deadline Date</label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full bg-obsidian-950/90 border border-purple-500/25 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-400"
              />
            </div>
            <div>
              <label className="block text-purple-200/90 mb-1.5">Deadline Time (UTC)</label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full bg-obsidian-950/90 border border-purple-500/25 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-purple-200/90 mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-fuchsia-400" /> Duration (m)
              </label>
              <input
                type="number"
                min="10"
                max="480"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                className="w-full bg-obsidian-950/90 border border-purple-500/25 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-400"
              />
            </div>

            <div>
              <label className="block text-purple-200/90 mb-1.5 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> Priority (1-5)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full bg-obsidian-950/90 border border-purple-500/25 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-400"
              >
                <option value={5} className="bg-obsidian-950">5 (Critical)</option>
                <option value={4} className="bg-obsidian-950">4 (High)</option>
                <option value={3} className="bg-obsidian-950">3 (Normal)</option>
                <option value={2} className="bg-obsidian-950">2 (Low)</option>
                <option value={1} className="bg-obsidian-950">1 (Backlog)</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-200/90 mb-1.5 flex items-center gap-1">
                <Zap className="w-3 h-3 text-fuchsia-400" /> Energy Type
              </label>
              <select
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value as EnergyLevel)}
                className="w-full bg-obsidian-950/90 border border-purple-500/25 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-400"
              >
                <option value="deep_work" className="bg-obsidian-950">Deep Work</option>
                <option value="shallow_work" className="bg-obsidian-950">Shallow Work</option>
                <option value="quick_win" className="bg-obsidian-950">Quick Win</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-purple-200/90 mb-1.5">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. aws, bedrock, demo"
              className="w-full bg-obsidian-950/90 border border-purple-500/25 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-fuchsia-400"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-purple-300 hover:text-white bg-obsidian-850 border border-purple-500/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold transition-all shadow-glow-purple disabled:opacity-50 border border-fuchsia-400/30"
            >
              {isSubmitting ? 'Creating...' : 'Save Task to MCP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
