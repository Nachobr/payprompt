// AI Prompt Processing Edge Function
// Supports multiple AI providers with token-based pricing

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// API Keys for different providers
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const XAI_API_KEY = Deno.env.get("XAI_API_KEY");

// Model configurations with real pricing (USD per 1M tokens)
const MODEL_CONFIGS: Record<string, {
  provider: 'groq' | 'google' | 'anthropic' | 'xai';
  modelId: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  maxTokens: number;
}> = {
  'groq-llama-70b': {
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    inputPricePerMillion: 0.59,
    outputPricePerMillion: 0.79,
    maxTokens: 8192,
  },
  'groq-llama-8b': {
    provider: 'groq',
    modelId: 'llama-3.1-8b-instant',
    inputPricePerMillion: 0.05,
    outputPricePerMillion: 0.08,
    maxTokens: 8192,
  },
  'gemini-2.5-pro': {
    provider: 'google',
    modelId: 'gemini-2.5-pro',
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 10.00,
    maxTokens: 8192,
  },
  'gemini-2.5-flash': {
    provider: 'google',
    modelId: 'gemini-2.5-flash',
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
    maxTokens: 8192,
  },
  'gemini-3-pro': {
    provider: 'google',
    modelId: 'gemini-3-pro-preview',
    inputPricePerMillion: 2.00,
    outputPricePerMillion: 12.00,
    maxTokens: 8192,
  },
  'claude-sonnet-4': {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    maxTokens: 8192,
  },
  'claude-opus-4': {
    provider: 'anthropic',
    modelId: 'claude-opus-4-20250514',
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
    maxTokens: 8192,
  },
  'claude-haiku-3.5': {
    provider: 'anthropic',
    modelId: 'claude-3-5-haiku-20241022',
    inputPricePerMillion: 0.80,
    outputPricePerMillion: 4.00,
    maxTokens: 8192,
  },
  'grok-4': {
    provider: 'xai',
    modelId: 'grok-4',
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    maxTokens: 16384,
  },
  'grok-3-fast': {
    provider: 'xai',
    modelId: 'grok-3-fast',
    inputPricePerMillion: 0.20,
    outputPricePerMillion: 0.50,
    maxTokens: 16384,
  },
};

const DEFAULT_MODEL_ID = 'groq-llama-70b';
const PLATFORM_MARGIN = 1.2; // 20% platform fee

// DEVELOPMENT MODE: Use Groq for all requests (only provider with free API key)
// Set to false in production when you have API keys for all providers
const DEV_MODE_USE_GROQ_FALLBACK = true;

// Calculate cost based on actual token usage
function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const config = MODEL_CONFIGS[modelId];
  if (!config) return 0;

  const inputCost = (inputTokens / 1_000_000) * config.inputPricePerMillion;
  const outputCost = (outputTokens / 1_000_000) * config.outputPricePerMillion;

  return (inputCost + outputCost) * PLATFORM_MARGIN;
}

// Estimate minimum cost for balance check (100 input + 500 output tokens)
function estimateMinCost(modelId: string): number {
  return calculateCost(modelId, 100, 500);
}

// Provider-specific API calls
async function callGroq(
  modelId: string,
  prompt: string,
  maxTokens: number
): Promise<{ response: string; inputTokens: number; outputTokens: number }> {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens
    })
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await resp.json();
  return {
    response: data.choices?.[0]?.message?.content || "No response",
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0
  };
}

async function callGoogle(
  modelId: string,
  prompt: string,
  maxTokens: number
): Promise<{ response: string; inputTokens: number; outputTokens: number }> {
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not configured");

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens }
      })
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Google API error: ${err}`);
  }

  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  return {
    response: text,
    inputTokens: data.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
    outputTokens: data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4)
  };
}

async function callAnthropic(
  modelId: string,
  prompt: string,
  maxTokens: number
): Promise<{ response: string; inputTokens: number; outputTokens: number }> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic API error: ${err}`);
  }

  const data = await resp.json();
  const text = data.content?.[0]?.text || "No response";
  return {
    response: text,
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0
  };
}

async function callXai(
  modelId: string,
  prompt: string,
  maxTokens: number
): Promise<{ response: string; inputTokens: number; outputTokens: number }> {
  if (!XAI_API_KEY) throw new Error("XAI_API_KEY not configured");

  const resp = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens
    })
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`xAI API error: ${err}`);
  }

  const data = await resp.json();
  return {
    response: data.choices?.[0]?.message?.content || "No response",
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0
  };
}

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { walletAddress, prompt, sessionId, modelId: requestedModelId } = await req.json();

    // Determine which model to use for billing (the user's choice)
    const billingModelId = requestedModelId || DEFAULT_MODEL_ID;
    const billingModelConfig = MODEL_CONFIGS[billingModelId];

    if (!billingModelConfig) {
      throw new Error(`Unknown model: ${billingModelId}`);
    }

    // Determine which model to actually execute (fallback logic)
    let executionModelId = billingModelId;
    let isFallback = false;

    if (DEV_MODE_USE_GROQ_FALLBACK && billingModelConfig.provider !== 'groq') {
      console.log(`Development specific fallback: Swapping ${billingModelId} for ${DEFAULT_MODEL_ID}`);
      executionModelId = DEFAULT_MODEL_ID;
      isFallback = true;
    }

    // Config for the model that actually runs
    const executionModelConfig = MODEL_CONFIGS[executionModelId];

    console.log(`Processing prompt for ${walletAddress}. Billing Model: ${billingModelId}, Execution Model: ${executionModelId}, Session: ${sessionId}`);

    if (!walletAddress || !prompt) {
      throw new Error("Missing wallet address or prompt");
    }

    const address = walletAddress.toLowerCase();

    // Verify session if provided
    if (sessionId) {
      console.log(`Verifying session ${sessionId} for ${address}`);
      const sessionResp = await fetch(
        `${SUPABASE_URL}/rest/v1/sessions?id=eq.${sessionId}&wallet_address=eq.${address}&select=*`,
        {
          headers: {
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
            "apikey": SERVICE_ROLE_KEY,
          }
        }
      );

      if (sessionResp.ok) {
        const sessions = await sessionResp.json();
        if (!sessions || sessions.length === 0) {
          throw new Error("Invalid session (not found in database)");
        }
        const session = sessions[0];
        if (new Date(session.expires_at) < new Date()) {
          throw new Error("Session expired");
        }
      }
    }

    // Check balance (estimate minimum using BILLING model costs)
    const minBalance = estimateMinCost(billingModelId);
    console.log(`Checking balance for ${address}. Min needed: ${minBalance.toFixed(6)} MNEE`);

    const profileResp = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?wallet_address=eq.${address}&select=total_credits_mnee`,
      {
        headers: {
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          "apikey": SERVICE_ROLE_KEY,
        }
      }
    );
    const profiles = await profileResp.json();

    if (!profiles || profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const balance = parseFloat(profiles[0].total_credits_mnee);
    console.log(`Balance: ${balance} MNEE`);

    if (balance < minBalance) {
      throw new Error(`Insufficient balance. Need at least ${minBalance.toFixed(6)} MNEE, have ${balance.toFixed(6)}`);
    }

    // Call the appropriate AI provider using executionModelConfig
    let aiResult: { response: string; inputTokens: number; outputTokens: number };

    switch (executionModelConfig.provider) {
      case 'groq':
        aiResult = await callGroq(executionModelConfig.modelId, prompt, executionModelConfig.maxTokens);
        break;
      case 'google':
        aiResult = await callGoogle(executionModelConfig.modelId, prompt, executionModelConfig.maxTokens);
        break;
      case 'anthropic':
        aiResult = await callAnthropic(executionModelConfig.modelId, prompt, executionModelConfig.maxTokens);
        break;
      case 'xai':
        aiResult = await callXai(executionModelConfig.modelId, prompt, executionModelConfig.maxTokens);
        break;
      default:
        throw new Error(`Provider ${executionModelConfig.provider} not supported`);
    }

    console.log(`Response received. Input: ${aiResult.inputTokens} tokens, Output: ${aiResult.outputTokens} tokens`);

    // Calculate actual cost based on token usage but BILLING model pricing
    // We use the tokens generated by the fallback model, but charge the price of the requested model
    const actualCost = calculateCost(billingModelId, aiResult.inputTokens, aiResult.outputTokens);
    console.log(`Actual cost (based on ${billingModelId}): ${actualCost.toFixed(6)} MNEE`);

    // Verify balance covers actual cost
    if (balance < actualCost) {
      throw new Error(`Insufficient balance for response. Cost: ${actualCost.toFixed(6)} MNEE, Balance: ${balance.toFixed(6)}`);
    }

    // Deduct credits using RPC
    console.log("Deducting credits...");
    const deductResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/deduct_credits`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "apikey": SERVICE_ROLE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        p_wallet_address: address,
        p_amount: actualCost
      })
    });

    const deductResult = await deductResp.json();

    if (!deductResult.success) {
      console.error(`Deduction failed: ${deductResult.error}`);
      throw new Error(deductResult.error || "Failed to deduct credits");
    }
    console.log("Credits deducted successfully");

    return new Response(JSON.stringify({
      success: true,
      response: aiResult.response,
      newBalance: deductResult.new_balance,
      cost: actualCost,
      usage: {
        inputTokens: aiResult.inputTokens,
        outputTokens: aiResult.outputTokens,
        model: billingModelId // Report the billing model to frontend
      },
      isFallback, // Flag for UI to show tooltip
      executionModel: executionModelId // Inform UI what actually ran
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error(`Function Error: ${error.message}`);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
