import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  wallet_address: string;
  username: string | null;
  total_credits_mnee: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  wallet_address: string;
  type: 'deposit' | 'deduction';
  amount: number;
  tx_hash: string | null;
  created_at: string;
}

export interface Session {
  sessionId: string;
  address: string;
  expiresAt: string;
}

// Session storage
let currentSession: Session | null = null;

export function getSession(): Session | null {
  if (currentSession) return currentSession;
  const stored = localStorage.getItem('ppp_session');
  if (stored) {
    try {
      const session = JSON.parse(stored);
      if (new Date(session.expiresAt) > new Date()) {
        currentSession = session;
        return session;
      }
      localStorage.removeItem('ppp_session');
    } catch (e) {
      localStorage.removeItem('ppp_session');
    }
  }
  return null;
}

export function setSession(session: Session | null): void {
  currentSession = session;
  if (session) {
    localStorage.setItem('ppp_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('ppp_session');
  }
}

// Generate SIWE message (EIP-4361)
export function createSiweMessage(address: string, nonce: string, domain: string): string {
  const now = new Date();
  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return `${domain} wants you to sign in with your Ethereum account:
${address}

Sign in to Pay-Per-Prompt to access AI prompts with MNEE micropayments.

URI: ${window.location.origin}
Version: 1
Chain ID: 8453
Nonce: ${nonce}
Issued At: ${now.toISOString()}
Expiration Time: ${expiry.toISOString()}`;
}

// Generate random nonce
export function generateNonce(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Verify SIWE signature via edge function
export async function verifySiwe(message: string, signature: string, address: string): Promise<Session | null> {
  const response = await supabase.functions.invoke('verify-siwe', {
    body: { message, signature, address }
  });

  if (response.data?.success) {
    const session: Session = {
      sessionId: response.data.sessionId,
      address: response.data.address,
      expiresAt: response.data.expiresAt
    };
    setSession(session);
    return session;
  }

  const errorMsg = response.error?.message || response.data?.error || 'Unknown verification error';
  console.error('SIWE verification failed:', errorMsg);
  return null;
}

export async function getOrCreateProfile(walletAddress: string): Promise<Profile | null> {
  const address = walletAddress.toLowerCase();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', address)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  if (data) return data;

  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({ wallet_address: address, total_credits_mnee: 0 })
    .select()
    .maybeSingle();

  if (insertError) {
    console.error('Error creating profile:', insertError);
    return null;
  }

  return newProfile;
}

export async function getTransactions(walletAddress: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
}

export interface PromptUsage {
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface ProcessPromptResult {
  success: boolean;
  response?: string;
  newBalance?: number;
  cost?: number;
  usage?: PromptUsage;
  isFallback?: boolean;
  executionModel?: string;
  error?: string;
}

// Process prompt via edge function (handles credits + AI)
export async function processPrompt(
  walletAddress: string,
  prompt: string,
  modelId?: string
): Promise<ProcessPromptResult> {
  const session = getSession();

  const response = await supabase.functions.invoke('process-prompt', {
    body: {
      walletAddress,
      prompt,
      sessionId: session?.sessionId,
      modelId
    }
  });

  if (response.data?.success) {
    return {
      success: true,
      response: response.data.response,
      newBalance: response.data.newBalance,
      cost: response.data.cost,
      usage: response.data.usage,
      isFallback: response.data.isFallback,
      executionModel: response.data.executionModel
    };
  }

  return {
    success: false,
    error: response.data?.error || 'Failed to process prompt'
  };
}

export async function deductCredits(walletAddress: string, amount: number) {
  const { data, error } = await supabase.rpc('deduct_credits', {
    p_wallet_address: walletAddress.toLowerCase(),
    p_amount: amount,
  });

  if (error) {
    console.error('Error deducting credits:', error);
    return { success: false, error: error.message };
  }

  return data;
}

export async function processGaslessDeposit(
  owner: string,
  value: string,
  deadline: string,
  v: number,
  r: string,
  s: string
) {
  const response = await supabase.functions.invoke('gasless-relay', {
    body: {
      owner,
      value,
      deadline,
      v,
      r,
      s,
      walletAddress: owner,
    },
  });

  return response.data;
}
