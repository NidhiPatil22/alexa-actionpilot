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
    <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-purple-500/20 shadow-glass mb-8 backdrop-blur-2xl bg-obsidian-900/80">
      {/* Header and tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-fuchsia-400" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Tasks
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/20 text-purple-200">
            {filteredTasks.length}
          </span>
        </div>

        <div className="flex items-center p-1 rounded-full bg-obsidian-950/90 border border-purple-500/25 text-xs">
          <button
            onClick={() => setActiveTab('todo')}
            className={`px-3 py-1 rounded-full transition-all duration-200 ${
              activeTab === 'todo'
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium shadow-glow-purple'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1 rounded-full transition-all duration-200 ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium shadow-glow-purple'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Task items list */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-obsidian-950/50 border border-purple-500/15 text-xs text-purple-300/60 font-mono">
            {activeTab === 'todo'
              ? 'No pending tasks! All caught up.'
              : 'No completed tasks yet. Finish a task to see it here.'}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-2xl bg-obsidian-950/70 border border-purple-500/15 hover:border-purple-500/35 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <button
                  onClick={() => onCompleteTask(task.id)}
                  disabled={isProcessing || task.status === 'completed'}
                  aria-label={`Mark ${task.title} as completed`}
                  className="mt-0.5 text-purple-400 hover:text-emerald-400 disabled:hover:text-purple-400 transition-colors"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 hover:scale-110 transition-transform" />
                  )}
                </button>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        task.status === 'completed'
                          ? 'line-through text-purple-400/50'
                          : 'text-white'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Priority badge */}
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <Flame className="w-2.5 h-2.5 text-amber-400" /> P{task.priority}
                    </span>

                    {/* Energy tag */}
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">
                      <Zap className="w-2.5 h-2.5 text-fuchsia-400" /> {task.energyLevel.replace('_', ' ')}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-purple-200/70 mt-1 max-w-xl line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  {/* Metadata and tags */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-purple-300/60 mt-2">
                    <span className="flex items-center gap-1 text-purple-200">
                      <Clock className="w-3 h-3 text-fuchsia-400" />
                      {task.estimatedDuration}m
                    </span>
                    <span>•</span>
                    <span className="text-amber-300/90">
                      Deadline: {formatDeadline(task.deadline)}
                    </span>
                    {task.dependencies && task.dependencies.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-purple-300">
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
                    className="px-3 py-1 rounded-full text-xs font-mono bg-obsidian-850 hover:bg-purple-950/40 border border-purple-500/20 text-purple-200 hover:text-white transition-all flex items-center gap-1 active:scale-95"
                  >
                    <span>Reschedule</span>
                    <ArrowRight className="w-3 h-3 text-fuchsia-400" />
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

