import React from 'react';
import { Compass, Sparkles, RefreshCw, Sliders, Plus, Zap, Cpu } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenNewTask: () => void;
  onOpenPreferences: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onOpenNewTask,
  onOpenPreferences,
  isResetting
}) => {
  return (
    <header className="sticky top-0 z-40 w-full px-4 lg:px-8 py-3 backdrop-blur-2xl bg-obsidian-950/70 border-b border-purple-500/15">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 shadow-glow-purple p-0.5">
            <div className="w-full h-full rounded-[14px] bg-obsidian-900/90 flex items-center justify-center backdrop-blur-sm">
              <Compass className="w-5 h-5 text-fuchsia-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-fuchsia-400 shadow-sm"></span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-purple-100 to-fuchsia-200 bg-clip-text text-transparent">
              ActionPilot
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/15 border border-purple-500/30 text-purple-300">
              <Sparkles className="w-3 h-3 text-fuchsia-400" />
              Alexa+
            </span>
          </div>
        </div>

        {/* Status Indicators & Navigation Actions */}
        <div className="flex items-center gap-2">
          {/* MCP Spec Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-obsidian-850/80 border border-purple-500/20 text-purple-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>MCP</span>
          </div>

          {/* AWS Bedrock Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-obsidian-850/80 border border-purple-500/20 text-purple-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"></span>
            <span>Bedrock</span>
          </div>

          {/* New Task Pill */}
          <button
            onClick={onOpenNewTask}
            id="btn-new-task"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-glow-purple transition-all duration-200 active:scale-95 border border-fuchsia-400/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>

          {/* Context Memory Pill */}
          <button
            onClick={onOpenPreferences}
            id="btn-preferences"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-obsidian-850 hover:bg-obsidian-800 border border-purple-500/20 text-purple-200 hover:text-white transition-all active:scale-95"
            title="Context memory"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">Context</span>
          </button>

          {/* Reset Demo Pill */}
          <button
            onClick={onReset}
            disabled={isResetting}
            id="btn-reset-demo"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-obsidian-850 hover:bg-rose-950/30 border border-purple-500/20 text-slate-400 hover:text-rose-300 transition-all active:scale-95 disabled:opacity-50"
            title="Reset demo baseline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};

