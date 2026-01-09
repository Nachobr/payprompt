// AI Model Configuration with real-world token pricing (USD per 1M tokens)
// Prices converted to MNEE (1 MNEE ≈ $1 USD for simplicity)

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'groq' | 'google' | 'anthropic' | 'xai';
  modelId: string;
  inputPricePerMillion: number;  // USD per 1M input tokens
  outputPricePerMillion: number; // USD per 1M output tokens
  maxTokens: number;
  contextWindow: number;
  description: string;
  tier: 'budget' | 'standard' | 'premium';
}

export const AI_MODELS: ModelConfig[] = [
  // Groq (cheapest - uses open source models)
  {
    id: 'groq-llama-70b',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    inputPricePerMillion: 0.59,
    outputPricePerMillion: 0.79,
    maxTokens: 8192,
    contextWindow: 128000,
    description: 'Fast & affordable. Great for general tasks.',
    tier: 'budget',
  },
  {
    id: 'groq-llama-8b',
    name: 'Llama 3.1 8B',
    provider: 'groq',
    modelId: 'llama-3.1-8b-instant',
    inputPricePerMillion: 0.05,
    outputPricePerMillion: 0.08,
    maxTokens: 8192,
    contextWindow: 128000,
    description: 'Ultra-fast, ultra-cheap. Simple tasks.',
    tier: 'budget',
  },

  // Google Gemini
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    modelId: 'gemini-2.5-pro',
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 10.00,
    maxTokens: 8192,
    contextWindow: 1000000,
    description: 'Google\'s flagship. Excellent reasoning.',
    tier: 'standard',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    modelId: 'gemini-2.5-flash',
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
    maxTokens: 8192,
    contextWindow: 1000000,
    description: 'Fast Gemini variant. Good balance.',
    tier: 'budget',
  },
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: 'google',
    modelId: 'gemini-3-pro-preview',
    inputPricePerMillion: 2.00,
    outputPricePerMillion: 12.00,
    maxTokens: 8192,
    contextWindow: 1000000,
    description: 'Latest Gemini. State-of-the-art.',
    tier: 'premium',
  },

  // Anthropic Claude
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Balanced Claude. Great for coding.',
    tier: 'standard',
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    modelId: 'claude-opus-4-20250514',
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Most powerful Claude. Complex reasoning.',
    tier: 'premium',
  },
  {
    id: 'claude-haiku-3.5',
    name: 'Claude Haiku 3.5',
    provider: 'anthropic',
    modelId: 'claude-3-5-haiku-20241022',
    inputPricePerMillion: 0.80,
    outputPricePerMillion: 4.00,
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Fast & cheap Claude. Quick tasks.',
    tier: 'budget',
  },

  // xAI Grok
  {
    id: 'grok-4',
    name: 'Grok 4',
    provider: 'xai',
    modelId: 'grok-4',
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    maxTokens: 16384,
    contextWindow: 256000,
    description: 'xAI flagship. Strong reasoning & code.',
    tier: 'standard',
  },
  {
    id: 'grok-3-fast',
    name: 'Grok 3 Fast',
    provider: 'xai',
    modelId: 'grok-3-fast',
    inputPricePerMillion: 0.20,
    outputPricePerMillion: 0.50,
    maxTokens: 16384,
    contextWindow: 128000,
    description: 'Ultra cheap xAI model. Very fast.',
    tier: 'budget',
  },
];

export const DEFAULT_MODEL_ID = 'groq-llama-70b';

export function getModelById(id: string): ModelConfig | undefined {
  return AI_MODELS.find(m => m.id === id);
}

export function getModelsByProvider(provider: ModelConfig['provider']): ModelConfig[] {
  return AI_MODELS.filter(m => m.provider === provider);
}

export function getModelsByTier(tier: ModelConfig['tier']): ModelConfig[] {
  return AI_MODELS.filter(m => m.tier === tier);
}

// Estimate cost in MNEE based on input/output tokens
export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelById(modelId);
  if (!model) return 0;

  const inputCost = (inputTokens / 1_000_000) * model.inputPricePerMillion;
  const outputCost = (outputTokens / 1_000_000) * model.outputPricePerMillion;

  // Add 20% margin for the platform
  const platformMargin = 1.2;

  return (inputCost + outputCost) * platformMargin;
}

// Rough estimate of tokens from text (4 chars ≈ 1 token)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Get minimum balance needed for a model (rough estimate for ~500 output tokens)
export function getMinimumBalance(modelId: string): number {
  const model = getModelById(modelId);
  if (!model) return 0.01;

  // Estimate: 100 input tokens + 500 output tokens minimum
  const minCost = estimateCost(modelId, 100, 500);
  return Math.max(0.001, minCost);
}
