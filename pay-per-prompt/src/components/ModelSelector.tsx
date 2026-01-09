import { useState } from 'react';
import { AI_MODELS, ModelConfig, DEFAULT_MODEL_ID } from '../lib/models';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

const providerLogos: Record<string, string> = {
  groq: '⚡',
  google: '🔷',
  anthropic: '🟠',
  xai: '✖️',
};

const providerNames: Record<string, string> = {
  groq: 'Groq',
  google: 'Google',
  anthropic: 'Anthropic',
  xai: 'xAI',
};

const tierColors: Record<string, string> = {
  budget: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  standard: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS.find(m => m.id === DEFAULT_MODEL_ID)!;

  const groupedModels = AI_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, ModelConfig[]>);

  const formatPrice = (price: number) => {
    if (price < 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(0)}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:border-slate-500/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{providerLogos[selected.provider]}</span>
          <div className="text-left">
            <div className="text-sm font-medium text-white">{selected.name}</div>
            <div className="text-xs text-slate-400">
              {formatPrice(selected.inputPricePerMillion)}/{formatPrice(selected.outputPricePerMillion)} per 1M tokens
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${tierColors[selected.tier]}`}>
            {selected.tier}
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-2 py-2 rounded-xl bg-slate-800 border border-slate-700 shadow-xl max-h-96 overflow-y-auto">
            {Object.entries(groupedModels).map(([provider, models]) => (
              <div key={provider}>
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <span>{providerLogos[provider]}</span>
                  <span>{providerNames[provider]}</span>
                </div>
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors ${
                      model.id === selectedModel ? 'bg-slate-700/30' : ''
                    }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{model.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${tierColors[model.tier]}`}>
                          {model.tier}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{model.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-300">
                        <span className="text-emerald-400">{formatPrice(model.inputPricePerMillion)}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-orange-400">{formatPrice(model.outputPricePerMillion)}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">in/out per 1M</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
