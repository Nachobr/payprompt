import { useState } from 'react';
import { deductCredits } from '../lib/supabase';

interface PromptWallProps {
  address: string;
  creditBalance: number;
  onTopUp: () => void;
  onBalanceChange: () => void;
}

const PRICE_PER_PROMPT = 0.10; // $0.10 MNEE per prompt

export function PromptWall({ address, creditBalance, onTopUp, onBalanceChange }: PromptWallProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasEnoughCredits = creditBalance >= PRICE_PER_PROMPT;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (!hasEnoughCredits) {
      setError('Insufficient credits. Please top up your balance.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Deduct credits first
      const result = await deductCredits(address, PRICE_PER_PROMPT);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to deduct credits');
      }

      // Simulate AI response (in production, call actual AI API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResponse(`This is a simulated AI response to: "${prompt}"\n\nIn production, this would connect to your AI backend. The prompt cost ${PRICE_PER_PROMPT} MNEE.`);
      
      setPrompt('');
      onBalanceChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process prompt');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">AI Prompt</h2>
          <span className="text-sm text-slate-400">
            Cost: <span className="text-emerald-400 font-medium">{PRICE_PER_PROMPT} MNEE</span> per prompt
          </span>
        </div>
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
                  You need at least {PRICE_PER_PROMPT} MNEE to submit a prompt. Current balance: {creditBalance.toFixed(4)} MNEE
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
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Submit Prompt ({PRICE_PER_PROMPT} MNEE)
              </>
            )}
          </button>
        </form>

        {response && (
          <div className="mt-6 p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-emerald-400">AI Response</span>
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}
