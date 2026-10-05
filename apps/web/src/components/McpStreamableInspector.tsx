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
    <div className="glass-panel rounded-2xl border border-slate-800 shadow-glass overflow-hidden mb-6">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              MCP Protocol Inspector (Streamable HTTP 2025-11-25)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live JSON-RPC 2.0 stream & 13 Remote MCP Tool definitions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs font-mono">{registeredTools.length} Tools Ready</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded view */}
      {isOpen && (
        <div className="p-5 border-t border-slate-800/80 bg-obsidian-950/70 space-y-4 font-mono text-xs">
          {/* Remote Endpoint Info */}
          <div className="p-3 rounded-xl bg-obsidian-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-slate-400 text-[11px]">Streamable HTTP Remote Endpoint:</span>
              <div className="text-alexa-cyan font-bold text-xs mt-0.5">
                POST http://localhost:3001/mcp
              </div>
            </div>
            <button
              onClick={handleCopyEndpoint}
              className="px-2.5 py-1 rounded bg-obsidian-800 hover:bg-obsidian-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] border border-slate-700 self-start sm:self-center"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>

          {/* Registered Tools grid */}
          <div>
            <div className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-alexa-purple" />
              Registered MCP Tools:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {registeredTools.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTool(t)}
                  className={`p-2 rounded-lg text-left border text-[11px] truncate transition-all ${
                    selectedTool?.name === t.name
                      ? 'bg-alexa-purple/20 border-alexa-purple text-white shadow-sm'
                      : 'bg-obsidian-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold truncate">{t.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">tool</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tool schema viewer */}
          {selectedTool && (
            <div className="p-3 rounded-xl bg-obsidian-900 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-alexa-cyan">Tool Schema: {selectedTool.name}</span>
                <button onClick={() => setSelectedTool(null)} className="text-slate-500 hover:text-slate-300">
                  ×
                </button>
              </div>
              <p className="text-[11px] text-slate-300 mb-2 font-sans">{selectedTool.description}</p>
              <pre className="p-2 rounded bg-obsidian-950 text-[10px] text-slate-400 overflow-x-auto max-h-48 overflow-y-auto">
                {JSON.stringify(selectedTool.inputSchema, null, 2)}
              </pre>
            </div>
          )}

          {/* Real-time execution logs */}
          <div>
            <div className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-alexa-cyan" />
              Live Streamable HTTP Activity:
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 rounded-xl bg-obsidian-900 border border-slate-800">
              {logs.length === 0 ? (
                <div className="text-[11px] text-slate-500 p-2">
                  Awaiting calls... Use the Alexa Voice bar or click "Test Reschedule" to trigger protocol events.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-1.5 rounded bg-obsidian-950 text-[10px] text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="text-emerald-400 font-bold">{log.toolName ? `${log.toolName}()` : log.type}</span>
                    <span className="text-slate-400 truncate">{JSON.stringify(log.payload)}</span>
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
