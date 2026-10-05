import React, { useState } from 'react';
import { Mic, Send, Sparkles, ChevronDown, ChevronUp, Bot, Terminal, Volume2 } from 'lucide-react';
import { AlexaAgentResponse } from '../types';

interface AlexaVoiceBarProps {
  onSendQuery: (query: string) => Promise<AlexaAgentResponse | void>;
  isLoading: boolean;
  latestResponse: AlexaAgentResponse | null;
}

const PRESET_PROMPTS = [
  'Alexa, what should I work on next?',
  'Move my CS assignment to tomorrow',
  'Analyze my workload for today',
  'Schedule a focus block for AWS Bedrock'
];

export const AlexaVoiceBar: React.FC<AlexaVoiceBarProps> = ({
  onSendQuery,
  isLoading,
  latestResponse
}) => {
  const [input, setInput] = useState('');
  const [showReasoning, setShowReasoning] = useState(true);
  const [selectedToolIndex, setSelectedToolIndex] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendQuery(input.trim());
    setInput('');
  };

  const handlePresetClick = (preset: string) => {
    if (isLoading) return;
    onSendQuery(preset);
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-4 lg:p-6 border border-slate-800 shadow-glass mb-6">
      {/* Voice prompt header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-alexa-indigo/20 border border-alexa-indigo/40 flex items-center justify-center text-alexa-purple">
            <Mic className="w-4 h-4 animate-pulse text-alexa-cyan" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              Alexa+ Voice & Intent Simulator
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-alexa-cyan/15 text-alexa-cyan border border-alexa-cyan/30">
                Interactive
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Speak or submit goals to trigger the situational intelligence layer.
            </p>
          </div>
        </div>

        {/* Audio Waveform Animation when active */}
        {isLoading && (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-alexa-violet/20 border border-alexa-violet/40">
            <span className="text-xs text-alexa-purple font-mono mr-1">Alexa Reasoning</span>
            <div className="flex items-center gap-0.5 h-4">
              <span className="w-1 h-3 bg-alexa-cyan rounded-full animate-wave-1"></span>
              <span className="w-1 h-4 bg-alexa-purple rounded-full animate-wave-2"></span>
              <span className="w-1 h-2 bg-indigo-400 rounded-full animate-wave-3"></span>
              <span className="w-1 h-4 bg-alexa-cyan rounded-full animate-wave-4"></span>
              <span className="w-1 h-3 bg-alexa-purple rounded-full animate-wave-5"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="relative mb-3">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask Alexa: "What should I work on next?" or "Move my assignment to tomorrow"'
            disabled={isLoading}
            className="w-full bg-obsidian-950/80 border border-slate-700/80 focus:border-alexa-purple focus:ring-2 focus:ring-alexa-violet/20 rounded-xl px-4 py-3 pl-11 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
          />
          <Mic className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-alexa-indigo hover:bg-alexa-purple text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1 shadow-sm"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* Quick Scenario Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-alexa-purple" />
          Demo Scenarios:
        </span>
        {PRESET_PROMPTS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePresetClick(preset)}
            disabled={isLoading}
            className="text-xs px-2.5 py-1 rounded-lg bg-obsidian-850 hover:bg-obsidian-700 border border-slate-700/60 hover:border-alexa-purple/50 text-slate-300 hover:text-white transition-all duration-150 disabled:opacity-50"
          >
            "{preset}"
          </button>
        ))}
      </div>

      {/* Live Response Panel */}
      {latestResponse && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
          {/* Alexa Voice Output Speech Bubble */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-alexa-indigo/15 via-alexa-purple/15 to-transparent border border-alexa-purple/30 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-alexa-purple/30 border border-alexa-purple/50 flex items-center justify-center text-alexa-cyan shrink-0 mt-0.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-alexa-purple uppercase tracking-wider">
                  Alexa Voice Output
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Intent: {latestResponse.intent}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-100 leading-relaxed">
                "{latestResponse.speechResponse}"
              </p>
            </div>
          </div>

          {/* Reasoning Chain and Executed Tools Collapsible */}
          <div className="rounded-xl bg-obsidian-950/70 border border-slate-800/80 overflow-hidden">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800/30 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-alexa-cyan" />
                <span>Agent Decision & Multi-Tool Execution Waterfall ({latestResponse.toolsExecuted.length} tools)</span>
              </span>
              {showReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showReasoning && (
              <div className="px-4 pb-3.5 pt-1 space-y-2 border-t border-slate-800/60">
                {/* Reasoning steps */}
                <div className="space-y-1">
                  {latestResponse.reasoningChain.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-mono text-slate-300">
                      <span className="text-alexa-cyan font-bold">{idx + 1}.</span>
                      <span className="leading-snug">{step}</span>
                    </div>
                  ))}
                </div>

                {/* Tools executed pills */}
                {latestResponse.toolsExecuted.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800/60">
                    <div className="text-[11px] font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Terminal className="w-3 h-3 text-alexa-purple" />
                      Executed MCP Tools (Streamable HTTP):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {latestResponse.toolsExecuted.map((call, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedToolIndex(selectedToolIndex === idx ? null : idx)}
                          className={`text-xs font-mono px-2 py-1 rounded-md border transition-all ${
                            selectedToolIndex === idx
                              ? 'bg-alexa-purple/30 border-alexa-purple text-white shadow-sm'
                              : 'bg-obsidian-850 border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {call.tool}()
                        </button>
                      ))}
                    </div>

                    {/* Tool details popup/drawer */}
                    {selectedToolIndex !== null && latestResponse.toolsExecuted[selectedToolIndex] && (
                      <div className="mt-2 p-2.5 rounded-lg bg-obsidian-900 border border-slate-700/80 font-mono text-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="font-semibold text-alexa-cyan">
                            Tool: {latestResponse.toolsExecuted[selectedToolIndex].tool}
                          </span>
                          <button
                            onClick={() => setSelectedToolIndex(null)}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            ×
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-300 mb-1">
                          <strong>Inputs:</strong>
                          <pre className="bg-obsidian-950 p-1.5 rounded overflow-x-auto text-[10px] text-slate-400 mt-0.5">
                            {JSON.stringify(latestResponse.toolsExecuted[selectedToolIndex].input, null, 2)}
                          </pre>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <strong>Output:</strong>
                          <pre className="bg-obsidian-950 p-1.5 rounded overflow-x-auto text-[10px] text-emerald-400 mt-0.5 max-h-36 overflow-y-auto">
                            {JSON.stringify(latestResponse.toolsExecuted[selectedToolIndex].output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
