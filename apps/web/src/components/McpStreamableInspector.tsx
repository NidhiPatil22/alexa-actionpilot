import React, { useState } from 'react';
import { Terminal, Zap, Radio, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { MCPEventLog } from '../types';

interface McpStreamableInspectorProps {
  logs: MCPEventLog[];
  registeredTools: any[];
}

export const McpStreamableInspector: React.FC<McpStreamableInspectorProps> = ({
  logs,
  registeredTools
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('http://localhost:3001/mcp');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl glass-panel border border-purple-500/20 shadow-glass overflow-hidden mb-8 backdrop-blur-2xl bg-obsidian-900/80">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-purple-900/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-fuchsia-400">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-2">
              Protocol Inspector
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                Connected
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-purple-300">
          <span className="text-xs font-mono bg-obsidian-950 px-2.5 py-0.5 rounded-full border border-purple-500/20">
            {registeredTools.length} Tools
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-fuchsia-400" /> : <ChevronDown className="w-4 h-4 text-fuchsia-400" />}
        </div>
      </button>

      {/* Expanded view */}
      {isOpen && (
        <div className="p-5 border-t border-purple-500/20 bg-obsidian-950/80 space-y-4 font-mono text-xs">
          {/* Remote Endpoint Info */}
          <div className="p-3.5 rounded-2xl bg-obsidian-900/90 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-purple-300/70 text-[11px]">Endpoint:</span>
              <div className="text-fuchsia-400 font-bold text-xs mt-0.5">
                POST /mcp
              </div>
            </div>
            <button
              onClick={handleCopyEndpoint}
              className="px-3 py-1 rounded-full bg-obsidian-850 hover:bg-purple-950/40 text-purple-200 hover:text-white flex items-center gap-1.5 text-[11px] border border-purple-500/30 self-start sm:self-center transition-all shadow-sm"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Registered Tools grid */}
          <div>
            <div className="text-[11px] text-purple-200/80 font-semibold mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
              Tools:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {registeredTools.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTool(t)}
                  className={`p-2 rounded-xl text-left border text-[11px] truncate transition-all ${
                    selectedTool?.name === t.name
                      ? 'bg-fuchsia-500/25 border-fuchsia-400 text-white'
                      : 'bg-obsidian-900 border-purple-500/20 text-purple-200 hover:border-purple-400/50'
                  }`}
                >
                  <div className="font-bold truncate">{t.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tool schema viewer */}
          {selectedTool && (
            <div className="p-3.5 rounded-2xl bg-obsidian-900 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-fuchsia-300">Schema: {selectedTool.name}</span>
                <button onClick={() => setSelectedTool(null)} className="text-purple-300 hover:text-white">
                  ×
                </button>
              </div>
              <pre className="p-2.5 rounded-xl bg-obsidian-950 text-[10px] text-purple-200/90 overflow-x-auto max-h-40 overflow-y-auto border border-purple-500/20">
                {JSON.stringify(selectedTool.inputSchema, null, 2)}
              </pre>
            </div>
          )}

          {/* Real-time execution logs */}
          <div>
            <div className="text-[11px] text-purple-200/80 font-semibold mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-fuchsia-400" />
              Live Activity:
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto p-2.5 rounded-2xl bg-obsidian-900 border border-purple-500/20">
              {logs.length === 0 ? (
                <div className="text-[11px] text-purple-300/50 p-2">
                  Awaiting tool execution...
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-1.5 rounded-xl bg-obsidian-950 text-[10px] text-purple-200/90 flex items-start gap-2 border border-purple-500/10"
                  >
                    <span className="text-purple-400/60">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="text-emerald-400 font-bold">{log.toolName ? `${log.toolName}()` : log.type}</span>
                    <span className="text-purple-200/70 truncate">{JSON.stringify(log.payload)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
