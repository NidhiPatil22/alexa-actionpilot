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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-alexa-indigo via-alexa-purple to-alexa-cyan shadow-glow-violet">
            <Compass className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alexa-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-alexa-cyan"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                ActionPilot
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-alexa-violet/20 border border-alexa-violet/40 text-alexa-purple shadow-sm">
                <Sparkles className="w-3 h-3" />
                Alexa+ MCP
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Don't just ask Alexa. Give it a goal.
            </p>
          </div>
        </div>

        {/* Status Indicators & Metadata */}
        <div className="flex flex-wrap items-center gap-2">
          {/* MCP Spec Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-obsidian-850 border border-slate-700/60 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>MCP 2025-11-25</span>
          </div>

          {/* AWS Bedrock Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-obsidian-850 border border-slate-700/60 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-alexa-cyan" />
            <span>AWS Bedrock Agent</span>
          </div>

          {/* Action buttons */}
          <button
            onClick={onOpenNewTask}
            id="btn-new-task"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-alexa-indigo to-alexa-violet hover:from-indigo-500 hover:to-purple-500 text-white shadow-glow-violet transition-all duration-200 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>

          <button
            onClick={onOpenPreferences}
            id="btn-preferences"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-obsidian-800 hover:bg-obsidian-700 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title="Configure context memory and work hours"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Context</span>
          </button>

          <button
            onClick={onReset}
            disabled={isResetting}
            id="btn-reset-demo"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-obsidian-800 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-800/60 text-slate-400 hover:text-rose-300 transition-colors"
            title="Reset demo data to default baseline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
