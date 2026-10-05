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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-slate-700 shadow-2xl relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-alexa-purple" />
            Add New Goal or Task
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-300 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build AWS Bedrock connector"
              className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-alexa-purple"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Description / Context</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context or criteria for this goal..."
              className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-alexa-purple font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Deadline Date</label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-alexa-purple"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Deadline Time (UTC)</label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-alexa-purple"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-alexa-cyan" /> Duration (min)
              </label>
              <input
                type="number"
                min="10"
                max="480"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-alexa-purple"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> Priority (1-5)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-alexa-purple"
              >
                <option value={5}>5 (Critical)</option>
                <option value={4}>4 (High)</option>
                <option value={3}>3 (Normal)</option>
                <option value={2}>2 (Low)</option>
                <option value={1}>1 (Backlog)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-alexa-purple" /> Energy Type
              </label>
              <select
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value as EnergyLevel)}
                className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-alexa-purple"
              >
                <option value="deep_work">Deep Work</option>
                <option value="shallow_work">Shallow Work</option>
                <option value="quick_win">Quick Win</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. aws, bedrock, demo"
              className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-alexa-purple"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-obsidian-900 border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-alexa-indigo hover:bg-alexa-purple text-white font-bold transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Save Task to MCP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
