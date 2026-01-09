import { useState } from 'react';
import { processPrompt, PromptUsage } from '../lib/supabase';
import { ModelSelector } from './ModelSelector';
import {
  AI_MODELS,
  DEFAULT_MODEL_ID,
  getModelById,
  estimateTokens,
  estimateCost,
  getMinimumBalance
} from '../lib/models';

interface PromptWallProps {
  address: string;
  creditBalance: number;
  onTopUp: () => void;
  onBalanceChange: () => void;
}

export function PromptWall({ address, creditBalance, onTopUp, onBalanceChange }: PromptWallProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [lastUsage, setLastUsage] = useState<PromptUsage | null>(null);
  const [lastCost, setLastCost] = useState<number | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const model = getModelById(selectedModel) || AI_MODELS[0];
  const minBalance = getMinimumBalance(selectedModel);
  const hasEnoughCredits = creditBalance >= minBalance;

  const estimatedInputTokens = estimateTokens(prompt);
  const estimatedOutputTokens = 500;
  const estimatedCost = prompt.length > 0
    ? estimateCost(selectedModel, estimatedInputTokens, estimatedOutputTokens)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (!hasEnoughCredits) {
      setError('Insufficient credits. Please top up your balance.');
      return;
    }

    setLoading(true);
    setError('');
    setLastUsage(null);
    setLastCost(null);
    setIsFallback(false);

    try {
      const result = await processPrompt(address, prompt, selectedModel);

      if (!result.success) {
        throw new Error(result.error || 'Failed to process prompt');
      }

      setResponse(result.response || 'No response received from AI');
      setLastUsage(result.usage || null);
      setLastCost(result.cost || null);
      setIsFallback(result.isFallback || false);
      setPrompt('');
      onBalanceChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process prompt');
    } finally {
      setLoading(false);
    }
  }

  const formatCost = (cost: number) => {
    if (cost < 0.0001) return '<0.0001';
    if (cost < 0.01) return cost.toFixed(4);
    return cost.toFixed(4);
  };

  return (
    <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">AI Prompt</h2>
          <span className="text-sm text-slate-400">
            Pay per token usage
          </span>
        </div>

        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>

      <div className="p-6">
        {!hasEnoughCredits && (
          <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-orange-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-orange-200 font-medium">Insufficient Credits</p>
                <p className="text-sm text-orange-300/70 mt-1">
                  You need at least {formatCost(minBalance)} MNEE for {model.name}. Current balance: {creditBalance.toFixed(4)} MNEE
                </p>
                <button
                  onClick={onTopUp}
                  className="mt-3 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
                >
                  Top Up MNEE
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={4}
              disabled={!hasEnoughCredits || loading}
              className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {prompt.length > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>~{estimatedInputTokens} input tokens</span>
              <span>
                Estimated cost: <span className="text-emerald-400 font-medium">{formatCost(estimatedCost)} MNEE</span>
              </span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={!hasEnoughCredits || loading || !prompt.trim()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Processing with {model.name}...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Submit Prompt
              </>
            )}
          </button>
        </form>

        {response && (
          <div className="mt-6 p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-emerald-400">AI Response</span>
                {isFallback && (
                  <div className="group relative">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-help">
                      Fallback Active
                    </span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-max">
                      Generated by Llama 3.3 (Dev Failover)
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-700" />
                    </div>
                  </div>
                )}
              </div>
              {lastUsage && lastCost !== null && (
                <div className="text-xs text-slate-400">
                  <span className="text-emerald-400">{lastUsage.inputTokens}</span> in /
                  <span className="text-orange-400"> {lastUsage.outputTokens}</span> out =
                  <span className="text-white font-medium"> {formatCost(lastCost)} MNEE</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{response}</p>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-slate-700/20 border border-slate-600/20">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Pricing Info</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Input:</span>
              <span className="text-emerald-400 ml-1">${model.inputPricePerMillion.toFixed(2)}/1M tokens</span>
            </div>
            <div>
              <span className="text-slate-500">Output:</span>
              <span className="text-orange-400 ml-1">${model.outputPricePerMillion.toFixed(2)}/1M tokens</span>
            </div>
            <div>
              <span className="text-slate-500">Platform fee:</span>
              <span className="text-slate-300 ml-1">20%</span>
            </div>
            <div>
              <span className="text-slate-500">Context:</span>
              <span className="text-slate-300 ml-1">{(model.contextWindow / 1000).toFixed(0)}K tokens</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
