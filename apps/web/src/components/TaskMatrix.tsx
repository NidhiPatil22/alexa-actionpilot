import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  Flame,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Task } from '../types';

interface TaskMatrixProps {
  tasks: Task[];
  onCompleteTask: (id: string) => Promise<void>;
  onSelectForSimulation: (taskId: string) => void;
  isProcessing: boolean;
}

export const TaskMatrix: React.FC<TaskMatrixProps> = ({
  tasks,
  onCompleteTask,
  onSelectForSimulation,
  isProcessing
}) => {
  const [activeTab, setActiveTab] = useState<'todo' | 'completed'>('todo');

  const filteredTasks = tasks.filter((t) =>
    activeTab === 'todo' ? t.status !== 'completed' : t.status === 'completed'
  );

  const formatDeadline = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 lg:p-6 border border-slate-800 shadow-glass mb-6">
      {/* Header and tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-alexa-purple" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Task Matrix & Dependency State
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {filteredTasks.length} {activeTab}
          </span>
        </div>

        <div className="flex items-center p-0.5 rounded-lg bg-obsidian-950 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('todo')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'todo'
                ? 'bg-alexa-indigo text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'completed'
                ? 'bg-alexa-indigo text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Task items list */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-obsidian-950/40 border border-slate-800/60 text-xs text-slate-500 font-mono">
            {activeTab === 'todo'
              ? 'No pending tasks! All caught up.'
              : 'No completed tasks yet. Finish a task to see it here.'}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-3.5 rounded-xl bg-obsidian-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onCompleteTask(task.id)}
                  disabled={isProcessing || task.status === 'completed'}
                  className="mt-0.5 text-slate-500 hover:text-emerald-400 disabled:hover:text-slate-500 transition-colors"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        task.status === 'completed'
                          ? 'line-through text-slate-500'
                          : 'text-slate-100'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Priority badge */}
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      <Flame className="w-2.5 h-2.5" /> P{task.priority}
                    </span>

                    {/* Energy tag */}
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                      <Zap className="w-2.5 h-2.5" /> {task.energyLevel.replace('_', ' ')}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-400 mt-1 max-w-xl line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  {/* Metadata and tags */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500 mt-1.5">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-alexa-cyan" />
                      {task.estimatedDuration}m
                    </span>
                    <span>•</span>
                    <span className="text-amber-400/90">
                      Deadline: {formatDeadline(task.deadline)}
                    </span>
                    {task.dependencies && task.dependencies.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-purple-400">
                          Depends on: {task.dependencies.join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action button */}
              {task.status !== 'completed' && (
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => onSelectForSimulation(task.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-obsidian-850 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>Test Reschedule</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
