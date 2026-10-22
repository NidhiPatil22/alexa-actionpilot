import React, { useState } from 'react';
import { Mic, Send, Sparkles, ChevronDown, ChevronUp, Bot, Terminal, Volume2, Radio } from 'lucide-react';
import { AlexaAgentResponse } from '../types';

interface AlexaVoiceBarProps {
  onSendQuery: (query: string) => Promise<AlexaAgentResponse | void>;
  isLoading: boolean;
  latestResponse: AlexaAgentResponse | null;
}

const PRESET_PROMPTS = [
  'What should I work on next?',
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
  const [showReasoning, setShowReasoning] = useState(false);
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
    <div className="w-full relative rounded-3xl p-6 sm:p-8 border border-purple-500/20 bg-gradient-to-b from-obsidian-850/80 via-obsidian-900/90 to-obsidian-950/95 backdrop-blur-2xl shadow-glass mb-8 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[300px] bg-gradient-to-r from-purple-600/15 via-fuchsia-600/20 to-violet-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Minimal Alexa heading */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white via-purple-100 to-fuchsia-200 bg-clip-text text-transparent mb-1.5">
          How can I help?
        </h2>
        <p className="text-xs text-purple-200/60 max-w-md font-normal mb-6">
          Ask anything or select a suggestion below.
        </p>

        {/* Futuristic Glowing AI Voice Orb */}
        <div className="relative my-2 flex items-center justify-center">
          {/* Outer concentric pulsing ring */}
          <div className="absolute w-44 h-44 rounded-full border border-purple-500/20 animate-ring-pulse pointer-events-none"></div>

          {/* Central AI Orb */}
          <button
            type="button"
            onClick={() => handlePresetClick(PRESET_PROMPTS[0])}
            disabled={isLoading}
            aria-label="Activate voice assistant"
            className="group relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 shadow-glow-orb animate-orb-breathe transition-transform duration-300 active:scale-95 cursor-pointer focus:outline-none"
          >
            <div className="absolute inset-1.5 rounded-full bg-gradient-to-b from-white/20 via-transparent to-black/40 pointer-events-none"></div>

            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-obsidian-950/85 backdrop-blur-md flex flex-col items-center justify-center border border-white/20 group-hover:border-fuchsia-300/60 transition-colors">
              {isLoading ? (
                <div className="flex items-center gap-1 h-6">
                  <span className="w-1 h-3 bg-fuchsia-400 rounded-full animate-wave-1"></span>
                  <span className="w-1 h-5 bg-purple-300 rounded-full animate-wave-2"></span>
                  <span className="w-1 h-3 bg-violet-400 rounded-full animate-wave-3"></span>
                  <span className="w-1 h-6 bg-fuchsia-300 rounded-full animate-wave-4"></span>
                  <span className="w-1 h-4 bg-purple-400 rounded-full animate-wave-5"></span>
                </div>
              ) : (
                <Mic className="w-7 h-7 text-white drop-shadow-[0_0_12px_rgba(217,70,239,0.8)] group-hover:scale-110 transition-transform duration-300" />
              )}
            </div>
          </button>
        </div>

        {/* State Indicator */}
        <div className="flex items-center gap-2 mt-2 mb-5">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLoading ? 'bg-fuchsia-400' : 'bg-emerald-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLoading ? 'bg-fuchsia-500' : 'bg-emerald-400'}`}></span>
          </span>
          <span className="text-[11px] font-mono text-purple-200/70 tracking-wider uppercase">
            {isLoading ? 'Thinking...' : 'Listening'}
          </span>
        </div>

        {/* Floating Voice Input Pill (AI Command Bar) */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl mb-4">
          <div className="relative flex items-center rounded-full glass-input p-1 focus-within:border-fuchsia-400/80 focus-within:ring-2 focus-within:ring-purple-500/30 transition-all duration-300 shadow-glass">
            <div className="pl-3.5 text-purple-300 flex items-center">
              <Mic className="w-4 h-4 text-purple-300/70" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Alexa anything..."
              disabled={isLoading}
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-purple-300/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-purple transition-all duration-200 flex items-center gap-1.5 shrink-0 active:scale-95 border border-fuchsia-400/30"
            >
              <span>Ask</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>

        {/* Minimal Suggestions */}
        <div className="w-full max-w-2xl flex flex-wrap items-center justify-center gap-2">
          {PRESET_PROMPTS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset)}
              disabled={isLoading}
              className="text-xs px-3.5 py-1 rounded-full bg-obsidian-850/80 hover:bg-purple-950/40 border border-purple-500/20 hover:border-fuchsia-400/50 text-purple-200/80 hover:text-white transition-all duration-200 disabled:opacity-50 active:scale-95"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Live Response Panel */}
      {latestResponse && (
        <div className="mt-6 pt-5 border-t border-purple-500/20 space-y-3">
          {/* Alexa Voice Output Speech Bubble */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 to-fuchsia-950/40 border border-fuchsia-500/30 shadow-glow-purple/30 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white shrink-0 mt-0.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-slate-100 leading-relaxed">
                "{latestResponse.speechResponse}"
              </p>
            </div>
          </div>

          {/* Reasoning Chain Collapsible */}
          <div className="rounded-2xl bg-obsidian-950/70 border border-purple-500/20 overflow-hidden">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono text-purple-200/80 hover:text-white hover:bg-purple-900/10 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Reasoning & Tools ({latestResponse.toolsExecuted.length})</span>
              </span>
              {showReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showReasoning && (
              <div className="px-4 pb-3.5 pt-1 space-y-2.5 border-t border-purple-500/20 text-left">
                <div className="space-y-1">
                  {latestResponse.reasoningChain.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-mono text-purple-100/80">
                      <span className="text-fuchsia-400 font-bold">{idx + 1}.</span>
                      <span className="leading-snug">{step}</span>
                    </div>
                  ))}
                </div>

                {latestResponse.toolsExecuted.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-purple-500/20 flex flex-wrap gap-1.5">
                    {latestResponse.toolsExecuted.map((call, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedToolIndex(selectedToolIndex === idx ? null : idx)}
                        className={`text-xs font-mono px-2.5 py-1 rounded-full border transition-all ${
                          selectedToolIndex === idx
                            ? 'bg-fuchsia-500/25 border-fuchsia-400 text-white'
                            : 'bg-obsidian-850 border-purple-500/30 text-purple-200 hover:border-purple-400'
                        }`}
                      >
                        {call.tool}()
                      </button>
                    ))}

                    {selectedToolIndex !== null && latestResponse.toolsExecuted[selectedToolIndex] && (
                      <div className="w-full mt-2 p-2.5 rounded-xl bg-obsidian-900 border border-purple-500/30 font-mono text-xs">
                        <div className="flex items-center justify-between text-purple-200 mb-1">
                          <span className="font-semibold text-fuchsia-400">
                            {latestResponse.toolsExecuted[selectedToolIndex].tool}
                          </span>
                          <button
                            onClick={() => setSelectedToolIndex(null)}
                            className="text-purple-300 hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                        <pre className="bg-obsidian-950 p-2 rounded-lg overflow-x-auto text-[10px] text-emerald-400 border border-purple-500/20 max-h-32 overflow-y-auto">
                          {JSON.stringify(latestResponse.toolsExecuted[selectedToolIndex].output, null, 2)}
                        </pre>
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
